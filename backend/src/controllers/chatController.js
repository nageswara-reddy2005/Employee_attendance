const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Helper function to extract keywords
const hasKeyword = (message, keywords) => {
  const lowerMsg = message.toLowerCase();
  return keywords.some(keyword => lowerMsg.includes(keyword));
};

// Helper function to get today's date string
const getTodayDateString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

// Employee Intent: Check-in status
const handleCheckInStatus = async (userId) => {
  try {
    const today = getTodayDateString();
    const attendance = await Attendance.findOne({
      userId: userId,
      date: today
    });

    if (!attendance) {
      return "You haven't checked in today yet. Would you like to check in now?";
    }

    if (attendance.checkOutTime) {
      return `✓ You checked in at ${new Date(attendance.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} and checked out at ${new Date(attendance.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}. Total hours: ${attendance.totalHours}h. Status: ${attendance.status}`;
    } else {
      return `✓ You checked in at ${new Date(attendance.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}. You're currently checked in. Status: ${attendance.status}`;
    }
  } catch (error) {
    console.error('Error checking status:', error);
    return "Sorry, I couldn't fetch your check-in status. Please try again.";
  }
};

// Employee Intent: Monthly summary
const handleMonthlySummary = async (userId) => {
  try {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const attendance = await Attendance.find({
      userId: userId,
      date: {
        $gte: firstDay.toISOString().split('T')[0],
        $lte: lastDay.toISOString().split('T')[0]
      }
    });

    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      totalHours: 0
    };

    attendance.forEach(record => {
      if (record.status === 'present') summary.present++;
      else if (record.status === 'absent') summary.absent++;
      else if (record.status === 'late') summary.late++;
      else if (record.status === 'half-day') summary.halfDay++;
      summary.totalHours += record.totalHours || 0;
    });

    return `📊 Your Monthly Summary:\n✓ Present: ${summary.present} days\n✗ Absent: ${summary.absent} days\n⏰ Late: ${summary.late} days\n📅 Half Days: ${summary.halfDay} days\n⏱ Total Hours: ${Math.round(summary.totalHours)}h`;
  } catch (error) {
    console.error('Error fetching summary:', error);
    return "Sorry, I couldn't fetch your monthly summary. Please try again.";
  }
};

// Employee Intent: Attendance history
const handleAttendanceHistory = async (userId) => {
  try {
    const attendance = await Attendance.find({ userId: userId })
      .sort({ date: -1 })
      .limit(7);

    if (attendance.length === 0) {
      return "No attendance records found.";
    }

    let history = "📋 Your Last 7 Days:\n";
    attendance.forEach((record, index) => {
      const checkIn = record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
      const checkOut = record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
      history += `\n${index + 1}. ${record.date} - ${record.status.toUpperCase()}\n   In: ${checkIn} | Out: ${checkOut} | Hours: ${record.totalHours || 0}h`;
    });

    return history;
  } catch (error) {
    console.error('Error fetching history:', error);
    return "Sorry, I couldn't fetch your attendance history. Please try again.";
  }
};

// Employee Intent: Check-in
const handleCheckIn = async (userId) => {
  try {
    const today = getTodayDateString();
    let attendance = await Attendance.findOne({
      userId: userId,
      date: today
    });

    if (attendance && attendance.checkInTime) {
      return "You've already checked in today at " + new Date(attendance.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    if (!attendance) {
      attendance = new Attendance({
        userId: userId,
        date: today,
        checkInTime: new Date(),
        status: 'present'
      });
    } else {
      attendance.checkInTime = new Date();
      attendance.status = 'present';
    }

    await attendance.save();
    return "✓ Check-in successful! Time: " + new Date(attendance.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Error checking in:', error);
    return "Sorry, check-in failed. Please try again.";
  }
};

// Employee Intent: Check-out
const handleCheckOut = async (userId) => {
  try {
    const today = getTodayDateString();
    const attendance = await Attendance.findOne({
      userId: userId,
      date: today
    });

    if (!attendance || !attendance.checkInTime) {
      return "You haven't checked in today yet. Please check in first.";
    }

    if (attendance.checkOutTime) {
      return "You've already checked out today at " + new Date(attendance.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    attendance.checkOutTime = new Date();
    const checkInTime = new Date(attendance.checkInTime);
    const checkOutTime = new Date(attendance.checkOutTime);
    const diffMs = checkOutTime - checkInTime;
    const diffHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
    attendance.totalHours = parseFloat(diffHours);

    await attendance.save();
    return `✓ Check-out successful! Time: ${checkOutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}\n⏱ Total Hours: ${diffHours}h`;
  } catch (error) {
    console.error('Error checking out:', error);
    return "Sorry, check-out failed. Please try again.";
  }
};

// Manager Intent: Present employees today
const handlePresentToday = async () => {
  try {
    const today = getTodayDateString();
    const presentCount = await Attendance.countDocuments({
      date: today,
      status: 'present'
    });

    return `👥 Present Today: ${presentCount} employees`;
  } catch (error) {
    console.error('Error fetching present count:', error);
    return "Sorry, I couldn't fetch the present count. Please try again.";
  }
};

// Manager Intent: Absent employees today
const handleAbsentToday = async () => {
  try {
    const today = getTodayDateString();
    const absentRecords = await Attendance.find({
      date: today,
      status: 'absent'
    }).populate('userId', 'name employeeId');

    if (absentRecords.length === 0) {
      return "✓ No absent employees today!";
    }

    let absentList = "📋 Absent Today:\n";
    absentRecords.forEach((record, index) => {
      absentList += `\n${index + 1}. ${record.userId.name} (${record.userId.employeeId})`;
    });

    return absentList;
  } catch (error) {
    console.error('Error fetching absent list:', error);
    return "Sorry, I couldn't fetch the absent list. Please try again.";
  }
};

// Manager Intent: Team summary
const handleTeamSummary = async () => {
  try {
    const today = getTodayDateString();
    const attendance = await Attendance.find({ date: today });

    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0
    };

    attendance.forEach(record => {
      if (record.status === 'present') summary.present++;
      else if (record.status === 'absent') summary.absent++;
      else if (record.status === 'late') summary.late++;
      else if (record.status === 'half-day') summary.halfDay++;
    });

    return `📊 Team Summary (Today):\n✓ Present: ${summary.present}\n✗ Absent: ${summary.absent}\n⏰ Late: ${summary.late}\n📅 Half Days: ${summary.halfDay}`;
  } catch (error) {
    console.error('Error fetching team summary:', error);
    return "Sorry, I couldn't fetch the team summary. Please try again.";
  }
};

// Default response
const getDefaultResponse = () => {
  return `I'm not sure about that. Try asking things like:\n\n📍 For Employees:\n• "Did I check in today?"\n• "Show my summary"\n• "Show my history"\n• "Check in"\n• "Check out"\n\n👔 For Managers:\n• "How many present today?"\n• "Who is absent today?"\n• "Team summary"`;
};

// Main handler
exports.handleQuery = async (req, res) => {
  try {
    const { message } = req.body;
    
    // JWT token contains userId field
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    console.log('Chat query:', { message, userId, userRole, user: req.user });

    if (!message || message.trim() === '') {
      return res.json({ reply: "Please enter a message." });
    }

    if (!userId) {
      console.error('No userId found in request:', req.user);
      return res.json({ reply: "Authentication error. Please login again." });
    }

    const lowerMsg = message.toLowerCase();
    let reply = '';

    // Check for check-in status first (before check-in action)
    if ((lowerMsg.includes('check in') || lowerMsg.includes('checkin')) && (lowerMsg.includes('did') || lowerMsg.includes('status') || lowerMsg.includes('today'))) {
      console.log('Matched: check-in status');
      reply = await handleCheckInStatus(userId);
    }
    // Check-out action (check before check-in to avoid confusion)
    else if (lowerMsg.includes('check out') || lowerMsg.includes('checkout') || lowerMsg.includes('mark out')) {
      console.log('Matched: check-out');
      reply = await handleCheckOut(userId);
    }
    // Check-in action
    else if (lowerMsg.includes('check in') || lowerMsg.includes('checkin') || lowerMsg.includes('mark in')) {
      console.log('Matched: check-in');
      reply = await handleCheckIn(userId);
    }
    // Monthly summary
    else if (lowerMsg.includes('summary') && !lowerMsg.includes('team')) {
      console.log('Matched: summary');
      reply = await handleMonthlySummary(userId);
    }
    // Attendance history
    else if (lowerMsg.includes('history') || lowerMsg.includes('last 7') || lowerMsg.includes('attendance')) {
      console.log('Matched: history');
      reply = await handleAttendanceHistory(userId);
    }
    // Manager intents
    else if (userRole === 'manager') {
      if ((lowerMsg.includes('present') || lowerMsg.includes('how many')) && lowerMsg.includes('today')) {
        console.log('Matched: present today');
        reply = await handlePresentToday();
      } else if (lowerMsg.includes('absent') && lowerMsg.includes('today')) {
        console.log('Matched: absent today');
        reply = await handleAbsentToday();
      } else if (lowerMsg.includes('summary') || lowerMsg.includes('team')) {
        console.log('Matched: team summary');
        reply = await handleTeamSummary();
      } else {
        console.log('No manager match, using default');
        reply = getDefaultResponse();
      }
    } else {
      console.log('No match, using default');
      reply = getDefaultResponse();
    }

    console.log('Reply:', reply);
    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.json({ 
      reply: "I encountered an error processing your request. Please try again or contact support." 
    });
  }
};
