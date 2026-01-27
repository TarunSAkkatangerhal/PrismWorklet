"""
PRISM Database Dummy Data Generator
Adds: 8 Colleges, 250 Worklets, 280 Users (Mentors, Professors, Students)
Uses MySQL database
"""

import mysql.connector
from datetime import datetime, timedelta, date
import random
import hashlib

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '123456789',
    'database': 'prism'
}

# Sample data
COLLEGES = [
    ('RV College of Engineering', 'Bangalore', 1963, 'Excellent', 'Computer Science, AI/ML, Robotics'),
    ('PES University', 'Bangalore', 1988, 'Excellent', 'Engineering, Technology, Management'),
    ('Manipal Institute of Technology', 'Manipal', 1957, 'Excellent', 'Engineering, Medical Sciences, AI'),
    ('VIT Vellore', 'Vellore', 1984, 'Excellent', 'Engineering, Science, Technology'),
    ('BITS Pilani', 'Pilani', 1964, 'Outstanding', 'Engineering, Science, Research'),
    ('NIT Surathkal', 'Surathkal', 1960, 'Excellent', 'Engineering, Technology, Research'),
    ('IIIT Bangalore', 'Bangalore', 1999, 'Excellent', 'Computer Science, AI, Data Science'),
    ('Amrita Vishwa Vidyapeetham', 'Bangalore', 1994, 'Excellent', 'Engineering, Research, Innovation')
]

TECH_DOMAINS = [
    ('Machine Learning', 'Machine Learning and Deep Learning projects'),
    ('Computer Vision', 'Image processing and computer vision applications'),
    ('Natural Language Processing', 'NLP and text processing projects'),
    ('IoT & Embedded Systems', 'Internet of Things and embedded hardware'),
    ('Cloud Computing', 'Cloud infrastructure and services'),
    ('Cybersecurity', 'Security and privacy related projects'),
    ('Mobile Development', 'Android and iOS application development'),
    ('Web Development', 'Full-stack web applications'),
    ('Data Science', 'Data analytics and visualization'),
    ('Blockchain', 'Distributed ledger technology'),
    ('Robotics', 'Robotics and automation'),
    ('AR/VR', 'Augmented and Virtual Reality'),
    ('DevOps', 'CI/CD and infrastructure automation')
]

WORKLET_TITLES = [
    'AI-Powered Healthcare Diagnosis System',
    'Smart City Traffic Management Platform',
    'Blockchain-based Supply Chain Tracker',
    'Real-time Object Detection for Autonomous Vehicles',
    'Natural Language Chatbot for Customer Service',
    'IoT-based Smart Home Automation',
    'Cybersecurity Threat Detection using ML',
    'E-Commerce Recommendation Engine',
    'Cloud-based Video Streaming Platform',
    'Sentiment Analysis for Social Media',
    'Robotic Process Automation Tool',
    'AR Navigation System for Indoor Spaces',
    'Machine Learning Model Deployment Pipeline',
    'Predictive Maintenance System for Manufacturing',
    'Voice-Controlled Personal Assistant',
    'Facial Recognition Attendance System',
    'Agricultural Yield Prediction using AI',
    'Energy Consumption Optimization Tool',
    'Medical Image Segmentation System',
    'Real-time Language Translation App',
    'Fraud Detection in Financial Transactions',
    'Personalized Learning Management System',
    'Drone-based Surveillance System',
    'Smart Water Quality Monitoring',
    'AI-based Resume Screening Tool',
    'Virtual Reality Training Simulator',
    'COVID-19 Contact Tracing Application',
    'Automated Code Review System',
    'Stock Market Prediction Model',
    'Weather Forecasting using Deep Learning',
    'Document Classification and Tagging System',
    'Gesture Recognition Interface',
    'Network Intrusion Detection System',
    'Cloud Infrastructure Cost Optimizer',
    'AI Music Generation System',
    'Smart Parking Management Solution',
    'Emotion Detection from Speech',
    'Automated Content Moderation Tool',
    ' 3D Object Reconstruction from Images',
    'Personalized News Aggregator',
    'Smart Agriculture Irrigation System',
    'Video Surveillance Analytics',
    'AI-powered Code Completion Tool',
    'Virtual Event Platform',
    'Waste Management Optimization System',
    'AI Tutor for Programming',
    'Real-time Sports Analytics Dashboard',
    'Smart Grid Energy Management',
    'Medical Prescription Digitization',
    'Multi-modal Sentiment Analysis'
]

def get_hashed_password(email):
    """Generate a consistent hash for password"""
    return f"$2b$12${hashlib.md5(email.encode()).hexdigest()[:22]}"

def add_colleges(cursor):
    """Add 8 new colleges"""
    print("Adding colleges...")
    for college in COLLEGES:
        cursor.execute("""
            INSERT INTO colleges (college_name, location, established, infrastructure, area_of_expertise) 
            VALUES (%s, %s, %s, %s, %s)
        """, college)
    print(f"✓ Added {len(COLLEGES)} colleges")

def add_tech_domains(cursor):
    """Add new tech domains"""
    print("Adding tech domains...")
    for domain in TECH_DOMAINS:
        cursor.execute("""
            INSERT INTO techdomain (DomainName, Description) 
            VALUES (%s, %s)
        """, domain)
    print(f"✓ Added {len(TECH_DOMAINS)} tech domains")

def add_teams(cursor, college_ids):
    """Add teams for new colleges"""
    print("Adding teams...")
    teams = []
    team_names = ['Innovation', 'Research', 'Tech', 'Labs', 'Creators', 'Pioneers', 'Innovators', 'Developers']
    
    # Get college names
    cursor.execute("SELECT college_id, college_name FROM colleges WHERE college_id >= %s", (college_ids[0],))
    colleges = cursor.fetchall()
    
    for college_id, college_name in colleges:
        # Extract short name
        short_name = college_name.split()[0]
        for team_type in team_names[:2]:  # 2 teams per college
            team_name = f"{short_name}-{team_type}"
            description = f"{college_name} {team_type} Team"
            cursor.execute("""
                INSERT INTO teammg (TeamName, Description) 
                VALUES (%s, %s)
            """, (team_name, description))
            teams.append(cursor.lastrowid)
    
    print(f"✓ Added {len(teams)} teams")
    return teams

def add_users(cursor, college_ids):
    """Add mentors, professors, and students"""
    print("Adding users...")
    
    # Generate mentors (20 per new college = 160 total, but let's add 50 for distribution)
    mentors = []
    for i in range(50):
        college_id = random.choice(college_ids)
        name = f"Mentor_{i+1}"
        email = f"mentor{i+1}@college{college_id}.edu.in"
        cursor.execute("""
            INSERT INTO users (name, email, password_hash, role, college_id, created_at, is_active, profile_completed) 
            VALUES (%s, %s, %s, 'Mentor', %s, NOW(), 1, 1)
        """, (name, email, get_hashed_password(email), college_id))
        mentors.append(cursor.lastrowid)
    
    # Generate professors (30 total)
    professors = []
    for i in range(30):
        college_id = random.choice(college_ids)
        name = f"Professor_{i+1}"
        email = f"prof{i+1}@college{college_id}.edu.in"
        cursor.execute("""
            INSERT INTO users (name, email, password_hash, role, college_id, created_at, is_active, profile_completed) 
            VALUES (%s, %s, %s, 'Professor', %s, NOW(), 1, 1)
        """, (name, email, get_hashed_password(email), college_id))
        professors.append(cursor.lastrowid)
    
    # Generate students (200 total - 25 per college)
    students = []
    for college_id in college_ids:
        for i in range(25):
            name = f"Student_C{college_id}_{i+1}"
            email = f"student{college_id}_{i+1}@college{college_id}.edu.in"
            cursor.execute("""
                INSERT INTO users (name, email, password_hash, role, college_id, created_at, is_active, profile_completed) 
                VALUES (%s, %s, %s, 'Student', %s, NOW(), 1, 1)
            """, (name, email, get_hashed_password(email), college_id))
            students.append(cursor.lastrowid)
    
    print(f"✓ Added {len(mentors)} mentors, {len(professors)} professors, {len(students)} students")
    return mentors, professors, students

def generate_worklets(cursor, college_ids, team_ids, mentor_ids, domain_ids):
    """Generate 250 worklets distributed across years"""
    print("Generating 250 worklets...")
    
    worklet_ids = []
    
    # Distribution: 2023: 40, 2024: 70, 2025: 90, 2026: 50
    year_distribution = {
        2023: 40,
        2024: 70,
        2025: 90,
        2026: 50
    }
    
    worklet_counter = 1
    for year, count in year_distribution.items():
        for i in range(count):
            # Random worklet title
            title = f"{random.choice(WORKLET_TITLES)} - {year}_{i+1}"
            
            # Random dates within the year
            start_month = random.randint(1, 9)
            start_day = random.randint(1, 28)
            start_date = date(year, start_month, start_day)
            
            # End date 3-6 months later
            end_month_offset = random.randint(3, 6)
            end_date = start_date + timedelta(days=end_month_offset * 30)
            
            # Determine status based on year
            if year < 2026:
                # Past years - mostly completed
                status_id = 2 if random.random() < 0.8 else random.choice([1, 3])
                progress = 100 if status_id == 2 else random.randint(50, 95)
            else:
                # Current year - mix of statuses
                status_id = random.choices([1, 2, 3], weights=[0.6, 0.3, 0.1])[0]
                progress = 100 if status_id == 2 else random.randint(30, 90)
            
            # Random assignments
            college_id = random.choice(college_ids)
            team_id = random.choice(team_ids)
            mentor_id = random.choice(mentor_ids)
            domain_id = random.choice(domain_ids)
            
            # Performance ratings
            performance = random.choice(['Good', 'Very Good', 'Excellent', 'Average', None])
            risk_status = random.choice(['Safe', 'Medium', 'High', None])
            
            cert_id = f"PRISM-{year}-{worklet_counter:04d}"
            
            cursor.execute("""
                INSERT INTO prism_worklet (
                    Title, ImagePath, ProblemStmt, Expectations, Prerequest,
                    TechDomainID, StatusID, CreatedOn, CreatedMentorID, Progress,
                    StartDate, EndDate, CertID, TeamMGID, CollegeID, IsActive,
                    Performance, RiskStatus
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                title,
                '/images/default_worklet.png',
                f'Problem statement for {title}',
                'Expected outcomes and deliverables',
                'Prerequisites and requirements',
                domain_id,
                status_id,
                datetime.now(),
                mentor_id,
                progress,
                start_date,
                end_date,
                cert_id,
                team_id,
                college_id,
                1,
                performance,
                risk_status
            ))
            
            worklet_ids.append(cursor.lastrowid)
            worklet_counter += 1
        
        print(f"  ✓ Generated {count} worklets for year {year}")
    
    print(f"✓ Total worklets generated: {len(worklet_ids)}")
    return worklet_ids

def add_worklet_associations(cursor, worklet_ids, mentor_ids, student_ids, professor_ids):
    """Add user-worklet associations"""
    print("Adding worklet associations...")
    
    association_count = 0
    for worklet_id in worklet_ids:
        # Assign 1 mentor
        mentor_id = random.choice(mentor_ids)
        cursor.execute("""
            INSERT INTO user_worklet_association (user_id, WorkletID, role_in_worklet) 
            VALUES (%s, %s, 'Mentor')
        """, (mentor_id, worklet_id))
        association_count += 1
        
        # Assign 2-4 students
        num_students = random.randint(2, 4)
        selected_students = random.sample(student_ids, min(num_students, len(student_ids)))
        for student_id in selected_students:
            try:
                cursor.execute("""
                    INSERT INTO user_worklet_association (user_id, WorkletID, role_in_worklet) 
                    VALUES (%s, %s, 'Student')
                """, (student_id, worklet_id))
                association_count += 1
            except:
                pass  # Skip duplicates
        
        # Assign 1 professor (50% chance)
        if random.random() < 0.5:
            professor_id = random.choice(professor_ids)
            try:
                cursor.execute("""
                    INSERT INTO user_worklet_association (user_id, WorkletID, role_in_worklet) 
                    VALUES (%s, %s, 'Professor')
                """, (professor_id, worklet_id))
                association_count += 1
            except:
                pass
    
    print(f"✓ Added {association_count} worklet associations")

def main():
    print("=" * 60)
    print("PRISM Database Dummy Data Generator")
    print("=" * 60)
    print()
    
    try:
        # Connect to database
        print("Connecting to database...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✓ Connected to database\n")
        
        # Get existing data
        cursor.execute("SELECT MAX(college_id) FROM colleges")
        last_college_id = cursor.fetchone()[0] or 0
        
        # Add colleges
        add_colleges(cursor)
        conn.commit()
        
        # Get new college IDs
        cursor.execute("SELECT college_id FROM colleges WHERE college_id > %s", (last_college_id,))
        new_college_ids = [row[0] for row in cursor.fetchall()]
        print(f"New college IDs: {new_college_ids}\n")
        
        # Add tech domains
        add_tech_domains(cursor)
        conn.commit()
        
        # Get all domain IDs
        cursor.execute("SELECT TechDomainID FROM techdomain")
        domain_ids = [row[0] for row in cursor.fetchall()]
        
        # Add teams
        team_ids = add_teams(cursor, new_college_ids)
        conn.commit()
        
        # Get all team IDs
        cursor.execute("SELECT TeamMGID FROM teammg")
        all_team_ids = [row[0] for row in cursor.fetchall()]
        
        # Add users
        mentor_ids, professor_ids, student_ids = add_users(cursor, new_college_ids)
        conn.commit()
        
        # Get all mentor IDs
        cursor.execute("SELECT user_id FROM users WHERE role='Mentor'")
        all_mentor_ids = [row[0] for row in cursor.fetchall()]
        
        print()
        
        # Generate worklets
        worklet_ids = generate_worklets(cursor, new_college_ids, all_team_ids, all_mentor_ids, domain_ids)
        conn.commit()
        
        print()
        
        # Add associations
        cursor.execute("SELECT user_id FROM users WHERE role='Student'")
        all_student_ids = [row[0] for row in cursor.fetchall()]
        
        cursor.execute("SELECT user_id FROM users WHERE role='Professor'")
        all_professor_ids = [row[0] for row in cursor.fetchall()]
        
        add_worklet_associations(cursor, worklet_ids, all_mentor_ids, all_student_ids, all_professor_ids)
        conn.commit()
        
        print()
        print("=" * 60)
        print("✓ DUMMY DATA GENERATION COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print(f"\nSummary:")
        print(f"  - Colleges: {len(COLLEGES)}")
        print(f"  - Tech Domains: {len(TECH_DOMAINS)}")
        print(f"  - Teams: {len(team_ids)}")
        print(f"  - Mentors: {len(mentor_ids)}")
        print(f"  - Professors: {len(professor_ids)}")
        print(f"  - Students: {len(student_ids)}")
        print(f"  - Worklets: {len(worklet_ids)}")
        print()
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as err:
        print(f"✗ Database error: {err}")
        return 1
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
