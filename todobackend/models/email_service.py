import smtplib
from email.message import EmailMessage
from logging_config import logger


class EmailService:
    SENDER_EMAIL = "eosr091@gmail.com"          
    SENDER_PASSWORD = "ggbaqoslrjpkjmqh"          
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587

    @staticmethod
    def send_email(message: EmailMessage, to_email: str) -> bool:
        try:
            with smtplib.SMTP(EmailService.SMTP_SERVER, EmailService.SMTP_PORT) as server:
                server.starttls()
                server.login(
                    EmailService.SENDER_EMAIL,
                    EmailService.SENDER_PASSWORD
                )
                server.send_message(message)

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {e}")
            return False

    @staticmethod
    def send_status_to_email(
        user_email: str,
        user_name: str,
        note_title: str,
        old_status: str,
        new_status: str
    ) -> bool:
        message = EmailMessage()
        message["Subject"] = f"Todo Status Changed: {note_title}"
        message["From"] = EmailService.SENDER_EMAIL
        message["To"] = user_email

        
        message.add_alternative(
            f"""\
<html>
  <body>
    <p>Hi {user_name},</p>
    <p>Your todo item <b>"{note_title}"</b> status has changed:</p>
    <ul>
      <li><strong>Old Status:</strong> {old_status}</li>
      <li><strong>New Status:</strong> {new_status}</li>
    </ul>
    <p>Best regards,<br/>TodoList API Team</p>
  </body>
</html>
""",
            subtype="html"
        )

        return EmailService.send_email(message, user_email)

    