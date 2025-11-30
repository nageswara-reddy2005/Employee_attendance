require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

const checkDatabase = async () => {
  try {
    console.log('🔍 Checking MongoDB Connection...\n');

    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.error('❌ MONGO_URI not found in .env file');
      process.exit(1);
    }

    console.log('✓ MONGO_URI found');
    console.log(`  Connection string: ${mongoURI.substring(0, 50)}...\n`);

    // Connect to database
    console.log('⏳ Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB successfully!\n');

    // Check collections
    console.log('📊 Checking Collections...\n');

    const userCount = await User.countDocuments();
    console.log(`Users Collection: ${userCount} documents`);

    if (userCount > 0) {
      const managers = await User.countDocuments({ role: 'manager' });
      const employees = await User.countDocuments({ role: 'employee' });
      console.log(`  - Managers: ${managers}`);
      console.log(`  - Employees: ${employees}`);

      // Show manager details
      const manager = await User.findOne({ role: 'manager' });
      if (manager) {
        console.log(`  - Manager Email: ${manager.email}`);
        console.log(`  - Manager ID: ${manager.employeeId}`);
      }
    }

    console.log('');

    const attendanceCount = await Attendance.countDocuments();
    console.log(`Attendance Collection: ${attendanceCount} documents`);

    if (attendanceCount > 0) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const todayCount = await Attendance.countDocuments({ date: todayStr });
      console.log(`  - Records for today: ${todayCount}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE STATUS: HEALTHY');
    console.log('='.repeat(50));

    if (userCount === 0) {
      console.log('\n⚠️  No users found in database!');
      console.log('Run: npm run seed');
    } else if (userCount > 0 && attendanceCount === 0) {
      console.log('\n⚠️  Users exist but no attendance records!');
      console.log('Run: npm run seed');
    } else {
      console.log('\n✅ Database is ready to use!');
      console.log('\nTest Login:');
      console.log('  Email: manager@example.com');
      console.log('  Password: Pass1234');
    }

    await mongoose.connection.close();
    console.log('\n✓ Connection closed');

  } catch (error) {
    console.error('\n❌ DATABASE ERROR:');
    console.error(`   ${error.message}`);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Tip: Check if MongoDB Atlas cluster is running');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n💡 Tip: Check username/password in MONGO_URI');
    } else if (error.message.includes('getaddrinfo')) {
      console.error('\n💡 Tip: Check internet connection and MongoDB Atlas network access');
    }

    process.exit(1);
  }
};

checkDatabase();
