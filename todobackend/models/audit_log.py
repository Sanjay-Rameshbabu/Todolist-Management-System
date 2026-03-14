from db.altas_connect import logs_collection
from bson.objectid import ObjectId
from datetime import datetime
from logging_config import logger

class AuditLog:

    @staticmethod
    def convert_objectid_to_string(data):
        if data is None:
            return None
        if isinstance(data, ObjectId):
            return str(data)
        elif isinstance(data, dict):
            return {k: AuditLog.convert_objectid_to_string(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [AuditLog.convert_objectid_to_string(item) for item in data]
        else:
            return data

    @staticmethod
    def create_log(note_id, action, old_data=None, new_data=None):
            entry_log = {
                "note_id": ObjectId(note_id),
                "action": action,
                "old_data": old_data,
                "new_data": new_data,
                "timestamp": datetime.utcnow()
            }
            result = logs_collection.insert_one(entry_log)
            logger.info("Audit log stored successfully")
            return str(result.inserted_id)

    @staticmethod
    def get_logs_by_note_id(note_id):
            oid = ObjectId(note_id)

            logs = list(
                logs_collection.find({"note_id": oid})
                .sort("timestamp", -1)
            )

            for log in logs:
                log["_id"] = str(log["_id"])
                log["note_id"] = str(log["note_id"])
                log["timestamp"] = log["timestamp"].isoformat()
                # Convert ObjectIds in old_data and new_data
                log["old_data"] = AuditLog.convert_objectid_to_string(log.get("old_data"))
                log["new_data"] = AuditLog.convert_objectid_to_string(log.get("new_data"))

            return logs

    @staticmethod
    def get_all_logs():
            logs = list(logs_collection.find().sort("timestamp", -1))

            for log in logs:
                log["_id"] = str(log["_id"])
                log["note_id"] = str(log["note_id"])
                log["timestamp"] = log["timestamp"].isoformat()
             # Convert ObjectIds in old_data and new_data
                log["old_data"] = AuditLog.convert_objectid_to_string(log.get("old_data"))
                log["new_data"] = AuditLog.convert_objectid_to_string(log.get("new_data"))

            return logs
