const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { createObjectCsvWriter } = require('csv-writer');

const getDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTimeString = (date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const isLateTime = (checkInTime) => {
  const hours = checkInTime.getHours();
  const minutes = checkInTime.getMinutes();
  return hours > 9 || (hours === 9 && minutes > 30);
};

const checkIn = async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = getDateString();

    // Check if already checked in today
    const existingCheckIn = await Attendance.findOne({
      userId,
      date: today
    });

    if (existingCheckIn) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const checkInTime = new Date();
    const status = isLateTime(checkInTime) ? 'late' : 'present';

    const attendance = new Attendance({
      userId,
      date: today,
      checkInTime,
      status
    });

    await attendance.save();

    res.status(201).json({
      message: 'Checked in successfully',
      attendance
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Check-in failed' });
  }
};

const checkOut = async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = getDateString();

    // Find today's attendance entry
    const attendance = await Attendance.findOne({
      userId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({ error: 'No check-in found for today' });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ error: 'Already checked out today' });
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(attendance.checkInTime);

    // Calculate total hours
    const diffMs = checkOutTime - checkInTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    const totalHours = Math.round(diffHours * 100) / 100;

    // Update status if less than 4 hours
    let status = attendance.status;
    if (totalHours < 4) {
      status = 'half-day';
    }

    attendance.checkOutTime = checkOutTime;
    attendance.totalHours = totalHours;
    attendance.status = status;

    await attendance.save();

    res.status(200).json({
      message: 'Checked out successfully',
      attendance
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: 'Check-out failed' });
  }
};

const getMyHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, page = 1, limit = 30 } = req.query;

    let query = { userId };

    // Filter by month if provided (format: YYYY-MM)
    if (month) {
      const startDate = `${month}-01`;
      const [year, monthNum] = month.split('-');
      const nextMonth = parseInt(monthNum) + 1;
      const nextMonthStr = nextMonth > 12 ? '01' : String(nextMonth).padStart(2, '0');
      const nextYear = nextMonth > 12 ? parseInt(year) + 1 : year;
      const endDate = `${nextYear}-${nextMonthStr}-01`;

      query.date = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const skip = (page - 1) * limit;
    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.status(200).json({
      attendance,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

const getMySummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month } = req.query;

    let query = { userId };

    // Filter by month if provided (format: YYYY-MM)
    if (month) {
      const startDate = `${month}-01`;
      const [year, monthNum] = month.split('-');
      const nextMonth = parseInt(monthNum) + 1;
      const nextMonthStr = nextMonth > 12 ? '01' : String(nextMonth).padStart(2, '0');
      const nextYear = nextMonth > 12 ? parseInt(year) + 1 : year;
      const endDate = `${nextYear}-${nextMonthStr}-01`;

      query.date = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const records = await Attendance.find(query);

    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      totalHours: 0
    };

    records.forEach(record => {
      if (record.status === 'present') summary.present++;
      if (record.status === 'absent') summary.absent++;
      if (record.status === 'late') summary.late++;
      if (record.status === 'half-day') summary.halfDay++;
      if (record.totalHours) summary.totalHours += record.totalHours;
    });

    summary.totalHours = Math.round(summary.totalHours * 100) / 100;

    res.status(200).json(summary);
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
};

const getToday = async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = getDateString();

    const attendance = await Attendance.findOne({
      userId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({ error: 'No attendance record for today' });
    }

    res.status(200).json(attendance);
  } catch (error) {
    console.error('Get today error:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s attendance' });
  }
};

const getAllAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, page = 1, limit = 30 } = req.query;

    let query = {};

    if (employeeId) {
      const user = await User.findOne({ employeeId });
      if (user) {
        query.userId = user._id;
      } else {
        return res.status(404).json({ error: 'Employee not found' });
      }
    }

    if (date) {
      query.date = date;
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const attendance = await Attendance.find(query)
      .populate('userId', 'name email employeeId department')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.status(200).json({
      attendance,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
};

const getEmployeeAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 30 } = req.query;

    const user = await User.findOne({ employeeId: id });
    if (!user) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const skip = (page - 1) * limit;
    const attendance = await Attendance.find({ userId: user._id })
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments({ userId: user._id });

    res.status(200).json({
      employee: {
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        department: user.department
      },
      attendance,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get employee attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch employee attendance' });
  }
};

const getTeamSummary = async (req, res) => {
  try {
    const { start, end } = req.query;

    let query = {};

    if (start && end) {
      query.date = {
        $gte: start,
        $lte: end
      };
    }

    const records = await Attendance.find(query).populate('userId', 'department');

    const statusSummary = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      totalHours: 0
    };

    const departmentSummary = {};

    records.forEach(record => {
      // Status summary
      if (record.status === 'present') statusSummary.present++;
      if (record.status === 'absent') statusSummary.absent++;
      if (record.status === 'late') statusSummary.late++;
      if (record.status === 'half-day') statusSummary.halfDay++;
      if (record.totalHours) statusSummary.totalHours += record.totalHours;

      // Department summary
      const dept = record.userId?.department || 'Unknown';
      if (!departmentSummary[dept]) {
        departmentSummary[dept] = {
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0,
          totalHours: 0
        };
      }

      if (record.status === 'present') departmentSummary[dept].present++;
      if (record.status === 'absent') departmentSummary[dept].absent++;
      if (record.status === 'late') departmentSummary[dept].late++;
      if (record.status === 'half-day') departmentSummary[dept].halfDay++;
      if (record.totalHours) departmentSummary[dept].totalHours += record.totalHours;
    });

    statusSummary.totalHours = Math.round(statusSummary.totalHours * 100) / 100;
    Object.keys(departmentSummary).forEach(dept => {
      departmentSummary[dept].totalHours = Math.round(departmentSummary[dept].totalHours * 100) / 100;
    });

    res.status(200).json({
      statusSummary,
      departmentSummary
    });
  } catch (error) {
    console.error('Get team summary error:', error);
    res.status(500).json({ error: 'Failed to fetch team summary' });
  }
};

const getTodayStatus = async (req, res) => {
  try {
    const today = getDateString();

    const attendance = await Attendance.find({ date: today })
      .populate('userId', 'name email employeeId department')
      .sort({ checkInTime: -1 });

    const presentEmployees = attendance.filter(a => a.status === 'present' || a.status === 'late');

    res.status(200).json({
      date: today,
      totalPresent: presentEmployees.length,
      employees: presentEmployees.map(a => ({
        name: a.userId.name,
        email: a.userId.email,
        employeeId: a.userId.employeeId,
        department: a.userId.department,
        status: a.status,
        checkInTime: a.checkInTime,
        checkOutTime: a.checkOutTime
      }))
    });
  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s status' });
  }
};

const exportAttendance = async (req, res) => {
  try {
    const { start, end, employeeId } = req.query;

    let query = {};

    if (employeeId) {
      const user = await User.findOne({ employeeId });
      if (user) {
        query.userId = user._id;
      } else {
        return res.status(404).json({ error: 'Employee not found' });
      }
    }

    if (start && end) {
      query.date = {
        $gte: start,
        $lte: end
      };
    }

    const records = await Attendance.find(query).populate('userId', 'name email employeeId department');

    // Format data for CSV
    const csvData = records.map(record => ({
      employeeId: record.userId.employeeId,
      name: record.userId.name,
      email: record.userId.email,
      department: record.userId.department,
      date: record.date,
      checkInTime: record.checkInTime ? new Date(record.checkInTime).toLocaleString() : '',
      checkOutTime: record.checkOutTime ? new Date(record.checkOutTime).toLocaleString() : '',
      status: record.status,
      totalHours: record.totalHours || ''
    }));

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance-export.csv"');

    // Write CSV header
    const headers = ['Employee ID', 'Name', 'Email', 'Department', 'Date', 'Check In', 'Check Out', 'Status', 'Total Hours'];
    res.write(headers.join(',') + '\n');

    // Write CSV rows
    csvData.forEach(row => {
      const values = [
        row.employeeId,
        `"${row.name}"`,
        row.email,
        `"${row.department}"`,
        row.date,
        row.checkInTime,
        row.checkOutTime,
        row.status,
        row.totalHours
      ];
      res.write(values.join(',') + '\n');
    });

    res.end();
  } catch (error) {
    console.error('Export attendance error:', error);
    res.status(500).json({ error: 'Failed to export attendance' });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyHistory,
  getMySummary,
  getToday,
  getAllAttendance,
  getEmployeeAttendance,
  getTeamSummary,
  getTodayStatus,
  exportAttendance
};
