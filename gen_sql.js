const fs = require('fs');

const groups = [
    { id: 1, name: 'Kelaniya Scout Group', target: 412, district: 'Gampaha', province: 'Western Province' },
    { id: 2, name: 'Negombo Scout Group', target: 185, district: 'Gampaha', province: 'Western Province' },
    { id: 3, name: 'Kandy Hills Scouts', target: 530, district: 'Kandy', province: 'Central Province' },
    { id: 4, name: 'Galle Coastal Scouts', target: 308, district: 'Galle', province: 'Southern Province' },
    { id: 5, name: 'Jaffna North Scouts', target: 367, district: 'Jaffna', province: 'Northern Province' },
    { id: 6, name: 'Anuradhapura Scouts', target: 442, district: 'Anuradhapura', province: 'North Central Province' },
    { id: 7, name: 'Colombo Central Scouts', target: 294, district: 'Colombo', province: 'Western Province' },
];

let sql = `
DROP DATABASE IF EXISTS spms_db;
CREATE DATABASE spms_db;
USE spms_db;

-- 1) ROLES
CREATE TABLE roles (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;
INSERT INTO roles (id, role_name) VALUES (1, 'SCOUT'),(2, 'LEADER'),(3, 'EXAMINER'),(4, 'ADMIN');

-- 2) USERS
CREATE TABLE users (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  username VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  status ENUM('PENDING','ACTIVE','SUSPENDED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- 3) GROUPS
CREATE TABLE scout_groups (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  group_name VARCHAR(140) NOT NULL,
  district VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO scout_groups (id, group_name, district, province) VALUES
(1, 'Kelaniya Scout Group','Gampaha','Western Province'),
(2, 'Negombo Scout Group','Gampaha','Western Province'),
(3, 'Kandy Hills Scouts','Kandy','Central Province'),
(4, 'Galle Coastal Scouts','Galle','Southern Province'),
(5, 'Jaffna North Scouts','Jaffna', 'Northern Province'),
(6, 'Anuradhapura Scouts', 'Anuradhapura', 'North Central Province'),
(7, 'Colombo Central Scouts', 'Colombo', 'Western Province');

-- 4) PROFILES
CREATE TABLE scout_leaders (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  scout_group_id INT UNSIGNED NOT NULL,
  contact_number VARCHAR(30) NOT NULL,
  leader_code VARCHAR(50) NULL,
  district VARCHAR(100) NULL,
  province VARCHAR(100) NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (scout_group_id) REFERENCES scout_groups(id)
) ENGINE=InnoDB;

CREATE TABLE scouts (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  scout_group_id INT UNSIGNED NOT NULL,
  dob DATE NOT NULL,
  gender ENUM('MALE','FEMALE','OTHER') NOT NULL,
  contact_number VARCHAR(30) NOT NULL,
  nic_or_school_id VARCHAR(50) NOT NULL,
  scout_code VARCHAR(30) NULL,
  district VARCHAR(100) NULL,
  province VARCHAR(100) NULL,
  assigned_leader_id INT UNSIGNED NULL,
  verified_by_leader_user_id INT UNSIGNED NULL,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (scout_group_id) REFERENCES scout_groups(id)
) ENGINE=InnoDB;

-- 5) ACTIVITIES & FLOW (Needed for Roster Badge Counts)
CREATE TABLE activities (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  activity_name VARCHAR(160) NOT NULL,
  activity_date DATE NOT NULL,
  location VARCHAR(180) NOT NULL,
  category ENUM('CAMPING','SERVICE','TRAINING','HIKING','OTHER') NOT NULL DEFAULT 'OTHER',
  status ENUM('ACTIVE','CANCELLED') NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB;

CREATE TABLE activity_registrations (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  scout_id INT UNSIGNED NOT NULL,
  activity_id INT UNSIGNED NOT NULL,
  FOREIGN KEY (scout_id) REFERENCES scouts(id),
  FOREIGN KEY (activity_id) REFERENCES activities(id)
) ENGINE=InnoDB;

CREATE TABLE activity_submissions (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  registration_id INT UNSIGNED NOT NULL UNIQUE,
  status ENUM('SUBMITTED','APPROVED','REJECTED') NOT NULL DEFAULT 'SUBMITTED',
  FOREIGN KEY (registration_id) REFERENCES activity_registrations(id)
) ENGINE=InnoDB;

-- SEED: CORE USERS
INSERT INTO users (id, full_name, email, username, password_hash, role_id, status) VALUES
(1, 'Shera Saathviza Rajkumar', 'sherasaathvizarajkumar@gmail.com', 'sherasaathviza', 'Scout@123', 1, 'ACTIVE'),
(2, 'Anushka Silva', 'anushka.silva@scouts.lk', 'anushka', 'Scout@123', 1, 'ACTIVE'),
(3, 'Kavindu Perera', 'kavindu.leader@slscouts.lk', 'kavindu_leader', 'Leader@123', 2, 'ACTIVE'),
(4, 'Nimali Fernando', 'nimali.examiner@slscouts.lk', 'nimali_examiner', 'Examiner@123', 3, 'ACTIVE'),
(5, 'System Admin', 'admin@slscouts.lk', 'admin', 'Admin@123', 4, 'ACTIVE');

-- SEED: PROFILES
INSERT INTO scout_leaders (id, user_id, scout_group_id, contact_number) VALUES (1, 3, 1, '0771112223');

-- ADDITIONAL LEADERS for each group
INSERT INTO users (id, full_name, email, username, password_hash, role_id, status) VALUES
(6, 'Leader Negombo', 'l.negombo@slscouts.lk', 'lead_neg', 'Leader@123', 2, 'ACTIVE'),
(7, 'Leader Kandy', 'l.kandy@slscouts.lk', 'lead_kan', 'Leader@123', 2, 'ACTIVE'),
(8, 'Leader Galle', 'l.galle@slscouts.lk', 'lead_gal', 'Leader@123', 2, 'ACTIVE'),
(9, 'Leader Jaffna', 'l.jaffna@slscouts.lk', 'lead_jaf', 'Leader@123', 2, 'ACTIVE'),
(10, 'Leader A-Pura', 'l.apura@slscouts.lk', 'lead_apu', 'Leader@123', 2, 'ACTIVE'),
(11, 'Leader Colombo', 'l.colombo@slscouts.lk', 'lead_col', 'Leader@123', 2, 'ACTIVE');

INSERT INTO scout_leaders (id, user_id, scout_group_id, contact_number) VALUES
(2, 6, 2, '0315556667'),
(3, 7, 3, '0812223334'),
(4, 8, 4, '0912223334'),
(5, 9, 5, '0212223334'),
(6, 10, 6, '0252223334'),
(7, 11, 7, '0112223334');

-- SEED: PRIMARY SCOUTS
INSERT INTO scouts (id, user_id, scout_group_id, dob, gender, contact_number, nic_or_school_id, scout_code, assigned_leader_id, district, province) VALUES
(1, 1, 1, '2005-05-10', 'FEMALE', '0771234567', 'SID-001', 'SC-001', 1, 'Gampaha', 'Western Province'),
(2, 2, 1, '2006-03-15', 'MALE', '0779876543', 'SID-002', 'SC-002', 1, 'Gampaha', 'Western Province');

-- GENERATE BULK DATA
`;

groups.forEach(g => {
    sql += `\n-- Bulk Scouts for ${g.name}\n`;
    const startNum = (g.id === 1) ? 3 : 1; 
    for (let i = startNum; i <= g.target; i++) {
        const timestamp = Date.now() + i + (g.id * 1000);
        sql += `INSERT INTO users (full_name, email, username, password_hash, role_id, status) VALUES ('Scout #${i} ${g.district}', 'scout_${g.id}_${i}@slscouts.lk', 's_${g.id}_${i}_${timestamp}', 'Scout@123', 1, 'ACTIVE');\n`;
        sql += `INSERT INTO scouts (user_id, scout_group_id, dob, gender, contact_number, nic_or_school_id, scout_code, district, province, assigned_leader_id) VALUES (LAST_INSERT_ID(), ${g.id}, '2012-01-01', 'MALE', '0770000000', 'SID-${g.id}-${i}', 'SC-${g.id}-${i}', '${g.district}', '${g.province}', (SELECT id FROM scout_leaders WHERE scout_group_id=${g.id} LIMIT 1));\n`;
    }
});

fs.writeFileSync('localSPMS.session.sql', sql);
console.log('SQL generated successfully.');
