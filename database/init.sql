-- Create database and user
CREATE USER postgres WITH PASSWORD 'postgres';
CREATE DATABASE lumina;
GRANT ALL PRIVILEGES ON DATABASE lumina TO postgres;

\c lumina

-- Create enum types
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');

-- Create users table with basic structure
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert test users with password 'password123'
INSERT INTO users (id, name, email, password_hash, role) VALUES
('student_001', 'Test Student', 'student@lumina.edu', '$2a$10$zFkz9oMxXqYRrGXL4LTNheFJ/7ZIaEBTX2TLtA7GLhIAqjlD9o5Rm', 'student'),
('teacher_001', 'Test Teacher', 'teacher@lumina.edu', '$2a$10$zFkz9oMxXqYRrGXL4LTNheFJ/7ZIaEBTX2TLtA7GLhIAqjlD9o5Rm', 'teacher'),
('admin_001', 'Test Admin', 'admin@lumina.edu', '$2a$10$zFkz9oMxXqYRrGXL4LTNheFJ/7ZIaEBTX2TLtA7GLhIAqjlD9o5Rm', 'admin');