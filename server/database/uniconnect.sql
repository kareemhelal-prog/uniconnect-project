-- ===============================
-- UniConnect — Final Database Schema
-- ===============================

CREATE DATABASE IF NOT EXISTS uniconnect;
USE uniconnect;

-- ===============================
-- 1. USERS
-- ===============================
CREATE TABLE Users (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    username         VARCHAR(50)  UNIQUE NOT NULL,
    name             VARCHAR(100) NOT NULL,
    email            VARCHAR(100) UNIQUE NOT NULL,
    password         VARCHAR(255) NOT NULL,
    role             ENUM('student','admin','investor','doctor') NOT NULL,
    phone_number     VARCHAR(20),
    profile_picture  VARCHAR(255),
    bio              TEXT,
    ui_theme         ENUM('light','dark') DEFAULT 'dark',
    is_active        BOOLEAN DEFAULT TRUE,
    otp_code         VARCHAR(6)   DEFAULT NULL,
    otp_expires_at   DATETIME     DEFAULT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (email),
    INDEX (username)
);

-- ===============================
-- 2. PROFILES
-- ===============================
CREATE TABLE Profile_Studies (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNIQUE NOT NULL,
    faculty         VARCHAR(100) NOT NULL,
    major           VARCHAR(100),
    academic_year   ENUM('1','2','3','4'),
    graduation_year YEAR,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (user_id)
);

CREATE TABLE Doctor_Profiles (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNIQUE NOT NULL,
    faculty         VARCHAR(100),
    specialization  VARCHAR(100),
    office_location VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (user_id)
);

CREATE TABLE Investor_Profiles (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT UNIQUE NOT NULL,
    company_name     VARCHAR(100),
    investment_field VARCHAR(100),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (user_id)
);

-- ===============================
-- 3. SKILLS
-- ===============================
CREATE TABLE Skills (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE User_Skills (
    user_id  INT NOT NULL,
    skill_id INT NOT NULL,
    PRIMARY KEY (user_id, skill_id),
    FOREIGN KEY (user_id)  REFERENCES Users(id)  ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES Skills(id) ON DELETE CASCADE
);

-- ===============================
-- 4. POSTS
-- ===============================
CREATE TABLE Posts (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    title      VARCHAR(200),
    content    TEXT,
    image_url  VARCHAR(255),
    post_type  ENUM('general','academic') DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (user_id)
);

CREATE TABLE Likes (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    post_id    INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES Users(id)  ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES Posts(id)  ON DELETE CASCADE
);

CREATE TABLE Comments (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    post_id    INT NOT NULL,
    content    TEXT NOT NULL,
    parent_id  INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)   REFERENCES Users(id)    ON DELETE CASCADE,
    FOREIGN KEY (post_id)   REFERENCES Posts(id)    ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES Comments(id) ON DELETE CASCADE,
    INDEX (post_id),
    INDEX (user_id),
    INDEX (parent_id)
);

CREATE TABLE Shares (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    post_id    INT NOT NULL,
    user_id    INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_share (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES Posts(id)  ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id)  ON DELETE CASCADE,
    INDEX (post_id),
    INDEX (user_id)
);

-- ===============================
-- 5. FOLLOWERS
-- ===============================
CREATE TABLE Followers (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    follower_id  INT NOT NULL,
    following_id INT NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_follow (follower_id, following_id),
    INDEX (follower_id),
    INDEX (following_id),
    FOREIGN KEY (follower_id)  REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- ===============================
-- 6. GROUPS
-- ===============================
CREATE TABLE `Groups` (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    creator_id    INT NOT NULL,
    name          VARCHAR(100) NOT NULL,
    description   TEXT,
    group_image   VARCHAR(255),
    is_private    BOOLEAN DEFAULT FALSE,
    academic_year ENUM('1','2','3','4') DEFAULT NULL,
    group_type    ENUM('subject','other') DEFAULT 'other',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Group_Members (
    group_id  INT NOT NULL,
    user_id   INT NOT NULL,
    role      ENUM('admin','member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES `Groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES Users(id)    ON DELETE CASCADE
);

CREATE TABLE Group_Posts (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    group_id   INT NOT NULL,
    user_id    INT NOT NULL,
    content    TEXT,
    image      VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `Groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES Users(id)    ON DELETE CASCADE,
    INDEX (group_id),
    INDEX (user_id)
);

CREATE TABLE Group_Post_Likes (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    post_id    INT NOT NULL,
    user_id    INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_group_post_like (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES Group_Posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id)       ON DELETE CASCADE,
    INDEX (post_id),
    INDEX (user_id)
);

CREATE TABLE Group_Post_Comments (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    post_id    INT NOT NULL,
    user_id    INT NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES Group_Posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id)       ON DELETE CASCADE,
    INDEX (post_id),
    INDEX (user_id)
);

-- ===============================
-- 7. PROJECTS
-- ===============================
CREATE TABLE Projects (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    creator_id       INT NOT NULL,
    title            VARCHAR(150) NOT NULL,
    description      TEXT NOT NULL,
    category         ENUM('software','hardware') DEFAULT 'software',
    status           ENUM('idea','prototype','mvp','launched') DEFAULT 'idea',
    required_funding DECIMAL(12,2) DEFAULT 0.00,
    github_link      VARCHAR(255),
    demo_url         VARCHAR(255),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (creator_id)
);

CREATE TABLE Project_Members (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id    INT NOT NULL,
    UNIQUE KEY unique_member (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES Users(id)    ON DELETE CASCADE,
    INDEX (project_id),
    INDEX (user_id)
);

CREATE TABLE Project_Interests (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    project_id  INT NOT NULL,
    investor_id INT NOT NULL,
    note        TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_interest (project_id, investor_id),
    FOREIGN KEY (project_id)  REFERENCES Projects(id) ON DELETE CASCADE,
    FOREIGN KEY (investor_id) REFERENCES Users(id)    ON DELETE CASCADE,
    INDEX (project_id),
    INDEX (investor_id)
);

-- ===============================
-- 8. FILES
-- ===============================
CREATE TABLE Files (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    uploader_id   INT NOT NULL,
    file_name     VARCHAR(255),
    file_url      VARCHAR(255),
    file_type     VARCHAR(50),
    file_size     INT,
    subject       VARCHAR(100) DEFAULT NULL,
    academic_year VARCHAR(10)  DEFAULT NULL,
    description   TEXT         DEFAULT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE File_Likes (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    file_id    INT NOT NULL,
    user_id    INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_file_like (file_id, user_id),
    FOREIGN KEY (file_id) REFERENCES Files(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE File_Comments (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    file_id    INT NOT NULL,
    user_id    INT NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES Files(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (file_id)
);

CREATE TABLE File_Ratings (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    file_id    INT NOT NULL,
    user_id    INT NOT NULL,
    rating     TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_file_rating (file_id, user_id),
    FOREIGN KEY (file_id) REFERENCES Files(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- ===============================
-- 9. COURSES
-- ===============================
CREATE TABLE Courses (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id   INT NOT NULL,
    title       VARCHAR(150) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (doctor_id)
);

CREATE TABLE Course_Enrollments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    course_id   INT NOT NULL,
    student_id  INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_enrollment (course_id, student_id),
    FOREIGN KEY (course_id)  REFERENCES Courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES Users(id)   ON DELETE CASCADE,
    INDEX (course_id),
    INDEX (student_id)
);

-- ===============================
-- 10. REVIEWS
-- ===============================
CREATE TABLE Academic_Reviews (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id    INT NOT NULL,
    student_id   INT NOT NULL,
    rating       TINYINT NOT NULL,
    comment      TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_review (doctor_id, student_id),
    FOREIGN KEY (doctor_id)  REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- ===============================
-- 11. NOTIFICATIONS
-- ===============================
CREATE TABLE Notifications (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    sender_id    INT,
    type         ENUM('like','comment','follow','post','review','mention'),
    reference_id INT,
    message      TEXT,
    is_read      BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)   REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE SET NULL,
    INDEX (user_id)
);

-- ===============================
-- 12. REPORTS
-- ===============================
CREATE TABLE Reports (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id      INT NOT NULL,
    reported_type    ENUM('user','post','comment','file','group'),
    reported_item_id INT NOT NULL,
    reason           ENUM('inappropriate_content','personal_harassment','false_information','other') DEFAULT 'other',
    status           ENUM('pending','resolved','dismissed') DEFAULT 'pending',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- ===============================
-- 13. ADMIN / MODERATION
-- ===============================
CREATE TABLE Announcements (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    admin_id   INT NOT NULL,
    title      VARCHAR(200) NOT NULL,
    content    TEXT NOT NULL,
    target     ENUM('students','doctors','everyone') DEFAULT 'everyone',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Email_Logs (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    admin_id       INT NOT NULL,
    recipient_id   INT DEFAULT NULL,
    recipient_type ENUM('individual','students','doctors','everyone') DEFAULT 'individual',
    subject        VARCHAR(200) NOT NULL,
    message        TEXT NOT NULL,
    type           ENUM('good_news','neutral','warning') DEFAULT 'neutral',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id)     REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES Users(id) ON DELETE SET NULL
);

CREATE TABLE Activity_Logs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    admin_id    INT NOT NULL,
    action_type ENUM('delete','resolve','dismiss','send_email','ban_user') NOT NULL,
    target_id   INT DEFAULT NULL,
    details     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- ===============================
-- 14. EVENTS
-- ===============================
CREATE TABLE Events (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    creator_id  INT NOT NULL,
    title       VARCHAR(150),
    description TEXT,
    location    VARCHAR(255),
    event_date  DATETIME,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- ===============================
-- 15. PASSWORD RESETS
-- ===============================
CREATE TABLE password_resets (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    email      VARCHAR(255) NOT NULL,
    otp        VARCHAR(6)   NOT NULL,
    expires_at DATETIME     NOT NULL,
    is_used    BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email) REFERENCES Users(email) ON DELETE CASCADE
);