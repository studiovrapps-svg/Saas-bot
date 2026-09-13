const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Limitar cada IP a 5 peticiones por ventana
    message: { error: 'Demasiados intentos de inicio de sesión desde esta IP, por favor inténtalo de nuevo después de 15 minutos.' }
});

router.post('/login', loginLimiter, authController.login);

module.exports = router;
