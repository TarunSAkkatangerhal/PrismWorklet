#!/usr/bin/env python3
"""
Quick setup script for User Worklet Association implementation
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a command and print the result"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, cwd=".")
        if result.returncode == 0:
            print(f"✅ {description} completed successfully")
            if result.stdout:
                print(f"📋 Output: {result.stdout.strip()}")
        else:
            print(f"❌ {description} failed")
            if result.stderr:
                print(f"🚨 Error: {result.stderr.strip()}")
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error running command: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 Setting up User Worklet Association System")
    print("=" * 60)
    
    # Change to backend directory
    backend_dir = os.path.join(os.path.dirname(__file__), '..')
    os.chdir(backend_dir)
    
    print(f"📂 Working directory: {os.getcwd()}")
    
    # 1. Install any missing dependencies
    print(f"\n1️⃣ Installing dependencies...")
    if not run_command("pip install sqlalchemy fastapi uvicorn", "Installing Python dependencies"):
        print("⚠️  Failed to install dependencies, but continuing...")
    
    # 2. Run the migration script
    print(f"\n2️⃣ Running database migration...")
    if not run_command("python scripts/migrate_associations.py", "Running association migration"):
        print("❌ Migration failed. Please check the error and try again.")
        return False
    
    # 3. Start the server (optional)
    print(f"\n3️⃣ Server setup...")
    print("To start the server, run:")
    print("   cd prism-backend")
    print("   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    
    print("\n" + "=" * 60)
    print("✅ Setup completed!")
    print("\n📝 Next steps:")
    print("1. Start the FastAPI server")
    print("2. Test the new association endpoints at http://localhost:8000/docs")
    print("3. The frontend Dashboard will now use the association-based API")
    print("4. Check ongoing worklets to see real database data")
    
    print("\n🔗 Available endpoints:")
    print("   GET /api/associations/mentor/{mentor_id}/ongoing-worklets")
    print("   GET /api/associations/worklet/{worklet_id}")
    print("   POST /api/associations/")
    print("   PUT /api/associations/{association_id}")
    print("   DELETE /api/associations/{association_id}")

if __name__ == "__main__":
    main()