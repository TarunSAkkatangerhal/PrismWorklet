# Chat System Guide - How to Send and Receive Messages

## Overview
The PRISM chat system supports **two types of conversations**:
1. **Individual Chats** - Direct 1-on-1 messaging between mentor and student
2. **Group Chats** - Team messaging for worklet groups (mentor + all students)

## How It Works

### Architecture
```
Frontend (React) ←→ WebSocket ←→ Backend (FastAPI) ←→ Database (MySQL)
```

### Real-Time Messaging Flow

#### 1. **Sending a Message**

**Individual Chat:**
```javascript
// Student/Mentor sends message
await chatService.sendMessage(roomId, "Hello!");

Backend:
- Saves message to database
- Sends WebSocket notification to OTHER user
- Returns message confirmation
```

**Group Chat:**
```javascript
// Any member sends message
await chatService.sendGroupMessage(groupId, "Team update!");

Backend:
- Saves message to database
- Sends WebSocket notification to ALL OTHER members
- Returns message confirmation
```

#### 2. **Receiving Messages**

The system uses **WebSocket connections** for real-time updates:

```javascript
// WebSocket automatically listens for new messages
WebSocket receives: {
  type: "new_message",           // or "new_group_message"
  data: {
    message_id: 123,
    sender_id: 456,
    sender_name: "John Doe",
    message_text: "Hello!",
    sent_at: "2026-01-09T10:30:00"
  }
}

// Frontend automatically:
1. Adds message to chat display
2. Updates chat list with new preview
3. Plays notification (if implemented)
```

## Step-by-Step User Experience

### Sending a Message

1. **User types message** in input field
2. **User clicks Send** (or presses Enter)
3. **Frontend calls** `sendMessage()` or `sendGroupMessage()`
4. **Backend processes**:
   - Validates user has access
   - Saves to database
   - Broadcasts via WebSocket
5. **Message appears** in sender's chat immediately
6. **Other users receive** via WebSocket automatically

### Receiving a Message

1. **Another user sends** a message
2. **Backend broadcasts** via WebSocket
3. **Your browser receives** WebSocket event
4. **Frontend handles** in `handleWebSocketMessage()`
5. **Message appears** in your chat automatically
6. **Chat list updates** with new preview

## WebSocket Message Types

### Individual Chat Messages
```json
{
  "type": "new_message",
  "data": {
    "message_id": 123,
    "room_id": 456,
    "sender_id": 789,
    "sender_name": "Alice Smith",
    "message_text": "Hello there!",
    "sent_at": "2026-01-09T10:30:00"
  }
}
```

### Group Chat Messages
```json
{
  "type": "new_group_message",
  "data": {
    "group_message_id": 321,
    "group_id": 654,
    "sender_id": 789,
    "sender_name": "Alice Smith",
    "message_text": "Team update!",
    "sent_at": "2026-01-09T10:30:00"
  }
}
```

## Key Components

### Backend (FastAPI)

**WebSocket Manager:**
```python
class ConnectionManager:
    - Maintains active WebSocket connections
    - Sends messages to specific users
    - Handles connect/disconnect
```

**Endpoints:**
- `POST /chat/messages` - Send individual message
- `POST /chat/groups/messages` - Send group message
- `GET /chat/rooms/{room_id}/messages` - Fetch message history
- `GET /chat/groups/{group_id}/messages` - Fetch group history

### Frontend (React)

**WebSocket Hook:**
```javascript
useChatWebSocket(onMessage)
- Establishes WebSocket connection
- Listens for incoming messages
- Reconnects if disconnected
- Sends ping/pong for keep-alive
```

**Chat Service:**
```javascript
chatService.sendMessage()        // Send individual
chatService.sendGroupMessage()   // Send group
chatService.getMessages()        // Load history
chatService.getGroupMessages()   // Load group history
```

## Connection Flow

```
1. User logs in
   ↓
2. Frontend gets access_token
   ↓
3. WebSocket connects with token
   ↓
4. Backend validates token
   ↓
5. Connection stored in manager
   ↓
6. User can send/receive messages
   ↓
7. On disconnect: auto-reconnect
```

## Features

### ✅ Implemented
- Real-time messaging via WebSocket
- Individual chat (mentor ↔ student)
- Group chat (worklet teams)
- Message history loading
- WhatsApp-style UI
- Group profile viewing
- Auto-reconnection
- Message timestamps
- Sender names in groups

### 🚧 Can Be Added
- Read receipts (✓✓)
- Typing indicators
- File/image sharing
- Message reactions
- Push notifications
- Message search
- Voice messages

## Troubleshooting

### Messages Not Sending?
1. Check if backend is running
2. Verify WebSocket connection (console logs)
3. Check access token is valid
4. Ensure user has permission (member of chat/group)

### Messages Not Receiving?
1. Check WebSocket is connected (look for "WebSocket connected" in console)
2. Verify `handleWebSocketMessage()` is called
3. Check if message type matches ("new_message" vs "new_group_message")
4. Ensure selectedRoom matches incoming message room/group

### WebSocket Keeps Disconnecting?
1. Check network connection
2. Verify token hasn't expired
3. Look for errors in backend logs
4. Check if ping/pong is working

## Code Examples

### Sending Individual Message
```javascript
const handleSendMessage = async () => {
  if (!newMessage.trim()) return;
  
  try {
    const response = await chatService.sendMessage(
      selectedRoom.room_id, 
      newMessage.trim()
    );
    setMessages(prev => [...prev, response]);
    setNewMessage('');
  } catch (error) {
    console.error('Error sending message:', error);
  }
};
```

### Sending Group Message
```javascript
const handleSendGroupMessage = async () => {
  if (!newMessage.trim()) return;
  
  try {
    const message = await chatService.sendGroupMessage(
      selectedRoom.group_id,
      newMessage.trim()
    );
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  } catch (error) {
    console.error('Error sending group message:', error);
  }
};
```

### Handling Incoming Messages
```javascript
const handleWebSocketMessage = (data) => {
  if (data.type === 'new_message') {
    // Individual chat message
    const message = data.data;
    if (selectedRoom?.room_id === message.room_id) {
      setMessages(prev => [...prev, message]);
    }
    fetchRooms(); // Update chat list
  } else if (data.type === 'new_group_message') {
    // Group chat message
    const message = data.data;
    if (selectedRoom?.group_id === message.group_id) {
      setMessages(prev => [...prev, message]);
    }
    fetchGroupChats(); // Update chat list
  }
};
```

## Database Schema

### Chat Tables
```sql
chat_rooms           - Individual chat rooms
chat_messages        - Individual messages
group_chats          - Group chat rooms  
group_chat_members   - Group membership
group_chat_messages  - Group messages
```

## Security

- ✅ JWT token authentication
- ✅ User must be room member to send/view messages
- ✅ WebSocket validates token on connect
- ✅ Backend checks permissions before broadcasting
- ✅ Messages only sent to authorized users

## Performance

- WebSocket keeps connection alive with ping/pong
- Messages broadcast only to active connections
- Inactive connections automatically cleaned up
- Message history loaded with pagination
- Auto-reconnect on network issues

---

**Need Help?** Check the browser console for WebSocket connection status and errors!
