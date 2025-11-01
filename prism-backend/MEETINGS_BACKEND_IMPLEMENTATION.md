# Backend Implementation for Meetings Frontend

## 📋 Overview
This document outlines the backend API endpoints implemented to support the Meetings page frontend functionality.

## 🔌 New API Endpoints Added

### 1. **GET /api/meetings/mentor/worklets**
**Purpose**: Get worklets available for meeting scheduling
**Filters**: 
- Only returns ongoing and on-hold worklets (excludes dropped/completed)
- Optional college_id filter
- Only returns worklets where user is assigned as Mentor

**Response**:
```json
[
  {
    "id": 1,
    "worklet_cert_id": "2STS16CITB",
    "title": "AI Research Project",
    "name": "AI Research Project",
    "status": "ongoing",
    "students": [{"id": 1, "name": "Student 1"}, ...],
    "professors": [{"id": 1, "name": "Professor 1"}, ...],
    "college": "VIT Vellore"
  }
]
```

### 2. **GET /api/meetings/colleges**
**Purpose**: Get list of colleges where mentor has worklets
**Response**:
```json
[
  {
    "college_id": 1,
    "college_name": "VIT Vellore",
    "id": 1
  }
]
```

### 3. **PATCH /api/meetings/{meeting_id}/reschedule**
**Purpose**: Reschedule a meeting to new date/time
**Request Body**:
```json
{
  "start_datetime": "2024-11-20T14:00:00",
  "duration_minutes": 60,
  "reason": "Optional reschedule reason"
}
```

**Features**:
- Only meeting organizer can reschedule
- Cannot reschedule completed/cancelled meetings
- Automatically notifies all participants via email
- Updates meeting timestamps

### 4. **DELETE /api/meetings/{meeting_id}/cancel**
**Purpose**: Cancel a meeting
**Features**:
- Only meeting organizer can cancel
- Prevents double cancellation
- Automatically notifies all participants via email
- Sets meeting status to "cancelled"

**Response**:
```json
{
  "message": "Meeting cancelled successfully",
  "meeting_id": 1,
  "status": "cancelled"
}
```

### 5. **POST /api/meetings/{meeting_id}/send-reminder**
**Purpose**: Send meeting reminder notifications to participants
**Request Parameters**:
- `minutes_before`: int (default: 15) - How many minutes before meeting to send reminder
- `recipients`: str (default: "all") - Who to send to: "all", "mentors", "students", "professors"

**Response**:
```json
{
  "message": "Reminders sent to 5 participants",
  "recipients_count": 5,
  "minutes_before": 15
}
```

## 🔐 Authentication & Authorization
All endpoints require:
- Valid JWT access token in Authorization header
- User must be authenticated
- Authorization checks ensure:
  - Only mentors can create/manage meetings for their assigned worklets
  - Only meeting organizer can reschedule/cancel
  - Worklets must be assigned to the mentor

## 📧 Email Notifications
Automatic notifications are sent for:
- **Meeting Created**: Invitation sent to all worklet participants
- **Meeting Rescheduled**: Update sent to all participants
- **Meeting Cancelled**: Cancellation notice sent to all participants
- **Meeting Reminder**: Customizable reminder (configurable minutes before)

## ✅ Validation Rules

### Meeting Creation:
- Mentor must be assigned to all selected worklets
- Worklets must have "ongoing" or "on-hold" status (not dropped/completed)
- Start time must be in the future
- If recurring, repeat_until must be provided
- repeat_until must be after start_datetime

### Meeting Rescheduling:
- Cannot reschedule completed or cancelled meetings
- New time must be in the future
- Must be meeting organizer

### Meeting Cancellation:
- Cannot cancel already cancelled meetings
- Must be meeting organizer

## 🔄 Business Logic

### Status Calculation:
- **upcoming**: Meeting start time is in the future
- **live**: Current time is between start and end time
- **completed**: Current time is after end time
- **cancelled**: Meeting has been cancelled

### Participant Count:
- Calculated as: students + professors
- Retrieved from UserWorkletAssociation table
- Used for display in meeting cards

### Worklet Filtering:
- **Status Filter**: Only "ongoing", "on hold", "on-hold" worklets shown
- **Role Filter**: Only worklets where user is "Mentor"
- **College Filter**: Optional filter by college_id

## 🎯 Integration Points

### Frontend Calls These Endpoints:
1. `fetchMeetings()` → GET /api/meetings/
2. `fetchColleges()` → GET /api/meetings/colleges
3. `fetchMentorWorklets()` → GET /api/meetings/mentor/worklets?college_id={id}
4. `rescheduleMeeting()` → PATCH /api/meetings/{id}/reschedule
5. `cancelMeeting()` → DELETE /api/meetings/{id}/cancel
6. `sendMeetingReminder()` → POST /api/meetings/{id}/send-reminder

### Backend Dependencies:
- `send_meeting_notification()` - Email service utility
- `get_worklet_participants()` - Helper to get worklet members
- `check_mentor_owns_worklets()` - Authorization helper
- Database models: Meeting, Worklet, User, UserWorkletAssociation, College

## 🚀 Usage Examples

### Create Meeting for Multiple Worklets:
```bash
POST /api/meetings/
{
  "title": "Project Review",
  "description": "Quarterly review meeting",
  "college_id": 1,
  "worklet_ids": [1, 2, 3],
  "start_datetime": "2024-11-20T10:00:00",
  "duration_minutes": 60,
  "meeting_link": "https://teams.microsoft.com/...",
  "repeat_days": "Mon,Wed,Fri",
  "repeat_until": "2024-12-31"
}
```

### Reschedule Meeting:
```bash
PATCH /api/meetings/123/reschedule/
{
  "start_datetime": "2024-11-25T14:00:00",
  "duration_minutes": 90
}
```

### Send Reminder:
```bash
POST /api/meetings/123/send-reminder/?minutes_before=30&recipients=all
```

## 📊 Error Handling

The API returns appropriate HTTP status codes:
- **200**: Success
- **201**: Created
- **400**: Bad request (validation error)
- **401**: Unauthorized (invalid token)
- **403**: Forbidden (authorization failed)
- **404**: Not found (meeting/worklet doesn't exist)
- **500**: Server error

## 🔍 Testing Checklist
- [ ] Create meeting with single worklet
- [ ] Create meeting with multiple worklets
- [ ] Create recurring meetings
- [ ] Reschedule meeting
- [ ] Cancel meeting
- [ ] Send reminder notification
- [ ] Verify email notifications sent
- [ ] Verify authorization checks
- [ ] Verify status calculations
- [ ] Test with different user roles