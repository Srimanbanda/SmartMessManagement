-- =======================================================
-- SMART MESS ARCHITECTURE - MASTER SCHEMA
-- =======================================================

-- 1. DROP EXISTING TABLES (Reverse Dependency Order)
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS special_menus;
DROP TABLE IF EXISTS weekly_menus;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS students;

-- =======================================================
-- 2. CORE ENTITIES (No Dependencies)
-- =======================================================

CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roll_no VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rfid_uid VARCHAR(50) UNIQUE,
    coins INT DEFAULT 1500,
    is_active BOOLEAN NOT NULL DEFAULT TRUE -- Soft delete for graduated students
);

CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('College_Admin', 'Mess_Admin') NOT NULL
);

CREATE TABLE weekly_menus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mess_name VARCHAR(50) NOT NULL,
    day_of_week ENUM('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
    meal_type ENUM('breakfast','lunch','snacks','dinner') NOT NULL,
    items TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    price INT NOT NULL DEFAULT 50, -- Dynamic baseline pricing
    UNIQUE KEY unique_meal (mess_name, day_of_week, meal_type)
);

CREATE TABLE special_menus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mess_name VARCHAR(50) NOT NULL,
    specific_date DATE NOT NULL,
    meal_type ENUM('breakfast','lunch','snacks','dinner') NOT NULL,
    items TEXT NOT NULL,
    price INT NOT NULL DEFAULT 50, -- Dynamic festival/override pricing
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    UNIQUE KEY unique_special_meal (mess_name, specific_date, meal_type)
);

-- =======================================================
-- 3. RELATIONAL ENTITIES (Dependent on Core Tables)
-- =======================================================

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    meal_type ENUM('breakfast','lunch','snacks','dinner') NOT NULL,
    mess_name ENUM('Mess_A','Mess_B') NOT NULL,
    meal_date DATE NOT NULL,
    cost_at_booking INT NOT NULL, -- Preserves historical financial data
    status ENUM('booked','consumed','missed') NOT NULL DEFAULT 'booked',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    UNIQUE KEY unique_student_meal (student_id, meal_date, meal_type), -- Prevents double-booking
    INDEX idx_meal_date (meal_date) -- Optimizes the ESP32 morning bulk download
);

CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    booking_id INT, 
    mess_name VARCHAR(50) NOT NULL,
    amount INT NOT NULL,
    running_balance INT NOT NULL, -- Enterprise ledger auditing
    type ENUM('debit', 'credit') NOT NULL DEFAULT 'debit',
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    mess_name ENUM('Mess_A','Mess_B') NOT NULL,
    meal_date DATE NOT NULL,
    meal_type ENUM('breakfast','lunch','snacks','dinner') NOT NULL,
    rating INT NOT NULL,
    source ENUM('web','esp32') NOT NULL DEFAULT 'web',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5), -- Data integrity
    UNIQUE KEY unique_student_feedback (student_id, meal_date, meal_type) -- Prevents review spamming
);