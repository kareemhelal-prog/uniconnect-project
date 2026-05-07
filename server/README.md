# uniconnect-project
# 🚀 UniConnect - Social Media Backend API

A complete RESTful backend API for a Social Media platform built with **Node.js, Express, MySQL, and JWT Authentication**.

---

## 📌 Features

- 🔐 User Authentication (Register / Login)
- 🧑 Users Management (CRUD)
- 📝 Posts System
- 💬 Comments System
- ❤️ Likes System (Toggle Like/Unlike)
- 👥 Follow System
- 🔔 Notifications System
- 🔑 JWT Authentication Middleware
- 🛡️ Security with Helmet & CORS
- 🗄️ MySQL Database Integration

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- MySQL
- JWT (Authentication)
- bcrypt (Password hashing)
- dotenv
- Helmet
- CORS

---

## 📁 Project Structure
backend/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── postController.js
│   ├── commentController.js
│   ├── likeController.js
│   ├── followController.js
│   └── notificationController.js
│
├── middleware/
│   └── authMiddleware.js
│
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── postRoutes.js
│   ├── commentRoutes.js
│   ├── likeRoutes.js
│   ├── followRoutes.js
│   └── notificationRoutes.js
│
├── server.js
├── .env

---

## ⚙️ Installation

### 1. Clone repository
```bash
git clone https://github.com/your-username/uniconnect.git
cd uniconnect

2. Install dependencies
npm install

3. Create .env file
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=uniconnect
DB_PORT=3306

JWT_SECRET=uniconnect_secret_key
JWT_EXPIRES_IN=7d

4. Run server
npm run dev

Server will run on:
http://localhost:5000

🔐 Authentication
Register
POST /api/auth/register

Login
POST /api/auth/login

🧪 API Endpoints
👤 Users
GET    /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id

📝 Posts
POST   /api/posts
GET    /api/posts
GET    /api/posts/:id
DELETE /api/posts/:

💬 Comments
POST   /api/comments
GET    /api/comments/:postId
DELETE /api/comments/:id

❤️ Likes
POST   /api/likes
GET    /api/likes/:postId

👥 Follow
POST   /api/follow
GET    /api/follow/followers/:userId
GET    /api/follow/following/:userId

🔔 Notifications
GET    /api/notifications
PUT    /api/notifications/:id

🔐 Authentication Header

All protected routes require:

Authorization: Bearer YOUR_TOKEN

🗄️ Database Schema
Users
Posts
Comments
Likes
Followers
Notifications

🚀 Future Improvements
📩 Real-time Chat (Socket.io)
📸 Image Uploads
🔔 Push Notifications
☁️ Deployment (Render / Vercel)