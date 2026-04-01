const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");

const allowedRoles = ["user", "admin", "analyst"];

const sendError = (res, statusCode, message) =>
  res.status(statusCode).json({
    success: false,
    message,
  });

const buildToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const buildAuthResponse = (user, statusCode, res, message) => {
  const token = buildToken(user._id, user.role);

  return res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
const normalizeEmail = (email) => email.trim().toLowerCase();
const findUserByEmail = (email) => User.findOne({ email: normalizeEmail(email) });

const buildResetToken = () => crypto.randomBytes(24).toString("hex");

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 400, "Name, email, and password are required");
    }

    if (!validateEmail(email)) {
      return sendError(res, 400, "Please provide a valid email address");
    }

    if (password.length < 6) {
      return sendError(res, 400, "Password must be at least 6 characters long");
    }

    if (role && !allowedRoles.includes(role)) {
      return sendError(res, 400, "Role must be user, admin, or analyst");
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return sendError(res, 409, "User already exists with this email");
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizeEmail(email),
      password,
      role: role || "user",
    });

    return buildAuthResponse(user, 201, res, "User registered successfully");
  } catch (error) {
    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, "Email and password are required");
    }

    if (!validateEmail(email)) {
      return sendError(res, 400, "Please provide a valid email address");
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return sendError(res, 401, "Invalid email or password");
    }

    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return sendError(res, 401, "Invalid email or password");
    }

    return buildAuthResponse(user, 200, res, "Login successful");
  } catch (error) {
    return next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, "Email is required");
    }

    if (!validateEmail(email)) {
      return sendError(res, 400, "Please provide a valid email address");
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return sendError(res, 404, "No user found with this email");
    }

    const resetToken = buildResetToken();
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 30);

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpiry;
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    return res.status(200).json({
      success: true,
      message: "Password reset link generated successfully",
      resetToken,
      resetUrl,
    });
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token) {
      return sendError(res, 400, "Reset token is required");
    }

    if (!password || !confirmPassword) {
      return sendError(res, 400, "Password and confirm password are required");
    }

    if (password.length < 6) {
      return sendError(res, 400, "Password must be at least 6 characters long");
    }

    if (password !== confirmPassword) {
      return sendError(res, 400, "Passwords do not match");
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return sendError(res, 400, "Reset link is invalid or expired");
    }

    user.password = password;
    user.passwordResetToken = "";
    user.passwordResetExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
};
