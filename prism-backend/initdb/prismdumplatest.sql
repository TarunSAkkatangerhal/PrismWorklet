-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: prism_database
-- ------------------------------------------------------
-- Server version	8.0.37

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `achievements`
--

DROP TABLE IF EXISTS `achievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `achievements` (
  `achievement_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `WorkletID` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `year` int DEFAULT NULL,
  `type` enum('Award','Recognition','Other') NOT NULL DEFAULT 'Other',
  `link` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`achievement_id`),
  KEY `fk_ach_user` (`user_id`),
  KEY `fk_ach_worklet` (`WorkletID`),
  CONSTRAINT `fk_ach_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ach_worklet` FOREIGN KEY (`WorkletID`) REFERENCES `prism_worklet` (`WorkletID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `achievements`
--

LOCK TABLES `achievements` WRITE;
/*!40000 ALTER TABLE `achievements` DISABLE KEYS */;
INSERT INTO `achievements` VALUES (1,1,2464,'Best Tech Project Award (Regional)','Award for drone mapping dataset and solution',2020,'Award',NULL,'2025-10-26 14:22:27'),(2,1,2464,'Industry Collaboration','Dataset adopted by urban planning firm',2021,'Recognition',NULL,'2025-10-26 14:22:27'),(3,1,2465,'Innovation in Assistive Devices','Recognized for low-cost prosthetic hand',2020,'Recognition',NULL,'2025-10-26 14:22:27'),(4,5,2477,'Sustainability Award','Recognized for low-cost purifier design',2020,'Award',NULL,'2025-10-26 14:22:59');
/*!40000 ALTER TABLE `achievements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `colleges`
--

DROP TABLE IF EXISTS `colleges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `colleges` (
  `college_id` int NOT NULL AUTO_INCREMENT,
  `college_name` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `established` year DEFAULT NULL,
  `infrastructure` varchar(100) DEFAULT NULL,
  `area_of_expertise` text,
  PRIMARY KEY (`college_id`),
  UNIQUE KEY `college_name` (`college_name`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `colleges`
--

LOCK TABLES `colleges` WRITE;
/*!40000 ALTER TABLE `colleges` DISABLE KEYS */;
INSERT INTO `colleges` VALUES (1,'Cambridge Institute of Technology','Bangalore',1997,'Good','Engineering, AI'),(2,'R V College of Engineering','Bangalore',1963,'Very Good','Engineering, Research'),(3,'BMS College of Engineering','Bangalore',1946,'Very Good','Engineering'),(4,'PES University','Bangalore',1972,'Very Good','Engineering, Computer Science'),(5,'M S Ramaiah Institute of Technology','Bangalore',1962,'Very Good','Engineering, Medical Tech'),(6,'Dayananda Sagar College of Engineering','Bangalore',1979,'Very Good','Engineering, Research'),(7,'New Horizon College of Engineering','Bangalore',2001,'Good','Engineering'),(8,'NMIT (Nitte Meenakshi Institute of Technology)','Bangalore',2001,'Good','Engineering, AI'),(9,'Acharya Institute of Technology','Bangalore',2000,'Good','Engineering'),(10,'CMR Institute of Technology','Bangalore',1999,'Good','Engineering, Research'),(11,'Reva University','Bangalore',2002,'Good','Multiple Disciplines'),(12,'Christ University','Bangalore',1969,'Very Good','Arts, Science, Commerce'),(13,'Jain University','Bangalore',1990,'Good','Multiple Disciplines'),(14,'Alliance University','Bangalore',2010,'Good','Engineering, Management'),(15,'Presidency University','Bangalore',2010,'Good','Engineering, Management');
/*!40000 ALTER TABLE `colleges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commercializations`
--

DROP TABLE IF EXISTS `commercializations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commercializations` (
  `commercialization_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `WorkletID` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `year` int DEFAULT NULL,
  `revenue` decimal(12,2) DEFAULT NULL,
  `description` text,
  `link` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`commercialization_id`),
  KEY `fk_com_user` (`user_id`),
  KEY `fk_com_worklet` (`WorkletID`),
  CONSTRAINT `fk_com_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_com_worklet` FOREIGN KEY (`WorkletID`) REFERENCES `prism_worklet` (`WorkletID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commercializations`
--

LOCK TABLES `commercializations` WRITE;
/*!40000 ALTER TABLE `commercializations` DISABLE KEYS */;
INSERT INTO `commercializations` VALUES (1,1,2464,'Drone Mapping Dataset Licensing',2021,15000.00,'License sold to municipal urban planning team',NULL,'2025-10-26 14:22:54'),(2,1,2465,'Prosthetic Prototype Pilot Sale',2021,12000.00,'Pilot units supplied to NGOs',NULL,'2025-10-26 14:22:54'),(3,5,2477,'Pilot Purifier Units Sale',2021,8000.00,'Sold prototype units to two schools',NULL,'2025-10-26 14:23:07');
/*!40000 ALTER TABLE `commercializations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluations`
--

DROP TABLE IF EXISTS `evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluations` (
  `evaluation_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `WorkletID` int NOT NULL,
  `score` int NOT NULL,
  `feedback` text,
  `evaluated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`evaluation_id`),
  KEY `fk_eval_user` (`user_id`),
  KEY `fk_eval_worklet` (`WorkletID`),
  CONSTRAINT `fk_eval_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eval_worklet` FOREIGN KEY (`WorkletID`) REFERENCES `prism_worklet` (`WorkletID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluations`
--

LOCK TABLES `evaluations` WRITE;
/*!40000 ALTER TABLE `evaluations` DISABLE KEYS */;
/*!40000 ALTER TABLE `evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `papers`
--

DROP TABLE IF EXISTS `papers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `papers` (
  `paper_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `WorkletID` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `publication_year` int DEFAULT NULL,
  `journal` varchar(255) DEFAULT NULL,
  `doi` varchar(255) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`paper_id`),
  KEY `fk_paper_user` (`user_id`),
  KEY `fk_paper_worklet` (`WorkletID`),
  CONSTRAINT `fk_paper_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_paper_worklet` FOREIGN KEY (`WorkletID`) REFERENCES `prism_worklet` (`WorkletID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `papers`
--

LOCK TABLES `papers` WRITE;
/*!40000 ALTER TABLE `papers` DISABLE KEYS */;
INSERT INTO `papers` VALUES (1,1,2464,'High-resolution Campus Mapping using Low-cost Drones',2020,'Journal of UAV Research','10.1000/j.uav.2020.001',NULL,'2025-10-26 14:22:33'),(2,1,2465,'Design of 3D Printed Prosthetic Hand for Low-resource Settings',2021,'International Journal of Mechatronics','10.1000/j.mech.2021.002',NULL,'2025-10-26 14:22:33'),(3,5,2477,'Performance Analysis of Low-cost Air Purifiers in Classrooms',2021,'Environmental Engineering Letters','10.1000/j.env.2021.010',NULL,'2025-10-26 14:23:04');
/*!40000 ALTER TABLE `papers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patents`
--

DROP TABLE IF EXISTS `patents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patents` (
  `patent_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `WorkletID` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `application_number` varchar(100) DEFAULT NULL,
  `filing_year` int DEFAULT NULL,
  `status` enum('Filed','Granted','Published') NOT NULL DEFAULT 'Filed',
  `link` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`patent_id`),
  KEY `fk_patent_user` (`user_id`),
  KEY `fk_patent_worklet` (`WorkletID`),
  CONSTRAINT `fk_patent_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_patent_worklet` FOREIGN KEY (`WorkletID`) REFERENCES `prism_worklet` (`WorkletID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patents`
--

LOCK TABLES `patents` WRITE;
/*!40000 ALTER TABLE `patents` DISABLE KEYS */;
INSERT INTO `patents` VALUES (1,1,2465,'3D Printed Prosthetic Mechanism','APP2020/000123',2020,'Filed',NULL,'2025-10-26 14:22:46');
/*!40000 ALTER TABLE `patents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prism_milestone`
--

DROP TABLE IF EXISTS `prism_milestone`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prism_milestone` (
  `milestone_id` int NOT NULL AUTO_INCREMENT,
  `worklet_id` int NOT NULL,
  `student_id` int NOT NULL,
  `milestone_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_created` datetime DEFAULT CURRENT_TIMESTAMP,
  `field1_label` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field1_value` text COLLATE utf8mb4_unicode_ci,
  `field2_label` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field2_value` text COLLATE utf8mb4_unicode_ci,
  `toggle_label` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `toggle_value` tinyint(1) DEFAULT '0',
  `attachment_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attachment_size` int DEFAULT NULL,
  `attachment_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attachment_url` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`milestone_id`),
  KEY `idx_worklet_id` (`worklet_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_date_created` (`date_created`),
  CONSTRAINT `prism_milestone_ibfk_1` FOREIGN KEY (`worklet_id`) REFERENCES `prism_worklet` (`WorkletID`) ON DELETE CASCADE,
  CONSTRAINT `prism_milestone_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prism_milestone`
--

LOCK TABLES `prism_milestone` WRITE;
/*!40000 ALTER TABLE `prism_milestone` DISABLE KEYS */;
INSERT INTO `prism_milestone` VALUES (1,2460,96,'First Review','2025-10-27 08:47:33','Activities Completed','test','Next Steps','test1','GitHub accessible to all team members',0,'W001_details.txt',1185,'text/plain','blob:http://localhost:3000/1d0d7927-1591-4d1a-ab86-a1ca6c9be346','2025-10-27 14:17:33','2025-10-27 14:17:33'),(2,2460,96,'Second Review','2025-10-27 09:47:53','Activities Completed','xyz','Next Steps','abc','GitHub accessible to all team members',0,'W001_details.txt',1185,'text/plain','blob:http://localhost:3000/6412ee28-3be5-4064-8e6d-364f8103a91d','2025-10-27 15:17:53','2025-10-27 15:17:53');
/*!40000 ALTER TABLE `prism_milestone` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prism_milestone_feedback`
--

DROP TABLE IF EXISTS `prism_milestone_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prism_milestone_feedback` (
  `feedback_id` int NOT NULL AUTO_INCREMENT,
  `milestone_id` int NOT NULL,
  `reviewer_id` int NOT NULL,
  `reviewer_role` enum('mentor','professor') COLLATE utf8mb4_unicode_ci NOT NULL,
  `feedback_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`feedback_id`),
  KEY `idx_milestone_id` (`milestone_id`),
  KEY `idx_reviewer_id` (`reviewer_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `prism_milestone_feedback_ibfk_1` FOREIGN KEY (`milestone_id`) REFERENCES `prism_milestone` (`milestone_id`) ON DELETE CASCADE,
  CONSTRAINT `prism_milestone_feedback_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prism_milestone_feedback`
--

LOCK TABLES `prism_milestone_feedback` WRITE;
/*!40000 ALTER TABLE `prism_milestone_feedback` DISABLE KEYS */;
INSERT INTO `prism_milestone_feedback` VALUES (1,1,1,'mentor','issue raised','2025-10-27 14:20:36','2025-10-27 14:20:36'),(2,2,1,'mentor','aaa','2025-10-27 15:18:39','2025-10-27 15:18:39');
/*!40000 ALTER TABLE `prism_milestone_feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prism_suggestion`
--

DROP TABLE IF EXISTS `prism_suggestion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prism_suggestion` (
  `suggestion_id` int NOT NULL AUTO_INCREMENT,
  `worklet_id` int NOT NULL,
  `mentor_id` int NOT NULL,
  `suggestion_title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `suggestion_content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'General',
  `priority` enum('low','medium','high') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `is_read` tinyint(1) DEFAULT '0',
  `is_helpful` tinyint(1) DEFAULT NULL,
  `student_response` text COLLATE utf8mb4_unicode_ci,
  `response_date` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`suggestion_id`),
  KEY `idx_worklet_id` (`worklet_id`),
  KEY `idx_mentor_id` (`mentor_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `prism_suggestion_ibfk_1` FOREIGN KEY (`worklet_id`) REFERENCES `prism_worklet` (`WorkletID`) ON DELETE CASCADE,
  CONSTRAINT `prism_suggestion_ibfk_2` FOREIGN KEY (`mentor_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prism_suggestion`
--

LOCK TABLES `prism_suggestion` WRITE;
/*!40000 ALTER TABLE `prism_suggestion` DISABLE KEYS */;
INSERT INTO `prism_suggestion` VALUES (1,2460,1,'Title!!','Suggestion!!','General','medium',0,NULL,NULL,NULL,'2025-10-26 17:16:27','2025-10-26 17:16:27'),(2,2461,1,'workflow','update the workflow with changes mentioned in meet','General','medium',0,NULL,NULL,NULL,'2025-10-26 17:28:43','2025-10-26 17:28:43'),(3,2460,1,'title1','suggestion','General','medium',0,NULL,NULL,NULL,'2025-10-27 15:21:08','2025-10-27 15:21:08');
/*!40000 ALTER TABLE `prism_suggestion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prism_worklet`
--

DROP TABLE IF EXISTS `prism_worklet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prism_worklet` (
  `WorkletID` int NOT NULL AUTO_INCREMENT,
  `Title` longtext NOT NULL,
  `ImagePath` longtext NOT NULL,
  `ProblemStmt` longtext NOT NULL,
  `Expectations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Prerequest` longtext NOT NULL,
  `TechDomainID` int NOT NULL,
  `GitHubUrl` varchar(500) DEFAULT NULL,
  `StatusID` int NOT NULL,
  `CreatedOn` datetime NOT NULL,
  `CreatedMentorID` int NOT NULL,
  `Progress` int NOT NULL,
  `StartDate` date NOT NULL,
  `EndDate` date NOT NULL,
  `CertID` varchar(500) DEFAULT NULL,
  `TeamMGID` int DEFAULT NULL,
  `GroupMGID` int DEFAULT NULL,
  `PartMGID` int DEFAULT NULL,
  `StudentCount` int DEFAULT NULL,
  `Degree` int DEFAULT NULL,
  `Stream` int DEFAULT NULL,
  `WorkletComplexity` int DEFAULT NULL,
  `Research` int DEFAULT NULL,
  `Doc` int DEFAULT NULL,
  `DataCollection` int DEFAULT NULL,
  `LinkedProject` int DEFAULT NULL,
  `ProjectID` int DEFAULT NULL,
  `Performance` varchar(45) DEFAULT NULL,
  `RiskStatus` varchar(45) DEFAULT NULL,
  `RiskStatusNote` longtext,
  `PaperDetail` int DEFAULT NULL,
  `PatentDetail` int DEFAULT NULL,
  `CommercializationDetail` int DEFAULT NULL,
  `GroupHeadComments` longtext,
  `IsSync` int DEFAULT NULL,
  `IsActive` int NOT NULL,
  `IsExcellent` int DEFAULT '0',
  `StageID` int DEFAULT NULL,
  `IsDataCollected` int DEFAULT '0',
  `IsGenAIFF` int DEFAULT '0',
  `Modality` int DEFAULT NULL,
  `Category` int DEFAULT NULL,
  `CollegeID` int DEFAULT NULL,
  PRIMARY KEY (`WorkletID`),
  UNIQUE KEY `ix_prism_cert_id` (`CertID`),
  KEY `fk_worklet_status` (`StatusID`),
  KEY `fk_worklet_college` (`CollegeID`),
  CONSTRAINT `fk_worklet_college` FOREIGN KEY (`CollegeID`) REFERENCES `colleges` (`college_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_worklet_status` FOREIGN KEY (`StatusID`) REFERENCES `status` (`StatusID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2490 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prism_worklet`
--

LOCK TABLES `prism_worklet` WRITE;
/*!40000 ALTER TABLE `prism_worklet` DISABLE KEYS */;
INSERT INTO `prism_worklet` VALUES (2460,'Autonomous Campus Delivery Robot','/images/w001.jpg','Campus last-mile delivery using autonomous robot','Prototype with path planning and obstacle avoidance','Robotics basics',1,NULL,1,'2021-02-01 00:00:00',1,89,'2025-02-01','2025-12-01','W001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Good',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,3,0,0,NULL,NULL,1),(2461,'Smart Irrigation using IoT','/images/w002.jpg','Optimize water use in campus farms using sensors','Working IoT system and dashboard','Basic IoT knowledge',2,NULL,1,'2020-06-01 00:00:00',1,60,'2025-06-01','2025-11-20','W002',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Very Good',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,2,0,0,NULL,NULL,2),(2462,'AI-based Attendance from Face Recognition','/images/w003.jpg','Attendance automation using face recognition models','Deployment-ready model and integration','ML basics',3,NULL,1,'2022-03-01 00:00:00',1,30,'2025-08-01','2026-02-01','W003',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Average',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,3,0,0,NULL,NULL,3),(2463,'Energy Efficient Microgrid Controller','/images/w004.jpg','Controller to balance campus microgrid loads','Simulation and small prototype','Power systems basics',4,NULL,1,'2023-05-01 00:00:00',1,78,'2025-06-01','2026-01-12','W004',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Poor',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,4,0,0,NULL,NULL,4),(2464,'Drone-based High-resolution Mapping','/images/w005.jpg','High-resolution mapping for campus and nearby areas','Published dataset and paper','Drone basics',5,NULL,2,'2020-01-10 00:00:00',1,100,'2023-01-10','2023-04-10','W005',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Good',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,5),(2465,'Low-cost 3D-printed Prosthetic Hand','/images/w006.jpg','Affordable prosthetic hand using 3D-printing and low-cost sensors','Prototype and patent filing','Mechatronics basics',6,NULL,2,'2020-04-01 00:00:00',1,100,'2020-04-01','2020-10-01','W006',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,6),(2466,'Campus Waste Segregation Robot','/images/w007.jpg','Automated segregation using sensors and conveyor','Working prototype for campus','Robotics',2,NULL,1,'2021-07-01 00:00:00',2,55,'2025-07-01','2025-10-01','W007',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,1),(2467,'Smart Library Recommendation Engine','/images/w008.jpg','Personalized book recommendations for students','Recommendation engine + UI','Data Science',3,NULL,0,'2020-05-01 00:00:00',3,20,'2026-05-01','2026-08-01','W008',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,3),(2468,'Water Quality Monitoring System','/images/w009.jpg','Real-time water quality readings and alerts','Sensor network + dashboard','Embedded systems',4,NULL,1,'2022-09-01 00:00:00',4,70,'2025-09-01','2025-12-01','W009',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,5),(2469,'Student Skill Tracker Platform','/images/w010.jpg','Track student skills and certifications','Dashboard + analytics','Web fundamentals',5,NULL,2,'2020-11-01 00:00:00',5,100,'2020-11-01','2021-02-01','W010',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,6),(2470,'Traffic Flow Optimization using ML','/images/w011.jpg','Optimize campus traffic using ML','Simulation + optimization model','ML basics',6,NULL,1,'2023-02-01 00:00:00',2,50,'2025-02-01','2025-11-15','W011',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,7),(2471,'Solar Panel Fault Detection','/images/w012.jpg','Detect faults in campus solar arrays with vision models','Detector + alerting','Computer Vision',1,NULL,3,'2021-03-15 00:00:00',3,80,'2021-03-15','2021-09-15','W012',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,8),(2472,'Handwritten OCR for Kannada Notes','/images/w013.jpg','OCR for local language handwritten notes','Dataset + OCR pipeline','NLP basics',2,NULL,0,'2022-04-01 00:00:00',4,25,'2022-04-01','2022-07-01','W013',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,9),(2473,'Predictive Maintenance for Lab Equip','/images/w014.jpg','Predict failure in lab instruments using sensor data','Predictive module','Signal processing',3,NULL,1,'2024-06-01 00:00:00',5,40,'2024-06-01','2024-12-01','W014',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,10),(2474,'Navigation App for Visually Impaired','/images/w015.jpg','Audio navigation for visually impaired across campus','Mobile app + audio cues','Mobile dev',4,NULL,0,'2020-02-01 00:00:00',2,30,'2020-02-01','2020-05-01','W015',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,11),(2475,'AI Tutor for Programming Basics','/images/w016.jpg','Adaptive learning tutor for coding fundamentals','Prototype with Q/A engine','EdTech/ML',5,NULL,1,'2021-10-01 00:00:00',3,60,'2021-10-01','2022-04-01','W016',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,12),(2476,'Smart Locker System','/images/w017.jpg','Secure locker with RFID and mobile unlock','Hardware + app integration','IoT',6,NULL,1,'2020-08-01 00:00:00',4,50,'2020-08-01','2021-02-01','W017',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,13),(2477,'Low-cost Air Purifier for Classrooms','/images/w018.jpg','Affordable purifier for classrooms with performance analytics','Prototype + test reports','Environmental Eng',1,NULL,2,'2020-06-01 00:00:00',5,100,'2020-06-01','2020-12-01','W018',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,14),(2478,'Crowd Management Dashboard','/images/w019.jpg','Real-time crowd density monitoring for events','Dashboard + alerts','Systems',2,NULL,1,'2022-03-01 00:00:00',2,55,'2022-03-01','2022-09-01','W019',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,15),(2479,'Blockchain Certificate Verification','/images/w020.jpg','Immutable certificate verification for colleges','Blockchain prototype','Blockchain',3,NULL,0,'2023-01-10 00:00:00',3,15,'2023-01-10','2023-04-10','W020',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,1),(2480,'AR Lab Manuals','/images/w021.jpg','Augmented reality lab guides for experiments','AR app + sample labs','AR/VR',4,NULL,1,'2024-02-01 00:00:00',4,45,'2024-02-01','2024-08-01','W021',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,2),(2481,'Campus Energy Dashboard','/images/w022.jpg','Monitor and reduce campus energy usage','Dashboard + recommendations','Energy',5,NULL,1,'2021-11-01 00:00:00',5,35,'2021-11-01','2022-05-01','W022',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,3),(2482,'E-waste Recycling Initiative','/images/w023.jpg','Process to recycle campus e-waste with a pilot','Pilot + deployment plan','Sustainability',6,NULL,2,'2020-09-01 00:00:00',2,10,'2020-09-01','2021-06-01','W023',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,4),(2483,'Voice-enabled Campus Assistant','/images/w024.jpg','Voice assistant for campus services and FAQs','Working bot + integrations','NLP',1,NULL,1,'2022-07-01 00:00:00',3,50,'2022-07-01','2023-01-01','W024',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,5),(2484,'Smart Bicycle Sharing','/images/w025.jpg','Campus bike share system with app and locks','App + hardware pilot','IoT',2,NULL,1,'2023-09-01 00:00:00',4,60,'2023-09-01','2024-03-01','W025',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,6),(2485,'Remote Lab Access Platform','/images/w026.jpg','Remote access to lab instruments for students','Auth + streaming + control','Systems',3,NULL,0,'2020-03-15 00:00:00',2,20,'2020-03-15','2020-06-15','W026',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,7),(2486,'Automated Exam Grading Tool','/images/w027.jpg','Auto-grading for objective and subjective answers','Model + UI pipeline','ML',4,NULL,1,'2021-05-01 00:00:00',3,40,'2025-05-01','2025-11-06','W027',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,8),(2487,'Campus Mental Health Chatbot','/images/w028.jpg','Anonymous mental health support chatbot for students','Chatbot + resources','NLP/Wellness',5,NULL,1,'2022-10-01 00:00:00',4,25,'2022-10-01','2023-01-01','W028',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,9),(2488,'Smart Attendance using BLE','/images/w029.jpg','Attendance using BLE beacons and app integration','Prototype + infra','IoT',6,NULL,2,'2024-01-01 00:00:00',5,55,'2025-01-01','2025-07-01','W029',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,10),(2489,'Green Roof Pilot','/images/w030.jpg','Green roofing pilot for energy savings on campus','Pilot + performance report','Civil/Env',1,NULL,2,'2021-03-01 00:00:00',2,10,'2022-03-01','2022-06-01','W030',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,0,NULL,NULL,11);
/*!40000 ALTER TABLE `prism_worklet` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `status`
--

DROP TABLE IF EXISTS `status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `status` (
  `StatusID` int NOT NULL,
  `StatusName` varchar(50) NOT NULL,
  PRIMARY KEY (`StatusID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `status`
--

LOCK TABLES `status` WRITE;
/*!40000 ALTER TABLE `status` DISABLE KEYS */;
INSERT INTO `status` VALUES (0,'To Start'),(1,'OnGoing'),(2,'Completed'),(3,'On Hold'),(4,'Dropped');
/*!40000 ALTER TABLE `status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_profiles`
--

DROP TABLE IF EXISTS `user_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_profiles` (
  `user_id` int NOT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `bio` text,
  `linkedin` varchar(255) DEFAULT NULL,
  `portfolio_url` varchar(255) DEFAULT NULL,
  `expertise` varchar(255) DEFAULT NULL,
  `qualification` varchar(100) DEFAULT NULL,
  `experience_years` int DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `organization` varchar(150) DEFAULT NULL,
  `github` varchar(255) DEFAULT NULL,
  `handle` varchar(50) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_profiles`
--

LOCK TABLES `user_profiles` WRITE;
/*!40000 ALTER TABLE `user_profiles` DISABLE KEYS */;
INSERT INTO `user_profiles` VALUES (1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(96,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `user_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_worklet_association`
--

DROP TABLE IF EXISTS `user_worklet_association`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_worklet_association` (
  `user_id` int NOT NULL,
  `WorkletID` int NOT NULL,
  `role_in_worklet` enum('Mentor','Student','Professor') NOT NULL DEFAULT 'Student',
  PRIMARY KEY (`user_id`,`WorkletID`),
  KEY `fk_uw_worklet` (`WorkletID`),
  CONSTRAINT `fk_uw_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_uw_worklet` FOREIGN KEY (`WorkletID`) REFERENCES `prism_worklet` (`WorkletID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_worklet_association`
--

LOCK TABLES `user_worklet_association` WRITE;
/*!40000 ALTER TABLE `user_worklet_association` DISABLE KEYS */;
INSERT INTO `user_worklet_association` VALUES (1,2460,'Mentor'),(1,2461,'Mentor'),(1,2462,'Mentor'),(1,2463,'Mentor'),(1,2464,'Mentor'),(1,2465,'Mentor'),(2,2466,'Mentor'),(2,2470,'Mentor'),(2,2474,'Mentor'),(2,2478,'Mentor'),(2,2482,'Mentor'),(2,2486,'Mentor'),(3,2467,'Mentor'),(3,2471,'Mentor'),(3,2475,'Mentor'),(3,2479,'Mentor'),(3,2483,'Mentor'),(3,2487,'Mentor'),(4,2468,'Mentor'),(4,2472,'Mentor'),(4,2476,'Mentor'),(4,2480,'Mentor'),(4,2484,'Mentor'),(4,2488,'Mentor'),(5,2469,'Mentor'),(5,2473,'Mentor'),(5,2477,'Mentor'),(5,2481,'Mentor'),(5,2485,'Mentor'),(5,2489,'Mentor'),(6,2460,'Professor'),(6,2466,'Professor'),(6,2479,'Professor'),(7,2461,'Professor'),(7,2480,'Professor'),(8,2462,'Professor'),(8,2467,'Professor'),(8,2481,'Professor'),(9,2463,'Professor'),(9,2482,'Professor'),(10,2464,'Professor'),(10,2468,'Professor'),(10,2483,'Professor'),(11,2465,'Professor'),(11,2469,'Professor'),(11,2484,'Professor'),(12,2470,'Professor'),(12,2485,'Professor'),(13,2471,'Professor'),(13,2486,'Professor'),(14,2472,'Professor'),(14,2487,'Professor'),(15,2473,'Professor'),(15,2488,'Professor'),(16,2474,'Professor'),(16,2489,'Professor'),(17,2475,'Professor'),(18,2476,'Professor'),(19,2477,'Professor'),(20,2478,'Professor'),(21,2460,'Professor'),(21,2479,'Professor'),(22,2461,'Professor'),(22,2480,'Professor'),(23,2462,'Professor'),(23,2481,'Professor'),(24,2463,'Professor'),(24,2482,'Professor'),(25,2464,'Professor'),(25,2483,'Professor'),(26,2460,'Student'),(26,2466,'Student'),(26,2479,'Student'),(27,2461,'Student'),(27,2480,'Student'),(28,2462,'Student'),(28,2467,'Student'),(28,2481,'Student'),(29,2463,'Student'),(29,2482,'Student'),(30,2464,'Student'),(30,2468,'Student'),(30,2483,'Student'),(31,2465,'Student'),(31,2469,'Student'),(31,2484,'Student'),(32,2470,'Student'),(32,2485,'Student'),(33,2471,'Student'),(33,2486,'Student'),(34,2472,'Student'),(34,2487,'Student'),(35,2473,'Student'),(35,2488,'Student'),(36,2474,'Student'),(36,2489,'Student'),(37,2475,'Student'),(38,2476,'Student'),(39,2477,'Student'),(40,2478,'Student'),(41,2460,'Student'),(41,2466,'Student'),(42,2461,'Student'),(43,2462,'Student'),(43,2467,'Student'),(44,2463,'Student'),(45,2464,'Student'),(45,2468,'Student'),(46,2465,'Student'),(46,2469,'Student'),(47,2470,'Student'),(48,2471,'Student'),(49,2472,'Student'),(50,2473,'Student'),(51,2474,'Student'),(52,2475,'Student'),(53,2476,'Student'),(54,2477,'Student'),(55,2478,'Student'),(56,2460,'Student'),(56,2479,'Student'),(57,2461,'Student'),(57,2480,'Student'),(58,2462,'Student'),(58,2481,'Student'),(59,2463,'Student'),(59,2482,'Student'),(60,2464,'Student'),(60,2483,'Student'),(61,2465,'Student'),(61,2484,'Student'),(62,2485,'Student'),(63,2486,'Student'),(64,2487,'Student'),(65,2488,'Student'),(66,2489,'Student'),(71,2466,'Student'),(71,2479,'Student'),(72,2480,'Student'),(73,2467,'Student'),(73,2481,'Student'),(74,2482,'Student'),(75,2468,'Student'),(75,2483,'Student'),(76,2469,'Student'),(76,2484,'Student'),(77,2470,'Student'),(77,2485,'Student'),(78,2471,'Student'),(78,2486,'Student'),(79,2472,'Student'),(79,2487,'Student'),(80,2473,'Student'),(80,2488,'Student'),(81,2474,'Student'),(81,2489,'Student'),(82,2475,'Student'),(83,2476,'Student'),(84,2477,'Student'),(85,2478,'Student'),(96,2460,'Student');
/*!40000 ALTER TABLE `user_worklet_association` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('Admin','Mentor','Professor','Student') NOT NULL,
  `college_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `active_till` date DEFAULT NULL,
  `is_active` tinyint DEFAULT '1',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `ix_user_email` (`email`),
  KEY `fk_users_college` (`college_id`),
  CONSTRAINT `fk_users_college` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`college_id`)
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Rock','rohitsakkatangerhal@gmail.com','$argon2id$v=19$m=65536,t=3,p=4$undurdV6r1VqDQGgdO6dEw$A8vumce+4qCYFZOCRKMFLXSnf3lATKLbPhZYrL21QYw','Mentor',NULL,'2025-10-26 14:13:26','2025-10-26 14:13:26',NULL,1),(2,'Arun Kumar','arun.kumar@cambridgeit.edu','hash_m2','Mentor',1,'2020-01-15 00:00:00','2025-10-26 14:15:27',NULL,1),(3,'Shneha Rao','shneha.rao@rvce.edu','hash_m3','Mentor',2,'2020-02-10 00:00:00','2025-10-26 14:15:27',NULL,1),(4,'Rajat Singh','rajat.singh@bmsce.ac.in','hash_m4','Mentor',3,'2020-03-05 00:00:00','2025-10-26 14:15:27',NULL,1),(5,'Priya Nair','priya.nair@pes.edu','hash_m5','Mentor',4,'2020-04-01 00:00:00','2025-10-26 14:15:27',NULL,1),(6,'Dr. Ramesh Bhat','ramesh.bhat@cambridgeit.edu','hash_p6','Professor',1,'2015-06-01 00:00:00','2025-10-26 14:15:44',NULL,1),(7,'Dr. Nisha Patel','nisha.patel@rvce.edu','hash_p7','Professor',2,'2016-07-01 00:00:00','2025-10-26 14:15:44',NULL,1),(8,'Dr. Suresh K','suresh.k@bmsce.ac.in','hash_p8','Professor',3,'2014-08-01 00:00:00','2025-10-26 14:15:44',NULL,1),(9,'Dr. Anita Verma','anita.verma@pes.edu','hash_p9','Professor',4,'2017-02-10 00:00:00','2025-10-26 14:15:44',NULL,1),(10,'Dr. Murali Krishna','murali@msrit.edu','hash_p10','Professor',5,'2013-09-15 00:00:00','2025-10-26 14:15:44',NULL,1),(11,'Dr. Deepa Rao','deepa@dsce.edu','hash_p11','Professor',6,'2012-11-01 00:00:00','2025-10-26 14:15:44',NULL,1),(12,'Dr. Karthik Mohan','karthik@nhce.edu','hash_p12','Professor',7,'2011-05-20 00:00:00','2025-10-26 14:15:44',NULL,1),(13,'Dr. Meera N','meera.n@nmit.edu','hash_p13','Professor',8,'2018-01-10 00:00:00','2025-10-26 14:15:44',NULL,1),(14,'Dr. Sandeep Sharma','sandeep@acharya.edu','hash_p14','Professor',9,'2010-03-12 00:00:00','2025-10-26 14:15:44',NULL,1),(15,'Dr. Leena Thomas','leena@cmr.edu','hash_p15','Professor',10,'2016-06-24 00:00:00','2025-10-26 14:15:44',NULL,1),(16,'Dr. Rajiv Menon','rajiv@reva.edu','hash_p16','Professor',11,'2014-10-10 00:00:00','2025-10-26 14:15:44',NULL,1),(17,'Dr. Sunitha Rao','sunitha@christuniversity.in','hash_p17','Professor',12,'2013-05-05 00:00:00','2025-10-26 14:15:44',NULL,1),(18,'Dr. Rohit Kumar','rohit.kumar@jainuniversity.ac.in','hash_p18','Professor',13,'2017-12-01 00:00:00','2025-10-26 14:15:44',NULL,1),(19,'Dr. Prakash Iyer','prakash.iyer@alliance.edu','hash_p19','Professor',14,'2015-09-01 00:00:00','2025-10-26 14:15:44',NULL,1),(20,'Dr. Sneha Joshi','sneha.joshi@presidency.edu','hash_p20','Professor',15,'2018-02-14 00:00:00','2025-10-26 14:15:44',NULL,1),(21,'Dr. Kiran Rao','kiran.rao@cambridgeit.edu','hash_p21','Professor',1,'2019-03-01 00:00:00','2025-10-26 14:15:44',NULL,1),(22,'Dr. Venkatesh','venkatesh@rvce.edu','hash_p22','Professor',2,'2012-04-01 00:00:00','2025-10-26 14:15:44',NULL,1),(23,'Dr. Madhuri','madhuri@bmsce.ac.in','hash_p23','Professor',3,'2011-07-12 00:00:00','2025-10-26 14:15:44',NULL,1),(24,'Dr. Anil Kumar','anilk@pes.edu','hash_p24','Professor',4,'2010-11-11 00:00:00','2025-10-26 14:15:44',NULL,1),(25,'Dr. Nandini','nandini@msrit.edu','hash_p25','Professor',5,'2016-01-01 00:00:00','2025-10-26 14:15:44',NULL,1),(26,'Amit Sharma','amit.sharma26@cambridgeit.edu','hash_s26','Student',1,'2020-08-01 00:00:00','2025-10-26 14:16:03',NULL,1),(27,'Neha Gupta','neha.gupta27@rvce.edu','hash_s27','Student',2,'2020-08-02 00:00:00','2025-10-26 14:16:03',NULL,1),(28,'Rohit Verma','rohit.verma28@bmsce.ac.in','hash_s28','Student',3,'2020-08-03 00:00:00','2025-10-26 14:16:03',NULL,1),(29,'Priyanka Singh','priyanka.singh29@pes.edu','hash_s29','Student',4,'2020-08-04 00:00:00','2025-10-26 14:16:03',NULL,1),(30,'Karthik S','karthik.s30@msrit.edu','hash_s30','Student',5,'2020-08-05 00:00:00','2025-10-26 14:16:03',NULL,1),(31,'Sneha K','sneha.k31@dsce.edu','hash_s31','Student',6,'2020-08-06 00:00:00','2025-10-26 14:16:03',NULL,1),(32,'Vijay Kumar','vijay.kumar32@nhce.edu','hash_s32','Student',7,'2020-08-07 00:00:00','2025-10-26 14:16:03',NULL,1),(33,'Sowmya R','sowmya.r33@nmit.edu','hash_s33','Student',8,'2020-08-08 00:00:00','2025-10-26 14:16:03',NULL,1),(34,'Manish Patel','manish.patel34@acharya.edu','hash_s34','Student',9,'2020-08-09 00:00:00','2025-10-26 14:16:03',NULL,1),(35,'Anjali Mehta','anjali.mehta35@cmr.edu','hash_s35','Student',10,'2020-08-10 00:00:00','2025-10-26 14:16:03',NULL,1),(36,'Rakesh B','rakesh.b36@reva.edu','hash_s36','Student',11,'2020-08-11 00:00:00','2025-10-26 14:16:03',NULL,1),(37,'Divya N','divya.n37@christuniversity.in','hash_s37','Student',12,'2020-08-12 00:00:00','2025-10-26 14:16:03',NULL,1),(38,'Sahil Jain','sahil.jain38@jainuniversity.ac.in','hash_s38','Student',13,'2020-08-13 00:00:00','2025-10-26 14:16:03',NULL,1),(39,'Shweta Rao','shweta.rao39@alliance.edu','hash_s39','Student',14,'2020-08-14 00:00:00','2025-10-26 14:16:03',NULL,1),(40,'Aditya P','aditya.p40@presidency.edu','hash_s40','Student',15,'2020-08-15 00:00:00','2025-10-26 14:16:03',NULL,1),(41,'Maya K','maya.k41@cambridgeit.edu','hash_s41','Student',1,'2020-09-01 00:00:00','2025-10-26 14:16:03',NULL,1),(42,'Harsh V','harsh.v42@rvce.edu','hash_s42','Student',2,'2020-09-02 00:00:00','2025-10-26 14:16:03',NULL,1),(43,'Isha B','isha.b43@bmsce.ac.in','hash_s43','Student',3,'2020-09-03 00:00:00','2025-10-26 14:16:03',NULL,1),(44,'Kunal R','kunal.r44@pes.edu','hash_s44','Student',4,'2020-09-04 00:00:00','2025-10-26 14:16:03',NULL,1),(45,'Nidhi S','nidhi.s45@msrit.edu','hash_s45','Student',5,'2020-09-05 00:00:00','2025-10-26 14:16:03',NULL,1),(46,'Vikas Sharma','vikas.sharma46@dsce.edu','hash_s46','Student',6,'2020-09-06 00:00:00','2025-10-26 14:16:03',NULL,1),(47,'Preeti D','preeti.d47@nhce.edu','hash_s47','Student',7,'2020-09-07 00:00:00','2025-10-26 14:16:03',NULL,1),(48,'Gaurav T','gaurav.t48@nmit.edu','hash_s48','Student',8,'2020-09-08 00:00:00','2025-10-26 14:16:03',NULL,1),(49,'Ritu M','ritu.m49@acharya.edu','hash_s49','Student',9,'2020-09-09 00:00:00','2025-10-26 14:16:03',NULL,1),(50,'Suresh P','suresh.p50@cmr.edu','hash_s50','Student',10,'2020-09-10 00:00:00','2025-10-26 14:16:03',NULL,1),(51,'Ayesha Q','ayesha.q51@reva.edu','hash_s51','Student',11,'2020-09-11 00:00:00','2025-10-26 14:16:03',NULL,1),(52,'Rahul N','rahul.n52@christuniversity.in','hash_s52','Student',12,'2020-09-12 00:00:00','2025-10-26 14:16:03',NULL,1),(53,'Pooja L','pooja.l53@jainuniversity.ac.in','hash_s53','Student',13,'2020-09-13 00:00:00','2025-10-26 14:16:03',NULL,1),(54,'Kiran S','kiran.s54@alliance.edu','hash_s54','Student',14,'2020-09-14 00:00:00','2025-10-26 14:16:03',NULL,1),(55,'Bhavana R','bhavana.r55@presidency.edu','hash_s55','Student',15,'2020-09-15 00:00:00','2025-10-26 14:16:03',NULL,1),(56,'Vivek N','vivek.n56@cambridgeit.edu','hash_s56','Student',1,'2020-10-01 00:00:00','2025-10-26 14:16:03',NULL,1),(57,'Sanjay K','sanjay.k57@rvce.edu','hash_s57','Student',2,'2020-10-02 00:00:00','2025-10-26 14:16:03',NULL,1),(58,'Tanya J','tanya.j58@bmsce.ac.in','hash_s58','Student',3,'2020-10-03 00:00:00','2025-10-26 14:16:03',NULL,1),(59,'Manu C','manu.c59@pes.edu','hash_s59','Student',4,'2020-10-04 00:00:00','2025-10-26 14:16:03',NULL,1),(60,'Ankita P','ankita.p60@msrit.edu','hash_s60','Student',5,'2020-10-05 00:00:00','2025-10-26 14:16:03',NULL,1),(61,'Kabir L','kabir.l61@dsce.edu','hash_s61','Student',6,'2020-10-06 00:00:00','2025-10-26 14:16:03',NULL,1),(62,'Meera S','meera.s62@nhce.edu','hash_s62','Student',7,'2020-10-07 00:00:00','2025-10-26 14:16:03',NULL,1),(63,'Naveen R','naveen.r63@nmit.edu','hash_s63','Student',8,'2020-10-08 00:00:00','2025-10-26 14:16:03',NULL,1),(64,'Sana A','sana.a64@acharya.edu','hash_s64','Student',9,'2020-10-09 00:00:00','2025-10-26 14:16:03',NULL,1),(65,'Raghav D','raghav.d65@cmr.edu','hash_s65','Student',10,'2020-10-10 00:00:00','2025-10-26 14:16:03',NULL,1),(66,'Shruti K','shruti.k66@reva.edu','hash_s66','Student',11,'2020-10-11 00:00:00','2025-10-26 14:16:03',NULL,1),(67,'Irfan H','irfan.h67@christuniversity.in','hash_s67','Student',12,'2020-10-12 00:00:00','2025-10-26 14:16:03',NULL,1),(68,'Latha P','latha.p68@jainuniversity.ac.in','hash_s68','Student',13,'2020-10-13 00:00:00','2025-10-26 14:16:03',NULL,1),(69,'Deepak M','deepak.m69@alliance.edu','hash_s69','Student',14,'2020-10-14 00:00:00','2025-10-26 14:16:03',NULL,1),(70,'Priya R','priya.r70@presidency.edu','hash_s70','Student',15,'2020-10-15 00:00:00','2025-10-26 14:16:03',NULL,1),(71,'Arjun V','arjun.v71@cambridgeit.edu','hash_s71','Student',1,'2021-01-05 00:00:00','2025-10-26 14:16:03',NULL,1),(72,'Bhavya T','bhavya.t72@rvce.edu','hash_s72','Student',2,'2021-01-06 00:00:00','2025-10-26 14:16:03',NULL,1),(73,'Chirag P','chirag.p73@bmsce.ac.in','hash_s73','Student',3,'2021-01-07 00:00:00','2025-10-26 14:16:03',NULL,1),(74,'Diya S','diya.s74@pes.edu','hash_s74','Student',4,'2021-01-08 00:00:00','2025-10-26 14:16:03',NULL,1),(75,'Eshan K','eshan.k75@msrit.edu','hash_s75','Student',5,'2021-01-09 00:00:00','2025-10-26 14:16:03',NULL,1),(76,'Fathima N','fathima.n76@dsce.edu','hash_s76','Student',6,'2021-01-10 00:00:00','2025-10-26 14:16:03',NULL,1),(77,'Gokul R','gokul.r77@nhce.edu','hash_s77','Student',7,'2021-01-11 00:00:00','2025-10-26 14:16:03',NULL,1),(78,'Hema L','hema.l78@nmit.edu','hash_s78','Student',8,'2021-01-12 00:00:00','2025-10-26 14:16:03',NULL,1),(79,'Ishaan B','ishaan.b79@acharya.edu','hash_s79','Student',9,'2021-01-13 00:00:00','2025-10-26 14:16:03',NULL,1),(80,'Jaya M','jaya.m80@cmr.edu','hash_s80','Student',10,'2021-01-14 00:00:00','2025-10-26 14:16:03',NULL,1),(81,'Kavya S','kavya.s81@reva.edu','hash_s81','Student',11,'2021-01-15 00:00:00','2025-10-26 14:16:03',NULL,1),(82,'Lakshmi D','lakshmi.d82@christuniversity.in','hash_s82','Student',12,'2021-02-01 00:00:00','2025-10-26 14:16:03',NULL,1),(83,'Manoj K','manoj.k83@jainuniversity.ac.in','hash_s83','Student',13,'2021-02-02 00:00:00','2025-10-26 14:16:03',NULL,1),(84,'Naina R','naina.r84@alliance.edu','hash_s84','Student',14,'2021-02-03 00:00:00','2025-10-26 14:16:03',NULL,1),(85,'Omar F','omar.f85@presidency.edu','hash_s85','Student',15,'2021-02-04 00:00:00','2025-10-26 14:16:03',NULL,1),(86,'Pavan T','pavan.t86@cambridgeit.edu','hash_s86','Student',1,'2021-03-01 00:00:00','2025-10-26 14:16:03',NULL,1),(87,'Qamar S','qamar.s87@rvce.edu','hash_s87','Student',2,'2021-03-02 00:00:00','2025-10-26 14:16:03',NULL,1),(88,'Rina P','rina.p88@bmsce.ac.in','hash_s88','Student',3,'2021-03-03 00:00:00','2025-10-26 14:16:03',NULL,1),(89,'Sahil M','sahil.m89@pes.edu','hash_s89','Student',4,'2021-03-04 00:00:00','2025-10-26 14:16:03',NULL,1),(90,'Trisha V','trisha.v90@msrit.edu','hash_s90','Student',5,'2021-03-05 00:00:00','2025-10-26 14:16:03',NULL,1),(91,'Uday R','uday.r91@dsce.edu','hash_s91','Student',6,'2021-03-06 00:00:00','2025-10-26 14:16:03',NULL,1),(92,'Vidya N','vidya.n92@nhce.edu','hash_s92','Student',7,'2021-03-07 00:00:00','2025-10-26 14:16:03',NULL,1),(93,'Waseem K','waseem.k93@nmit.edu','hash_s93','Student',8,'2021-03-08 00:00:00','2025-10-26 14:16:03',NULL,1),(94,'Yash S','yash.s94@acharya.edu','hash_s94','Student',9,'2021-03-09 00:00:00','2025-10-26 14:16:03',NULL,1),(95,'Zara A','zara.a95@cmr.edu','hash_s95','Student',10,'2021-03-10 00:00:00','2025-10-26 14:16:03',NULL,1),(96,'VBrock','tarunsa0911@gmail.com','$argon2id$v=19$m=65536,t=3,p=4$KIWQck5pLWWstfae07o35g$NE1J1loMgH4KhjVMZEt9QkHZAMjX/TrmW/mG1L6jzhc','Student',NULL,'2025-10-27 11:06:16','2025-10-27 11:06:16',NULL,1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workletstage`
--

DROP TABLE IF EXISTS `workletstage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workletstage` (
  `StageID` int NOT NULL,
  `Stage` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`StageID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workletstage`
--

LOCK TABLES `workletstage` WRITE;
/*!40000 ALTER TABLE `workletstage` DISABLE KEYS */;
INSERT INTO `workletstage` VALUES (1,'First Review'),(2,'Second Review'),(3,'Mid Review'),(4,'Fourth Review'),(5,'End Review'),(6,'Extended Review'),(7,'Add OC');
/*!40000 ALTER TABLE `workletstage` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-28 14:46:29
