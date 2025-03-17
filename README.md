# Chat App - Backend

This is the backend for the Chat Application, built using **Node.js** and **Express.js**. It provides APIs for user authentication, real-time messaging, group chat management, and notifications.

## Features

- **User Authentication** (Sign Up & Login)
- **Real-time messaging** using WebSockets
- **Message delivery and read status** (✔ = Delivered, ✔✔ = Read)
- **Online status indication**
- **Typing and last seen indicators**
- **Group chat functionality**
  - Create groups
  - Add or remove members (Admin only)
  - Assign group admin privileges
  - Update group name
- **Notifications & unread message count**
- **Secure JWT-based authentication**
- **MongoDB for data storage**

## Installation & Setup

### Prerequisites
Make sure you have the following installed:
- Node.js (latest LTS version recommended)
- MongoDB (running locally or on a cloud provider like MongoDB Atlas)

### Clone the Repository
```bash
git clone https://github.com/muhammedsavadtp/chatapp_backend.git
cd chatapp_backend
```

### Install Dependencies
```bash
npm install
```

### Environment Variables
Create a `.env` file in the project root and add the following:
```env
# Development Mode
NODE_ENV="development"
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Run the Server
```bash
npm start  # Start the server
```

<!-- ## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - User login

### User Management
- `GET /api/users` - Fetch all users
- `GET /api/users/:id` - Get user details

### Messaging
- `POST /api/messages` - Send a new message
- `GET /api/messages/:chatId` - Fetch chat messages

### Group Chat
- `POST /api/groups` - Create a new group
- `PUT /api/groups/:id` - Update group details
- `DELETE /api/groups/:id` - Delete a group -->

## Notes
- Ensure MongoDB is running before starting the backend.
- If any issue arises, check the logs and restart the server.

<!-- ## License
This project is open-source and available under the [MIT License](LICENSE). -->

## Contact
For any issues or inquiries, feel free to reach out to **Muhammed Savad**.
