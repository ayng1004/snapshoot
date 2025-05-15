// services/auth-service/src/routes/auth.routes.js
const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// Une seule route pour tester
router.post('/register', authController.register);

module.exports = router;