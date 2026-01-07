const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { User } = require("../models");
const { Op } = require("sequelize"); // Needed for date comparisons
const { OAuth2Client } = require('google-auth-library');

// SECRET KEY (In production, put this in .env)
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_123";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// EMAIL TRANSPORTER CONFIGURATION
// Use environment variables in .env: EMAIL_USER=yourgmail@gmail.com, EMAIL_PASS=app_password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 1. REGISTER LOGIC
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "Email already taken" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    await User.create({
      email,
      password_hash: hashedPassword
    });

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. LOGIN LOGIC
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find User
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: "User not found" });

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Generate Token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. CHANGE PASSWORD (For Profile Page - Protected Route)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // req.user.id comes from the authMiddleware
    const user = await User.findByPk(req.user.id);

    // Verify old password
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(400).json({ error: "Current password incorrect" });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await user.update({ password_hash: hashedPassword });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. FORGOT PASSWORD (Request Reset Link - Public Route)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    
    // Security: Don't reveal if user exists, just say "If account exists, email sent"
    // But for dev debugging, we return 404 if not found
    if (!user) return res.status(404).json({ error: "User not found" });

    // Generate Secure Token
    const token = crypto.randomBytes(20).toString('hex');
    const expiry = Date.now() + 3600000; // Token valid for 1 hour

    // Save token to DB
    await user.update({ 
      reset_password_token: token,
      reset_password_expires: expiry 
    });

    // Create Link
    // NOTE: Make sure this matches your Frontend URL (localhost:5173 or your deployed domain)
    const resetUrl = `http://localhost:5173/reset-password/${token}`;
    
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset Request - Smart Recall',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process:\n\n
      ${resetUrl}\n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    // Fallback for Development (If no email credentials set up)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("========================================");
      console.log("⚠️ EMAIL CREDENTIALS MISSING IN .ENV");
      console.log("🔗 DEBUG RESET LINK:", resetUrl);
      console.log("========================================");
      return res.json({ message: "Dev Mode: Check server console for reset link" });
    }

    await transporter.sendMail(mailOptions);
    res.json({ message: "Password reset email sent" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send email" });
  }
};

// 5. RESET PASSWORD (Use Token to set new password - Public Route)
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Find user with this token AND ensure token hasn't expired
    const user = await User.findOne({ 
      where: { 
        reset_password_token: token,
        reset_password_expires: { [Op.gt]: Date.now() } // Expiry must be greater than "now"
      }
    });

    if (!user) {
      return res.status(400).json({ error: "Password reset token is invalid or has expired." });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update User & Clear Token
    await user.update({
      password_hash: hashedPassword,
      reset_password_token: null,
      reset_password_expires: null
    });

    res.json({ message: "Password has been successfully changed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 6. DELETE ACCOUNT (Destructive Action)
exports.deleteAccount = async (req, res) => {
  try {
    // req.user.id comes from the authMiddleware
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // DESTROY USER
    // Sequelize CASCADE will automatically delete all related data (Cards, Subjects, etc.)
    await user.destroy();

    res.json({ message: "Account and all data permanently deleted." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete account" });
  }
};

//7. GOOGLE LOGIN
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body; // The token from the frontend

    // 1. Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, 
    });
    
    const payload = ticket.getPayload();
    const { email, sub } = payload; // 'sub' is the unique Google ID

    // 2. Check if user exists in OUR database
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // 3. If not, create a new user automatically
      // We set a random password hash because they won't use a password to login
      const randomPassword = Math.random().toString(36).slice(-8) + "GOOGLE_SECURE";
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        email,
        password_hash: hashedPassword, 
        // If you had a 'name' or 'avatar' column, you could add payload.name here
      });
    }

    // 4. Generate OUR App Token (JWT)
    // This is the same token used in your normal login
    const appToken = jwt.sign(
        { id: user.id, email: user.email }, 
        JWT_SECRET, 
        { expiresIn: "7d" }
    );

    res.json({ token: appToken, user: { id: user.id, email: user.email } });

  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(401).json({ error: "Google authentication failed" });
  }
};