    CREATE DATABASE IF NOT EXISTS smart_mess;
USE smart_mess;

CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roll_no VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, 
    rfid_uid VARCHAR(50) UNIQUE,
    coins INT DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE menu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mess_name ENUM('Mess_A', 'Mess_B') NOT NULL,
    meal_type ENUM('breakfast', 'lunch', 'dinner') NOT NULL,
    items TEXT NOT NULL,
    meal_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT DEFAULT 100, 
    UNIQUE KEY unique_menu_slot (mess_name, meal_type, meal_date)
) ENGINE=InnoDB;

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    meal_type ENUM('breakfast', 'lunch', 'dinner') NOT NULL,
    mess_name ENUM('Mess_A', 'Mess_B') NOT NULL,
    meal_date DATE NOT NULL,
    status ENUM('booked', 'consumed', 'cancelled') DEFAULT 'booked',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_daily_meal (student_id, meal_type, meal_date) 
) ENGINE=InnoDB;

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    type ENUM('credit', 'debit') NOT NULL,
    amount INT NOT NULL,
    action_by ENUM('admin', 'system') NOT NULL,
    remarks VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;