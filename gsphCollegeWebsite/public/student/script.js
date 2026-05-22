/**
 * =====================================================
 * College Management System - Main JavaScript
 * Uses LocalStorage only (no backend). Beginner notes
 * are included as comments throughout the file.
 * =====================================================
 */

(function () {
  "use strict";

  // ----- Storage key (single JSON blob for the whole app) -----
  var STORAGE_KEY = "cms_college_app_v1";
  var THEME_KEY = "cms_theme";
  var STUDENT_SESSION_KEY = "cms_student_session";
  var ADMIN_SESSION_KEY = "cms_admin_session";

  // ----- Small helpers -----
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function getPage() {
    return (document.body && document.body.getAttribute("data-page")) || "";
  }

  /** Read parsed JSON from localStorage safely */
  function loadRaw() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  /** Save entire app state */
  function saveApp(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function mergeStudentAttendanceCache(roll, data) {
    roll = (roll || "").trim().toUpperCase();
    if (!roll) return data;
    try {
      var raw = localStorage.getItem("cms_daily_attendance_" + roll);
      if (!raw) return data;
      var cached = JSON.parse(raw);
      
      // Initialize if not exists
      data.dailyAttendance = data.dailyAttendance || {};
      data.attendanceMetadata = data.attendanceMetadata || {};
      
      // Merge cached data (admin updates override local)
      data.dailyAttendance[roll] = Object.assign(
        {},
        data.dailyAttendance[roll] || {},
        cached.dailyAttendance || {}
      );
      data.attendanceMetadata[roll] = Object.assign(
        {},
        data.attendanceMetadata[roll] || {},
        cached.attendanceMetadata || {}
      );
      
      // Update last attendance update timestamp
      if (cached.lastAttendanceUpdate) {
        data.lastAttendanceUpdate = cached.lastAttendanceUpdate;
      }
      
      // Log sync for debugging
      console.log("✅ Attendance synced from admin for roll:", roll);
      console.log("Sync timestamp:", cached.syncTimestamp || "N/A");
      
    } catch (e) {
      console.error("Error merging attendance cache:", e);
    }
    return data;
  }

  function adminMarkedAttendanceForDisplay(st, data) {
    var merged = {};
    var own = (data.dailyAttendance && data.dailyAttendance[st.roll]) || {};
    Object.keys(own).forEach(function (dateKey) {
      merged[dateKey] = own[dateKey];
    });

    if (data.dailyAttendance) {
      Object.keys(data.dailyAttendance).forEach(function (roll) {
        Object.keys(data.dailyAttendance[roll] || {}).forEach(function (dateKey) {
          if (data.dailyAttendance[roll][dateKey] === "present" || data.dailyAttendance[roll][dateKey] === "absent") {
            merged[dateKey] = data.dailyAttendance[roll][dateKey];
          }
        });
      });
    }

    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (!key || key.indexOf("cms_daily_attendance_") !== 0) continue;
      try {
        var cached = JSON.parse(localStorage.getItem(key));
        Object.keys(cached.dailyAttendance || {}).forEach(function (dateKey) {
          if (cached.dailyAttendance[dateKey] === "present" || cached.dailyAttendance[dateKey] === "absent") {
            merged[dateKey] = cached.dailyAttendance[dateKey];
          }
        });
      } catch (e) {}
    }

    var latest = latestAttendanceUpdateForStudent(st, data);
    if (latest && latest.date && (latest.status === "present" || latest.status === "absent")) {
      merged[latest.date] = latest.status;
    }

    return merged;
  }

  function renderAttendanceDebug(displayAttendance) {
    var debug = $("#attendance-debug");
    if (!debug) return;
    var entries = Object.keys(displayAttendance)
      .sort()
      .map(function (dateKey) {
        return dateKey + ": " + displayAttendance[dateKey];
      });
    debug.textContent = entries.length
      ? "Admin attendance loaded: " + entries.join(", ")
      : "No admin attendance records found in this student page storage.";
  }

  /** Show a short toast message (success / error / info) */
  function toast(message, type) {
    type = type || "info";
    var box = $("#toast-container");
    if (!box) return;
    var el = document.createElement("div");
    el.className = "toast " + type;
    el.textContent = message;
    box.appendChild(el);
    setTimeout(function () {
      el.remove();
    }, 3200);
  }

  /** Loading overlay: show briefly on heavy pages */
  function showLoading() {
    var o = $("#loader");
    if (o) {
      o.classList.remove("hidden");
    }
  }
  function hideLoading() {
    var o = $("#loader");
    if (o) {
      o.classList.add("hidden");
    }
  }

  /** Apply dark/light theme from saved preference - DISABLED */
  function initTheme(toggleBtnId) {
    // Dark mode disabled - always use light theme
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem(THEME_KEY);
  }

  /** Login pages are always light (no toggle); dashboard still uses saved theme. */
  function initAuthLoginPage() {
    initTheme();
    if (document.body.classList.contains("auth-login-page")) {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  /** Default profile image if URL missing */
  function avatarUrl(seed) {
    return "https://i.pravatar.cc/150?u=" + encodeURIComponent(seed || "student");
  }

  /**
   * Read an image file, resize it, return a JPEG data URL.
   * Keeps LocalStorage smaller than storing huge originals.
   */
  function fileToStudentPhotoDataUrl(file, callback, onError) {
    if (!file || !file.type || file.type.indexOf("image/") !== 0) {
      if (onError) onError(new Error("Pick an image file"));
      return;
    }
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var maxSide = 280;
        var w = img.width;
        var h = img.height;
        var scale = Math.min(maxSide / w, maxSide / h, 1);
        var cw = Math.round(w * scale);
        var ch = Math.round(h * scale);
        var canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, cw, ch);
        try {
          callback(canvas.toDataURL("image/jpeg", 0.82));
        } catch (e) {
          if (onError) onError(e);
        }
      };
      img.onerror = function () {
        if (onError) onError(new Error("Could not load image"));
      };
      img.src = ev.target.result;
    };
    reader.onerror = function () {
      if (onError) onError(new Error("Could not read file"));
    };
    reader.readAsDataURL(file);
  }

  /** Show current student photo in admin add/edit modal */
  function setStudentModalPhotoPreview(url, rollHint) {
    var img = $("#sm-photo-preview");
    if (!img) return;
    img.src = url && String(url).trim() ? url : avatarUrl(rollHint || "new");
    img.style.opacity = url && String(url).trim() ? "1" : "0.85";
  }

  // ----- Default / seed dataset -----
  function defaultAppData() {
    var branches = ["CSE", "ECE", "EEE", "CIVIL", "MECH", "IT", "MBA"];

    var faculty = [
      {
        id: "F1",
        name: "Dr. Ananya Rao",
        photo: avatarUrl("F1"),
        qualification: "Ph.D (CSE), IIT Madras",
        experience: "14 years",
        subjects: ["Data Structures", "Algorithms"],
        email: "ananya.rao@sxit.edu.in",
        phone: "+91-9876500001",
        branch: "CSE",
      },
      {
        id: "F2",
        name: "Prof. Vikram Singh",
        photo: avatarUrl("F2"),
        qualification: "M.Tech (ECE)",
        experience: "10 years",
        subjects: ["Digital Logic", "Microprocessors"],
        email: "vikram.singh@sxit.edu.in",
        phone: "+91-9876500002",
        branch: "ECE",
      },
      {
        id: "F3",
        name: "Dr. Meera Krishnan",
        photo: avatarUrl("F3"),
        qualification: "Ph.D (EEE)",
        experience: "12 years",
        subjects: ["Power Systems", "Machines"],
        email: "meera.krishnan@sxit.edu.in",
        phone: "+91-9876500003",
        branch: "EEE",
      },
      {
        id: "F4",
        name: "Prof. Joseph Mathew",
        photo: avatarUrl("F4"),
        qualification: "M.Tech (Structural)",
        experience: "9 years",
        subjects: ["Strength of Materials"],
        email: "joseph.mathew@sxit.edu.in",
        phone: "+91-9876500004",
        branch: "CIVIL",
      },
      {
        id: "F5",
        name: "Dr. Harini Desai",
        photo: avatarUrl("F5"),
        qualification: "Ph.D (Mechanical)",
        experience: "11 years",
        subjects: ["Thermodynamics", "Fluid Mechanics"],
        email: "harini.desai@sxit.edu.in",
        phone: "+91-9876500005",
        branch: "MECH",
      },
      {
        id: "F6",
        name: "Prof. Rahul Verma",
        photo: avatarUrl("F6"),
        qualification: "M.Tech (IT), MBA",
        experience: "8 years",
        subjects: ["Web Technologies", "Database Systems"],
        email: "rahul.verma@sxit.edu.in",
        phone: "+91-9876500006",
        branch: "IT",
      },
      {
        id: "F7",
        name: "Dr. Susan George",
        photo: avatarUrl("F7"),
        qualification: "Ph.D (Management)",
        experience: "15 years",
        subjects: ["Operations Research", "Marketing"],
        email: "susan.george@sxit.edu.in",
        phone: "+91-9876500007",
        branch: "MBA",
      },
    ];

    var subjects = [
      { code: "CS301", name: "Data Structures", branch: "CSE", semester: 4 },
      { code: "CS302", name: "Operating Systems", branch: "CSE", semester: 4 },
      { code: "EC301", name: "Analog Circuits", branch: "ECE", semester: 4 },
      { code: "EE301", name: "Electrical Machines", branch: "EEE", semester: 4 },
      { code: "CE301", name: "Surveying", branch: "CIVIL", semester: 4 },
      { code: "ME301", name: "Manufacturing", branch: "MECH", semester: 4 },
      { code: "IT301", name: "Cloud Computing", branch: "IT", semester: 4 },
      { code: "MB401", name: "Financial Management", branch: "MBA", semester: 4 },
    ];

    function makeStudent(roll, name, branch, year, section, cgpa, fee, password) {
      var codes = subjects
        .filter(function (s) {
          return s.branch === branch;
        })
        .map(function (s) {
          return s.code;
        });
      if (!codes.length) codes = ["GEN101"];
      return {
        roll: roll,
        password: password || "student123",
        name: name,
        branch: branch,
        year: year,
        section: section,
        photo: avatarUrl(roll),
        email: roll.toLowerCase() + "@student.sxit.edu.in",
        phone: "+91-90000" + roll.slice(-4),
        cgpa: cgpa,
        gpaSem: (cgpa - 0.2 + Math.random() * 0.4).toFixed(2),
        attendancePct: 78 + Math.floor(Math.random() * 18),
        feeStatus: fee || "Paid",
        subjects: codes,
      };
    }

    var students = [
      makeStudent("CSE22001", "Sagar", "CSE", 2, "A", 8.7, "Paid", "cseA001"),
      makeStudent("CSE22002", "Gowtham", "CSE", 2, "A", 8.4, "Paid", "cseA002"),
      makeStudent("CSE22003", "Harsha Prabhakar", "CSE", 2, "B", 7.9, "Due", "cseB003"),
      makeStudent("CSE22004", "Jayasimha Giridhara", "CSE", 2, "B", 8.2, "Paid", "cseB004"),
      makeStudent("ECE22005", "Bharat Simha", "ECE", 2, "A", 8.1, "Paid", "eceA005"),
      makeStudent("ECE22006", "Abhishek", "ECE", 2, "A", 8.6, "Paid", "eceA006"),
      makeStudent("ECE22007", "Sreekar", "ECE", 2, "B", 7.7, "Due", "eceB007"),
      makeStudent("EEE22008", "Vivek", "EEE", 2, "A", 8.3, "Paid", "eeeA008"),
      makeStudent("EEE22009", "Ajay", "EEE", 2, "B", 7.8, "Paid", "eeeB009"),
      makeStudent("EEE22010", "Bhavya", "EEE", 2, "C", 8.5, "Paid", "eeeC010"),
      makeStudent("CIV22011", "Akila", "CIVIL", 2, "A", 7.6, "Due", "civilA011"),
      makeStudent("CIV22012", "Hepsiba", "CIVIL", 2, "B", 8.0, "Paid", "civilB012"),
      makeStudent("CIV22013", "Sandeep", "CIVIL", 2, "C", 7.9, "Paid", "civilC013"),
      makeStudent("MEC22014", "Sujeet", "MECH", 2, "A", 8.2, "Paid", "mechA014"),
      makeStudent("MEC22015", "Siddhu", "MECH", 2, "B", 8.4, "Paid", "mechB015"),
      makeStudent("MEC22016", "Arjun N", "MECH", 2, "C", 7.5, "Due", "mechC016"),
      makeStudent("IT22017", "Pooja K", "IT", 2, "A", 8.8, "Paid", "itA017"),
      makeStudent("IT22018", "Vivek G", "IT", 2, "B", 8.1, "Paid", "itB018"),
      makeStudent("MBA22019", "Ritika Shah", "MBA", 2, "A", 8.0, "Paid", "mbaA019"),
      makeStudent("MBA22020", "Farhan Ali", "MBA", 2, "B", 7.8, "Due", "mbaB020"),
    ];

    var teachers = [
      {
        email: "admin@gsph.edu",
        password: "admin123",
        name: "Principal Admin",
        role: "admin",
        branch: "ALL",
      },
      {
        email: "hod.cse@gsph.edu",
        password: "hod123",
        name: "Dr. CSE HOD",
        role: "hod",
        branch: "CSE",
      },
      {
        email: "faculty.cse1@gsph.edu",
        password: "teacher123",
        name: "Prof. Karthik Menon",
        role: "teacher",
        branch: "CSE",
      },
    ];

    // Per-student maps: subjectCode -> value
    var attendance = {};
    var internalMarks = {};
    var semesterMarks = {};
    students.forEach(function (student, studentIndex) {
      attendance[student.roll] = {};
      internalMarks[student.roll] = {};
      semesterMarks[student.roll] = {};
      student.subjects.forEach(function (code, subjectIndex) {
        var base = 74 + ((studentIndex * 5 + subjectIndex * 4) % 20);
        attendance[student.roll][code] = Math.min(base, 96);
        internalMarks[student.roll][code] = 20 + ((studentIndex + subjectIndex * 2) % 10);
        semesterMarks[student.roll][code] = 46 + ((studentIndex * 3 + subjectIndex * 5) % 21);
      });
    });

    var timetable = {
      "CSE-2-A": [
        {
          day: "Monday",
          slot: "09:00 - 10:00",
          subject: "Data Structures",
          room: "LH-201",
          faculty: "Dr. Ananya Rao",
        },
        {
          day: "Tuesday",
          slot: "10:00 - 11:00",
          subject: "Operating Systems",
          room: "LH-105",
          faculty: "Prof. Karthik Menon",
        },
        {
          day: "Wednesday",
          slot: "09:00 - 10:00",
          subject: "Data Structures Lab",
          room: "Lab-3",
          faculty: "Dr. Ananya Rao",
        },
      ],
    };

    var exams = [
      {
        id: "EX1",
        subject: "Data Structures",
        date: "2026-05-28",
        time: "10:00 AM",
        branch: "CSE",
        year: 2,
        hall: "Main Auditorium",
      },
      {
        id: "EX2",
        subject: "Operating Systems",
        date: "2026-05-30",
        time: "10:00 AM",
        branch: "CSE",
        year: 2,
        hall: "LH-201",
      },
    ];

    var notifications = [
      {
        id: "N1",
        title: "Semester fee deadline",
        body: "Last date for Sem 4 fee payment is 20 May 2026.",
        date: "2026-05-10",
        audience: "all",
        branch: "",
      },
      {
        id: "N2",
        title: "CSE coding contest",
        body: "Inter-class hackathon on 18 May in Lab-2.",
        date: "2026-05-12",
        audience: "branch",
        branch: "CSE",
      },
    ];

    var assignments = [
      {
        id: "A1",
        title: "Binary tree traversal program",
        branch: "CSE",
        subject: "CS301",
        due: "2026-05-22",
        description: "Implement in-order, pre-order, post-order in C/Java.",
      },
      {
        id: "A2",
        title: "OS scheduling simulation",
        branch: "CSE",
        subject: "CS302",
        due: "2026-05-25",
        description: "Simulate FCFS and Round Robin with sample input.",
      },
    ];

    var library = {};
    var hostel = {};
    var bus = {};
    // No default student data - will be populated when admin adds students

    var placement = [
      {
        company: "TechNova Labs",
        role: "SDE Intern",
        date: "2026-06-05",
        eligibility: "CSE, IT — CGPA 7.5+",
      },
      {
        company: "BuildRight Infra",
        role: "Graduate Engineer",
        date: "2026-06-10",
        eligibility: "CIVIL, MECH",
      },
    ];

    var results = students.map(function (student, index) {
      return {
        roll: student.roll,
        semester: "Sem 4",
        sgpa: Math.max(6.8, Math.min(9.6, Number(student.cgpa) - 0.15 + ((index % 5) * 0.08))).toFixed(2),
        status: Number(student.cgpa) >= 7 ? "Pass" : "Review",
      };
    });

    return {
      branches: branches,
      faculty: faculty,
      subjects: subjects,
      students: students,
      teachers: teachers,
      attendance: attendance,
      internalMarks: internalMarks,
      semesterMarks: semesterMarks,
      timetable: timetable,
      exams: exams,
      notifications: notifications,
      assignments: assignments,
      library: library,
      hostel: hostel,
      bus: bus,
      placement: placement,
      results: results,
      dailyAttendance: {},
      attendanceMetadata: {},
      lastAttendanceUpdate: null,
    };
  }

  function ensureAppData() {
    var data = loadRaw();
    if (!data || !data.students || !data.students.length) {
      data = defaultAppData();
      saveApp(data);
    } else {
      var defaults = defaultAppData();
      // Light migration: ensure keys exist
      data.branches = data.branches || defaults.branches;
      data.faculty = data.faculty || defaults.faculty;
      // Only update teachers if they don't exist
      if (!data.teachers || data.teachers.length === 0) {
        data.teachers = defaults.teachers;
      }
      // Only add missing default students, don't replace existing ones
      defaults.students.forEach(function (student) {
        var exists = data.students.some(function (s) {
          return s.roll === student.roll;
        });
        if (!exists) data.students.push(student);
      });
      data.attendance = data.attendance || {};
      data.internalMarks = data.internalMarks || {};
      data.semesterMarks = data.semesterMarks || {};
      data.timetable = data.timetable || {};
      data.exams = data.exams || [];
      data.notifications = data.notifications || [];
      data.assignments = data.assignments || [];
      data.library = data.library || {};
      data.hostel = data.hostel || {};
      data.bus = data.bus || {};
      data.placement = data.placement || [];
      data.results = data.results || [];
      data.dailyAttendance = data.dailyAttendance || {};
      data.attendanceMetadata = data.attendanceMetadata || {};
      data.lastAttendanceUpdate = data.lastAttendanceUpdate || null;
      defaults.students.forEach(function (student) {
        data.attendance[student.roll] = data.attendance[student.roll] || defaults.attendance[student.roll] || {};
        data.internalMarks[student.roll] =
          data.internalMarks[student.roll] || defaults.internalMarks[student.roll] || {};
        data.semesterMarks[student.roll] =
          data.semesterMarks[student.roll] || defaults.semesterMarks[student.roll] || {};
        var hasResult = data.results.some(function (result) {
          return result.roll === student.roll && result.semester === "Sem 4";
        });
        if (!hasResult) {
          var defaultResult = defaults.results.find(function (result) {
            return result.roll === student.roll;
          });
          if (defaultResult) data.results.push(defaultResult);
        }
      });
      saveApp(data);
    }
    return data;
  }

  function getStudentSession() {
    try {
      var s = localStorage.getItem(STUDENT_SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  }
  function setStudentSession(roll) {
    localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify({ roll: roll }));
  }
  function clearStudentSession() {
    localStorage.removeItem(STUDENT_SESSION_KEY);
  }

  function getAdminSession() {
    try {
      var s = localStorage.getItem(ADMIN_SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  }
  function setAdminSession(obj) {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(obj));
  }
  function clearAdminSession() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }

  function findStudent(roll) {
    var data = ensureAppData();
    roll = (roll || "").trim().toUpperCase();
    for (var i = 0; i < data.students.length; i++) {
      if (data.students[i].roll.toUpperCase() === roll) return data.students[i];
    }
    return null;
  }

  function ttKey(st) {
    return st.branch + "-" + st.year + "-" + st.section;
  }

  // ----- Student login page -----
  function initStudentLogin() {
    initAuthLoginPage();
    var form = $("#student-login-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      ensureAppData();
      var roll = $("#roll").value.trim().toUpperCase();
      var pass = $("#password").value;
      var st = findStudent(roll);
      if (!st || st.password !== pass) {
        toast("Invalid roll number or password", "error");
        return;
      }
      showLoading();
      setStudentSession(st.roll);
      // Set flag to prevent double loader on dashboard
      sessionStorage.setItem('justLoggedIn', 'true');
      setTimeout(function () {
        window.location.href = "dashboard.html";
      }, 400);
    });
  }

  // ----- Admin login -----
  function initAdminLogin() {
    initAuthLoginPage();
    var form = $("#admin-login-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = ensureAppData();
      var email = $("#email").value.trim().toLowerCase();
      var pass = $("#admin-password").value;
      var found = null;
      for (var i = 0; i < data.teachers.length; i++) {
        if (
          data.teachers[i].email.toLowerCase() === email &&
          data.teachers[i].password === pass
        ) {
          found = data.teachers[i];
          break;
        }
      }
      if (!found) {
        toast("Invalid email or password", "error");
        return;
      }
      showLoading();
      setAdminSession({
        email: found.email,
        name: found.name,
        role: found.role,
        branch: found.branch,
      });
      setTimeout(function () {
        window.location.href = "dashboard.html";
      }, 400);
    });
  }

  // ----- Student dashboard -----
  function studentRequireAuth() {
    var s = getStudentSession();
    if (!s || !s.roll) {
      window.location.href = "student-login.html";
      return null;
    }
    var st = findStudent(s.roll);
    if (!st) {
      clearStudentSession();
      window.location.href = "student-login.html";
      return null;
    }
    return st;
  }

  function switchStudentSection(id) {
    $all(".page-section").forEach(function (sec) {
      sec.classList.add("hidden");
    });
    var target = $("#sec-" + id);
    if (target) target.classList.remove("hidden");
    $all("#student-nav a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-section") === id);
    });
    if (window.innerWidth <= 900) {
      $("#sidebar").classList.remove("open");
      $("#sidebar-overlay").classList.remove("show");
    }
  }

  function renderStudentHome(st, data) {
    var hero = $("#student-profile-hero");
    if (hero) {
      var pic = st.photo || avatarUrl(st.roll);
      hero.innerHTML =
        '<img src="' +
        escapeHtml(pic) +
        '" alt="Photo" onerror="this.onerror=null;this.src=\'' +
        avatarUrl(st.roll).replace(/'/g, "\\'") +
        '\'" />' +
        '<div class="profile-meta">' +
        "<h2>" +
        escapeHtml(st.name) +
        "</h2>" +
        '<div class="profile-tags">' +
        '<span class="tag">' +
        escapeHtml(st.roll) +
        "</span>" +
        '<span class="tag">' +
        escapeHtml(st.branch) +
        "</span>" +
        '<span class="tag">Year ' +
        st.year +
        "</span>" +
        '<span class="tag">Sec ' +
        escapeHtml(st.section) +
        "</span>" +
        "</div>" +
        "<p style='color:var(--text-muted)'>" +
        escapeHtml(st.email) +
        "</p>" +
        "</div>";
    }

    var pct = overallAttendance(st.roll, data);
    var stats = $("#student-quick-stats");
    if (stats) {
      stats.innerHTML =
        cardHtml("Attendance", pct + "%", "Overall this semester") +
        cardHtml("CGPA", st.cgpa, "Cumulative") +
        cardHtml("GPA (sem)", st.gpaSem, "Current semester") +
        cardHtml("Fees", st.feeStatus, "Finance desk");
    }

    var notifs = notifsForStudent(st, data).slice(0, 4);
    var hn = $("#student-home-notifications");
    if (hn) {
      hn.innerHTML = notifs.length
        ? notifs
            .map(function (n) {
              return (
                "<li><strong>" +
                escapeHtml(n.title) +
                "</strong><div class='date'>" +
                escapeHtml(n.date) +
                "</div>" +
                escapeHtml(n.body) +
                "</li>"
              );
            })
            .join("")
        : "<li>No notifications.</li>";
    }

    var ex = examsForStudent(st, data)
      .sort(function (a, b) {
        return a.date.localeCompare(b.date);
      })
      .slice(0, 4);
    var he = $("#student-home-exams");
    if (he) {
      he.innerHTML = ex.length
        ? "<ul class='notif-list'>" +
          ex
            .map(function (x) {
              return (
                "<li><strong>" +
                escapeHtml(x.subject) +
                "</strong><div class='date'>" +
                escapeHtml(x.date) +
                " &middot; " +
                escapeHtml(x.time) +
                "</div>Hall: " +
                escapeHtml(x.hall) +
                "</li>"
              );
            })
            .join("") +
          "</ul>"
        : "<p style='color:var(--text-muted)'>No upcoming exams.</p>";
    }

    var key = ttKey(st);
    var slots = data.timetable[key] || [];
    var todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
      new Date().getDay()
    ];
    var todaySlots = slots.filter(function (s) {
      return s.day === todayName;
    });
    var ht = $("#student-home-timetable");
    if (ht) {
      ht.innerHTML = todaySlots.length
        ? "<ul class='notif-list'>" +
          todaySlots
            .map(function (s) {
              return (
                "<li><strong>" +
                escapeHtml(s.subject) +
                "</strong><div class='date'>" +
                escapeHtml(s.slot) +
                " &middot; " +
                escapeHtml(s.room) +
                "</div></li>"
              );
            })
            .join("") +
          "</ul>"
        : "<p style='color:var(--text-muted)'>No slots today for <code>" +
          escapeHtml(key) +
          "</code>. Showing first weekly row.</p>" +
        (slots[0]
          ? "<ul class='notif-list'><li><strong>" +
            escapeHtml(slots[0].subject) +
            "</strong><div class='date'>" +
            escapeHtml(slots[0].day) +
            " " +
            escapeHtml(slots[0].slot) +
            "</div></li></ul>"
          : "");
    }

    var subj = $("#student-home-subjects");
    if (subj) {
      subj.innerHTML =
        "<ul class='notif-list'>" +
        st.subjects
          .map(function (c) {
            var name = subjectName(data, c);
            return (
              "<li><strong>" +
              escapeHtml(name) +
              "</strong><div class='date'>Code: " +
              escapeHtml(c) +
              "</div></li>"
            );
          })
          .join("") +
        "</ul>";
    }

    var lib = data.library[st.roll] || { booksIssued: 0, dueDate: "-", fine: 0 };
    $("#student-home-library").innerHTML =
      "<p><strong>Books on loan:</strong> " +
      lib.booksIssued +
      "</p>" +
      "<p><strong>Next due:</strong> " +
      escapeHtml(lib.dueDate) +
      "</p>" +
      "<p><strong>Fine:</strong> ₹" +
      lib.fine +
      "</p>";

    var ho = data.hostel[st.roll] || {};
    var bu = data.bus[st.roll] || {};
    $("#student-home-hostel-bus").innerHTML =
      "<p><strong>Hostel:</strong> Block " +
      escapeHtml(ho.block || "-") +
      ", Room " +
      escapeHtml(ho.room || "-") +
      "</p>" +
      "<p><strong>Warden:</strong> " +
      escapeHtml(ho.warden || "-") +
      "</p>" +
      "<hr style='border:0;border-top:1px solid var(--border);margin:0.75rem 0' />" +
      "<p><strong>Bus route:</strong> " +
      escapeHtml(bu.route || "-") +
      "</p>" +
      "<p><strong>Pickup:</strong> " +
      escapeHtml(bu.stop || "-") +
      " @ " +
      escapeHtml(bu.time || "-") +
      "</p>";

    var pl = $("#student-home-placement");
    if (pl) {
      pl.innerHTML =
        "<ul class='notif-list'>" +
        data.placement
          .map(function (p) {
            return (
              "<li><strong>" +
              escapeHtml(p.company) +
              "</strong> — " +
              escapeHtml(p.role) +
              "<div class='date'>" +
              escapeHtml(p.date) +
              " &middot; " +
              escapeHtml(p.eligibility) +
              "</div></li>"
            );
          })
          .join("") +
        "</ul>";
    }
  }

  function cardHtml(label, value, sub) {
    return (
      '<div class="stat-card"><div class="label">' +
      escapeHtml(label) +
      '</div><div class="value">' +
      escapeHtml(String(value)) +
      '</div><div class="sub">' +
      escapeHtml(sub) +
      "</div></div>"
    );
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function overallAttendance(roll, data) {
    var map = data.attendance[roll] || {};
    var keys = Object.keys(map);
    if (!keys.length) return "—";
    var sum = 0;
    keys.forEach(function (k) {
      sum += Number(map[k]) || 0;
    });
    return Math.round(sum / keys.length);
  }

  function syncDailyAttendanceSummary(roll, data) {
    data.attendance = data.attendance || {};
    data.dailyAttendance = data.dailyAttendance || {};
    data.attendance[roll] = data.attendance[roll] || {};

    roll = (roll || "").trim().toUpperCase();
    var student = null;
    for (var i = 0; i < data.students.length; i++) {
      if (data.students[i].roll.toUpperCase() === roll) {
        student = data.students[i];
        break;
      }
    }
    if (!student) return;

    var marked = data.dailyAttendance[roll] || {};
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var present = 0;
    var working = 0;

    Object.keys(marked).forEach(function (dateKey) {
      var parts = dateKey.split("-");
      var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      var day = date.getDay();
      var isHoliday =
        day === 0 || day === 6 || !!attendanceHoliday(Number(parts[1]), Number(parts[2]));
      var status = marked[dateKey];

      if (date > today || isHoliday || (status !== "present" && status !== "absent")) return;
      working++;
      if (status === "present") present++;
    });

    var percentage = working > 0 ? Math.round((present / working) * 100) : 0;
    student.attendancePct = percentage;
    student.subjects.forEach(function (code) {
      data.attendance[roll][code] = percentage;
    });
  }

  function subjectName(data, code) {
    for (var i = 0; i < data.subjects.length; i++) {
      if (data.subjects[i].code === code) return data.subjects[i].name;
    }
    return code;
  }

  function notifsForStudent(st, data) {
    return data.notifications.filter(function (n) {
      if (n.audience === "all") return true;
      if (n.audience === "branch" && n.branch === st.branch) return true;
      return false;
    });
  }

  function examsForStudent(st, data) {
    return data.exams.filter(function (ex) {
      return ex.branch === st.branch && Number(ex.year) === Number(st.year);
    });
  }

  function attendanceHoliday(month, day) {
    var holiday = attendanceHolidayList().filter(function (h) {
      return h.month === month && h.day === day;
    })[0];
    return holiday || null;
  }

  function attendanceHolidayList() {
    return [
      { month: 1, day: 1, name: "New Year", image: "https://images.unsplash.com/photo-1482517967863-00e15c9b44be?q=80&w=600&auto=format&fit=crop" },
      { month: 1, day: 14, name: "Sankranti", image: "https://images.unsplash.com/photo-1606298855672-3efb63017be8?q=80&w=600&auto=format&fit=crop" },
      { month: 1, day: 26, name: "Republic Day", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=600&auto=format&fit=crop" },
      { month: 2, day: 15, name: "Maha Shivaratri", image: "https://images.unsplash.com/photo-1626695436755-3d754b851d7a?q=80&w=600&auto=format&fit=crop" },
      { month: 3, day: 4, name: "Holi", image: "https://images.unsplash.com/photo-1617040619263-41c5a9ca7521?q=80&w=600&auto=format&fit=crop" },
      { month: 3, day: 19, name: "Ugadi", image: "https://images.unsplash.com/photo-1606298855672-3efb63017be8?q=80&w=600&auto=format&fit=crop" },
      { month: 3, day: 20, name: "Eid-ul-Fitr", image: "https://images.unsplash.com/photo-1564769625905-50e93615e769?q=80&w=600&auto=format&fit=crop" },
      { month: 4, day: 3, name: "Good Friday", image: "https://images.unsplash.com/photo-1528357136257-0c25517acfea?q=80&w=600&auto=format&fit=crop" },
      { month: 4, day: 14, name: "Ambedkar Jayanti", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=600&auto=format&fit=crop" },
      { month: 5, day: 1, name: "May Day", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop" },
      { month: 8, day: 15, name: "Independence Day", image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=600&auto=format&fit=crop" },
      { month: 8, day: 26, name: "Varalakshmi Vratam", image: "https://images.unsplash.com/photo-1606298855672-3efb63017be8?q=80&w=600&auto=format&fit=crop" },
      { month: 9, day: 14, name: "Vinayaka Chavithi", image: "https://images.unsplash.com/photo-1577083552431-6e5fd75fcfb1?q=80&w=600&auto=format&fit=crop" },
      { month: 10, day: 2, name: "Gandhi Jayanti", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=600&auto=format&fit=crop" },
      { month: 10, day: 20, name: "Dussehra", image: "https://images.unsplash.com/photo-1606298855672-3efb63017be8?q=80&w=600&auto=format&fit=crop" },
      { month: 11, day: 8, name: "Diwali", image: "https://images.unsplash.com/photo-1604423043492-4135db35b67b?q=80&w=600&auto=format&fit=crop" },
      { month: 12, day: 25, name: "Christmas", image: "https://images.unsplash.com/photo-1482517967863-00e15c9b44be?q=80&w=600&auto=format&fit=crop" },
    ];
  }

  function renderHolidayYearOverview(listId, countId) {
    var list = $("#" + listId);
    var count = $("#" + countId);
    if (!list) return;
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var holidays = attendanceHolidayList();
    if (count) count.textContent = holidays.length + " holidays";
    list.innerHTML = holidays
      .map(function (h) {
        return (
          '<div class="holiday-year-card" style="background-image: linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0.18)), url(\'' +
          h.image +
          "')\">" +
          '<div class="holiday-year-date"><strong>' +
          h.day +
          "</strong><span>" +
          monthNames[h.month - 1] +
          "</span></div><div class=\"holiday-year-name\">" +
          escapeHtml(h.name) +
          "</div></div>"
        );
      })
      .join("");
  }

  function fillAttendanceTable(st, data) {
    var tb = $("#attendance-table tbody");
    if (!tb) return;
    mergeStudentAttendanceCache(st.roll, data);
    syncDailyAttendanceSummary(st.roll, data);
    $("#attendance-overall").textContent = overallAttendance(st.roll, data) + "%";
    renderLatestAttendanceApproval(st, data);
    tb.innerHTML = "";
    st.subjects.forEach(function (code) {
      var tr = document.createElement("tr");
      var pct = data.attendance[st.roll] && data.attendance[st.roll][code];
      tr.innerHTML =
        "<td>" +
        escapeHtml(subjectName(data, code)) +
        "</td><td>" +
        escapeHtml(code) +
        "</td><td>" +
        (pct != null ? pct + "%" : "—") +
        "</td>";
      tb.appendChild(tr);
    });
    
    // Render attendance calendar
    renderAttendanceCalendar(st, data);
    renderHolidayYearOverview("student-holiday-year-list", "student-holiday-count");
  }

  function latestAttendanceUpdateForStudent(st, data) {
    var latest = data.lastAttendanceUpdate || null;
    try {
      var marker = localStorage.getItem("cms_last_attendance_update");
      if (marker) latest = JSON.parse(marker);
    } catch (e) {}

    if (latest && latest.roll) return latest;

    var records = (data.dailyAttendance && data.dailyAttendance[st.roll]) || {};
    var dates = Object.keys(records)
      .filter(function (dateKey) {
        return records[dateKey] === "present" || records[dateKey] === "absent";
      })
      .sort();
    if (!dates.length) return null;
    var lastDate = dates[dates.length - 1];
    return {
      roll: st.roll,
      date: lastDate,
      status: records[lastDate],
      updatedAt: null
    };
  }

  function renderLatestAttendanceApproval(st, data) {
    var box = $("#latest-attendance-approval");
    if (!box) return;
    var latest = latestAttendanceUpdateForStudent(st, data);
    if (!latest) {
      box.classList.add("hidden");
      box.innerHTML = "";
      return;
    }

    var status = latest.status === "present" ? "Present" : latest.status === "absent" ? "Absent" : "Unmarked";
    var cls = latest.status === "present" ? "present" : latest.status === "absent" ? "absent" : "future";
    box.classList.remove("hidden");
    box.innerHTML =
      '<div class="attendance-approval-card">' +
      '<div><div class="label">Latest admin approval</div>' +
      '<strong>' + escapeHtml(latest.date) + '</strong></div>' +
      '<span class="attendance-approval-status ' + cls + '">' + escapeHtml(status) + '</span>' +
      '</div>';
  }

  function renderAttendanceCalendar(st, data) {
    var cal = $("#attendance-calendar");
    if (!cal) return;
    mergeStudentAttendanceCache(st.roll, data);
    syncDailyAttendanceSummary(st.roll, data);
    
    var now = new Date();
    var latest = latestAttendanceUpdateForStudent(st, data);
    var displayDate = latest && latest.date ? new Date(latest.date + "T00:00:00") : now;
    var currentMonth = displayDate.getMonth();
    var currentYear = displayDate.getFullYear();
    var today = now.getDate();
    
    // Get first day of month and total days
    var firstDay = new Date(currentYear, currentMonth, 1).getDay();
    var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Initialize daily attendance if not exists
    if (!data.dailyAttendance) data.dailyAttendance = {};
    if (!data.dailyAttendance[st.roll]) data.dailyAttendance[st.roll] = {};
    var displayAttendance = adminMarkedAttendanceForDisplay(st, data);
    renderAttendanceDebug(displayAttendance);
    
    var html = "";
    
    // Add month header
    var monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
    html += '<div class="calendar-header" style="grid-column: 1 / -1;">';
    html += '<div class="calendar-month">' + monthNames[currentMonth] + ' ' + currentYear + '</div>';
    html += '</div>';
    
    // Add day headers
    var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dayNames.forEach(function(day) {
      html += '<div class="calendar-day-header">' + day + '</div>';
    });
    
    // Add empty cells for days before month starts
    for (var i = 0; i < firstDay; i++) {
      html += '<div class="calendar-day empty"></div>';
    }
    
    // Count for percentage calculation
    var presentCount = 0;
    var absentCount = 0;
    var workingDays = 0;
    
    // Add days of the month with real attendance status
    for (var day = 1; day <= daysInMonth; day++) {
      var dateKey = currentYear + "-" + String(currentMonth + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
      var checkDate = new Date(currentYear, currentMonth, day);
      var dayOfWeek = checkDate.getDay();
      var isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      var holiday = attendanceHoliday(currentMonth + 1, day);
      var isHoliday = isWeekend || !!holiday;
      var isFuture = checkDate > now;
      
      var status;
      
      // Check real attendance data from admin
      if (displayAttendance[dateKey]) {
        status = displayAttendance[dateKey];
      } else if (latest && latest.date === dateKey && (latest.status === "present" || latest.status === "absent")) {
        status = latest.status;
      } else if (isHoliday) {
        status = "holiday";
      } else if (isFuture) {
        status = "future";
      } else {
        // Past working day but not marked - show as unmarked
        status = "future";
      }
      
      // Count for statistics (only past working days)
      if (!isHoliday && !isFuture) {
        workingDays++;
        if (status === "present") presentCount++;
        if (status === "absent") absentCount++;
      }
      
      var classes = "calendar-day " + status;
      if (day === today) classes += " today";
      
      var dayTitle = holiday ? holiday.name : (isWeekend ? "Weekend Holiday" : day + " " + monthNames[currentMonth]);
      var holidayStyle = holiday && holiday.image
        ? ' style="background-image: linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0.18)), url(\'' + holiday.image + '\')"'
        : "";
      html += '<div class="' + classes + '" title="' + escapeHtml(dayTitle) + '"' + holidayStyle + '>';
      html += '<div class="calendar-day-number">' + day + '</div>';
      if (status === "holiday") {
        html += '<div class="calendar-day-status">' + escapeHtml(holiday ? holiday.name : "Holiday") + '</div>';
      } else if (status !== "future" && status !== "empty") {
        html += '<div class="calendar-day-status">' + status + '</div>';
      }
      html += '</div>';
    }
    
    cal.innerHTML = html;
    
    // Calculate and display percentage
    var percentage = workingDays > 0 ? Math.round((presentCount / workingDays) * 100) : 0;
    
    // Add legend with statistics
    var legend = '<div class="calendar-legend" style="grid-column: 1 / -1;">';
    legend += '<div class="legend-item"><div class="legend-color present"></div><span>Present (' + presentCount + ')</span></div>';
    legend += '<div class="legend-item"><div class="legend-color absent"></div><span>Absent (' + absentCount + ')</span></div>';
    legend += '<div class="legend-item"><div class="legend-color holiday"></div><span>Holiday</span></div>';
    legend += '<div class="legend-item"><div class="legend-color future"></div><span>Not Marked</span></div>';
    legend += '</div>';
    
    // Add monthly summary
    legend += '<div style="grid-column: 1 / -1; margin-top: 1rem; padding: 1rem; background: var(--surface-2); border-radius: 8px;">';
    legend += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; text-align: center;">';
    legend += '<div><div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Present</div>';
    legend += '<div style="font-size: 1.5rem; font-weight: 700; color: var(--success);">' + presentCount + '</div></div>';
    legend += '<div><div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Absent</div>';
    legend += '<div style="font-size: 1.5rem; font-weight: 700; color: var(--danger);">' + absentCount + '</div></div>';
    legend += '<div><div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Working Days</div>';
    legend += '<div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">' + workingDays + '</div></div>';
    legend += '<div><div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Attendance %</div>';
    legend += '<div style="font-size: 1.8rem; font-weight: 800; color: var(--accent);">' + percentage + '%</div></div>';
    legend += '</div></div>';
    
    cal.innerHTML += legend;
  }

  function getAttendanceStatus(day, month, year, today) {
    // This function is no longer used - kept for compatibility
    return "future";
  }

  function fillMarksTable(st, data) {
    var tb = $("#marks-table tbody");
    if (!tb) return;
    tb.innerHTML = "";
    st.subjects.forEach(function (code) {
      var tr = document.createElement("tr");
      var im =
        data.internalMarks[st.roll] && data.internalMarks[st.roll][code] != null
          ? data.internalMarks[st.roll][code]
          : "—";
      var sm =
        data.semesterMarks[st.roll] && data.semesterMarks[st.roll][code] != null
          ? data.semesterMarks[st.roll][code]
          : "—";
      tr.innerHTML =
        "<td>" +
        escapeHtml(subjectName(data, code)) +
        "</td><td>" +
        escapeHtml(code) +
        "</td><td>" +
        im +
        "</td><td>" +
        sm +
        "</td>";
      tb.appendChild(tr);
    });
  }

  function fillTimetable(st, data) {
    var tb = $("#timetable-table tbody");
    if (!tb) return;
    tb.innerHTML = "";
    var rows = data.timetable[ttKey(st)] || [];
    if (!rows.length) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        '<td colspan="5">No timetable for group <strong>' +
        escapeHtml(ttKey(st)) +
        "</strong>. Ask admin to create one.</td>";
      tb.appendChild(tr);
      return;
    }
    rows.forEach(function (r) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" +
        escapeHtml(r.day) +
        "</td><td>" +
        escapeHtml(r.slot) +
        "</td><td>" +
        escapeHtml(r.subject) +
        "</td><td>" +
        escapeHtml(r.room) +
        "</td><td>" +
        escapeHtml(r.faculty) +
        "</td>";
      tb.appendChild(tr);
    });
  }

  function fillAssignments(st, data) {
    var box = $("#assignments-list");
    if (!box) return;
    var list = data.assignments.filter(function (a) {
      return a.branch === st.branch;
    });
    box.innerHTML = list.length
      ? list
          .map(function (a) {
            return (
              '<div class="panel" style="margin-bottom:0.75rem">' +
              "<h3 style='margin:0 0 0.35rem;font-size:1rem'>" +
              escapeHtml(a.title) +
              "</h3>" +
              "<div style='font-size:0.85rem;color:var(--text-muted)'>Due: " +
              escapeHtml(a.due) +
              " &middot; " +
              escapeHtml(a.subject) +
              "</div>" +
              "<p style='margin:0.5rem 0 0'>" +
              escapeHtml(a.description || "") +
              "</p>" +
              "</div>"
            );
          })
          .join("")
      : "<p style='color:var(--text-muted)'>No assignments for your branch.</p>";
  }

  function fillFaculty(st, data) {
    var grid = $("#faculty-grid");
    if (!grid) return;
    var fac = data.faculty.filter(function (f) {
      return f.branch === st.branch;
    });
    if (!fac.length) fac = data.faculty;
    grid.innerHTML = fac
      .map(function (f) {
        return (
          '<div class="faculty-card">' +
          '<img src="' +
          escapeHtml(f.photo) +
          '" alt="" />' +
          "<div>" +
          "<strong>" +
          escapeHtml(f.name) +
          "</strong>" +
          "<div style='font-size:0.85rem;color:var(--text-muted)'>" +
          escapeHtml(f.qualification) +
          "</div>" +
          "<div style='font-size:0.85rem;margin-top:0.35rem'><strong>Exp:</strong> " +
          escapeHtml(f.experience) +
          "</div>" +
          "<div style='font-size:0.85rem'><strong>Subjects:</strong> " +
          escapeHtml(f.subjects.join(", ")) +
          "</div>" +
          "<div style='font-size:0.85rem'><strong>Email:</strong> " +
          escapeHtml(f.email) +
          "</div>" +
          "<div style='font-size:0.85rem'><strong>Phone:</strong> " +
          escapeHtml(f.phone) +
          "</div>" +
          "</div></div>"
        );
      })
      .join("");
  }

  function fillResults(st, data) {
    var tb = $("#results-table tbody");
    if (!tb) return;
    tb.innerHTML = "";
    var rows = data.results.filter(function (r) {
      return r.roll === st.roll;
    });
    if (!rows.length) {
      var tr = document.createElement("tr");
      tr.innerHTML = '<td colspan="3">No results uploaded yet.</td>';
      tb.appendChild(tr);
      return;
    }
    rows.forEach(function (r) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" +
        escapeHtml(r.semester) +
        "</td><td>" +
        escapeHtml(String(r.sgpa)) +
        "</td><td>" +
        escapeHtml(r.status) +
        "</td>";
      tb.appendChild(tr);
    });
  }

  function fillNotificationsFull(st, data) {
    var ul = $("#notifications-full");
    if (!ul) return;
    var list = notifsForStudent(st, data).sort(function (a, b) {
      return b.date.localeCompare(a.date);
    });
    ul.innerHTML = list.length
      ? list
          .map(function (n) {
            return (
              "<li><strong>" +
              escapeHtml(n.title) +
              "</strong><div class='date'>" +
              escapeHtml(n.date) +
              "</div>" +
              escapeHtml(n.body) +
              "</li>"
            );
          })
          .join("")
      : "<li>No notifications.</li>";
  }

  function initStudentDashboard() {
    initTheme("theme-toggle");
    var st = studentRequireAuth();
    if (!st) return;

    setTimeout(function () {
      hideLoading();
    }, 500);

    var data = ensureAppData();
    function refreshStudentDashboard() {
      data = ensureAppData();
      st = findStudent(st.roll) || st;
      mergeStudentAttendanceCache(st.roll, data);
      syncDailyAttendanceSummary(st.roll, data);
      renderStudentHome(st, data);
      fillAttendanceTable(st, data);
      fillMarksTable(st, data);
      fillTimetable(st, data);
      fillAssignments(st, data);
      fillFaculty(st, data);
      fillResults(st, data);
      fillNotificationsFull(st, data);
    }

    refreshStudentDashboard();
    
    // Listen for localStorage changes (cross-tab sync)
    window.addEventListener('storage', function(e) {
      if (e.key && e.key.indexOf('cms_daily_attendance_') === 0) {
        console.log('🔄 Attendance update detected from admin!');
        toast('Attendance updated by admin', 'info');
        refreshStudentDashboard();
      } else if (e.key === 'cms_app_data') {
        console.log('🔄 App data updated!');
        refreshStudentDashboard();
      }
    });
    
    // Auto-refresh every 30 seconds to catch updates
    setInterval(function() {
      var currentSyncTime = localStorage.getItem('cms_attendance_sync_time');
      if (currentSyncTime && currentSyncTime !== window.lastSyncTime) {
        console.log('🔄 Auto-refresh: New attendance data detected');
        window.lastSyncTime = currentSyncTime;
        refreshStudentDashboard();
      }
    }, 30000);

    // Profile form defaults
    $("#pf-name").value = st.name;
    $("#pf-email").value = st.email || "";
    $("#pf-phone").value = st.phone || "";
    $("#pf-photo").value = st.photo || "";

    $("#student-nav").addEventListener("click", function (e) {
      var a = e.target.closest("a[data-section]");
      if (!a) return;
      e.preventDefault();
      switchStudentSection(a.getAttribute("data-section"));
    });

    $("#menu-toggle").addEventListener("click", function () {
      $("#sidebar").classList.toggle("open");
      $("#sidebar-overlay").classList.toggle("show");
    });
    $("#sidebar-overlay").addEventListener("click", function () {
      $("#sidebar").classList.remove("open");
      $("#sidebar-overlay").classList.remove("show");
    });

    $("#student-logout").onclick = function () {
      // Show loader before logout
      var loader = document.getElementById('loader');
      if (loader) {
        loader.classList.remove('hidden');
      }
      clearStudentSession();
      setTimeout(function() {
        window.location.href = "student.html";
      }, 300);
    };

    $("#student-profile-form").onsubmit = function (e) {
      e.preventDefault();
      data = ensureAppData();
      var s = findStudent(st.roll);
      s.name = $("#pf-name").value.trim();
      s.email = $("#pf-email").value.trim();
      s.phone = $("#pf-phone").value.trim();
      s.photo = $("#pf-photo").value.trim() || avatarUrl(s.roll);
      saveApp(data);
      toast("Profile updated", "success");
      st = s;
      renderStudentHome(st, data);
    };

    $("#student-password-form").onsubmit = function (e) {
      e.preventDefault();
      data = ensureAppData();
      var s = findStudent(st.roll);
      if (s.password !== $("#pf-old").value) {
        toast("Current password is wrong", "error");
        return;
      }
      s.password = $("#pf-new").value;
      saveApp(data);
      $("#student-password-form").reset();
      toast("Password changed", "success");
    };

    $("#btn-hall-ticket").onclick = function () {
      var next = examsForStudent(st, data).sort(function (a, b) {
        return a.date.localeCompare(b.date);
      })[0];
      var body = $("#hall-ticket-body");
      if (!next) {
        toast("No exam scheduled for you", "error");
        return;
      }
      body.innerHTML =
        "<div style='text-align:center'>" +
        "<h2 style='margin:0'>Hall Ticket</h2>" +
        "<p>St. Xavier Institute of Technology</p>" +
        "<hr />" +
        "<p style='text-align:left'><strong>Name:</strong> " +
        escapeHtml(st.name) +
        "<br/><strong>Roll:</strong> " +
        escapeHtml(st.roll) +
        "<br/><strong>Branch:</strong> " +
        escapeHtml(st.branch) +
        "<br/><strong>Subject:</strong> " +
        escapeHtml(next.subject) +
        "<br/><strong>Date:</strong> " +
        escapeHtml(next.date) +
        "<br/><strong>Time:</strong> " +
        escapeHtml(next.time) +
        "<br/><strong>Hall:</strong> " +
        escapeHtml(next.hall) +
        "</p>" +
        "<p style='font-size:0.85rem;color:#666'>Bring college ID card. Digital copy valid for demo.</p>" +
        "</div>";
      $("#hall-modal").classList.add("open");
    };
    $("#hall-modal-close").onclick = function () {
      $("#hall-modal").classList.remove("open");
    };
    $("#hall-modal").addEventListener("click", function (e) {
      if (e.target.id === "hall-modal") $("#hall-modal").classList.remove("open");
    });
    $("#hall-print").onclick = function () {
      window.print();
    };

    // Global search: jump to section by keyword
    $("#student-global-search").addEventListener("input", function () {
      var q = this.value.trim().toLowerCase();
      if (!q) return;
      var map = [
        { k: "attend", s: "attendance" },
        { k: "mark", s: "marks" },
        { k: "time", s: "timetable" },
        { k: "assign", s: "assignments" },
        { k: "faculty", s: "faculty" },
        { k: "result", s: "results" },
        { k: "notif", s: "notifications" },
        { k: "profile", s: "profile" },
        { k: "home", s: "home" },
        { k: "contact", s: "contact" },
      ];
      for (var i = 0; i < map.length; i++) {
        if (q.indexOf(map[i].k) !== -1) {
          switchStudentSection(map[i].s);
          toast("Opened: " + map[i].s, "info");
          break;
        }
      }
    });

    window.addEventListener("storage", function (e) {
      if (e.key === STORAGE_KEY || e.key === "cms_last_attendance_update") {
        refreshStudentDashboard();
      }
    });
    window.addEventListener("focus", refreshStudentDashboard);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) refreshStudentDashboard();
    });

    switchStudentSection("home");
  }

  // ----- Admin dashboard -----
  var chartInstances = {};

  function destroyCharts() {
    Object.keys(chartInstances).forEach(function (k) {
      if (chartInstances[k]) chartInstances[k].destroy();
      chartInstances[k] = null;
    });
  }

  function adminRequireAuth() {
    var s = getAdminSession();
    if (!s || !s.email) {
      window.location.href = "admin-login.html";
      return null;
    }
    return s;
  }

  function adminRoleCan(role, rolesCsv) {
    var parts = rolesCsv.split(",");
    return parts.indexOf(role) !== -1;
  }

  function filterAdminNav(role) {
    $all("#admin-nav a").forEach(function (a) {
      var roles = a.getAttribute("data-roles");
      if (!roles) {
        a.style.display = "";
        return;
      }
      a.style.display = adminRoleCan(role, roles) ? "" : "none";
    });
  }

  function switchAdminSection(id) {
    $all(".page-section").forEach(function (sec) {
      sec.classList.add("hidden");
    });
    var map = {
      overview: "adm-overview",
      students: "adm-students",
      teachers: "adm-teachers",
      branches: "adm-branches",
      subjects: "adm-subjects",
      attendance: "adm-attendance",
      marks: "adm-marks",
      assignments: "adm-assignments",
      timetable: "adm-timetable",
      exams: "adm-exams",
      results: "adm-results",
      notifications: "adm-notifications",
    };
    var el = $("#" + map[id]);
    if (el) el.classList.remove("hidden");
    $all("#admin-nav a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-section") === id);
    });
    if (id === "overview") {
      setTimeout(function () {
        refreshCharts();
      }, 50);
    }
    if (window.innerWidth <= 900) {
      $("#admin-sidebar").classList.remove("open");
      $("#admin-sidebar-overlay").classList.remove("show");
    }
  }

  function refreshAdminCounters() {
    var data = ensureAppData();
    var cards = $("#admin-stats-cards");
    if (!cards) return;
    var avgAtt = 0;
    var n = 0;
    data.students.forEach(function (st) {
      avgAtt += Number(overallAttendance(st.roll, data)) || 0;
      n++;
    });
    avgAtt = n ? Math.round(avgAtt / n) : 0;
    var feePaid = data.students.filter(function (s) {
      return s.feeStatus === "Paid";
    }).length;
    cards.innerHTML =
      cardHtml("Total students", String(data.students.length), "Active records") +
      cardHtml("Total faculty", String(data.faculty.length), "Teaching staff") +
      cardHtml("Branches", String(data.branches.length), "Programmes") +
      cardHtml("Avg attendance", avgAtt + "%", "Across students") +
      cardHtml("Fees paid", String(feePaid), "Students with paid status");
  }

  function refreshCharts() {
    if (typeof Chart === "undefined") {
      console.warn("Chart.js not loaded");
      return;
    }
    var data = ensureAppData();
    destroyCharts();

    // Attendance buckets
    var labels = data.students.map(function (s) {
      return s.roll;
    });
    var attData = data.students.map(function (s) {
      return Number(overallAttendance(s.roll, data)) || 0;
    });
    var ctx1 = $("#chart-attendance");
    if (ctx1) {
      chartInstances.att = new Chart(ctx1, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Attendance %",
              data: attData,
              backgroundColor: "rgba(30, 77, 140, 0.55)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, max: 100 } },
        },
      });
    }

    var feeLabels = ["Paid", "Pending", "Partial"];
    var feeCounts = [0, 0, 0];
    data.students.forEach(function (s) {
      if (s.feeStatus === "Paid") feeCounts[0]++;
      else if (s.feeStatus === "Pending") feeCounts[1]++;
      else feeCounts[2]++;
    });
    var ctx2 = $("#chart-fees");
    if (ctx2) {
      chartInstances.fee = new Chart(ctx2, {
        type: "doughnut",
        data: {
          labels: feeLabels,
          datasets: [{ data: feeCounts, backgroundColor: ["#16a34a", "#dc2626", "#d97706"] }],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });
    }

    var sgpaVals = data.results.map(function (r) {
      return Number(r.sgpa) || 0;
    });
    var ctx3 = $("#chart-sgpa");
    if (ctx3) {
      chartInstances.sgpa = new Chart(ctx3, {
        type: "line",
        data: {
          labels: data.results.map(function (r) {
            return r.roll + " " + r.semester;
          }),
          datasets: [
            {
              label: "SGPA",
              data: sgpaVals,
              borderColor: "#0d9488",
              tension: 0.25,
              fill: false,
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });
    }

    var brMap = {};
    data.students.forEach(function (s) {
      brMap[s.branch] = brMap[s.branch] || { sum: 0, n: 0 };
      brMap[s.branch].sum += Number(s.cgpa) || 0;
      brMap[s.branch].n++;
    });
    var brLabels = Object.keys(brMap);
    var brAvg = brLabels.map(function (b) {
      return brMap[b].n ? brMap[b].sum / brMap[b].n : 0;
    });
    var ctx4 = $("#chart-branch");
    if (ctx4) {
      chartInstances.br = new Chart(ctx4, {
        type: "radar",
        data: {
          labels: brLabels,
          datasets: [
            {
              label: "Avg CGPA",
              data: brAvg,
              backgroundColor: "rgba(74, 158, 255, 0.25)",
              borderColor: "#4a9eff",
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });
    }
  }

  function populateBranchSelects(select) {
    var data = ensureAppData();
    select.innerHTML = "";
    data.branches.forEach(function (b) {
      var o = document.createElement("option");
      o.value = b;
      o.textContent = b;
      select.appendChild(o);
    });
  }

  function renderStudentsTable(filterBranch, search) {
    var data = ensureAppData();
    var tb = $("#students-table tbody");
    if (!tb) return;
    tb.innerHTML = "";
    var rows = data.students.filter(function (s) {
      if (filterBranch && s.branch !== filterBranch) return false;
      if (search) {
        var q = search.toLowerCase();
        if (
          s.roll.toLowerCase().indexOf(q) === -1 &&
          s.name.toLowerCase().indexOf(q) === -1
        )
          return false;
      }
      return true;
    });
    rows.forEach(function (s) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" +
        escapeHtml(s.roll) +
        "</td><td>" +
        escapeHtml(s.name) +
        "</td><td>" +
        escapeHtml(s.branch) +
        "</td><td>" +
        s.year +
        "</td><td>" +
        escapeHtml(s.section) +
        "</td><td>" +
        escapeHtml(String(s.cgpa)) +
        "</td><td>" +
        escapeHtml(s.feeStatus) +
        "</td><td>" +
        '<button class="btn btn-outline btn-sm" data-edit="' +
        escapeHtml(s.roll) +
        '">Edit</button> ' +
        '<button class="btn btn-danger btn-sm" data-del="' +
        escapeHtml(s.roll) +
        '">Delete</button>' +
        "</td>";
      tb.appendChild(tr);
    });
    refreshAdminCounters();
  }

  function openStudentModal(mode, roll) {
    var data = ensureAppData();
    var m = $("#modal-student");
    $("#modal-student-title").textContent =
      mode === "add" ? "Add student" : "Edit student";
    $("#sm-old-roll").value = mode === "edit" ? roll : "";
    if (mode === "add") {
      $("#form-student-modal").reset();
      $("#sm-branch").innerHTML = "";
      data.branches.forEach(function (b) {
        var o = document.createElement("option");
        o.value = b;
        o.textContent = b;
        $("#sm-branch").appendChild(o);
      });
      $("#sm-year").value = 2;
      $("#sm-section").value = "A";
      $("#sm-password").value = "student123";
      var curAdd = $("#sm-photo-current");
      if (curAdd) curAdd.value = "";
      var fileInAdd = $("#sm-photo-file");
      if (fileInAdd) fileInAdd.value = "";
      setStudentModalPhotoPreview("", "new");
    } else {
      var s = findStudent(roll);
      if (!s) return;
      $("#sm-roll").value = s.roll;
      $("#sm-name").value = s.name;
      $("#sm-branch").innerHTML = "";
      data.branches.forEach(function (b) {
        var o = document.createElement("option");
        o.value = b;
        o.textContent = b;
        if (b === s.branch) o.selected = true;
        $("#sm-branch").appendChild(o);
      });
      $("#sm-year").value = s.year;
      $("#sm-section").value = s.section;
      $("#sm-password").value = s.password;
      $("#sm-email").value = s.email || "";
      $("#sm-phone").value = s.phone || "";
      $("#sm-cgpa").value = s.cgpa;
      $("#sm-fee").value = s.feeStatus;
      $("#sm-photo").value =
        s.photo && String(s.photo).indexOf("data:image") === 0 ? "" : s.photo || "";
      var curPh = $("#sm-photo-current");
      if (curPh) curPh.value = s.photo || "";
      var fileIn = $("#sm-photo-file");
      if (fileIn) fileIn.value = "";
      setStudentModalPhotoPreview(s.photo || "", s.roll);
    }
    m.classList.add("open");
  }

  function closeModal(id) {
    $("#" + id).classList.remove("open");
  }

  function initAdminDashboard() {
    initTheme("admin-theme-toggle");
    var session = adminRequireAuth();
    if (!session) return;

    setTimeout(function () {
      hideLoading();
    }, 500);

    var data = ensureAppData();
    $("#admin-header-title").textContent = "GSPH Admin Console";
    $("#admin-role-badge").textContent =
      session.role.toUpperCase() + " · " + session.name;

    filterAdminNav(session.role);

    $("#admin-nav").addEventListener("click", function (e) {
      var a = e.target.closest("a[data-section]");
      if (!a || a.style.display === "none") return;
      e.preventDefault();
      switchAdminSection(a.getAttribute("data-section"));
    });

    $("#admin-menu-toggle").onclick = function () {
      $("#admin-sidebar").classList.toggle("open");
      $("#admin-sidebar-overlay").classList.toggle("show");
    };
    $("#admin-sidebar-overlay").onclick = function () {
      $("#admin-sidebar").classList.remove("open");
      $("#admin-sidebar-overlay").classList.remove("show");
    };

    $("#admin-logout").onclick = function () {
      clearAdminSession();
      window.location.href = "admin-login.html";
    };

    // Branch filter + table
    var fb = $("#filter-branch");
    fb.innerHTML = '<option value="">All branches</option>';
    data.branches.forEach(function (b) {
      var o = document.createElement("option");
      o.value = b;
      o.textContent = b;
      fb.appendChild(o);
    });
    function rerenderStudents() {
      renderStudentsTable(fb.value, $("#admin-global-search").value.trim());
    }
    fb.onchange = rerenderStudents;
    $("#admin-global-search").addEventListener("input", function () {
      rerenderStudents();
    });
    renderStudentsTable("", "");

    $("#btn-add-student").onclick = function () {
      if (session.role !== "admin" && session.role !== "hod") return;
      openStudentModal("add");
    };

    var photoFileIn = $("#sm-photo-file");
    if (photoFileIn) {
      photoFileIn.addEventListener("change", function () {
        var f = this.files && this.files[0];
        if (!f) return;
        fileToStudentPhotoDataUrl(
          f,
          function (dataUrl) {
            var cur = $("#sm-photo-current");
            if (cur) cur.value = dataUrl;
            $("#sm-photo").value = "";
            setStudentModalPhotoPreview(dataUrl, $("#sm-roll").value || "new");
            toast("Photo ready — click Save to store", "success");
          },
          function (err) {
            toast((err && err.message) || "Could not use image", "error");
          }
        );
      });
    }
    var photoUrlIn = $("#sm-photo");
    if (photoUrlIn) {
      photoUrlIn.addEventListener("input", function () {
        var v = this.value.trim();
        var cur = $("#sm-photo-current") && $("#sm-photo-current").value.trim();
        setStudentModalPhotoPreview(v || cur || "", $("#sm-roll").value || "new");
      });
    }

    $("#students-table").onclick = function (e) {
      var ed = e.target.getAttribute("data-edit");
      var del = e.target.getAttribute("data-del");
      if (ed) {
        openStudentModal("edit", ed);
      }
      if (del) {
        if (!confirm("Delete student " + del + "?")) return;
        data = ensureAppData();
        data.students = data.students.filter(function (s) {
          return s.roll !== del;
        });
        delete data.attendance[del];
        delete data.internalMarks[del];
        delete data.semesterMarks[del];
        data.results = data.results.filter(function (r) {
          return r.roll !== del;
        });
        saveApp(data);
        toast("Student removed", "info");
        rerenderStudents();
        refreshCharts();
      }
    };

    $("#form-student-modal").onsubmit = function (e) {
      e.preventDefault();
      data = ensureAppData();
      var oldRoll = $("#sm-old-roll").value;
      var newRoll = $("#sm-roll").value.trim().toUpperCase();
      var resolvedPhoto =
        $("#sm-photo").value.trim() ||
        ($("#sm-photo-current") && $("#sm-photo-current").value.trim()) ||
        "";
      if (!resolvedPhoto && oldRoll) {
        var pPrev = findStudent(oldRoll);
        if (pPrev && pPrev.photo) resolvedPhoto = pPrev.photo;
      }
      var payload = {
        roll: newRoll,
        name: $("#sm-name").value.trim(),
        branch: $("#sm-branch").value,
        year: Number($("#sm-year").value),
        section: $("#sm-section").value.trim().toUpperCase(),
        password: $("#sm-password").value,
        email: $("#sm-email").value.trim(),
        phone: $("#sm-phone").value.trim(),
        cgpa: Number($("#sm-cgpa").value) || 0,
        feeStatus: $("#sm-fee").value,
        photo: resolvedPhoto || avatarUrl(newRoll),
        subjects: data.subjects.filter(function (s) {
          return s.branch === $("#sm-branch").value;
        }).length
          ? data.subjects
              .filter(function (s) {
                return s.branch === $("#sm-branch").value;
              })
              .map(function (s) {
                return s.code;
              })
          : ["GEN101"],
        gpaSem: "0.00",
        attendancePct: 80,
      };

      if (!oldRoll) {
        if (findStudent(newRoll)) {
          toast("Roll already exists", "error");
          return;
        }
        data.students.push(payload);
        data.attendance[newRoll] = data.attendance[newRoll] || {};
        data.internalMarks[newRoll] = data.internalMarks[newRoll] || {};
        data.semesterMarks[newRoll] = data.semesterMarks[newRoll] || {};
        payload.subjects.forEach(function (c) {
          data.attendance[newRoll][c] = 85;
          data.internalMarks[newRoll][c] = 18;
          data.semesterMarks[newRoll][c] = 60;
        });
        data.library[newRoll] = { booksIssued: 0, dueDate: "-", fine: 0 };
        data.hostel[newRoll] = { block: "A", room: "101", warden: "TBD" };
        data.bus[newRoll] = { route: "R1", stop: "Campus", time: "8:00 AM" };
        toast("Student added", "success");
      } else {
        var idx = data.students.findIndex(function (s) {
          return s.roll === oldRoll;
        });
        if (idx === -1) return;
        if (oldRoll !== newRoll && findStudent(newRoll)) {
          toast("New roll already in use", "error");
          return;
        }
        var prev = data.students[idx];
        if (oldRoll !== newRoll) {
          data.attendance[newRoll] = data.attendance[oldRoll];
          data.internalMarks[newRoll] = data.internalMarks[oldRoll];
          data.semesterMarks[newRoll] = data.semesterMarks[oldRoll];
          delete data.attendance[oldRoll];
          delete data.internalMarks[oldRoll];
          delete data.semesterMarks[oldRoll];
          if (data.library[oldRoll]) {
            data.library[newRoll] = data.library[oldRoll];
            delete data.library[oldRoll];
          }
          if (data.hostel[oldRoll]) {
            data.hostel[newRoll] = data.hostel[oldRoll];
            delete data.hostel[oldRoll];
          }
          if (data.bus[oldRoll]) {
            data.bus[newRoll] = data.bus[oldRoll];
            delete data.bus[oldRoll];
          }
          data.results.forEach(function (r) {
            if (r.roll === oldRoll) r.roll = newRoll;
          });
        }
        payload.gpaSem = prev.gpaSem;
        payload.attendancePct = prev.attendancePct;
        data.students[idx] = Object.assign({}, prev, payload);
        toast("Student updated", "success");
      }
      saveApp(data);
      closeModal("modal-student");
      rerenderStudents();
      refreshCharts();
    };

    $all(".modal-close").forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute("data-close");
        if (id) closeModal(id);
      };
    });

    // Teachers table
    function renderTeachers() {
      data = ensureAppData();
      var tb = $("#teachers-table tbody");
      tb.innerHTML = "";
      data.teachers.forEach(function (t) {
        var tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" +
          escapeHtml(t.name) +
          "</td><td>" +
          escapeHtml(t.email) +
          "</td><td>" +
          escapeHtml(t.role) +
          "</td><td>" +
          escapeHtml(t.branch) +
          "</td>";
        tb.appendChild(tr);
      });
    }
    renderTeachers();
    populateBranchSelects($("#tm-branch"));
    $("#btn-add-teacher").onclick = function () {
      $("#form-teacher-modal").reset();
      populateBranchSelects($("#tm-branch"));
      $("#modal-teacher").classList.add("open");
    };
    $("#form-teacher-modal").onsubmit = function (e) {
      e.preventDefault();
      data = ensureAppData();
      data.teachers.push({
        email: $("#tm-email").value.trim().toLowerCase(),
        password: $("#tm-password").value,
        name: $("#tm-name").value.trim(),
        role: $("#tm-role").value,
        branch: $("#tm-branch").value,
      });
      saveApp(data);
      closeModal("modal-teacher");
      renderTeachers();
      toast("Teacher account created", "success");
    };

    // Branches
    function renderBranches() {
      data = ensureAppData();
      $("#branches-list").innerHTML = data.branches
        .map(function (b) {
          return (
            '<div class="faculty-card"><div><strong>' +
            escapeHtml(b) +
            "</strong><p style='margin:0.35rem 0 0;color:var(--text-muted);font-size:0.9rem'>Programme branch</p></div></div>"
          );
        })
        .join("");
    }
    renderBranches();
    $("#btn-add-branch").onclick = function () {
      var v = $("#new-branch-input").value.trim().toUpperCase();
      if (!v) return;
      data = ensureAppData();
      if (data.branches.indexOf(v) !== -1) {
        toast("Branch exists", "error");
        return;
      }
      data.branches.push(v);
      saveApp(data);
      $("#new-branch-input").value = "";
      renderBranches();
      populateBranchSelects(fb);
      fb.innerHTML = '<option value="">All branches</option>';
      data.branches.forEach(function (b) {
        var o = document.createElement("option");
        o.value = b;
        o.textContent = b;
        fb.appendChild(o);
      });
      toast("Branch added", "success");
    };

    // Subjects
    function renderSubjects() {
      data = ensureAppData();
      var tb = $("#subjects-table tbody");
      tb.innerHTML = "";
      data.subjects.forEach(function (s) {
        var tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" +
          escapeHtml(s.code) +
          "</td><td>" +
          escapeHtml(s.name) +
          "</td><td>" +
          escapeHtml(s.branch) +
          "</td><td>" +
          s.semester +
          "</td>";
        tb.appendChild(tr);
      });
    }
    renderSubjects();
    $("#btn-add-subject").onclick = function () {
      populateBranchSelects($("#sub-branch"));
      $("#form-subject-modal").reset();
      $("#modal-subject").classList.add("open");
    };
    $("#form-subject-modal").onsubmit = function (e) {
      e.preventDefault();
      data = ensureAppData();
      data.subjects.push({
        code: $("#sub-code").value.trim().toUpperCase(),
        name: $("#sub-name").value.trim(),
        branch: $("#sub-branch").value,
        semester: Number($("#sub-sem").value) || 4,
      });
      saveApp(data);
      closeModal("modal-subject");
      renderSubjects();
      toast("Subject added", "success");
    };

    // Attendance + marks selects
    function fillRollSelect(sel) {
      data = ensureAppData();
      sel.innerHTML = "";
      data.students.forEach(function (s) {
        var o = document.createElement("option");
        o.value = s.roll;
        o.textContent = s.roll + " — " + s.name;
        sel.appendChild(o);
      });
    }
    function fillSubjectSelect(sel) {
      data = ensureAppData();
      sel.innerHTML = "";
      data.subjects.forEach(function (s) {
        var o = document.createElement("option");
        o.value = s.code;
        o.textContent = s.code + " — " + s.name;
        sel.appendChild(o);
      });
    }
    fillRollSelect($("#att-roll"));
    fillSubjectSelect($("#att-subject"));
    fillRollSelect($("#marks-roll"));
    fillSubjectSelect($("#marks-subject"));
    fillRollSelect($("#res-roll"));

    populateBranchSelects($("#bulk-att-branch"));
    populateBranchSelects($("#as-branch"));
    populateBranchSelects($("#ex-branch"));
    populateBranchSelects($("#nt-branch"));

    $("#form-attendance").onsubmit = function (e) {
      e.preventDefault();
      data = ensureAppData();
      var roll = $("#att-roll").value;
      var sub = $("#att-subject").value;
      var pct = Number($("#att-pct").value);
      data.attendance[roll] = data.attendance[roll] || {};
      data.attendance[roll][sub] = pct;
      saveApp(data);
      toast("Attendance saved", "success");
      refreshCharts();
    };
    $("#btn-bulk-attendance").onclick = function () {
      var br = $("#bulk-att-branch").value;
      data = ensureAppData();
      data.students
        .filter(function (s) {
          return s.branch === br;
        })
        .forEach(function (s) {
          data.attendance[s.roll] = data.attendance[s.roll] || {};
          Object.keys(data.attendance[s.roll]).forEach(function (k) {
            data.attendance[s.roll][k] = Math.min(
              100,
              Number(data.attendance[s.roll][k]) + 2
            );
          });
        });
      saveApp(data);
      toast("Demo bump applied to " + br, "info");
      refreshCharts();
    };

    $("#form-marks").onsubmit = function (e) {
      e.preventDefault();
      data = ensureAppData();
      var roll = $("#marks-roll").value;
      var sub = $("#marks-subject").value;
      var im = $("#marks-internal").value;
      var sm = $("#marks-sem").value;
      data.internalMarks[roll] = data.internalMarks[roll] || {};
      data.semesterMarks[roll] = data.semesterMarks[roll] || {};
      if (im !== "") data.internalMarks[roll][sub] = Number(im);
      if (sm !== "") data.semesterMarks[roll][sub] = Number(sm);
      saveApp(data);
      toast("Marks saved", "success");
      refreshCharts();
    };

    $("#form-assignment").onsubmit = function (e) {
      e.preventDefault();
      data = ensureAppData();
      data.assignments.push({
        id: "A" + Date.now(),
        title: $("#as-title").value.trim(),
        branch: $("#as-branch").value,
        subject: $("#as-subject").value.trim().toUpperCase(),
        due: $("#as-due").value,
        description: $("#as-desc").value.trim(),
      });
      saveApp(data);
      $("#form-assignment").reset();
      renderAssignmentsAdmin();
      toast("Assignment posted", "success");
    };
    function renderAssignmentsAdmin() {
      data = ensureAppData();
      var tb = $("#assignments-admin-table tbody");
      tb.innerHTML = "";
      data.assignments.forEach(function (a) {
        var tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" +
          escapeHtml(a.title) +
          "</td><td>" +
          escapeHtml(a.branch) +
          "</td><td>" +
          escapeHtml(a.subject) +
          "</td><td>" +
          escapeHtml(a.due) +
          "</td>";
        tb.appendChild(tr);
      });
    }
    renderAssignmentsAdmin();

    $("#form-timetable").onsubmit = function (e) {
      e.preventDefault();
      data = ensureAppData();
      var key = $("#tt-key").value.trim().toUpperCase();
      data.timetable[key] = data.timetable[key] || [];
      data.timetable[key].push({
        day: $("#tt-day").value,
        slot: $("#tt-slot").value.trim(),
        subject: $("#tt-subject").value.trim(),
        room: $("#tt-room").value.trim(),
        faculty: $("#tt-faculty").value.trim(),
      });
      saveApp(data);
      $("#form-timetable").reset();
      toast("Timetable slot added for " + key, "success");
    };

    $("#btn-save-exam").onclick = function () {
      data = ensureAppData();
      data.exams.push({
        id: "EX" + Date.now(),
        subject: $("#ex-subject").value.trim(),
        date: $("#ex-date").value,
        time: $("#ex-time").value.trim(),
        branch: $("#ex-branch").value,
        year: Number($("#ex-year").value),
        hall: $("#ex-hall").value.trim(),
      });
      saveApp(data);
      renderExams();
      toast("Exam added", "success");
    };
    function renderExams() {
      data = ensureAppData();
      var tb = $("#exams-table tbody");
      tb.innerHTML = "";
      data.exams.forEach(function (x) {
        var tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" +
          escapeHtml(x.subject) +
          "</td><td>" +
          escapeHtml(x.branch) +
          "</td><td>" +
          x.year +
          "</td><td>" +
          escapeHtml(x.date) +
          "</td><td>" +
          escapeHtml(x.time) +
          "</td><td>" +
          escapeHtml(x.hall) +
          "</td>";
        tb.appendChild(tr);
      });
    }
    renderExams();

    $("#form-result").onsubmit = function (e) {
      e.preventDefault();
      data = ensureAppData();
      var roll = $("#res-roll").value;
      var sem = $("#res-sem").value.trim();
      var rec = {
        roll: roll,
        semester: sem,
        sgpa: Number($("#res-sgpa").value),
        status: $("#res-status").value,
      };
      var idx = data.results.findIndex(function (r) {
        return r.roll === roll && r.semester === sem;
      });
      if (idx === -1) data.results.push(rec);
      else data.results[idx] = rec;
      saveApp(data);
      renderResultsAdmin();
      toast("Result saved", "success");
      refreshCharts();
    };
    function renderResultsAdmin() {
      data = ensureAppData();
      var tb = $("#results-admin-table tbody");
      tb.innerHTML = "";
      data.results.forEach(function (r, i) {
        var tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" +
          escapeHtml(r.roll) +
          "</td><td>" +
          escapeHtml(r.semester) +
          "</td><td>" +
          escapeHtml(String(r.sgpa)) +
          "</td><td>" +
          escapeHtml(r.status) +
          "</td><td>" +
          '<button class="btn btn-danger btn-sm" data-rmi="' +
          i +
          '">Delete</button>' +
          "</td>";
        tb.appendChild(tr);
      });
    }
    $("#results-admin-table").onclick = function (e) {
      var i = e.target.getAttribute("data-rmi");
      if (i == null) return;
      data = ensureAppData();
      data.results.splice(Number(i), 1);
      saveApp(data);
      renderResultsAdmin();
      refreshCharts();
    };
    renderResultsAdmin();

    $("#form-notification").onsubmit = function (e) {
      e.preventDefault();
      data = ensureAppData();
      data.notifications.unshift({
        id: "N" + Date.now(),
        title: $("#nt-title").value.trim(),
        body: $("#nt-body").value.trim(),
        date: new Date().toISOString().slice(0, 10),
        audience: $("#nt-audience").value,
        branch: $("#nt-branch").value,
      });
      saveApp(data);
      $("#form-notification").reset();
      renderNotifsAdmin();
      toast("Notification published", "success");
    };
    function renderNotifsAdmin() {
      data = ensureAppData();
      var ul = $("#notifications-admin");
      ul.innerHTML = data.notifications
        .map(function (n) {
          return (
            "<li><strong>" +
            escapeHtml(n.title) +
            "</strong><div class='date'>" +
            escapeHtml(n.date) +
            " · " +
            escapeHtml(n.audience) +
            "</div>" +
            escapeHtml(n.body) +
            "</li>"
          );
        })
        .join("");
    }
    renderNotifsAdmin();

    refreshAdminCounters();
    switchAdminSection("overview");

    // Real-time counter tick (decorative)
    setInterval(function () {
      refreshAdminCounters();
    }, 8000);
  }

  // ----- Index page -----
  function initIndex() {
    initTheme();
  }

  // Boot
  document.addEventListener("DOMContentLoaded", function () {
    ensureAppData();
    var page = getPage();
    if (page === "student-dashboard") initStudentDashboard();
    else if (page === "admin-dashboard") initAdminDashboard();
    else if (document.getElementById("student-login-form")) initStudentLogin();
    else if (document.getElementById("admin-login-form")) initAdminLogin();
    else initIndex();
  });
})();
