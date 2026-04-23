const express = require('express');
const controller = require('./controller');
const { protect } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/middleware/validate');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema
} = require('./validation');

const router = express.Router();

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.get('/me', protect, controller.getMe);
router.put('/profile', protect, validate(updateProfileSchema), controller.updateProfile);
router.put('/change-password', protect, validate(changePasswordSchema), controller.changePassword);

module.exports = router;
