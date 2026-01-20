# Student Registration Form - Setup Guide

This document explains the student registration form feature that appears after signup.

## Overview

After a student signs up and logs in, they will be automatically redirected to a registration form to collect additional profile information before accessing the dashboard.

## Components Created

### Backend

1. **Database Migration** (`initdb/007_add_profile_completed.sql`)
   - Adds `profile_completed` field to `users` table
   - Adds student-specific fields to `user_profiles` table (year_of_study, program, student_id, skills, interests)

2. **Models** (`app/models.py`)
   - Updated `User` model with `profile_completed` field
   - Updated `UserProfile` model with student-specific fields

3. **Schemas** (`app/schemas.py`)
   - Added `StudentRegistrationCreate` schema for registration data
   - Added `StudentRegistrationResponse` schema for API response
   - Updated `UserResponse` to include `profile_completed`

4. **API Endpoints** (`app/routers/students.py`)
   - `POST /api/students/complete-registration` - Complete student registration
   - `GET /api/students/registration-status` - Check if registration is completed
   - `GET /api/students/me` - Get current student profile

### Frontend

1. **Registration Form** (`Students/StudentRegistrationForm.jsx`)
   - Beautiful multi-section form with validation
   - Sections: Personal Info, Academic Info, Professional Info, Social Links
   - Required fields: contact_number, date_of_birth, year_of_study, program, student_id

2. **Registration Wrapper** (`components/RequireRegistration.jsx`)
   - Checks registration status before allowing access to student pages
   - Automatically redirects to registration form if not completed
   - Shows loading state during check

3. **Updated Routing** (`App.jsx`)
   - Added `/student-registration` route
   - Wrapped student routes with `RequireRegistration` component

## Setup Instructions

### 1. Run Database Migration

Execute the migration SQL file:

```bash
# For MySQL
mysql -u your_user -p your_database < prism-backend/initdb/007_add_profile_completed.sql

# Or if using Docker
docker exec -i your_mysql_container mysql -u root -p your_database < prism-backend/initdb/007_add_profile_completed.sql
```

### 2. Restart Backend

```bash
cd prism-backend
# If using Docker
docker-compose down
docker-compose up -d

# Or if running directly
# Stop the current process and restart
python -m uvicorn app.main:app --reload
```

### 3. Restart Frontend

No special steps needed, just ensure the frontend is running:

```bash
cd prism-frontend
npm start
```

## How It Works

1. **Student Signs Up**: Student creates account through normal signup flow
2. **Login**: Student logs in and gets authentication token
3. **Automatic Redirect**: Upon accessing `/student-dashboard`:
   - `RequireRegistration` wrapper checks registration status via API
   - If `profile_completed` is `false`, redirects to `/student-registration`
   - If `profile_completed` is `true`, shows dashboard normally
4. **Complete Registration**: Student fills out the registration form
5. **Access Dashboard**: After submission, `profile_completed` is set to `true` and student can access all features

## Fields Collected

### Required Fields
- Contact Number
- Date of Birth
- Year of Study (1-6)
- Program/Course
- Student ID/Roll Number

### Optional Fields
- Location
- Bio
- Skills
- Interests
- LinkedIn Profile
- GitHub Profile
- Portfolio Website

## API Endpoints

### Complete Registration
```
POST /api/students/complete-registration
Authorization: Bearer <token>

Request Body:
{
  "contact_number": "+1234567890",
  "date_of_birth": "2000-01-01",
  "location": "City, Country",
  "year_of_study": 2,
  "program": "Computer Science",
  "student_id": "STU202401234",
  "bio": "Optional bio",
  "skills": "Python, React, ML",
  "interests": "AI, Web Dev",
  "linkedin": "https://linkedin.com/in/profile",
  "github": "https://github.com/username",
  "portfolio_url": "https://portfolio.com"
}

Response:
{
  "message": "Registration completed successfully",
  "profile_completed": true
}
```

### Check Registration Status
```
GET /api/students/registration-status
Authorization: Bearer <token>

Response:
{
  "profile_completed": true,
  "role": "Student"
}
```

## Security

- All endpoints require authentication (Bearer token)
- Only students can access registration endpoints
- Registration can only be completed once
- Form validation on both frontend and backend

## Notes

- Existing students will have `profile_completed` = `false` after migration
- They will be prompted to complete registration on next login
- The wrapper only applies to student routes, not mentor/professor routes
- Registration form has a modern, responsive design matching PRISM's style
