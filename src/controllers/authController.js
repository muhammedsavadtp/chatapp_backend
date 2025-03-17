const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.register = async (req, res) => {
  const { username, name, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ error: "Username already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, name, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User registered" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({
      token,
      user: {
        id: user._id,
        username,
        name: user.name,
        bio: user.bio,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// New endpoint to validate token
exports.validateToken = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; //  "Bearer <token>"
  if (!token) {
    return res.status(401).json({ valid: false, error: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ valid: false, error: "User not found" });
    }
    res.json({
      valid: true,
      user: { id: user._id, username: user.username, name: user.name },
    });
  } catch (error) {
    res.status(401).json({ valid: false, error: "Invalid or expired token" });
  }
};
