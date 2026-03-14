from fastapi import FastAPI
from db.altas_connect import user_tags_collection
from controller.todolistcontroller import router as todolist_router
from controller.auth_controller import router as auth_router
from logging_config import logger
from Scheduler import start_scheduler
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TodoList API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows GET, POST, PUT, DELETE, etc.
    allow_headers=["*"], # Allows Authorization headers (the Bearer token)
)


# Include routers
app.include_router(todolist_router)
app.include_router(auth_router)

@app.get("/")
def health_check():
    logger.info("Health check endpoint accessed")
    return {"status": "API running"}

@app.on_event("startup")
def create_indexes():
    user_tags_collection.create_index(
        [("user_id", 1), ("tag_name", 1)],
        unique=True
    )

@app.on_event("startup")
async def startup_event():
    start_scheduler()
    logger.info("..............TodoList API Started.....................")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("..............TodoList API Shutdown....................")