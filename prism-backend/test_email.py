"""
Test email configuration and send a test email
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Get SMTP configuration from .env
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")

print("=" * 60)
print("📧 SMTP EMAIL CONFIGURATION TEST")
print("=" * 60)
print(f"SMTP Host: {SMTP_HOST}")
print(f"SMTP Port: {SMTP_PORT}")
print(f"SMTP User: {SMTP_USER}")
print(f"SMTP Pass: {'*' * len(SMTP_PASS) if SMTP_PASS else '(empty)'}")
print("=" * 60)

# Validate configuration
if not SMTP_USER or not SMTP_PASS:
    print("\n❌ ERROR: SMTP_USER or SMTP_PASS not configured in .env file")
    print("Please check your .env file and ensure SMTP credentials are set.")
    exit(1)

# Test SMTP connection
print("\n🔌 Testing SMTP connection...")
try:
    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
    print("✅ Connected to SMTP server")
    
    server.set_debuglevel(0)  # Set to 1 for detailed logs
    server.starttls()
    print("✅ TLS started")
    
    server.login(SMTP_USER, SMTP_PASS)
    print("✅ Authentication successful")
    
    # Send test email
    test_recipient = input("\n📨 Enter email address to send test email (press Enter to skip): ").strip()
    
    if test_recipient:
        msg = MIMEMultipart("alternative")
        msg["From"] = SMTP_USER
        msg["To"] = test_recipient
        msg["Subject"] = "Samsung PRISM - Email Test"
        
        body_html = """
        <html>
            <body style='font-family: Arial, sans-serif; padding: 20px;'>
                <div style='background: linear-gradient(135deg, #2563eb, #1976d2); padding: 20px; border-radius: 10px; color: white; text-align: center;'>
                    <h1>✅ Email Configuration Test Successful</h1>
                </div>
                <div style='padding: 20px;'>
                    <p>Hello,</p>
                    <p>This is a test email from Samsung PRISM backend.</p>
                    <p>If you received this email, your SMTP configuration is working correctly!</p>
                    <p style='margin-top: 30px;'>
                        <strong>Configuration Details:</strong><br>
                        SMTP Host: """ + SMTP_HOST + """<br>
                        SMTP Port: """ + str(SMTP_PORT) + """<br>
                        From: """ + SMTP_USER + """
                    </p>
                    <hr style='margin: 20px 0;'>
                    <p style='font-size: 12px; color: #666;'>Samsung PRISM Team</p>
                </div>
            </body>
        </html>
        """
        
        msg.attach(MIMEText(body_html, "html"))
        
        print(f"\n📤 Sending test email to {test_recipient}...")
        server.sendmail(SMTP_USER, test_recipient, msg.as_string())
        print(f"✅ Test email sent successfully to {test_recipient}")
        print(f"📬 Please check the inbox (and spam folder) of {test_recipient}")
    
    server.quit()
    print("\n✅ SMTP connection closed")
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED - Email configuration is working!")
    print("=" * 60)
    
except smtplib.SMTPAuthenticationError as e:
    print(f"\n❌ AUTHENTICATION FAILED: {str(e)}")
    print("\nPossible causes:")
    print("1. Wrong email or password")
    print("2. Gmail: You need an 'App Password' (not your regular password)")
    print("   - Go to: https://myaccount.google.com/apppasswords")
    print("   - Generate a new app password")
    print("   - Update SMTP_PASS in .env with the app password")
    print("3. 2-Step Verification must be enabled for app passwords")
    
except smtplib.SMTPException as e:
    print(f"\n❌ SMTP ERROR: {str(e)}")
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    
print()
