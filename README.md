# Course Management System

A full-stack web application for managing and showcasing courses, built with React, Express, and MySQL.

## Features

- Course listing and details
- Course management (add, edit, delete)
- Responsive design
- Multiple pages (Home, About, Courses, Contact, FAQs)

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- npm or yarn

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```
3. Set up the MySQL database:
   - Create a database named `course_management`
   - Import the database schema from `backend/database/schema.sql`

4. Configure environment variables:
   - Copy `.env.example` to `.env` in the backend directory
   - Update the database credentials and other configurations

5. Start the application:
   ```bash
   npm start
   ```

The application will run on:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Project Structure

```
├── frontend/          # React frontend
├── backend/           # Express backend
└── package.json       # Root package.json
``` 