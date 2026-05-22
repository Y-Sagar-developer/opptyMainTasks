# 🚀 GSPH College - MySQL Setup Guide

## ✅ Complete Setup Checklist

### 1️⃣ Install MySQL (Choose One Method)

#### Method A: MySQL Installer (Recommended)
1. Download: https://dev.mysql.com/downloads/installer/
2. Run `mysql-installer-community-8.0.xx.msi`
3. Choose "Developer Default"
4. Set root password (remember this!)
5. Complete installation

#### Method B: XAMPP (Easier for Beginners)
1. Download: https://www.apachefriends.org/download.html
2. Install XAMPP
3. Open XAMPP Control Panel
4. Click "Start" for MySQL

### 2️⃣ Verify MySQL is Running

**For MySQL Installer:**
```cmd
mysql --version
```

**For XAMPP:**
- Open XAMPP Control Panel
- MySQL should show "Running" status

### 3️⃣ Create Database

**Option 1: MySQL Workbench (GUI)**
1. Open MySQL Workbench
2. Click "Local instance MySQL80"
3. Enter your root password
4. Go to: File → Open SQL Script
5. Navigate to: `C:\Users\APPLE\Desktop\gsph\backend\database.sql`
6. Click Execute (⚡ lightning icon)
7. Wait for "Action Output" to show success

**Option 2: Command Line**
```cmd
cd C:\Users\APPLE\Desktop\gsph
mysql -u root -p < backend\database.sql
```
Enter your MySQL password when prompted.

**Option 3: phpMyAdmin (XAMPP Users)**
1. Open: http://localhost/phpmyadmin
2. Click "Import" tab
3. Click "Choose File"
4. Select: `C:\Users\APPLE\Desktop\gsph\backend\database.sql`
5. Click "Go" at bottom
6. Wait for success message

### 4️⃣ Configure Database Connection

Edit file: `backend\.env`

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=gsph_college
DB_PORT=3306
PORT=3000
```

**Important:** Replace `YOUR_MYSQL_PASSWORD_HERE` with your actual MySQL password!

### 5️⃣ Install Node.js Dependencies

```cmd
cd C:\Users\APPLE\Desktop\gsph\backend
npm install
```

This will install:
- express (web server)
- mysql2 (database driver)
- cors (cross-origin support)
- body-parser (request parsing)
- dotenv (environment variables)

### 6️⃣ Start the Server

```cmd
cd C:\Users\APPLE\Desktop\gsph\backend
node server-mysql.js
```

You should see:
```
✅ Database connected successfully!
🚀 GSPH College Management System
📡 Server running on: http://localhost:3000
```

### 7️⃣ Test the Application

Open in browser:
- **Home:** http://localhost:3000
- **Admin:** http://localhost:3000/admin/index.html
- **Student:** http://localhost:3000/student/student.html

## 🔐 Login Credentials

### Admin Login
- Email: `admin@gsph.edu`
- Password: `admin123`

### Student Login
- Roll: `CSE22001`
- Password: `cseA001`

## ❌ Common Errors & Solutions

### Error: "mysql is not recognized"
**Solution:** MySQL not in PATH or not installed
- Reinstall MySQL or XAMPP
- Or use MySQL Workbench GUI method

### Error: "Database connection failed"
**Solution:** MySQL service not running
- **MySQL Installer:** Open Services → Start "MySQL80"
- **XAMPP:** Open XAMPP Control Panel → Start MySQL

### Error: "Access denied for user 'root'"
**Solution:** Wrong password in `.env` file
- Check your MySQL password
- Update `DB_PASSWORD` in `backend\.env`

### Error: "Unknown database 'gsph_college'"
**Solution:** Database not created
- Run `database.sql` script again (Step 3)

### Error: "Port 3000 already in use"
**Solution:** Another server is running
- Stop the old server (Ctrl+C)
- Or change PORT in `.env` to 3001

### Error: "Cannot find module 'express'"
**Solution:** Dependencies not installed
- Run: `cd backend` then `npm install`

## 🧪 Verify Database Setup

### Check if database exists:
```sql
-- Open MySQL Workbench or phpMyAdmin
SHOW DATABASES;
-- You should see 'gsph_college' in the list
```

### Check if tables exist:
```sql
USE gsph_college;
SHOW TABLES;
-- You should see 12 tables
```

### Check sample data:
```sql
SELECT * FROM students;
SELECT * FROM teachers;
SELECT * FROM branches;
```

## 📊 Database Overview

**12 Tables Created:**
1. branches (5 branches)
2. subjects (10 subjects)
3. teachers (5 teachers)
4. students (7 students)
5. attendance (empty - will be filled by users)
6. marks (empty)
7. assignments (empty)
8. timetable (empty)
9. exams (empty)
10. results (empty)
11. notifications (2 sample notifications)
12. holidays (9 festival holidays for 2026)

## 🔄 Next Steps

After successful setup:

1. ✅ MySQL installed and running
2. ✅ Database created with sample data
3. ✅ Backend server running
4. ✅ Can login to admin/student portals

**Now you need to:**
- Update frontend JavaScript to use API calls instead of localStorage
- This requires modifying `script.js` files in admin and student folders

## 📞 Need Help?

1. Check MySQL service is running
2. Verify database exists in MySQL Workbench
3. Check server console for error messages
4. Test API: http://localhost:3000/api/health

---

**Setup Complete! 🎉**

Your GSPH College Management System is now running with MySQL database!
