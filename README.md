<div align="center">
<img width="80" src="https://img.shields.io/badge/-🏠-blue?style=flat" />
# 🏠 HostelMaster Pro
 
### A Comprehensive Cloud-Based Hostel Management System
 
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
 
*Automate room allocation · Track fees · Manage complaints · Log visitors — all in one place.*
 
[Live Demo](https://ai.studio/apps/0bbbca03-6373-4b7e-a9a1-002472f76d6c) · [Report a Bug](https://github.com/sameerkumar87694-bit/HostelMaster-Pro/issues) · [Request Feature](https://github.com/sameerkumar87694-bit/HostelMaster-Pro/issues)
 
</div>
---
 
## 📋 Table of Contents
 
- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Firebase Setup](#firebase-setup)
  - [Environment Variables](#environment-variables)
- [Usage](#usage)
  - [Admin Portal](#admin-portal)
  - [Student Portal](#student-portal)
- [Security Rules](#security-rules)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)
---
 
## 🏗️ About the Project
 
**HostelMaster Pro** is a full-stack, cloud-native hostel management web application built as an MCA final year project. It replaces error-prone, paper-based hostel administration with a real-time digital platform that serves two distinct user roles — **Administrators** and **Students**.
 
The system handles the complete hostel operations lifecycle:
 
- 🛏️ Room allocation and vacancy tracking
- 💰 Fee management with gender-based dynamic calculation
- 📢 Complaint submission and resolution workflow
- 🧑‍🤝‍🧑 Visitor entry and exit logging
- 📊 Admin dashboard with live KPI statistics
Built with **React + TypeScript** on the frontend and **Firebase (Auth + Firestore)** as a serverless backend, the application is fully cloud-hosted with real-time data synchronization.
 
---
 
## ✨ Features
 
### 🔐 Authentication & Security
- Email/password login with **Firebase Authentication**
- Role-based access control (Admin / Student)
- Protected routes — unauthorized access redirects to login
- **Firestore Security Rules** enforce server-side data isolation
### 👨‍💼 Admin Portal
| Module | Capabilities |
|--------|-------------|
| **Dashboard** | Real-time KPIs: total rooms, vacancies, pending fees, active complaints |
| **Room Management** | Add, edit, delete rooms; assign/unassign students; auto-vacancy tracking |
| **Student Management** | Register students, view/edit profiles, manage room assignments |
| **Fee Management** | Create fee records, mark as paid, view payment history per student |
| **Complaint Management** | View all complaints, update status (Pending → In Progress → Resolved) |
| **Visitor Log** | Log visitor entries/exits with timestamps; view full history |
| **Reports** | Summary reports across all hostel data |
| **Settings** | Configure gender-based hostel fee rates (Male / Female / Other) |
 
### 🎓 Student Portal
| Module | Capabilities |
|--------|-------------|
| **Dashboard** | Personal summary: room info, fee dues, complaint count |
| **Room Info** | View assigned room details and roommates |
| **Fee History** | View all fee records and payment status |
| **Complaints** | Submit new complaints, track resolution status |
| **Visitor Log** | Log and view personal visitor entries |
| **Profile** | View and update personal information |
 
### ⚡ Technical Highlights
- **Real-time updates** via Firestore `onSnapshot` listeners — no polling
- **Gender-based dynamic fee calculation** from admin-configured settings
- **Automatic room vacancy sync** via Firestore transactions during allocation
- **Form validation** with React Hook Form + Zod schema validation
- **Smooth animations** with Framer Motion
- **Fully responsive** UI with Tailwind CSS 4
- **Type-safe** codebase with TypeScript throughout
---
 
## 🛠️ Tech Stack
 
| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS 4 |
| **Routing** | React Router DOM v7 |
| **Authentication** | Firebase Authentication |
| **Database** | Cloud Firestore (NoSQL, real-time) |
| **Forms** | React Hook Form + Zod |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Date Utilities** | date-fns |
| **AI Integration** | Google Gemini API (`@google/genai`) |
 
---
 
## 📁 Project Structure
 
```
HostelMaster-Pro/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── Layout.tsx       # App shell with sidebar navigation
│   ├── contexts/
│   │   ├── AuthContext.tsx  # Firebase auth state & user profile
│   │   └── ThemeContext.tsx # Light/dark theme management
│   ├── pages/
│   │   ├── Login.tsx        # Auth page (login/register)
│   │   ├── Profile.tsx      # Shared profile page (admin & student)
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminRooms.tsx
│   │   ├── AdminStudents.tsx
│   │   ├── AdminFees.tsx
│   │   ├── AdminComplaints.tsx
│   │   ├── AdminVisitors.tsx
│   │   ├── AdminReports.tsx
│   │   ├── StudentDashboard.tsx
│   │   ├── StudentComplaints.tsx
│   │   ├── StudentFees.tsx
│   │   └── StudentVisitors.tsx
│   ├── App.tsx              # Root component with routing
│   ├── main.tsx             # Application entry point
│   ├── types.ts             # Shared TypeScript type definitions
│   └── index.css            # Global styles & Tailwind imports
├── firebase-applet-config.json   # Firebase project configuration
├── firebase-blueprint.json       # Firestore schema definition
├── firestore.rules               # Firestore security rules
├── .env.example                  # Environment variable template
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```
 
---
 
## 🗄️ Database Schema
 
HostelMaster Pro uses **Cloud Firestore** with the following collections:
 
```
/users/{userId}        → User profiles & roles
/rooms/{roomId}        → Hostel room records
/students/{studentId}  → Detailed student profiles
/fees/{feeId}          → Fee records & payment status
/complaints/{id}       → Student complaints & resolution
/visitors/{visitorId}  → Visitor entry/exit logs
/settings/{settingsId} → Global hostel configuration (fees)
```
 
See [`firebase-blueprint.json`](firebase-blueprint.json) for the complete schema with field types and constraints.
 
---
 
## 🚀 Getting Started
 
### Prerequisites
 
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- A **Google account** for Firebase
### Installation
 
```bash
# 1. Clone the repository
git clone https://github.com/sameerkumar87694-bit/HostelMaster-Pro.git
 
# 2. Navigate into the project directory
cd HostelMaster-Pro
 
# 3. Install dependencies
npm install
 
# 4. Copy the environment variable template
cp .env.example .env.local
```
 
### Firebase Setup
 
1. Go to the [Firebase Console](https://console.firebase.google.com) and create a new project.
2. **Enable Authentication:**
   - Navigate to **Authentication → Sign-in method**
   - Enable **Email/Password**
3. **Create Firestore Database:**
   - Navigate to **Firestore Database → Create database**
   - Start in **test mode** for development
4. **Register your Web App:**
   - Go to **Project Settings → Your apps → Add app (Web)**
   - Copy the `firebaseConfig` object
5. **Update `firebase-applet-config.json`** with your project's values:
   ```json
   {
     "projectId": "your-project-id",
     "appId": "your-app-id",
     "apiKey": "your-api-key",
     "authDomain": "your-project.firebaseapp.com",
     "firestoreDatabaseId": "(default)",
     "storageBucket": "your-project.appspot.com",
     "messagingSenderId": "your-sender-id"
   }
   ```
 
6. **Deploy Firestore Security Rules:**
   ```bash
   # Install Firebase CLI if not already installed
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Deploy rules
   firebase deploy --only firestore:rules
   ```
 
### Environment Variables
 
Copy `.env.example` to `.env.local` and fill in your values:
 
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
 
> **Note:** Firebase configuration lives in `firebase-applet-config.json`, not in `.env`. Your `.env.local` is only needed for the Gemini API key.
 
### Run Locally
 
```bash
npm run dev
```
 
Open [http://localhost:3000](http://localhost:3000) in your browser.
 
---
 
## 📖 Usage
 
### Admin Portal
 
1. **First-time setup:** Register with email/password and set your role as `admin` in Firestore manually (or via the first-user setup flow).
2. Navigate to `/admin` — you'll see the dashboard with live statistics.
3. Go to **Rooms** to add hostel rooms before registering students.
4. Go to **Settings** to configure gender-based fee rates.
5. Go to **Students** to register students and allocate rooms.
6. Use **Fees**, **Complaints**, and **Visitors** modules as needed.
### Student Portal
 
1. Register or log in with your student credentials.
2. Your dashboard shows your room, pending fees, and complaint status.
3. Submit complaints via the **Complaints** page.
4. Log visitor entries via the **Visitors** page.
5. View your fee history under **Fees**.
---
 
## 🔒 Security Rules
 
The `firestore.rules` file enforces:
 
- **Authenticated access only** — all reads/writes require a signed-in user
- **Role isolation** — students can only read/write their own documents
- **Admin privilege** — full CRUD access for admin users
- **Self-service restriction** — students cannot modify room or fee records directly
Always deploy these rules before going to production:
```bash
firebase deploy --only firestore:rules
```
 
---
 
## ☁️ Deployment
 
### Firebase Hosting (Recommended)
 
```bash
# Build the production bundle
npm run build
 
# Deploy to Firebase Hosting
firebase deploy --only hosting
```
 
### Vercel / Netlify
 
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable: `GEMINI_API_KEY`
---
 
## 🗺️ Roadmap
 
- [x] Role-based authentication (Admin / Student)
- [x] Room allocation with real-time vacancy tracking
- [x] Fee management with gender-based dynamic calculation
- [x] Complaint lifecycle management
- [x] Visitor log with check-in/check-out
- [x] Admin reports dashboard
- [ ] Email notifications for complaint updates and fee reminders
- [ ] Online payment gateway integration (Razorpay/Stripe)
- [ ] File attachments for complaints (Firebase Storage)
- [ ] Mobile app (React Native)
- [ ] AI-powered complaint categorization (Gemini API)
- [ ] Multi-hostel support
- [ ] Biometric/QR visitor verification
---
 
## 🤝 Contributing
 
Contributions are welcome! Please follow these steps:
 
```bash
# 1. Fork the repository
# 2. Create your feature branch
git checkout -b feature/AmazingFeature
 
# 3. Commit your changes
git commit -m 'Add some AmazingFeature'
 
# 4. Push to the branch
git push origin feature/AmazingFeature
 
# 5. Open a Pull Request
```
 
Please ensure your code follows the existing TypeScript patterns and passes `npm run lint` before submitting.
 
---
 
## 📄 License
 
Distributed under the MIT License. See `LICENSE` for more information.
 
---
 
## 🙏 Acknowledgements
 
- [Firebase](https://firebase.google.com) — Backend-as-a-Service platform
- [React](https://react.dev) — Frontend UI framework
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion) — Animation library
- [Lucide React](https://lucide.dev) — Icon library
- [Zod](https://zod.dev) — TypeScript schema validation
- [Google AI Studio](https://ai.studio) — AI-assisted development platform
---
 
<div align="center">
Made with ❤️ for MCA Final Year Project · 2024–25
 
[⬆ Back to top](#-hostelmaster-pro)
 
</div>
