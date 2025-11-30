const express = require('express');
const { 
  getEmployeeDashboard, 
  getManagerDashboard,
  getAllUsers,
  getUserDetails
} = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/employee', getEmployeeDashboard);
router.get('/manager', roleMiddleware('manager'), getManagerDashboard);
router.get('/manager/users/all', roleMiddleware('manager'), getAllUsers);
router.get('/manager/users/:userId', roleMiddleware('manager'), getUserDetails);

module.exports = router;
