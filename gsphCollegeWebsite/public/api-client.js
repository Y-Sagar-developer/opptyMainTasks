/**
 * API Client for MySQL Backend
 * This file provides functions to interact with the MySQL database API
 */

const API_BASE = 'http://localhost:3000/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {

//   method:'POST'
// body:JSON.stringify()
// headers:{}
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
      
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Call Failed:', error);
    throw error;
  }
}

// ==================== AUTHENTICATION ====================

async function studentLogin(roll, password) {
  return apiCall('/auth/student/login', {
    method: 'POST',
    body: JSON.stringify({ roll, password })
  });
}

async function teacherLogin(email, password) {
  return apiCall('/auth/teacher/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

// ==================== STUDENTS ====================

async function getAllStudents(branch = null) {
  const query = branch ? `?branch=${branch}` : '';
  return apiCall(`/students${query}`);
}

async function getStudent(roll) {
  return apiCall(`/students/${roll}`);
}

async function addStudent(studentData) {
  return apiCall('/students', {
    method: 'POST',
    body: JSON.stringify(studentData)
  });
}

async function updateStudent(roll, studentData) {
  return apiCall(`/students/${roll}`, {
    method: 'PUT',
    body: JSON.stringify(studentData)
  });
}

async function deleteStudent(roll) {
  return apiCall(`/students/${roll}`, {
    method: 'DELETE'
  });
}

// ==================== ATTENDANCE ====================

async function getAttendance(roll, month = null, year = null) {
  const params = new URLSearchParams();
  // ?month=5&year=2025
  // /attendance/CSE22001
  // /attendance/CSE22001?month=5&year=2025
  if (month) params.append('month', month);
  if (year) params.append('year', year);
  const query = params.toString() ? `?${params}` : '';
  return apiCall(`/attendance/${roll}${query}`);
}

async function markAttendance(attendanceData) {
  return apiCall('/attendance', {
    method: 'POST',
    body: JSON.stringify(attendanceData)
  });
}

async function getAttendanceSummary(roll) {
  return apiCall(`/attendance/${roll}/summary`);
}

// ==================== MARKS ====================

async function getMarks(roll) {
  return apiCall(`/marks/${roll}`);
}

async function addOrUpdateMarks(marksData) {
  return apiCall('/marks', {
    method: 'POST',
    body: JSON.stringify(marksData)
  });
}

// ==================== SUBJECTS ====================

async function getAllSubjects(branch = null) {
  const query = branch ? `?branch=${branch}` : '';
  return apiCall(`/subjects${query}`);
}

async function addSubject(subjectData) {
  return apiCall('/subjects', {
    method: 'POST',
    body: JSON.stringify(subjectData)
  });
}

// ==================== BRANCHES ====================

async function getAllBranches() {
  return apiCall('/branches');
}

async function addBranch(branchData) {
  return apiCall('/branches', {
    method: 'POST',
    body: JSON.stringify(branchData)
  });
}

// ==================== ASSIGNMENTS ====================

async function getAssignments(branch = null) {
  const query = branch ? `?branch=${branch}` : '';
  return apiCall(`/assignments${query}`);
}

async function addAssignment(assignmentData) {
  return apiCall('/assignments', {
    method: 'POST',
    body: JSON.stringify(assignmentData)
  });
}

// ==================== TIMETABLE ====================

async function getTimetable(groupKey) {
  return apiCall(`/timetable/${groupKey}`);
}

async function addTimetableEntry(timetableData) {
  return apiCall('/timetable', {
    method: 'POST',
    body: JSON.stringify(timetableData)
  });
}

// ==================== EXAMS ====================

async function getExams(branch = null, year = null) {
  const params = new URLSearchParams();
  if (branch) params.append('branch', branch);
  if (year) params.append('year', year);
  const query = params.toString() ? `?${params}` : '';
  return apiCall(`/exams${query}`);
}

async function addExam(examData) {
  return apiCall('/exams', {
    method: 'POST',
    body: JSON.stringify(examData)
  });
}

// ==================== RESULTS ====================

async function getResults(roll) {
  return apiCall(`/results/${roll}`);
}

async function addResult(resultData) {
  return apiCall('/results', {
    method: 'POST',
    body: JSON.stringify(resultData)
  });
}

// ==================== NOTIFICATIONS ====================

async function getNotifications(branch = null) {
  const query = branch ? `?branch=${branch}` : '';
  return apiCall(`/notifications${query}`);
}

async function addNotification(notificationData) {
  return apiCall('/notifications', {
    method: 'POST',
    body: JSON.stringify(notificationData)
  });
}

// ==================== HOLIDAYS ====================

async function getHolidays(year = null) {
  const query = year ? `?year=${year}` : '';
  return apiCall(`/holidays${query}`);
}

// ==================== TEACHERS ====================

async function getAllTeachers() {
  return apiCall('/teachers');
}

async function addTeacher(teacherData) {
  return apiCall('/teachers', {
    method: 'POST',
    body: JSON.stringify(teacherData)
  });
}
