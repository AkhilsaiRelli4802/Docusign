const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { encrypt } = require("../utils/encrypt");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

exports.signup = async (req, res) => {
  try {
    const { email, password, openaiKey } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Encrypt OpenAI key if provided
    let encryptedKey = null;
    if (openaiKey) {
      encryptedKey = encrypt(openaiKey);
    }

    const user = await User.create({
      email,
      password: hashedPassword,
      openaiKey: encryptedKey,
    });

    res.status(201).json({
      token: generateToken(user._id),
      user: { id: user._id, email: user.email, hasKey: !!user.openaiKey },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      token: generateToken(user._id),
      user: { id: user._id, email: user.email, hasKey: !!user.openaiKey },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOpenAIKey = async (req, res) => {
  try {
    const { openaiKey } = req.body;
    if (!openaiKey) {
      return res.status(400).json({ message: "OpenAI key is required" });
    }

    const encryptedKey = encrypt(openaiKey);
    await User.findByIdAndUpdate(req.user._id, { openaiKey: encryptedKey });

    res.status(200).json({ message: "OpenAI API key updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
