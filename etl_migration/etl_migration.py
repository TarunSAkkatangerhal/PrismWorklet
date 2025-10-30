import argparse
import os
import sys
import pandas as pd
from sqlalchemy import create_engine, text
from datetime import datetime, timedelta


# Helper: convert pandas NaN to None for SQL
def nan_to_none(val):
    """Convert pandas NaN/NaT to None for SQL compatibility."""
    if pd.isna(val):
        return None
    return val


# Helper: robust CSV loader with encoding fallbacks
def try_read_csv(path, enc=None):
    """Try reading CSV using a list of common encodings.

    If enc is provided, try that encoding only. Otherwise try utf-8, utf-8-sig,
    cp1252, latin-1, and finally a latin-1 fallback.
    """
    tried = []
    encodings = [enc] if enc else ["utf-8", "utf-8-sig", "cp1252", "latin-1"]
    last_exc = None
    for e in encodings:
        if e in tried or e is None:
            continue
        tried.append(e)
        try:
            df = pd.read_csv(path, encoding=e)
            print(f"Successfully read CSV using {e} encoding")
            return df
        except UnicodeDecodeError as ue:
            last_exc = ue
            # Silently try next encoding
        except Exception as ex:
            last_exc = ex
            # Silently try next encoding

    # Final fallback: read using latin-1 (will not raise UnicodeDecodeError but may alter characters)
    try:
        df = pd.read_csv(path, encoding="latin-1", low_memory=False)
        print(f"Successfully read CSV using latin-1 encoding (fallback)")
        return df
    except Exception as ex:
        print(f"Error: Could not read {path!r} with any encoding. Last error: {last_exc}")
        raise


# Step 1: Setup DB connection (kept as-is; does not connect until used)
engine = create_engine("mysql+pymysql://root:Nikhil7105%40@localhost/prismtest")


# CLI: allow forcing an encoding or performing a test-parse only
parser = argparse.ArgumentParser(description="ETL migration script")
parser.add_argument("--encoding", help="Force CSV encoding (e.g. utf-8, cp1252)")
parser.add_argument("--test-parse", action="store_true", help="Only parse the CSV and exit (no DB writes)")
args = parser.parse_args()

# Step 2: Load old data with robust encoding handling
csv_path = os.environ.get("OLD_DATA_CSV", "old_data.csv")
try:
    df = try_read_csv(csv_path, enc=args.encoding)
except FileNotFoundError:
    print(f"File not found: {csv_path}")
    sys.exit(1)
except Exception as e:
    print("Error reading CSV:", e)
    sys.exit(1)

if args.test_parse:
    print("CSV parsed successfully. Rows:", len(df))
    try:
        print(df.head(5).to_string(index=False))
    except Exception:
        # Data may contain binary blobs — still consider parse successful
        print("(could not pretty-print first rows)")
    sys.exit(0)

# Step 3: Ensure default TechDomain and Status exist
with engine.begin() as conn:
    # Insert default TechDomain if it doesn't exist
    conn.execute(text("""
        INSERT IGNORE INTO TechDomain (TechDomainID, DomainName, Description)
        VALUES (1, 'General', 'Default tech domain for migration')
    """))
    
    # Insert default Status if it doesn't exist (StatusID 10 from CSV)
    conn.execute(text("""
        INSERT IGNORE INTO status (StatusID, StatusName)
        VALUES (10, 'Ongoing')
    """))
    
    # Insert default TeamMG if it doesn't exist
    conn.execute(text("""
        INSERT IGNORE INTO TeamMG (TeamMGID, TeamName, Description)
        VALUES (1, 'General Team', 'Default team for migration')
    """))

print("Ensured default TechDomain, Status, and TeamMG records exist")

# Step 4: Insert Colleges
college_map = {}
for college in df['College'].dropna().unique():
    with engine.begin() as conn:
        result = conn.execute(text("INSERT IGNORE INTO colleges (college_name) VALUES (:name)"), {"name": college})
        college_id = conn.execute(text("SELECT college_id FROM colleges WHERE college_name = :name"), {"name": college}).scalar()
        college_map[college] = college_id

# Step 6: Insert Users (Mentors, Professors, Students)
user_map = {}

def insert_user(name, email, contact, role, college_name, active_flag):
    if pd.isna(name) or pd.isna(email):
        return None
    college_id = college_map.get(college_name)
    is_active = 1 if str(active_flag).strip().upper() == 'YES' else 0
    with engine.begin() as conn:
        conn.execute(text("""
            INSERT IGNORE INTO users (name, email, password_hash, role, college_id, is_active)
            VALUES (:name, :email, 'dummyhash', :role, :college_id, :is_active)
        """), {
            "name": name, "email": email, "role": role,
            "college_id": college_id, "is_active": is_active
        })
        user_id = conn.execute(text("SELECT user_id FROM users WHERE email = :email"), {"email": email}).scalar()
        user_map[email] = user_id
        return user_id

# Insert Users (Mentors, Professors, Students) per-row
# Iterate rows once and insert users found in each row. This avoids passing
# entire Series objects to insert_user (which caused ambiguous truth-value errors).
for idx, row in df.iterrows():
    college_name = row.get('College')

    # Mentors
    for i in range(1, 4):
        name = row.get(f'Mentor{i}')
        email = row.get(f'Mentor{i}EmailID')
        contact = row.get(f'Mentor{i}Contact')
        insert_user(name, email, contact, 'Mentor', college_name, 1)

    # Professors
    for i in range(1, 5):
        name = row.get(f'Prof{i}Name')
        email = row.get(f'Prof{i}EmailID')
        contact = row.get(f'Prof{i}Contact')
        insert_user(name, email, contact, 'Professor', college_name, 1)

    # Students
    for i in range(1, 9):
        name = row.get(f'Student{i}Name')
        email = row.get(f'Student{i}EmailID')
        contact = row.get(f'Student{i}Contact')
        active_flag = row.get(f'ACTIVE_{i}')
        insert_user(name, email, contact, 'Student', college_name, active_flag)

# Step 7: Insert Worklets
for idx, row in df.iterrows():
    # Get WorkletID directly from CSV
    worklet_id = nan_to_none(row.get('WorkletID'))
    if worklet_id is None:
        print(f"Warning: Row {idx} has no WorkletID, skipping...")
        continue
    
    mentor_email = row['Mentor1EmailID']
    mentor_id = user_map.get(mentor_email)
    college_id = college_map.get(row['College'])
    
    # Get TeamMGID directly from CSV TeamID column
    team_mg_id = nan_to_none(row.get('TeamID'))
    if team_mg_id is None:
        team_mg_id = 1  # Default to 1 if not provided
    
    # Convert NaN to None for SQL compatibility
    assigned_date = nan_to_none(row.get('AssignedDate'))
    created_on = nan_to_none(row.get('CreatedOn'))
    risk_status = nan_to_none(row.get('RiskStatus'))
    performance_status = nan_to_none(row.get('PerformanceStatus'))
    
    # Use current datetime as fallback only if value is None
    start_date = assigned_date if assigned_date is not None else datetime.now()
    created_on_val = created_on if created_on is not None else datetime.now()
    
    # Get optional fields from CSV or set defaults for required fields
    image_path = nan_to_none(row.get('ImagePath', ''))
    if image_path is None:
        image_path = ''
    
    problem_stmt = nan_to_none(row.get('ProblemStmt', ''))
    if problem_stmt is None:
        problem_stmt = ''
    
    expectations = nan_to_none(row.get('Expectations', ''))
    if expectations is None:
        expectations = ''
    
    prerequest = nan_to_none(row.get('Prerequest', ''))
    if prerequest is None:
        prerequest = ''
    
    tech_domain_id = nan_to_none(row.get('TechDomainID', 1))
    if tech_domain_id is None or tech_domain_id == 0:
        tech_domain_id = 1
    
    progress = nan_to_none(row.get('Progress', 0))
    if progress is None:
        progress = 0
    
    # Get EndDate from CSV or use StartDate + 6 months as default (approx 180 days)
    end_date_val = nan_to_none(row.get('EndDate'))
    if end_date_val is None:
        # Default: ~6 months (180 days) from start date
        end_date_val = start_date + timedelta(days=180) if isinstance(start_date, datetime) else datetime.now() + timedelta(days=180)
    
    # Get CertID from CSV
    cert_id = nan_to_none(row.get('CertID'))
    
    # Get GitPath from CSV and map to GitHubUrl
    github_url = nan_to_none(row.get('GitPath'))
    
    with engine.begin() as conn:
        conn.execute(text("""
            INSERT INTO Prism_Worklet (
                WorkletID, Title, StatusID, CreatedMentorID, CollegeID, StartDate, CreatedOn, 
                RiskStatus, Performance, IsActive, ImagePath, ProblemStmt, Expectations, 
                Prerequest, TechDomainID, Progress, EndDate, CertID, TeamMGID, GitHubUrl
            ) VALUES (
                :worklet_id, :title, :status_id, :mentor_id, :college_id, :start_date, :created_on, 
                :risk, :performance, 1, :image_path, :problem_stmt, :expectations, 
                :prerequest, :tech_domain_id, :progress, :end_date, :cert_id, :team_mg_id, :github_url
            )
        """), {
            "worklet_id": worklet_id,
            "title": row['WorkletDescription'],
            "status_id": row['StatusID'],
            "mentor_id": mentor_id,
            "college_id": college_id,
            "start_date": start_date,
            "created_on": created_on_val,
            "risk": risk_status,
            "performance": performance_status,
            "image_path": image_path,
            "problem_stmt": problem_stmt,
            "expectations": expectations,
            "prerequest": prerequest,
            "tech_domain_id": tech_domain_id,
            "progress": progress,
            "end_date": end_date_val,
            "cert_id": cert_id,
            "team_mg_id": team_mg_id,
            "github_url": github_url
        })


# Step 8: Insert User–Worklet Associations
for idx, row in df.iterrows():
    # Get WorkletID directly from CSV
    worklet_id = nan_to_none(row.get('WorkletID'))
    
    # Skip if worklet ID is missing
    if worklet_id is None:
        continue

    # Mentors
    for i in range(1, 4):
        email = row.get(f'Mentor{i}EmailID')
        user_id = user_map.get(email)
        if user_id:
            with engine.begin() as conn:
                conn.execute(text("""
                    INSERT IGNORE INTO user_worklet_association (user_id, WorkletID, role_in_worklet)
                    VALUES (:uid, :wid, 'Mentor')
                """), {"uid": user_id, "wid": worklet_id})

    # Professors
    for i in range(1, 5):
        email = row.get(f'Prof{i}EmailID')
        user_id = user_map.get(email)
        if user_id:
            with engine.begin() as conn:
                conn.execute(text("""
                    INSERT IGNORE INTO user_worklet_association (user_id, WorkletID, role_in_worklet)
                    VALUES (:uid, :wid, 'Professor')
                """), {"uid": user_id, "wid": worklet_id})

    # Students
    for i in range(1, 9):
        email = row.get(f'Student{i}EmailID')
        user_id = user_map.get(email)
        if user_id:
            with engine.begin() as conn:
                conn.execute(text("""
                    INSERT IGNORE INTO user_worklet_association (user_id, WorkletID, role_in_worklet)
                    VALUES (:uid, :wid, 'Student')
                """), {"uid": user_id, "wid": worklet_id})