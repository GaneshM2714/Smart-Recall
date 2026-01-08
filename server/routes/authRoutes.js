const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { upload } = require('../utils/cloudinary');
router.post("/register", authController.register);
router.post("/login", authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.post('/change-password', authMiddleware, authController.changePassword); // Protected
router.post('/forgot-password', authController.forgotPassword); // Public
router.post('/reset-password/:token', authController.resetPassword); // Public
router.delete('/delete-account', authMiddleware, authController.deleteAccount);
router.post("/google", authController.googleLogin);
router.post('/avatar', authMiddleware, upload.single('avatar'), authController.uploadAvatar);

module.exports = router;