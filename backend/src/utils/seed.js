require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const getDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getRandomTime = (hour, minute) => {
  const randomMinute = Math.floor(Math.random() * 60);
  return new Date(new Date().setHours(hour, randomMinute, 0, 0));
};

const getRandomStatus = (checkInTime) => {
  const hour = checkInTime.getHours();
  const minute = checkInTime.getMinutes();
  
  if (hour > 9 || (hour === 9 && minute > 30)) {
    return 'late';
  }
  
  const rand = Math.random();
  if (rand < 0.05) return 'absent';
  return 'present';
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Attendance.deleteMany({});
    console.log('Cleared existing data');

    // Create manager
    const managerPassword = await bcrypt.hash('Pass1234', 10);
    const manager = new User({
      name: 'John Manager',
      email: 'manager@example.com',
      password: managerPassword,
      employeeId: 'MAN001',
      department: 'Management',
      role: 'manager'
    });
    await manager.save();
    console.log('✓ Manager created: manager@example.com');

    // Create employees
    const departments = ['IT', 'HR', 'Finance', 'Operations', 'Sales', 'Marketing'];
    const employees = [];
    const employeePassword = await bcrypt.hash('Pass1234', 10);

    for (let i = 1; i <= 10; i++) {
      const employeeId = `EMP${String(i).padStart(3, '0')}`;
      const employee = new User({
        name: `Employee ${i}`,
        email: `employee${i}@example.com`,
        password: employeePassword,
        employeeId,
        department: departments[i % departments.length],
        role: 'employee'
      });
      await employee.save();
      employees.push(employee);
      console.log(`✓ Employee created: ${employeeId} (${employee.email})`);
    }

    // Generate attendance records for last 30 days
    const attendanceRecords = [];
    const today = new Date();

    for (const employee of employees) {
      for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        const dayOfWeek = date.getDay();

        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          continue;
        }

        const dateString = getDateString(date);
        const checkInTime = getRandomTime(8, 30);
        const status = getRandomStatus(checkInTime);

        let checkOutTime = null;
        let totalHours = null;

        if (status !== 'absent') {
          // Random check-out time between 17:00 and 18:30
          checkOutTime = new Date(date);
          checkOutTime.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);

          // Calculate total hours
          const diffMs = checkOutTime - checkInTime;
          const diffHours = diffMs / (1000 * 60 * 60);
          totalHours = Math.round(diffHours * 100) / 100;

          // Update status if less than 4 hours
          if (totalHours < 4) {
            status = 'half-day';
          }
        }

        const attendance = new Attendance({
          userId: employee._id,
          date: dateString,
          checkInTime: status !== 'absent' ? checkInTime : null,
          checkOutTime,
          status,
          totalHours
        });

        attendanceRecords.push(attendance);
      }
    }

    await Attendance.insertMany(attendanceRecords);
    console.log(`✓ ${attendanceRecords.length} attendance records created`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nTest Credentials:');
    console.log('Manager: manager@example.com / Pass1234');
    console.log('Employees: employee1@example.com - employee10@example.com / Pass1234');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
