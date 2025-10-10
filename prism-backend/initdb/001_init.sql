-- Data consistency: If completed_date is NULL, status should not be 'Completed'.
-- This update ensures only worklets with a completed_date are marked as Completed.
UPDATE worklets SET status = 'Ongoing' WHERE status = 'Completed' AND completed_date IS NULL;
-- Initial SQL for MySQL when using docker-compose
-- Creates basic schema if not using SQLAlchemy to create tables automatically

CREATE TABLE IF NOT EXISTS colleges (
  college_id INT AUTO_INCREMENT PRIMARY KEY,
  college_name VARCHAR(255) UNIQUE NOT NULL,
  location VARCHAR(255),
 established YEAR,
  infrastructure VARCHAR(100),
  area_of_expertise TEXT
);

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin','Mentor','Professor','Student') NOT NULL,
  college_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  active_till DATE,
  is_active INT,
  college_id INT NULL,
  CONSTRAINT fk_users_college FOREIGN KEY (college_id) REFERENCES colleges(college_id)
);

CREATE TABLE IF NOT EXISTS user_profiles (
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
);

CREATE TABLE IF NOT EXISTS worklets (
  worklet_id INT AUTO_INCREMENT PRIMARY KEY,
  cert_id VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status ENUM('Approved','Ongoing','Completed','Dropped','On Hold') NOT NULL DEFAULT 'Ongoing',
  year INT NOT NULL,
  domain VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_date Date,
  college_id INT NULL,
  CONSTRAINT fk_worklets_college FOREIGN KEY (college_id) REFERENCES colleges(college_id)
);

CREATE TABLE IF NOT EXISTS user_worklet_association (
  user_id INT NOT NULL,
  worklet_id INT NOT NULL,
  role_in_worklet ENUM('Mentor','Student','Professor') NOT NULL DEFAULT 'Student',
  PRIMARY KEY (user_id, worklet_id),
  CONSTRAINT fk_uw_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_uw_worklet FOREIGN KEY (worklet_id) REFERENCES worklets(worklet_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evaluations (
  evaluation_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  worklet_id INT NOT NULL,
  score INT NOT NULL,
  feedback TEXT,
  evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_eval_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_eval_worklet FOREIGN KEY (worklet_id) REFERENCES worklets(worklet_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS achievements (
  achievement_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  year INT,
  type ENUM('Award','Recognition','Other') NOT NULL DEFAULT 'Other',
  link VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS papers (
  paper_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  publication_year INT,
  journal VARCHAR(255),
  doi VARCHAR(255),
  link VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS patents (
  patent_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  application_number VARCHAR(100),
  filing_year INT,
  status ENUM('Filed','Granted','Published') NOT NULL DEFAULT 'Filed',
  link VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS commercializations (
  commercialization_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  worklet_id INT NULL,
  title VARCHAR(255) NOT NULL,
  year INT,
  revenue DECIMAL(12,2),
  description TEXT,
  link VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (worklet_id) REFERENCES worklets(worklet_id) ON DELETE SET NULL
);



-- Helpful indexes
CREATE UNIQUE INDEX IF NOT EXISTS ix_user_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS ix_worklet_cert_id ON worklets(cert_id);
