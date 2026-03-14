from db.altas_connect import collection
from apscheduler.schedulers.background import BackgroundScheduler
from logging_config import logger
from datetime import datetime
from datetime import date
import smtplib
from email.message import EmailMessage
def update_status_as_expired():
      today_str=date.today().strftime('%Y-%m-%d')
      logger.info("Update incomplete notes to expire")
      query={"status":"not-completed","date":today_str}
      expired_tasks=list(collection.find(query))
      result =collection.update_many(query,
            {"$set":{
         "status":"expired",
         "update_at":datetime.now()
      }})
      logger.info("Expired %s incomplete tasks", result.modified_count)
     
      for task in expired_tasks:
          note_id=task.get(str("_id"))
          title=task.get("title")
          recipient_email = task.get("user_id")

          if recipient_email:
           send_mail_status_update(recipient_email,note_id,"expired",title)

def start_scheduler():
    scheduler = BackgroundScheduler(timezone="Asia/Kolkata")

    scheduler.add_job(
        update_status_as_expired,
        trigger="cron",
        hour=23,
        minute=59,
        second=59
    )
    scheduler.start()
      
SMTP_email="eosr091@gmail.com"
SMTP_password="ggbaqoslrjpkjmqh"

def send_mail_status_update(to_mail:str,note_id:str,status:str,title:str):
     msg=EmailMessage()
     msg.set_content(f"The status for the {note_id}:{title} is changed to {status}")
     msg['Subject']=f"Update: Note Status changed"
     msg['From']="eos091@gmail.com"
     msg['To']= to_mail

     try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(SMTP_email,SMTP_password )
            smtp.send_message(msg)
            logger.info(f"Mail sent successfully")
     except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return{"error":{e}}
