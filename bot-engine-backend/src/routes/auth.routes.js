const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Demasiados intentos' }
});

router.post('/login', loginLimiter, authController.login);
router.post('/login/google', loginLimiter, authController.loginWithGoogle);

module.exports = router;
