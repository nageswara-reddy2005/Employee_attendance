const Attendance = require('../models/Attendance');
const User = require('../models/User');

const getDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const startDate = `${year}-${month}-01`;
  
  const nextMonth = parseInt(month) + 1;
  const nextMonthStr = nextMonth > 12 ? '01' : String(nextMonth).padStart(2, '0');
  const nextYear = nextMonth > 12 ? year + 1 : year;
  const endDate = `${nextYear}-${nextMonthStr}-01`;
  
  return { startDate, endDate };
};

const getLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    days.push(`${year}-${month}-${day}`);
  }
  return days;
};

const getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = getDateString();
    const { startDate, endDate } = getMonthRange();

    const todayAttendance = await Attendance.findOne({
      userId,
      date: today
    });

    const monthRecords = await Attendance.find({
      userId,
      date: {
        $gte: startDate,
        $lt: endDate
      }
    });

    const monthSummary = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      totalHours: 0
    };

    monthRecords.forEach(record => {
      if (record.status === 'present') monthSummary.present++;
      if (record.status === 'absent') monthSummary.absent++;
      if (record.status === 'late') monthSummary.late++;
      if (record.status === 'half-day') monthSummary.halfDay++;
      if (record.totalHours) monthSummary.totalHours += record.totalHours;
    });

    monthSummary.totalHours = Math.round(monthSummary.totalHours * 100) / 100;

    const last7Days = getLast7Days();
    const recentRecords = await Attendance.find({
      userId,
      date: {
        $in: last7Days
      }
    }).sort({ date: -1 });

    res.status(200).json({
      todayStatus: todayAttendance || { message: 'No check-in today' },
      monthSummary,
      recentDays: recentRecords
    });
  } catch (error) {
    console.error('Get employee dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
};

const getManagerDashboard = async (req, res) => {
  try {
    const today = getDateString();
    const last7Days = getLast7Days();

    const totalEmployees = await User.countDocuments({ role: 'employee' });

    const todayRecords = await Attendance.find({ date: today }).populate('userId', 'name email employeeId department');

    const todayPresent = todayRecords.filter(a => a.status === 'present' || a.status === 'late').length;
    const todayAbsent = todayRecords.filter(a => a.status === 'absent').length;

    const lateArrivals = todayRecords
      .filter(a => a.status === 'late')
      .map(a => ({
        name: a.userId.name,
        email: a.userId.email,
        employeeId: a.userId.employeeId,
        department: a.userId.department,
        checkInTime: a.checkInTime
      }));

    const weeklyTrend = [];
    for (const date of last7Days) {
      const dayRecords = await Attendance.find({ date });
      const present = dayRecords.filter(a => a.status === 'present' || a.status === 'late').length;
      const absent = dayRecords.filter(a => a.status === 'absent').length;
      const late = dayRecords.filter(a => a.status === 'late').length;

      weeklyTrend.push({
        date,
        present,
        absent,
        late
      });
    }

    const allRecords = await Attendance.find({
      date: {
        $gte: last7Days[0],
        $lte: today
      }
    }).populate('userId', 'department');

    const departmentSummary = {};

    allRecords.forEach(record => {
      const dept = record.userId?.department || 'Unknown';
      if (!departmentSummary[dept]) {
        departmentSummary[dept] = {
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0
        };
      }

      if (record.status === 'present') departmentSummary[dept].present++;
      if (record.status === 'absent') departmentSummary[dept].absent++;
      if (record.status === 'late') departmentSummary[dept].late++;
      if (record.status === 'half-day') departmentSummary[dept].halfDay++;
    });

    res.status(200).json({
      totalEmployees,
      todayStats: {
        present: todayPresent,
        absent: todayAbsent
      },
      lateArrivals,
      weeklyTrend,
      departmentSummary
    });
  } catch (error) {
    console.error('Get manager dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    console.log('Fetching all users data for manager');
    
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .sort({ name: 1 });

    console.log(`Found ${employees.length} employees`);

    const usersWithAttendance = await Promise.all(
      employees.map(async (employee) => {
        const today = getDateString();
        const todayAttendance = await Attendance.findOne({
          userId: employee._id,
          date: today
        });

        const { startDate, endDate } = getMonthRange();
        const monthRecords = await Attendance.find({
          userId: employee._id,
          date: {
            $gte: startDate,
            $lt: endDate
          }
        });

        const monthSummary = {
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0,
          totalHours: 0
        };

        monthRecords.forEach(record => {
          if (record.status === 'present') monthSummary.present++;
          if (record.status === 'absent') monthSummary.absent++;
          if (record.status === 'late') monthSummary.late++;
          if (record.status === 'half-day') monthSummary.halfDay++;
          if (record.totalHours) monthSummary.totalHours += record.totalHours;
        });

        monthSummary.totalHours = Math.round(monthSummary.totalHours * 100) / 100;

        return {
          _id: employee._id,
          name: employee.name,
          email: employee.email,
          employeeId: employee.employeeId,
          department: employee.department,
          phone: employee.phone,
          createdAt: employee.createdAt,
          todayStatus: todayAttendance?.status || 'not-checked-in',
          todayCheckIn: todayAttendance?.checkInTime || null,
          todayCheckOut: todayAttendance?.checkOutTime || null,
          monthSummary
        };
      })
    );

    console.log('Successfully fetched all users with attendance data');

    res.status(200).json({
      total: usersWithAttendance.length,
      users: usersWithAttendance
    });
  } catch (error) {
    console.error('Get all users error:', error.message);
    res.status(500).json({ error: 'Failed to fetch users data: ' + error.message });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching details for user:', userId);

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const attendanceRecords = await Attendance.find({ userId })
      .sort({ date: -1 });

    const stats = {
      totalDays: attendanceRecords.length,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      totalHours: 0
    };

    attendanceRecords.forEach(record => {
      if (record.status === 'present') stats.present++;
      if (record.status === 'absent') stats.absent++;
      if (record.status === 'late') stats.late++;
      if (record.status === 'half-day') stats.halfDay++;
      if (record.totalHours) stats.totalHours += record.totalHours;
    });

    stats.totalHours = Math.round(stats.totalHours * 100) / 100;
    stats.attendancePercentage = stats.totalDays > 0 
      ? Math.round((stats.present / stats.totalDays) * 100) 
      : 0;

    console.log('Successfully fetched user details');

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        department: user.department,
        phone: user.phone,
        createdAt: user.createdAt
      },
      stats,
      recentAttendance: attendanceRecords.slice(0, 30)
    });
  } catch (error) {
    console.error('Get user details error:', error.message);
    res.status(500).json({ error: 'Failed to fetch user details: ' + error.message });
  }
};

module.exports = {
  getEmployeeDashboard,
  getManagerDashboard,
  getAllUsers,
  getUserDetails
};
