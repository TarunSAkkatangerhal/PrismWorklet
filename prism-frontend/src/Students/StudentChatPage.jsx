import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Search, X, Users, Info, SlidersHorizontal, SquarePlus, Edit } from 'lucide-react';
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

// Format date headers like WhatsApp
const formatDateHeader = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Reset time to compare only dates
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  
  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'Today';
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  }
};

// Group messages by date
const groupMessagesByDate = (messages) => {
  const groups = [];
  let currentDate = null;
  let currentGroup = [];
  
  messages.forEach((message) => {
    const messageDate = new Date(message.sent_at).toDateString();
    
    if (messageDate !== currentDate) {
      if (currentGroup.length > 0) {
        groups.push({ date: currentDate, messages: currentGroup });
      }
      currentDate = messageDate;
      currentGroup = [message];
    } else {
      currentGroup.push(message);
    }
  });
  
  if (currentGroup.length > 0) {
    groups.push({ date: currentDate, messages: currentGroup });
  }
  
  return groups;
};

// Format message text with support for bold, italic, code, and links
const formatMessageText = (text) => {
  if (!text) return text;
  
  // Convert **bold** to <strong>
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *italic* to <em>
  text = text.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>');
  
  // Convert `code` to <code>
  text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-600 px-1 rounded text-sm">$1</code>');
  
  // Convert URLs to clickable links
  text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline hover:text-blue-300">$1</a>');
  
  return text;
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
      console.error('Error connecting to WebSocket:', error);
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

// Date Separator Component
const DateSeparator = ({ date }) => {
  return (
    <div className="flex justify-center my-4">
      <div className="bg-white dark:bg-[#202C33] px-3 py-1.5 rounded-lg shadow-sm">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {formatDateHeader(date)}
        </span>
      </div>
    </div>
  );
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
            <span className="ml-2 text-[10px] font-normal bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
              {message.sender_role}
            </span>
          </p>
        )}
        <div
          className={`rounded-lg px-3 py-2 shadow-sm ${
            isOwnMessage
              ? 'bg-blue-500 dark:bg-blue-600 text-white rounded-br-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
          }`}
        >
          <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: formatMessageText(message.message_text) }}></p>
          <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-[11px] ${isOwnMessage ? 'text-blue-100 dark:text-blue-200' : 'text-gray-600 dark:text-gray-400'}`}>
              {new Date(message.sent_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
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
  const [statusFilter, setStatusFilter] = useState(1); // Default to Ongoing
  const [chatType, setChatType] = useState('all'); // 'all', 'individual', 'group'
  const [showGroupProfile, setShowGroupProfile] = useState(false);
  const [groupProfile, setGroupProfile] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(5000); // Start at 5s
  const messagesEndRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  
  // Filter and New Chat Panel States
  const [showFilters, setShowFilters] = useState(false);
  const [showNewChatPanel, setShowNewChatPanel] = useState(false);
  const [allMentors, setAllMentors] = useState([]);
  const [mentorSearchQuery, setMentorSearchQuery] = useState('');
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch all mentors from student's worklets
  const fetchAllMentors = async () => {
    if (!currentUserId) {
      console.log('No current user ID, cannot fetch mentors');
      return;
    }
    
    setLoadingMentors(true);
    try {
      // Get student's worklets
      const workletsResponse = await secureAPI.get('/worklets/student/me');
      const worklets = workletsResponse.data || [];
      
      console.log('Fetched worklets:', worklets);
      
      const mentorsMap = new Map();
      await Promise.all(
        worklets.map(async (worklet) => {
          try {
            // Get mentors for each worklet
            const response = await secureAPI.get(`/api/associations/worklet/${worklet.id}/users`);
            const mentors = (response.data?.mentors || []).filter(m => m.user_id !== currentUserId);
            console.log(`Mentors for worklet ${worklet.id}:`, mentors);
            mentors.forEach(mentor => {
              if (!mentorsMap.has(mentor.user_id)) {
                mentorsMap.set(mentor.user_id, {
                  ...mentor,
                  worklets: [{ id: worklet.id, title: worklet.cert_id || worklet.title || `Worklet ${worklet.id}` }]
                });
              } else {
                const existing = mentorsMap.get(mentor.user_id);
                existing.worklets.push({ id: worklet.id, title: worklet.cert_id || worklet.title || `Worklet ${worklet.id}` });
              }
            });
          } catch (error) {
            console.error(`Error fetching mentors for worklet ${worklet.id}:`, error);
          }
        })
      );
      
      const mentorsList = Array.from(mentorsMap.values());
      console.log('All mentors mapped:', mentorsList);
      setAllMentors(mentorsList);
    } catch (error) {
      console.error('Error fetching mentors:', error);
    } finally {
      setLoadingMentors(false);
    }
  };

  // Handle opening new chat panel
  const handleOpenNewChatPanel = () => {
    setShowNewChatPanel(true);
    if (allMentors.length === 0) {
      fetchAllMentors();
    }
  };

  // Handle creating chat with selected mentor
  const handleStartChatWithMentor = async (mentor, workletId) => {
    setCreatingChat(true);
    try {
      const response = await chatService.createOrGetChatRoom(workletId, mentor.user_id);
      
      setShowNewChatPanel(false);
      setMentorSearchQuery('');
      
      await fetchRooms();
      
      setTimeout(async () => {
        const updatedRooms = await chatService.getChatRooms();
        const newRoom = updatedRooms.find(r => r.room_id === response.room_id);
        if (newRoom) {
          handleSelectRoom({ ...newRoom, isGroup: false, displayName: newRoom.other_user_name }, false);
        }
      }, 500);
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to create chat. Please try again.');
    } finally {
      setCreatingChat(false);
    }
  };

  // Filter mentors based on search
  const filteredMentors = allMentors.filter(mentor => {
    const searchLower = mentorSearchQuery.toLowerCase();
    return (
      (mentor.name && mentor.name.toLowerCase().includes(searchLower)) ||
      (mentor.email && mentor.email.toLowerCase().includes(searchLower))
    );
  });

  // Get current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userResponse = await secureAPI.get('/auth/me');
        if (userResponse.data && userResponse.data.id) {
          setCurrentUserId(userResponse.data.id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // WebSocket message handler
  const handleWebSocketMessage = (data) => {
    if (data.type === 'new_message') {
      const message = data.data;
      
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
      if (selectedRoom?.isGroup && message.worklet_id === selectedRoom.worklet_id) {
        setMessages((prev) => {
          const exists = prev.some(m => m.message_id === message.group_message_id || m.sending);
          if (exists) return prev;
          return [...prev, {
            message_id: message.group_message_id,
            room_id: message.worklet_id,
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

  // Fetch chat rooms
  const fetchRooms = async () => {
    try {
      const response = await secureAPI.get('/api/chat/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    }
  };

  // Fetch group chats
  const fetchGroupChats = async () => {
    try {
      const groups = await chatService.getGroupChats(statusFilter);
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
      
      // Track last message ID for smart syncing
      if (msgs.length > 0) {
        lastMessageIdRef.current = msgs[msgs.length - 1].message_id;
      }
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

  // Fetch messages for a room
  const fetchMessages = async (roomId) => {
    try {
      setLoading(true);
      const response = await secureAPI.get(`/api/chat/rooms/${roomId}/messages?limit=100`);
      setMessages(response.data);
      
      // Track last message ID for smart syncing
      if (response.data.length > 0) {
        lastMessageIdRef.current = response.data[response.data.length - 1].message_id;
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Select a room
  const handleSelectRoom = async (room) => {
    setSelectedRoom(room);
    if (room.isGroup) {
      await fetchGroupMessages(room.worklet_id);
    } else {
      await fetchMessages(room.room_id);
    }
    
    // Mark room as read and refresh to clear unread dot
    setTimeout(() => {
      fetchRooms();
      if (room.isGroup) {
        fetchGroupChats();
      }
    }, 500);
  };

  // Send a message
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
      room_id: selectedRoom.isGroup ? selectedRoom.worklet_id : selectedRoom.room_id,
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
        console.log('Sending group message to worklet:', selectedRoom.worklet_id);
        const message = await chatService.sendGroupMessage(selectedRoom.worklet_id, messageText);
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
  }, [currentUserId, statusFilter]); // Re-fetch when statusFilter changes

  // Adaptive polling - only when WebSocket disconnected
  useEffect(() => {
    if (!currentUserId) return;

    // Only poll if WebSocket is NOT connected
    if (!isConnected) {
      const interval = setInterval(() => {
        console.log('⚠️ WebSocket disconnected, polling at', pollingInterval + 'ms');
        fetchRooms();
        fetchGroupChats();
        
        // Increase interval with exponential backoff: 5s → 10s → 30s → 60s
        setPollingInterval((prev) => Math.min(prev * 2, 60000));
      }, pollingInterval);
      
      return () => clearInterval(interval);
    } else {
      // WebSocket connected - reset polling interval for next disconnect
      console.log('✅ WebSocket connected, polling disabled');
      setPollingInterval(5000);
    }
  }, [currentUserId, isConnected, pollingInterval]);

  // Filter and sort rooms by search, type, and latest message
  const filteredRooms = (chatType === 'all' || chatType === 'individual')
    ? rooms
        .filter(room => 
          room.worklet_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.other_user_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
          const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return timeB - timeA; // Most recent first
        })
    : [];

  // Filter and sort groups by search, type, and latest message
  const filteredGroups = (chatType === 'all' || chatType === 'group')
    ? groupChats
        .filter(group =>
          group.group_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group.worklet_title?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
          const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return timeB - timeA; // Most recent first
        })
    : [];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <LeftSidebar />
      
      <div className="flex-1 flex">
        {/* Chat List Sidebar */}
        <div className="w-96 bg-white dark:bg-[#111B21] border-r border-gray-200 dark:border-gray-800 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageCircle className="w-7 h-7 text-blue-500" />
                My Messages
              </h1>
              <div className="flex items-center gap-2">
                {!isConnected && (
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                    Connecting...
                  </span>
                )}
                {/* Filter Icon Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg transition-colors ${
                    showFilters 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title="Filter"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Type Filter */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setChatType('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  chatType === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setChatType('individual')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  chatType === 'individual'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setChatType('group')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  chatType === 'group'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Groups
              </button>
            </div>
            
            {/* Collapsible Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {/* Status Filter Dropdown */}
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Filter Worklet Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#202C33] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                    >
                      <option value={0}>To Start</option>
                      <option value={1}>Ongoing</option>
                      <option value={2}>Completed</option>
                      <option value={3}>On Hold</option>
                      <option value={4}>Dropped</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search mentors or worklets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#202C33] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Room List */}
          <div className="flex-1 overflow-y-auto relative">
            {filteredRooms.length === 0 && filteredGroups.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <MessageCircle className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No conversations yet</p>
                <p className="text-sm mt-1">Start chatting with your mentors</p>
                
                {/* New Chat Button - Show inline when no conversations and on Individual tab */}
                {chatType === 'individual' && (
                  <div className="mt-6 px-8">
                    <button
                      onClick={handleOpenNewChatPanel}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium shadow-sm"
                    >
                      <SquarePlus className="w-5 h-5" />
                      <span>New Chat</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
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
                        key={group.worklet_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => handleSelectRoom({ ...group, isGroup: true, displayName: group.group_name })}
                        className={`p-4 cursor-pointer transition-colors border-l-4 ${
                          selectedRoom?.worklet_id === group.worklet_id
                            ? 'bg-blue-50 dark:bg-[#2A3942] border-blue-500 dark:border-blue-400'
                            : 'border-transparent hover:bg-gray-50 dark:hover:bg-[#202C33] hover:border-blue-200 dark:hover:border-blue-800'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {group.group_name}
                              </h3>
                              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-[10px] px-1.5 py-0.5 rounded font-medium">
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
                              <span className="w-3 h-3 bg-blue-500 rounded-full" title="Unread messages"></span>
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
                      <div className="px-4 py-2 bg-gray-50 dark:bg-[#202C33]">
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
                        className={`p-4 cursor-pointer transition-colors border-l-4 ${
                          selectedRoom?.room_id === room.room_id
                            ? 'bg-blue-50 dark:bg-[#2A3942] border-blue-500 dark:border-blue-400'
                            : 'border-transparent hover:bg-gray-50 dark:hover:bg-[#202C33] hover:border-blue-200 dark:hover:border-blue-800'
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
                              <span className="w-3 h-3 bg-blue-500 rounded-full" title="Unread messages"></span>
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
              
              {/* Floating New Chat Button - Only for Individual chats when there are conversations */}
              {chatType === 'individual' && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenNewChatPanel}
                  className="absolute bottom-4 right-4 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-10"
                  title="New Chat"
                >
                  <SquarePlus className="w-6 h-6" />
                </motion.button>
              )}
            </>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <>
              {/* Chat Header - WhatsApp style */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-[#F0F2F5] dark:bg-[#202C33]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                      selectedRoom.isGroup ? 'bg-blue-500' : 'bg-blue-500'
                    }`}>
                      {(selectedRoom.displayName || selectedRoom.other_user_name).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-[16px] font-medium text-gray-900 dark:text-white">
                          {selectedRoom.displayName || selectedRoom.other_user_name}
                        </h2>
                        {selectedRoom.isGroup && (
                          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-[10px] px-1.5 py-0.5 rounded font-medium">
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
                        onClick={() => handleViewGroupProfile(selectedRoom.worklet_id)}
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

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-[#EFEAE2] dark:bg-[#0B141A]">
                <div className="min-h-full p-2">{loading ? (
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
                  groupMessagesByDate(messages).map((group, groupIndex) => (
                    <div key={groupIndex}>
                      <DateSeparator date={group.messages[0].sent_at} />
                      {group.messages.map((message) => (
                        <MessageBubble
                          key={message.message_id || message.group_message_id}
                          message={message}
                          isOwnMessage={message.sender_id === currentUserId}
                        />
                      ))}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input - WhatsApp style */}
              <div className="p-3 bg-[#F0F2F5] dark:bg-[#202C33] border-t border-transparent dark:border-gray-800">
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
                    className="flex-1 px-4 py-2.5 border-0 rounded-lg bg-white dark:bg-[#2A3942] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-0 text-[15px]"
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
            <div className="flex-1 flex items-center justify-center bg-[#F0F2F5] dark:bg-[#111B21]">
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
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-2xl shadow-lg">
                      {groupProfile.group_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {groupProfile.group_name}
                      </h2>
                      <p className="text-blue-100 text-sm mt-1">
                        {groupProfile.member_count} {groupProfile.member_count === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowGroupProfile(false)}
                    className="p-2 hover:bg-blue-800 rounded-full transition-colors"
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
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
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

      {/* New Chat Panel - Sliding from right */}
      <AnimatePresence>
        {showNewChatPanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewChatPanel(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            
            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col"
            >
              {/* Panel Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-500 dark:bg-blue-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <SquarePlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">New Message</h2>
                      <p className="text-xs text-blue-100">Select a mentor to chat with</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNewChatPanel(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={mentorSearchQuery}
                    onChange={(e) => setMentorSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Mentors List */}
              <div className="flex-1 overflow-y-auto">
                {loadingMentors ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-gray-500 dark:text-gray-400">Loading mentors...</p>
                    </div>
                  </div>
                ) : filteredMentors.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center p-6">
                      <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">
                        {mentorSearchQuery ? 'No mentors found' : 'No mentors available'}
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        {mentorSearchQuery ? 'Try a different search' : 'Mentors will appear here'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredMentors.map((mentor) => (
                      <div key={mentor.user_id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-lg">
                              {(mentor.name || mentor.email || 'M').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          
                          {/* Mentor Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {mentor.name || 'Mentor'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {mentor.email}
                            </p>
                            
                            {/* Worklets */}
                            {mentor.worklets && mentor.worklets.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {mentor.worklets.slice(0, 2).map((worklet) => (
                                  <button
                                    key={worklet.id}
                                    onClick={() => handleStartChatWithMentor(mentor, worklet.id)}
                                    disabled={creatingChat}
                                    className="w-full text-left px-2 py-1.5 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded text-xs text-purple-700 dark:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    Chat about: {worklet.title}
                                  </button>
                                ))}
                                {mentor.worklets.length > 2 && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 px-2">
                                    +{mentor.worklets.length - 2} more worklet{mentor.worklets.length - 2 > 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Info */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {filteredMentors.length} {filteredMentors.length === 1 ? 'mentor' : 'mentors'} available
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
