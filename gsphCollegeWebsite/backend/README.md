# GSPH College Management System - MySQL Backend

Complete backend with MySQL database integration.

## 📋 Prerequisites

1. **Node.js** (v14 or higher)
   - Download: https://nodejs.org/

2. **MySQL Server** (v8.0 or higher)
   - Download: https://dev.mysql.com/downloads/mysql/
   - Or use XAMPP: https://www.apachefriends.org/

## 🚀 Setup Instructions

### Step 1: Install MySQL

**Option A: Using MySQL Installer (Recommended)**
1. Download MySQL Installer from https://dev.mysql.com/downloads/installer/
2. Run installer and select "Developer Default"
3. Set root password (or leave empty for development)
4. Complete installation

**Option B: Using XAMPP**
1. Download XAMPP from https://www.apachefriends.org/
2. Install XAMPP
3. Start MySQL from XAMPP Control Panel

### Step 2: Create Database

**Method 1: Using MySQL Workbench (GUI)**
1. Open MySQL Workbench
2. Connect to localhost (root user)
3. Go to File → Open SQL Script
4. Select `backend/database.sql`
5. Click Execute (⚡ icon)

**Method 2: Using Command Line**
```bash
# Navigate to project directory
cd C:\Users\APPLE\Desktop\gsph

# Run SQL script
mysql -u root -p < backend/database.sql

# Enter your MySQL password when prompted
```

**Method 3: Using XAMPP phpMyAdmin**
1. Open http://localhost/phpmyadmin
2. Click "Import" tab
3. Choose file: `backend/database.sql`
4. Click "Go"

### Step 3: Configure Database Connection

Edit `backend/.env` file:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=gsph_college
DB_PORT=3306
PORT=3000
```

### Step 4: Install Dependencies

```bash
cd backend
npm install
```

### Step 5: Start Server

```bash
# Development mode (auto-restart on changes)
npm run dev

# OR Production mode
npm start
```

## 🌐 Access URLs

- **Home Page:** http://localhost:3000
- **Admin Login:** http://localhost:3000/admin/index.html
- **Student Login:** http://localhost:3000/student/student.html
- **API Health Check:** http://localhost:3000/api/health

## 🔐 Default Login Credentials

### Admin
- Email: `admin@gsph.edu`
- Password: `admin123`

### HOD
- Email: `hod.cse@gsph.edu`
- Password: `hod123`

### Teacher
- Email: `faculty.cse1@gsph.edu`
- Password: `teacher123`

### Students
- Roll: `CSE22001`, Password: `cseA001`
- Roll: `CSE22002`, Password: `cseA002`
- Roll: `CSE22003`, Password: `cseB003`

## 📊 Database Structure

### Tables
- `branches` - Academic branches/departments
- `subjects` - Course subjects
- `teachers` - Faculty and admin users
- `students` - Student records
- `attendance` - Daily attendance records
- `marks` - Internal and semester marks
- `assignments` - Assignment postings
- `timetable` - Class schedules
- `exams` - Exam schedules
- `results` - Semester results
- `notifications` - Announcements
- `holidays` - Holiday calendar

### Views
- `student_attendance_summary` - Attendance percentage per student
- `student_performance` - Overall performance metrics

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/student/login` - Student login
- `POST /api/auth/teacher/login` - Teacher/Admin login

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:roll` - Get student by roll
- `POST /api/students` - Add new student
- `PUT /api/students/:roll` - Update student
- `DELETE /api/students/:roll` - Delete student

### Attendance
- `GET /api/attendance/:roll` - Get attendance records
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance/:roll/summary` - Get attendance summary

### Marks
- `GET /api/marks/:roll` - Get marks for student
- `POST /api/marks` - Add/Update marks

### Subjects
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Add new subject

### Branches
- `GET /api/branches` - Get all branches
- `POST /api/branches` - Add new branch

### Assignments
- `GET /api/assignments` - Get assignments
- `POST /api/assignments` - Post assignment

### Timetable
- `GET /api/timetable/:groupKey` - Get timetable
- `POST /api/timetable` - Add timetable entry

### Exams
- `GET /api/exams` - Get exam schedule
- `POST /api/exams` - Add exam

### Results
- `GET /api/results/:roll` - Get student results
- `POST /api/results` - Add result

### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications` - Post notification

### Holidays
- `GET /api/holidays` - Get holiday list

### Teachers
- `GET /api/teachers` - Get all teachers
- `POST /api/teachers` - Add teacher

## 🐛 Troubleshooting

### Error: "Database connection failed"
- Make sure MySQL service is running
- Check credentials in `.env` file
- Verify database exists: `SHOW DATABASES;`

### Error: "ER_ACCESS_DENIED_ERROR"
- Check MySQL username and password
- Grant privileges: `GRANT ALL PRIVILEGES ON gsph_college.* TO 'root'@'localhost';`

### Error: "ER_BAD_DB_ERROR"
- Database not created
- Run `database.sql` script again

### Port 3000 already in use
- Change PORT in `.env` file
- Or kill process: `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`

## 📝 Notes

- **Security:** Passwords are stored in plain text for demo purposes. Use bcrypt for production.
- **CORS:** Enabled for all origins in development. Restrict in production.
- **Connection Pool:** Configured for 10 concurrent connections.
- **Auto-increment IDs:** All tables use auto-increment primary keys.
- **Foreign Keys:** Cascade delete enabled for related records.

## 🔄 Migration from localStorage

The frontend code needs to be updated to use API calls instead of localStorage. This involves:

1. Replacing localStorage operations with fetch/axios calls
2. Handling async operations with promises
3. Managing authentication tokens
4. Error handling for network requests

## 📞 Support

For issues or questions:
1. Check MySQL service status
2. Verify database connection in MySQL Workbench
3. Check server logs for errors
4. Test API endpoints using Postman or browser

---

**Happy Coding! 🚀**
