# Employee Attendance System

A full-stack attendance management system built with Node.js, Express, MongoDB, and React.

## 📋 Table of Contents
- [Quick Start](#-quick-start)
- [GitHub Setup](#-github-setup)
- [Local Development](#-local-development)
- [Deployment](#-deployment)
- [Features](#-features)
- [API Endpoints](#-api-endpoints)
- [Troubleshooting](#-troubleshooting)

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB Atlas account (free tier available)
- npm or yarn

### Step 1: Database Setup

Your MongoDB Atlas connection is already configured in `.env`:
```
MONGO_URI=mongodb+srv://Nages:Nages%40123@cluster0.m7pbv.mongodb.net/?retryWrites=true&w=majority&appName=Employees_attendence
```

### Step 2: Seed Database with Test Data

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not done)
npm install

# Check database connection
npm run check-db

# Seed database with manager and employee data
npm run seed
```

**Expected Output:**
```
✓ Manager created: manager@example.com
✓ Employee created: EMP001 (employee1@example.com)
✓ Employee created: EMP002 (employee2@example.com)
... (more employees)
✓ 200+ attendance records created
✅ Database seeding completed successfully!
```

### Step 3: Start Backend Server

```bash
# From backend directory
npm run dev
```

Server will start on `http://localhost:5000`

### Step 4: Start Frontend

```bash
# From frontend directory
cd frontend

# Install dependencies (if not done)
npm install

# Start development server
npm start
```

Frontend will open at `http://localhost:3000`

## 🐙 GitHub Setup

### Push Code to GitHub Repository

```bash
# Clone the repository (if not already done)
git clone https://github.com/nageswara-reddy2005/Employee_attendance.git
cd Employee_attendance

# If starting fresh, initialize git
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Employee Attendance System"

# Set main branch
git branch -M main

# Add remote origin
git remote add origin https://github.com/nageswara-reddy2005/Employee_attendance.git

# Push to GitHub
git push -u origin main
```

### For Subsequent Updates

```bash
# Make your changes, then:
git add .
git commit -m "Your commit message"
git push origin main
```

### GitHub Repository Structure

```
Employee_attendance/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── server.js
│   ├── package.json
│   ├── .env
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── api/
│   │   └── App.jsx
│   ├── package.json
│   ├── .gitignore
│   └── vercel.json
└── README.md
```

## 📝 Login Credentials

### Manager Account
- **Email:** `manager@example.com`
- **Password:** `Pass1234`
- **Access:** Manager Dashboard, All Attendance, Team Calendar, Reports

### Employee Accounts
- **Email:** `employee1@example.com` to `employee10@example.com`
- **Password:** `Pass1234` (same for all)
- **Access:** Employee Dashboard, Mark Attendance, My Attendance

## 💻 Local Development

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Create .env file with your MongoDB URI
echo "MONGO_URI=your_mongodb_uri" > .env
echo "JWT_SECRET=your_secret_key" >> .env
echo "PORT=5000" >> .env

# Seed database with dummy data
npm run reset-dummy-data

# Start development server
npm run dev
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### Available Backend Scripts

```bash
npm run dev                # Start with auto-reload (nodemon)
npm run start              # Start production server
npm run seed               # Seed initial data
npm run reset-dummy-data   # Reset and add 15 employees with 30 days attendance
npm run add-dummy-data     # Add more dummy data
npm run check-db           # Check database connection
npm run add-managers       # Add manager accounts
```

### Available Frontend Scripts

```bash
npm start                  # Start development server
npm run build              # Build for production
npm test                   # Run tests
npm run eject              # Eject from Create React App
```

## 🚀 Deployment

### Deploy Backend to Render

1. Push code to GitHub
2. Go to https://render.com
3. Create new Web Service
4. Connect GitHub repository
5. Set environment variables:
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your secret key
   - `NODE_ENV`: production
6. Deploy

### Deploy Frontend to Vercel

1. Push code to GitHub
2. Go to https://vercel.com
3. Import GitHub repository
4. Set environment variables:
   - `REACT_APP_API_URL`: Your backend URL
5. Deploy

### Database: MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free M0 cluster
3. Get connection string
4. Use in backend `.env` as `MONGO_URI`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance/history` - Get attendance history
- `GET /api/attendance/today` - Get today's attendance

### Dashboard
- `GET /api/dashboard/employee` - Employee dashboard
- `GET /api/dashboard/manager` - Manager dashboard
- `GET /api/dashboard/manager/users/all` - Get all employees
- `GET /api/dashboard/manager/users/:userId` - Get user details

### User Profile
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `POST /api/user/change-password` - Change password

### Chat
- `POST /api/chat/query` - Send chat query

## 🔧 Troubleshooting

### Issue: "Failed to connect to MongoDB"
**Solution:**
1. Check MongoDB Atlas cluster is running
2. Verify IP address is whitelisted in MongoDB Atlas
3. Check MONGO_URI in `.env` file
4. Run: `npm run check-db`

### Issue: "Manager login not working"
**Solution:**
1. Run: `npm run seed` (creates manager account)
2. Wait for "✅ Database seeding completed successfully!" message
3. Try login again

### Issue: "Data not storing in database"
**Solution:**
1. Run: `npm run check-db` to verify connection
2. Check MongoDB Atlas Collections:
   - Go to https://cloud.mongodb.com
   - Select your cluster
   - Go to Collections tab
   - Verify "users" and "attendances" collections exist
3. If collections don't exist, run: `npm run seed`

### Issue: "Duplicate key error" when seeding
**Solution:**
1. Go to MongoDB Atlas
2. Select your cluster
3. Go to Collections
4. Delete "users" and "attendances" collections
5. Run: `npm run seed` again

## 📊 Database Structure

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "manager" | "employee",
  employeeId: String (unique),
  department: String,
  createdAt: Date
}
```

### Attendance Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (reference to User),
  date: String (YYYY-MM-DD),
  checkInTime: Date,
  checkOutTime: Date,
  status: "present" | "absent" | "late" | "half-day",
  totalHours: Number,
  createdAt: Date
}
```

## 🎯 Features

### Manager Features
- 📊 Dashboard with attendance overview
- 👥 View all employee attendance records
- 📅 Team calendar view
- 📈 Generate attendance reports
- 📥 Export attendance data as CSV
- 📊 Weekly trends and department summaries
- 🔴 Late arrivals tracking

### Employee Features
- ✅ Check-in / Check-out
- 📅 View personal attendance history
- 📊 Monthly attendance calendar
- 📈 Attendance statistics
- 👤 Profile management
- 📱 Responsive mobile design

## 🛠️ Available Scripts

### Backend
```bash
npm run dev        # Start development server with auto-reload
npm run start      # Start production server
npm run seed       # Seed database with test data
npm run check-db   # Check database connection and status
```

### Frontend
```bash
npm start          # Start development server
npm run build      # Build for production
npm run test       # Run tests
```

## 🎨 Design Features

- Modern gradient UI with purple/violet theme
- Smooth animations and transitions
- Responsive design (mobile, tablet, desktop)
- Interactive charts and visualizations
- Color-coded attendance status
- Professional card-based layouts

## 📱 Responsive Design

- ✅ Mobile (320px+)
- ✅ Tablet (768px+)
- ✅ Desktop (1024px+)
- ✅ Large screens (1200px+)

## 🔐 Security Features

- JWT token-based authentication
- Password hashing with bcryptjs
- Role-based access control
- Protected routes
- CORS enabled
- Helmet for HTTP headers

## 📦 Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing
- csv-writer for exports

### Frontend
- React
- React Router
- Axios for API calls
- CSS3 with animations
- Context API for state management

## 🚨 Important Notes

1. **First Time Setup:**
   - Always run `npm run seed` after setting up MongoDB
   - This creates the manager account and test data

2. **Database Reset:**
   - To reset data: Delete collections in MongoDB Atlas and run `npm run seed`

3. **Environment Variables:**
   - Backend: `.env` file in backend directory
   - Frontend: `.env` file in frontend directory (optional)

4. **Port Configuration:**
   - Backend: 5000 (configurable in .env)
   - Frontend: 3000 (configurable in package.json)

## 📞 Support

For issues:
1. Check SETUP_GUIDE.md in backend directory
2. Run `npm run check-db` to diagnose problems
3. Check browser console for frontend errors
4. Check backend logs for server errors

## 📄 License

ISC

---

**Happy Tracking! 🎉**
