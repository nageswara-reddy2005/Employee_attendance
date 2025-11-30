# Employee Attendance System - Setup Guide

## Database Setup with MongoDB Atlas

### Step 1: Verify MongoDB Atlas Connection
Your `.env` file should have:
```
MONGO_URI=mongodb+srv://Nages:Nages%40123@cluster0.m7pbv.mongodb.net/?retryWrites=true&w=majority&appName=Employees_attendence
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
```

### Step 2: Seed the Database with Test Data

Run the seed script to populate the database with manager and employee data:

```bash
# Navigate to backend directory
cd backend

# Run the seed script
npm run seed
```

This will:
- Create 1 manager account
- Create 10 employee accounts
- Generate 30 days of attendance records
- Clear any existing data

### Step 3: Test Login Credentials

After seeding, use these credentials to login:

**Manager Account:**
- Email: `manager@example.com`
- Password: `Pass1234`
- Role: Manager

**Employee Accounts:**
- Email: `employee1@example.com` to `employee10@example.com`
- Password: `Pass1234` (same for all)
- Role: Employee

### Step 4: Troubleshooting

#### Data Not Storing?
1. Check MongoDB Atlas connection:
   - Go to https://cloud.mongodb.com
   - Verify cluster is running
   - Check network access (IP whitelist)

2. Check backend logs:
   - Run: `npm run dev`
   - Look for connection errors

#### Login Not Working?
1. Verify data was seeded:
   - Run: `npm run seed`
   - Check for "✅ Database seeding completed successfully!" message

2. Check browser console for errors:
   - Open DevTools (F12)
   - Check Network tab for API responses
   - Check Console for JavaScript errors

#### Manager Not Appearing?
1. Ensure seed script completed
2. Check MongoDB Atlas directly:
   - Go to Collections
   - Look for "users" collection
   - Verify manager document exists

### Step 5: Start the Application

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm start
```

### Database Collections

After seeding, you should have:

1. **users** collection:
   - 1 manager (role: "manager")
   - 10 employees (role: "employee")

2. **attendances** collection:
   - ~200+ attendance records (30 days × 10 employees, excluding weekends)

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "MONGO_URI not defined" | Check .env file has MONGO_URI |
| "Connection refused" | Verify MongoDB Atlas cluster is running |
| "Authentication failed" | Check username/password in connection string |
| "Data not persisting" | Verify write permissions in MongoDB Atlas |
| "Manager login fails" | Run `npm run seed` to create manager account |
| "Duplicate key error" | Run seed script to clear and recreate data |

### Manual Database Reset

If you need to manually reset the database:

1. Go to MongoDB Atlas
2. Select your cluster
3. Go to Collections
4. Delete the "users" and "attendances" collections
5. Run `npm run seed` again

### Next Steps

1. ✅ Verify MongoDB Atlas connection
2. ✅ Run `npm run seed`
3. ✅ Start backend: `npm run dev`
4. ✅ Start frontend: `npm start`
5. ✅ Login with manager@example.com / Pass1234
