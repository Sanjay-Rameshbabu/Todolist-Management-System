import logging
import logging.handlers
import os
from datetime import datetime

# Create logs  if it doesn't exist
Foldername = "logs"
if not os.path.exists(Foldername):
    os.makedirs(Foldername)

# Define log file path
LOG_FILE = os.path.join(Foldername, f"todolist_{datetime.now().strftime('%Y-%m-%d')}.log")


logger = logging.getLogger("TodoListAPI")
logger.setLevel(logging.DEBUG)

# Create file handler with rotation
file_handler = logging.handlers.RotatingFileHandler(
    LOG_FILE,
    maxBytes=5*1024*1024,  
    backupCount=5
)
file_handler.setLevel(logging.DEBUG)


console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)


logger.addHandler(file_handler)
logger.addHandler(console_handler)