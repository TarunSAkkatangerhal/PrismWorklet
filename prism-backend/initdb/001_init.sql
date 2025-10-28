-- ========================
-- 1. Colleges
-- ========================
CREATE TABLE colleges (
  college_id INT AUTO_INCREMENT PRIMARY KEY,
  college_name VARCHAR(255) UNIQUE NOT NULL,
  location VARCHAR(255),
  established YEAR,
  infrastructure VARCHAR(100),
  area_of_expertise TEXT
);

-- ========================
-- 2. Users
-- ========================
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin','Mentor','Professor','Student') NOT NULL,
  college_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  active_till DATE,
  is_active TINYINT DEFAULT 1,
  CONSTRAINT fk_users_college FOREIGN KEY (college_id) REFERENCES colleges(college_id)
);

-- ========================
-- 3. User Profiles
-- ========================
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
  CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE
);

-- ========================
-- 3a. Status Table
-- ========================
CREATE TABLE status (
  StatusID INT PRIMARY KEY,
  StatusName VARCHAR(50) NOT NULL
);

create table WorkletStage(StageID int primary key,Stage varchar(45));

-- Insert Stage Data
INSERT INTO WorkletStage (StageID, Stage) VALUES
  (1, 'First Review'),
  (2, 'Second Review'),
  (3, 'Mid Review'),
  (4, 'Fourth Review'),
  (5, 'End Review'),
  (6, 'Extended Review'),
  (7, 'Add OC');

-- ========================
-- 3b. TechDomain Lookup Table
-- ========================
CREATE TABLE TechDomain (
  TechDomainID INT AUTO_INCREMENT PRIMARY KEY,
  DomainName VARCHAR(100) UNIQUE NOT NULL,
  Description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 3c. TeamMG Lookup Table
-- ========================
CREATE TABLE TeamMG (
  TeamMGID INT AUTO_INCREMENT PRIMARY KEY,
  TeamName VARCHAR(100) UNIQUE NOT NULL,
  Description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 4. Worklets
-- ========================
CREATE TABLE Prism_Worklet (
  WorkletID INT NOT NULL AUTO_INCREMENT,
  Title LONGTEXT NOT NULL,
  ImagePath LONGTEXT NOT NULL,
  ProblemStmt LONGTEXT NOT NULL,
  Expectations LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  Prerequest LONGTEXT NOT NULL,
  TechDomainID INT NOT NULL,
  GitHubUrl VARCHAR(500) DEFAULT NULL,
  StatusID INT NOT NULL,
  CreatedOn DATETIME NOT NULL,
  CreatedMentorID INT NOT NULL,
  Progress INT NOT NULL,
  StartDate DATE NOT NULL,
  EndDate DATE NOT NULL,
  CertID VARCHAR(500) DEFAULT NULL,
  TeamMGID INT DEFAULT NULL,
  GroupMGID INT DEFAULT NULL,
  PartMGID INT DEFAULT NULL,
  StudentCount INT DEFAULT NULL,
  Degree INT DEFAULT NULL,
  Stream INT DEFAULT NULL,
  WorkletComplexity INT DEFAULT NULL,
  Research INT DEFAULT NULL,
  Doc INT DEFAULT NULL,
  DataCollection INT DEFAULT NULL,
  LinkedProject INT DEFAULT NULL,
  ProjectID INT DEFAULT NULL,
  Performance VARCHAR(45) DEFAULT NULL,
  RiskStatus VARCHAR(45) DEFAULT NULL,
  RiskStatusNote LONGTEXT,
  PaperDetail INT DEFAULT NULL,
  PatentDetail INT DEFAULT NULL,
  CommercializationDetail INT DEFAULT NULL,
  GroupHeadComments LONGTEXT,
  IsSync INT DEFAULT NULL,
  IsActive INT NOT NULL,
  IsExcellent INT DEFAULT 0,
  StageID INT DEFAULT NULL,
  IsDataCollected INT DEFAULT 0,
  IsGenAIFF INT DEFAULT 0,
  Modality INT DEFAULT NULL,
  Category INT DEFAULT NULL,
  CollegeID INT DEFAULT NULL,
  PRIMARY KEY (WorkletID),
  CONSTRAINT fk_worklet_status FOREIGN KEY (StatusID)
      REFERENCES status(StatusID)
      ON DELETE RESTRICT
      ON UPDATE CASCADE,
  CONSTRAINT fk_worklet_college FOREIGN KEY (CollegeID)
      REFERENCES colleges(college_id)
      ON DELETE SET NULL
      ON UPDATE CASCADE,
  CONSTRAINT fk_worklet_stage FOREIGN KEY (StageID)
      REFERENCES WorkletStage(StageID)
      ON DELETE SET NULL
      ON UPDATE CASCADE,
  CONSTRAINT fk_worklet_techdomain FOREIGN KEY (TechDomainID)
      REFERENCES TechDomain(TechDomainID)
      ON DELETE RESTRICT
      ON UPDATE CASCADE,
  CONSTRAINT fk_worklet_team FOREIGN KEY (TeamMGID)
      REFERENCES TeamMG(TeamMGID)
      ON DELETE SET NULL
      ON UPDATE CASCADE
) ENGINE=InnoDB 
  AUTO_INCREMENT=2430 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_0900_ai_ci;

-- ========================
-- 4. User ↔ Worklet Association
-- ========================
CREATE TABLE user_worklet_association (
  user_id INT NOT NULL,
  WorkletID INT NOT NULL,
  role_in_worklet ENUM('Mentor','Student','Professor') NOT NULL DEFAULT 'Student',
  PRIMARY KEY (user_id, WorkletID),
  CONSTRAINT fk_uw_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_uw_worklet FOREIGN KEY (WorkletID)
    REFERENCES Prism_Worklet(WorkletID) ON DELETE CASCADE
);

-- ========================
-- 6. Evaluations
-- ========================
CREATE TABLE evaluations (
  evaluation_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  WorkletID INT NOT NULL,
  score INT NOT NULL,
  feedback TEXT,
  evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_eval_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_eval_worklet FOREIGN KEY (WorkletID)
    REFERENCES Prism_Worklet(WorkletID) ON DELETE CASCADE
);

-- ========================
-- 7. Achievements
-- ========================
CREATE TABLE achievements (
  achievement_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  WorkletID INT DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  year INT,
  type ENUM('Award','Recognition','Other') NOT NULL DEFAULT 'Other',
  link VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_ach_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_ach_worklet FOREIGN KEY (WorkletID)
    REFERENCES Prism_Worklet(WorkletID) ON DELETE SET NULL
);

-- ========================
-- 8. Papers
-- ========================
CREATE TABLE papers (
  paper_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  WorkletID INT DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  publication_year INT,
  journal VARCHAR(255),
  doi VARCHAR(255),
  link VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_paper_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_paper_worklet FOREIGN KEY (WorkletID)
    REFERENCES Prism_Worklet(WorkletID) ON DELETE SET NULL
);

-- ========================
-- 9. Patents
-- ========================
CREATE TABLE patents (
  patent_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  WorkletID INT DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  application_number VARCHAR(100),
  filing_year INT,
  status ENUM('Filed','Granted','Published') NOT NULL DEFAULT 'Filed',
  link VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_patent_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_patent_worklet FOREIGN KEY (WorkletID)
    REFERENCES Prism_Worklet(WorkletID) ON DELETE SET NULL
);

-- ========================
-- 10. Commercializations
-- ========================
CREATE TABLE commercializations (
  commercialization_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  WorkletID INT DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  year INT,
  revenue DECIMAL(12,2),
  description TEXT,
  link VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_com_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_com_worklet FOREIGN KEY (WorkletID)
    REFERENCES Prism_Worklet(WorkletID) ON DELETE SET NULL
);

-- ========================
-- 11. Prism Suggestions
-- ========================

CREATE TABLE IF NOT EXISTS Prism_Suggestion (
    suggestion_id INT AUTO_INCREMENT PRIMARY KEY,
    worklet_id INT NOT NULL,
    mentor_id INT NOT NULL,
    suggestion_title VARCHAR(100) NOT NULL,
    suggestion_content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'General',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    is_helpful BOOLEAN DEFAULT NULL,
    student_response TEXT DEFAULT NULL,
    response_date DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (worklet_id) REFERENCES Prism_Worklet(WorkletID) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_worklet_id (worklet_id),
    INDEX idx_mentor_id (mentor_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================
-- 12. Helpful Indexes
-- ========================
CREATE UNIQUE INDEX ix_user_email ON users(email);
CREATE UNIQUE INDEX ix_prism_cert_id ON Prism_Worklet(CertID);

-- ========================
-- 13. Meetings System
-- ========================

-- Main meetings table
CREATE TABLE meetings (
  meeting_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  college_id INT NOT NULL,
  organizer_id INT NOT NULL,
  start_datetime DATETIME NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  meeting_link VARCHAR(500) NOT NULL,
  status ENUM('upcoming', 'live', 'completed', 'cancelled') NOT NULL DEFAULT 'upcoming',
  -- Recurring meeting fields
  repeat_days VARCHAR(50) DEFAULT NULL COMMENT 'Comma-separated weekday abbreviations: Mon,Wed,Fri',
  repeat_until DATE DEFAULT NULL,
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Foreign keys
  CONSTRAINT fk_meeting_college FOREIGN KEY (college_id)
    REFERENCES colleges(college_id) ON DELETE CASCADE,
  CONSTRAINT fk_meeting_organizer FOREIGN KEY (organizer_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  -- Indexes
  INDEX idx_meeting_college (college_id),
  INDEX idx_meeting_organizer (organizer_id),
  INDEX idx_meeting_datetime (start_datetime),
  INDEX idx_meeting_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Meeting-Worklet association table (many-to-many)
-- Stores which worklets are involved in each meeting
CREATE TABLE meeting_worklet_association (
  meeting_id INT NOT NULL,
  WorkletID INT NOT NULL,
  scheduled_datetime DATETIME NOT NULL COMMENT 'Specific start time for this worklet in the meeting',
  PRIMARY KEY (meeting_id, WorkletID),
  CONSTRAINT fk_mw_meeting FOREIGN KEY (meeting_id)
    REFERENCES meetings(meeting_id) ON DELETE CASCADE,
  CONSTRAINT fk_mw_worklet FOREIGN KEY (WorkletID)
    REFERENCES Prism_Worklet(WorkletID) ON DELETE CASCADE,
  INDEX idx_mw_meeting (meeting_id),
  INDEX idx_mw_worklet (WorkletID),
  INDEX idx_mw_datetime (scheduled_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_uw_role ON user_worklet_association(role_in_worklet);
CREATE INDEX idx_mw_datetime_worklet ON meeting_worklet_association(scheduled_datetime, WorkletID);


-- Meeting recurrence table (for recurring meetings)
-- Stores individual occurrences of recurring meetings
CREATE TABLE meeting_recurrence (
  recurrence_id INT AUTO_INCREMENT PRIMARY KEY,
  parent_meeting_id INT NOT NULL COMMENT 'Reference to the master/parent meeting',
  occurrence_datetime DATETIME NOT NULL COMMENT 'Specific date/time for this occurrence',
  is_cancelled BOOLEAN DEFAULT FALSE COMMENT 'Whether this specific occurrence is cancelled',
  is_rescheduled BOOLEAN DEFAULT FALSE COMMENT 'Whether this specific occurrence was rescheduled',
  rescheduled_datetime DATETIME DEFAULT NULL COMMENT 'New datetime if rescheduled',
  notes TEXT DEFAULT NULL COMMENT 'Optional notes for this occurrence',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_recur_meeting FOREIGN KEY (parent_meeting_id)
    REFERENCES meetings(meeting_id) ON DELETE CASCADE,
  INDEX idx_recur_parent (parent_meeting_id),
  INDEX idx_recur_datetime (occurrence_datetime),
  INDEX idx_recur_cancelled (is_cancelled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
