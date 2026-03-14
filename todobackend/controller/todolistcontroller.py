from fastapi import APIRouter, Request, Depends, BackgroundTasks,HTTPException
from fastapi.security import HTTPBearer
from models.todolist_model import todolist
from models.audit_log import AuditLog
from models.email_service import EmailService
from models.user_service import UserService
from middleware.jwt_middleware import JWTMiddleware, security
from pydantic import BaseModel
from logging_config import logger
from typing import List
from Scheduler import update_status_as_expired

class todoCreate(BaseModel):
    title: str
    description: str
    tags:List[str] = []

class todoUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status : str | None = None
    tags: List[str] | None = None 

class todoUpdateStatus(BaseModel):
    status: str 

class todoUpdateDate(BaseModel):
    date: str   

class ObjectIdList(BaseModel):
    ids: List[str]

class UserTagsCreate(BaseModel):
    tag_name: str

router = APIRouter(
    prefix="/api/todolist",
    dependencies=[Depends(JWTMiddleware.get_current_user)]
)


@router.post("/")
def create_todolist(todo: todoCreate, request:Request):
    user=request.state.user 
    try:        
        note_id = todolist.addnote(todo.title, todo.description, user.user_id, user.email,todo.tags)
        logger.info(f"Todo created successfully with noteid: {note_id} for user: {user.email}")
        
        return {
            "message": "Todo created successfully",
            "id": str(note_id),
            "user_email": user.email,
            "tags":todo.tags
        }
    
    except Exception as e:
        logger.error(f"Error in creating notes {str(e)}")
        return {"error": str(e)}
    


@router.put("/{note_id}")
def update_todolist(note_id: str, todo: todoUpdate):
    try:
        result = todolist.updatenote(note_id, todo.title, todo.description,todo.tags)
        if result is None:
            logger.warning(f"No fields updated with noteid:{note_id}")
            return {"updated": 0, "message": "No fields to update"}

        result["_id"]=str(result["_id"])
        logger.info(f"Updated Successfully")
        return {
            "result": result
            }
    except Exception as e:
        logger.error(f"Error in updating{str(e)}")
        return {"error":str(e)}

@router.put("/updateStatus/{note_id}")
def update_status(note_id: str, todo: todoUpdateStatus, background_tasks: BackgroundTasks):
    try:
        result = todolist.updateStatus(note_id, todo.status)

        # result is a dict: {"old": old_note, "new": new_note}
        new_note = result.get("new") if isinstance(result, dict) else None
        old_note = result.get("old") if isinstance(result, dict) else None

        if new_note:
            title = new_note.get("title")
            old_status = old_note.get("status") if old_note else "unknown"
            user_email = new_note.get("user_email")
            user_id = new_note.get("user_id")

            # Get user full name
            user_data = UserService.get_user_by_id(str(user_id)) if user_id else None
            user_name = f"{user_data['first_name']} {user_data['last_name']}" if user_data else "User"

            # Send email in background
            if user_email:
                background_tasks.add_task(
                    EmailService.send_status_to_email,
                    user_email=user_email,
                    user_name=user_name,
                    note_title=title,
                    old_status=old_status,
                    new_status=todo.status
                )

            logger.info(f"TodoList status updated {note_id} to {todo.status}")
            return {
                "updatedStatus": 1,
                "note_id": note_id,
                "new_status": todo.status,
                "message": "Status updated and notification sent"
            }

        logger.warning(f"No note found with id: {note_id}")
        return {
            "updatedStatus": 0,
            "message": "Note not found"
        }
    
    except Exception as e:
        logger.error(f"Error in updating status for note {note_id}: {str(e)}")
        return {"error": str(e)}
    except Exception as e:
        logger.error(f"Error in updating noteid:{str(e)}")
        return {"error":{str(e)}}


@router.delete("/softdelete/{note_id}")
def softdelete(note_id: str):
    try:
        todolist.softdelete(note_id)
        logger.info(f"Soft delete is successfully for id:{note_id}")
        return {"message": "Soft deleted"}
    except Exception as e:
        logger.error(f"Error in soft delete:{str(e)}")
        return{"error":{str(e)}}

@router.delete("/softdeletemany")
def deletemany(todo:ObjectIdList):
    try:
        todolist.softdeletemany(todo.ids)
        logger.info("Many notes deleted successfully")
        return {"message":"deleted successfully"}
    except Exception as e:
        logger.error(f"Error in soft delete many")
        return {"error":{str(e)}}
    
@router.delete("/permanentdelete/{note_id}")
def permanentdelete(note_id: str):
    try:
        todolist.permanentdelete(note_id)
        logger.info(f"Permanent delete is successfully for id:{note_id}")
        return {"message": "Permanently deleted"}
    except Exception as e:
        logger.error(f"Error in permanent delete:{str(e)}")
        return {"error":str(e)}

@router.get("/getall")
def get_all():
    try:
        logger.info(f"Fetching all notes is successfully")
        return todolist.getallnotes()
    except Exception as e:
        logger.error(f"Error in fetching notes:{str(e)}")
        return {"error":str(e)}

@router.get("/active")
def get_active():
    try:
     logger.info(f"Fetching active notes is successfully")
     return todolist.getactivenotes()
    except Exception as e:
     logger.error(f"Error in active fetching:{str(e)}")
     return {"error":str(e)}

@router.get("/deleted")
def get_deleted():
    try:
        logger.info(f"fetching the deleted notes is successfully")
        return todolist.getdeletednotes()
    except Exception as e:
        logger.error(f"Error in fetching the deleted notes {str(e)} ")
        return {"error":{str(e)}}

@router.get("/today")
def get_today():
    try:
     logger.info(f"fetching todays notes is successfully")
     return todolist.gettodaynotes()
    except Exception as e:
     logger.error(f"Error in fetching the notes {str(e)}")
     return {"error":{str(e)}}

@router.get("/getbydate/{date}")
def get_by_date(date:str , request:Request):
    user= request.state.user
    try:
        logger.info(f"Fetching notes for date: {date}")
        return todolist.get_notes_by_date(date ,user.user_id)
    except Exception as e:
        logger.error(f"Error fetching notes by date {date}: {str(e)}")
        return {"error": str(e)}

@router.get("/test/trigger-expiry") 
def test_trigger_expiry():
    try:
        logger.info("Manual trigger: Testing expiry update")
        update_status_as_expired()
        return {"message": "Expiry update to status successfully", "status": "expired"}
    except Exception as e:
        logger.error(f"Error to  update expiry to the status : {str(e)}")
        return {"error": str(e)}

@router.put("/updateDate/{note_id}")
def update_date(note_id: str, todo: todoUpdateDate):
    try:
        from datetime import datetime as dt
        from datetime import date
        try:
            new_date= dt.strptime(todo.date, '%Y-%m-%d')
            dateval = new_date.date()
            todaydate=date.today()
            if dateval < todaydate:
             logger.warning(f"Attempt to update the current date from today ,{todo.date}")
             return {"updated": 0, "message": "Cannot update date to a past date."}

        except ValueError:
            logger.warning(f"Invalid date format provided: {todo.date}")
            return {"updated": 0, "message": "Invalid date format. Use YYYY-MM-DD"}
        
        
        result = todolist.update_date(note_id, todo.date)
        
        if result is None:
            logger.warning(f"No note found with ID: {note_id}")
            return {"updated": 0, "message": "Note not found"}
        
        result["_id"] = str(result["_id"])
        logger.info(f"Date updated successfully for note {note_id} to {todo.date}")
        return {
            "updated": 1,
            "message": "Date updated successfully",
            "result": result
        }
    except Exception as e:
        logger.error(f"Error updating date for note {note_id}: {str(e)}")
        return {"error": str(e)}

#Get all  logs for a specific note by note_id
@router.get("/logs/{note_id}")
def get_note_logs(note_id: str):
    try:
        logs = AuditLog.get_logs_by_note_id(note_id)
        logger.info(f"Fetching logs for note_id: {note_id}")
        return {
            "note_id": note_id,
            "total_logs": len(logs),
            "logs": logs
        }
    except Exception as e:
        logger.error(f"Error fetching logs for note_id {note_id}: {str(e)}")
        return {"error": str(e)}

#Get all audit logs in the system
@router.get("/all_logs")
def get_all_logs():
    try:
        logs = AuditLog.get_all_logs()
        logger.info("Fetching all audit logs")
        return {
            "total_logs": len(logs),
            "logs": logs
        }
    except Exception as e:
        logger.error(f"Error fetching all logs: {str(e)}")
        return {"error": str(e)}

@router.get("/getallbyuser")
def get_all_by_user(request:Request):
    user=request.state.user
    try:
        notes = todolist.get_notes_by_user(user.user_id)
        logger.info(f"Fetching all notes for user: {user.user_id}")
        
        return {
            "user_id": user.user_id,
            "total_notes": len(notes),
            "notes": notes
        }
    except Exception as e:
        logger.error(f"Error fetching notes for user: {str(e)}")
        return {"error": str(e)}

# Add this endpoint to your router
@router.get("/tags")
def get_tags(request: Request):
    user = request.state.user
    try:
        # Now fetching from the dedicated user_tags collection
        return todolist.get_user_tags(user.user_id)
        
    except Exception as e:
        logger.error(f"Error fetching tags: {str(e)}")
        return {"error": str(e)}
    
@router.post("/addtags")
async def add_tags(usertag: UserTagsCreate ,request :Request):
    user= request.state.user
    try:
        
        tag_id = await todolist.add_custom_tag(user.user_id ,usertag.tag_name )
        return{
            "message": "Tag added successfully",
            "user_id": user.user_id,
            "tag_id": str(tag_id),
            "tag_name":usertag.tag_name
        }
    except HTTPException as e:
        raise e

    except Exception as e:
        logger.error(f"Error in add tags: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )

@router.put("/updateOrder")
def update_order(request: Request, data: dict):
    # This matches the { note_orders: orderData } sent from frontend
    note_orders = data.get("note_orders", [])
    
    # Log to verify the data is arriving
    print(f"Incoming Reorder Request: {note_orders}") 
    
    # Call your model to update MongoDB
    success = todolist.update_notes_order(note_orders) 
    return {"status": "success"} if success else {"status": "error"}