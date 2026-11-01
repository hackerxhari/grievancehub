// server/controllers/teamController.js
// Handles team creation, team deletion (manual dissolution), and performance analytics

const Team = require('../models/Team');
const User = require('../models/User');
const Ticket = require('../models/Ticket');

// GET /api/teams — List all teams
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('managerId', 'name email department')
      .populate('teamLeadId', 'name email department')
      .populate('members', 'name email role department');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/teams — Create team (Manager or CEO)
exports.createTeam = async (req, res) => {
  try {
    const { name, department, teamLeadId, members } = req.body;

    if (!name || !department || !teamLeadId) {
      return res.status(400).json({ error: 'Team name, department, and team lead are required.' });
    }

    const team = await Team.create({
      name: name.trim(),
      department,
      managerId: req.user.role === 'manager' ? req.user._id : req.body.managerId || req.user._id,
      teamLeadId,
      members: members || []
    });

    // Link teamId on team lead and member user records
    const allMemberIds = [teamLeadId, ...(members || [])];
    await User.updateMany({ _id: { $in: allMemberIds } }, { teamId: team._id });

    const populated = await Team.findById(team._id)
      .populate('teamLeadId', 'name email')
      .populate('members', 'name email');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/teams/:id — Manual Team Dissolution by Department Manager or CEO
exports.deleteTeam = async (req, res) => {
  try {
    const teamId = req.params.id;
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    // Role verification: CEO can delete any team; Managers can delete teams in their department
    if (req.user.role !== 'ceo') {
      if (req.user.role === 'manager' && team.department !== req.user.department) {
        return res.status(403).json({ error: 'You can only dissolve teams within your own department.' });
      }
    }

    // 1. Unassign teamId from all member accounts
    await User.updateMany({ teamId: team._id }, { $set: { teamId: null } });

    // 2. Unassign teamId from any tickets linked to this team
    await Ticket.updateMany({ teamId: team._id }, { $set: { teamId: null } });

    // 3. Delete the team document
    await Team.findByIdAndDelete(team._id);

    res.json({
      message: `Team "${team.name}" has been dissolved successfully. Members and tickets unlinked.`,
      dissolvedTeamId: team._id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/teams/manager-stats — Team performance breakdown for Managers and CEO
exports.getManagerStats = async (req, res) => {
  try {
    let teamQuery = {};
    if (req.user.role === 'manager') {
      teamQuery = { department: req.user.department };
    }

    const teams = await Team.find(teamQuery)
      .populate('managerId', 'name')
      .populate('teamLeadId', 'name')
      .populate('members', 'name');

    const stats = [];
    for (const team of teams) {
      const memberIds = [...team.members.map((m) => m._id), team.teamLeadId?._id].filter(Boolean);

      const total = await Ticket.countDocuments({
        $or: [
          { teamId: team._id },
          { assignedTo: { $in: memberIds } }
        ]
      });

      const solved = await Ticket.countDocuments({
        $or: [
          { teamId: team._id },
          { assignedTo: { $in: memberIds } }
        ],
        status: 'Resolved'
      });

      const pending = await Ticket.countDocuments({
        $or: [
          { teamId: team._id },
          { assignedTo: { $in: memberIds } }
        ],
        status: { $nin: ['Resolved', 'Rejected'] }
      });

      stats.push({
        teamId: team._id,
        teamName: team.name,
        department: team.department,
        leadName: team.teamLeadId?.name || 'Unassigned',
        managerName: team.managerId?.name || 'Unassigned',
        memberCount: team.members.length,
        total,
        solved,
        pending
      });
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/teams/lead-stats — Individual workload statistics under team lead
exports.getLeadStats = async (req, res) => {
  try {
    let team = null;

    if (req.user.role === 'team_lead') {
      team = await Team.findOne({ teamLeadId: req.user._id }).populate('members', 'name email role department');
    } else if (req.user.role === 'manager') {
      team = await Team.findOne({ department: req.user.department }).populate('members', 'name email role department');
    }

    if (!team) {
      // Fallback: list all representatives in the department
      const reps = await User.find({
        department: req.user.department,
        role: { $in: ['representative', 'team_lead'] }
      });

      const stats = [];
      for (const rep of reps) {
        const assigned = await Ticket.countDocuments({ assignedTo: rep._id });
        const resolved = await Ticket.countDocuments({ assignedTo: rep._id, status: 'Resolved' });
        const pending = await Ticket.countDocuments({ assignedTo: rep._id, status: { $nin: ['Resolved', 'Rejected'] } });

        stats.push({
          memberId: rep._id,
          name: rep.name,
          email: rep.email,
          role: rep.role,
          assigned,
          resolved,
          pending
        });
      }
      return res.json(stats);
    }

    const stats = [];
    for (const member of team.members) {
      const assigned = await Ticket.countDocuments({ assignedTo: member._id });
      const resolved = await Ticket.countDocuments({ assignedTo: member._id, status: 'Resolved' });
      const pending = await Ticket.countDocuments({ assignedTo: member._id, status: { $nin: ['Resolved', 'Rejected'] } });

      stats.push({
        memberId: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        assigned,
        resolved,
        pending
      });
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
