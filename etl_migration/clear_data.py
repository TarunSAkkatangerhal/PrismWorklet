from sqlalchemy import create_engine, text

engine = create_engine('mysql+pymysql://root:Nikhil7105%40@localhost/prismtest')

with engine.begin() as conn:
    # Clear all migration data (in reverse order due to foreign keys)
    print("Clearing data from all tables...")
    
    # Tables with foreign keys to other tables (delete first)
    conn.execute(text("DELETE FROM Prism_Suggestion"))
    conn.execute(text("DELETE FROM meeting_worklet_association"))
    conn.execute(text("DELETE FROM meeting_recurrence"))
    conn.execute(text("DELETE FROM meetings"))
    conn.execute(text("DELETE FROM evaluations"))
    conn.execute(text("DELETE FROM achievements"))
    conn.execute(text("DELETE FROM papers"))
    conn.execute(text("DELETE FROM patents"))
    conn.execute(text("DELETE FROM commercializations"))
    conn.execute(text("DELETE FROM user_worklet_association"))
    conn.execute(text("DELETE FROM user_profiles"))
    
    # Main tables
    conn.execute(text("DELETE FROM Prism_Worklet"))
    conn.execute(text("DELETE FROM users"))
    conn.execute(text("DELETE FROM colleges"))
    
    # Lookup/Reference tables (NOT cleared - keeping existing data)
    # conn.execute(text("DELETE FROM TechDomain"))
    # conn.execute(text("DELETE FROM TeamMG"))
    # conn.execute(text("DELETE FROM status"))
    # conn.execute(text("DELETE FROM WorkletStage"))
    
    print("✓ Cleared all migration data from tables.")
    print("  - Prism_Suggestion")
    print("  - meeting_worklet_association")
    print("  - meeting_recurrence")
    print("  - meetings")
    print("  - evaluations")
    print("  - achievements")
    print("  - papers")
    print("  - patents")
    print("  - commercializations")
    print("  - user_worklet_association")
    print("  - user_profiles")
    print("  - Prism_Worklet")
    print("  - users")
    print("  - colleges")
    print("\n✓ Kept reference tables: TechDomain, TeamMG, status, WorkletStage")
    print("\nReady to re-run ETL.")
