"""
Quick script to check Performance column values in the database
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

# Create engine
engine = create_engine(settings.DATABASE_URL)

# Query Performance values
with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT WorkletID, CertID, Title, Performance 
        FROM Prism_Worklet 
        WHERE WorkletID IN (2460, 2461, 2462, 2463)
        ORDER BY WorkletID
    """))
    
    print("\nPerformance column values in database:\n")
    print(f"{'WorkletID':<12} {'CertID':<10} {'Title':<40} {'Performance':<20}")
    print("-" * 85)
    
    for row in result:
        worklet_id, cert_id, title, performance = row
        title_short = title[:37] + "..." if len(title) > 40 else title
        perf_display = performance if performance else "NULL"
        print(f"{worklet_id:<12} {cert_id:<10} {title_short:<40} {perf_display:<20}")
    
    print("\n")
