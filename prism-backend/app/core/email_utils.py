import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def _send_email(to_email: str, subject: str, body_html: str, body_plain: str = None):
    """Helper function to send styled HTML email"""
    msg = MIMEMultipart("alternative")
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email
    msg["Subject"] = subject

    # Attach plain text (fallback) and HTML
    if body_plain:
        msg.attach(MIMEText(body_plain, "plain"))
    msg.attach(MIMEText(body_html, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASS)
        server.sendmail(settings.SMTP_USER, to_email, msg.as_string())


def send_otp_email(email: str, name: str, otp_code: str):
    """Send OTP email (professional HTML)"""
    subject = "Your Samsung PRISM OTP Code"

    body_plain = f"Hello {name},\n\nYour OTP code is: {otp_code}\nThis code will expire in 10 minutes.\n\nSamsung PRISM Team"

    body_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #004aad; text-align: center;">Samsung PRISM OTP Verification</h2>
            <p>Hello <b>{name}</b>,</p>
            <p>Your one-time password (OTP) is:</p>
            <p style="font-size: 22px; font-weight: bold; color: #004aad; text-align: center; padding: 10px; background: #f0f4ff; border-radius: 6px;">
                {otp_code}
            </p>
            <p>This code will expire in <b>10 minutes</b>.</p>
            <p style="margin-top: 20px;">Best regards,<br><b>Samsung PRISM Team</b></p>
        </div>
    </body>
    </html>
    """
    _send_email(email, subject, body_html, body_plain)


def send_password_reset_email(email: str, name: str, otp_code: str):
    """Send password reset email (professional HTML)"""
    subject = "Samsung PRISM Password Reset"

    body_plain = f"Hello {name},\n\nYou requested a password reset. Your reset OTP is: {otp_code}\nThis code will expire in 10 minutes.\n\nIf not requested, ignore this email."

    body_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #e63946; text-align: center;">Password Reset Request</h2>
            <p>Hello <b>{name}</b>,</p>
            <p>You requested to reset your Samsung PRISM account password.</p>
            <p>Your password reset OTP is:</p>
            <p style="font-size: 22px; font-weight: bold; color: #e63946; text-align: center; padding: 10px; background: #fff0f0; border-radius: 6px;">
                {otp_code}
            </p>
            <p>This code will expire in <b>10 minutes</b>.</p>
            <p>If you didn’t request this, you can safely ignore this email.</p>
            <p style="margin-top: 20px;">Best regards,<br><b>Samsung PRISM Team</b></p>
        </div>
    </body>
    </html>
    """
    _send_email(email, subject, body_html, body_plain)


def send_activity_email(emails: list, subject: str, message: str, activity_type: str):
    """Send activity-related email to multiple students (professional HTML)"""
    for email in emails:
        body_plain = f"Dear Student,\n\n{message}\n\nActivity Type: {activity_type}\n\nPlease log in to Samsung PRISM for more details.\n\nSamsung PRISM Team"

        body_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #1d3557; text-align: center;">Samsung PRISM - {subject}</h2>
                <p>Dear Student,</p>
                <p>{message}</p>
                <p><b>Activity Type:</b> {activity_type}</p>
                <p style="margin-top: 20px;">Please log into <b>Samsung PRISM</b> for more details.</p>
                <p style="margin-top: 20px;">Best regards,<br><b>Samsung PRISM Team</b></p>
            </div>
        </body>
        </html>
        """
        _send_email(email, f"Samsung PRISM - {subject}", body_html, body_plain)
    print(f"Activity emails sent to {len(emails)} recipients")
    return True
