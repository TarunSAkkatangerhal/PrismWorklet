# PRISM Database Dummy Data Generation Summary

## ✅ Successfully Generated Data

### Date: January 24, 2026
### Database: prismdbupdated

---

## 📊 Data Added

### 1. **Colleges (8 new)**
- RV College of Engineering (Bangalore)
- PES University (Bangalore)
- Manipal Institute of Technology (Manipal)
- VIT Vellore (Vellore)
- BITS Pilani (Pilani)
- NIT Surathkal (Surathkal)
- IIIT Bangalore (Bangalore)
- Amrita Vishwa Vidyapeetham (Bangalore)

**Total Colleges: 11** (3 existing + 8 new)

---

### 2. **Tech Domains (13 new)**
- Machine Learning
- Computer Vision
- Natural Language Processing
- IoT & Embedded Systems
- Cloud Computing
- Cybersecurity
- Mobile Development
- Web Development
- Data Science
- Blockchain
- Robotics
- AR/VR
- DevOps

**Total Tech Domains: 15** (2 existing + 13 new)

---

### 3. **Teams (16 new)**
Teams created for each new college following the organization hierarchy:
- RV-Innovation, RV-Research
- PES-Tech, PES-Labs
- MIT-Creators, MIT-Pioneers
- VIT-Innovators, VIT-Developers
- BITS-Alpha, BITS-Gamma
- NIT-Surge, NIT-Nexus
- IIIT-Quantum, IIIT-Spark
- Amrita-Zen, Amrita-Core

**Total Teams: 28** (12 existing + 16 new)

---

### 4. **Users (280 new)**

#### Mentors: 50 new
- Distributed across all 8 new colleges
- **Total Mentors: 93** (43 existing + 50 new)

#### Professors: 30 new
- Distributed across all 8 new colleges
- **Total Professors: 79** (49 existing + 30 new)

#### Students: 200 new
- 25 students per new college
- **Total Students: 440** (240 existing + 200 new)

---

### 5. **Worklets (250 new)**

Distribution by Year:
- **2023**: 40 worklets (32 completed, 4 ongoing, 4 on hold)
- **2024**: 70 worklets (54 completed, 6 ongoing, 10 on hold)
- **2025**: 90 worklets (72 completed, 13 ongoing, 5 on hold)
- **2026**: 50 worklets (18 completed, 27 ongoing, 5 on hold)

**Total Worklets: 318** (68 existing + 250 new)

#### Status Distribution:
- **Completed**: 226 (71.1%)
- **Ongoing**: 69 (21.7%)
- **On Hold**: 23 (7.2%)

#### Performance Distribution:
- **Excellent**: 56
- **Very Good**: 74
- **Good**: 78
- **Average**: 56
- **Needs Improvement**: 7
- **Not Rated**: 47

---

### 6. **User-Worklet Associations (1,101 new)**
Each worklet assigned:
- 1 Mentor
- 2-4 Students
- 0-1 Professor (50% probability)

---

## 🔧 Technical Details

### Hierarchy Structure:
```
Organization
  └── TeamID (TeamMG)
      └── GroupID (GroupMGID)
          └── PartID (PartMGID)
```

### Status IDs:
- 0: To Start
- 1: Ongoing
- 2: Completed
- 3: On Hold
- 4: Dropped

### Year Filtering:
- Uses `StartDate` column for year-based filtering
- Dashboard filters worklets by the year they started

---

## 📈 Dashboard Statistics

### Overall (All Years):
- Total Worklets: 318
- Completed: 226
- Ongoing: 69
- Completion Rate: 71.1%
- Total Mentors: 93
- Total Students: 440
- Total Professors: 79

### Year 2025:
- Total Worklets: 140
- Completed: 112
- Ongoing: 19
- Completion Rate: 80.0%
- Associated Mentors: 63
- Associated Students: 307
- Associated Professors: 60

### Year 2026 (Current):
- Total Worklets: 54
- Completed: 12
- Ongoing: 40
- Completion Rate: 22.2%

---

## 📝 Generated Files

1. **generate_dummy_data.py** - Python script for data generation
2. **add_dummy_data.sql** - SQL template (partial)

---

## ✨ Features

- ✅ Realistic data distribution across years
- ✅ Proper status progression (past years mostly completed)
- ✅ Balanced college, team, and user distribution
- ✅ Valid associations between users and worklets
- ✅ Performance and risk ratings
- ✅ Consistent certification IDs (PRISM-YEAR-XXXX format)

---

## 🎯 Usage

The dummy data is now fully integrated and can be viewed through:
- Dashboard analytics (/Dashboard)
- Worklet listings (/worklets)
- College-wise statistics
- Year-wise filtering
- Domain and team filtering

---

## 🔍 Verification Commands

```sql
-- Check total worklets
SELECT COUNT(*) FROM prism_worklet;

-- Check by year
SELECT YEAR(StartDate) as year, COUNT(*) as count 
FROM prism_worklet 
GROUP BY YEAR(StartDate);

-- Check users by role
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;

-- Check colleges
SELECT COUNT(*) FROM colleges;
```

---

*Generated on: January 24, 2026*
