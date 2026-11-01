// server/controllers/userController.js
// Handles staff provisioning, directory listing, and cascading deletion with team auto-dissolution

const User = require('../models/User');
const Team = require('../models/Team');
const Ticket = require('../models/Ticket');

// GET /api/users — List all active staff members
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .populate('teamId', 'name department')
      .sort({ department: 1, role: 1, name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/users — CEO dynamically provisions a staff member
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      department: department || 'Engineering'
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json(userObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/users/:id — Cascading Deletion & Automatic Team Dissolution
exports.deleteUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;

    // Prevent CEO from deleting themselves
    if (req.user._id.toString() === targetUserId) {
      return res.status(400).json({ error: 'You cannot delete your own CEO account.' });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // 1. Cascade delete all tickets/queries submitted by this user
    const deletedTicketsResult = await Ticket.deleteMany({ submittedBy: targetUserId });

    // 2. Unassign this user from any tickets currently assigned to them
    await Ticket.updateMany(
      { assignedTo: targetUserId },
      { $set: { assignedTo: null } }
    );

    // 3. Remove user ID from any team's `members` list
    await Team.updateMany(
      { members: targetUserId },
      { $pull: { members: targetUserId } }
    );

    // 4. If this user was a Team Lead, clear the reference
    await Team.updateMany(
      { teamLeadId: targetUserId },
      { $set: { teamLeadId: null } }
    );

    // 5. Automatic Team Dissolution:
    // If any team now has 0 members left, automatically dissolve/delete the team document
    const emptyTeams = await Team.find({ members: { $size: 0 } });
    let dissolvedCount = 0;
    for (const emptyTeam of emptyTeams) {
      // Unlink users and tickets that had this teamId
      await User.updateMany({ teamId: emptyTeam._id }, { $set: { teamId: null } });
      await Ticket.updateMany({ teamId: emptyTeam._id }, { $set: { teamId: null } });
      await Team.findByIdAndDelete(emptyTeam._id);
      dissolvedCount++;
    }

    // 6. Delete the user document permanently
    await User.findByIdAndDelete(targetUserId);

    res.json({
      message: 'User removed successfully with cascading ticket cleanup and team auto-dissolution.',
      deletedUserId: targetUserId,
      deletedTicketsCount: deletedTicketsResult.deletedCount,
      dissolvedTeamsCount: dissolvedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
