require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI;

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true, trim: true },
  password: String,
  role: { type: String, enum: ['employee', 'manager'], default: 'employee' },
  employeeId: { type: String, unique: true, sparse: true },
  department: String,
  createdAt: { type: Date, default: Date.now }
});

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  date: String,
  checkInTime: Date,
  checkOutTime: Date,
  status: { type: String, enum: ['present', 'absent', 'late', 'half-day'] },
  totalHours: Number,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);

const departments = ['IT', 'HR', 'Finance', 'Operations', 'Sales', 'Marketing'];

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

const addDummyData = async () => {
  try {
    console.log('\n🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected successfully!\n');

    console.log('📝 Adding Dummy Employees and Attendance Data...\n');

    // Create 15 employees
    const employees = [];
    const employeePassword = await bcrypt.hash('Pass1234', 10);

    console.log('👥 Creating 15 Employees:\n');

    for (let i = 2; i <= 16; i++) {
      const employeeId = `EMP${String(i).padStart(3, '0')}`;
      const department = departments[i % departments.length];
      
      const employee = new User({
        name: `Employee ${i}`,
        email: `employee${i}@example.com`,
        password: employeePassword,
        employeeId,
        department,
        role: 'employee'
      });

      await employee.save();
      employees.push(employee);
      console.log(`✅ ${employeeId} - ${employee.name} (${department})`);
    }

    console.log('\n📅 Generating 30 Days of Attendance Records...\n');

    // Generate attendance records for last 30 days
    const attendanceRecords = [];
    const today = new Date();
    let recordCount = 0;

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
        let status = getRandomStatus(checkInTime);

        let checkOutTime = null;
        let totalHours = null;

        if (status !== 'absent') {
          checkOutTime = new Date(date);
          checkOutTime.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);

          const diffMs = checkOutTime - checkInTime;
          const diffHours = diffMs / (1000 * 60 * 60);
          totalHours = Math.round(diffHours * 100) / 100;

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
        recordCount++;
      }
    }

    await Attendance.insertMany(attendanceRecords);
    console.log(`✅ Created ${recordCount} attendance records\n`);

    // Show statistics
    console.log('━'.repeat(60));
    console.log('\n📊 SUMMARY:\n');

    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const totalManagers = await User.countDocuments({ role: 'manager' });
    const totalAttendance = await Attendance.countDocuments();

    console.log(`Total Employees: ${totalEmployees}`);
    console.log(`Total Managers: ${totalManagers}`);
    console.log(`Total Attendance Records: ${totalAttendance}`);

    // Show department breakdown
    console.log('\n📍 Department Breakdown:\n');
    for (const dept of departments) {
      const count = await User.countDocuments({ department: dept, role: 'employee' });
      if (count > 0) {
        console.log(`   ${dept}: ${count} employees`);
      }
    }

    // Show attendance status breakdown
    console.log('\n📈 Attendance Status Breakdown:\n');
    const statusBreakdown = await Attendance.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    statusBreakdown.forEach(item => {
      console.log(`   ${item._id}: ${item.count} records`);
    });

    // Show sample employees
    console.log('\n🔑 Sample Employee Credentials:\n');
    const sampleEmployees = await User.find({ role: 'employee' }).limit(5);
    sampleEmployees.forEach((emp, index) => {
      console.log(`   ${index + 1}. ${emp.email} / Pass1234`);
    });

    console.log('\n' + '━'.repeat(60));
    console.log('\n✅ SUCCESS! Dummy data added to database!\n');

    console.log('🚀 Next Steps:');
    console.log('   1. Start backend: npm run dev');
    console.log('   2. Start frontend: npm start');
    console.log('   3. Login as manager@example.com / Pass1234');
    console.log('   4. View Manager Dashboard with real data!\n');

    await mongoose.connection.close();
    console.log('✓ Connection closed\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('\n💡 Tip: Duplicate data detected. Data might already exist.');
      console.error('   Run this script again or check the database.');
    }
    process.exit(1);
  }
};

addDummyData();
