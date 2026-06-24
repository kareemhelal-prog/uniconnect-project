-- =====================================================
-- UniConnect — Fix Profile Columns
-- Run this in MySQL Workbench or phpMyAdmin
-- =====================================================

USE uniconnect;

-- Fix profile_picture: VARCHAR(255) is too small for base64 images
ALTER TABLE Users
  MODIFY COLUMN profile_picture MEDIUMTEXT;

-- Ensure bio column exists
ALTER TABLE Users
  MODIFY COLUMN bio TEXT;

-- Ensure phone_number exists
ALTER TABLE Users
  MODIFY COLUMN phone_number VARCHAR(20);

-- Ensure Notifications table has sender_id
ALTER TABLE Notifications
  MODIFY COLUMN sender_id INT;

SELECT 'Profile columns fixed successfully!' AS status;
