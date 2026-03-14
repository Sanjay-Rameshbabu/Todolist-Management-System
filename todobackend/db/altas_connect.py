from pymongo import MongoClient
from logging_config import logger

connectionString = "mongodb+srv://user:user123@cluster0.quycnzl.mongodb.net/?appName=Cluster0"

try:
    client = MongoClient(connectionString)
    db = client["toDoList"]
    collection = db["toDoList"]
    logs_collection = db["audit_logs"] 
    users_collection = db["users"] 
    user_tags_collection =db["user_tags"]
    
    logs_collection.create_index("note_id")
    logs_collection.create_index("timestamp")
    logs_collection.create_index("action")
    
    logger.info(f"Mongodb connected successfully")
    print("MongoDB connected successfully")

except Exception as e:
    logger.error(f"MongoDB connection is error")
    print(f"MongoDB connection is failed:{str(e)}")



