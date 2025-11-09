# 🚀 hackCBS Project

Welcome to the hackCBS project! This repository contains a full-stack solution built during the hackCBS hackathon, featuring a modern React frontend, a robust Python backend, and a scalable UploadThing microservice for file uploads.

---

## 🏆 What is this Project?

This project was created as part of the hackCBS hackathon to solve real-world problems using cutting-edge web technologies. It demonstrates teamwork, rapid prototyping, and integration of multiple services for a seamless user experience.

---

## 🗂️ Project Structure

```
hackCBS/
├── backend/           # FastAPI backend (Python)
│   ├── main.py
│   ├── db.py
│   ├── requirements.txt
│   ├── credentials.json
│   ├── downloads/
│   ├── uploads/
│   └── uploadthing/   # UploadThing microservice (TypeScript/Node)
├── frontend/          # React frontend (Vite)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
└── uploadthing-server/ # Standalone UploadThing server (optional)
```

---

## ⚡ Quickstart

### 1. Backend (Python)
```sh
cd backend
python3.13 -m venv env
source env/bin/activate
pip install -r requirements.txt
python main.py
```

### 2. Frontend (React)
```sh
cd frontend
npm install
npm run dev

```

### 3. UploadThing Microservice
```sh
cd backend/uploadthing
npm install
npm run dev

```

---

## 🌟 Features
- Fast file uploads with UploadThing
- Modern UI with React
- Secure backend with Python
- Environment variable support for secrets
- Ready for hackathon demos and rapid iteration

---








