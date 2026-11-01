// server/server.js
// GrievanceOps — Production-ready Express API with JWT authentication, bcrypt encryption,
// universal employee ticketing, cascading deletion, and intra-organization team routing.

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const { authenticate, requireRole, JWT_SECRET } = require('./middleware/auth');

// Controllers
const userController = require('./controllers/userController');
const teamController = require('./controllers/teamController');
const ticketController = require('./controllers/ticketController');

const app = express();

// ──────────────────────── Middleware ────────────────────────
app.use(cors());
app.use(express.json());

// ──────────────────────── MongoDB Connection ────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grievanceops';
const DB_NAME = process.env.DB_NAME || 'grievanceops';

mongoose.connect(MONGO_URI, { dbName: DB_NAME })
  .then(async () => {
    console.log(`✅ MongoDB connected to database: ${DB_NAME}`);
    await ensureRootAdmin();
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Auto-provision initial root Administrator if not present
async function ensureRootAdmin() {
  try {
    const adminEmail = 'admin@mail.com';
    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      console.log('🌱 Initializing GrievanceOps root Admin account...');
      await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: 'admin@123', // Hashed automatically by User pre-save hook
        role: 'ceo',
        department: 'Executive'
      });
      console.log('✅ Initial Admin created: admin@mail.com / admin@123');
    } else {
      console.log('ℹ️ Admin account verified: admin@mail.com');
    }
  } catch (err) {
    console.error('Error ensuring root admin:', err.message);
  }
}

// Helper: Generate signed JWT token
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      department: user.department,
      name: user.name,
      email: user.email
    },
    JWT_SECRET,
    {
      expiresIn: '7d',
      issuer: process.env.JWT_ISSUER || 'grievanceops'
    }
  );
}

// ════════════════════════════════════════════════════════════
//                     AUTHENTICATION ROUTES
// ════════════════════════════════════════════════════════════

// POST /api/auth/login — Authenticate with bcrypt & issue JWT
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials or inactive account.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register — Self-registration for employees
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'employee',
      department: department || 'Engineering'
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — Return current authenticated user profile
app.get('/api/auth/me', authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department
    }
  });
});

// ════════════════════════════════════════════════════════════
//                   USER DIRECTORY & PROVISIONING
// ════════════════════════════════════════════════════════════

app.get('/api/users', authenticate, userController.getUsers);
app.post('/api/users', authenticate, requireRole('ceo'), userController.createUser);
app.delete('/api/users/:id', authenticate, requireRole('ceo'), userController.deleteUser);

// ════════════════════════════════════════════════════════════
//                TEAMS & PERFORMANCE ANALYTICS
// ════════════════════════════════════════════════════════════

app.get('/api/teams', authenticate, teamController.getTeams);
app.post('/api/teams', authenticate, requireRole('manager', 'ceo'), teamController.createTeam);
app.delete('/api/teams/:id', authenticate, requireRole('manager', 'ceo'), teamController.deleteTeam);
app.get('/api/teams/manager-stats', authenticate, requireRole('manager', 'ceo'), teamController.getManagerStats);
app.get('/api/teams/lead-stats', authenticate, requireRole('team_lead', 'manager', 'ceo'), teamController.getLeadStats);

// ════════════════════════════════════════════════════════════
//                     TICKETS & RESOLUTION
// ════════════════════════════════════════════════════════════

app.post('/api/tickets', authenticate, ticketController.createTicket);
app.get('/api/tickets/my-tickets', authenticate, ticketController.getMyRaisedTickets);
app.get('/api/tickets/my-workspace', authenticate, ticketController.getMyWorkspaceTickets);
app.get('/api/tickets/workspace', authenticate, ticketController.getWorkspaceTickets);
app.get('/api/tickets/escalated', authenticate, ticketController.getEscalatedTickets);
app.get('/api/tickets/grouped-by-dept', authenticate, requireRole('ceo'), ticketController.getGroupedByDept);
app.get('/api/tickets/grouped-by-team', authenticate, requireRole('manager', 'ceo'), ticketController.getGroupedByTeam);
app.patch('/api/tickets/:id/action', authenticate, ticketController.takeTicketAction);

// ──────────────────────── Start Server ────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 GrievanceOps Backend API running on port ${PORT}`);
});
