# 🎓 GSPH College Management System

Complete College ERP System with MySQL Database Integration

## 📁 Project Structure

```
gsph/
├── backend/
│   ├── server-mysql.js      # MySQL-based backend server
│   ├── server.js            # Old localStorage server (backup)
│   ├── database.sql         # Complete database schema + sample data
│   ├── package.json         # Node.js dependencies
│   ├── .env                 # Database configuration
│   └── README.md            # Backend documentation
├── public/
│   ├── admin/               # Admin dashboard
│   │   ├── index.html       # Admin login
│   │   ├── dashboard.html   # Admin dashboard
│   │   ├── script.js        # Admin JavaScript
│   │   └── style.css        # Admin styles
│   ├── student/             # Student portal
│   │   ├── student.html     # Student login
│   │   ├── dashboard.html   # Student dashboard
│   │   ├── script.js        # Student JavaScript
│   │   └── style.css        # Student styles
│   ├── assets/              # Images and media
│   ├── index.html           # Home page
│   ├── script.js            # Home page JavaScript
│   ├── style.css            # Home page styles
│   └── mobile-responsive.css # Mobile styles
├── config/
│   ├── manifest.json        # PWA manifest
│   └── service-worker.js    # Service worker
├── SETUP-MYSQL.md           # Complete setup guide
├── install.bat              # Auto-install script
└── start-server.bat         # Server start script
```

## 🚀 Quick Start

### Option 1: Automatic Installation

1. Double-click `install.bat`
2. Follow on-screen instructions
3. Install MySQL
4. Run database setup
5. Double-click `start-server.bat`

### Option 2: Manual Installation

See detailed instructions in `SETUP-MYSQL.md`

## ✨ Features

### 👨‍💼 Admin Features
- ✅ Student Management (Add, Edit, Delete)
- ✅ Teacher Management
- ✅ Branch & Subject Management
- ✅ Attendance Tracking (Calendar View)
- ✅ Marks Entry (Internal + Semester)
- ✅ Assignment Posting
- ✅ Timetable Creation
- ✅ Exam Scheduling
- ✅ Result Management
- ✅ Notifications & Announcements
- ✅ Analytics Dashboard with Charts
- ✅ Holiday Management

### 👨‍🎓 Student Features
- ✅ Personal Dashboard
- ✅ Attendance View (Calendar + Percentage)
- ✅ Marks & Results
- ✅ Timetable
- ✅ Assignments
- ✅ Exam Schedule
- ✅ Notifications
- ✅ Profile Management
- ✅ Hall Ticket Download
- ✅ Faculty Directory

### 🎨 Design Features
- ✅ Modern UI with Glassmorphism
- ✅ Fully Responsive (Mobile, Tablet, Desktop)
- ✅ Dark Theme
- ✅ Smooth Animations
- ✅ Loading States
- ✅ Toast Notifications
- ✅ Print-friendly Pages

## 💾 Database

### Technology
- **MySQL 8.0+**
- **12 Tables** with relationships
- **2 Views** for analytics
- **Foreign Keys** with cascade delete
- **Indexes** for performance

### Tables
1. `branches` - Academic departments
2. `subjects` - Course subjects
3. `teachers` - Faculty & admin
4. `students` - Student records
5. `attendance` - Daily attendance
6. `marks` - Internal & semester marks
7. `assignments` - Assignment postings
8. `timetable` - Class schedules
9. `exams` - Exam schedules
10. `results` - Semester results
11. `notifications` - Announcements
12. `holidays` - Holiday calendar

## 🔐 Default Credentials

### Admin
- **Email:** admin@gsph.edu
- **Password:** admin123

### HOD
- **Email:** hod.cse@gsph.edu
- **Password:** hod123

### Teacher
- **Email:** faculty.cse1@gsph.edu
- **Password:** teacher123

### Students
| Roll | Password |
|------|----------|
| CSE22001 | cseA001 |
| CSE22002 | cseA002 |
| CSE22003 | cseB003 |

## 🌐 URLs

- **Home:** http://localhost:3000
- **Admin:** http://localhost:3000/admin/index.html
- **Student:** http://localhost:3000/student/student.html
- **API Health:** http://localhost:3000/api/health

## 📡 API Endpoints

### Authentication
- `POST /api/auth/student/login`
- `POST /api/auth/teacher/login`

### Students
- `GET /api/students`
- `GET /api/students/:roll`
- `POST /api/students`
- `PUT /api/students/:roll`
- `DELETE /api/students/:roll`

### Attendance
- `GET /api/attendance/:roll`
- `POST /api/attendance`
- `GET /api/attendance/:roll/summary`

### Marks
- `GET /api/marks/:roll`
- `POST /api/marks`

### Other Endpoints
- Subjects, Branches, Assignments, Timetable, Exams, Results, Notifications, Holidays, Teachers

See `backend/README.md` for complete API documentation.

## 🛠️ Technologies Used

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Chart.js for analytics
- Font Awesome icons
- Google Fonts

### Backend
- Node.js
- Express.js
- MySQL2
- CORS
- Body-parser
- Dotenv

## 📋 Requirements

- **Node.js** v14+ ([Download](https://nodejs.org/))
- **MySQL** v8.0+ ([Download](https://dev.mysql.com/downloads/mysql/))
- **Modern Browser** (Chrome, Firefox, Edge)

## 🔧 Configuration

Edit `backend/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gsph_college
DB_PORT=3306
PORT=3000
```

## 📖 Documentation

- **Setup Guide:** `SETUP-MYSQL.md`
- **Backend API:** `backend/README.md`
- **Database Schema:** `backend/database.sql`

## 🐛 Troubleshooting

### MySQL Connection Failed
- Verify MySQL service is running
- Check credentials in `.env`
- Ensure database exists

### Port Already in Use
- Change PORT in `.env`
- Or stop conflicting process

### Module Not Found
- Run `npm install` in backend folder

See `SETUP-MYSQL.md` for detailed troubleshooting.

## 🔄 Migration from localStorage

**Current Status:** Backend is ready with MySQL

**Next Step:** Update frontend JavaScript files to use API calls instead of localStorage

**Files to Update:**
- `public/admin/script.js`
- `public/student/script.js`
- `public/script.js`

## 📝 Sample Data Included

- 5 Branches (CSE, ECE, MECH, CIVIL, EEE)
- 10 Subjects
- 5 Teachers (1 Admin, 2 HODs, 2 Teachers)
- 7 Students
- 9 Holidays (2026)
- 2 Notifications

## 🚀 Deployment

### Development
```bash
cd backend
npm run dev
```

### Production
```bash
cd backend
npm start
```

## 📞 Support

For issues:
1. Check MySQL service status
2. Verify database connection
3. Check server logs
4. Test API endpoints

## 📄 License

MIT License - Free to use for educational purposes

## 👨‍💻 Author

GSPH College Development Team

---

**Version:** 2.0.0 (MySQL Edition)  
**Last Updated:** May 2026

🎉 **Ready to use with MySQL database!**
