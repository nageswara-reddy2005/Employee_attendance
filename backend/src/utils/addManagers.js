require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected to Employee_attendance database');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const addManagers = async () => {
  try {
    await connectDB();

    console.log('\n📝 Adding Managers to Database...\n');

    // Manager data
    const managers = [
      {
        name: 'John Manager',
        email: 'manager@example.com',
        password: 'Pass1234',
        employeeId: 'MAN001',
        department: 'Management'
      },
      {
        name: 'Sarah Admin',
        email: 'admin@example.com',
        password: 'Pass1234',
        employeeId: 'MAN002',
        department: 'Administration'
      },
      {
        name: 'Mike Director',
        email: 'director@example.com',
        password: 'Pass1234',
        employeeId: 'MAN003',
        department: 'Management'
      }
    ];

    // Add each manager
    for (const managerData of managers) {
      try {
        // Check if manager already exists
        const existingManager = await User.findOne({ email: managerData.email });
        
        if (existingManager) {
          console.log(`⏭️  Skipped: ${managerData.email} (already exists)`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(managerData.password, 10);

        // Create manager
        const manager = new User({
          name: managerData.name,
          email: managerData.email,
          password: hashedPassword,
          employeeId: managerData.employeeId,
          department: managerData.department,
          role: 'manager'
        });

        await manager.save();
        console.log(`✅ Manager added: ${managerData.email}`);
        console.log(`   Name: ${managerData.name}`);
        console.log(`   ID: ${managerData.employeeId}`);
        console.log(`   Password: ${managerData.password}\n`);

      } catch (error) {
        if (error.code === 11000) {
          console.log(`⏭️  Skipped: ${managerData.email} (duplicate key)`);
        } else {
          console.error(`❌ Error adding ${managerData.email}:`, error.message);
        }
      }
    }

    // Show all managers
    console.log('\n📊 All Managers in Database:\n');
    const allManagers = await User.find({ role: 'manager' });
    
    if (allManagers.length === 0) {
      console.log('❌ No managers found');
    } else {
      allManagers.forEach((manager, index) => {
        console.log(`${index + 1}. ${manager.name}`);
        console.log(`   Email: ${manager.email}`);
        console.log(`   ID: ${manager.employeeId}`);
        console.log(`   Department: ${manager.department}\n`);
      });
    }

    console.log('✅ Manager addition completed!');
    console.log('\n🔑 Test Credentials:');
    managers.forEach(m => {
      console.log(`   ${m.email} / ${m.password}`);
    });

    await mongoose.connection.close();
    console.log('\n✓ Connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

addManagers();
