import secureAPI from './secureAPI';

// Chat service for managing chat rooms and messages

export const chatService = {
  // Get all chat rooms for current user
  async getChatRooms() {
    try {
      const response = await secureAPI.get('/chat/rooms');
      return response.data;
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      throw error;
    }
  },

  // Create or get existing chat room
  async createOrGetChatRoom(workletId, otherUserId) {
    try {
      const response = await secureAPI.post('/chat/rooms', null, {
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
      const response = await secureAPI.get(`/chat/rooms/${roomId}/messages`, {
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
      const response = await secureAPI.post('/chat/messages', {
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
      const response = await secureAPI.patch(`/chat/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },
};

export default chatService;
