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
        """Send OTP email (enhanced professional template)"""
        subject = "Samsung PRISM • One-Time Verification Code"

        body_plain = (
                f"Hello {name},\n\n"
                f"Your one-time verification code (OTP) is: {otp_code}\n"
                "It is valid for 10 minutes. Do NOT share this code with anyone.\n\n"
                "If you did not initiate this action, please ignore this email.\n\n"
                "— Samsung PRISM Security"
        )

        body_html = f"""
        <html>
            <body style='margin:0; padding:24px; background:#f5f7fb; font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#1a1f29;'>
                <table role='presentation' cellpadding='0' cellspacing='0' width='100%' style='max-width:640px; margin:0 auto; background:#ffffff; border-radius:16px; box-shadow:0 4px 14px rgba(0,0,0,0.06); overflow:hidden;'>
                    <tr>
                        <td style='background:linear-gradient(135deg,#003c8f,#1976d2); padding:28px 24px; text-align:center;'>
                            <h1 style='margin:0; font-size:22px; color:#ffffff; letter-spacing:.5px; font-weight:600;'>Samsung PRISM Verification</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style='padding:32px 28px 18px;'>
                            <p style='font-size:15px; line-height:1.55; margin:0 0 16px;'>Hello <strong>{name}</strong>,</p>
                            <p style='font-size:15px; line-height:1.55; margin:0 0 18px;'>Use the one-time verification code below to continue. This code is valid for <strong>10 minutes</strong>.</p>
                            <div style='text-align:center; margin:28px 0;'>
                                <div style='display:inline-block; background:#0d47a1; color:#ffffff; font-size:30px; letter-spacing:4px; font-weight:700; padding:18px 32px; border-radius:14px; font-family:Monaco,Consolas,monospace;'>
                                    {otp_code}
                                </div>
                            </div>
                            <p style='font-size:14px; line-height:1.55; margin:0 0 10px; color:#374151;'>For your security, never share this code with anyone – not even PRISM staff.</p>
                            <p style='font-size:13px; background:#f1f5f9; padding:12px 16px; border-left:4px solid #2563eb; border-radius:6px; margin:20px 0 8px;'>If you did not request this code, you can safely ignore this email.</p>
                            <p style='font-size:14px; line-height:1.55; margin:24px 0 0;'>Regards,<br><strong>Samsung PRISM Security Team</strong></p>
                        </td>
                    </tr>
                    <tr>
                        <td style='padding:18px 24px 28px;'>
                            <p style='margin:0; font-size:11px; line-height:1.5; color:#6b7280; text-align:center;'>This is an automated message. Do not reply to this email.</p>
                        </td>
                    </tr>
                </table>
            </body>
        </html>
        """
        _send_email(email, subject, body_html, body_plain)


def send_password_reset_email(email: str, name: str, otp_code: str):
        """Send password reset email (enhanced professional template)"""
        subject = "Samsung PRISM • Password Reset Code"

        body_plain = (
                f"Hello {name},\n\n"
                "A password reset was requested for your Samsung PRISM account.\n"
                f"Reset code: {otp_code} (valid 10 minutes).\n\n"
                "If you did not request this, please ignore this email.\n\n"
                "— Samsung PRISM Support"
        )

        body_html = f"""
        <html>
            <body style='margin:0; padding:24px; background:#f5f7fa; font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#1f2937;'>
                <table role='presentation' cellpadding='0' cellspacing='0' width='100%' style='max-width:640px; margin:0 auto; background:#ffffff; border-radius:16px; box-shadow:0 4px 14px rgba(0,0,0,0.06); overflow:hidden;'>
                    <tr>
                        <td style='background:linear-gradient(135deg,#9d174d,#dc2626); padding:26px 24px; text-align:center;'>
                            <h1 style='margin:0; font-size:22px; color:#ffffff; font-weight:600;'>Password Reset Request</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style='padding:32px 30px 18px;'>
                            <p style='font-size:15px; line-height:1.55; margin:0 0 16px;'>Hello <strong>{name}</strong>,</p>
                            <p style='font-size:15px; line-height:1.55; margin:0 0 18px;'>A password reset was requested for your Samsung PRISM account. Use the secure reset code below within 10 minutes.</p>
                            <div style='text-align:center; margin:28px 0;'>
                                <div style='display:inline-block; background:#dc2626; color:#ffffff; font-size:30px; letter-spacing:4px; font-weight:700; padding:18px 32px; border-radius:14px; font-family:Monaco,Consolas,monospace;'>
                                    {otp_code}
                                </div>
                            </div>
                            <p style='font-size:13px; background:#fef2f2; padding:12px 16px; border-left:4px solid #dc2626; border-radius:6px; margin:8px 0 14px;'>If you did not request this change, no action is required. Your password remains unchanged.</p>
                            <p style='font-size:14px; line-height:1.55; margin:24px 0 0;'>Regards,<br><strong>Samsung PRISM Support Team</strong></p>
                        </td>
                    </tr>
                    <tr><td style='padding:18px 24px 28px;'><p style='margin:0; font-size:11px; line-height:1.5; color:#6b7280; text-align:center;'>This automated notification was sent to you because a reset process was initiated.</p></td></tr>
                </table>
            </body>
        </html>
        """
        _send_email(email, subject, body_html, body_plain)


def send_activity_email(emails: list, subject: str, message: str, activity_type: str):
        """Send activity-related email to multiple students (enhanced professional HTML)."""

        # Convert raw message newlines into HTML paragraphs for nicer rendering
        def _format_message_html(text: str) -> str:
                blocks = [b.strip() for b in text.split('\n') if b.strip()]
                return "".join(f"<p style='margin:0 0 14px; line-height:1.55; font-size:14px;'>{block}</p>" for block in blocks) or "<p style='margin:0;'>No details provided.</p>"

        formatted_html = _format_message_html(message)

        for email in emails:
                body_plain = (
                        "Dear Student,\n\n"
                        f"{message}\n\n"
                        f"Activity Type: {activity_type}\n"
                        "Please log in to Samsung PRISM for more details.\n\n"
                        "— Samsung PRISM Team"
                )

                body_html = f"""
                <html>
                    <body style='margin:0; padding:22px; background:#f4f7fa; font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#111827;'>
                        <table role='presentation' cellpadding='0' cellspacing='0' width='100%' style='max-width:660px; margin:0 auto; background:#ffffff; border-radius:18px; box-shadow:0 4px 18px rgba(0,0,0,0.07); overflow:hidden;'>
                            <tr>
                                <td style='background:linear-gradient(135deg,#0f3d91,#2563eb); padding:26px 26px 24px; text-align:center;'>
                                    <h1 style='margin:0; font-size:21px; color:#ffffff; font-weight:600; letter-spacing:.5px;'>Samsung PRISM • {activity_type}</h1>
                                    <div style='margin-top:6px; font-size:13px; color:#e0ecff; letter-spacing:.5px;'>{subject}</div>
                                </td>
                            </tr>
                            <tr>
                                <td style='padding:34px 34px 10px;'>
                                    <p style='margin:0 0 16px; font-size:14px; line-height:1.55;'>Dear Student,</p>
                                    {formatted_html}
                                    <div style='margin:24px 0 6px;'>
                                        <table role='presentation' cellpadding='0' cellspacing='0' style='border-collapse:collapse;'>
                                            <tr>
                                                <td style='background:#eef5ff; color:#1e40af; font-size:12px; letter-spacing:.5px; font-weight:600; padding:6px 12px; border-radius:6px; font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;'>ACTIVITY: {activity_type.upper()}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <p style='margin:22px 0 0; font-size:13px; line-height:1.55; color:#374151;'>Please log into <strong>Samsung PRISM</strong> to view full details and take any required action.</p>
                                    <div style='text-align:center; margin:30px 0 8px;'>
                                        <a href='https://https://www.samsungprism.com' style='display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; padding:12px 26px; border-radius:10px; box-shadow:0 2px 6px rgba(37,99,235,0.35);'>Open Dashboard</a>
                                    </div>
                                    <p style='margin:26px 0 0; font-size:14px; line-height:1.55;'>Regards,<br><strong>Samsung PRISM Team</strong></p>
                                </td>
                            </tr>
                            <tr>
                                <td style='padding:16px 28px 26px;'>
                                    <p style='margin:0; font-size:11px; line-height:1.5; color:#6b7280; text-align:center;'>This is an automated notification related to your active worklet participation. Do not reply to this email.</p>
                                </td>
                            </tr>
                        </table>
                    </body>
                </html>
                """
                _send_email(email, f"Samsung PRISM - {subject}", body_html, body_plain)
        print(f"Activity emails sent to {len(emails)} recipients")
        return True
