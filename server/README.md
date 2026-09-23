# SkillBridge Backend API

REST API backend for **SkillBridge — Internship & Job Management Platform**, built using Node.js, Express.js, and MongoDB/Mongoose.

## Status

**Phase 1: Project Initialization & Foundation**

## Features Implemented in Phase 1
- Express application skeleton with CORS, Helmet, and rate limiting.
- Centralized MongoDB Mongoose connection handler (`src/config/db.js`).
- Structured modular folders (`config/`, `controllers/`, `middleware/`, `models/`, `routes/`, `utils/`, `uploads/resumes/`).
- Health check endpoint at `GET /api/health`.
- Centralized 404 and global error handling middlewares.
- Graceful server shutdown on process termination signals.

## Running Locally

1. Create `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server with live reload:
   ```bash
   npm run dev
   ```
4. Verify server status:
   Open `http://localhost:5000/api/health` in your browser or Postman.
