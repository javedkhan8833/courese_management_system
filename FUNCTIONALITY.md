# Website Functionality Documentation

## Project Overview
This is a full-stack Course Management System built with React (frontend) and Express/SQLite (backend). It allows users to browse, enroll in, and manage courses, while providing robust admin, instructor, and student management features.

---

## User Roles & Main Features
- **General User/Visitor**: Browse courses, view FAQs, contact form, register/login.
- **Student**: Enroll in courses, upload payment proof, view enrolled courses, track progress, view notifications, manage profile.
- **Instructor**: View assigned courses, manage attendance, view enrolled students, mark attendance, view notifications.
- **Admin**: Full management of users, courses, enrollments, FAQs, contacts, sliders, bank accounts, analytics, and about page content.

---

## Frontend Functionality
- **Home Page**: Landing page with featured courses, sliders, and navigation.
- **About Page**: Information about the organization.
- **Courses Page**: List and detail view of all available courses.
- **FAQs Page**: Frequently asked questions.
- **Contact Page**: Contact form for user inquiries.
- **Register/Login**: User authentication and registration.
- **Profile Page**: User profile management.
- **Payment Proof Form**: Upload payment proof for course enrollment.

### Student Dashboard
- View enrolled courses and progress.
- Access course materials and attendance.
- Notifications and profile management.

### Instructor Dashboard
- View assigned courses.
- Manage student attendance.
- View enrolled students and their progress.
- Notifications.

### Admin Dashboard
- **Users Management**: Add, edit, delete users; assign roles.
- **Courses Management**: Add, edit, delete courses; manage course assignments.
- **Enrollments Management**: View, approve, or reject enrollments; mark as complete.
- **FAQs Management**: Add, edit, delete FAQs.
- **Contacts Management**: View and delete contact messages.
- **Sliders Management**: Manage homepage sliders.
- **Bank Accounts**: Manage bank account info for payments.
- **Analytics**: View platform statistics and analytics.
- **About Page**: Edit about page content.

---

## Backend Functionality
- **Authentication**: JWT-based login, registration, and role-based access control.
- **Courses API**: CRUD for courses, course details, and assignments.
- **User API**: CRUD for users, profile management, role assignment.
- **Enrollment API**: Enroll in courses, upload payment proof, manage enrollment status.
- **FAQs API**: CRUD for FAQs.
- **Contacts API**: Submit and manage contact messages.
- **Sliders API**: CRUD for homepage sliders.
- **Bank Accounts API**: CRUD for bank account info.
- **Notifications API**: User notifications for important events.
- **Attendance API**: Instructors can mark and view attendance.
- **Analytics API**: Admin analytics endpoints.
- **About API**: Get and update about page content.
- **File Uploads**: Upload and manage images, payment proofs, and profile pictures.
- **Certificate Generation**: Generate course completion certificates (PDF/QR).

---

## Database Structure (High-Level)
- **users**: User info, roles, profile data.
- **courses**: Course details.
- **enrollments**: User enrollments, payment proof, status.
- **faqs**: FAQ entries.
- **contacts**: Contact form submissions.
- **sliders**: Homepage slider content.
- **bank_accounts**: Bank info for payments.
- **user_roles**: User role assignments.
- **course_assignments**: Instructor/course assignments.
- **attendance**: Attendance records.
- **notifications**: User notifications.
- **about**: About page content.

---

## Main Flows
### Registration & Login
- Users register with email, username, and password.
- Login provides JWT for authenticated requests.

### Course Enrollment
- Students enroll in courses, upload payment proof.
- Admin reviews and approves/rejects enrollments.
- Students track progress and receive notifications.

### Admin Management
- Admins manage all users, courses, enrollments, content, and analytics via dedicated dashboards.

### Instructor Management
- Instructors manage attendance and view student progress for assigned courses.

### Student Experience
- Students access dashboards, view courses, track attendance, and manage their profile.

---

## Technologies Used
- **Frontend**: React, Vite, CSS
- **Backend**: Express.js, SQLite, JWT, Multer (file uploads)
- **Other**: PDFKit (certificates), QRCode, bcryptjs (passwords)

---

For more details, see the codebase and individual component/page files. 