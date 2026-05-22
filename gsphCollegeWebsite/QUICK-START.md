# 🚀 Quick Start Guide - GSPH College

## ✅ Password Configured: `Sagar#9550`

## 📋 Step-by-Step Setup

### Step 1: Install MySQL Workbench (if not installed)

**Download:** https://dev.mysql.com/downloads/workbench/

OR

**Use XAMPP:** https://www.apachefriends.org/download.html

---

### Step 2: Create Database

#### Option A: Using MySQL Workbench (Recommended)

1. **Open MySQL Workbench**
2. **Click** "Local instance MySQL80" (or your MySQL connection)
3. **Enter Password:** `Sagar#9550`
4. **Go to:** File → Open SQL Script
5. **Navigate to:** `C:\Users\APPLE\Desktop\gsph\backend\database.sql`
6. **Click:** Execute (⚡ lightning bolt icon)
7. **Wait** for success message in "Action Output" panel

#### Option B: Using XAMPP phpMyAdmin

1. **Start XAMPP** Control Panel
2. **Start** MySQL service
3. **Open:** http://localhost/phpmyadmin
4. **Click:** "Import" tab
5. **Choose File:** `C:\Users\APPLE\Desktop\gsph\backend\database.sql`
6. **Click:** "Go" button
7. **Wait** for success message

---

### Step 3: Verify Database Created

**In MySQL Workbench:**
```sql
SHOW DATABASES;
-- You should see 'gsph_college' in the list

USE gsph_college;
SHOW TABLES;
-- You should see 12 tables
```

**In phpMyAdmin:**
- Look for `gsph_college` in left sidebar
- Click it to see 12 tables

---

### Step 4: Start the Server

**Option A: Double-click**
```
start-server.bat
```

**Option B: Command Line**
```cmd
cd C:\Users\APPLE\Desktop\gsph\backend
node server-mysql.js
```

**Expected Output:**
```admin@gsph.edu
✅ Database connected successfully!
🚀 GSPH College Management System
📡 Server running on: http://localhost:3000
```

---

### Step 5: Access the Application

Open in your browser:

- **🏠 Home Page:** http://localhost:3000
- **👨‍💼 Admin Login:** http://localhost:3000/admin/index.html
- **👨‍🎓 Student Login:** http://localhost:3000/student/student.html

---

## 🔐 Login Credentials

### Admin
- **Email:** ``
- **Password:** `admin123`

### Student
- **Roll:** `CSE22001`
- **Password:** `cseA001`

---

## ❌ Troubleshooting

### Error: "Database connection failed"

**Check:**
1. MySQL service is running
   - **MySQL Workbench:** Services → MySQL80 → Start
   - **XAMPP:** Control Panel → MySQL → Start

2. Password is correct in `.env` file
   - Open: `backend\.env`
   - Verify: `DB_PASSWORD=Sagar#9550`

3. Database exists
   - Run: `SHOW DATABASES;` in MySQL Workbench
   - Should see `gsph_college`

### Error: "Cannot find module 'express'"

**Solution:**
```cmd
cd C:\Users\APPLE\Desktop\gsph\backend
npm install
```

### Error: "Port 3000 already in use"

**Solution:**
- Stop the old server (Ctrl+C)
- Or change PORT in `backend\.env` to 3001

---

## 📊 What's in the Database?

### Sample Data Included:

✅ **5 Branches:** CSE, ECE, MECH, CIVIL, EEE  
✅ **10 Subjects:** Data Structures, DBMS, OS, Networks, ML, etc.  
✅ **5 Teachers:** 1 Admin, 2 HODs, 2 Faculty  
✅ **7 Students:** CSE and ECE students  
✅ **9 Holidays:** 2026 festival calendar  
✅ **2 Notifications:** Welcome messages

### Empty Tables (Ready for Use):

- Attendance (mark attendance from admin panel)
- Marks (enter marks from admin panel)
- Assignments (post assignments)
- Timetable (create schedules)
- Exams (schedule exams)
- Results (publish results)

---

## 🎯 Next Steps After Setup

1. ✅ Login as Admin
2. ✅ Explore the dashboard
3. ✅ Add more students
4. ✅ Mark attendance
5. ✅ Enter marks
6. ✅ Post assignments
7. ✅ Create timetable

---

## 📞 Need Help?

### Check These:

1. **MySQL Running?**
   - Open Task Manager → Services
   - Look for "MySQL80" or "MySQL"
   - Status should be "Running"

2. **Database Created?**
   - Open MySQL Workbench
   - Run: `SHOW DATABASES;`
   - Look for `gsph_college`

3. **Server Running?**
   - Check console for errors
   - Visit: http://localhost:3000/api/health
   - Should show: `{"status":"OK"}`

---

## 🎉 Success Checklist

- [ ] MySQL installed and running
- [ ] Database `gsph_college` created
- [ ] 12 tables visible in database
- [ ] Server started without errors
- [ ] Can access http://localhost:3000
- [ ] Can login as admin
- [ ] Can login as student

---

**All set! Your GSPH College Management System is ready! 🚀**
