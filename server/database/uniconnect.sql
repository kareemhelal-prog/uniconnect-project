-- 1. إنشاء قاعدة البيانات والدخول إليها
CREATE DATABASE IF NOT EXISTS uniconnect;
USE uniconnect;

-- ================= 1. USERS (النواة) =================
CREATE TABLE Users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin', 'investor', 'doctor') NOT NULL,
    phone_number VARCHAR(20),
    profile_picture VARCHAR(255),
    bio TEXT,
    ui_theme ENUM('light', 'dark') DEFAULT 'light',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ================= 2. PROFILES (البيانات المتخصصة) =================
-- بروفايل الدراسة (للطلاب)
CREATE TABLE Profile_Studies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    faculty VARCHAR(100) NOT NULL,
    major VARCHAR(100),
    academic_year ENUM('1', '2', '3', '4'),
    graduation_year YEAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (user_id)
);

-- بروفايل المستثمر
CREATE TABLE Investor_Profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    company_name VARCHAR(100),
    investment_field VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (user_id)
);

-- بروفايل الدكتور
CREATE TABLE Doctor_Profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    faculty VARCHAR(100),
    specialization VARCHAR(100),
    office_location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (user_id)
);

-- ================= 3. CONTENT (المنشورات والمشاريع) =================
-- المنشورات
CREATE TABLE Posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200),
    content TEXT,
    image_url VARCHAR(255),
    post_type ENUM('general', 'academic', 'opportunity') DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (user_id)
);

-- المشاريع
CREATE TABLE Projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('IT', 'Engineering', 'Business', 'Medicine', 'Other') DEFAULT 'IT',
    status ENUM('idea', 'prototype', 'mvp', 'launched') DEFAULT 'idea',
    required_funding DECIMAL(12, 2) DEFAULT 0.00,
    github_link VARCHAR(255),
    demo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (student_id)
);

-- ================= 4. SOCIAL & INTERACTION =================
-- المتابعة
CREATE TABLE Followers (
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (follower_id),
    INDEX (following_id)
);

-- اللايكات
CREATE TABLE Likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES Posts(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (post_id)
);

-- التعليقات
CREATE TABLE Comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    content TEXT NOT NULL,
    parent_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES Posts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES Comments(id) ON DELETE CASCADE,
    INDEX (post_id),
    INDEX (user_id)
);

-- تقييم الدكاترة
CREATE TABLE Academic_Reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id INT NOT NULL,
    student_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (doctor_id, student_id),
    FOREIGN KEY (doctor_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (doctor_id),
    INDEX (student_id)
);

-- ================= 5. GROUPS & COLLABORATION =================
-- المجموعات
CREATE TABLE Groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    creator_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    group_image VARCHAR(255),
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (creator_id)
);

-- أعضاء المجموعات
CREATE TABLE Group_Members (
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('admin', 'member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES Groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (group_id),
    INDEX (user_id)
);

-- ================= 6. COMMUNICATION & ALERTS =================

-- الإشعارات
CREATE TABLE Notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    sender_id INT,
    type ENUM('like', 'comment', 'follow', 'post', 'review', 'mention') NOT NULL,
    reference_id INT,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE SET NULL,
    INDEX (user_id)
);

-- ================= 7. MEDIA & SKILLS =================
-- الملفات
CREATE TABLE Files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uploader_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (uploader_id)
);

-- المهارات
CREATE TABLE Skills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- ربط المهارات بالمستخدمين
CREATE TABLE User_Skills (
    user_id INT NOT NULL,
    skill_id INT NOT NULL,
    PRIMARY KEY (user_id, skill_id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES Skills(id) ON DELETE CASCADE,
    INDEX (user_id)
);

-- ================= 8. EVENTS & MODERATION =================
-- الأحداث
CREATE TABLE Events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    creator_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    event_date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (creator_id)
);

-- البلاغات
CREATE TABLE Reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reporter_id INT NOT NULL,
    reported_type ENUM('user', 'post', 'comment') NOT NULL,
    reported_item_id INT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'resolved', 'dismissed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (reporter_id)
);
