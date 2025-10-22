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
  PRIMARY KEY (WorkletID),
  CONSTRAINT fk_worklet_status FOREIGN KEY (StatusID)
      REFERENCES status(StatusID)
      ON DELETE RESTRICT
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
-- 5. Evaluations
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
-- 6. Achievements
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
-- 7. Papers
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
-- 8. Patents
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
-- 9. Commercializations
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

CREATE TABLE status (
  StatusID INT PRIMARY KEY,
  StatusName VARCHAR(50) NOT NULL
);
-- ========================
-- 10. Helpful Indexes
-- ========================
CREATE UNIQUE INDEX ix_user_email ON users(email);
CREATE UNIQUE INDEX ix_prism_cert_id ON Prism_Worklet(CertID);
