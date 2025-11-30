const express = require('express');
const {
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
} = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Employee routes
router.post('/checkin', checkIn);
router.post('/checkout', checkOut);
router.get('/my-history', getMyHistory);
router.get('/my-summary', getMySummary);
router.get('/today', getToday);

// Manager routes
router.get('/all', roleMiddleware('manager'), getAllAttendance);
router.get('/employee/:id', roleMiddleware('manager'), getEmployeeAttendance);
router.get('/summary', roleMiddleware('manager'), getTeamSummary);
router.get('/today-status', roleMiddleware('manager'), getTodayStatus);
router.get('/export', roleMiddleware('manager'), exportAttendance);

module.exports = router;
