// client/src/App.jsx
// GrievanceOps — Production-grade Internal Operations & Grievance Portal
// Linear / Raycast / Vercel inspired UI with strict step-by-step escalation,
// dedicated resolver workspace, team dissolution, and CEO/Manager grouped analytics.

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Inbox,
  BarChart3,
  Users,
  Shield,
  Plus,
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Layers,
  Building2,
  Trash2,
  X,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  UserCheck,
  FileText,
  Search,
  Lock,
  Mail,
  User as UserIcon,
  Activity,
  Briefcase,
  PlayCircle
} from 'lucide-react';

import MyWorkspace from './components/MyWorkspace';

// ──────────────────────────────────────────────────────────
//  Standard Departments & Roles Configuration
// ──────────────────────────────────────────────────────────
const DEPARTMENTS = [
  'Backend',
  'Frontend',
  'DevOps',
  'QA',
  'Infrastructure',
  'HR & Operations',
  'Executive'
];

const ROLES = [
  { value: 'employee', label: 'Employee / Engineer', desc: 'Can submit issues and resolve assigned blockers' },
  { value: 'representative', label: 'Representative (Level 1)', desc: 'Frontline triage, resolve, or escalate to L2' },
  { value: 'team_lead', label: 'Team Lead (Level 2)', desc: 'Team oversight & triage of Level 2 escalations' },
  { value: 'manager', label: 'Department Manager (Level 3)', desc: 'Executive clearance & team creation/dissolution' },
  { value: 'ceo', label: 'CEO / Admin', desc: 'Universal governance & staff provisioning' }
];

// Helper: Configure Axios with JWT from localStorage
function getAuthenticatedApi() {
  const token = localStorage.getItem('grievanceops_token') || localStorage.getItem('nexus_token');
  return axios.create({
    baseURL: '/api',
    headers: {
      Authorization: token ? `Bearer ${token}` : ''
    }
  });
}

// ══════════════════════════════════════════════════════════
//                      MAIN APP ROOT
// ══════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem('grievanceops_token') || localStorage.getItem('nexus_token') || ''
  );
  const [loadingUser, setLoadingUser] = useState(true);

  // Active Navigation Tab:
  // 'my-tickets' | 'my-workspace' | 'workspace' | 'escalated' | 'analytics' | 'staff'
  const [activeTab, setActiveTab] = useState('my-tickets');

  // Modals & Drawers
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null); // Detail / Audit Drawer
  const [actionTicket, setActionTicket] = useState(null);     // Action Modal (Resolve/Reject/Escalate)

  // Global Notification Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Check existing session on boot
  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoadingUser(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      setLoadingUser(true);
      const api = getAuthenticatedApi();
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch {
      handleLogout();
    } finally {
      setLoadingUser(false);
    }
  };

  const handleLoginSuccess = (newToken, userData) => {
    localStorage.setItem('grievanceops_token', newToken);
    setToken(newToken);
    setUser(userData);
    showToast(`Welcome back to GrievanceOps, ${userData.name}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('grievanceops_token');
    localStorage.removeItem('nexus_token');
    setToken('');
    setUser(null);
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="flex items-center gap-3 text-sm">
          <Activity className="w-4 h-4 animate-spin text-zinc-300" />
          <span>Initializing GrievanceOps workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView onLoginSuccess={handleLoginSuccess} showToast={showToast} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-sm">
              GO
            </div>
            <div>
              <span className="font-semibold text-zinc-900 tracking-tight text-sm">GrievanceOps</span>
              <span className="hidden sm:inline-block text-zinc-400 text-xs ml-2 font-mono">v3.1</span>
            </div>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-3">
            {/* Universal "+ Raise Issue" button (Available to EVERY user) */}
            <button
              onClick={() => setIsRaiseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium tracking-tight shadow-sm transition-all duration-150 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Raise Issue</span>
            </button>

            {/* User Profile Pill */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-zinc-200">
              <div className="text-right">
                <p className="text-xs font-medium text-zinc-900 leading-tight">{user.name}</p>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-[10px] text-zinc-500 font-mono">{user.department}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 uppercase">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Sign Out of GrievanceOps"
              className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Tab Bar Navigation (6 Core Perspectives) ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 border-t border-zinc-100 overflow-x-auto py-1">
          <NavTab
            label="My Raised Tickets"
            icon={FileText}
            active={activeTab === 'my-tickets'}
            onClick={() => setActiveTab('my-tickets')}
          />
          <NavTab
            label="My Workspace"
            icon={Briefcase}
            active={activeTab === 'my-workspace'}
            onClick={() => setActiveTab('my-workspace')}
          />
          <NavTab
            label="Team Queue"
            icon={Inbox}
            active={activeTab === 'workspace'}
            onClick={() => setActiveTab('workspace')}
          />
          {(user.role === 'manager' || user.role === 'ceo') && (
            <NavTab
              label="Escalated Queue (L3)"
              icon={AlertTriangle}
              active={activeTab === 'escalated'}
              onClick={() => setActiveTab('escalated')}
            />
          )}
          {(user.role === 'team_lead' || user.role === 'manager' || user.role === 'ceo') && (
            <NavTab
              label="Analytics & Management"
              icon={BarChart3}
              active={activeTab === 'analytics'}
              onClick={() => setActiveTab('analytics')}
            />
          )}
          {user.role === 'ceo' && (
            <NavTab
              label="Staff Directory"
              icon={Users}
              active={activeTab === 'staff'}
              onClick={() => setActiveTab('staff')}
            />
          )}
        </div>
      </header>

      {/* ── Global Toast ── */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div
            className={`px-4 py-2.5 rounded-lg text-xs font-medium shadow-lg border flex items-center gap-2 ${
              toast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-zinc-900 text-white border-zinc-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* ── Main View Body ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* 1. My Raised Tickets */}
        {activeTab === 'my-tickets' && (
          <MyTicketsView
            user={user}
            onOpenTicket={setSelectedTicket}
            onRaiseClick={() => setIsRaiseModalOpen(true)}
          />
        )}

        {/* 2. My Workspace (Dedicated Resolver View) */}
        {activeTab === 'my-workspace' && (
          <MyWorkspace
            user={user}
            onOpenTicket={setSelectedTicket}
            onActionTicket={setActionTicket}
            showToast={showToast}
          />
        )}

        {/* 3. Team Queue / Department Workspace */}
        {activeTab === 'workspace' && (
          <TeamWorkspaceView
            user={user}
            onOpenTicket={setSelectedTicket}
            onActionTicket={setActionTicket}
          />
        )}

        {/* 4. Level 3 Escalated Queue */}
        {activeTab === 'escalated' && (
          <EscalatedQueueView
            user={user}
            onOpenTicket={setSelectedTicket}
            onActionTicket={setActionTicket}
          />
        )}

        {/* 5. Analytics & Management (Grouped by Dept for CEO, by Team for Manager) */}
        {activeTab === 'analytics' && (
          <AnalyticsAndManagementView user={user} onOpenTicket={setSelectedTicket} showToast={showToast} />
        )}

        {/* 6. Staff Directory (CEO Provisioning & Cascading Deletion) */}
        {activeTab === 'staff' && (
          <StaffManagementView user={user} showToast={showToast} />
        )}
      </main>

      {/* ── Raise Issue / Grievance Modal ── */}
      {isRaiseModalOpen && (
        <RaiseIssueModal
          user={user}
          onClose={() => setIsRaiseModalOpen(false)}
          onSuccess={() => {
            setIsRaiseModalOpen(false);
            showToast('Issue ticket logged to target department queue.');
            setActiveTab('my-tickets');
          }}
          showToast={showToast}
        />
      )}

      {/* ── Strictly Scoped Action Modal ── */}
      {actionTicket && (
        <TicketActionModal
          ticket={actionTicket}
          user={user}
          onClose={() => setActionTicket(null)}
          onSuccess={(updated) => {
            setActionTicket(null);
            if (selectedTicket?._id === updated._id) setSelectedTicket(updated);
            showToast(`Ticket status updated: ${updated.status}`);
          }}
          showToast={showToast}
        />
      )}

      {/* ── Detail & Audit Trail Drawer ── */}
      {selectedTicket && (
        <TicketDetailDrawer
          ticket={selectedTicket}
          user={user}
          onClose={() => setSelectedTicket(null)}
          onOpenAction={(t) => setActionTicket(t)}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
//  Reusable Sub-component: NavTab
// ──────────────────────────────────────────────────────────
function NavTab({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-all duration-150 ${
        active
          ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-xs'
          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
      }`}
    >
      <Icon className={`w-3.5 h-3.5 ${active ? 'text-zinc-900' : 'text-zinc-400'}`} />
      <span>{label}</span>
    </button>
  );
}

// ══════════════════════════════════════════════════════════
//  1. AUTHENTICATION VIEW (Login & Register)
// ══════════════════════════════════════════════════════════
function AuthView({ onLoginSuccess, showToast }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Backend');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister
        ? { name, email, password, department }
        : { email, password };

      const res = await axios.post(endpoint, payload);
      onLoginSuccess(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-zinc-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/80 mx-auto flex items-center justify-center font-bold text-xs tracking-tight shadow-md">
          GO
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">
          Sign in to GrievanceOps
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          Collaborative Operations, Task Routing & Grievance Resolution Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-6 sm:px-8 border border-zinc-800 shadow-2xl rounded-2xl">
          <div className="flex border-b border-zinc-800 mb-6">
            <button
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 pb-3 text-xs font-medium border-b-2 transition-colors ${
                !isRegister ? 'border-white text-white font-semibold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 pb-3 text-xs font-medium border-b-2 transition-colors ${
                isRegister ? 'border-white text-white font-semibold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mail.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-white hover:bg-zinc-200 text-zinc-900 font-semibold text-xs tracking-tight transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Activity className="w-3.5 h-3.5 animate-spin" />}
              <span>{isRegister ? 'Register Employee Account' : 'Sign In to GrievanceOps'}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
            <p className="text-[11px] text-zinc-500">
              Initial Root Admin: <span className="font-mono text-zinc-300">admin@mail.com</span> • <span className="font-mono text-zinc-300">admin@123</span>
            </p>
            <p className="mt-3 text-[10px] text-zinc-600">
              © 2026 GrievanceOps. Internal Use Only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  2. MY RAISED TICKETS VIEW (ISSUES LOGGED BY USER)
// ══════════════════════════════════════════════════════════
function MyTicketsView({ user, onOpenTicket, onRaiseClick }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedApi();
      const res = await api.get('/tickets/my-tickets');
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">My Raised Issues</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Track grievances, operational blockers, and requests you personally submitted to GrievanceOps.
          </p>
        </div>
        <button
          onClick={onRaiseClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Blocker</span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No issues raised yet"
          description="Have an operational blocker or grievance? Use the button above to log it to the responsible department queue."
          actionLabel="Raise an Issue"
          onAction={onRaiseClick}
        />
      ) : (
        <div className="bg-white border border-zinc-200/80 rounded-xl shadow-sm divide-y divide-zinc-100 overflow-hidden">
          {tickets.map((t) => (
            <div
              key={t._id}
              onClick={() => onOpenTicket(t)}
              className="p-4 hover:bg-zinc-50/80 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={t.priority} />
                  <span className="font-medium text-xs text-zinc-900 tracking-tight group-hover:text-zinc-700">
                    {t.title}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-zinc-400" />
                    Target: <strong className="text-zinc-700 font-normal">{t.department}</strong>
                  </span>
                  <span>•</span>
                  <span>Logged {new Date(t.createdAt).toLocaleDateString()}</span>
                  {t.assignedTo && (
                    <>
                      <span>•</span>
                      <span>Assigned to {t.assignedTo.name}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-center">
                <StageLevelIndicator stage={t.currentStageLevel} status={t.status} />
                <StatusBadge status={t.status} />
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  3. TEAM QUEUE / DEPARTMENT WORKSPACE
// ══════════════════════════════════════════════════════════
function TeamWorkspaceView({ user, onOpenTicket, onActionTicket }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ACTIVE');

  const fetchWorkspaceTickets = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedApi();
      const res = await api.get('/tickets/workspace');
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
      if (filterStatus === 'ACTIVE') return t.status !== 'Resolved' && t.status !== 'Rejected';
      if (filterStatus === 'RESOLVED') return t.status === 'Resolved';
      if (filterStatus === 'REJECTED') return t.status === 'Rejected';
      return true;
    });
  }, [tickets, filterPriority, filterStatus]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            {user.role === 'ceo' ? 'All Organization Queues' : `${user.department} Team Queue`}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Incoming blockers, grievances, and tasks assigned to your department. Action controls are strictly scoped to your authorization stage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-zinc-200 text-xs rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-none"
          >
            <option value="ACTIVE">Active / Pending</option>
            <option value="ALL">All Statuses</option>
            <option value="RESOLVED">Resolved Only</option>
            <option value="REJECTED">Rejected Only</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-white border border-zinc-200 text-xs rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="Moderate">Moderate</option>
            <option value="Normal">Normal</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          title="Queue is all clear"
          description="There are no active issues matching the current queue filters."
        />
      ) : (
        <div className="bg-white border border-zinc-200/80 rounded-xl shadow-sm divide-y divide-zinc-100 overflow-hidden">
          {filteredTickets.map((t) => {
            // Strictly scoped authorization check
            const canAct =
              user.role === 'ceo' ||
              (t.currentStageLevel === 1 && ['representative', 'team_lead', 'manager'].includes(user.role)) ||
              (t.currentStageLevel === 2 && ['team_lead', 'manager'].includes(user.role)) ||
              (t.currentStageLevel === 3 && user.role === 'manager');

            return (
              <div
                key={t._id}
                className="p-4 hover:bg-zinc-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div
                  onClick={() => onOpenTicket(t)}
                  className="space-y-1 cursor-pointer flex-1"
                >
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={t.priority} />
                    <span className="font-medium text-xs text-zinc-900 tracking-tight hover:underline">
                      {t.title}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                    <span>From: <strong className="font-normal text-zinc-700">{t.submittedBy?.name} ({t.submittedBy?.department})</strong></span>
                    <span>•</span>
                    <span>Target: {t.department}</span>
                    <span>•</span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <StageLevelIndicator stage={t.currentStageLevel} status={t.status} />
                  <StatusBadge status={t.status} />

                  {t.status !== 'Resolved' && t.status !== 'Rejected' && (
                    canAct ? (
                      <button
                        onClick={() => onActionTicket(t)}
                        className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-medium transition active:scale-95"
                      >
                        Triage
                      </button>
                    ) : (
                      <span className="px-2 py-1 rounded bg-zinc-100 text-zinc-400 text-[10px] font-mono border border-zinc-200">
                        Read Only
                      </span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  4. ESCALATED QUEUE (LEVEL 3 / MANAGERIAL)
// ══════════════════════════════════════════════════════════
function EscalatedQueueView({ user, onOpenTicket, onActionTicket }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEscalated = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedApi();
      const res = await api.get('/tickets/escalated');
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalated();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Level 3 Escalation Queue
          </h1>
        </div>
        <p className="text-xs text-zinc-500 mt-0.5">
          High-impact blockers escalated to Stage 3 requiring Department Manager clearance. Sorted by urgency and SLA age.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No escalated blockers"
          description="Great job! There are currently zero tickets escalated to Level 3."
        />
      ) : (
        <div className="bg-white border border-rose-200/80 rounded-xl shadow-sm divide-y divide-zinc-100 overflow-hidden">
          {tickets.map((t) => (
            <div
              key={t._id}
              className="p-4 hover:bg-rose-50/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div
                onClick={() => onOpenTicket(t)}
                className="space-y-1 cursor-pointer flex-1"
              >
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={t.priority} />
                  <span className="font-semibold text-xs text-zinc-900 tracking-tight">
                    {t.title}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 line-clamp-1">{t.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                  <span>Submitter: {t.submittedBy?.name}</span>
                  <span>•</span>
                  <span>Dept: {t.department}</span>
                  <span>•</span>
                  <span className="text-rose-600 font-medium">
                    Waiting since {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onActionTicket(t)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium shadow-sm transition active:scale-95"
                >
                  Clear / Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  5. ANALYTICS & MANAGEMENT VIEW
//     CEO: Grouped by Department with Active Metrics & Accordions
//     Manager: Grouped by Teams with Team Deletion & Unassigned Queue
// ══════════════════════════════════════════════════════════
function AnalyticsAndManagementView({ user, onOpenTicket, showToast }) {
  if (user.role === 'ceo') {
    return <CEODepartmentGroupedView onOpenTicket={onOpenTicket} showToast={showToast} />;
  }
  return <ManagerTeamGroupedView user={user} onOpenTicket={onOpenTicket} showToast={showToast} />;
}

// ── 5A. CEO View: Group Queries by Department ──
function CEODepartmentGroupedView({ onOpenTicket, showToast }) {
  const [deptGroups, setDeptGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDept, setExpandedDept] = useState({});

  const fetchDeptGrouped = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedApi();
      const res = await api.get('/tickets/grouped-by-dept');
      setDeptGroups(res.data);
      if (res.data.length > 0) {
        setExpandedDept({ [res.data[0].department]: true });
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load department analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeptGrouped();
  }, []);

  const toggleDept = (dept) => {
    setExpandedDept((prev) => ({ ...prev, [dept]: !prev[dept] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Executive Departmental Overview
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          All organizational queries grouped by Department with priority breakdowns and resolution throughput.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : deptGroups.length === 0 ? (
        <EmptyState title="No departmental queries" description="No tickets logged across any department." />
      ) : (
        <div className="space-y-4">
          {deptGroups.map((group) => {
            const isExpanded = !!expandedDept[group.department];

            return (
              <div
                key={group.department}
                className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden transition-all"
              >
                {/* Department Header / Accordion trigger */}
                <div
                  onClick={() => toggleDept(group.department)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-zinc-50/60 select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-zinc-900 tracking-tight">{group.department} Department</h2>
                      <span className="text-[11px] text-zinc-500">
                        {group.total} Total Issues • {group.pending} Pending • {group.resolved} Resolved
                      </span>
                    </div>
                  </div>

                  {/* Priority Breakdown Pills */}
                  <div className="flex items-center gap-2">
                    {group.critical > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        {group.critical} Critical
                      </span>
                    )}
                    {group.moderate > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        {group.moderate} Moderate
                      </span>
                    )}
                    {group.normal > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                        {group.normal} Normal
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-zinc-900' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Department Ticket List */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 divide-y divide-zinc-100 bg-zinc-50/30">
                    {group.tickets.length === 0 ? (
                      <div className="p-4 text-center text-xs text-zinc-400">No tickets in this department.</div>
                    ) : (
                      group.tickets.map((t) => (
                        <div
                          key={t._id}
                          onClick={() => onOpenTicket(t)}
                          className="p-3.5 px-5 hover:bg-white cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <PriorityBadge priority={t.priority} />
                            <span className="font-medium text-zinc-900 tracking-tight hover:underline">
                              {t.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-zinc-400 font-mono">
                              Assigned: {t.assignedTo?.name || 'Unassigned'}
                            </span>
                            <StatusBadge status={t.status} />
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 5B. Manager View: Group Queries by Teams with Team Dissolution ──
function ManagerTeamGroupedView({ user, onOpenTicket, showToast }) {
  const [teamData, setTeamData] = useState({ department: user.department, teams: [], unassigned: [] });
  const [loading, setLoading] = useState(true);

  // Create Team modal state
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamLeadId, setTeamLeadId] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const fetchTeamGrouped = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedApi();
      const [tgRes, uRes] = await Promise.all([
        api.get('/tickets/grouped-by-team'),
        api.get('/users')
      ]);
      setTeamData(tgRes.data);
      setAllUsers(uRes.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load team data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamGrouped();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const api = getAuthenticatedApi();
      await api.post('/teams', {
        name: teamName,
        department: user.department,
        teamLeadId,
        members: selectedMembers
      });
      showToast('Team established successfully.');
      setIsCreateTeamOpen(false);
      setTeamName('');
      setSelectedMembers([]);
      fetchTeamGrouped();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create team', 'error');
    }
  };

  // Manual Team Dissolution Button
  const handleDeleteTeam = async (teamId, teamName) => {
    if (!confirm(`Are you sure you want to dissolve team "${teamName}"? Members will be unassigned.`)) {
      return;
    }

    try {
      const api = getAuthenticatedApi();
      await api.delete(`/teams/${teamId}`);
      showToast(`Team "${teamName}" dissolved successfully.`);
      fetchTeamGrouped();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete team', 'error');
    }
  };

  const toggleMemberSelection = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            {teamData.department} Team Hierarchy & Queries
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Operational queries mapped to designated teams and individual team queues.
          </p>
        </div>

        <button
          onClick={() => setIsCreateTeamOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium shadow-sm transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Provision Team</span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Teams Grouping */}
          {teamData.teams.length === 0 ? (
            <EmptyState
              title="No teams established"
              description="Create your first team using the button above to organize members and route queries."
            />
          ) : (
            <div className="space-y-6">
              {teamData.teams.map((team) => (
                <div
                  key={team.teamId}
                  className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden"
                >
                  {/* Team Card Header with Delete Team button */}
                  <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/40">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-zinc-900 tracking-tight">{team.teamName}</h2>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-zinc-200 text-zinc-700">
                          {team.members.length} members
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Team Lead: <strong className="font-medium text-zinc-700">{team.leadName}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-xs text-right pr-2">
                        <span className="text-zinc-900 font-semibold">{team.total}</span> tickets (
                        <span className="text-amber-600 font-medium">{team.pending} pend</span>,{' '}
                        <span className="text-emerald-600 font-medium">{team.solved} done</span>)
                      </div>

                      {/* Small Delete Team Button */}
                      <button
                        onClick={() => handleDeleteTeam(team.teamId, team.teamName)}
                        title="Dissolve Team"
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Team's Tickets */}
                  <div className="divide-y divide-zinc-100">
                    {team.tickets.length === 0 ? (
                      <div className="p-4 text-center text-xs text-zinc-400">No active queries assigned to this team.</div>
                    ) : (
                      team.tickets.map((t) => (
                        <div
                          key={t._id}
                          onClick={() => onOpenTicket(t)}
                          className="p-3.5 px-5 hover:bg-zinc-50/60 cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <PriorityBadge priority={t.priority} />
                            <span className="font-medium text-zinc-900 tracking-tight hover:underline">
                              {t.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-zinc-400">
                              Assigned: {t.assignedTo?.name || 'Unassigned'}
                            </span>
                            <StatusBadge status={t.status} />
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Unassigned Team Queue Section */}
          <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-zinc-100 bg-amber-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Unassigned Team Queue ({teamData.unassigned.length})
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Departmental queries awaiting allocation to a specific team or engineer.
                </p>
              </div>
            </div>

            <div className="divide-y divide-zinc-100">
              {teamData.unassigned.length === 0 ? (
                <div className="p-5 text-center text-xs text-zinc-400">No unassigned queries in this department queue.</div>
              ) : (
                teamData.unassigned.map((t) => (
                  <div
                    key={t._id}
                    onClick={() => onOpenTicket(t)}
                    className="p-3.5 px-5 hover:bg-zinc-50/60 cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <PriorityBadge priority={t.priority} />
                      <span className="font-medium text-zinc-900 tracking-tight hover:underline">
                        {t.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={t.status} />
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {isCreateTeamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-semibold text-sm text-zinc-900">Provision New Team</h3>
              <button onClick={() => setIsCreateTeamOpen(false)}>
                <X className="w-4 h-4 text-zinc-400 hover:text-zinc-700" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-medium uppercase text-zinc-400 mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core API Services"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase text-zinc-400 mb-1">Designate Team Lead</label>
                <select
                  required
                  value={teamLeadId}
                  onChange={(e) => setTeamLeadId(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-400"
                >
                  <option value="">Select an active engineer as Lead</option>
                  {allUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role} - {u.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase text-zinc-400 mb-1">Assign Members</label>
                <div className="max-h-36 overflow-y-auto border border-zinc-200 rounded-lg p-2 space-y-1 bg-zinc-50">
                  {allUsers.map((u) => (
                    <label key={u._id} className="flex items-center gap-2 p-1.5 hover:bg-zinc-100 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(u._id)}
                        onChange={() => toggleMemberSelection(u._id)}
                        className="rounded border-zinc-300 text-zinc-900"
                      />
                      <span>{u.name}</span>
                      <span className="text-zinc-400 text-[10px]">({u.department})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsCreateTeamOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium"
                >
                  Save Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  6. STAFF DIRECTORY (CEO GOVERNANCE & CASCADING DELETION)
// ══════════════════════════════════════════════════════════
function StaffManagementView({ user, showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [department, setDepartment] = useState('Backend');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedApi();
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const api = getAuthenticatedApi();
      await api.post('/users', {
        name,
        email,
        password,
        role,
        department
      });
      showToast(`User ${name} provisioned successfully in GrievanceOps.`);
      setIsAddUserOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to provision user', 'error');
    }
  };

  // Cascading Deletion Handler
  const handleDelete = async (userId, userName) => {
    if (!confirm(`Permanently delete ${userName}? This will cascade-delete all their raised tickets and auto-dissolve empty teams.`)) {
      return;
    }

    try {
      const api = getAuthenticatedApi();
      const res = await api.delete(`/users/${userId}`);
      showToast(res.data.message || 'User and linked resources deleted.');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete user', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Staff Directory & Access Provisioning
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Admin governance over personnel. Removing an employee cascade-cleans their submitted queries and auto-dissolves vacated teams.
          </p>
        </div>

        <button
          onClick={() => setIsAddUserOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium shadow-sm transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Provision Employee</span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="bg-white border border-zinc-200/80 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/60 border-b border-zinc-100 text-zinc-400 uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Work Email</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Role Tier</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-zinc-50/50">
                  <td className="px-5 py-3.5 font-medium text-zinc-900">{u.name}</td>
                  <td className="px-5 py-3.5 text-zinc-500 font-mono text-[11px]">{u.email}</td>
                  <td className="px-5 py-3.5">{u.department}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 border border-zinc-200 uppercase">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {u.role !== 'ceo' && (
                      <button
                        onClick={() => handleDelete(u._id, u.name)}
                        className="text-zinc-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete User & Cascade Cleanup"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Provision User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-semibold text-sm text-zinc-900">Provision Staff Account</h3>
              <button onClick={() => setIsAddUserOpen(false)}>
                <X className="w-4 h-4 text-zinc-400 hover:text-zinc-700" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-medium uppercase text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase text-zinc-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase text-zinc-400 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium uppercase text-zinc-400 mb-1">Role Permission</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-400"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium uppercase text-zinc-400 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-400"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  7. RAISE GRIEVANCE / ISSUE MODAL (UNIVERSAL TO ALL)
// ══════════════════════════════════════════════════════════
function RaiseIssueModal({ user, onClose, onSuccess, showToast }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('Backend');
  const [priority, setPriority] = useState('Normal');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const api = getAuthenticatedApi();
      await api.post('/tickets', {
        title,
        description,
        department,
        priority,
        imageUrl
      });
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit issue', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h3 className="font-semibold text-sm text-zinc-900">Log Operational Blocker or Grievance</h3>
            <p className="text-[11px] text-zinc-500">
              Raised by {user.name} ({user.department}) on GrievanceOps
            </p>
          </div>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-zinc-400 hover:text-zinc-700" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium uppercase text-zinc-400 mb-1">Issue Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Staging redis container memory limit exceeded"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase text-zinc-400 mb-1">Description & Context</label>
            <textarea
              required
              rows={3}
              placeholder="Detailed description of blocker, logs, reproduction steps, or grievance..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium uppercase text-zinc-400 mb-1">Target Department Queue</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-400"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase text-zinc-400 mb-1">Priority SLA</label>
              <div className="grid grid-cols-3 gap-1">
                {['Normal', 'Moderate', 'Critical'].map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`py-1.5 text-[11px] font-medium rounded-lg border transition ${
                      priority === p
                        ? p === 'Critical'
                          ? 'bg-rose-50 border-rose-300 text-rose-700'
                          : p === 'Moderate'
                          ? 'bg-amber-50 border-amber-300 text-amber-700'
                          : 'bg-zinc-900 border-zinc-900 text-white'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase text-zinc-400 mb-1">
              Attachment URL (Optional screenshot/log)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit to Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  8. STRICT STEP-BY-STEP ACTION MODAL
// ══════════════════════════════════════════════════════════
function TicketActionModal({ ticket, user, onClose, onSuccess, showToast }) {
  const [action, setAction] = useState('RESOLVE');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Check stage permissions
  const canAct =
    user.role === 'ceo' ||
    (ticket.currentStageLevel === 1 && ['representative', 'team_lead', 'manager'].includes(user.role)) ||
    (ticket.currentStageLevel === 2 && ['team_lead', 'manager'].includes(user.role)) ||
    (ticket.currentStageLevel === 3 && user.role === 'manager');

  const nextStage = ticket.currentStageLevel + 1;
  const canEscalate = ticket.currentStageLevel < 3;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canAct) {
      showToast('You are not authorized to act at this ticket stage level.', 'error');
      return;
    }

    if (!notes.trim()) {
      showToast('Mandatory notes are required for this action.', 'error');
      return;
    }

    setLoading(true);
    try {
      const api = getAuthenticatedApi();
      const res = await api.patch(`/tickets/${ticket._id}/action`, {
        action,
        notes
      });
      onSuccess(res.data);
    } catch (err) {
      showToast(err.response?.data?.error || 'Action failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h3 className="font-semibold text-sm text-zinc-900">Triage Ticket Action</h3>
            <p className="text-[11px] text-zinc-500 line-clamp-1">{ticket.title}</p>
          </div>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-zinc-400 hover:text-zinc-700" />
          </button>
        </div>

        {!canAct ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
            <p className="font-semibold">Action Restricted</p>
            <p>
              This ticket is held at <strong>Stage {ticket.currentStageLevel}</strong>. Your current designation ({user.role}) is not authorized to alter tickets at this hierarchy tier.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Action Choice Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAction('RESOLVE')}
                className={`py-2 rounded-lg font-medium border text-center transition ${
                  action === 'RESOLVE'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                Resolve
              </button>
              <button
                type="button"
                onClick={() => setAction('REJECT')}
                className={`py-2 rounded-lg font-medium border text-center transition ${
                  action === 'REJECT'
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => setAction('IN_PROGRESS')}
                className={`py-2 rounded-lg font-medium border text-center transition ${
                  action === 'IN_PROGRESS'
                    ? 'bg-blue-50 border-blue-300 text-blue-800'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                Mark In Progress
              </button>

              {/* Strict Step-by-Step Escalation Button */}
              {canEscalate ? (
                <button
                  type="button"
                  onClick={() => setAction('ESCALATE')}
                  className={`py-2 rounded-lg font-medium border text-center transition ${
                    action === 'ESCALATE'
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  Escalate to Level {nextStage}
                </button>
              ) : (
                <div className="py-2 rounded-lg border border-dashed border-zinc-200 text-zinc-400 text-center font-mono text-[10px]">
                  Max Level 3 (Clearance)
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase text-zinc-400 mb-1">
                Mandatory Audit Notes & Rationale
              </label>
              <textarea
                required
                rows={3}
                placeholder="Document resolution steps, rejection reason, or justification for escalating to the next tier..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium disabled:opacity-50"
              >
                {loading ? 'Confirming...' : 'Confirm Action'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  9. TICKET DETAIL & AUDIT TRAIL DRAWER
// ══════════════════════════════════════════════════════════
function TicketDetailDrawer({ ticket, user, onClose, onOpenAction }) {
  const canAct =
    user.role === 'ceo' ||
    (ticket.currentStageLevel === 1 && ['representative', 'team_lead', 'manager'].includes(user.role)) ||
    (ticket.currentStageLevel === 2 && ['team_lead', 'manager'].includes(user.role)) ||
    (ticket.currentStageLevel === 3 && user.role === 'manager');

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-zinc-200 text-xs">
        <div className="p-6 border-b border-zinc-100 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight mt-2">
              {ticket.title}
            </h2>
            <p className="text-[11px] text-zinc-400 font-mono">ID: {ticket._id}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Stage Bottleneck */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Current Routing Stage</span>
            <div>
              <StageLevelIndicator stage={ticket.currentStageLevel} status={ticket.status} />
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Description</h4>
            <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap bg-zinc-50/50 p-3.5 rounded-xl border border-zinc-100">
              {ticket.description}
            </p>
          </div>

          {/* Meta Information */}
          <div className="grid grid-cols-2 gap-4 p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
            <div>
              <span className="text-[10px] text-zinc-400 block uppercase">Submitted By</span>
              <span className="font-medium text-zinc-900">{ticket.submittedBy?.name || 'Unknown'}</span>
              <span className="block text-[11px] text-zinc-500 font-mono">{ticket.submittedBy?.department}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block uppercase">Target Queue</span>
              <span className="font-medium text-zinc-900">{ticket.department}</span>
              <span className="block text-[11px] text-zinc-500">
                Assigned: {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
              </span>
            </div>
          </div>

          {/* Resolution Remarks */}
          {ticket.adminRemarks && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Action Remarks</h4>
              <div className="text-xs font-mono text-zinc-800 bg-zinc-100 p-3 rounded-lg whitespace-pre-wrap">
                {ticket.adminRemarks}
              </div>
            </div>
          )}

          {/* Audit Trail Timeline */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">Audit Trail History</h4>
            <div className="space-y-3 relative pl-4 border-l border-zinc-200">
              {ticket.auditTrail?.map((entry, idx) => (
                <div key={idx} className="relative space-y-1 text-xs">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-900 border-2 border-white" />
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 uppercase text-[10px] tracking-wide">
                      {entry.action}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-zinc-600">{entry.notes}</p>
                  <p className="text-[10px] text-zinc-400">Stage L{entry.stageLevel} • By {entry.updatedByName || 'System'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {ticket.status !== 'Resolved' && ticket.status !== 'Rejected' && canAct && (
          <div className="p-4 border-t border-zinc-100 flex justify-end gap-2 bg-zinc-50">
            <button
              onClick={() => { onClose(); onOpenAction(ticket); }}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium"
            >
              Take Action on Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  10. DESIGN SYSTEM BADGES & STATUS INDICATORS
// ══════════════════════════════════════════════════════════
function PriorityBadge({ priority }) {
  if (priority === 'Critical') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        Critical
      </span>
    );
  }
  if (priority === 'Moderate') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        Moderate
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
      Normal
    </span>
  );
}

function StatusBadge({ status }) {
  if (status === 'Resolved') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Resolved
      </span>
    );
  }
  if (status === 'Rejected') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
        <X className="w-3 h-3 text-rose-600" />
        Rejected
      </span>
    );
  }
  if (status === 'Under Review') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600" />
        Under Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
      Submitted
    </span>
  );
}

function StageLevelIndicator({ stage, status }) {
  if (status === 'Resolved' || status === 'Rejected') {
    return <span className="text-[11px] text-zinc-400">Archived</span>;
  }
  const stages = {
    1: 'Stage 1 • Representative (L1)',
    2: 'Stage 2 • Escalated to Team Lead (L2)',
    3: 'Stage 3 • Escalated to Manager (L3)'
  };
  return (
    <span className="text-[11px] font-medium text-zinc-600 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
      {stages[stage] || `Stage ${stage}`}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-white border border-zinc-200/80 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-12 text-center space-y-3 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 mx-auto flex items-center justify-center text-zinc-400">
        <Inbox className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-sm text-zinc-900">{title}</h3>
      <p className="text-xs text-zinc-500 max-w-sm mx-auto">{description}</p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
