const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Direct MongoDB connection
const MONGO_URI = 'mongodb+srv://Nages:Nages%40123@cluster0.m7pbv.mongodb.net/Employee_attendance?retryWrites=true&w=majority&appName=Employees_attendence';

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['employee', 'manager'],
    default: 'employee'
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  department: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

const insertManagers = async () => {
  try {
    console.log('\n🔗 Connecting to MongoDB...');
    console.log(`📍 Database: Employee_attendance\n`);

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected successfully!\n');

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

    console.log('📝 Inserting Managers...\n');

    // Delete existing managers first
    await User.deleteMany({ role: 'manager' });
    console.log('🗑️  Cleared existing managers\n');

    // Insert each manager
    for (const managerData of managers) {
      const hashedPassword = await bcrypt.hash(managerData.password, 10);

      const manager = new User({
        name: managerData.name,
        email: managerData.email,
        password: hashedPassword,
        employeeId: managerData.employeeId,
        department: managerData.department,
        role: 'manager'
      });

      await manager.save();
      console.log(`✅ Added: ${managerData.email}`);
      console.log(`   Name: ${managerData.name}`);
      console.log(`   ID: ${managerData.employeeId}`);
      console.log(`   Password: ${managerData.password}\n`);
    }

    // Verify all managers
    console.log('━'.repeat(60));
    console.log('\n📊 All Managers in Database:\n');

    const allManagers = await User.find({ role: 'manager' });

    allManagers.forEach((manager, index) => {
      console.log(`${index + 1}. ${manager.name}`);
      console.log(`   Email: ${manager.email}`);
      console.log(`   ID: ${manager.employeeId}`);
      console.log(`   Department: ${manager.department}\n`);
    });

    console.log('━'.repeat(60));
    console.log('\n✅ SUCCESS! All managers inserted into Employee_attendance database!\n');

    console.log('🔑 Login Credentials:\n');
    managers.forEach(m => {
      console.log(`   Email: ${m.email}`);
      console.log(`   Password: ${m.password}\n`);
    });

    console.log('━'.repeat(60));
    console.log('\n🚀 Next Steps:');
    console.log('   1. Start backend: npm run dev');
    console.log('   2. Start frontend: npm start');
    console.log('   3. Login with any manager email and password: Pass1234\n');

    await mongoose.connection.close();
    console.log('✓ Connection closed\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  }
};

insertManagers();
