import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Search, X, Users, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import secureAPI from '../services/secureAPI';
import chatService from '../services/chat';
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
  const onMessageRef = useRef(onMessage);

  // Keep onMessage callback up to date
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('No token found, cannot connect WebSocket');
        return;
      }

      const wsUrl = `ws://localhost:8000/api/chat/ws?token=${token}`;
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
        console.log('📨 WebSocket raw message:', event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type !== 'pong') {
            console.log('📨 WebSocket parsed message:', data);
            onMessageRef.current(data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('❌ WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        if (wsRef.current?.pingInterval) {
          clearInterval(wsRef.current.pingInterval);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect WebSocket...');
          connect();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
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

// Message Bubble Component - WhatsApp style
const MessageBubble = ({ message, isOwnMessage }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div className={`max-w-[65%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {!isOwnMessage && message.sender_name && (
          <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1 ml-2">
            {message.sender_name}
          </p>
        )}
        <div
          className={`rounded-lg px-3 py-2 shadow-sm ${
            isOwnMessage
              ? 'bg-[#DCF8C6] dark:bg-[#005C4B] text-gray-900 dark:text-white rounded-br-sm'
              : 'bg-white dark:bg-[#202C33] text-gray-900 dark:text-white rounded-bl-sm'
          }`}
        >
          <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words">{message.message_text}</p>
          <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[11px] text-gray-600 dark:text-gray-400">
              {formatTime(message.sent_at)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Student Chat Page Component
export default function StudentChatPage() {
  useDocumentTitle('Messages - PRISM');
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [groupChats, setGroupChats] = useState([]);
  const [showGroupProfile, setShowGroupProfile] = useState(false);
  const [groupProfile, setGroupProfile] = useState(null);
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
      
      // Only add if not already in messages (to avoid duplicates)
      if (selectedRoom && !selectedRoom.isGroup && message.room_id === selectedRoom.room_id) {
        setMessages((prev) => {
          const exists = prev.some(m => m.message_id === message.message_id);
          if (exists) return prev;
          return [...prev, message];
        });
        
        if (message.sender_id !== currentUserId) {
          secureAPI.patch(`/api/chat/messages/${message.message_id}/read`).catch(console.error);
        }
      }
      
      fetchRooms();
    } else if (data.type === 'new_group_message') {
      const message = data.data;
      
      // Only add if not already in messages (to avoid duplicates)
      if (selectedRoom?.isGroup && message.group_id === selectedRoom.group_id) {
        setMessages((prev) => {
          const exists = prev.some(m => m.message_id === message.group_message_id);
          if (exists) return prev;
          return [...prev, {
            message_id: message.group_message_id,
            room_id: message.group_id,
            sender_id: message.sender_id,
            sender_name: message.sender_name,
            message_text: message.message_text,
            sent_at: message.sent_at,
            is_read: true
          }];
        });
      }
      
      fetchGroupChats();
    }
  };

  const { isConnected, sendMessage: sendWsMessage } = useChatWebSocket(handleWebSocketMessage);

  // Fetch worklet conversations
  const fetchConversations = async () => {
    try {
      const response = await secureAPI.get('/api/chat/rooms');
      setRooms(response.data);
      
      if (response.data.length === 0) {
        console.log('No conversations found - user may not be associated with any worklets');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  // Fetch group chats
  const fetchGroupChats = async () => {
    try {
      const groups = await chatService.getGroupChats();
      setGroupChats(groups);
    } catch (error) {
      console.error('Error fetching group chats:', error);
    }
  };

  // Fetch group messages
  const fetchGroupMessages = async (groupId) => {
    try {
      setLoading(true);
      const msgs = await chatService.getGroupMessages(groupId, 100);
      setMessages(msgs);
    } catch (error) {
      console.error('Error fetching group messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // View group profile
  const handleViewGroupProfile = async (groupId) => {
    try {
      const profile = await chatService.getGroupProfile(groupId);
      setGroupProfile(profile);
      setShowGroupProfile(true);
    } catch (error) {
      console.error('Error fetching group profile:', error);
    }
  };

  // Fetch messages for a worklet
  const fetchMessages = async (workletId, isInitialLoad = false) => {
    try {
      setLoading(true);
      const response = await secureAPI.get(`/api/chat/rooms/${roomId}/messages?limit=100`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  // Select a worklet conversation
  const [selectedUser, setSelectedUser] = useState(null);
  
  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    if (room.isGroup) {
      fetchGroupMessages(room.group_id);
    } else {
      fetchMessages(room.room_id);
    }
  };

  // Send a message to worklet
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) {
      console.log('Cannot send: empty message or no room selected');
      return;
    }

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    console.log('Sending message:', messageText);
    console.log('Selected room:', selectedRoom);
    
    // Optimistic update - add message immediately
    const optimisticMessage = {
      message_id: tempId,
      room_id: selectedRoom.isGroup ? selectedRoom.group_id : selectedRoom.room_id,
      sender_id: currentUserId,
      sender_name: 'You',
      message_text: messageText,
      sent_at: new Date().toISOString(),
      is_read: false,
      sending: true
    };
    
    console.log('Adding optimistic message:', optimisticMessage);
    setMessages((prev) => {
      const newMessages = [...prev, optimisticMessage];
      console.log('Messages after adding:', newMessages.length);
      return newMessages;
    });
    setNewMessage('');

    try {
      if (selectedRoom.isGroup) {
        console.log('Sending group message to group:', selectedRoom.group_id);
        const message = await chatService.sendGroupMessage(selectedRoom.group_id, messageText);
        console.log('Group message sent:', message);
        // Replace optimistic message with real one
        setMessages((prev) => {
          const updated = prev.map(msg => {
            if (msg.message_id === tempId) {
              console.log('Replacing temp message with real one:', message);
              return { ...message, sending: false };
            }
            return msg;
          });
          return updated;
        });
        fetchGroupChats();
      } else {
        console.log('Sending individual message to room:', selectedRoom.room_id);
        const response = await secureAPI.post('/api/chat/messages', {
          room_id: selectedRoom.room_id,
          message_text: messageText,
        });
        console.log('Message sent:', response.data);
        // Replace optimistic message with real one
        setMessages((prev) => {
          const updated = prev.map(msg => {
            if (msg.message_id === tempId) {
              console.log('Replacing temp message with real one:', response.data);
              return { ...response.data, sending: false };
            }
            return msg;
          });
          return updated;
        });
        fetchRooms();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', error.response?.data);
      // Remove failed message
      setMessages((prev) => prev.filter(msg => msg.message_id !== tempId));
      // Restore the message text
      setNewMessage(messageText);
      alert('Failed to send message: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Load rooms and groups on mount
  useEffect(() => {
    if (currentUserId) {
      fetchRooms();
      fetchGroupChats();
    }
  }, [currentUserId]);

  // Polling for conversation updates
  useEffect(() => {
    if (currentUserId) {
      const interval = setInterval(() => {
        fetchRooms();
        fetchGroupChats();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUserId]);

  // Filter rooms by search
  const filteredRooms = rooms.filter(room => 
    room.worklet_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.other_user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter groups by search
  const filteredGroups = groupChats.filter(group =>
    group.group_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.worklet_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                placeholder="Search mentors or worklets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Room List */}
          <div className="flex-1 overflow-y-auto">
            {filteredRooms.length === 0 && filteredGroups.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <MessageCircle className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No conversations yet</p>
                <p className="text-sm mt-1">Start chatting with your mentors</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* Group Chats Section */}
                {filteredGroups.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        Team Chats ({filteredGroups.length})
                      </p>
                    </div>
                    {filteredGroups.map((group) => (
                      <motion.div
                        key={group.group_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => handleSelectRoom({ ...group, isGroup: true, displayName: group.group_name })}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedRoom?.group_id === group.group_id
                            ? 'bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-500'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {group.group_name}
                              </h3>
                              <span className="bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-[10px] px-1.5 py-0.5 rounded font-medium">
                                Group
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {group.worklet_title || 'Worklet Team'}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2">
                            {group.last_message_at && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTime(group.last_message_at)}
                              </span>
                            )}
                            {group.unread_count > 0 && (
                              <span className="bg-teal-500 text-white text-xs rounded-full px-2 py-0.5 font-medium">
                                {group.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                        {group.last_message && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            <span className="font-medium">{group.last_sender_name}: </span>
                            {group.last_message}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </>
                )}

                {/* Individual Chats Section */}
                {filteredRooms.length > 0 && (
                  <>
                    {filteredGroups.length > 0 && (
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Direct Messages ({filteredRooms.length})
                        </p>
                      </div>
                    )}
                    {filteredRooms.map((room) => (
                      <motion.div
                        key={room.room_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => handleSelectRoom(room)}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedRoom?.room_id === room.room_id
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {room.other_user_name}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {room.worklet_title}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2">
                            {room.last_message_at && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTime(room.last_message_at)}
                              </span>
                            )}
                            {room.unread_count > 0 && (
                              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 font-medium">
                                {room.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                        {room.last_message && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {room.last_message}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
          {selectedRoom ? (
            <>
              {/* Chat Header - WhatsApp style */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-[#F0F2F5] dark:bg-[#202C33]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                      selectedRoom.isGroup ? 'bg-teal-600' : 'bg-blue-500'
                    }`}>
                      {(selectedRoom.displayName || selectedRoom.other_user_name).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-[16px] font-medium text-gray-900 dark:text-white">
                          {selectedRoom.displayName || selectedRoom.other_user_name}
                        </h2>
                        {selectedRoom.isGroup && (
                          <span className="bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-[10px] px-1.5 py-0.5 rounded font-medium">
                            Group
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-gray-600 dark:text-gray-400">
                        {selectedRoom.worklet_title || 'Worklet Chat'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedRoom.isGroup && (
                      <button
                        onClick={() => handleViewGroupProfile(selectedRoom.group_id)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                        title="View group info"
                      >
                        <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedRoom(null)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages - WhatsApp style */}
              <div className="flex-1 overflow-y-auto p-6 bg-[#EFEAE2] dark:bg-[#0B141A]" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg opacity=\'0.05\'%3E%3Cpath d=\'M0 0h50v50H0z\' fill=\'%23000\'/%3E%3C/g%3E%3C/svg%3E")',
                backgroundSize: '300px 300px'
              }}>
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
                      key={message.message_id || message.group_message_id}
                      message={message}
                      isOwnMessage={message.sender_id === currentUserId}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input - WhatsApp style */}
              <div className="p-3 bg-[#F0F2F5] dark:bg-[#202C33]">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message"
                    className="flex-1 px-4 py-2.5 border-0 rounded-lg bg-white dark:bg-[#2A3942] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 text-[15px]"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-[#25D366] hover:bg-[#20BD5A] disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-full p-3 transition-colors flex items-center justify-center"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-[#F0F2F5] dark:bg-[#0B141A]">
              <div className="text-center">
                <MessageCircle className="w-24 h-24 mx-auto mb-4 opacity-20 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">Select a conversation</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose a chat from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Group Profile Modal */}
      <AnimatePresence>
        {showGroupProfile && groupProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowGroupProfile(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-[#202C33] rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-600 to-teal-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-2xl shadow-lg">
                      {groupProfile.group_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {groupProfile.group_name}
                      </h2>
                      <p className="text-teal-100 text-sm mt-1">
                        {groupProfile.member_count} {groupProfile.member_count === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowGroupProfile(false)}
                    className="p-2 hover:bg-teal-800 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Worklet Info */}
                <div className="mb-6 bg-gray-50 dark:bg-[#2A3942] rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {groupProfile.worklet_title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Certificate ID:</span> {groupProfile.cert_id}
                  </p>
                  {groupProfile.description && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {groupProfile.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Mentor Section */}
                {groupProfile.mentor && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      Mentor
                    </h3>
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 border-l-4 border-amber-500">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white font-semibold text-lg shadow">
                          {groupProfile.mentor.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {groupProfile.mentor.name}
                            </p>
                            <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs px-2 py-0.5 rounded-full font-medium">
                              Mentor
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {groupProfile.mentor.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Members Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Team Members ({groupProfile.members.length})
                  </h3>
                  <div className="space-y-2">
                    {groupProfile.members.map((member) => (
                      <div
                        key={member.user_id}
                        className="bg-gray-50 dark:bg-[#2A3942] rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-[#323E47] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold shadow">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {member.name}
                              </p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                member.role === 'student' 
                                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                                  : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              }`}>
                                {member.role}
                              </span>
                              {member.is_admin && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {member.email}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Joined {new Date(member.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
