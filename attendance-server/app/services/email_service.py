import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_PASSWORD,
    SMTP_FROM_EMAIL,
    SMTP_FROM_NAME,
)


def send_password_reset_email(to_email: str, full_name: str, reset_link: str):

    message = MIMEMultipart("alternative")
    message["Subject"] = "Password Reset Request"
    message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    message["To"] = to_email

    text_body = (
        f"Hi {full_name},\n\n"
        "We received a request to reset your password for the "
        "Civil Engineering Attendance System.\n\n"
        f"Click the link below to choose a new password:\n{reset_link}\n\n"
        "This link expires in 30 minutes. If you did not request a "
        "password reset, you can safely ignore this email.\n"
    )

    html_body = f"""
    <p>Hi {full_name},</p>
    <p>We received a request to reset your password for the
    Civil Engineering Attendance System.</p>
    <p><a href="{reset_link}">Click here to choose a new password</a></p>
    <p>This link expires in 30 minutes. If you did not request a
    password reset, you can safely ignore this email.</p>
    """

    message.attach(MIMEText(text_body, "plain"))
    message.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        if SMTP_USERNAME and SMTP_PASSWORD:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM_EMAIL, to_email, message.as_string())
