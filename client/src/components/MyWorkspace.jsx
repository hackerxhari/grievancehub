// client/src/components/MyWorkspace.jsx
// Dedicated Resolver Workspace for GrievanceOps

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Building2,
  ArrowUpRight,
  PlayCircle,
  Check,
  X,
  User as UserIcon,
  Filter
} from 'lucide-react';

function getAuthenticatedApi() {
  const token = localStorage.getItem('grievanceops_token') || localStorage.getItem('nexus_token');
  return axios.create({
    baseURL: '/api',
    headers: {
      Authorization: token ? `Bearer ${token}` : ''
    }
  });
}

export default function MyWorkspace({ user, onOpenTicket, onActionTicket, showToast }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedApi();
      const res = await api.get('/tickets/my-workspace');
      setTickets(res.data);
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to load your assigned workspace.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, []);

  const filtered = tickets.filter((t) => {
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              My Resolver Workspace
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-900 text-white">
              {tickets.length} Assigned
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Focused task queue containing queries and blockers assigned to you for direct investigation and resolution.
          </p>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white border border-zinc-200 text-xs rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:border-zinc-400 shadow-sm"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="Moderate">Moderate</option>
            <option value="Normal">Normal</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white border border-zinc-200/80 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 mx-auto flex items-center justify-center text-zinc-400">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="font-semibold text-sm text-zinc-900">All caught up!</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            You currently have no pending tasks or blockers assigned to your personal queue.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/80 rounded-xl shadow-sm divide-y divide-zinc-100 overflow-hidden">
          {filtered.map((ticket) => {
            // Check if current user is authorized to act on this stage
            const canAct =
              user.role === 'ceo' ||
              (ticket.currentStageLevel === 1 && ['representative', 'team_lead', 'manager'].includes(user.role)) ||
              (ticket.currentStageLevel === 2 && ['team_lead', 'manager'].includes(user.role)) ||
              (ticket.currentStageLevel === 3 && user.role === 'manager');

            return (
              <div
                key={ticket._id}
                className="p-4.5 hover:bg-zinc-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div
                  onClick={() => onOpenTicket(ticket)}
                  className="space-y-1.5 cursor-pointer flex-1"
                >
                  <div className="flex items-center gap-2">
                    {/* Priority badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        ticket.priority === 'Critical'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : ticket.priority === 'Moderate'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {ticket.priority === 'Critical' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      )}
                      {ticket.priority}
                    </span>

                    <span className="font-semibold text-xs text-zinc-900 tracking-tight hover:underline">
                      {ticket.title}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 line-clamp-1">{ticket.description}</p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-3 h-3 text-zinc-400" />
                      Submitter: <strong className="font-normal text-zinc-700">{ticket.submittedBy?.name} ({ticket.submittedBy?.department})</strong>
                    </span>
                    <span>•</span>
                    <span>Target Dept: {ticket.department}</span>
                    <span>•</span>
                    <span className="text-zinc-400">Logged {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Status & Action Buttons */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="block text-[11px] font-medium text-zinc-700">
                      Stage {ticket.currentStageLevel}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono uppercase">
                      {ticket.status}
                    </span>
                  </div>

                  {canAct ? (
                    <button
                      onClick={() => onActionTicket(ticket)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium shadow-sm transition active:scale-95 flex items-center gap-1"
                    >
                      <span>Take Action</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="px-2 py-1 rounded bg-zinc-100 text-zinc-400 text-[11px] border border-zinc-200">
                      Read Only
                    </span>
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
