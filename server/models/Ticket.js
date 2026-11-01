// server/models/Ticket.js
// Collaborative intra-organization ticket schema with audit trail and escalation levels

const mongoose = require('mongoose');

// Sub-schema for audit trail history
const auditEntrySchema = new mongoose.Schema({
  action: { type: String, required: true }, // 'CREATED', 'ASSIGNED', 'ESCALATE', 'RESOLVE', 'REJECT', 'STATUS_CHANGE'
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedByName: { type: String, default: '' },
  notes: { type: String, default: '' },
  stageLevel: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  // The department / team queue responsible for resolving this blocker
  department: {
    type: String,
    required: [true, 'Target department is required']
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  priority: {
    type: String,
    enum: ['Critical', 'Moderate', 'Normal'],
    default: 'Normal'
  },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Resolved', 'Rejected'],
    default: 'Submitted'
  },
  // 1: Representative (L1), 2: Team Lead (L2), 3: Department Manager (L3)
  currentStageLevel: {
    type: Number,
    enum: [1, 2, 3],
    default: 1
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  imageUrl: {
    type: String,
    default: ''
  },
  adminRemarks: {
    type: String,
    default: ''
  },
  auditTrail: [auditEntrySchema],
  resolvedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
