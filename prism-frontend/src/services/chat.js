import secureAPI from './secureAPI';

// Chat service for managing chat rooms and messages

export const chatService = {
  // Get all chat rooms for current user
  async getChatRooms() {
    try {
      const response = await secureAPI.get('/api/chat/rooms');
      return response.data;
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      throw error;
    }
  },

  // Create or get existing chat room
  async createOrGetChatRoom(workletId, otherUserId) {
    try {
      const response = await secureAPI.post('/api/chat/rooms', null, {
        params: {
          worklet_id: workletId,
          other_user_id: otherUserId,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating/getting chat room:', error);
      throw error;
    }
  },

  // Get messages from a chat room
  async getMessages(roomId, skip = 0, limit = 50) {
    try {
      const response = await secureAPI.get(`/api/chat/rooms/${roomId}/messages`, {
        params: { skip, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send a message
  async sendMessage(roomId, messageText) {
    try {
      const response = await secureAPI.post('/api/chat/messages', {
        room_id: roomId,
        message_text: messageText,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Mark message as read
  async markAsRead(messageId) {
    try {
      const response = await secureAPI.patch(`/api/chat/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },

  // Mark all messages in a room as read
  async markRoomAsRead(roomId) {
    try {
      const response = await secureAPI.patch(`/api/chat/rooms/${roomId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking room as read:', error);
      throw error;
    }
  },

  // Get unread message count
  async getUnreadCount() {
    try {
      const response = await secureAPI.get('/api/chat/unread-count');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  // Search messages in a room
  async searchMessages(roomId, query) {
    try {
      const response = await secureAPI.get(`/api/chat/rooms/${roomId}/search`, {
        params: { query },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  },

  // Edit a message
  async editMessage(messageId, newText) {
    try {
      const response = await secureAPI.put(`/api/chat/messages/${messageId}`, {
        message_text: newText,
      });
      return response.data;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  },

  // Delete a message
  async deleteMessage(messageId) {
    try {
      const response = await secureAPI.delete(`/api/chat/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  // Update room settings (archive/mute)
  async updateRoomSettings(roomId, settings) {
    try {
      const response = await secureAPI.patch(`/api/chat/rooms/${roomId}/settings`, settings);
      return response.data;
    } catch (error) {
      console.error('Error updating room settings:', error);
      throw error;
    }
  },

  // Report inappropriate message
  async reportMessage(messageId, reason) {
    try {
      const response = await secureAPI.post(`/api/chat/messages/${messageId}/report`, {
        reason,
      });
      return response.data;
    } catch (error) {
      console.error('Error reporting message:', error);
      throw error;
    }
  },

  // Block user
  async blockUser(userId) {
    try {
      const response = await secureAPI.post('/api/chat/block', {
        user_id: userId,
      });
      return response.data;
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  },

  // Unblock user
  async unblockUser(userId) {
    try {
      const response = await secureAPI.delete('/api/chat/block', {
        data: { user_id: userId },
      });
      return response.data;
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  },

  // Get blocked users list
  async getBlockedUsers() {
    try {
      const response = await secureAPI.get('/api/chat/blocked');
      return response.data;
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      throw error;
    }
  },

  // ============= GROUP CHAT FEATURES =============

  // Create or get group chat for a worklet
  async createOrGetWorkletGroupChat(workletId) {
    try {
      const response = await secureAPI.post('/api/chat/groups', {
        worklet_id: workletId,
        group_name: `Worklet-${workletId}`,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating/getting worklet group chat:', error);
      throw error;
    }
  },

  // Auto-create group chat when worklet is assigned (called by backend)
  async autoCreateWorkletGroupChat(workletId, mentorId, studentIds) {
    try {
      const response = await secureAPI.post('/api/chat/groups/auto-create', {
        worklet_id: workletId,
        group_name: `Worklet-${workletId}`,
        mentor_id: mentorId,
        student_ids: studentIds,
      });
      return response.data;
    } catch (error) {
      console.error('Error auto-creating worklet group chat:', error);
      throw error;
    }
  },

  // Get all group chats for a worklet
  async getWorkletGroupChats(workletId) {
    try {
      const response = await secureAPI.get('/api/chat/groups', {
        params: { worklet_id: workletId },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching worklet group chats:', error);
      throw error;
    }
  },

  // Get all group chats for current user (no filter)
  async getGroupChats() {
    try {
      const response = await secureAPI.get('/api/chat/groups');
      return response.data;
    } catch (error) {
      console.error('Error fetching group chats:', error);
      throw error;
    }
  },

  // Get group messages
  async getGroupMessages(groupId, limit = 50) {
    try {
      const response = await secureAPI.get(`/api/chat/groups/${groupId}/messages`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching group messages:', error);
      throw error;
    }
  },

  // Send group message
  async sendGroupMessage(groupId, messageText) {
    try {
      const response = await secureAPI.post('/api/chat/groups/messages', {
        group_id: groupId,
        message_text: messageText,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending group message:', error);
      throw error;
    }
  },

  // Get group chat members
  async getGroupMembers(groupId) {
    try {
      const response = await secureAPI.get(`/api/chat/groups/${groupId}/members`);
      return response.data;
    } catch (error) {
      console.error('Error fetching group members:', error);
      throw error;
    }
  },

  // Get group profile (detailed info)
  async getGroupProfile(groupId) {
    try {
      const response = await secureAPI.get(`/api/chat/groups/${groupId}/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching group profile:', error);
      throw error;
    }
  },

  // Add member to group chat (mentor only)
  async addGroupMember(groupId, userId) {
    try {
      const response = await secureAPI.post(`/api/chat/groups/${groupId}/members`, {
        user_id: userId,
      });
      return response.data;
    } catch (error) {
      console.error('Error adding group member:', error);
      throw error;
    }
  },

  // Remove member from group chat (mentor only)
  async removeGroupMember(groupId, userId) {
    try {
      const response = await secureAPI.delete(`/api/chat/groups/${groupId}/members/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing group member:', error);
      throw error;
    }
  },

  // Leave group chat (self)
  async leaveGroupChat(groupId) {
    try {
      const response = await secureAPI.post(`/api/chat/groups/${groupId}/leave`);
      return response.data;
    } catch (error) {
      console.error('Error leaving group chat:', error);
      throw error;
    }
  },

  // Update group chat settings (mentor only)
  async updateGroupSettings(groupId, settings) {
    try {
      const response = await secureAPI.patch(`/api/chat/groups/${groupId}/settings`, settings);
      return response.data;
    } catch (error) {
      console.error('Error updating group settings:', error);
      throw error;
    }
  },

  // Get all individual chats for mentor with students
  async getMentorStudentChats(workletId) {
    try {
      const response = await secureAPI.get('/api/chat/mentor-students', {
        params: { worklet_id: workletId },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching mentor-student chats:', error);
      throw error;
    }
  },

  // Start individual chat with a student (mentor)
  async startStudentChat(studentId, workletId) {
    try {
      const response = await secureAPI.post('/api/chat/rooms', null, {
        params: {
          worklet_id: workletId,
          other_user_id: studentId,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error starting student chat:', error);
      throw error;
    }
  },
};

export default chatService;
