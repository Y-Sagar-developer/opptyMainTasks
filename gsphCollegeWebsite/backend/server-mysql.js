const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gspg_college',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Promisify pool for async/await
const promisePool = pool.promise();

// Test database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('\n📋 Setup Instructions:');
    console.log('1. Install MySQL: https://dev.mysql.com/downloads/mysql/');
    console.log('2. Start MySQL service');
    console.log('3. Run: mysql -u root -p < backend/database.sql');
    console.log('4. Update backend/.env with your MySQL credentials\n');
  } else {
    console.log('✅ Database connected successfully!');
    connection.release();
  }
});

// ==================== API ROUTES ====================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});
















// ==================== AUTHENTICATION ====================

// Student Login
app.post('/api/auth/student/login', async (req, res) => {
  try {
    const { roll, password } = req.body;
    const [rows] = await promisePool.query(
      'SELECT * FROM students WHERE roll = ? AND password = ?',
      [roll, password]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const student = rows[0];
    delete student.password; // Don't send password to client
    res.json({ success: true, student });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Teacher/Admin Login
app.post('/api/auth/teacher/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await promisePool.query(
      'SELECT * FROM teachers WHERE email = ? AND password = ?',
      [email, password]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const teacher = rows[0];
    delete teacher.password;
    res.json({ success: true, teacher });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== STUDENTS ====================

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const { branch } = req.query;
    let query = 'SELECT * FROM students';
    let params = [];
    
    if (branch) {
      query += ' WHERE branch_code = ?';
      params.push(branch);
    }
    
    const [rows] = await promisePool.query(query, params);
    res.json({ success: true, students: rows });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single student
app.get('/api/students/:roll', async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      'SELECT * FROM students WHERE roll = ?',
      [req.params.roll]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.json({ success: true, student: rows[0] });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add new student
app.post('/api/students', async (req, res) => {
  try {
    const { roll, password, name, branch_code, year, section, email, phone, photo, cgpa, fee_status } = req.body;
    
    const [result] = await promisePool.query(
      `INSERT INTO students (roll, password, name, branch_code, year, section, email, phone, photo, cgpa, fee_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [roll, password, name, branch_code, year, section, email, phone, photo, cgpa, fee_status]
    );
    
    res.json({ success: true, message: 'Student added successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ success: false, message: error.code === 'ER_DUP_ENTRY' ? 'Roll number already exists' : 'Server error' });
  }
});

// Update student
app.put('/api/students/:roll', async (req, res) => {
  try {
    const { name, branch_code, year, section, email, phone, photo, cgpa, fee_status } = req.body;
    
    console.log(`Updating student ${req.params.roll}:`, {
      name,
      branch_code,
      year,
      section,
      email,
      phone,
      photoLength: photo ? photo.length : 0,
      cgpa,
      fee_status
    });
    
    const [result] = await promisePool.query(
      `UPDATE students SET name=?, branch_code=?, year=?, section=?, email=?, phone=?, photo=?, cgpa=?, fee_status=?
       WHERE roll=?`,
      [name, branch_code, year, section, email, phone, photo, cgpa, fee_status, req.params.roll]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    console.log(`✅ Student ${req.params.roll} updated successfully`);
    res.json({ success: true, message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Delete student
app.delete('/api/students/:roll', async (req, res) => {
  try {
    const [result] = await promisePool.query('DELETE FROM students WHERE roll = ?', [req.params.roll]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== ATTENDANCE ====================

// Get attendance for a student
app.get('/api/attendance/:roll', async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = 'SELECT * FROM attendance WHERE student_roll = ?';
    let params = [req.params.roll];
    
    if (month && year) {
      query += ' AND MONTH(date) = ? AND YEAR(date) = ?';
      params.push(month, year);
    }
    
    const [rows] = await promisePool.query(query, params);
    res.json({ success: true, attendance: rows });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark attendance
app.post('/api/attendance', async (req, res) => {
  try {
    const { student_roll, subject_code, date, status, marked_by } = req.body;
    
    // If subject_code is GENERAL and doesn't exist, create it along with ALL branch
    if (subject_code === 'GENERAL') {
      await promisePool.query(
        `INSERT IGNORE INTO branches (code, name) 
         VALUES ('ALL', 'All Branches')`
      );
      await promisePool.query(
        `INSERT IGNORE INTO subjects (code, name, branch_code, semester) 
         VALUES ('GENERAL', 'General Attendance', 'ALL', 0)`
      );
    }
    
    const [result] = await promisePool.query(
      `INSERT INTO attendance (student_roll, subject_code, date, status, marked_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status=?, marked_by=?, marked_at=CURRENT_TIMESTAMP`,
      [student_roll, subject_code, date, status, marked_by, status, marked_by]
    );
    
    res.json({ success: true, message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get attendance summary
app.get('/api/attendance/:roll/summary', async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      'SELECT * FROM student_attendance_summary WHERE roll = ?',
      [req.params.roll]
    );
    
    res.json({ success: true, summary: rows[0] || {} });
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== MARKS ====================

// Get marks for a student
app.get('/api/marks/:roll', async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT m.*, s.name as subject_name 
       FROM marks m 
       JOIN subjects s ON m.subject_code = s.code 
       WHERE m.student_roll = ?`,
      [req.params.roll]
    );
    
    res.json({ success: true, marks: rows });
  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add/Update marks
app.post('/api/marks', async (req, res) => {
  try {
    const { student_roll, subject_code, internal_marks, semester_marks } = req.body;
    
    const [result] = await promisePool.query(
      `INSERT INTO marks (student_roll, subject_code, internal_marks, semester_marks)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE internal_marks=?, semester_marks=?`,
      [student_roll, subject_code, internal_marks, semester_marks, internal_marks, semester_marks]
    );
    
    res.json({ success: true, message: 'Marks saved successfully' });
  } catch (error) {
    console.error('Error saving marks:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== SUBJECTS ====================

// Get all subjects
app.get('/api/subjects', async (req, res) => {
  try {
    const { branch } = req.query;
    let query = 'SELECT * FROM subjects';
    let params = [];
    
    if (branch) {
      query += ' WHERE branch_code = ?';
      params.push(branch);
    }
    
    const [rows] = await promisePool.query(query, params);
    res.json({ success: true, subjects: rows });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add subject
app.post('/api/subjects', async (req, res) => {
  try {
    const { code, name, branch_code, semester, credits } = req.body;
    
    const [result] = await promisePool.query(
      'INSERT INTO subjects (code, name, branch_code, semester, credits) VALUES (?, ?, ?, ?, ?)',
      [code, name, branch_code, semester, credits || 3]
    );
    
    res.json({ success: true, message: 'Subject added successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding subject:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== BRANCHES ====================

// Get all branches
app.get('/api/branches', async (req, res) => {
  try {
    const [rows] = await promisePool.query('SELECT * FROM branches');
    res.json({ success: true, branches: rows });
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add branch
app.post('/api/branches', async (req, res) => {
  try {
    const { code, name } = req.body;
    
    const [result] = await promisePool.query(
      'INSERT INTO branches (code, name) VALUES (?, ?)',
      [code, name]
    );
    
    res.json({ success: true, message: 'Branch added successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding branch:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== ASSIGNMENTS ====================

// Get assignments
app.get('/api/assignments', async (req, res) => {
  try {
    const { branch } = req.query;
    let query = 'SELECT * FROM assignments';
    let params = [];
    
    if (branch) {
      query += ' WHERE branch_code = ?';
      params.push(branch);
    }
    
    query += ' ORDER BY due_date DESC';
    
    const [rows] = await promisePool.query(query, params);
    res.json({ success: true, assignments: rows });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add assignment
app.post('/api/assignments', async (req, res) => {
  try {
    const { title, description, branch_code, subject_code, due_date, posted_by } = req.body;
    
    const [result] = await promisePool.query(
      'INSERT INTO assignments (title, description, branch_code, subject_code, due_date, posted_by) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, branch_code, subject_code, due_date, posted_by]
    );
    
    res.json({ success: true, message: 'Assignment posted successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding assignment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== TIMETABLE ====================

// Get timetable
app.get('/api/timetable/:groupKey', async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      'SELECT * FROM timetable WHERE group_key = ? ORDER BY FIELD(day, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")',
      [req.params.groupKey]
    );
    
    res.json({ success: true, timetable: rows });
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add timetable entry
app.post('/api/timetable', async (req, res) => {
  try {
    const { group_key, day, slot, subject_name, faculty_name, room } = req.body;
    
    const [result] = await promisePool.query(
      'INSERT INTO timetable (group_key, day, slot, subject_name, faculty_name, room) VALUES (?, ?, ?, ?, ?, ?)',
      [group_key, day, slot, subject_name, faculty_name, room]
    );
    
    res.json({ success: true, message: 'Timetable entry added successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding timetable:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== EXAMS ====================

// Get exams
app.get('/api/exams', async (req, res) => {
  try {
    const { branch, year } = req.query;
    let query = 'SELECT * FROM exams WHERE 1=1';
    let params = [];
    
    if (branch) {
      query += ' AND branch_code = ?';
      params.push(branch);
    }
    
    if (year) {
      query += ' AND year = ?';
      params.push(year);
    }
    
    query += ' ORDER BY exam_date ASC';
    
    const [rows] = await promisePool.query(query, params);
    res.json({ success: true, exams: rows });
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add exam
app.post('/api/exams', async (req, res) => {
  try {
    const { subject, branch_code, year, exam_date, exam_time, hall } = req.body;
    
    const [result] = await promisePool.query(
      'INSERT INTO exams (subject, branch_code, year, exam_date, exam_time, hall) VALUES (?, ?, ?, ?, ?, ?)',
      [subject, branch_code, year, exam_date, exam_time, hall]
    );
    
    res.json({ success: true, message: 'Exam added successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding exam:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== RESULTS ====================

// Get results for a student
app.get('/api/results/:roll', async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      'SELECT * FROM results WHERE student_roll = ? ORDER BY created_at DESC',
      [req.params.roll]
    );
    
    res.json({ success: true, results: rows });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add result
app.post('/api/results', async (req, res) => {
  try {
    const { student_roll, semester, sgpa, status } = req.body;
    
    const [result] = await promisePool.query(
      'INSERT INTO results (student_roll, semester, sgpa, status) VALUES (?, ?, ?, ?)',
      [student_roll, semester, sgpa, status]
    );
    
    res.json({ success: true, message: 'Result added successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding result:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== NOTIFICATIONS ====================

// Get notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const { branch } = req.query;
    let query = 'SELECT * FROM notifications WHERE audience = "all"';
    let params = [];
    
    if (branch) {
      query += ' OR (audience = "branch" AND branch_code = ?)';
      params.push(branch);
    }
    
    query += ' ORDER BY created_at DESC LIMIT 50';
    
    const [rows] = await promisePool.query(query, params);
    res.json({ success: true, notifications: rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add notification
app.post('/api/notifications', async (req, res) => {
  try {
    const { title, body, audience, branch_code, posted_by } = req.body;
    
    const [result] = await promisePool.query(
      'INSERT INTO notifications (title, body, audience, branch_code, posted_by) VALUES (?, ?, ?, ?, ?)',
      [title, body, audience, branch_code, posted_by]
    );
    
    res.json({ success: true, message: 'Notification posted successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding notification:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== HOLIDAYS ====================

// Get holidays
app.get('/api/holidays', async (req, res) => {
  try {
    const { year } = req.query;
    let query = 'SELECT * FROM holidays';
    let params = [];
    
    if (year) {
      query += ' WHERE YEAR(date) = ?';
      params.push(year);
    }
    
    query += ' ORDER BY date ASC';
    
    const [rows] = await promisePool.query(query, params);
    res.json({ success: true, holidays: rows });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== TEACHERS ====================

// Get all teachers
app.get('/api/teachers', async (req, res) => {
  try {
    const [rows] = await promisePool.query('SELECT id, email, name, role, branch_code, phone FROM teachers');
    res.json({ success: true, teachers: rows });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add teacher
app.post('/api/teachers', async (req, res) => {
  try {
    const { email, password, name, role, branch_code, phone } = req.body;
    
    const [result] = await promisePool.query(
      'INSERT INTO teachers (email, password, name, role, branch_code, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [email, password, name, role, branch_code, phone]
    );
    
    res.json({ success: true, message: 'Teacher added successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding teacher:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== FALLBACK ROUTE ====================

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`\n🚀 GSPH College Management System`);
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${path.join(__dirname, '..', 'public')}`);
  console.log(`\n📌 Access points:`);
  console.log(`   - Home: http://localhost:${PORT}`);
  console.log(`   - Admin: http://localhost:${PORT}/admin/index.html`);
  console.log(`   - Student: http://localhost:${PORT}/student/student.html`);
  console.log(`   - API Health: http://localhost:${PORT}/api/health`);
  console.log(`\n💾 Database: ${process.env.DB_NAME || 'gsph_college'}`);
  console.log(`\n⚠️  Make sure MySQL is running and database is set up!`);
  console.log(`   Run: mysql -u root -p < backend/database.sql\n`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  pool.end((err) => {
    if (err) console.error('Error closing database pool:', err);
    else console.log('✅ Database connections closed');
    process.exit(0);
  });
});
