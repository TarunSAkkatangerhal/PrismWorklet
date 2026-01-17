import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, Search, X, Info, Edit2, Trash2, Star, Check, MoreVertical, Mail, CheckCheck, Paperclip, Image as ImageIcon, File, Download, FileText } from 'lucide-react';
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

  const connect = useCallback(() => {
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
  }, []);

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
  }, [connect]);

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
const MessageBubble = ({ message, isOwnMessage, currentUserId, onEdit, onDelete, onStar }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Check if message is within 20 minutes of being sent
  const isWithin20Minutes = () => {
    const sentTime = new Date(message.sent_at);
    const currentTime = new Date();
    const diffInMinutes = (currentTime - sentTime) / (1000 * 60);
    return diffInMinutes <= 20;
  };

  const canEdit = isOwnMessage && isWithin20Minutes();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = () => {
    if (!canEdit) {
      alert('Messages can only be deleted within 20 minutes of sending');
      return;
    }
    if (window.confirm('Are you sure you want to delete this message? This cannot be undone.')) {
      onDelete(message.message_id);
      setShowMenu(false);
    }
  };

  const handleStar = () => {
    if (!canEdit) {
      alert('Messages can only be starred within 20 minutes of sending');
      return;
    }
    onStar(message.message_id);
    setShowMenu(false);
  };

  const handleEdit = () => {
    if (!canEdit) {
      alert('Messages can only be edited within 20 minutes of sending');
      return;
    }
    onEdit(message);
    setShowMenu(false);
  };

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
        <div className="relative group">
          <div
            className={`rounded-lg px-3 py-2 shadow-sm ${
              isOwnMessage
                ? 'bg-blue-500 dark:bg-blue-600 text-white rounded-br-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
            }`}
          >
            <div className="flex items-start gap-2">
              {message.is_starred && (
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0 mt-1" />
              )}
              {message.included_in_email && (
                <CheckCheck className="w-3 h-3 text-green-500 flex-shrink-0 mt-1" title="Included in email" />
              )}
              <div className="flex-1">
                {message.message_text && message.message_text !== '(file attachment)' && (
                  <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: formatMessageText(message.message_text) }}></p>
                )}
                {/* Attachments - WhatsApp Style */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2">
                    {(() => {
                      const images = message.attachments.filter(a => a.content_type?.startsWith('image/'));
                      const files = message.attachments.filter(a => !a.content_type?.startsWith('image/'));
                      
                      return (
                        <>
                          {/* Images - Grid Layout */}
                          {images.length > 0 && (
                            <div className={`grid gap-1 ${
                              images.length === 1 ? 'grid-cols-1' : 
                              images.length === 2 ? 'grid-cols-2' : 
                              images.length === 3 ? 'grid-cols-3' : 
                              'grid-cols-2'
                            } mb-2`}>
                              {images.map((attachment, idx) => {
                                const imageUrl = `http://localhost:8000${attachment.url}`;
                                return (
                                  <a 
                                    key={idx}
                                    href={imageUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="relative overflow-hidden rounded-lg block bg-gray-200 dark:bg-gray-700"
                                  >
                                    <img 
                                      src={imageUrl} 
                                      alt={attachment.original_filename}
                                      className="w-full h-48 object-cover cursor-pointer transition-transform hover:scale-105"
                                      loading="lazy"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = `<div class="w-full h-48 flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"><div class="text-center"><svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-xs">Image not available</p></div></div>`;
                                      }}
                                    />
                                  </a>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Files - Card Layout */}
                          {files.length > 0 && (
                            <div className="space-y-1">
                              {files.map((attachment, idx) => {
                                const fileSize = attachment.size ? 
                                  (attachment.size / 1024 / 1024).toFixed(2) + ' MB' : 
                                  'Unknown size';
                                const fileExt = attachment.original_filename?.split('.').pop()?.toUpperCase() || 'FILE';
                                
                                return (
                                  <a 
                                    key={idx}
                                    href={`http://localhost:8000${attachment.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                      isOwnMessage 
                                        ? 'bg-blue-600/30 hover:bg-blue-600/40 border border-blue-400/30' 
                                        : 'bg-white/50 dark:bg-gray-600/50 hover:bg-white dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-500'
                                    }`}
                                  >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                      isOwnMessage 
                                        ? 'bg-blue-600 dark:bg-blue-700' 
                                        : 'bg-gray-300 dark:bg-gray-600'
                                    }`}>
                                      <FileText className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium truncate ${
                                        isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-white'
                                      }`}>
                                        {attachment.original_filename}
                                      </p>
                                      <p className={`text-xs ${
                                        isOwnMessage 
                                          ? 'text-blue-100 dark:text-blue-200' 
                                          : 'text-gray-500 dark:text-gray-400'
                                      }`}>
                                        {fileExt} • {fileSize}
                                      </p>
                                    </div>
                                    <Download className={`w-5 h-5 flex-shrink-0 ${
                                      isOwnMessage ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                                    }`} />
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
            <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              {message.is_edited && (
                <span className={`text-[10px] italic ${isOwnMessage ? 'text-blue-100 dark:text-blue-200' : 'text-gray-600 dark:text-gray-400'}`}>
                  edited
                </span>
              )}
              <span className={`text-[11px] ${isOwnMessage ? 'text-blue-100 dark:text-blue-200' : 'text-gray-600 dark:text-gray-400'}`}>
                {new Date(message.sent_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </span>
            </div>
          </div>
          
          {/* 3-dot menu button - only show for own messages within 20 minutes */}
          {canEdit && (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`absolute top-1 right-1 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity ${
                showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}

          {/* Dropdown menu */}
          {showMenu && canEdit && (
            <div
              ref={menuRef}
              className="absolute top-8 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 min-w-[140px] z-10"
            >
              <button
                onClick={handleStar}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
              >
                <Star className={`w-4 h-4 ${message.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                {message.is_starred ? 'Unstar' : 'Star'}
              </button>
              <button
                onClick={handleEdit}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Professor Chat Page Component
export default function ProfessorChatPage() {
  useDocumentTitle('Messages - PRISM');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [groupChats, setGroupChats] = useState([]);
  const [showGroupProfile, setShowGroupProfile] = useState(false);
  const [groupProfile, setGroupProfile] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(5000);
  const [editingMessage, setEditingMessage] = useState(null);
  const [emailStatus, setEmailStatus] = useState({ can_send: true, starred_messages_available: 0 });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    if (data.type === 'new_group_message') {
      const message = data.data;
      
      if (selectedRoom?.isGroup && message.worklet_id === selectedRoom.worklet_id) {
        setMessages((prev) => {
          const exists = prev.some(m => m.message_id === message.group_message_id || m.sending);
          if (exists) return prev;
          return [...prev, {
            message_id: message.group_message_id,
            worklet_id: message.worklet_id,
            sender_id: message.sender_id,
            sender_name: message.sender_name,
            message_text: message.message_text,
            sent_at: message.sent_at,
            is_read: true
          }];
        });
      }
      
      fetchGroupChats();
    } else if (data.type === 'message_edited' || data.type === 'group_message_edited') {
      const editData = data.data;
      setMessages((prev) => prev.map(msg => 
        msg.message_id === editData.message_id 
          ? { ...msg, message_text: editData.message_text, is_edited: true }
          : msg
      ));
    } else if (data.type === 'message_deleted' || data.type === 'group_message_deleted') {
      const deleteData = data.data;
      setMessages((prev) => prev.filter(msg => msg.message_id !== deleteData.message_id));
    } else if (data.type === 'message_starred' || data.type === 'group_message_starred') {
      const starData = data.data;
      setMessages((prev) => prev.map(msg => 
        msg.message_id === starData.message_id 
          ? { ...msg, is_starred: starData.is_starred }
          : msg
      ));
    }
  };

  const { isConnected } = useChatWebSocket(handleWebSocketMessage);

  // Fetch group chats - Only Ongoing worklets (status_id = 1)
  const fetchGroupChats = async () => {
    try {
      const groups = await chatService.getGroupChats(1);
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

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingFile(true);
    try {
      const response = await secureAPI.post('/api/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setAttachments([...attachments, response.data]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove attachment
  const handleRemoveAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Select a room
  const handleSelectRoom = async (room) => {
    setSelectedRoom(room);
    await fetchGroupMessages(room.worklet_id);
    
    if (room.worklet_id) {
      checkEmailStatus(room.worklet_id);
    }
    
    setTimeout(() => {
      fetchGroupChats();
    }, 500);
  };

  // Check if email can be sent for this worklet
  const checkEmailStatus = async (workletId) => {
    try {
      const status = await chatService.checkEmailStatus(workletId);
      setEmailStatus(status);
    } catch (error) {
      console.error('Error checking email status:', error);
    }
  };

  // Send starred messages email
  const handleSendStarredEmail = async () => {
    if (!selectedRoom?.worklet_id) return;
    
    if (!window.confirm(`Send an email with starred messages from the last 5 minutes to all worklet members?`)) {
      return;
    }
    
    try {
      setSendingEmail(true);
      const result = await chatService.sendStarredMessagesEmail(selectedRoom.worklet_id);
      
      alert(`Email sent successfully to ${result.recipients_count} members! ${result.messages_included} starred messages included.`);
      
      await checkEmailStatus(selectedRoom.worklet_id);
      await fetchGroupMessages(selectedRoom.worklet_id);
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to send email';
      alert(`Error: ${errorMsg}`);
    } finally {
      setSendingEmail(false);
    }
  };

  // Send a message
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedRoom) {
      return;
    }

    const messageText = newMessage.trim() || '(file attachment)';
    
    if (editingMessage) {
      try {
        await chatService.editMessage(editingMessage.message_id, messageText);
        setMessages((prev) => prev.map(msg => 
          msg.message_id === editingMessage.message_id 
            ? { ...msg, message_text: messageText, is_edited: true }
            : msg
        ));
        setNewMessage('');
        setEditingMessage(null);
      } catch (error) {
        console.error('Error editing message:', error);
        alert('Failed to edit message');
      }
      return;
    }

    const tempId = `temp-${Date.now()}`;
    
    const optimisticMessage = {
      message_id: tempId,
      worklet_id: selectedRoom.worklet_id,
      sender_id: currentUserId,
      sender_name: 'You',
      message_text: messageText,
      attachments: attachments.length > 0 ? attachments : null,
      sent_at: new Date().toISOString(),
      is_read: false,
      sending: true
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');
    setAttachments([]);

    try {
      const message = await chatService.sendGroupMessage(selectedRoom.worklet_id, messageText, attachments.length > 0 ? attachments : null);
      setMessages((prev) => prev.map(msg => msg.message_id === tempId ? { ...message, sending: false } : msg));
      fetchGroupChats();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter(msg => msg.message_id !== tempId));
      setNewMessage(messageText === '(file attachment)' ? '' : messageText);
      setAttachments(attachments);
      alert('Failed to send message: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Edit message handler
  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setNewMessage(message.message_text);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setNewMessage('');
  };

  // Delete message handler
  const handleDeleteMessage = async (messageId) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages((prev) => prev.filter(msg => msg.message_id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  // Star message handler
  const handleStarMessage = async (messageId) => {
    try {
      const response = await chatService.toggleStarMessage(messageId);
      setMessages((prev) => prev.map(msg => 
        msg.message_id === messageId 
          ? { ...msg, is_starred: response.is_starred }
          : msg
      ));
      
      if (selectedRoom?.worklet_id) {
        checkEmailStatus(selectedRoom.worklet_id);
      }
    } catch (error) {
      console.error('Error starring message:', error);
      alert('Failed to star message');
    }
  };

  // Load groups on mount
  useEffect(() => {
    if (currentUserId) {
      fetchGroupChats();
    }
  }, [currentUserId]);

  // Adaptive polling
  useEffect(() => {
    if (!currentUserId) return;

    if (!isConnected) {
      const interval = setInterval(() => {
        fetchGroupChats();
        setPollingInterval((prev) => Math.min(prev * 2, 60000));
      }, pollingInterval);
      
      return () => clearInterval(interval);
    } else {
      setPollingInterval(5000);
    }
  }, [currentUserId, isConnected, pollingInterval]);

  const filteredGroups = groupChats
    .filter(group =>
      group.group_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.worklet_title?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return timeB - timeA;
    });

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
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search worklets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#202C33] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Group List */}
          <div className="flex-1 overflow-y-auto relative">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <MessageCircle className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No group conversations yet</p>
                <p className="text-sm mt-1">Group chats will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
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
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-[#F0F2F5] dark:bg-[#202C33]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold bg-blue-500">
                      {selectedRoom.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-[16px] font-medium text-gray-900 dark:text-white">
                          {selectedRoom.displayName}
                        </h2>
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-[10px] px-1.5 py-0.5 rounded font-medium">
                          Group
                        </span>
                      </div>
                      <p className="text-[13px] text-gray-600 dark:text-gray-400">
                        {selectedRoom.worklet_title || 'Worklet Chat'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSendStarredEmail}
                      disabled={!emailStatus.can_send || sendingEmail || emailStatus.starred_messages_available === 0}
                      className={`p-2 rounded-full transition-colors relative ${
                        !emailStatus.can_send || sendingEmail || emailStatus.starred_messages_available === 0
                          ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
                          : 'hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      }`}
                      title={
                        !emailStatus.can_send 
                          ? 'Email already sent today' 
                          : emailStatus.starred_messages_available === 0
                          ? 'No starred messages in last 5 minutes'
                          : 'Send starred messages via email'
                      }
                    >
                      <Mail className="w-5 h-5" />
                      {emailStatus.starred_messages_available > 0 && emailStatus.can_send && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                          {emailStatus.starred_messages_available}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleViewGroupProfile(selectedRoom.worklet_id)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                      title="View group info"
                    >
                      <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
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
                <div className="min-h-full p-2">
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
                    groupMessagesByDate(messages).map((group, groupIndex) => (
                      <div key={groupIndex}>
                        <DateSeparator date={group.messages[0].sent_at} />
                        {group.messages.map((message) => (
                          <MessageBubble
                            key={message.message_id}
                            message={message}
                            isOwnMessage={message.sender_id === currentUserId}
                            currentUserId={currentUserId}
                            onEdit={handleEditMessage}
                            onDelete={handleDeleteMessage}
                            onStar={handleStarMessage}
                          />
                        ))}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="p-3 bg-[#F0F2F5] dark:bg-[#202C33] border-t border-transparent dark:border-gray-800">
                {editingMessage && (
                  <div className="mb-2 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded">
                    <div className="flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-blue-600 dark:text-blue-400">Editing message</span>
                    </div>
                    <button
                      onClick={handleCancelEdit}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {attachments.map((attachment, idx) => {
                      const isImage = attachment.content_type?.startsWith('image/');
                      return (
                        <div key={idx} className="relative bg-white dark:bg-gray-700 rounded-lg p-2 flex items-center gap-2">
                          {isImage ? <ImageIcon className="w-4 h-4" /> : <File className="w-4 h-4" />}
                          <span className="text-sm truncate max-w-[150px]">{attachment.original_filename}</span>
                          <button
                            onClick={() => handleRemoveAttachment(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="p-2.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
                    title="Attach file"
                  >
                    {uploadingFile ? (
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    ) : (
                      <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
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
                    placeholder={editingMessage ? "Edit your message" : "Type a message"}
                    className="flex-1 px-4 py-2.5 border-0 rounded-lg bg-white dark:bg-[#2A3942] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-0 text-[15px]"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && attachments.length === 0}
                    className="bg-[#25D366] hover:bg-[#20BD5A] disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-full p-3 transition-colors flex items-center justify-center"
                  >
                    {editingMessage ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}
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
                <div className="mb-6 bg-gray-50 dark:bg-[#2A3942] rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {groupProfile.worklet_title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Certificate ID:</span> {groupProfile.cert_id}
                  </p>
                </div>

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
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                {member.role}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {member.email}
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
