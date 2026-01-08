const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { User } = require("../models");
const { Op } = require("sequelize"); 
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_123";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 1. REGISTER
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body; // Added name support

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "Email already taken" });

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      email,
      name: name || "User", // Default name if none provided
      password_hash: hashedPassword,
      auth_provider: 'email'
    });

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. LOGIN (Includes Avatar)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email, provider: user.auth_provider || 'email' }, JWT_SECRET, { expiresIn: "7d" });

    // ✅ FIX: Sending avatar here
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        avatar: user.avatar 
      } 
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. GET CURRENT USER (Crucial for Page Refresh)
exports.getMe = async (req, res) => {
  try {
    // Debugging: Check if middleware passed the user
    // console.log("🔍 GetMe Request User:", req.user);

    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized: No user ID in request" });
    }

    // SAFER QUERY: Don't ask for specific columns like 'auth_provider' if they might be missing
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] } // Just exclude the password, get everything else
    });
    
    if (!user) {
        console.log("❌ User not found in DB for ID:", req.user.id);
        return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("🔥 GetMe Error:", error); // This prints the crash reason to your terminal
    res.status(500).json({ error: error.message });
  }
};
// 4. UPDATE PROFILE (Name/Avatar text update)
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByPk(req.user.id);

    if (name) user.name = name;
    if (avatar) user.avatar = avatar; // Persist URL to DB

    await user.save();

    // ✅ FIX: Returning updated avatar
    res.json({ 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        avatar: user.avatar 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(400).json({ error: "Current password incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password_hash: hashedPassword });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 6. FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const token = crypto.randomBytes(20).toString('hex');
    const expiry = Date.now() + 3600000; 

    await user.update({ reset_password_token: token, reset_password_expires: expiry });

    const resetUrl = `http://localhost:5173/reset-password/${token}`;
    
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset Request - Smart Recall',
      text: `Reset your password here: ${resetUrl}`
    };

    if (!process.env.EMAIL_USER) {
      console.log("DEBUG LINK:", resetUrl);
      return res.json({ message: "Dev Mode: Check console" });
    }

    await transporter.sendMail(mailOptions);
    res.json({ message: "Password reset email sent" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send email" });
  }
};

// 7. RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({ 
      where: { 
        reset_password_token: token,
        reset_password_expires: { [Op.gt]: Date.now() } 
      }
    });

    if (!user) return res.status(400).json({ error: "Invalid/Expired Token" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({ password_hash: hashedPassword, reset_password_token: null, reset_password_expires: null });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 8. GOOGLE LOGIN (Includes Avatar from Google)
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body; 

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, 
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture } = payload; // Google gives us 'picture'

    let user = await User.findOne({ where: { email } });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8) + "GOOGLE_SECURE";
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        email,
        name: name || "Google User",
        avatar: picture, // ✅ FIX: Save Google Photo to DB
        password_hash: hashedPassword, 
        auth_provider: 'google'
      });
    }

    const appToken = jwt.sign(
        { id: user.id, email: user.email, provider: user.auth_provider || 'email'}, 
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    // ✅ FIX: Return Avatar to Frontend
    res.json({ 
        token: appToken, 
        user: { 
            id: user.id, 
            email: user.email, 
            name: user.name, 
            avatar: user.avatar 
        } 
    });

  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(401).json({ error: "Google authentication failed" });
  }
};

// 9. UPLOAD AVATAR (Cloudinary)
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const avatarUrl = req.file.path; 

    await User.update({ avatar: avatarUrl }, { where: { id: req.user.id } });

    // ✅ FIX: Return URL so frontend updates immediately
    res.json({ message: "Avatar updated", avatar: avatarUrl });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "Image upload failed" });
  }
};

// 10. DELETE ACCOUNT
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await user.destroy();
    res.json({ message: "Account deleted." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete account" });
  }
};