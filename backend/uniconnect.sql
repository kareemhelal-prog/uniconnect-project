CREATE DATABASE IF NOT EXISTS uniconnect;
USE uniconnect;

-- ================= USERS =================
CREATE TABLE Users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student','admin','investor','doctor') NOT NULL,

    phone_number VARCHAR(20),
    profile_picture VARCHAR(255),
    bio TEXT,

    ui_theme ENUM('light','dark') DEFAULT 'light',
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ================= PROFILE STUDIES (STUDENT) =================
CREATE TABLE Profile_Studies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,

    faculty VARCHAR(100) NOT NULL,
    major VARCHAR(100),
    academic_year ENUM('1','2','3','4','graduated') NOT NULL,
    graduation_year YEAR,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES Users(id)
        ON DELETE CASCADE
);

-- ================= DOCTOR PROFILE =================
CREATE TABLE Doctor_Profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,

    faculty VARCHAR(100),
    specialization VARCHAR(100),
    office_location VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES Users(id)
        ON DELETE CASCADE
);

-- ================= INVESTOR PROFILE =================
CREATE TABLE Investor_Profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,

    company_name VARCHAR(100),
    investment_field VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES Users(id)
        ON DELETE CASCADE
);

-- ================= POSTS =================
CREATE TABLE Posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,

    title VARCHAR(200),
    content TEXT,
    image_url VARCHAR(255),

    post_type ENUM('general', 'academic', 'opportunity') DEFAULT 'general',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES Users(id)
        ON DELETE CASCADE
);

-- ================= FOLLOWERS =================
CREATE TABLE Followers (
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (follower_id, following_id),

    FOREIGN KEY (follower_id) REFERENCES Users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (following_id) REFERENCES Users(id)
        ON DELETE CASCADE
);

-- ================= LIKES =================
CREATE TABLE Likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    post_id INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, post_id),

    FOREIGN KEY (user_id) REFERENCES Users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (post_id) REFERENCES Posts(id)
        ON DELETE CASCADE
);

-- ================= COMMENTS =================
CREATE TABLE Comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    post_id INT NOT NULL,

    content TEXT NOT NULL,
    parent_id INT DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES Users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (post_id) REFERENCES Posts(id)
        ON DELETE CASCADE,

    FOREIGN KEY (parent_id) REFERENCES Comments(id)
        ON DELETE CASCADE
);

-- ================= PROJECTS =================
CREATE TABLE Projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    creator_id INT NOT NULL,

    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,

    category ENUM('IT', 'Engineering', 'Business', 'Medicine', 'Other') DEFAULT 'IT',
    status ENUM('idea', 'prototype', 'mvp', 'launched') DEFAULT 'idea',

    required_funding DECIMAL(12,2) DEFAULT 0.00,
    github_link VARCHAR(255),
    demo_url VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (creator_id) REFERENCES Users(id)
        ON DELETE CASCADE
);

-- ================= PROJECT MEMBERS =================
CREATE TABLE Project_Members (
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    role_in_project VARCHAR(50) DEFAULT 'Member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (project_id, user_id),

    FOREIGN KEY (project_id) REFERENCES Projects(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id) REFERENCES Users(id)
        ON DELETE CASCADE
);

-- ================= NOTIFICATIONS =================
CREATE TABLE Notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    sender_id INT,

    type ENUM('like', 'comment', 'follow', 'post', 'review', 'mention', 'project_invite') NOT NULL,
    reference_id INT,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES Users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (sender_id) REFERENCES Users(id)
        ON DELETE SET NULL
);

-- ================= ACADEMIC REVIEWS =================
CREATE TABLE Academic_Reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id INT NOT NULL,
    student_id INT NOT NULL,

    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (doctor_id, student_id),

    FOREIGN KEY (doctor_id) REFERENCES Users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (student_id) REFERENCES Users(id)
        ON DELETE CASCADE
);