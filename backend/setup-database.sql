-- =====================================================
--   HOTEL MANAGER — Database Setup
--   Run this in MySQL Workbench (⚡ button)
-- =====================================================

CREATE DATABASE IF NOT EXISTS hotel_db;
USE hotel_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','kitchen','waiter') NOT NULL
);

CREATE TABLE IF NOT EXISTS menu (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category ENUM('Veg','Non-Veg','Drinks','Desserts') NOT NULL,
  available BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_no VARCHAR(10) NOT NULL,
  status ENUM('Created','Accepted','Preparing','Ready','Served','Bill Pending','Paid','Cancelled') DEFAULT 'Created',
  total DECIMAL(10,2) NOT NULL,
  pay_method VARCHAR(50) DEFAULT NULL,
  paid BOOLEAN DEFAULT FALSE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_id INT NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  qty INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (menu_id) REFERENCES menu(id)
);

-- Default users (passwords set by setup step)
INSERT IGNORE INTO users (name, username, password, role) VALUES
('Admin',        'admin',   'SETUP_PENDING', 'admin'),
('Ravi Kitchen', 'kitchen', 'SETUP_PENDING', 'kitchen'),
('Muthu Waiter', 'waiter',  'SETUP_PENDING', 'waiter');

-- Default menu
INSERT IGNORE INTO menu (name, price, category) VALUES
('Masala Dosa',          80,  'Veg'),
('Paneer Butter Masala', 180, 'Veg'),
('Veg Fried Rice',       140, 'Veg'),
('Chicken Biryani',      220, 'Non-Veg'),
('Mutton Curry',         280, 'Non-Veg'),
('Mango Lassi',          60,  'Drinks'),
('Filter Coffee',        40,  'Drinks'),
('Gulab Jamun',          70,  'Desserts');

SELECT '✅ Database ready!' AS Status;
