<div align="center">

# 🎓 Worklet Management System (WMS)
## Samsung PRISM Program

A comprehensive full-stack platform for managing academic worklets, facilitating mentor-student collaboration, and tracking research outcomes including publications, patents, and commercializations.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8%2B-blue)](https://python.org)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688)](https://fastapi.tiangolo.com)

</div>

---

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [🛠️ Tech Stack](#️-tech-stack)
- [✨ Key Features](#-key-features)
- [🚀 Installation and Setup](#-installation-and-setup)
- [🧩 Database Schema](#-database-schema)
- [📁 Folder Structure](#-folder-structure)
- [📖 Usage Instructions](#-usage-instructions)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [📞 Contact](#-contact)

---

## 🎯 Overview

The **Worklet Management System (WMS)** is a sophisticated platform developed under the Samsung PRISM Program to streamline academic research management. The system enables seamless mentor-student collaboration, worklet assignment and tracking, comprehensive evaluation processes, and management of research outcomes including publications, patents, and commercializations.

### 🎯 Objectives
- **Streamline Worklet Management**: Efficient creation, assignment, and tracking of academic projects
- **Enhance Collaboration**: Facilitate mentor-student interactions and feedback loops
- **Track Research Outcomes**: Comprehensive management of publications, patents, and commercializations
- **Provide Analytics**: Insightful dashboards and reporting for stakeholders
- **Ensure Security**: Role-based access control with JWT authentication

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **Vite** - Next-generation frontend tooling
- **Tailwind CSS** - Utility-first CSS framework
- **ShadCN UI** - Beautiful and accessible component library
- **React Router v6** - Declarative routing
- **React Hook Form** - Performant forms with easy validation

### Backend
- **FastAPI** - Modern, fast web framework for Python
- **SQLAlchemy 2.x** - Python SQL toolkit and ORM
- **PyMySQL** - Pure Python MySQL client
- **python-jose** - JWT implementation
- **Passlib** - Password hashing library
- **Pydantic** - Data validation using Python type hints

### Database & Tools
- **MySQL 8** - Relational database management system
- **Redis 7** - In-memory data structure store (OTP caching)
- **Git & GitHub** - Version control and collaboration
- **VS Code** - Integrated development environment

---

## ✨ Key Features

### 🔐 Authentication & Security
- **JWT-based Authentication** with access and refresh tokens
- **OTP-based Registration** via email verification
- **Role-based Access Control** (Admin, Mentor, Professor, Student)
- **Secure Password Hashing** using Argon2 and bcrypt

### 📊 Worklet Management
- **Worklet Lifecycle Tracking** (To Start, Ongoing, Completed, On Hold, Dropped/Terminated)
- **Progress Monitoring** with percentage-based tracking
- **Mentor-Student Assignment** and collaboration tools
- **Certificate ID Generation** for completed worklets
- **Real-time Status Updates** and notifications

### 💡 Mentor-Student Collaboration
- **Suggestion System** - Mentors can share actionable suggestions with students
- **Persistent Feedback** - All suggestions stored in database with tracking
- **Interactive Response** - Students can mark suggestions as helpful, respond, and mark as read
- **Categorized Suggestions** - Organized by category and priority (low/medium/high)

### 🎯 Milestone Review System
- **Student Milestone Creation** - Students can add milestones with custom fields, attachments, and GitHub status
- **Dual-Role Feedback** - Both mentors and professors can provide independent feedback on milestones
- **Role-Based Reviews** - Separate "Review as Mentor" and "Review as Professor" buttons
- **Persistent Feedback Storage** - All milestone feedbacks stored with reviewer role and timestamp
- **Visibility Control** - Only assigned mentors/professors can review worklet milestones
- **Feedback Display** - Students see both mentor and professor feedback displayed separately

### 🎯 Evaluation & Feedback
- **Comprehensive Evaluation System** with scoring and feedback
- **Real-time Progress Updates** and notifications
- **Performance Analytics** and reporting dashboards

### 📚 Portfolio Management
- **Publication Tracking** with abstract, authors, and document upload
- **Patent Management** with inventor details and status tracking
- **Commercialization Records** with revenue tracking
- **Achievement Documentation** with categorization

### 📈 Analytics & Reporting
- **Interactive Dashboards** for different user roles
- **College-wise Statistics** with worklet distribution and performance metrics
- **Export Capabilities** for reports and data
- **Visual Analytics** for progress and outcome tracking
- **Performance Distribution** (Excellent/Good/Needs Attention)

---

## 🚀 Installation and Setup

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- MySQL 8.0
- Redis (optional, for OTP caching)

### 🔧 Backend Setup (FastAPI)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WorkletManagementSystem/prism-backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   # Windows
   .\.venv\Scripts\activate
   # Linux/Mac
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment configuration**
   Create a `.env` file in `prism-backend/`:
   ```env
   # Database
   DATABASE_URL=mysql+pymysql://root:password@localhost:3306/wms_db
   
   # JWT
   SECRET_KEY=your-super-secret-key-change-in-production
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_TOKEN_EXPIRE_MINUTES=10080
   
   # Email (for OTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   
   # Redis
   REDIS_URL=redis://localhost:6379/0
   
   # CORS
   ALLOWED_ORIGINS=http://localhost:3000
   ```

5. **Setup database**
   ```bash
   # Create MySQL database
   mysql -u root -p -e "CREATE DATABASE wms_db;"
   ```

6. **Run the backend**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 🎨 Frontend Setup (React)

1. **Navigate to frontend directory**
   ```bash
   cd ../prism-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   Create a `.env` file in `prism-frontend/`:
   ```env
   REACT_APP_API_BASE=http://localhost:8000
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

---

## 🧩 Database Schema

The WMS database consists of 11 main tables that handle user management, worklet tracking, evaluations, portfolio management, and milestone reviews. Below is an overview of the core tables and their relationships:

### 📊 Core Tables Overview

| Table Name | Primary Purpose | Key Columns |
|------------|----------------|-------------|
| **colleges** | Educational institutions | `college_id`, `college_name`, `location`, `established` |
| **users** | System users with roles | `user_id`, `name`, `email`, `role`, `college_id` |
| **user_profiles** | Extended user information | `user_id`, `bio`, `expertise`, `contact_number`, `linkedin` |
| **Prism_Worklet** | Academic projects/research | `WorkletID`, `CertID`, `Title`, `StatusID`, `Progress` |
| **user_worklet_association** | User-worklet relationships | `user_id`, `WorkletID`, `role_in_worklet` |
| **evaluations** | Performance assessments | `evaluation_id`, `user_id`, `WorkletID`, `score`, `feedback` |
| **Prism_Suggestion** | Mentor suggestions to students | `suggestion_id`, `worklet_id`, `mentor_id`, `suggestion_title`, `is_read` |
| **Prism_Milestone** | Student worklet milestones | `milestone_id`, `worklet_id`, `student_id`, `milestone_type`, `field1_value`, `field2_value` |
| **Prism_Milestone_Feedback** | Mentor/Professor feedback on milestones | `feedback_id`, `milestone_id`, `reviewer_id`, `reviewer_role`, `feedback_text` |
| **achievements** | User accomplishments | `achievement_id`, `user_id`, `title`, `type`, `year` |
| **papers** | Research publications | `paper_id`, `user_id`, `title`, `journal`, `publication_year` |
| **patents** | Patent applications | `patent_id`, `user_id`, `title`, `status`, `filing_year` |
| **commercializations** | Commercial outcomes | `commercialization_id`, `user_id`, `title`, `revenue` |

### 🔗 Entity Relationships

```
colleges (1) ←→ (many) users
users (1) ←→ (1) user_profiles
users (many) ←→ (many) Prism_Worklet [via user_worklet_association]
users (1) ←→ (many) evaluations
users (1) ←→ (many) achievements
users (1) ←→ (many) papers
users (1) ←→ (many) patents
users (1) ←→ (many) commercializations
users (mentor) (1) ←→ (many) Prism_Suggestion
users (student) (1) ←→ (many) Prism_Milestone
users (mentor/professor) (1) ←→ (many) Prism_Milestone_Feedback
Prism_Worklet (1) ←→ (many) evaluations
Prism_Worklet (1) ←→ (many) Prism_Suggestion
Prism_Worklet (1) ←→ (many) Prism_Milestone
Prism_Milestone (1) ←→ (many) Prism_Milestone_Feedback
Prism_Worklet (1) ←→ (many) papers (optional)
Prism_Worklet (1) ←→ (many) commercializations (optional)
```

### 🗃️ Complete Database Schema

<details>
<summary>Click to expand full SQL schema</summary>
Create a `.env` inside `prism-backend/` (values shown include defaults / examples):
```
# ---- Core ----
PROJECT_NAME=Samsung PRISM Backend
DEBUG=True

# ---- Database ----
DB_USER=root
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=prism
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/prism

# ---- JWT / Auth ----
SECRET_KEY=change-this-in-prod
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_MINUTES=10080  # 7 days

# ---- Email (Gmail SMTP example) ----
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youraddress@gmail.com
SMTP_PASS=app-specific-password
SMTP_SENDER=Prism System <youraddress@gmail.com>

# ---- Redis ----
REDIS_URL=redis://localhost:6379/0

# ---- CORS ----
ALLOWED_ORIGINS=http://localhost:3000

# ---- Uploads ----
UPLOAD_DIR=uploads
```

Frontend optional `.env` (create in `prism-frontend/`):
```
REACT_APP_API_BASE=http://localhost:8000
```

> The frontend currently may have hard-coded URLs; refactor services to use `process.env.REACT_APP_API_BASE` for portability.

---
## 5. Quick Start (Fastest Path)
```powershell
git clone <repo-url>
cd WorkletManagementSystem

# Backend
cd prism-backend
python -m venv .venv
./.venv/Scripts/Activate.ps1
pip install -r requirements.txt
copy .env.example .env   # (create one from the section above, if example added later)
uvicorn app.main:app --reload --port 8000

# In new terminal: Start Redis & MySQL if not using Docker
# (Recommended) Use Docker instead (see Section 6)

# Frontend
cd ../prism-frontend
npm install
npm start
```
Navigate to: http://localhost:3000

Seed users (new terminal):
```powershell
cd prism-backend
python seed_users.py
```

Log in with (example): `admin@example.com` / the password you entered (default fallback `changeme123`).

---
docker compose up --build
## 6. Database Schema
```sql
-- WMS Database Schema (MySQL 8.0+)

CREATE TABLE colleges (
  college_id INT AUTO_INCREMENT PRIMARY KEY,
  college_name VARCHAR(255) NOT NULL UNIQUE,
  location VARCHAR(255),
  established INT,
  infrastructure VARCHAR(255),
  area_of_expertise VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin','Mentor','Professor','Student') NOT NULL,
  college_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  active_till DATE NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_users_college FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE user_profiles (
  user_id INT PRIMARY KEY,
  avatar_url VARCHAR(255),
  bio TEXT,
  linkedin VARCHAR(255),
  portfolio_url VARCHAR(255),
  expertise VARCHAR(255),
  qualification VARCHAR(100),
  experience_years INT,
  contact_number VARCHAR(20),
  organization VARCHAR(150),
  github VARCHAR(255),
  handle VARCHAR(50),
  location VARCHAR(255),
  date_of_birth DATE,
  website VARCHAR(255),
  CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE worklets (
  worklet_id INT AUTO_INCREMENT PRIMARY KEY,
  cert_id VARCHAR(20) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  completed_date DATE,
  status ENUM('Approved','Ongoing','Completed','Dropped','On Hold') NOT NULL DEFAULT 'Ongoing',
  year INT NOT NULL,
  domain VARCHAR(100),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  worklet_progress INT NOT NULL DEFAULT 0,
  college_id INT NULL,
  CONSTRAINT fk_worklets_college FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE user_worklet_association (
  user_id INT NOT NULL,
  worklet_id INT NOT NULL,
  role_in_worklet ENUM('Mentor','Student','Professor') NOT NULL DEFAULT 'Student',
  PRIMARY KEY (user_id, worklet_id),
  CONSTRAINT fk_uwa_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_uwa_worklet FOREIGN KEY (worklet_id) REFERENCES worklets(worklet_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE evaluations (
  evaluation_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  worklet_id INT NOT NULL,
  score INT NOT NULL,
  feedback TEXT,
  evaluated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_eval_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_eval_worklet FOREIGN KEY (worklet_id) REFERENCES worklets(worklet_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE achievements (
  achievement_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  year INT,
  type ENUM('Award','Recognition','Other') NOT NULL DEFAULT 'Other',
  link VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ach_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE papers (
  paper_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  publication_year INT,
  journal VARCHAR(255),
  doi VARCHAR(255),
  link VARCHAR(255),
  abstract TEXT,
  authors_json TEXT,
  document_link VARCHAR(255),
  worklet_id INT NULL,
  worklet_cert_id VARCHAR(20),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_papers_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_papers_worklet FOREIGN KEY (worklet_id) REFERENCES worklets(worklet_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE patents (
  patent_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  application_number VARCHAR(100),
  filing_year INT,
  status ENUM('Filed','Granted','Published') NOT NULL DEFAULT 'Filed',
  link VARCHAR(255),
  description TEXT,
  inventors_json TEXT,
  document_link VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_patents_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE commercializations (
  commercialization_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  worklet_id INT NULL,
  title VARCHAR(255) NOT NULL,
  year INT,
  revenue DECIMAL(12,2),
  description TEXT,
  link VARCHAR(255),
  document_link VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comm_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_comm_worklet FOREIGN KEY (worklet_id) REFERENCES worklets(worklet_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Performance Indexes
CREATE UNIQUE INDEX ix_user_email ON users(email);
CREATE UNIQUE INDEX ix_worklet_cert_id ON worklets(cert_id);
CREATE INDEX ix_papers_user_id ON papers(user_id);
CREATE INDEX ix_patents_user_id ON patents(user_id);
CREATE INDEX ix_comm_user_id ON commercializations(user_id);
```
</details>

---

## 📁 Folder Structure

```
WorkletManagementSystem/
├── 📁 prism-backend/                 # FastAPI Backend
│   ├── 📁 app/
│   │   ├── 📄 main.py               # FastAPI application entry point
│   │   ├── 📄 auth.py               # Authentication & JWT handling
│   │   ├── 📄 database.py           # Database configuration & session
│   │   ├── 📄 models.py             # SQLAlchemy ORM models
│   │   ├── 📄 schemas.py            # Pydantic data validation schemas
│   │   ├── 📁 core/                 # Core utilities
│   │   │   ├── 📄 config.py         # Application configuration
│   │   │   ├── 📄 email_utils.py    # Email and OTP utilities
│   │   │   ├── 📄 rate_limiter.py   # Rate limiting functionality
│   │   │   └── 📄 redis_cache.py    # Redis caching utilities
│   │   └── 📁 routers/              # API route handlers
│   │       ├── 📄 associations.py   # User-worklet associations
│   │       ├── 📄 college.py        # College management
│   │       ├── 📄 dashboard.py      # Dashboard data endpoints
│   │       ├── 📄 evaluations.py    # Evaluation system
│   │       ├── 📄 health.py         # Health check endpoints
│   │       ├── 📄 mentors.py        # Mentor-specific operations
│   │       ├── 📄 milestones.py     # Milestone review system (student→mentor/professor)
│   │       ├── 📄 portfolio.py      # Portfolio management
│   │       ├── 📄 suggestions.py    # Suggestion system (mentor→student)
│   │       └── 📄 worklets.py       # Worklet CRUD operations
│   ├── 📄 requirements.txt          # Python dependencies
│   └── 📁 uploads/                  # File upload storage
│
├── 📁 prism-frontend/               # React Frontend
│   ├── 📁 public/                   # Static assets
│   ├── 📁 src/
│   │   ├── 📄 App.jsx              # Main React component
│   │   ├── 📄 index.tsx            # Application entry point
│   │   ├── 📄 api.js               # API client configuration
│   │   ├── 📁 components/          # Reusable UI components
│   │   │   ├── 📄 ActivityButton.jsx
│   │   │   ├── 📄 EvaluateModal.jsx
│   │   │   ├── 📄 FeedbackForm.jsx
│   │   │   ├── 📄 login.jsx
│   │   │   ├── 📄 ProtectedRoute.jsx
│   │   │   ├── 📄 RoleBasedRoute.jsx
│   │   │   ├── 📄 StatCard.jsx
│   │   │   └── 📄 WorkletDetailsPage.jsx
│   │   ├── 📁 layouts/             # Page layouts
│   │   │   ├── 📄 portfolio.jsx    # Portfolio management UI
│   │   │   ├── 📄 Colleges.jsx     # College management
│   │   │   ├── 📄 Dashboard.jsx    # Main dashboard
│   │   │   ├── 📄 Statistics.jsx   # Analytics views
│   │   │   ├── 📄 SuggestionModal.jsx  # Mentor suggestion modal
│   │   │   └── 📄 navColl.jsx      # College navigation
│   │   ├── 📁 pages/               # Main page components
│   │   ├── 📁 services/            # API service modules
│   │   ├── 📁 context/             # React context providers
│   │   ├── 📁 hooks/               # Custom React hooks
│   │   └── 📁 utils/               # Utility functions
│   ├── 📄 package.json             # Node.js dependencies
│   ├── 📄 tailwind.config.js       # Tailwind CSS configuration
│   └── 📄 tsconfig.json            # TypeScript configuration
│
├── 📄 README.md                     # Project documentation
└── 📄 SECURITY.md                   # Security guidelines
```

---

## 📖 Usage Instructions

### 🔐 Authentication Flow

1. **User Registration**
   ```bash
   POST /auth/request-otp
   Content-Type: application/json
   
   {
     "email": "student@university.edu"
   }
   ```

2. **OTP Verification**
   ```bash
   POST /auth/verify-otp
   Content-Type: application/json
   
   {
     "email": "student@university.edu",
     "otp": "123456"
   }
   ```

3. **Password Setup**
   ```bash
   POST /auth/set-password
   Content-Type: application/json
   
   {
     "email": "student@university.edu",
     "password": "securepassword123"
   }
   ```

4. **Login**
   ```bash
   POST /auth/login
   Content-Type: application/x-www-form-urlencoded
   
   username=student@university.edu&password=securepassword123
   ```

### 📊 Dashboard Features

#### Student Dashboard
- View assigned worklets and their progress
- **Receive and respond to mentor suggestions**
- Mark suggestions as helpful or read
- Submit portfolio items (papers, patents, achievements)
- Track evaluation scores and feedback
- Upload documents and manage profile

#### Mentor Dashboard
- Assign worklets to students
- **Share suggestions** with students on specific worklets
- Evaluate student performance
- Provide feedback and scores
- Monitor overall progress
- Track suggestion responses and engagement

#### Admin Dashboard
- Manage users and colleges
- Oversee all worklets and evaluations
- Generate comprehensive reports
- System configuration and maintenance

### 📝 API Examples

**Create a New Worklet**
```bash
POST /api/worklets
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "AI-Based Healthcare System",
  "description": "Developing an AI system for medical diagnosis",
  "domain": "Artificial Intelligence",
  "year": 2024,
  "start_date": "2024-01-15",
  "end_date": "2024-06-15"
}
```

**Submit a Research Paper**
```bash
POST /api/portfolio/papers
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

title=Machine Learning in Healthcare
publication_year=2024
journal=IEEE Transactions on AI
authors_json=[{"name":"John Doe"},{"name":"Jane Smith"}]
file=@research_paper.pdf
```

---

## 🤝 Contributing

We welcome contributions to the Worklet Management System! Please follow these guidelines:

### 📋 How to Contribute

1. **Fork the repository**
   ```bash
   git fork https://github.com/your-username/WorkletManagementSystem
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-new-feature
   ```

3. **Make your changes**
   - Follow existing code style and conventions
   - Add appropriate tests for new functionality
   - Update documentation as needed

4. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing new feature"
   ```

5. **Push to your branch**
   ```bash
   git push origin feature/amazing-new-feature
   ```

6. **Open a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Ensure all tests pass

### 🔧 Development Guidelines

- **Backend**: Follow PEP 8 style guidelines for Python
- **Frontend**: Use ESLint and Prettier for consistent formatting
- **Database**: Always create migrations for schema changes
- **Testing**: Write tests for new features and bug fixes
- **Documentation**: Update README and inline comments

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Samsung PRISM Program

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 📞 Contact

### 👨‍💻 Development Team

**Lead Developer**
- **Name**: [Your Name]
- **Role**: Full-Stack Developer
- **Email**: developer@samsungprism.edu
- **LinkedIn**: [Your LinkedIn Profile]

**Project Coordinator**
- **Name**: [Coordinator Name]
- **Role**: Samsung PRISM Program Manager
- **Email**: coordinator@samsungprism.edu

### 🏢 Organization

**Samsung PRISM Program**
- **Website**: [Program Website]
- **Email**: support@samsungprism.edu
- **Documentation**: [Documentation Portal]

---

<div align="center">

### 🌟 Built with ❤️ under the Samsung PRISM Program

**Empowering the next generation of innovators through technology and collaboration**

</div>

