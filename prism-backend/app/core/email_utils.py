import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_otp_email(email: str, name: str, otp_code: str):
    """Send OTP email to user"""
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_USER
        msg['To'] = email
        msg['Subject'] = "Your Samsung PRISM OTP Code"
        
        # Email body
        body = f"""
        Hello {name},
        
        Your OTP code for Samsung PRISM is: {otp_code}
        
        This code will expire in 10 minutes.
        
        Best regards,
        Samsung PRISM Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(settings.SMTP_USER, email, text)
        server.quit()
        
        print(f"OTP email sent to {email}")
        
    except Exception as e:
        print(f"Failed to send OTP email: {e}")

def send_password_reset_email(email: str, name: str, otp_code: str):
    """Send password reset email to user"""
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_USER
        msg['To'] = email
        msg['Subject'] = "Samsung PRISM Password Reset"
        
        # Email body
        body = f"""
        Hello {name},
        
        You requested a password reset for your Samsung PRISM account.
        
        Your password reset OTP code is: {otp_code}
        
        This code will expire in 10 minutes.
        
        If you didn't request this, please ignore this email.
        
        Best regards,
        Samsung PRISM Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(settings.SMTP_USER, email, text)
        server.quit()
        
        print(f"Password reset email sent to {email}")
        
    except Exception as e:
        print(f"Failed to send password reset email: {e}")

def send_activity_email(emails: list, subject: str, message: str, activity_type: str):
    """Send activity-related emails to students"""
    try:
        for email in emails:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = settings.SMTP_USER
            msg['To'] = email
            msg['Subject'] = f"Samsung PRISM - {subject}"
            
            # Email body
            body = f"""
            Dear Student,
            
            {message}
            
            Activity Type: {activity_type}
            
            Please log into Samsung PRISM for more details.
            
            Best regards,
            Samsung PRISM Team
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Send email
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            text = msg.as_string()
            server.sendmail(settings.SMTP_USER, email, text)
            server.quit()
            
        print(f"Activity emails sent to {len(emails)} recipients")
        return True
        
    except Exception as e:
        print(f"Failed to send activity emails: {e}")
        return False