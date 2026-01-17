"""
Test script for chat email functionality
Sends a sample starred messages email to a test recipient
"""
import sys
from app.core.email_utils import _send_email
from datetime import datetime

def test_chat_email():
    """Send a test email with sample starred messages"""
    
    # ========== CONFIGURE TEST RECIPIENT ==========
    # Change this to your email address for testing
    test_recipient = "varunramesh.23cse@cambridge.edu.in"  # <-- CHANGE THIS TO YOUR EMAIL
    # ==============================================
    
    # Sample data
    worklet_title = "AI/ML Project - Image Recognition"
    sender_role = "Mentor"
    
    # Sample starred messages
    sample_messages = [
        {
            "sender_name": "John Doe",
            "time": "Jan 13, 02:30 PM",
            "text": "Please review the latest model architecture. We've improved accuracy by 15%!"
        },
        {
            "sender_name": "Jane Smith",
            "time": "Jan 13, 02:32 PM",
            "text": "Great work on the preprocessing pipeline. The data quality looks much better now."
        },
        {
            "sender_name": "Alex Kumar",
            "time": "Jan 13, 02:35 PM",
            "text": "Quick reminder: Team meeting tomorrow at 3 PM to discuss deployment strategy."
        }
    ]
    
    # Build email HTML
    messages_html = ""
    for msg in sample_messages:
        messages_html += f"""
        <div style="margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-left: 3px solid #4F46E5;">
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
                <strong>{msg['sender_name']}</strong> · {msg['time']}
            </div>
            <div style="color: #333;">{msg['text']}</div>
        </div>
        """
    
    email_html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: white; padding: 20px; border: 1px solid #ddd; }}
            .footer {{ background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2 style="margin: 0;">📩 Starred Messages from {worklet_title}</h2>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>You have starred messages from a <strong>{sender_role}</strong> in the worklet <strong>{worklet_title}</strong>:</p>
                <div style="margin: 20px 0;">
                    {messages_html}
                </div>
                <p style="margin-top: 20px; font-size: 14px; color: #666;">
                    {len(sample_messages)} message(s) included · Last 5 minutes
                </p>
            </div>
            <div class="footer">
                <p style="margin: 5px 0;">PRISM Worklet Platform</p>
                <p style="margin: 5px 0;">This is an automated notification. Please do not reply to this email.</p>
                <p style="margin: 5px 0; color: #999; font-size: 11px;">🧪 This is a test email</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    email_subject = f"[TEST] Starred Messages from {sender_role} - {worklet_title}"
    email_plain = f"You have starred messages from {sender_role} in {worklet_title}. Please check the worklet chat for details."
    
    print("=" * 60)
    print("📧 CHAT EMAIL TEST SCRIPT")
    print("=" * 60)
    print(f"Recipient: {test_recipient}")
    print(f"Subject: {email_subject}")
    print(f"Messages: {len(sample_messages)}")
    print("-" * 60)
    
    try:
        print("\n🔄 Sending email...")
        _send_email(
            to_email=test_recipient,
            subject=email_subject,
            body_html=email_html,
            body_plain=email_plain
        )
        print("\n✅ SUCCESS! Email sent successfully!")
        print(f"📬 Check your inbox at: {test_recipient}")
        print("\nIf you don't see it:")
        print("1. Check your spam/junk folder")
        print("2. Wait a few seconds and refresh")
        print("3. Verify SMTP credentials in .env file")
        
    except Exception as e:
        print("\n❌ ERROR! Failed to send email")
        print(f"Error: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Check ENABLE_EMAIL=True in config.py")
        print("2. Verify SMTP credentials in .env")
        print("3. Check if Gmail 'App Password' is correct")
        print("4. Make sure you're not hitting rate limits")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    test_chat_email()
