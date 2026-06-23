# 🌐 UniConnect — Academic Social Media Platform

> A full-stack social media platform built specifically for academic communities, connecting students, doctors, and investors in one unified ecosystem.

---

## 📌 Project Overview

UniConnect is a production-ready web application that replicates and extends core social media functionality within a university environment. The platform supports multiple user roles, real-time notifications, academic content management, file sharing, and administrative control — all built with a secure RESTful backend and a modern React frontend.

---

## 🎯 Key Features

### 👤 Authentication & User Management
- Register / Login with JWT Authentication
- OTP Verification via Email
- Forgot Password & Reset Password flow
- Role-Based Access Control (Student / Doctor / Admin / Investor)
- Profile editing with academic information

### 📝 Social Feed
- Create, view, and delete Posts
- Comments System (nested discussions)
- Likes / Unlike toggle
- Post sharing
- Search Results across users and content

### 👥 Groups & Communities
- Create and manage Groups
- Group membership management
- Group Posts with Likes and Comments
- Groups Management panel (Admin)

### 📁 File Sharing
- Upload and share academic files
- File Likes, Comments & Ratings
- Files browser with filtering

### 🎓 Academic Features
- Courses & Course Enrollments
- Academic Reviews system
- Doctor Profiles with dedicated dashboard
- Investor Portal

### 🔔 Notifications & Communication
- Real-time Notifications system
- Email Alerts (automated email notifications)
- Announcements board
- Activity Logs tracking

### 🛠️ Admin Dashboard
- User Management (view, suspend, delete)
- Posts Management
- Reports Management (content moderation)
- Reviews Management
- Groups Management
- Email Alerts Management

### 🤝 Social Graph
- Follow / Unfollow system
- Followers & Following lists
- Relations page

### 📊 Projects
- Create and manage academic Projects
- Project Members & Project Interests
- Projects browsing and management

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI Framework & Build Tool |
| React Router DOM | Client-side Routing |
| Axios | HTTP Client |
| CSS Modules | Component Styling |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | Server & REST API |
| MySQL2 | Relational Database |
| JWT (jsonwebtoken) | Authentication |
| bcrypt | Password Hashing |
| Multer | File Uploads |
| Nodemailer | Email Service |
| Helmet + CORS | Security Middleware |

---

## 🗄️ Database Schema

The database contains **33 tables** covering the full domain model:

```
Users                  → Core user accounts
Profile_Studies        → Academic profile data
Doctor_Profiles        → Doctor-specific profiles
Investor_Profiles      → Investor-specific profiles
Skills / User_Skills   → Skills tagging system
Posts / Likes / Comments / Shares → Social feed
Followers              → Social graph
Groups / Group_Members / Group_Posts → Community system
Group_Post_Likes / Group_Post_Comments
Projects / Project_Members / Project_Interests
Files / File_Likes / File_Comments / File_Ratings
Courses / Course_Enrollments
Academic_Reviews
Notifications
Reports
Announcements
Activity_Logs
Email_Logs
Events
password_resets
```

---

## 📁 Project Structure

```
uniconnect/
│
├── client/                        # React Frontend
│   ├── public/
│   └── src/
│       ├── api/
│       │   └── axios.js           # Axios base config
│       ├── components/            # Reusable UI components
│       │   ├── Navbar
│       │   ├── Sidebar
│       │   ├── LeftSidebar
│       │   ├── RightSidebar
│       │   └── PostCard
│       └── pages/                 # 39 application pages
│           ├── Auth: Login, Register, OtpVerification
│           │         ForgotPassword, ResetPassword
│           ├── Feed: Home, HomeDoctor, PostDetails
│           ├── Profile: ProfilePage, ProfileEdit, DoctorProfile
│           ├── Groups: GroupsList, GroupDetails, CreateGroup
│           │           MyGroups, GroupsManagement
│           ├── Projects: ProjectsPage, ProjectsManagement
│           ├── Files: Files
│           ├── Courses: (via routing)
│           ├── Admin: Dashboard, UserManagement, postsManagement
│           │          ReportsManagement, ReviewsManagement
│           ├── Social: Relations, SearchResults, Notifications
│           ├── Communication: Announcements, EmailAlerts
│           ├── Academic: AcademicReviewsPage, ActivityLogs
│           └── Other: InvestorPortal, OwnersPage, NotFound
│
└── server/                        # Node.js Backend
    ├── config/
    │   └── db.js                  # MySQL connection pool
    ├── controllers/               # 19 controllers
    │   ├── authController.js
    │   ├── authProfileController.js
    │   ├── userController.js
    │   ├── postController.js
    │   ├── commentController.js
    │   ├── likeController.js
    │   ├── followController.js
    │   ├── groupController.js
    │   ├── groupPostController.js
    │   ├── fileController.js
    │   ├── projectController.js
    │   ├── courseController.js
    │   ├── reviewController.js
    │   ├── reportController.js
    │   ├── notificationController.js
    │   ├── activityLogController.js
    │   ├── adminController.js
    │   ├── emailController.js
    │   └── profileController.js
    ├── middleware/
    │   ├── authMiddleware.js      # JWT verification
    │   ├── adminMiddleware.js     # Admin role guard
    │   └── rolemiddleware.js      # Role-based guard
    ├── routes/                    # 16 route files
    ├── database/
    │   └── uniconnect.sql         # Full DB schema
    ├── uploads/                   # File storage
    ├── utils/
    │   └── validation.js
    └── server.js                  # Entry point
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js v18+
- MySQL 8+
- npm

### 1. Clone the repository
```bash
git clone https://github.com/your-username/uniconnect.git
cd uniconnect
```

### 2. Setup the Database
```bash
# Create database and import schema
mysql -u root -p
CREATE DATABASE uniconnect;
exit;
mysql -u root -p uniconnect < server/database/uniconnect.sql
```

### 3. Setup Backend
```bash
cd server
npm install
```

Create `.env` file:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=uniconnect
DB_PORT=3306

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

PORT=5000
```

```bash
npm run dev
```

### 4. Setup Frontend
```bash
cd client
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## 🔐 API Overview

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-otp
```

### Posts
```
GET    /api/posts
POST   /api/posts
DELETE /api/posts/:id
```

### Comments
```
GET    /api/comments/:postId
POST   /api/comments
DELETE /api/comments/:id
```

### Groups
```
GET    /api/groups
POST   /api/groups
GET    /api/groups/:id
POST   /api/groups/:id/join
```

### Files
```
GET    /api/files
POST   /api/files          (multipart/form-data)
DELETE /api/files/:id
```

### Admin
```
GET    /api/admin/users
DELETE /api/admin/users/:id
GET    /api/admin/reports
PUT    /api/admin/reports/:id
```

> All protected routes require:
> ```
> Authorization: Bearer <token>
> ```

---

## 🔒 Security

- Passwords hashed with **bcrypt** (salt rounds: 10)
- **JWT** tokens with expiry
- **Helmet.js** for HTTP security headers
- **CORS** configured for frontend origin
- Role-based middleware guards on all admin/doctor routes
- Input validation on all auth endpoints

---

## 👨‍💻 Development Team

| Name | Role |
|---|---|
| Alaa Samir | Lead Developer — Backend, Frontend, Database Design |

---

## 📄 License

This project was developed as an academic graduation project.

---

*UniConnect — Connecting academic communities, one post at a time.*
