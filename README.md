# Collaborative Form System

A real-time collaborative form filling application similar to Google Forms but with real-time collaboration features like Google Docs.

## Features

- **User Authentication**: Register, login, and user management
- **Role-Based Access Control**: Admin and regular user roles
- **Form Management**: Create, edit, delete, and share forms
- **Dynamic Form Fields**: Support for various field types (text, email, number, select, checkbox, radio)
- **Real-time Collaboration**: Multiple users can work on the same form simultaneously
- **Typing Indicators**: See who is currently editing which field
- **Field History**: Track who made changes to form fields and when
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

### Frontend
- React.js
- React Router for navigation
- Socket.IO client for real-time communication
- Context API for state management

### Backend
- Node.js with Express
- MongoDB for database
- Socket.IO for WebSockets
- JWT for authentication
- Mongoose for MongoDB object modeling

## Project Structure

The project is organized into two main directories:

- `collaborative-form-frontend`: React frontend application
- `collaborative-form-backend`: Node.js/Express backend API

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- MongoDB (v4+)

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd collaborative-form-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/collaborative-forms
   JWT_SECRET=your_jwt_secret_key
   ```

4. Start the backend server:
   ```
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd collaborative-form-frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   npm start
   ```

4. Open your browser and visit `http://localhost:3000`

## Usage

1. Register a new account (the first user will automatically become an admin)
2. Create a new form with various field types
3. Share the form link with other users
4. Collaborate in real-time as multiple users fill out the form
5. Admin users can view all forms and manage users

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Google Forms and Google Docs
- Built as a demonstration of real-time collaboration features 