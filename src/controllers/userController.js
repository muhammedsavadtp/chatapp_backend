const User = require("../models/User");

exports.searchUsers = async (req, res) => {
  const { username } = req.query;
  try {
    const users = await User.find({ username: new RegExp(username, "i") })
      .select("username name profilePicture")
      .limit(10);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addContact = async (req, res) => {
  const { contactId } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user.contacts.includes(contactId)) {
      user.contacts.push(contactId);
      await user.save();
    }
    res.json({ message: "Contact added" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    // Fetch the authenticated user's details
    const user = await User.findById(req.user.id).select("-password"); // Exclude password

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      username: user.username,
      name: user.name || "",
      bio: user.bio || "",
      profilePicture: user.profilePicture || "",
      status: user.status || "offline",
      lastSeen: user.lastSeen
        ? new Date(user.lastSeen).toLocaleString()
        : "N/A",
      contacts: user.contacts || [], // Include contacts if populated
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, username, bio, profilePicture } = req.body;
    const updateData = {};

    if (req.file) {
      updateData.profilePicture = `/uploads/${req.file.filename}`;
    } else if (
      profilePicture === null ||
      profilePicture === "null" ||
      profilePicture === undefined
    ) {
      updateData.profilePicture = null;
    }

    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;

    if (
      Object.keys(updateData).length === 0 &&
      profilePicture !== null &&
      profilePicture !== "null"
    ) {
      return res.status(400).json({ error: "No fields provided to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: updatedUser._id,
      username: updatedUser.username,
      name: updatedUser.name,
      profilePicture: updatedUser.profilePicture,
      status: updatedUser.status,
      bio: updatedUser.bio,
      lastSeen: updatedUser.lastSeen
        ? new Date(updatedUser.lastSeen).toLocaleString()
        : "N/A",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: error.message });
  }
};

// get user contacts
exports.getContacts = async (req, res) => {
  try {
    // Fetch the authenticated user's document with populated contacts
    const currentUser = await User.findById(req.user.id).populate(
      "contacts",
      "username name profilePicture status lastSeen"
    );

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Map contacts to a simpler structure
    const contacts = currentUser.contacts.map((contact) => ({
      _id: contact._id.toString(),
      name: contact.name || contact.username || "Unknown",
      username: contact.username,
      profilePicture: contact.profilePicture || "/api/placeholder/40/40",
      status: contact.status || "offline",
      lastSeen: contact.lastSeen
        ? new Date(contact.lastSeen).toISOString()
        : undefined,
    }));

    res.json(contacts);
  } catch (error) {
    console.error("Error in getContacts:", error);
    res.status(500).json({ error: error.message });
  }
};
