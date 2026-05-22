-- GSPH College Management System Database Schema
-- MySQL Database Setup

CREATE DATABASE IF NOT EXISTS gsph_college;
USE gsph_college;

-- ==================== TABLES ====================

-- 1. Branches Table
CREATE TABLE IF NOT EXISTS branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    branch_code VARCHAR(10) NOT NULL,
    semester INT NOT NULL,
    credits INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_code) REFERENCES branches(code) ON DELETE CASCADE
);

-- 3. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'hod', 'teacher') NOT NULL,
    branch_code VARCHAR(10),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_code) REFERENCES branches(code) ON DELETE SET NULL
);

-- 4. Students Table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    branch_code VARCHAR(10) NOT NULL,
    year INT NOT NULL,
    section VARCHAR(2) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    photo TEXT,
    cgpa DECIMAL(3,2) DEFAULT 0.00,
    fee_status ENUM('Paid', 'Pending', 'Partial') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_code) REFERENCES branches(code) ON DELETE CASCADE
);

-- 5. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_roll VARCHAR(20) NOT NULL,
    subject_code VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    status ENUM('Present', 'Absent', 'Holiday') NOT NULL,
    marked_by VARCHAR(100),
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_attendance (student_roll, subject_code, date),
    FOREIGN KEY (student_roll) REFERENCES students(roll) ON DELETE CASCADE,
    FOREIGN KEY (subject_code) REFERENCES subjects(code) ON DELETE CASCADE
);

-- 6. Marks Table
CREATE TABLE IF NOT EXISTS marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_roll VARCHAR(20) NOT NULL,
    subject_code VARCHAR(20) NOT NULL,
    internal_marks DECIMAL(5,2) DEFAULT 0,
    semester_marks DECIMAL(5,2) DEFAULT 0,
    total_marks DECIMAL(5,2) GENERATED ALWAYS AS (internal_marks + semester_marks) STORED,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_marks (student_roll, subject_code),
    FOREIGN KEY (student_roll) REFERENCES students(roll) ON DELETE CASCADE,
    FOREIGN KEY (subject_code) REFERENCES subjects(code) ON DELETE CASCADE
);

-- 7. Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    branch_code VARCHAR(10) NOT NULL,
    subject_code VARCHAR(20) NOT NULL,
    due_date DATE NOT NULL,
    posted_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_code) REFERENCES branches(code) ON DELETE CASCADE,
    FOREIGN KEY (subject_code) REFERENCES subjects(code) ON DELETE CASCADE
);

-- 8. Timetable Table
CREATE TABLE IF NOT EXISTS timetable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_key VARCHAR(50) NOT NULL,
    day ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
    slot VARCHAR(50) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    faculty_name VARCHAR(100) NOT NULL,
    room VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(100) NOT NULL,
    branch_code VARCHAR(10) NOT NULL,
    year INT NOT NULL,
    exam_date DATE NOT NULL,
    exam_time VARCHAR(50) NOT NULL,
    hall VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_code) REFERENCES branches(code) ON DELETE CASCADE
);

-- 10. Results Table
CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_roll VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    sgpa DECIMAL(4,2) NOT NULL,
    status ENUM('Pass', 'Pass with backlog', 'Fail') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_roll) REFERENCES students(roll) ON DELETE CASCADE
);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    audience ENUM('all', 'branch') NOT NULL,
    branch_code VARCHAR(10),
    posted_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_code) REFERENCES branches(code) ON DELETE SET NULL
);

-- 12. Holidays Table
CREATE TABLE IF NOT EXISTS holidays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('Festival', 'National', 'Weekend', 'Other') DEFAULT 'Other',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SAMPLE DATA ====================

-- Insert Branches
INSERT INTO branches (code, name) VALUES
('CSE', 'Computer Science Engineering'),
('ECE', 'Electronics & Communication'),
('MECH', 'Mechanical Engineering'),
('CIVIL', 'Civil Engineering'),
('EEE', 'Electrical Engineering')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Subjects
INSERT INTO subjects (code, name, branch_code, semester) VALUES
('CSE301', 'Data Structures', 'CSE', 3),
('CSE302', 'Database Management', 'CSE', 3),
('CSE303', 'Operating Systems', 'CSE', 3),
('CSE304', 'Computer Networks', 'CSE', 3),
('CSE401', 'Machine Learning', 'CSE', 4),
('CSE402', 'Web Technologies', 'CSE', 4),
('ECE301', 'Digital Electronics', 'ECE', 3),
('ECE302', 'Signals & Systems', 'ECE', 3),
('MECH301', 'Thermodynamics', 'MECH', 3),
('MECH302', 'Fluid Mechanics', 'MECH', 3)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Teachers (passwords are plain text for demo - should be hashed in production)
INSERT INTO teachers (email, password, name, role, branch_code) VALUES
('admin@gsph.edu', 'admin123', 'Principal Admin', 'admin', 'CSE'),
('hod.cse@gsph.edu', 'hod123', 'Dr. CSE HOD', 'hod', 'CSE'),
('faculty.cse1@gsph.edu', 'teacher123', 'Prof. Karthik Menon', 'teacher', 'CSE'),
('hod.ece@gsph.edu', 'hod123', 'Dr. ECE HOD', 'hod', 'ECE'),
('faculty.ece1@gsph.edu', 'teacher123', 'Prof. Priya Sharma', 'teacher', 'ECE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Students
INSERT INTO students (roll, password, name, branch_code, year, section, email, cgpa, fee_status) VALUES
('CSE22001', 'cseA001', 'Aarav Sharma', 'CSE', 2, 'A', 'aarav@gsph.edu', 8.70, 'Paid'),
('CSE22002', 'cseA002', 'Diya Reddy', 'CSE', 2, 'A', 'diya@gsph.edu', 8.40, 'Paid'),
('CSE22003', 'cseB003', 'Kiran Kumar', 'CSE', 2, 'B', 'kiran@gsph.edu', 7.90, 'Pending'),
('CSE22004', 'cseB004', 'Ananya Iyer', 'CSE', 2, 'B', 'ananya@gsph.edu', 9.10, 'Paid'),
('CSE22005', 'cseA005', 'Rohan Patel', 'CSE', 2, 'A', 'rohan@gsph.edu', 7.50, 'Partial'),
('ECE22001', 'eceA001', 'Sneha Gupta', 'ECE', 2, 'A', 'sneha@gsph.edu', 8.20, 'Paid'),
('ECE22002', 'eceA002', 'Arjun Nair', 'ECE', 2, 'A', 'arjun@gsph.edu', 7.80, 'Paid')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Sample Holidays
INSERT INTO holidays (date, name, type) VALUES
('2026-01-26', 'Republic Day', 'National'),
('2026-03-08', 'Maha Shivaratri', 'Festival'),
('2026-03-25', 'Holi', 'Festival'),
('2026-04-14', 'Ugadi', 'Festival'),
('2026-08-15', 'Independence Day', 'National'),
('2026-10-02', 'Gandhi Jayanti', 'National'),
('2026-10-24', 'Dussehra', 'Festival'),
('2026-11-12', 'Diwali', 'Festival'),
('2026-12-25', 'Christmas', 'Festival')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Sample Notifications
INSERT INTO notifications (title, body, audience, posted_by) VALUES
('Welcome to GSPH College', 'Welcome to the new academic year 2025-26. All students are requested to complete their registration.', 'all', 'admin@gsph.edu'),
('CSE Department Meeting', 'All CSE students are requested to attend the department meeting on Monday at 10 AM.', 'branch', 'hod.cse@gsph.edu')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- ==================== INDEXES FOR PERFORMANCE ====================

CREATE INDEX idx_student_branch ON students(branch_code);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_student ON attendance(student_roll);
CREATE INDEX idx_marks_student ON marks(student_roll);
CREATE INDEX idx_exams_date ON exams(exam_date);
CREATE INDEX idx_notifications_audience ON notifications(audience);

-- ==================== VIEWS ====================

-- View: Student Attendance Summary
CREATE OR REPLACE VIEW student_attendance_summary AS
SELECT 
    s.roll,
    s.name,
    s.branch_code,
    COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present_days,
    COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent_days,
    COUNT(CASE WHEN a.status IN ('Present', 'Absent') THEN 1 END) as total_days,
    ROUND(
        (COUNT(CASE WHEN a.status = 'Present' THEN 1 END) * 100.0) / 
        NULLIF(COUNT(CASE WHEN a.status IN ('Present', 'Absent') THEN 1 END), 0),
        2
    ) as attendance_percentage
FROM students s
LEFT JOIN attendance a ON s.roll = a.student_roll
GROUP BY s.roll, s.name, s.branch_code;

-- View: Student Performance Summary
CREATE OR REPLACE VIEW student_performance AS
SELECT 
    s.roll,
    s.name,
    s.branch_code,
    s.cgpa,
    COUNT(m.id) as subjects_count,
    AVG(m.total_marks) as average_marks
FROM students s
LEFT JOIN marks m ON s.roll = m.student_roll
GROUP BY s.roll, s.name, s.branch_code, s.cgpa;

COMMIT;
-- ==================== SUCCESS MESSAGE ====================
SELECT 'Database setup completed successfully!' as Status;
