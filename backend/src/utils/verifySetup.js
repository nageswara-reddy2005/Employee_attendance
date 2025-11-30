require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}`),
  divider: () => console.log(`${colors.cyan}${'─'.repeat(60)}${colors.reset}`)
};

const verifySetup = async () => {
  try {
    log.header('SYSTEM VERIFICATION');
    log.divider();

    // Check 1: Environment Variables
    log.header('1. Environment Variables');
    const mongoURI = process.env.MONGO_URI;
    const jwtSecret = process.env.JWT_SECRET;
    const port = process.env.PORT;

    if (!mongoURI) {
      log.error('MONGO_URI not found in .env');
      process.exit(1);
    }
    log.success('MONGO_URI found');

    // Check if database name is in URI
    if (mongoURI.includes('/employees_attendance')) {
      log.success('Database name specified: employees_attendance');
    } else {
      log.warning('Database name might be missing from MONGO_URI');
      log.info('Expected format: mongodb+srv://user:pass@cluster.mongodb.net/employees_attendance?...');
    }

    if (jwtSecret && jwtSecret !== 'your_jwt_secret_key_here') {
      log.success('JWT_SECRET configured');
    } else {
      log.warning('JWT_SECRET is default or missing');
    }

    log.success(`PORT: ${port || 5000}`);
    log.divider();

    // Check 2: Database Connection
    log.header('2. Database Connection');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    log.success('Connected to MongoDB successfully!');
    log.divider();

    // Check 3: Collections
    log.header('3. Database Collections');
    
    const userCount = await User.countDocuments();
    const attendanceCount = await Attendance.countDocuments();

    console.log(`Users: ${userCount} documents`);
    console.log(`Attendances: ${attendanceCount} documents`);

    if (userCount === 0) {
      log.warning('No users found - Run: npm run seed');
    } else {
      log.success(`Users collection has ${userCount} documents`);
      
      const managers = await User.countDocuments({ role: 'manager' });
      const employees = await User.countDocuments({ role: 'employee' });
      
      console.log(`  - Managers: ${managers}`);
      console.log(`  - Employees: ${employees}`);

      if (managers > 0) {
        const manager = await User.findOne({ role: 'manager' });
        log.success(`Manager found: ${manager.email}`);
      } else {
        log.warning('No manager found - Run: npm run seed');
      }
    }

    if (attendanceCount === 0) {
      log.warning('No attendance records - Run: npm run seed');
    } else {
      log.success(`Attendance collection has ${attendanceCount} documents`);
    }

    log.divider();

    // Check 4: Test Data
    log.header('4. Test Credentials');
    
    if (userCount > 0) {
      const manager = await User.findOne({ role: 'manager' });
      if (manager) {
        console.log(`Manager Email: ${manager.email}`);
        console.log(`Manager Password: Pass1234`);
        log.success('Manager credentials ready');
      }

      const employee = await User.findOne({ role: 'employee' });
      if (employee) {
        console.log(`Employee Email: ${employee.email}`);
        console.log(`Employee Password: Pass1234`);
        log.success('Employee credentials ready');
      }
    }

    log.divider();

    // Final Status
    log.header('VERIFICATION RESULT');
    
    const isReady = userCount > 0 && attendanceCount > 0;
    
    if (isReady) {
      log.success('✨ SYSTEM IS READY TO USE! ✨');
      console.log('\nYou can now:');
      console.log('  1. Start backend: npm run dev');
      console.log('  2. Start frontend: npm start');
      console.log('  3. Login with manager@example.com / Pass1234');
    } else {
      log.warning('System needs setup');
      console.log('\nRun: npm run seed');
    }

    log.divider();

    await mongoose.connection.close();
    console.log('');

  } catch (error) {
    log.error(`Verification failed: ${error.message}`);
    
    if (error.message.includes('ECONNREFUSED')) {
      log.info('MongoDB cluster might not be running');
    } else if (error.message.includes('authentication')) {
      log.info('Check username/password in MONGO_URI');
    } else if (error.message.includes('getaddrinfo')) {
      log.info('Check internet connection and MongoDB Atlas network access');
    }

    process.exit(1);
  }
};

verifySetup();
