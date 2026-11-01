// server/controllers/ticketController.js
// Handles collaborative tickets, strict step-by-step escalations,
// dedicated resolver workspace, and department/team groupings for CEO and Managers.

const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Team = require('../models/Team');

// POST /api/tickets — Raise a ticket (Universal for all staff)
exports.createTicket = async (req, res) => {
  try {
    const { title, description, department, priority, imageUrl } = req.body;

    if (!title || !description || !department) {
      return res.status(400).json({ error: 'Title, description, and target department are required.' });
    }

    // Attempt intelligent routing to an active Representative or Team Lead in target department
    let assignedUser = await User.findOne({
      department,
      role: 'representative',
      isActive: true
    });

    if (!assignedUser) {
      assignedUser = await User.findOne({
        department,
        role: 'team_lead',
        isActive: true
      });
    }

    const ticket = await Ticket.create({
      title: title.trim(),
      description: description.trim(),
      department,
      teamId: assignedUser?.teamId || null,
      priority: priority || 'Normal',
      status: 'Submitted',
      currentStageLevel: 1, // Stage 1: Representative / Engineer
      submittedBy: req.user._id,
      assignedTo: assignedUser ? assignedUser._id : null,
      imageUrl: imageUrl || '',
      auditTrail: [{
        action: 'CREATED',
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        notes: `Ticket raised by ${req.user.name} (${req.user.department}).`,
        stageLevel: 1,
        timestamp: new Date()
      }]
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('submittedBy', 'name email department')
      .populate('assignedTo', 'name email role department')
      .populate('teamId', 'name department');

    res.status(201).json(populatedTicket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tickets/my-tickets — Tickets personally submitted by the current user
exports.getMyRaisedTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ submittedBy: req.user._id })
      .populate('submittedBy', 'name email department')
      .populate('assignedTo', 'name role department')
      .populate('teamId', 'name')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tickets/my-workspace — Dedicated queue of tickets assigned specifically to the current user to resolve
exports.getMyWorkspaceTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({
      assignedTo: req.user._id,
      status: { $nin: ['Resolved', 'Rejected'] }
    })
      .populate('submittedBy', 'name email department')
      .populate('assignedTo', 'name email role department')
      .populate('teamId', 'name')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tickets/workspace — Tickets in user's departmental / team queue
exports.getWorkspaceTickets = async (req, res) => {
  try {
    const { role, department, _id } = req.user;
    let query = {};

    if (role === 'ceo') {
      query = {};
    } else if (role === 'manager') {
      query = { department };
    } else if (role === 'team_lead') {
      query = {
        department,
        $or: [
          { currentStageLevel: { $gte: 2 } },
          { assignedTo: _id },
          { status: { $ne: 'Resolved' } }
        ]
      };
    } else if (role === 'representative') {
      query = {
        department,
        $or: [
          { assignedTo: _id },
          { assignedTo: null }
        ]
      };
    } else {
      query = { department };
    }

    const tickets = await Ticket.find(query)
      .populate('submittedBy', 'name email department')
      .populate('assignedTo', 'name email role department')
      .populate('teamId', 'name')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tickets/escalated — Level 3 escalated tickets (Sorted Critical > Moderate > Normal, oldest first)
exports.getEscalatedTickets = async (req, res) => {
  try {
    let query = {
      currentStageLevel: 3,
      status: { $nin: ['Resolved', 'Rejected'] }
    };

    if (req.user.role !== 'ceo') {
      query.department = req.user.department;
    }

    const tickets = await Ticket.find(query)
      .populate('submittedBy', 'name email department')
      .populate('assignedTo', 'name email role department')
      .populate('teamId', 'name')
      .sort({ createdAt: 1 });

    const priorityWeight = { Critical: 0, Moderate: 1, Normal: 2 };
    tickets.sort((a, b) => {
      const pDiff = (priorityWeight[a.priority] ?? 2) - (priorityWeight[b.priority] ?? 2);
      if (pDiff !== 0) return pDiff;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tickets/grouped-by-dept — CEO View: Group queries by department with active metrics
exports.getGroupedByDept = async (req, res) => {
  try {
    const allTickets = await Ticket.find()
      .populate('submittedBy', 'name email department')
      .populate('assignedTo', 'name email role department')
      .populate('teamId', 'name')
      .sort({ createdAt: -1 });

    // Group in memory for rich presentation
    const deptMap = {};

    for (const ticket of allTickets) {
      const dept = ticket.department || 'Unassigned';
      if (!deptMap[dept]) {
        deptMap[dept] = {
          department: dept,
          total: 0,
          critical: 0,
          moderate: 0,
          normal: 0,
          pending: 0,
          resolved: 0,
          tickets: []
        };
      }

      deptMap[dept].total += 1;
      if (ticket.priority === 'Critical') deptMap[dept].critical += 1;
      if (ticket.priority === 'Moderate') deptMap[dept].moderate += 1;
      if (ticket.priority === 'Normal') deptMap[dept].normal += 1;

      if (ticket.status === 'Resolved') {
        deptMap[dept].resolved += 1;
      } else if (ticket.status !== 'Rejected') {
        deptMap[dept].pending += 1;
      }

      deptMap[dept].tickets.push(ticket);
    }

    const groupedArray = Object.values(deptMap).sort((a, b) =>
      a.department.localeCompare(b.department)
    );

    res.json(groupedArray);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tickets/grouped-by-team — Manager View: Group department queries by Teams
exports.getGroupedByTeam = async (req, res) => {
  try {
    const dept = req.user.role === 'ceo' && req.query.department
      ? req.query.department
      : req.user.department;

    // 1. Fetch teams in this department
    const teams = await Team.find({ department: dept })
      .populate('teamLeadId', 'name email')
      .populate('members', 'name email role');

    // 2. Fetch all tickets in this department
    const deptTickets = await Ticket.find({ department: dept })
      .populate('submittedBy', 'name email department')
      .populate('assignedTo', 'name email role department')
      .populate('teamId', 'name')
      .sort({ createdAt: -1 });

    // 3. Map tickets to teams
    const teamGroups = teams.map((team) => {
      const memberIdSet = new Set(team.members.map((m) => m._id.toString()));
      if (team.teamLeadId) memberIdSet.add(team.teamLeadId._id.toString());

      const teamTickets = deptTickets.filter((ticket) => {
        // Linked directly by teamId
        if (ticket.teamId && (ticket.teamId._id?.toString() === team._id.toString() || ticket.teamId.toString() === team._id.toString())) {
          return true;
        }
        // Or assigned to a member of this team
        if (ticket.assignedTo && memberIdSet.has(ticket.assignedTo._id.toString())) {
          return true;
        }
        return false;
      });

      const pending = teamTickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Rejected').length;
      const solved = teamTickets.filter((t) => t.status === 'Resolved').length;

      return {
        teamId: team._id,
        teamName: team.name,
        department: team.department,
        leadName: team.teamLeadId?.name || 'Unassigned Lead',
        members: team.members,
        total: teamTickets.length,
        pending,
        solved,
        tickets: teamTickets
      };
    });

    // 4. Determine tickets not belonging to any team
    const allAssignedTeamTicketIds = new Set();
    teamGroups.forEach((g) => g.tickets.forEach((t) => allAssignedTeamTicketIds.add(t._id.toString())));

    const unassignedTickets = deptTickets.filter((t) => !allAssignedTeamTicketIds.has(t._id.toString()));

    res.json({
      department: dept,
      teams: teamGroups,
      unassigned: unassignedTickets
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/tickets/:id/action — Strictly Scoped Triage & Step-by-Step Escalation
exports.takeTicketAction = async (req, res) => {
  try {
    const { action, notes } = req.body;

    if (!notes || notes.trim() === '') {
      return res.status(400).json({ error: 'Notes are mandatory when taking any ticket action.' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

    // ── 1. Strict Stage-Scoped Authorization Check ──
    const userRole = req.user.role;
    const currentStage = ticket.currentStageLevel;
    let isAuthorized = false;

    if (userRole === 'ceo') {
      // CEO has global authority across all stages
      isAuthorized = true;
    } else if (currentStage === 1) {
      // Stage 1 (Representative / Engineer Level): Reps, Leads, and Managers can act
      isAuthorized = ['representative', 'team_lead', 'manager'].includes(userRole);
    } else if (currentStage === 2) {
      // Stage 2 (Team Lead Level): Only Team Leads and Managers can act
      isAuthorized = ['team_lead', 'manager'].includes(userRole);
    } else if (currentStage === 3) {
      // Stage 3 (Manager Level): Only Department Manager can act
      isAuthorized = ['manager'].includes(userRole);
    }

    if (!isAuthorized) {
      return res.status(403).json({
        error: `Action forbidden: Your role (${userRole}) is not authorized to triage tickets at Stage ${currentStage}.`
      });
    }

    // ── 2. State & Escalation Transitions ──
    const auditEntry = {
      action,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      notes: notes.trim(),
      stageLevel: ticket.currentStageLevel,
      timestamp: new Date()
    };

    if (action === 'RESOLVE') {
      ticket.status = 'Resolved';
      ticket.resolvedAt = new Date();
      ticket.adminRemarks = (ticket.adminRemarks ? ticket.adminRemarks + '\n' : '') +
        `[Resolved by ${req.user.name}] ${notes.trim()}`;
    } else if (action === 'REJECT') {
      ticket.status = 'Rejected';
      ticket.adminRemarks = (ticket.adminRemarks ? ticket.adminRemarks + '\n' : '') +
        `[Rejected by ${req.user.name}] ${notes.trim()}`;
    } else if (action === 'IN_PROGRESS') {
      ticket.status = 'Under Review';
      ticket.adminRemarks = (ticket.adminRemarks ? ticket.adminRemarks + '\n' : '') +
        `[In Progress by ${req.user.name}] ${notes.trim()}`;
    } else if (action === 'ESCALATE') {
      // Strict sequential, tier-by-tier escalation: 1 -> 2 -> 3
      if (ticket.currentStageLevel >= 3) {
        return res.status(400).json({
          error: 'Ticket is already at the highest escalation level (Stage 3: Manager).'
        });
      }

      // Increment strictly by 1
      ticket.currentStageLevel = Math.min(3, ticket.currentStageLevel + 1);
      ticket.status = 'Under Review';
      auditEntry.stageLevel = ticket.currentStageLevel;

      // Smart sequential re-assignment
      if (ticket.currentStageLevel === 2) {
        // Escalate strictly to Team Lead of that department
        const lead = await User.findOne({ role: 'team_lead', department: ticket.department, isActive: true });
        if (lead) {
          ticket.assignedTo = lead._id;
          if (lead.teamId) ticket.teamId = lead.teamId;
        }
      } else if (ticket.currentStageLevel === 3) {
        // Escalate strictly to Department Manager
        const mgr = await User.findOne({ role: 'manager', department: ticket.department, isActive: true });
        if (mgr) {
          ticket.assignedTo = mgr._id;
        }
      }
    } else {
      return res.status(400).json({
        error: 'Invalid action. Supported: RESOLVE, REJECT, ESCALATE, IN_PROGRESS.'
      });
    }

    ticket.auditTrail.push(auditEntry);
    await ticket.save();

    const updated = await Ticket.findById(ticket._id)
      .populate('submittedBy', 'name email department')
      .populate('assignedTo', 'name email role department')
      .populate('teamId', 'name');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
