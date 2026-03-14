# TodoList Management System

A full-stack Todo List application with **FastAPI backend** and **React frontend**. It supports:

- User authentication (JWT) with signup/login
- Create, update, delete (soft/permanent) todos
- Tags per todo item
- Status updates + scheduled expiry (daily scheduled job)
- Email notification when status changes
- MongoDB (Atlas) as backend storage
- React + Redux + Material UI frontend

---

## 🧱 Tech Stack

| Layer          | Technology                                                 |
| -------------- | ---------------------------------------------------------- |
| Backend        | Python, FastAPI, Uvicorn                                   |
| Database       | MongoDB Atlas (via PyMongo)                                |
| Authentication | JWT (python-jose)                                          |
| Scheduler      | APScheduler                                                |
| Email          | SMTP (Gmail)                                               |
| Frontend       | React (Create React App), Redux, Material UI, Tailwind CSS |

---

## 🚀 Getting Started (Dev)

The repo is split into two folders:

- `todobackend/` - FastAPI backend
- `todofrontend/` - React frontend

You can run them independently.

### 1) Backend (FastAPI)

#### Prerequisites

- Python 3.10+ (3.11 recommended)
- `pip` installed

#### Setup

1. Open a terminal and change into backend:

```bash
cd todobackend
```

2. Create & activate a virtual environment (recommended):

```bash
python -m venv .venv
# Windows
.\.venv\Scripts\activate
# macOS / Linux
# source .venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Configure MongoDB & Secrets

> **Important:** The project currently contains hard-coded placeholder credentials for MongoDB and SMTP. Update the relevant files before running.

- MongoDB connection: `todobackend/db/altas_connect.py`
- JWT secret: `todobackend/models/config.py`
- SMTP settings: `todobackend/Scheduler.py`

**Recommended**: Replace those values with your own MongoDB Atlas URI and Gmail (or other SMTP) credentials.

#### Run the API

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- API will be available at: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

---

### 2) Frontend (React)

#### Prerequisites

- Node.js 18+ (includes npm)

#### Setup

1. Open a terminal and change into frontend:

```bash
cd todofrontend
```

2. Install dependencies:

```bash
npm install
```

3. Run the app

```bash
npm start
```

The app will open at: `http://localhost:3000`

> The frontend is configured to call the backend at `http://localhost:8000` (CORS enabled for `localhost:3000`).

---

## 🧩 Environment / Configuration Notes

The project currently uses hard-coded configuration values. For production use, migrate these into environment variables or a configuration system.

### Key files to update

- `todobackend/db/altas_connect.py` (MongoDB URI)
- `todobackend/models/config.py` (JWT `SECRET_KEY`)
- `todobackend/Scheduler.py` (SMTP credentials; optional email notifications)

---

## 🧠 API Endpoints (Backend)

### Auth

| Method | Endpoint           | Description                           |
| ------ | ------------------ | ------------------------------------- |
| POST   | `/api/auth/signup` | Create user. Returns JWT token.       |
| POST   | `/api/auth/login`  | Authenticate user. Returns JWT token. |

#### Signup payload

```json
{
  "email": "user@example.com",
  "password": "MyPassword123",
  "first_name": "Jane",
  "last_name": "Doe"
}
```

#### Login payload

```json
{
  "email": "user@example.com",
  "password": "MyPassword123"
}
```

### Todo endpoints (require Bearer token)

> Bearer token must be provided in `Authorization` header: `Bearer <token>`

| Method | Endpoint                                  | Description                                                  |
| ------ | ----------------------------------------- | ------------------------------------------------------------ |
| POST   | `/api/todolist/`                          | Create todo                                                  |
| PUT    | `/api/todolist/{note_id}`                 | Update todo fields (title/description/tags)                  |
| PUT    | `/api/todolist/updateStatus/{note_id}`    | Update status (not-completed/completed/expired) + send email |
| PUT    | `/api/todolist/updateDate/{note_id}`      | Update due date (YYYY-MM-DD)                                 |
| DELETE | `/api/todolist/softdelete/{note_id}`      | Soft delete (mark as deleted)                                |
| DELETE | `/api/todolist/softdeletemany`            | Soft delete many notes (pass JSON {"ids": [...]})            |
| DELETE | `/api/todolist/permanentdelete/{note_id}` | Permanent delete from DB                                     |
| GET    | `/api/todolist/getall`                    | Get all todos                                                |
| GET    | `/api/todolist/active`                    | Get active todos                                             |
| GET    | `/api/todolist/deleted`                   | Get soft-deleted todos                                       |
| GET    | `/api/todolist/today`                     | Get todos for today                                          |
| GET    | `/api/todolist/getbydate/{date}`          | Get todos for a specific date (YYYY-MM-DD)                   |
| GET    | `/api/todolist/test/trigger-expiry`       | Manual trigger to mark today’s incomplete todos as expired   |

#### Create todo payload

```json
{
  "title": "Write README",
  "description": "Add documentation for project",
  "tags": ["docs", "backend"]
}
```

---

## ✅ Features to Explore

- **JWT auth**: secured endpoints via middleware
- **Scheduler**: runs a nightly job to update incomplete tasks as `expired` (configured daily at 23:59:59)
- **Email notification**: sends an email when task status changes
- **Soft delete**: enables recoverable delete functionality

---


## 🔧 Deployment

For production, consider:

- Running backend with a proper ASGI server (e.g., `uvicorn --workers 4` or `gunicorn` + `uvicorn.workers.UvicornWorker`)
- Storing secrets in environment variables or a secrets manager
- Configuring CORS origins to match your production web client
- Using a hosted MongoDB cluster (Atlas) with secure credentials



