# CreativFlow AI: Intelligent Asset Repurposing Engine

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.12-blue.svg)
![React](https://img.shields.io/badge/react-19.0-61DAFB.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688.svg)

**CreativFlow AI** is a full-stack platform designed to revolutionize how creative teams manage and repurpose digital assets. By leveraging powerful LLMs (OpenAI, Gemini, Claude) and computer vision, it automates the resizing, layout adjustment, and stylistic transformation of images for various advertising and social media platforms.

---

## Key Features

### **AI-Powered Generation**
- **Multi-Model Support:** Configurable AI backend supporting **OpenAI**, **Google Gemini**, and **Anthropic Claude**.
- **Intelligent Resizing:** Content-aware cropping and layout adjustment that preserves focal points (e.g., product-centric vs. person-centric).
- **Smart Repurposing:** Automatically transforms a single master asset into multiple formats (Instagram Story, LinkedIn Post, Web Banner, etc.).

### **Advanced Asset Management**
- **Bulk Uploads:** Drag-and-drop interface supporting up to 50 files/batch with parallel processing.
- **Real-Time Preview:** Side-by-side comparison of original vs. AI-generated variants.
- **In-Browser Editing:** Manually tweak crops, adjust saturation, and add text overlays before downloading.

### **Admin & Control**
- **Template Management:** Admins can define custom output formats and platform specifications.
- **Rule Engine:** Configure AI behavior, such as "Extend Canvas" strategies or "Focal Point Detection" logic.
- **Role-Based Access:** Secure authentication and management for users and administrators.

---

## Tech Stack

### **Frontend**
* **Framework:** React 19 + TypeScript
* **Build Tool:** Vite
* **Styling:** CSS Modules / Custom Theme
* **State/Data:** React Hooks, Axios

### **Backend**
* **API Framework:** FastAPI (Python 3.12)
* **Task Queue:** Celery + RabbitMQ
* **Database:** PostgreSQL (with SQLAlchemy & Alembic)
* **Caching:** Redis
* **Image Processing:** Pillow (PIL), OpenCV

---

## Getting Started

### Prerequisites
* **Docker & Docker Compose** (for DB, Redis, RabbitMQ)
* **Python 3.12+**
* **Node.js 18+**

### 1. Backend Setup

The backend handles API requests, AI processing, and database management.

1.  **Navigate to the server directory:**
    ```bash
    cd backend/server
    ```

2.  **Start Infrastructure Services (Postgres, Redis, RabbitMQ):**
    ```bash
    docker-compose up -d db redis rabbitmq worker
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in `backend/server/` based on `.env.example`:
    ```ini
    # Database & Security
    DATABASE_URL=postgresql://user:password@localhost/dbname
    SECRET_KEY=your_secret_key
    
    # AI Providers (Add your keys)
    OPENAI_API_KEY=sk-...
    GEMINI_API_KEY=...
    AI_PROVIDER=openai  # Options: openai, gemini, claude
    ```

4.  **Install Dependencies & Initialize DB:**
    ```bash
    # Create virtual env
    python3 -m venv venv
    source venv/bin/activate

    # Install libs
    pip install -r requirements.txt

    # Run Migrations & Seed Data
    python -m alembic upgrade head
    python scripts/seed_complete_data.py
    ```

5.  **Start the API Server:**
    ```bash
    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```
    *API Docs available at: http://localhost:8000/api/v1/docs*

### 2. Frontend Setup

The frontend provides the user interface for the platform.

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Start Development Server:**
    ```bash
    npm run dev
    ```
    *Access the UI at: http://localhost:5173*

---

## Usage Guide

1.  **Authentication:** Log in using the default seeded credentials (or register if enabled).
    * *Default User:* `john_doe` / `password123` (if seeded)
2.  **Create Project:** Go to the Dashboard and upload your master assets (Images/Design files).
3.  **Select Formats:** Choose target platforms (e.g., "Instagram Stories", "LinkedIn Banner").
4.  **Generate:** Click "Generate with AI". The system will queue jobs to the background workers.
5.  **Review & Edit:** Watch the status update in real-time. Click any generated asset to enter "Edit Mode" for fine-tuning.
6.  **Download:** Batch download approved assets as a ZIP file.

---

## Architecture Overview

The system uses a decoupled microservices architecture:

1.  **Frontend (React):** Sends generation requests to the backend.
2.  **API Server (FastAPI):** Validates requests and pushes jobs to a RabbitMQ queue.
3.  **Worker Nodes (Celery):** Pick up jobs asynchronously to perform heavy AI processing and image manipulation (OpenCV/Pillow).
4.  **Database (Postgres):** Stores user data, project metadata, and asset references.
5.  **Cache (Redis):** Handles real-time status updates and task tracking.
