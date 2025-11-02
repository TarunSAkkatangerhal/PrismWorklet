import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def _send_email(to_email: str, subject: str, body_html: str, body_plain: str = None):
    """Helper function to send styled HTML email"""
    try:
        # Validate SMTP configuration
        if not settings.SMTP_USER or not settings.SMTP_PASS:
            logger.error("❌ SMTP credentials not configured. Cannot send email.")
            raise Exception("SMTP credentials not configured")
        
        logger.info(f"📧 Attempting to send email to {to_email}")
        logger.info(f"   Subject: {subject}")
        logger.info(f"   SMTP: {settings.SMTP_HOST}:{settings.SMTP_PORT}")
        logger.info(f"   User: {settings.SMTP_USER}")
        
        msg = MIMEMultipart("alternative")
        msg["From"] = settings.SMTP_USER
        msg["To"] = to_email
        msg["Subject"] = subject

        # Attach plain text (fallback) and HTML
        if body_plain:
            msg.attach(MIMEText(body_plain, "plain"))
        msg.attach(MIMEText(body_html, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.set_debuglevel(0)  # Set to 1 for detailed SMTP logs
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        
        logger.info(f"✅ Email sent successfully to {to_email}")
        
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"❌ SMTP Authentication failed: {str(e)}")
        logger.error("   Check your SMTP_USER and SMTP_PASS in .env file")
        raise
    except smtplib.SMTPException as e:
        logger.error(f"❌ SMTP error occurred: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to_email}: {str(e)}")
        raise


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
                                        <a href='{settings.FRONTEND_URL}' style='display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; padding:12px 26px; border-radius:10px; box-shadow:0 2px 6px rgba(37,99,235,0.35);'>Open Dashboard</a>
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
                try:
                        _send_email(email, f"Samsung PRISM - {subject}", body_html, body_plain)
                except Exception as e:
                        print(f"Failed to send email to {email}: {str(e)}")
        print(f"Activity emails sent to {len(emails)} recipients")
        return True


def send_meeting_notification(
    recipient_email: str,
    recipient_name: str,
    meeting_title: str,
    meeting_datetime: str,
    meeting_link: str,
    organizer_name: str,
    notification_type: str = "created",
    reason: str = None
):
    """
    Send meeting notification email.
    
    Args:
        recipient_email: Recipient's email address
        recipient_name: Recipient's name
        meeting_title: Title of the meeting
        meeting_datetime: Meeting date and time (datetime object or string)
        meeting_link: Microsoft Teams meeting link
        organizer_name: Name of the meeting organizer
        notification_type: Type of notification ('created', 'rescheduled', 'cancelled', 'reminder')
        reason: Optional reason for rescheduling/cancellation
    """
    from datetime import datetime
    
    # Format datetime
    if isinstance(meeting_datetime, datetime):
        formatted_datetime = meeting_datetime.strftime("%B %d, %Y at %I:%M %p")
    else:
        formatted_datetime = str(meeting_datetime)
    
    # Subject based on notification type
    subjects = {
        "created": "New Meeting Scheduled",
        "rescheduled": "Meeting Rescheduled",
        "cancelled": "Meeting Cancelled",
        "reminder": "Meeting Reminder"
    }
    subject = subjects.get(notification_type, "Meeting Notification")
    
    # Action-specific content
    if notification_type == "created":
        action_message = f"<p style='font-size:15px; line-height:1.55; margin:0 0 18px;'><strong>{organizer_name}</strong> has scheduled a new meeting: <strong>{meeting_title}</strong></p>"
        action_color = "#2563eb"
        action_icon = "📅"
    elif notification_type == "rescheduled":
        action_message = f"<p style='font-size:15px; line-height:1.55; margin:0 0 18px;'><strong>{organizer_name}</strong> has rescheduled the meeting: <strong>{meeting_title}</strong></p>"
        if reason:
            action_message += f"<p style='font-size:14px; color:#6b7280; margin:0 0 18px;'><em>Reason: {reason}</em></p>"
        action_color = "#f59e0b"
        action_icon = "🔄"
    elif notification_type == "cancelled":
        action_message = f"<p style='font-size:15px; line-height:1.55; margin:0 0 18px;'><strong>{organizer_name}</strong> has cancelled the meeting: <strong>{meeting_title}</strong></p>"
        if reason:
            action_message += f"<p style='font-size:14px; color:#6b7280; margin:0 0 18px;'><em>Reason: {reason}</em></p>"
        action_color = "#dc2626"
        action_icon = "❌"
    else:  # reminder
        action_message = f"<p style='font-size:15px; line-height:1.55; margin:0 0 18px;'>Reminder: Your meeting <strong>{meeting_title}</strong> is coming up soon!</p>"
        action_color = "#10b981"
        action_icon = "⏰"
    
    body_plain = (
        f"Hello {recipient_name},\n\n"
        f"{action_icon} {subject}\n\n"
        f"Meeting: {meeting_title}\n"
        f"Date & Time: {formatted_datetime}\n"
        f"Organizer: {organizer_name}\n"
    )
    
    if notification_type != "cancelled":
        body_plain += f"\nJoin Meeting: {meeting_link}\n"
    
    if reason:
        body_plain += f"\nNote: {reason}\n"
    
    body_plain += "\n— Samsung PRISM Team"
    
    meeting_link_button = ""
    if notification_type != "cancelled":
        meeting_link_button = f"""
        <div style='text-align:center; margin:30px 0 8px;'>
            <a href='{meeting_link}' style='display:inline-block; background:{action_color}; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; padding:12px 26px; border-radius:10px; box-shadow:0 2px 6px rgba(37,99,235,0.35);'>Join Meeting</a>
        </div>
        """
    
    body_html = f"""
    <html>
        <body style='margin:0; padding:24px; background:#f5f7fb; font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#1a1f29;'>
            <table role='presentation' cellpadding='0' cellspacing='0' width='100%' style='max-width:640px; margin:0 auto; background:#ffffff; border-radius:16px; box-shadow:0 4px 14px rgba(0,0,0,0.06); overflow:hidden;'>
                <tr>
                    <td style='background:linear-gradient(135deg,{action_color},#1976d2); padding:28px 24px; text-align:center;'>
                        <h1 style='margin:0; font-size:22px; color:#ffffff; letter-spacing:.5px; font-weight:600;'>{action_icon} {subject}</h1>
                    </td>
                </tr>
                <tr>
                    <td style='padding:32px 28px 18px;'>
                        <p style='font-size:15px; line-height:1.55; margin:0 0 16px;'>Hello <strong>{recipient_name}</strong>,</p>
                        {action_message}
                        <div style='background:#f9fafb; border-left:4px solid {action_color}; padding:18px; margin:22px 0; border-radius:8px;'>
                            <table style='width:100%; border-collapse:collapse;'>
                                <tr>
                                    <td style='padding:8px 0; font-size:14px; color:#6b7280; width:120px;'>Meeting:</td>
                                    <td style='padding:8px 0; font-size:14px; color:#1a1f29; font-weight:600;'>{meeting_title}</td>
                                </tr>
                                <tr>
                                    <td style='padding:8px 0; font-size:14px; color:#6b7280;'>Date & Time:</td>
                                    <td style='padding:8px 0; font-size:14px; color:#1a1f29; font-weight:600;'>{formatted_datetime}</td>
                                </tr>
                                <tr>
                                    <td style='padding:8px 0; font-size:14px; color:#6b7280;'>Organizer:</td>
                                    <td style='padding:8px 0; font-size:14px; color:#1a1f29;'>{organizer_name}</td>
                                </tr>
                            </table>
                        </div>
                        {meeting_link_button}
                        <p style='margin:26px 0 0; font-size:14px; line-height:1.55;'>Regards,<br><strong>Samsung PRISM Team</strong></p>
                    </td>
                </tr>
                <tr>
                    <td style='padding:16px 28px 26px;'>
                        <p style='margin:0; font-size:11px; line-height:1.5; color:#6b7280; text-align:center;'>This is an automated meeting notification. Please check your Samsung PRISM dashboard for more details.</p>
                    </td>
                </tr>
            </table>
        </body>
    </html>
    """
    
    try:
        _send_email(recipient_email, f"Samsung PRISM - {subject}", body_html, body_plain)
        print(f"Meeting notification sent to {recipient_email}")
        return True
    except Exception as e:
        print(f"Failed to send meeting notification to {recipient_email}: {str(e)}")
        raise e


def send_milestone_notification(
    mentor_email: str,
    mentor_name: str,
    student_name: str,
    student_email: str,
    milestone_type: str,
    worklet_title: str,
    field1_label: str = None,
    field1_value: str = None,
    field2_label: str = None,
    field2_value: str = None,
    toggle_label: str = None,
    toggle_value: bool = None,
    attachment_name: str = None
):
    """
    Send milestone upload notification email to mentor.
    
    Args:
        mentor_email: Mentor's email address
        mentor_name: Mentor's name
        student_name: Student's name who uploaded the milestone
        student_email: Student's email
        milestone_type: Type of milestone (e.g., "First Review", "Mid Review")
        worklet_title: Title of the worklet
        field1_label: Label for first custom field
        field1_value: Value for first custom field
        field2_label: Label for second custom field
        field2_value: Value for second custom field
        toggle_label: Label for toggle field
        toggle_value: Value for toggle field
        attachment_name: Name of attached file (if any)
    """
    subject = f"New Milestone Uploaded: {milestone_type}"
    
    # Build content details HTML
    content_details = ""
    
    if field1_label and field1_value:
        content_details += f"""
        <tr>
            <td style='padding:8px 0; font-size:14px; color:#6b7280; width:140px;'>{field1_label}:</td>
            <td style='padding:8px 0; font-size:14px; color:#1a1f29;'>{field1_value}</td>
        </tr>
        """
    
    if field2_label and field2_value:
        content_details += f"""
        <tr>
            <td style='padding:8px 0; font-size:14px; color:#6b7280; width:140px;'>{field2_label}:</td>
            <td style='padding:8px 0; font-size:14px; color:#1a1f29;'>{field2_value}</td>
        </tr>
        """
    
    if toggle_label is not None:
        toggle_display = "✅ Yes" if toggle_value else "❌ No"
        content_details += f"""
        <tr>
            <td style='padding:8px 0; font-size:14px; color:#6b7280; width:140px;'>{toggle_label}:</td>
            <td style='padding:8px 0; font-size:14px; color:#1a1f29;'>{toggle_display}</td>
        </tr>
        """
    
    if attachment_name:
        content_details += f"""
        <tr>
            <td style='padding:8px 0; font-size:14px; color:#6b7280; width:140px;'>Attachment:</td>
            <td style='padding:8px 0; font-size:14px; color:#1a1f29;'>📎 {attachment_name}</td>
        </tr>
        """
    
    body_plain = (
        f"Hello {mentor_name},\n\n"
        f"A new milestone has been uploaded by your student.\n\n"
        f"Student: {student_name} ({student_email})\n"
        f"Milestone Type: {milestone_type}\n"
        f"Worklet: {worklet_title}\n\n"
    )
    
    if field1_label and field1_value:
        body_plain += f"{field1_label}: {field1_value}\n"
    if field2_label and field2_value:
        body_plain += f"{field2_label}: {field2_value}\n"
    if toggle_label is not None:
        toggle_text = "Yes" if toggle_value else "No"
        body_plain += f"{toggle_label}: {toggle_text}\n"
    if attachment_name:
        body_plain += f"Attachment: {attachment_name}\n"
    
    body_plain += "\nPlease log into Samsung PRISM to review and provide feedback.\n\n— Samsung PRISM Team"
    
    body_html = f"""
    <html>
        <body style='margin:0; padding:24px; background:#f5f7fb; font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#1a1f29;'>
            <table role='presentation' cellpadding='0' cellspacing='0' width='100%' style='max-width:640px; margin:0 auto; background:#ffffff; border-radius:16px; box-shadow:0 4px 14px rgba(0,0,0,0.06); overflow:hidden;'>
                <tr>
                    <td style='background:linear-gradient(135deg,#7c3aed,#2563eb); padding:28px 24px; text-align:center;'>
                        <h1 style='margin:0; font-size:22px; color:#ffffff; letter-spacing:.5px; font-weight:600;'>📝 New Milestone Uploaded</h1>
                    </td>
                </tr>
                <tr>
                    <td style='padding:32px 28px 18px;'>
                        <p style='font-size:15px; line-height:1.55; margin:0 0 16px;'>Hello <strong>{mentor_name}</strong>,</p>
                        <p style='font-size:15px; line-height:1.55; margin:0 0 18px;'>Your student <strong>{student_name}</strong> has uploaded a new milestone for review.</p>
                        
                        <div style='background:#f0f9ff; border-left:4px solid #2563eb; padding:18px; margin:22px 0; border-radius:8px;'>
                            <table style='width:100%; border-collapse:collapse;'>
                                <tr>
                                    <td style='padding:8px 0; font-size:14px; color:#6b7280; width:140px;'>Student:</td>
                                    <td style='padding:8px 0; font-size:14px; color:#1a1f29; font-weight:600;'>{student_name}</td>
                                </tr>
                                <tr>
                                    <td style='padding:8px 0; font-size:14px; color:#6b7280;'>Email:</td>
                                    <td style='padding:8px 0; font-size:14px; color:#1a1f29;'>{student_email}</td>
                                </tr>
                                <tr>
                                    <td style='padding:8px 0; font-size:14px; color:#6b7280;'>Worklet:</td>
                                    <td style='padding:8px 0; font-size:14px; color:#1a1f29; font-weight:600;'>{worklet_title}</td>
                                </tr>
                                <tr>
                                    <td style='padding:8px 0; font-size:14px; color:#6b7280;'>Milestone Type:</td>
                                    <td style='padding:8px 0; font-size:14px; color:#1a1f29;'>
                                        <span style='background:#7c3aed; color:#ffffff; padding:4px 10px; border-radius:6px; font-weight:600; font-size:13px;'>{milestone_type}</span>
                                    </td>
                                </tr>
                            </table>
                        </div>
                        
                        {f'''
                        <div style='background:#f9fafb; border:1px solid #e5e7eb; padding:18px; margin:22px 0; border-radius:8px;'>
                            <h3 style='margin:0 0 12px; font-size:15px; color:#374151; font-weight:600;'>📋 Milestone Content:</h3>
                            <table style='width:100%; border-collapse:collapse;'>
                                {content_details}
                            </table>
                        </div>
                        ''' if content_details else ''}
                        
                        <div style='text-align:center; margin:30px 0 8px;'>
                            <a href='{settings.FRONTEND_URL}' style='display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; padding:12px 26px; border-radius:10px; box-shadow:0 2px 6px rgba(37,99,235,0.35);'>Review Milestone</a>
                        </div>
                        
                        <p style='margin:26px 0 0; font-size:14px; line-height:1.55;'>Regards,<br><strong>Samsung PRISM Team</strong></p>
                    </td>
                </tr>
                <tr>
                    <td style='padding:16px 28px 26px;'>
                        <p style='margin:0; font-size:11px; line-height:1.5; color:#6b7280; text-align:center;'>This is an automated notification. Please log into Samsung PRISM to provide feedback.</p>
                    </td>
                </tr>
            </table>
        </body>
    </html>
    """
    
    try:
        _send_email(mentor_email, f"Samsung PRISM - {subject}", body_html, body_plain)
        logger.info(f"Milestone notification sent to {mentor_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send milestone notification to {mentor_email}: {str(e)}")
        # Don't raise - we don't want email failure to block milestone creation
        return False
