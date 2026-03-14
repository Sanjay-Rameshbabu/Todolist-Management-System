from db.altas_connect import collection, user_tags_collection
from bson.objectid import ObjectId
from datetime import datetime
from datetime import date
from pymongo import ReturnDocument
from models.audit_log import AuditLog
from fastapi import HTTPException
from pymongo.errors import DuplicateKeyError
from pymongo import UpdateOne
class todolist:
 
 SYSTEM_TAGS =[
        {"tag_name": "Work", "isSystemTag": True},
        {"tag_name": "Urgent", "isSystemTag": True},
        {"tag_name": "Medicine", "isSystemTag": True},
        {"tag_name": "Groceries", "isSystemTag": True},
        {"tag_name": "Shopping", "isSystemTag": True}
 ]
 today=date.today().isoformat()

 def addnote(title, description, user_id, user_email, tags=None):
    today = date.today().isoformat()

    # 1. Count existing active notes for this user on this specific date
    # This determines the next available order_index
    current_count = collection.count_documents({
        "user_id": user_id, 
        "date": today, 
        "is_deleted": False
    })

    note = {
        "title": title,
        "description": description,
        "tags": tags if tags else [],
        "created_at": datetime.now(),
        "is_deleted": False,
        "date": today,
        "status": "not-completed",
        "user_id": user_id,
        "user_email": user_email,
        # 2. Assign the next available number as the order_index
        "order_index": current_count 
    }

    result = collection.insert_one(note)
    note_id = result.inserted_id
    
    AuditLog.create_log(str(note_id), "CREATE", old_data=None, new_data=note)
    
    return note_id
    

 def updatenote(note_id,title=None ,description=None , status=None,tags=None):
   updatedata={}
   if title is not None:
      updatedata["title"]=title
   if description is not None:
      updatedata["description"]=description
   if status is not None:
      updatedata["status"]=status
   if tags is not None: 
      updatedata["tags"]=tags
   if not updatedata:
        return None
   
   old_note = collection.find_one({"_id":ObjectId(note_id),"is_deleted":False})
   result= collection.find_one_and_update({ "_id":ObjectId(note_id),"is_deleted":False},{"$set":updatedata} ,return_document=ReturnDocument.AFTER)
   
   if result:
        old_data = {}
        new_data = {}

   for field in updatedata.keys():
        if field in old_note:
            old_data[field] = old_note[field]

        if field in result:
            new_data[field] = result[field]
   AuditLog.create_log(note_id, "UPDATE", old_data=old_data, new_data=new_data)
   
   return result

 def softdelete(note_id):
   note = collection.find_one({"_id":ObjectId(note_id)})
   result= collection.update_one({"_id":ObjectId(note_id)},{"$set":{"is_deleted":True} })
   
   # Log the soft delete
   if result.modified_count > 0:
       AuditLog.create_log(note_id, "SOFT_DELETE", old_data=note, new_data={"is_deleted": True})
   
   return result.modified_count
 
 def softdeletemany(ObjectIdList):
    object_ids=[]
    for id in ObjectIdList:
       object_ids.append(ObjectId(id))
    
    olddata=[]
    for note in collection.find({"_id": {"$in": object_ids}}):
       olddata.append(note)
    
    result=collection.update_many({"_id":{"$in": object_ids}},{"$set":{"is_deleted":True}})
    if result.modified_count>0:
       for note in olddata:
            AuditLog.create_log(note_id=note["_id"],action="SOFT_DELETE",old_data=note,new_data={"is_deleted": True})

    return result.modified_count
 
 def permanentdelete(note_id):
    note = collection.find_one({"_id":ObjectId(note_id)})
    result=collection.delete_one({"_id":ObjectId(note_id)})
    
    if result.deleted_count > 0:
        AuditLog.create_log(note_id, "PERMANENT_DELETE", old_data=note, new_data=None)
    
    return result.deleted_count
 
 def updateStatus(note_id: str, status: str):
    old_note = collection.find_one({"_id": ObjectId(note_id), "is_deleted": False})
    
    result = collection.find_one_and_update(
        {"_id": ObjectId(note_id), "is_deleted": False},
        {
            "$set": {
                "status": status,
                "update_at": datetime.now()
            }
        },
        return_document=ReturnDocument.AFTER
    )
    
   # Log status change with old and new data
    if old_note and result:
      old_data = {"status": old_note.get("status") if old_note else None}
      new_data = {"status": status}
      AuditLog.create_log(note_id, "STATUS_CHANGE", old_data=old_data, new_data=new_data)

   # Return both old and new documents to caller
    return {"old": old_note, "new": result}

#Get today's notes
 def gettodaynotes():
    result=[]
    today=date.today().isoformat()
    notes=collection.find({"date":today ,"is_deleted":False})
    for note in notes:
     note["_id"]=str(note["_id"])
     result.append(note)
    return result

# including history
 def getallnotes():
  result=[]
  notes=collection.find()
  for note in notes:
     note["_id"]=str(note["_id"])
     result.append(note)

  return result

 def getactivenotes():
   notes=collection.find({"is_deleted": False})
   result=[]
   for note in notes:
      note["_id"]=str(note["_id"])
      result.append(note)
   return result

 def getdeletednotes():
   result=[]
   notes=collection.find({"is_deleted": True})
   for note in notes:
      note["_id"]=str(note["_id"])
      result.append(note)
   return result

 def get_notes_by_date(date ,user_id):
    result=[]
    notes=collection.find({"date":date ,"user_id":user_id ,"is_deleted" :False}).sort("order_index",1)
    for note in notes:
       note["_id"]=str(note["_id"])
       result.append(note)
    return result

 def update_date(note_id: str, new_date: str):
        old_note = collection.find_one({"_id": ObjectId(note_id), "is_deleted": False})
        
        result = collection.find_one_and_update(
            {"_id": ObjectId(note_id), "is_deleted": False},
            {
                "$set": {
                    "date": new_date,
                    "updated_at": datetime.now()
                }
            },return_document=ReturnDocument.AFTER
        )
        
        # Log date change
        if result:
            old_data = {"date": old_note.get("date") if old_note else None}
            new_data = {"date": new_date}
            AuditLog.create_log(note_id, "DATE_CHANGE", old_data=old_data, new_data=new_data)
        
        return result

 def get_notes_by_user(user_id:str):
     result=[]
     notes=collection.find({"user_id":user_id ,"is_deleted":False})
     for note in notes:
        note["_id"]=str(note["_id"])
        result.append(note)

     return result
 
 def system_tags():
    for tag in todolist.SYSTEM_TAGS:
            # Check if tag already exists globally (user_id is None)
            exists = user_tags_collection.find_one({"tag_name": tag["tag_name"], "user_id": None})
            if not exists:
                user_tags_collection.insert_one({
                    "tag_name": tag["tag_name"],
                    "isSystemTag": True,
                    "user_id": None, 
                    "created_at": datetime.now()
                })
   
       
 def get_user_tags(user_id: str):
    query = {
      "$or": [
                {"user_id": None, "isSystemTag": True}, # Global
                {"user_id": user_id, "isSystemTag": False} # User specific
            ]
    }
    tags = list(user_tags_collection.find(query))
    for tag in tags:
         tag["_id"] = str(tag["_id"])
    return tags
 
 @staticmethod
 async def add_custom_tag(user_id: str, tag_name: str):
    tag_name = tag_name.strip().lower()

    try:
        result =  user_tags_collection.insert_one({
            "user_id": user_id,
            "tag_name": tag_name,
            "isSystemTag": False,
            "created_at": datetime.utcnow()
        })
        return result.inserted_id

    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="Tag already exists for this user"
        )
         
 # models/todolist_model.py
@staticmethod
def update_notes_order(note_orders):
    for item in note_orders:
        collection.update_one(
            {"_id": ObjectId(item["id"])},
            {"$set": {"order_index": item["order"]}}
        )
    return True

@staticmethod
def update_notes_order(note_orders):
    try:
        operations = [
            UpdateOne(
                {"_id": ObjectId(item["id"])},
                {"$set": {"order_index": item["order"]}} # Creates the field if it doesn't exist
            ) for item in note_orders
        ]
        if operations:
            # Execute one single request to update all notes
            collection.bulk_write(operations)
            return True
        return False
    except Exception as e:
        print(f"Update failed: {e}")
        return False