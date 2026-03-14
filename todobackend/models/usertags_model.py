from db.altas_connect import user_tags_collection
from bson.objectid import ObjectId
from datetime import datetime
from datetime import date
from pydantic import BaseModel
from typing import List
   
class UserTagsInDB(BaseModel):
    id: str | None = None
    user_id: str
    tags: List[str] 
    created_at: datetime |None = None
    updated_at: datetime |None  = None

class UserTagsBase(BaseModel):
    tags: List[str] = ['Work', 'Personal', 'Urgent', 'Shopping', 'Groceries']


class UserTagsUpdate(BaseModel):
    tags: List[str]

class UserTagsResponse(BaseModel):
    tags: List[str]
