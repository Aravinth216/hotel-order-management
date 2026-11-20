-- Hotel Manager V2 Database Setup
-- Run this in MySQL Workbench using the lightning bolt button

CREATE DATABASE IF NOT EXISTS hotel_db;
USE hotel_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  username   VARCHAR(50) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('admin','kitchen','waiter') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menu table
CREATE TABLE IF NOT EXISTS menu (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(200) NOT NULL,
  price     DECIMAL(10,2) NOT NULL,
  category  ENUM('Veg','Non-Veg','Drinks','Desserts') DEFAULT 'Veg',
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table (NEW V2)
CREATE TABLE IF NOT EXISTS customers (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  mobile       VARCHAR(15) UNIQUE NOT NULL,
  total_visits INT DEFAULT 1,
  total_spent  DECIMAL(10,2) DEFAULT 0,
  first_visit  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_visit   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Settings table (NEW V2)
CREATE TABLE IF NOT EXISTS settings (
  id                     INT PRIMARY KEY DEFAULT 1,
  restaurant_name        VARCHAR(200) DEFAULT 'My Restaurant',
  gst_number             VARCHAR(20) DEFAULT '',
  gst_percent            DECIMAL(5,2) DEFAULT 5.00,
  service_charge_enabled BOOLEAN DEFAULT FALSE,
  service_charge_percent DECIMAL(5,2) DEFAULT 10.00,
  round_off_enabled      BOOLEAN DEFAULT TRUE,
  receipt_footer         TEXT DEFAULT 'Thank you for dining with us!',
  admin_email            VARCHAR(200) DEFAULT ''
);

-- Insert default settings
INSERT IGNORE INTO settings (id) VALUES (1);

-- Shifts table (NEW V2)
CREATE TABLE IF NOT EXISTS shifts (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  started_by               INT,
  closed_by                INT,
  start_time               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_time                 TIMESTAMP NULL,
  status                   ENUM('open','closed') DEFAULT 'open',
  total_orders             INT DEFAULT 0,
  total_revenue            DECIMAL(10,2) DEFAULT 0,
  cash_collection          DECIMAL(10,2) DEFAULT 0,
  upi_collection           DECIMAL(10,2) DEFAULT 0,
  card_collection          DECIMAL(10,2) DEFAULT 0,
  cancelled_orders         INT DEFAULT 0,
  total_discount           DECIMAL(10,2) DEFAULT 0,
  gst_collected            DECIMAL(10,2) DEFAULT 0
);

-- Orders table (V2 enhanced)
CREATE TABLE IF NOT EXISTS orders (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  table_no               VARCHAR(10) NOT NULL,
  status                 ENUM('Created','Accepted','Preparing','Ready','Served','Bill Pending','Paid','Cancelled') DEFAULT 'Created',
  total                  DECIMAL(10,2) DEFAULT 0,
  subtotal               DECIMAL(10,2) DEFAULT 0,
  gst_percent            DECIMAL(5,2) DEFAULT 0,
  gst_amount             DECIMAL(10,2) DEFAULT 0,
  service_charge_amount  DECIMAL(10,2) DEFAULT 0,
  discount_type          ENUM('fixed','percent') DEFAULT 'fixed',
  discount_value         DECIMAL(10,2) DEFAULT 0,
  discount_amount        DECIMAL(10,2) DEFAULT 0,
  round_off              DECIMAL(5,2) DEFAULT 0,
  final_amount           DECIMAL(10,2) DEFAULT 0,
  pay_method             VARCHAR(50),
  paid                   BOOLEAN DEFAULT FALSE,
  order_source           ENUM('staff','qr') DEFAULT 'staff',
  special_instruction    TEXT,
  cancel_reason          VARCHAR(200),
  customer_id            INT,
  customer_name          VARCHAR(100),
  customer_mobile        VARCHAR(15),
  kot_number             VARCHAR(30),
  created_by             INT,
  created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Order items table (V2 enhanced)
CREATE TABLE IF NOT EXISTS order_items (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  order_id             INT NOT NULL,
  menu_id              INT,
  item_name            VARCHAR(200) NOT NULL,
  price                DECIMAL(10,2) NOT NULL,
  qty                  INT NOT NULL,
  special_instruction  TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Insert default users (passwords will be hashed by /api/auth/setup)
INSERT IGNORE INTO users (name, username, password, role) VALUES
  ('Admin User',   'admin',   'admin123',   'admin'),
  ('Kitchen Staff','kitchen', 'kitchen123', 'kitchen'),
  ('Waiter Staff', 'waiter',  'waiter123',  'waiter');

-- Insert sample menu
INSERT IGNORE INTO menu (name, price, category) VALUES
  ('Masala Dosa',         80,  'Veg'),
  ('Paneer Butter Masala',180, 'Veg'),
  ('Veg Fried Rice',      140, 'Veg'),
  ('Chicken Biryani',     220, 'Non-Veg'),
  ('Mutton Curry',        280, 'Non-Veg'),
  ('Mango Lassi',         60,  'Drinks'),
  ('Filter Coffee',       40,  'Drinks'),
  ('Gulab Jamun',         70,  'Desserts');

SELECT 'Database setup complete!' as Status;
