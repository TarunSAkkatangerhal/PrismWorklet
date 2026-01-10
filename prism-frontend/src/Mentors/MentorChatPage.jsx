import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import secureAPI from '../services/secureAPI';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import LeftSidebar from '../components/Left';

// Helper to format timestamps
const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// WebSocket connection hook
const useChatWebSocket = (onMessage) => {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No access token found');
        return;
      }

      const wsUrl = `ws://localhost:8000/api/messages/ws/${token}`;
      console.log('Connecting to WebSocket:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        const pingInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
        wsRef.current.pingInterval = pingInterval;
      };

      wsRef.current.onmessage = (event) => {
        console.log('📩 WebSocket message received:', event.data);
        const data = JSON.parse(event.data);
        if (data.type !== 'pong') {
          onMessage(data);
        }
      };

      wsRef.current.onclose = () => {
        console.log('❌ WebSocket disconnected');
        setIsConnected(false);
        if (wsRef.current?.pingInterval) {
          clearInterval(wsRef.current.pingInterval);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...');
          connect();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('⚠️ WebSocket error:', error);
        console.error('WebSocket state:', wsRef.current?.readyState);
      };
    } catch (error) {
      console.error('❌ Error connecting to WebSocket:', error);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        if (wsRef.current.pingInterval) {
          clearInterval(wsRef.current.pingInterval);
        }
        wsRef.current.close();
      }
    };
  }, []);

  const sendMessage = (message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return { isConnected, sendMessage };
};

// Message Bubble Component
const MessageBubble = ({ message, isOwnMessage }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {!isOwnMessage && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 ml-2">
            {message.sender_name} {message.sender_role && <span className="text-gray-500">({message.sender_role})</span>}
          </p>
        )}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isOwnMessage
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.message_text}</p>
        </div>
        <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isOwnMessage ? 'text-right mr-2' : 'ml-2'}`}>
          {formatTime(message.sent_at)}
        </p>
      </div>
    </motion.div>
  );
};

// Mentor Chat Page Component
export default function MentorChatPage() {
  useDocumentTitle('Messages - PRISM');
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (!isUserScrollingRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Track if user is scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      isUserScrollingRef.current = !isAtBottom;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        console.log('Fetching current user...');
        const userResponse = await secureAPI.get('/auth/me');
        console.log('User response:', userResponse.data);
        if (userResponse.data && userResponse.data.id) {
          console.log('Setting current user ID:', userResponse.data.id);
          setCurrentUserId(userResponse.data.id);
        } else {
          console.error('User data missing ID:', userResponse.data);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        console.error('Error response:', error.response?.data);
      }
    };
    fetchCurrentUser();
  }, []);

  // WebSocket message handler for worklet group messages
  const handleWebSocketMessage = (data) => {
    console.log('Received WebSocket message:', data);
    
    if (data.type === 'new_message') {
      const message = data.message;
      
      // If we're viewing this worklet, add message to the chat (check for duplicates)
      if (selectedUser && message.worklet_id === selectedUser.worklet_id) {
        setMessages((prev) => {
          // Check if message already exists (by ID or temp ID)
          const isDuplicate = prev.some(m => 
            m.message_id === message.id || 
            (m.sender_id === message.sender_id && 
             m.message_text === message.content &&
             Math.abs(new Date(m.sent_at) - new Date(message.created_at)) < 2000) // Within 2 seconds
          );
          
          if (isDuplicate) {
            console.log('Duplicate message detected, skipping WebSocket add');
            return prev;
          }
          
          const newMsg = {
            message_id: message.id,
            sender_id: message.sender_id,
            sender_name: message.sender_name,
            sender_role: message.sender_role,
            message_text: message.content,
            sent_at: message.created_at,
            is_read: false
          };
          
          return [...prev, newMsg];
        });
      }
      
      // Refresh conversations immediately to update last message and unread count
      fetchConversations();
    }
  };

  const { isConnected, sendMessage: sendWsMessage } = useChatWebSocket(handleWebSocketMessage);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      console.log('Fetching conversations...');
      const response = await secureAPI.get('/api/messages/conversations');
      console.log('Conversations response:', response.data);
      setRooms(response.data);
      
      if (response.data.length === 0) {
        console.log('No conversations found - user may not be associated with any worklets');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      console.error('Error details:', error.response?.data);
    }
  };
  
  const fetchRooms = fetchConversations;

  const fetchMessages = async (workletId, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      const response = await secureAPI.get(`/api/messages/chat/worklet/${workletId}?limit=100`);
      const transformedMessages = response.data.map(msg => ({
        message_id: msg.id,
        sender_id: msg.sender_id,
        sender_name: msg.sender_name,
        sender_role: msg.sender_role,
        message_text: msg.content,
        sent_at: msg.created_at,
        is_read: msg.is_read
      }));
      
      if (isInitialLoad) {
        // Initial load: set all messages
        setMessages(transformedMessages);
      } else {
        // Auto-refresh: merge with existing messages
        setMessages((prevMessages) => {
          // Remove temp messages and get existing real message IDs
          const realMessages = prevMessages.filter(m => !String(m.message_id).startsWith('temp-'));
          const existingIds = new Set(realMessages.map(m => m.message_id));
          const newMessages = transformedMessages.filter(m => !existingIds.has(m.message_id));
          
          if (newMessages.length > 0) {
            return [...realMessages, ...newMessages];
          }
          return realMessages.length === prevMessages.length ? prevMessages : realMessages;
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const [selectedUser, setSelectedUser] = useState(null);
  
  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setSelectedUser(room);
    fetchMessages(room.worklet_id, true); // Initial load
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    
    const tempMessage = {
      message_id: `temp-${Date.now()}`,
      sender_id: currentUserId,
      sender_name: 'You',
      message_text: messageText,
      sent_at: new Date().toISOString(),
      is_read: false
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      await secureAPI.post('/api/messages/send', {
        receiver_id: 0,
        content: messageText,
        worklet_id: selectedUser.worklet_id
      });
      
      // Let auto-refresh or WebSocket handle updating the message
      // Don't manually fetch to avoid race conditions
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter(m => m.message_id !== tempMessage.message_id));
    }
  };

  // Load rooms on mount
  useEffect(() => {
    if (currentUserId) {
      fetchRooms();
    }
  }, [currentUserId]);

  // Polling for conversation updates
  useEffect(() => {
    if (currentUserId) {
      const interval = setInterval(fetchRooms, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [currentUserId]);

  // Auto-refresh messages in active chat
  useEffect(() => {
    if (selectedUser && selectedUser.worklet_id) {
      const interval = setInterval(() => {
        fetchMessages(selectedUser.worklet_id);
      }, 3000); // Refresh messages every 3 seconds
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  // Filter and sort rooms by search (worklets)
  const filteredRooms = rooms
    .filter(room => 
      room.worklet_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.worklet_cert_id?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Prioritize rooms with messages
      if (a.last_message && !b.last_message) return -1;
      if (!a.last_message && b.last_message) return 1;
      
      // Then by unread count
      if (a.unread_count !== b.unread_count) {
        return b.unread_count - a.unread_count;
      }
      
      // Finally by last message time
      if (a.last_message_time && b.last_message_time) {
        return new Date(b.last_message_time) - new Date(a.last_message_time);
      }
      
      return 0;
    });

  // Debug: Log to console
  useEffect(() => {
    console.log('Worklet rooms loaded:', rooms);
    console.log('Current user ID:', currentUserId);
    console.log('Is WebSocket connected:', isConnected);
  }, [rooms, currentUserId, isConnected]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <LeftSidebar />
      
      <div className="flex-1 flex">
        {/* Chat List Sidebar */}
        <div className="w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageCircle className="w-7 h-7 text-blue-500" />
                My Messages
              </h1>
              {!isConnected && (
                <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                  Connecting...
                </span>
              )}
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students or worklets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Room List */}
          <div className="flex-1 overflow-y-auto">
            {filteredRooms.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <MessageCircle className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No conversations yet</p>
                <p className="text-sm mt-1">Start chatting with your students</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRooms.map((room) => (
                  <motion.div
                    key={room.user_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => handleSelectRoom(room)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedUser?.worklet_id === room.worklet_id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 truncate">
                          {room.worklet_cert_id}
                        </p>
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate mt-0.5">
                          {room.worklet_title || 'Worklet'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-0.5">
                          {room.member_count} members
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-2">
                        {room.last_message_time && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(room.last_message_time)}
                          </span>
                        )}
                        {room.unread_count > 0 && (
                          <div className="flex items-center justify-center bg-blue-500 text-white text-xs rounded-full min-w-[22px] h-[22px] px-1.5 font-semibold shadow-sm">
                            {room.unread_count}
                          </div>
                        )}
                      </div>
                    </div>
                    {room.last_message && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        <span className="font-medium">{room.last_sender_name}: </span>
                        {room.last_message}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {selectedUser?.worklet_cert_id}
                    </p>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedUser?.worklet_title || 'Worklet'}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedUser?.member_count} members
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedRoom(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
                {loading ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <MessageCircle className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p>No messages yet</p>
                    <p className="text-sm mt-1">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.message_id}
                      message={message}
                      isOwnMessage={message.sender_id === currentUserId}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg px-6 py-3 transition-colors flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <MessageCircle className="w-24 h-24 mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                <p className="text-sm">Choose a student from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
