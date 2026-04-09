-- =========================================================
-- SRI LANKA SCOUT PERFORMANCE MANAGEMENT SYSTEM
-- FINAL COMPLETE DATABASE SQL
-- MySQL 8+
-- =========================================================

DROP DATABASE IF EXISTS scout_performance_management_system;
CREATE DATABASE scout_performance_management_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE scout_performance_management_system;

SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- =========================================================
-- 1) ROLES
-- =========================================================
CREATE TABLE roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_name ENUM('SCOUT','LEADER','EXAMINER','ADMIN') NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO roles (role_name) VALUES
('SCOUT'),
('LEADER'),
('EXAMINER'),
('ADMIN');

-- =========================================================
-- 2) USERS
-- NOTE:
-- password_hash currently stores plain dev passwords for easy testing.
-- In real system replace with bcrypt hashes.
-- =========================================================
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    username VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT UNSIGNED NOT NULL,
    status ENUM('PENDING','ACTIVE','SUSPENDED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================================================
-- 3) SCOUT GROUPS
-- =========================================================
CREATE TABLE scout_groups (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO scout_groups (group_name, district, province) VALUES
('Kelaniya Scout Group', 'Gampaha', 'Western Province'),
('Negombo Scout Group', 'Gampaha', 'Western Province'),
('Wattala Scout Group', 'Gampaha', 'Western Province'),
('Colombo Central Scouts', 'Colombo', 'Western Province'),
('Kandy Hills Scouts', 'Kandy', 'Central Province'),
('Galle Coastal Scouts', 'Galle', 'Southern Province'),
('Jaffna North Scouts', 'Jaffna', 'Northern Province'),
('Anuradhapura Scouts', 'Anuradhapura', 'North Central Province');

-- =========================================================
-- 4) FILES
-- =========================================================
CREATE TABLE files (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_user_id INT UNSIGNED NOT NULL,
    file_type ENUM(
        'PROFILE_PHOTO',
        'ID_PROOF',
        'ACTIVITY_PROOF',
        'BADGE_EVIDENCE',
        'REPORT',
        'CERTIFICATE'
    ) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_files_owner
        FOREIGN KEY (owner_user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 5) ROLE PROFILE TABLES
-- =========================================================
CREATE TABLE scouts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    scout_code VARCHAR(30) NOT NULL UNIQUE,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    scout_group_id INT UNSIGNED NOT NULL,
    district VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    gender ENUM('MALE','FEMALE','OTHER') NOT NULL,
    contact_number VARCHAR(30) NOT NULL,
    nic_or_school_id VARCHAR(50) NOT NULL,
    profile_photo_file_id INT UNSIGNED NULL,
    id_proof_file_id INT UNSIGNED NULL,
    verified_by_leader_user_id INT UNSIGNED NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_scout_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_scout_group
        FOREIGN KEY (scout_group_id) REFERENCES scout_groups(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_scout_photo
        FOREIGN KEY (profile_photo_file_id) REFERENCES files(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_scout_idproof
        FOREIGN KEY (id_proof_file_id) REFERENCES files(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_scout_verified_by
        FOREIGN KEY (verified_by_leader_user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE scout_leaders (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    leader_code VARCHAR(30) NOT NULL UNIQUE,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    scout_group_id INT UNSIGNED NOT NULL,
    contact_number VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leader_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_leader_group
        FOREIGN KEY (scout_group_id) REFERENCES scout_groups(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE badge_examiners (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    examiner_code VARCHAR(30) NOT NULL UNIQUE,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    district VARCHAR(100) NOT NULL,
    specialty VARCHAR(150) NULL,
    contact_number VARCHAR(30) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_examiner_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_code VARCHAR(30) NOT NULL UNIQUE,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    admin_level ENUM('SUPER','STANDARD') NOT NULL DEFAULT 'STANDARD',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 6) ACTIVITIES
-- =========================================================
CREATE TABLE activities (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    activity_code VARCHAR(30) NOT NULL UNIQUE,
    activity_name VARCHAR(180) NOT NULL,
    activity_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NULL,
    location VARCHAR(180) NOT NULL,
    category ENUM('CAMPING','SERVICE','TRAINING','HIKING','ENVIRONMENT','ADVENTURE','OTHER') NOT NULL DEFAULT 'OTHER',
    image_path VARCHAR(255) NULL,
    created_by_admin_user_id INT UNSIGNED NULL,
    status ENUM('UPCOMING','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'UPCOMING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_admin
        FOREIGN KEY (created_by_admin_user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE activity_registrations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    scout_id INT UNSIGNED NOT NULL,
    activity_id INT UNSIGNED NOT NULL,
    registration_status ENUM('REGISTERED','CANCELLED','ATTENDED') NOT NULL DEFAULT 'REGISTERED',
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_activity_registration (scout_id, activity_id),
    CONSTRAINT fk_reg_scout
        FOREIGN KEY (scout_id) REFERENCES scouts(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_reg_activity
        FOREIGN KEY (activity_id) REFERENCES activities(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE activity_tracking (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    scout_id INT UNSIGNED NOT NULL,
    activity_id INT UNSIGNED NOT NULL,
    observed_by_name VARCHAR(120) NOT NULL,
    hours_spent DECIMAL(5,2) NOT NULL DEFAULT 0,
    activity_status ENUM('COMPLETED','PENDING') NOT NULL,
    action_status ENUM('VERIFIED','SUBMIT_PROOF') NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tracking_scout
        FOREIGN KEY (scout_id) REFERENCES scouts(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_tracking_activity
        FOREIGN KEY (activity_id) REFERENCES activities(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE activity_proof_submissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tracking_id INT UNSIGNED NOT NULL,
    file_id INT UNSIGNED NULL,
    additional_comments TEXT NULL,
    submission_status ENUM('SUBMITTED','APPROVED','REJECTED','PENDING_REVIEW') NOT NULL DEFAULT 'PENDING_REVIEW',
    reviewed_by_leader_user_id INT UNSIGNED NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_proof_tracking
        FOREIGN KEY (tracking_id) REFERENCES activity_tracking(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_proof_file
        FOREIGN KEY (file_id) REFERENCES files(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_proof_leader
        FOREIGN KEY (reviewed_by_leader_user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- Leader approval items
CREATE TABLE leader_activity_approvals (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    leader_user_id INT UNSIGNED NOT NULL,
    scout_id INT UNSIGNED NOT NULL,
    activity_id INT UNSIGNED NOT NULL,
    proof_submission_id INT UNSIGNED NULL,
    approval_status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    leader_comment TEXT NULL,
    decided_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leader_approval_leader
        FOREIGN KEY (leader_user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_leader_approval_scout
        FOREIGN KEY (scout_id) REFERENCES scouts(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_leader_approval_activity
        FOREIGN KEY (activity_id) REFERENCES activities(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_leader_approval_proof
        FOREIGN KEY (proof_submission_id) REFERENCES activity_proof_submissions(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- 7) BADGES
-- =========================================================
CREATE TABLE badges (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    badge_code VARCHAR(40) NOT NULL UNIQUE,
    badge_name VARCHAR(150) NOT NULL,
    level_name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    icon_name VARCHAR(100) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE badge_requirements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    badge_id INT UNSIGNED NOT NULL,
    requirement_title VARCHAR(200) NOT NULL,
    requirement_description TEXT NULL,
    weight INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_badge_req_badge
        FOREIGN KEY (badge_id) REFERENCES badges(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE scout_badge_progress (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    scout_id INT UNSIGNED NOT NULL,
    badge_id INT UNSIGNED NOT NULL,
    progress_type ENUM('COMPLETED','PENDING','ELIGIBLE') NOT NULL,
    completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    requirements_met INT NOT NULL DEFAULT 0,
    total_requirements INT NOT NULL DEFAULT 0,
    achieved_date DATE NULL,
    remarks VARCHAR(255) NULL,
    CONSTRAINT fk_scout_badge_progress_scout
        FOREIGN KEY (scout_id) REFERENCES scouts(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_scout_badge_progress_badge
        FOREIGN KEY (badge_id) REFERENCES badges(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE badge_submissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    scout_id INT UNSIGNED NOT NULL,
    badge_id INT UNSIGNED NOT NULL,
    completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    evidence_summary VARCHAR(255) NULL,
    status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    reviewed_by_examiner_user_id INT UNSIGNED NULL,
    reviewed_at TIMESTAMP NULL,
    examiner_comment TEXT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_badge_submission_scout
        FOREIGN KEY (scout_id) REFERENCES scouts(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_badge_submission_badge
        FOREIGN KEY (badge_id) REFERENCES badges(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_badge_submission_examiner
        FOREIGN KEY (reviewed_by_examiner_user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE badge_submission_files (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    badge_submission_id INT UNSIGNED NOT NULL,
    file_id INT UNSIGNED NOT NULL,
    CONSTRAINT fk_badge_submission_file_submission
        FOREIGN KEY (badge_submission_id) REFERENCES badge_submissions(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_badge_submission_file_file
        FOREIGN KEY (file_id) REFERENCES files(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 8) AWARDS / ELIGIBILITY
-- =========================================================
CREATE TABLE awards (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    award_code VARCHAR(50) NOT NULL UNIQUE,
    award_name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE scout_award_progress (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    scout_id INT UNSIGNED NOT NULL,
    award_id INT UNSIGNED NOT NULL,
    overall_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    status ENUM('IN_PROGRESS','UNDER_REVIEW','ELIGIBLE','ACHIEVED') NOT NULL DEFAULT 'IN_PROGRESS',
    quote_text VARCHAR(255) NULL,
    final_review_status ENUM('PENDING','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_award_progress_scout
        FOREIGN KEY (scout_id) REFERENCES scouts(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_award_progress_award
        FOREIGN KEY (award_id) REFERENCES awards(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE award_requirement_checklist (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    scout_award_progress_id INT UNSIGNED NOT NULL,
    requirement_name VARCHAR(150) NOT NULL,
    status ENUM('COMPLETED','IN_PROGRESS','PENDING') NOT NULL,
    display_order INT NOT NULL,
    CONSTRAINT fk_award_checklist_progress
        FOREIGN KEY (scout_award_progress_id) REFERENCES scout_award_progress(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE award_progress_breakdown (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    scout_award_progress_id INT UNSIGNED NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    current_value INT NOT NULL,
    target_value INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    display_order INT NOT NULL,
    CONSTRAINT fk_award_breakdown_progress
        FOREIGN KEY (scout_award_progress_id) REFERENCES scout_award_progress(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 9) SERVICE HOURS
-- =========================================================
CREATE TABLE service_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    scout_id INT UNSIGNED NOT NULL,
    service_date DATE NOT NULL,
    hours DECIMAL(5,2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    status ENUM('SUBMITTED','APPROVED','REJECTED') NOT NULL DEFAULT 'SUBMITTED',
    approved_by_leader_user_id INT UNSIGNED NULL,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_log_scout
        FOREIGN KEY (scout_id) REFERENCES scouts(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_service_log_leader
        FOREIGN KEY (approved_by_leader_user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- 10) REPORTS
-- =========================================================
CREATE TABLE reports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    report_code VARCHAR(40) NOT NULL UNIQUE,
    report_title VARCHAR(180) NOT NULL,
    report_type ENUM('MONTHLY_PROGRESS','BADGE_ACHIEVEMENT','ATTENDANCE','CUSTOM') NOT NULL,
    report_period_label VARCHAR(120) NOT NULL,
    report_description VARCHAR(255) NULL,
    file_id INT UNSIGNED NULL,
    created_by_user_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_file
        FOREIGN KEY (file_id) REFERENCES files(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_report_user
        FOREIGN KEY (created_by_user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 11) NOTIFICATIONS
-- =========================================================
CREATE TABLE notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('UNREAD','READ') NOT NULL DEFAULT 'UNREAD',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 12) SYSTEM SETTINGS / HEALTH SNAPSHOT
-- =========================================================
CREATE TABLE system_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO system_settings (setting_key, setting_value) VALUES
('database_status', 'Online'),
('api_services_status', 'Running'),
('storage_usage', '78% Used');

-- =========================================================
-- 13) USERS SEED
-- =========================================================
INSERT INTO users (full_name, email, username, password_hash, role_id, status) VALUES
('Shera Saathviza Rajkumar', 'sherasaathvizarajkumar@gmail.com', 'sherasaathviza', 'Scout@123', 1, 'ACTIVE'),
('Kavindu Perera', 'kavindu.leader@slscouts.lk', 'perera', 'Leader@123', 2, 'ACTIVE'),
('Mary Fernando', 'mary.examiner@slscouts.lk', 'mary_examiner', 'Examiner@123', 3, 'ACTIVE'),
('System Admin', 'admin@slscouts.lk', 'admin', 'Admin@123', 4, 'ACTIVE'),

('Anushka Silva', 'anushka.silva@scouts.lk', 'anushka_silva', 'Scout123', 1, 'ACTIVE'),
('Nimali Fernando', 'nimali.fernando@scouts.lk', 'nimali_fernando', 'Scout123', 1, 'ACTIVE'),
('Rohan Jayawardena', 'rohan.jayawardena@scouts.lk', 'rohan_j', 'Scout123', 1, 'ACTIVE'),
('Tharindu Perera', 'tharindu.perera@scouts.lk', 'tharindu_perera', 'Scout123', 1, 'ACTIVE'),
('Sarah Perera', 'sarah.leader@slscouts.lk', 'sarah_perera', 'Leader123', 2, 'ACTIVE');

-- =========================================================
-- 14) ROLE PROFILES SEED
-- =========================================================
INSERT INTO scout_leaders (leader_code, user_id, scout_group_id, contact_number) VALUES
('LD2024001', (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'), 4, '0771112223'),
('LD2024002', (SELECT id FROM users WHERE email='sarah.leader@slscouts.lk'), 5, '0775558888');

INSERT INTO badge_examiners (examiner_code, user_id, district, specialty, contact_number) VALUES
('EX2024001', (SELECT id FROM users WHERE email='mary.examiner@slscouts.lk'), 'Colombo', 'Advanced Badge Review', '0773334445');

INSERT INTO admins (admin_code, user_id, admin_level) VALUES
('AD2024001', (SELECT id FROM users WHERE email='admin@slscouts.lk'), 'SUPER');

INSERT INTO scouts (
    scout_code, user_id, scout_group_id, district, province, dob, gender,
    contact_number, nic_or_school_id, verified_by_leader_user_id, verified_at
) VALUES
('SL2024001', (SELECT id FROM users WHERE email='sherasaathvizarajkumar@gmail.com'), 4, 'Gampaha', 'Western Province', '2008-01-15', 'FEMALE', '+94 77 123 4567', 'SCH2024001', (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'), NOW()),
('SL2024002', (SELECT id FROM users WHERE email='anushka.silva@scouts.lk'), 4, 'Colombo', 'Western Province', '2008-03-10', 'FEMALE', '+94 77 555 1111', 'SCH2024002', (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'), NOW()),
('SL2024003', (SELECT id FROM users WHERE email='nimali.fernando@scouts.lk'), 6, 'Galle', 'Southern Province', '2007-11-21', 'FEMALE', '+94 77 444 2222', 'SCH2024003', (SELECT id FROM users WHERE email='sarah.leader@slscouts.lk'), NOW()),
('SL2024004', (SELECT id FROM users WHERE email='rohan.jayawardena@scouts.lk'), 7, 'Jaffna', 'Northern Province', '2008-06-18', 'MALE', '+94 77 777 3333', 'SCH2024004', (SELECT id FROM users WHERE email='sarah.leader@slscouts.lk'), NOW()),
('SL2024005', (SELECT id FROM users WHERE email='tharindu.perera@scouts.lk'), 8, 'Anuradhapura', 'North Central Province', '2007-09-05', 'MALE', '+94 77 666 4444', 'SCH2024005', (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'), NOW());

-- =========================================================
-- 15) ACTIVITIES SEED
-- =========================================================
INSERT INTO activities (
    activity_code, activity_name, activity_date, start_time, end_time,
    location, category, image_path, created_by_admin_user_id, status
) VALUES
('ACT001', 'Wilderness Survival Camp', '2026-04-16', '08:00:00', '17:00:00', 'Sinharaja Forest Reserve', 'CAMPING', '/images/activities/camping.png', (SELECT id FROM users WHERE email='admin@slscouts.lk'), 'UPCOMING'),
('ACT002', 'First Aid Workshop', '2026-03-28', '14:00:00', '16:00:00', 'Colombo Scout Hall', 'TRAINING', '/images/activities/training.png', (SELECT id FROM users WHERE email='admin@slscouts.lk'), 'UPCOMING'),
('ACT003', 'Community Clean-Up Drive', '2026-04-18', '07:00:00', '10:00:00', 'Galle Beach', 'SERVICE', '/images/activities/service.png', (SELECT id FROM users WHERE email='admin@slscouts.lk'), 'UPCOMING'),
('ACT004', 'Badge Preparation Class', '2026-04-20', '16:00:00', '18:00:00', 'Kandy Regional Office', 'TRAINING', '/images/activities/training.png', (SELECT id FROM users WHERE email='admin@slscouts.lk'), 'UPCOMING'),
('ACT005', 'Mountain Hiking Expedition', '2026-04-07', '05:00:00', '13:00:00', 'Adams Peak', 'ADVENTURE', '/images/activities/adventure.png', (SELECT id FROM users WHERE email='admin@slscouts.lk'), 'UPCOMING'),
('ACT006', 'Environmental Awareness Program', '2026-04-11', '10:00:00', '12:00:00', 'Yala National Park', 'SERVICE', '/images/activities/environment.png', (SELECT id FROM users WHERE email='admin@slscouts.lk'), 'UPCOMING'),
('ACT007', 'Navigation Skills Camp', '2026-05-02', '09:00:00', '13:00:00', 'Minneriya Grounds', 'CAMPING', '/images/activities/hiking.png', (SELECT id FROM users WHERE email='admin@slscouts.lk'), 'UPCOMING'),

('ACT008', 'Tree Planting Campaign', '2026-1-14', '08:00:00', '11:00:00', 'Kelaniya Grounds', 'ENVIRONMENT', '/images/activities/environment.png', (SELECT id FROM users WHERE email='admin@slscouts.lk'), 'COMPLETED'),
('ACT009', 'First Aid Training', '2026-02-12', '09:00:00', '12:00:00', 'Scout Medical Hall', 'TRAINING', '/images/activities/training.png', (SELECT id FROM users WHERE email='admin@slscouts.lk'), 'COMPLETED'),
('ACT010', 'Community Service', '2026-03-07', '08:30:00', '11:30:00', 'Community Center', 'SERVICE', '/images/activities/service.png', (SELECT id FROM users WHERE email='admin@slscouts.lk'), 'IN_PROGRESS'),
('ACT011', 'Camping Workshop', '2026-02-05', '10:00:00', '13:00:00', 'Camp Site A', 'CAMPING', '/images/activities/camping.png', (SELECT id FROM users WHERE email='admin@slscouts.lk'), 'COMPLETED'),
('ACT012', 'Navigation Training', '2026-03-08', '07:30:00', '10:30:00', 'Scout Field Area', 'TRAINING', '/images/activities/hiking.png', (SELECT id FROM users WHERE email='admin@slscouts.lk'), 'IN_PROGRESS');

-- =========================================================
-- 16) SCOUT REGISTRATIONS
-- =========================================================
SET @shera_scout_id := (SELECT id FROM scouts WHERE scout_code='SL2024001');
SET @anushka_scout_id := (SELECT id FROM scouts WHERE scout_code='SL2024002');
SET @nimali_scout_id := (SELECT id FROM scouts WHERE scout_code='SL2024003');
SET @rohan_scout_id := (SELECT id FROM scouts WHERE scout_code='SL2024004');
SET @tharindu_scout_id := (SELECT id FROM scouts WHERE scout_code='SL2024005');

INSERT INTO activity_registrations (scout_id, activity_id, registration_status)
SELECT @shera_scout_id, id, 'REGISTERED'
FROM activities
WHERE activity_code IN ('ACT001','ACT002','ACT003','ACT004','ACT005','ACT006');

INSERT INTO activity_registrations (scout_id, activity_id, registration_status) VALUES
(@anushka_scout_id, (SELECT id FROM activities WHERE activity_code='ACT003'), 'ATTENDED'),
(@anushka_scout_id, (SELECT id FROM activities WHERE activity_code='ACT008'), 'ATTENDED'),
(@nimali_scout_id, (SELECT id FROM activities WHERE activity_code='ACT009'), 'ATTENDED'),
(@rohan_scout_id, (SELECT id FROM activities WHERE activity_code='ACT012'), 'REGISTERED'),
(@tharindu_scout_id, (SELECT id FROM activities WHERE activity_code='ACT011'), 'ATTENDED');

-- =========================================================
-- 17) SCOUT ACTIVITY TRACKING
-- Shera gets 18 completed + 2 pending to match UI style.
-- =========================================================
INSERT INTO activity_tracking (scout_id, activity_id, observed_by_name, hours_spent, activity_status, action_status, notes) VALUES
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT008'), 'Leader John Silva', 4, 'COMPLETED', 'VERIFIED', 'Completed successfully'),
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT009'), 'Examiner Mary Fernando', 3, 'COMPLETED', 'VERIFIED', 'Completed successfully'),
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT010'), 'Leader John Silva', 4, 'PENDING', 'SUBMIT_PROOF', 'Need proof upload'),
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT011'), 'Leader Sarah Perera', 3, 'COMPLETED', 'VERIFIED', 'Completed successfully'),
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT012'), 'Leader John Silva', 5, 'PENDING', 'SUBMIT_PROOF', 'Need proof upload');

-- extra completed rows to reach 18 total completed
INSERT INTO activity_tracking (scout_id, activity_id, observed_by_name, hours_spent, activity_status, action_status, notes) VALUES
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT001'), 'Leader Kavindu Perera', 6, 'COMPLETED', 'VERIFIED', 'Completed'),
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT002'), 'Leader Kavindu Perera', 4, 'COMPLETED', 'VERIFIED', 'Completed'),
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT003'), 'Leader Kavindu Perera', 5, 'COMPLETED', 'VERIFIED', 'Completed'),
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT004'), 'Leader Kavindu Perera', 2, 'COMPLETED', 'VERIFIED', 'Completed'),
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT005'), 'Leader Kavindu Perera', 8, 'COMPLETED', 'VERIFIED', 'Completed'),
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT006'), 'Leader Kavindu Perera', 3, 'COMPLETED', 'VERIFIED', 'Completed'),
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT007'), 'Leader Kavindu Perera', 4, 'COMPLETED', 'VERIFIED', 'Completed'),
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT008'), 'Leader John Silva', 3, 'COMPLETED', 'VERIFIED', 'Additional session'),
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT009'), 'Leader John Silva', 2, 'COMPLETED', 'VERIFIED', 'Additional session'),
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT011'), 'Leader Sarah Perera', 5, 'COMPLETED', 'VERIFIED', 'Additional session'),
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT001'), 'Leader Sarah Perera', 6, 'COMPLETED', 'VERIFIED', 'Field participation'),
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT002'), 'Leader Sarah Perera', 4, 'COMPLETED', 'VERIFIED', 'Workshop participation'),
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT003'), 'Leader Sarah Perera', 4, 'COMPLETED', 'VERIFIED', 'Service participation'),
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT004'), 'Leader Sarah Perera', 3, 'COMPLETED', 'VERIFIED', 'Badge prep participation'),
(@shera_scout_id, (SELECT id FROM activities WHERE activity_code='ACT005'), 'Leader Sarah Perera', 7, 'COMPLETED', 'VERIFIED', 'Hiking participation');

-- =========================================================
-- 18) PROOF SUBMISSIONS
-- =========================================================
INSERT INTO activity_proof_submissions (tracking_id, additional_comments, submission_status, reviewed_by_leader_user_id, reviewed_at)
VALUES
(
    (SELECT id FROM activity_tracking WHERE scout_id=@shera_scout_id AND activity_id=(SELECT id FROM activities WHERE activity_code='ACT008') LIMIT 1),
    'Uploaded photos and participation sheet',
    'APPROVED',
    (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'),
    NOW()
),
(
    (SELECT id FROM activity_tracking WHERE scout_id=@shera_scout_id AND activity_id=(SELECT id FROM activities WHERE activity_code='ACT009') LIMIT 1),
    'Uploaded certificate',
    'APPROVED',
    (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'),
    NOW()
),
(
    (SELECT id FROM activity_tracking WHERE scout_id=@shera_scout_id AND activity_id=(SELECT id FROM activities WHERE activity_code='ACT010') LIMIT 1),
    'Pending additional photos',
    'PENDING_REVIEW',
    NULL,
    NULL
),
(
    (SELECT id FROM activity_tracking WHERE scout_id=@shera_scout_id AND activity_id=(SELECT id FROM activities WHERE activity_code='ACT012') LIMIT 1),
    'Compass exercise images to be added',
    'PENDING_REVIEW',
    NULL,
    NULL
);

-- =========================================================
-- 19) LEADER APPROVAL ITEMS
-- =========================================================
INSERT INTO leader_activity_approvals (
    leader_user_id, scout_id, activity_id, proof_submission_id, approval_status, leader_comment, decided_at
) VALUES
(
    (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'),
    @anushka_scout_id,
    (SELECT id FROM activities WHERE activity_code='ACT003'),
    NULL,
    'PENDING',
    NULL,
    NULL
),
(
    (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'),
    @anushka_scout_id,
    (SELECT id FROM activities WHERE activity_code='ACT008'),
    NULL,
    'PENDING',
    NULL,
    NULL
),
(
    (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'),
    @nimali_scout_id,
    (SELECT id FROM activities WHERE activity_code='ACT009'),
    NULL,
    'PENDING',
    NULL,
    NULL
),
(
    (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'),
    @rohan_scout_id,
    (SELECT id FROM activities WHERE activity_code='ACT012'),
    NULL,
    'PENDING',
    NULL,
    NULL
),
(
    (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'),
    @tharindu_scout_id,
    (SELECT id FROM activities WHERE activity_code='ACT011'),
    NULL,
    'PENDING',
    NULL,
    NULL
);

-- =========================================================
-- 20) BADGES MASTER
-- 14 completed-style badges for Shera profile count
-- =========================================================
INSERT INTO badges (badge_code, badge_name, level_name, description, icon_name) VALUES
('FIRST_AID', 'First Aid', 'Advanced', 'First aid competency badge', 'first-aid'),
('CAMPING', 'Camping', 'Expert', 'Camping expert badge', 'camping'),
('NAVIGATION', 'Navigation', 'Intermediate', 'Navigation skills badge', 'navigation'),
('ENV_CONSERVATION', 'Environmental Conservation', 'Advanced', 'Environmental conservation badge', 'environment'),
('LEADERSHIP', 'Leadership', 'Advanced', 'Leadership development badge', 'leadership'),
('COMMUNITY_SERVICE', 'Community Service', 'Intermediate', 'Service participation badge', 'service'),
('HIKING', 'Hiking', 'Intermediate', 'Hiking participation badge', 'hiking'),
('CITIZENSHIP', 'Citizenship', 'Intermediate', 'Citizenship awareness badge', 'citizenship'),
('CAMP_CRAFT', 'Camp Craft', 'Advanced', 'Camp craft badge', 'camp-craft'),
('PIONEERING', 'Pioneering', 'Intermediate', 'Pioneering skills badge', 'pioneering'),
('COMMUNICATION', 'Communication', 'Intermediate', 'Communication badge', 'communication'),
('TEAMWORK', 'Teamwork', 'Intermediate', 'Teamwork badge', 'teamwork'),
('SCOUT_SPIRIT', 'Scout Spirit', 'Advanced', 'Scout spirit badge', 'spirit'),
('SERVICE_EXCELLENCE', 'Service Excellence', 'Advanced', 'Service excellence badge', 'service-excellence'),
('CHIEF_CC', 'Chief Commissioner''s Award', 'Award', 'Chief Commissioner award track', 'chief-commissioner'),
('PRESIDENT_SCOUT', 'President''s Scout Award', 'Award', 'President award track', 'president');

-- 7 requirements for Leadership
INSERT INTO badge_requirements (badge_id, requirement_title, requirement_description, weight)
SELECT
    (SELECT id FROM badges WHERE badge_code='LEADERSHIP'),
    CONCAT('Leadership Requirement ', n),
    CONCAT('Complete leadership task ', n),
    1
FROM (
    SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
    UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
) t;

-- =========================================================
-- 21) SHERA BADGE PROGRESS
-- 14 completed badges + pending + eligible
-- =========================================================
-- Ensure all 16 badges exist
INSERT IGNORE INTO badges (badge_code, badge_name, level_name, description, icon_name, is_active) VALUES
('FIRST_AID', 'First Aid', 'Advanced', 'First aid competency badge', 'first-aid', TRUE),
('CAMPING', 'Camping', 'Expert', 'Camping expert badge', 'camping', TRUE),
('NAVIGATION', 'Navigation', 'Intermediate', 'Navigation skills badge', 'navigation', TRUE),
('ENV_CONSERVATION', 'Environmental Conservation', 'Advanced', 'Environmental conservation badge', 'environment', TRUE),
('LEADERSHIP', 'Leadership', 'Advanced', 'Leadership development badge', 'leadership', TRUE),
('COMMUNITY_SERVICE', 'Community Service', 'Intermediate', 'Service participation badge', 'service', TRUE),
('HIKING', 'Hiking', 'Intermediate', 'Hiking participation badge', 'hiking', TRUE),
('CITIZENSHIP', 'Citizenship', 'Intermediate', 'Citizenship awareness badge', 'citizenship', TRUE),
('CAMP_CRAFT', 'Camp Craft', 'Advanced', 'Camp craft badge', 'camp-craft', TRUE),
('PIONEERING', 'Pioneering', 'Intermediate', 'Pioneering skills badge', 'pioneering', TRUE),
('COMMUNICATION', 'Communication', 'Intermediate', 'Communication badge', 'communication', TRUE),
('TEAMWORK', 'Teamwork', 'Intermediate', 'Teamwork badge', 'teamwork', TRUE),
('SCOUT_SPIRIT', 'Scout Spirit', 'Advanced', 'Scout spirit badge', 'spirit', TRUE),
('SERVICE_EXCELLENCE', 'Service Excellence', 'Advanced', 'Service excellence badge', 'service-excellence', TRUE),
('CHIEF_CC', 'Chief Commissioner''s Award', 'Award', 'Chief Commissioner award track', 'chief-commissioner', TRUE),
('PRESIDENT_SCOUT', 'President''s Scout Award', 'Award', 'President award track', 'president', TRUE);

-- Reset Shera badge rows
DELETE FROM scout_badge_progress WHERE scout_id = @shera_scout_id;

-- 14 COMPLETED BADGES
INSERT INTO scout_badge_progress (
    scout_id, badge_id, progress_type, completion_percentage, requirements_met, total_requirements, achieved_date, remarks
)
SELECT
    @shera_scout_id,
    id,
    'COMPLETED',
    100,
    7,
    7,
    '2025-09-15',
    'Completed successfully'
FROM badges
WHERE badge_code IN (
    'FIRST_AID', 'CAMPING', 'NAVIGATION', 'ENV_CONSERVATION', 'LEADERSHIP',
    'COMMUNITY_SERVICE', 'HIKING', 'CITIZENSHIP', 'CAMP_CRAFT', 'PIONEERING',
    'COMMUNICATION', 'TEAMWORK', 'SCOUT_SPIRIT', 'SERVICE_EXCELLENCE'
);

-- 2 eligible / award-track rows
INSERT INTO scout_badge_progress (
    scout_id, badge_id, progress_type, completion_percentage, requirements_met, total_requirements, achieved_date, remarks
) VALUES
(@shera_scout_id, (SELECT id FROM badges WHERE badge_code='CHIEF_CC' LIMIT 1), 'ELIGIBLE', 90, 9, 10, NULL, 'Almost there! 90% complete'),
(@shera_scout_id, (SELECT id FROM badges WHERE badge_code='PRESIDENT_SCOUT' LIMIT 1), 'ELIGIBLE', 85, 17, 20, NULL, 'Almost there! 85% complete');

-- Optional in-progress badge row
INSERT INTO scout_badge_progress (
    scout_id, badge_id, progress_type, completion_percentage, requirements_met, total_requirements, achieved_date, remarks
)
SELECT
    @shera_scout_id,
    (SELECT id FROM badges WHERE badge_code='LEADERSHIP' LIMIT 1),
    'PENDING',
    75,
    3,
    4,
    NULL,
    '3 of 4 requirements met'
WHERE NOT EXISTS (
    SELECT 1
    FROM scout_badge_progress
    WHERE scout_id = @shera_scout_id
      AND badge_id = (SELECT id FROM badges WHERE badge_code='LEADERSHIP' LIMIT 1)
      AND progress_type = 'PENDING'
);

-- =========================================================
-- 22) BADGE SUBMISSIONS FOR EXAMINER DASHBOARD
-- =========================================================
INSERT INTO badge_submissions (
    scout_id, badge_id, completion_percentage, evidence_summary, status
) VALUES
(@anushka_scout_id, (SELECT id FROM badges WHERE badge_code='FIRST_AID'), 95, 'Evidence Submitted', 'PENDING'),
(@anushka_scout_id, (SELECT id FROM badges WHERE badge_code='LEADERSHIP'), 88, 'Evidence Submitted', 'PENDING'),
(@nimali_scout_id, (SELECT id FROM badges WHERE badge_code='ENV_CONSERVATION'), 92, 'Evidence Submitted', 'PENDING'),
(@rohan_scout_id, (SELECT id FROM badges WHERE badge_code='CAMPING'), 85, 'Evidence Submitted', 'PENDING'),
(@tharindu_scout_id, (SELECT id FROM badges WHERE badge_code='NAVIGATION'), 90, 'Evidence Submitted', 'PENDING');

-- =========================================================
-- 23) AWARDS / ELIGIBILITY
-- =========================================================
INSERT INTO awards (award_code, award_name, description) VALUES
('PRESIDENT_AWARD', 'President''s Scout Award', 'Highest national scout award');

INSERT INTO scout_award_progress (
    scout_id, award_id, overall_percentage, status, quote_text, final_review_status
) VALUES
(
    @shera_scout_id,
    (SELECT id FROM awards WHERE award_code='PRESIDENT_AWARD'),
    85,
    'UNDER_REVIEW',
    'You''re almost there, Scout — Great achievements begin with small acts.',
    'IN_PROGRESS'
),
(
    @anushka_scout_id,
    (SELECT id FROM awards WHERE award_code='PRESIDENT_AWARD'),
    75,
    'IN_PROGRESS',
    'Keep going.',
    'PENDING'
),
(
    @nimali_scout_id,
    (SELECT id FROM awards WHERE award_code='PRESIDENT_AWARD'),
    95,
    'ELIGIBLE',
    'Excellent progress.',
    'COMPLETED'
),
(
    @rohan_scout_id,
    (SELECT id FROM awards WHERE award_code='PRESIDENT_AWARD'),
    65,
    'IN_PROGRESS',
    'Needs improvement.',
    'PENDING'
),
(
    @tharindu_scout_id,
    (SELECT id FROM awards WHERE award_code='PRESIDENT_AWARD'),
    85,
    'IN_PROGRESS',
    'Strong progress.',
    'IN_PROGRESS'
);

SET @shera_award_progress_id := (
    SELECT id FROM scout_award_progress
    WHERE scout_id=@shera_scout_id
      AND award_id=(SELECT id FROM awards WHERE award_code='PRESIDENT_AWARD')
);

INSERT INTO award_requirement_checklist (scout_award_progress_id, requirement_name, status, display_order) VALUES
(@shera_award_progress_id, 'Required Badges Completed', 'COMPLETED', 1),
(@shera_award_progress_id, 'Service Hours Logged', 'COMPLETED', 2),
(@shera_award_progress_id, 'Leadership Training', 'COMPLETED', 3),
(@shera_award_progress_id, 'Final Review Pending', 'IN_PROGRESS', 4);

INSERT INTO award_progress_breakdown (scout_award_progress_id, metric_name, current_value, target_value, percentage, display_order) VALUES
(@shera_award_progress_id, 'Badges', 14, 15, 93, 1),
(@shera_award_progress_id, 'Service Hours', 95, 100, 95, 2),
(@shera_award_progress_id, 'Activities', 18, 20, 90, 3),
(@shera_award_progress_id, 'Leadership Projects', 2, 3, 67, 4);

-- =========================================================
-- 24) SERVICE HOURS
-- total approved for Shera = 95
-- =========================================================
INSERT INTO service_logs (scout_id, service_date, hours, description, status, approved_by_leader_user_id, approved_at) VALUES
(@shera_scout_id, '2025-01-10', 10, 'Temple cleaning support', 'APPROVED', (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'), NOW()),
(@shera_scout_id, '2025-02-05', 12, 'Community library help', 'APPROVED', (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'), NOW()),
(@shera_scout_id, '2025-03-01', 8,  'School cleanup campaign', 'APPROVED', (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'), NOW()),
(@shera_scout_id, '2025-03-20', 15, 'Elders home visit', 'APPROVED', (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'), NOW()),
(@shera_scout_id, '2025-04-14', 9,  'Tree planting support', 'APPROVED', (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'), NOW()),
(@shera_scout_id, '2025-05-03', 11, 'Food donation packing', 'APPROVED', (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'), NOW()),
(@shera_scout_id, '2025-05-25', 7,  'Beach awareness campaign', 'APPROVED', (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'), NOW()),
(@shera_scout_id, '2025-06-11', 13, 'Scout camp service support', 'APPROVED', (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'), NOW()),
(@shera_scout_id, '2025-07-02', 10, 'Environmental volunteer work', 'APPROVED', (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'), NOW());

-- =========================================================
-- 25) REPORTS
-- =========================================================
INSERT INTO reports (report_code, report_title, report_type, report_period_label, report_description, created_by_user_id) VALUES
('REP001', 'Monthly Progress Report', 'MONTHLY_PROGRESS', 'October 2025', 'October 2025 Scout Activities Summary', (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk')),
('REP002', 'Badge Achievement Report', 'BADGE_ACHIEVEMENT', 'Q3 2025', 'Q3 2025 Badge Statistics', (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk')),
('REP003', 'Attendance Report', 'ATTENDANCE', 'Scout Activity Participation', 'Scout Activity Participation', (SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'));

-- =========================================================
-- 26) NOTIFICATIONS
-- =========================================================
INSERT INTO notifications (user_id, title, message, status) VALUES
((SELECT id FROM users WHERE email='sherasaathvizarajkumar@gmail.com'), 'Activity Approved', 'Your Tree Planting Campaign activity was verified.', 'UNREAD'),
((SELECT id FROM users WHERE email='sherasaathvizarajkumar@gmail.com'), 'Proof Needed', 'Please submit proof for Community Service.', 'UNREAD'),
((SELECT id FROM users WHERE email='sherasaathvizarajkumar@gmail.com'), 'Award Progress', 'You are 85% toward President''s Scout Award.', 'UNREAD'),

((SELECT id FROM users WHERE email='kavindu.leader@slscouts.lk'), 'Pending Approvals', 'You have 5 pending activity approvals.', 'UNREAD'),
((SELECT id FROM users WHERE email='mary.examiner@slscouts.lk'), 'Badge Reviews', 'You have 5 badge submissions pending review.', 'UNREAD'),
((SELECT id FROM users WHERE email='admin@slscouts.lk'), 'System Summary', 'System dashboard is ready with scout, leader, activity and badge metrics.', 'UNREAD');

-- =========================================================
-- 27) LOGIN DATA
-- =========================================================
-- SCOUT
-- Name:     Shera Saathviza Rajkumar
-- Email:    sherasaathvizarajkumar@gmail.com
-- Username: sherasaathviza
-- Password: Scout@123
--
-- LEADER
-- Name:     Kavindu Perera
-- Email:    kavindu.leader@slscouts.lk
-- Username: perera
-- Password: Leader@123
--
-- EXAMINER
-- Name:     Mary Fernando
-- Email:    mary.examiner@slscouts.lk
-- Username: mary_examiner
-- Password: Examiner@123
--
-- ADMIN
-- Name:     System Admin
-- Email:    admin@slscouts.lk
-- Username: admin
-- Password: Admin@123
-- =========================================================
