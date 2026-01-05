const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware")
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post('/change-password', authMiddleware, authController.changePassword); // Protected
router.post('/forgot-password', authController.forgotPassword); // Public
router.post('/reset-password/:token', authController.resetPassword); // Public
router.delete('/delete-account', authMiddleware, authController.deleteAccount);

module.exports = router;