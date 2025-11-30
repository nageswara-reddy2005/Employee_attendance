require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const testLogin = async () => {
  try {
    console.log('\n🔐 LOGIN TEST - Checking Configuration\n');
    console.log('━'.repeat(60));

    // Check 1: JWT Secret
    console.log('\n1️⃣  JWT Secret Configuration:');
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'your_jwt_secret_key_here') {
      console.log('❌ JWT_SECRET is not configured properly');
      console.log('   Current: ' + jwtSecret);
      process.exit(1);
    } else {
      console.log('✅ JWT_SECRET is configured');
      console.log('   Length: ' + jwtSecret.length + ' characters');
    }

    // Check 2: Database Connection
    console.log('\n2️⃣  Database Connection:');
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.log('❌ MONGO_URI not configured');
      process.exit(1);
    }
    console.log('✅ MONGO_URI configured');

    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Check 3: Find Manager
    console.log('\n3️⃣  Finding Manager in Database:');
    const manager = await User.findOne({ email: 'manager@example.com' });
    
    if (!manager) {
      console.log('❌ Manager not found in database');
      console.log('   Email: manager@example.com');
      console.log('\n   Run: npm run insert-managers');
      process.exit(1);
    }
    console.log('✅ Manager found');
    console.log('   Email: ' + manager.email);
    console.log('   Name: ' + manager.name);
    console.log('   Role: ' + manager.role);
    console.log('   ID: ' + manager.employeeId);

    // Check 4: Password Verification
    console.log('\n4️⃣  Password Verification:');
    const testPassword = 'Pass1234';
    const isPasswordValid = await bcrypt.compare(testPassword, manager.password);
    
    if (!isPasswordValid) {
      console.log('❌ Password verification failed');
      console.log('   Expected: ' + testPassword);
      console.log('   Stored hash: ' + manager.password.substring(0, 20) + '...');
      process.exit(1);
    }
    console.log('✅ Password verification successful');
    console.log('   Password: ' + testPassword + ' ✓');

    // Check 5: JWT Token Generation
    console.log('\n5️⃣  JWT Token Generation:');
    try {
      const token = jwt.sign(
        { userId: manager._id, email: manager.email, role: manager.role },
        jwtSecret,
        { expiresIn: '7d' }
      );
      console.log('✅ JWT Token generated successfully');
      console.log('   Token length: ' + token.length + ' characters');
      console.log('   Token preview: ' + token.substring(0, 50) + '...');

      // Verify token
      const decoded = jwt.verify(token, jwtSecret);
      console.log('✅ JWT Token verified');
      console.log('   User ID: ' + decoded.userId);
      console.log('   Email: ' + decoded.email);
      console.log('   Role: ' + decoded.role);
    } catch (error) {
      console.log('❌ JWT Token error: ' + error.message);
      process.exit(1);
    }

    // Check 6: All Managers
    console.log('\n6️⃣  All Managers in Database:');
    const allManagers = await User.find({ role: 'manager' });
    console.log('✅ Found ' + allManagers.length + ' managers');
    allManagers.forEach((m, index) => {
      console.log(`   ${index + 1}. ${m.email} (${m.name})`);
    });

    console.log('\n' + '━'.repeat(60));
    console.log('\n✅ ALL CHECKS PASSED!\n');
    console.log('🔑 Login Credentials:');
    allManagers.forEach(m => {
      console.log(`   Email: ${m.email}`);
      console.log(`   Password: Pass1234\n`);
    });

    console.log('🚀 Next Steps:');
    console.log('   1. Restart backend: npm run dev');
    console.log('   2. Go to http://localhost:3000');
    console.log('   3. Login with manager@example.com / Pass1234\n');

    await mongoose.connection.close();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  }
};

testLogin();
