-- Database Schema for Sri Lankan Scout Performance Management System

-- Users Table (All Roles: Admin, Burger, Scout, Leader, Examiner)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    `role` ENUM('Admin', 'Scout Leader', 'Scout', 'Badge Examiner') NOT NULL,
    contact_number VARCHAR(20),
    nic VARCHAR(20),
    district VARCHAR(100),
    province VARCHAR(100),
    gender ENUM('Male', 'Female', 'Other'),
    profile_image_url VARCHAR(255),
    id_proof_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scout Groups
CREATE TABLE IF NOT EXISTS scout_groups (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    leader_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leader_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Scouts Profile
CREATE TABLE IF NOT EXISTS scouts (
    scout_id INT PRIMARY KEY, -- Linked to users.user_id
    date_of_birth DATE,
    group_id INT,
    rank_level VARCHAR(50) DEFAULT 'Member', -- Member, Patrol Leader, etc.
    profile_image_url VARCHAR(255),
    joined_date DATE,
    FOREIGN KEY (scout_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES scout_groups(group_id) ON DELETE SET NULL
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    date DATETIME NOT NULL,
    location VARCHAR(150),
    `type` ENUM('Camp', 'Hike', 'Service', 'Meeting', 'Other') NOT NULL,
    created_by INT, -- Leader/Admin
    group_id INT, -- If specific to a group, null for district/all
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (group_id) REFERENCES scout_groups(group_id)
);

-- Scout Activity Participation
CREATE TABLE IF NOT EXISTS activity_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    scout_id INT NOT NULL,
    activity_id INT NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    attendance_marked BOOLEAN DEFAULT FALSE,
    observation_notes TEXT,
    evidence_url VARCHAR(255),
    verified_by INT, -- Leader
    verified_at TIMESTAMP,
    FOREIGN KEY (scout_id) REFERENCES users(user_id),
    FOREIGN KEY (activity_id) REFERENCES activities(activity_id),
    FOREIGN KEY (verified_by) REFERENCES users(user_id)
);

-- Badges (Junior, Senior, President's Award specific badges)
CREATE TABLE IF NOT EXISTS badges (
    badge_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    badge_level ENUM('Junior', 'Senior', 'President') NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Badge Requirements (Criteria to earn a badge)
CREATE TABLE IF NOT EXISTS badge_requirements (
    req_id INT AUTO_INCREMENT PRIMARY KEY,
    badge_id INT NOT NULL,
    description TEXT NOT NULL,
    FOREIGN KEY (badge_id) REFERENCES badges(badge_id) ON DELETE CASCADE
);

-- Badge Applications / Progress
CREATE TABLE IF NOT EXISTS scout_badges (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    scout_id INT NOT NULL,
    badge_id INT NOT NULL,
    status ENUM('In Progress', 'Submitted', 'Approved', 'Rejected', 'Awarded') DEFAULT 'In Progress',
    examiner_id INT, -- Assigned Examiner
    applied_date DATETIME,
    approved_date DATETIME,
    feedback TEXT,
    FOREIGN KEY (scout_id) REFERENCES users(user_id),
    FOREIGN KEY (badge_id) REFERENCES badges(badge_id),
    FOREIGN KEY (examiner_id) REFERENCES users(user_id)
);

-- Individual Requirement Completion for Badges
CREATE TABLE IF NOT EXISTS scout_badge_requirements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scout_id INT NOT NULL,
    req_id INT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completion_date DATE,
    FOREIGN KEY (scout_id) REFERENCES users(user_id),
    FOREIGN KEY (req_id) REFERENCES badge_requirements(req_id)
);

-- Awards (President's Award Nominations)
CREATE TABLE IF NOT EXISTS award_nominations (
    nomination_id INT AUTO_INCREMENT PRIMARY KEY,
    scout_id INT NOT NULL,
    award_name VARCHAR(100) NOT NULL, -- e.g. "President's Award"
    status ENUM('Eligible', 'Nominated', 'Approved', 'Rejected', 'Awarded') DEFAULT 'Eligible',
    nominated_by INT, -- Leader
    approved_by INT, -- Admin/Commissioner
    nomination_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    comments TEXT,
    FOREIGN KEY (scout_id) REFERENCES users(user_id),
    FOREIGN KEY (nominated_by) REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
