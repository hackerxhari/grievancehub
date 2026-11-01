// server/models/User.js
// User schema with bcrypt password hashing and role-based permissions

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Exclude by default in queries for security
  },
  role: {
    type: String,
    enum: ['ceo', 'manager', 'team_lead', 'representative', 'employee'],
    default: 'employee'
  },
  department: {
    type: String,
    required: true,
    default: 'Engineering'
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Pre-save hook: Hash password with 10 salt rounds before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare candidate password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
