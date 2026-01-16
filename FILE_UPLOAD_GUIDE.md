# Chat File Upload Feature

## Overview
The chat system now supports file and image uploads in both student and mentor group chats.

## Features
- **Image uploads**: JPEG, PNG, GIF, WebP
- **Document uploads**: PDF, DOC, DOCX, XLS, XLSX
- **File size limit**: 10MB per file
- **Inline image preview**: Images are displayed directly in the chat
- **Download support**: Non-image files can be downloaded
- **Attachment previews**: See attached files before sending

## Setup Instructions

### 1. Database Migration
Run the database migration to add the attachments column:

```bash
cd prism-backend
mysql -u root -p prism < initdb/005_add_attachments.sql
```

### 2. Create Uploads Directory
The backend needs a directory to store uploaded files:

```bash
cd prism-backend
mkdir uploads
```

### 3. Update Environment Variables (Optional)
You can customize file upload settings in `.env`:

```env
# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf
```

### 4. Restart Backend Server
```bash
cd prism-backend
python -m uvicorn app.main:app --reload
```

## Usage

### For Users

#### Sending Files
1. Open a group chat
2. Click the paperclip icon (📎) next to the message input
3. Select a file from your device
4. The file will upload and show a preview
5. Add an optional text message
6. Click send

#### Viewing Files
- **Images**: Displayed inline in the chat bubble. Click to open full size in a new tab
- **Documents**: Shown with file icon and name. Click to download

#### Removing Attachments
- Click the X button on any attachment preview before sending to remove it

### For Developers

#### Backend Endpoints

**Upload File**
```http
POST /api/chat/upload
Content-Type: multipart/form-data

Response:
{
  "filename": "abc-123.jpg",
  "original_filename": "my-image.jpg",
  "url": "/api/chat/files/abc-123.jpg",
  "content_type": "image/jpeg",
  "size": 123456
}
```

**Get File**
```http
GET /api/chat/files/{filename}

Returns: FileResponse with the actual file
```

**Send Message with Attachment**
```http
POST /api/chat/groups/messages
Content-Type: application/json

{
  "worklet_id": 1,
  "message_text": "Check this out!",
  "attachments": [
    {
      "filename": "abc-123.jpg",
      "original_filename": "my-image.jpg",
      "url": "/api/chat/files/abc-123.jpg",
      "content_type": "image/jpeg",
      "size": 123456
    }
  ]
}
```

#### Database Schema

The `attachments` column in both `chat_messages` and `group_chat_messages` tables stores JSON:

```json
[
  {
    "filename": "abc-123.jpg",
    "original_filename": "screenshot.jpg",
    "url": "/api/chat/files/abc-123.jpg",
    "content_type": "image/jpeg",
    "size": 245678
  }
]
```

#### Frontend Components

**File Upload State**
```javascript
const [attachments, setAttachments] = useState([]);
const [uploadingFile, setUploadingFile] = useState(false);
const fileInputRef = useRef(null);
```

**Upload Handler**
```javascript
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
  }
};
```

## Security Considerations

1. **File Type Validation**: Only allowed file types can be uploaded
2. **File Size Limits**: Maximum 10MB per file (configurable)
3. **Path Traversal Protection**: Files are restricted to the upload directory
4. **Unique Filenames**: UUIDs prevent filename conflicts
5. **Authentication Required**: All upload endpoints require valid JWT token

## Troubleshooting

### Files Not Uploading
- Check that the `uploads` directory exists and is writable
- Verify file size is under the limit
- Ensure file type is in the allowed list

### Images Not Displaying
- Check that the backend URL is correct (currently hardcoded to `http://localhost:8000`)
- Verify the file exists in the uploads directory
- Check browser console for CORS errors

### Database Errors
- Ensure the migration has been run
- Check that JSON column type is supported by your MySQL version (5.7+)

## Future Enhancements

Potential improvements for the file upload feature:

1. **Cloud Storage**: Use S3/Azure Blob for production
2. **Image Thumbnails**: Generate thumbnails for faster loading
3. **Image Compression**: Reduce file sizes automatically
4. **Multiple File Selection**: Upload multiple files at once
5. **Drag and Drop**: Drag files into the chat window
6. **File Preview Modal**: Full-screen preview for images
7. **Video Support**: Add video file uploads
8. **Progress Indicators**: Show upload progress
9. **Virus Scanning**: Integrate antivirus checking
10. **CDN Integration**: Serve files through CDN for better performance
