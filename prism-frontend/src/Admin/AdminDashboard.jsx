import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AdminLeftSidebar } from './AdminSidebar';
import { ThemeContext } from '../context/ThemeContext';
import axios from 'axios';
import {
  Users, UserCheck, Briefcase, Building2, GraduationCap,
  Calendar, Clock, Activity, TrendingUp, LogIn, CheckCircle2,
  AlertCircle, UserPlus, FileCheck, BarChart3, ChevronRight
} from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/* ── Animated counter ──────────────────────────────────────────────── */
const useCountUp = (end, dur = 1400) => {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (!end) { setV(0); return; }
    const step = ts => {
      if (!ref.current) ref.current = ts;
      const p = Math.min((ts - ref.current) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.floor(eased * end));
      if (p < 1) requestAnimationFrame(step);
    };
    ref.current = null;
    requestAnimationFrame(step);
  }, [end, dur]);
  return v;
};
const Num = ({ value }) => <>{useCountUp(value)}</>;

/* ── Helpers ───────────────────────────────────────────────────────── */
const fmtDate = () =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

/* ── Sparkline mini chart ──────────────────────────────────────────── */
const Sparkline = ({ data, color = '#8b5cf6', width = 64, height = 22 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`)
    .join(' ');
  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

/* ── Placeholder Chart ─────────────────────────────────────────────── */
const ChartPlaceholder = ({ title, type = 'line', isDark }) => {
  const bars = [65, 40, 80, 55, 70, 45, 90, 60, 75, 50, 85, 68];
  return (
    <div className={`h-40 relative overflow-hidden rounded-lg border p-3 ${
      isDark ? 'bg-slate-800/40 border-slate-700/30' : 'bg-slate-50/80 border-slate-200/50'
    }`}>
      <p className={`text-[0.65rem] font-semibold mb-2 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
      <div className="absolute inset-x-3 bottom-3 top-8 flex flex-col justify-between">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`border-b w-full ${isDark ? 'border-slate-700/30' : 'border-slate-200/60'}`} />
        ))}
      </div>
      {type === 'bar' ? (
        <div className="flex items-end gap-1 h-28 px-1 relative z-10">
          {bars.map((v, i) => (
            <div key={i} className="flex-1 rounded-t-md transition-all duration-700 ease-out hover:opacity-80"
              style={{
                height: `${v}%`,
                background: i % 3 === 0
                  ? 'linear-gradient(to top, #7c3aed, #a78bfa)'
                  : i % 3 === 1
                    ? 'linear-gradient(to top, #6366f1, #818cf8)'
                    : 'linear-gradient(to top, #8b5cf6, #c4b5fd)',
              }}
            />
          ))}
        </div>
      ) : (
        <svg className="w-full h-28 relative z-10" viewBox="0 0 300 120" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`M0,${120 - bars[0] * 1.2} ${bars.map((v, i) => `L${(i / (bars.length - 1)) * 300},${120 - v * 1.2}`).join(' ')} L300,120 L0,120 Z`}
            fill="url(#lineGrad)" />
          <polyline fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            points={bars.map((v, i) => `${(i / (bars.length - 1)) * 300},${120 - v * 1.2}`).join(' ')} />
        </svg>
      )}
    </div>
  );
};

/* ── Pie / Donut chart ──────────────────────────────────────────── */
const PieChart = ({ segments, size = 130, strokeWidth = 22, isDark }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let accumulated = 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        {/* bg ring */}
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circumference;
          const offset = -(accumulated / total) * circumference;
          accumulated += seg.value;
          return (
            <circle key={i} cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke={seg.color} strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out" />
          );
        })}
        {/* center text */}
        <text x={size / 2} y={size / 2}
          textAnchor="middle" dominantBaseline="central"
          className="rotate-90 origin-center"
          fill={isDark ? '#e2e8f0' : '#1e293b'}
          fontSize="18" fontWeight="800">{total}</text>
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className={`text-[0.6rem] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {seg.label} ({seg.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */

const AdminDashboard = () => {
  useDocumentTitle('PRISM Admin - Dashboard');
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);

  const [stats, setStats] = useState({ total: 0, students: 0, mentors: 0, professors: 0, admins: 0 });
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const tk = localStorage.getItem('access_token');
    const h = { Authorization: `Bearer ${tk}` };
    try {
      const [sr, cr] = await Promise.all([
        axios.get(`${API}/api/admin/users/stats`, { headers: h }),
        axios.get(`${API}/api/admin/colleges`, { headers: h }),
      ]);
      setStats(sr.data);
      setColleges(Array.isArray(cr.data) ? cr.data : []);
    } catch (e) { console.error('Dashboard fetch failed', e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── KPI card definitions ──── */
  const kpiCards = [
    {
      label: 'Total Users', value: stats.total, change: '+12.5%', positive: true,
      icon: <Users size={18} />, color: 'purple',
      sparkData: [20, 35, 28, 45, 40, 55, 50, 65, 58, 72, 68, stats.total || 80],
      sparkColor: '#8b5cf6', barPct: 78,
    },
    {
      label: 'Active Worklets', value: 24, change: '+8.2%', positive: true,
      icon: <Briefcase size={18} />, color: 'indigo',
      sparkData: [10, 18, 15, 22, 28, 25, 30, 35, 32, 38, 36, 24],
      sparkColor: '#6366f1', barPct: 62,
    },
    {
      label: 'Pending Approvals', value: 7, change: '-3.1%', positive: false,
      icon: <Clock size={18} />, color: 'amber',
      sparkData: [15, 12, 18, 14, 10, 16, 11, 9, 13, 8, 10, 7],
      sparkColor: '#f59e0b', barPct: 28,
    },
    {
      label: 'Institutions', value: colleges.length, change: '+2.0%', positive: true,
      icon: <Building2 size={18} />, color: 'blue',
      sparkData: [3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, colleges.length || 9],
      sparkColor: '#3b82f6', barPct: 45,
    },
    {
      label: 'Students', value: stats.students, change: '+15.4%', positive: true,
      icon: <GraduationCap size={18} />, color: 'green',
      sparkData: [12, 20, 18, 30, 28, 38, 35, 45, 42, 50, 48, stats.students || 55],
      sparkColor: '#22c55e', barPct: 72,
    },
    {
      label: 'Mentors', value: stats.mentors, change: '+4.8%', positive: true,
      icon: <CheckCircle2 size={18} />, color: 'teal',
      sparkData: [2, 3, 3, 4, 5, 5, 6, 7, 7, 8, 8, stats.mentors || 10],
      sparkColor: '#14b8a6', barPct: 38,
    },
  ];

  const colorMap = {
    purple: { iconBg: 'bg-purple-100 dark:bg-purple-500/15', iconText: 'text-purple-600 dark:text-purple-400' },
    indigo: { iconBg: 'bg-indigo-100 dark:bg-indigo-500/15', iconText: 'text-indigo-600 dark:text-indigo-400' },
    amber:  { iconBg: 'bg-amber-100 dark:bg-amber-500/15',   iconText: 'text-amber-600 dark:text-amber-400'   },
    blue:   { iconBg: 'bg-blue-100 dark:bg-blue-500/15',     iconText: 'text-blue-600 dark:text-blue-400'     },
    green:  { iconBg: 'bg-green-100 dark:bg-green-500/15',   iconText: 'text-green-600 dark:text-green-400'   },
    teal:   { iconBg: 'bg-teal-100 dark:bg-teal-500/15',     iconText: 'text-teal-600 dark:text-teal-400'     },
  };

  /* ── Activity items ──── */
  const activityItems = [
    { icon: <UserPlus size={13} />, text: '5 new students registered', time: '2 min ago', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-500/10' },
    { icon: <FileCheck size={13} />, text: '2 worklets approved', time: '15 min ago', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-500/10' },
    { icon: <UserCheck size={13} />, text: '1 mentor added', time: '1 hr ago', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-500/10' },
    { icon: <AlertCircle size={13} />, text: '3 submissions pending review', time: '2 hrs ago', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/10' },
    { icon: <Building2 size={13} />, text: 'New institution added', time: '5 hrs ago', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/10' },
  ];


  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 overflow-hidden dark:bg-slate-900 dark:text-slate-200">
      <AdminLeftSidebar />

      <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>

        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-purple-200 border-t-purple-500 dark:border-slate-700 dark:border-t-purple-400" />
          </div>
        ) : (
          <div className="max-w-none mx-0 p-3 pl-5 space-y-3">

            {/* ════════ 1. HEADER ════════════════════════════════════ */}
            <div className={`${
              isDarkMode
                ? 'bg-gradient-to-r from-slate-800/80 via-slate-700/50 to-slate-800/80 backdrop-blur-sm border-slate-700/50'
                : 'bg-gradient-to-r from-white/80 via-purple-50/50 to-indigo-50/30 backdrop-blur-sm border-purple-200/30'
            } rounded-2xl shadow-lg border p-4`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h1 className={`text-2xl font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Dashboard
                  </h1>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Welcome back, Admin — Real-time system overview
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* System status */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-emerald-500/10 border border-green-200 dark:border-emerald-500/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 dark:bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 dark:bg-emerald-500" />
                    </span>
                    <span className="text-xs font-semibold text-green-700 dark:text-emerald-400">System Active</span>
                  </div>
                  {/* Date */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    isDarkMode ? 'bg-slate-700/50 text-slate-400 border border-slate-700' : 'bg-white/60 text-slate-500 border border-slate-200/80'
                  }`}>
                    <Calendar size={13} />
                    {fmtDate()}
                  </div>
                  {/* Last login */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    isDarkMode ? 'bg-slate-700/50 text-slate-400 border border-slate-700' : 'bg-white/60 text-slate-500 border border-slate-200/80'
                  }`}>
                    <LogIn size={13} />
                    Last login: {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>

            {/* ════════ 2. KPI CARDS ═════════════════════════════════ */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {kpiCards.map((card, i) => {
                const cm = colorMap[card.color];
                return (
                  <div key={i}
                    className={`group rounded-xl p-3.5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-default border ${
                      isDarkMode
                        ? 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600/60'
                        : 'bg-white/80 backdrop-blur-sm border-slate-200/60 hover:border-purple-200/60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2.5">
                      <div className={`p-2 rounded-lg ${cm.iconBg}`}>
                        <div className={cm.iconText}>{card.icon}</div>
                      </div>
                      <Sparkline data={card.sparkData} color={card.sparkColor} />
                    </div>

                    <p className={`text-2xl font-black tabular-nums tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      <Num value={card.value} />
                    </p>
                    <p className={`text-xs font-medium mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{card.label}</p>

                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs font-bold flex items-center gap-1 ${card.positive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        <TrendingUp size={12} className={card.positive ? '' : 'rotate-180'} />
                        {card.change}
                      </span>
                      <span className={`text-[0.65rem] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>vs last month</span>
                    </div>

                    <div className={`mt-2 h-[3px] rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700/60' : 'bg-slate-200/80'}`}>
                      <div className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${card.barPct}%`, backgroundColor: card.sparkColor }} />
                    </div>
                  </div>
                );
              })}
            </section>

            {/* ════════ 3. ANALYTICS ═════════════════════════════════ */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={14} className="text-purple-500 dark:text-purple-400" />
                <h2 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  Analytics Overview
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className={`rounded-xl border p-3.5 ${
                  isDarkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/80 backdrop-blur-sm border-slate-200/60'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>User Growth Over Time</h3>
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                      <TrendingUp size={12} /> +18.3%
                    </span>
                  </div>
                  <ChartPlaceholder title="" type="line" isDark={isDarkMode} />
                </div>
                <div className={`rounded-xl border p-3.5 ${
                  isDarkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/80 backdrop-blur-sm border-slate-200/60'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Worklet Distribution</h3>
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                      <Activity size={12} /> Live
                    </span>
                  </div>
                  <ChartPlaceholder title="" type="bar" isDark={isDarkMode} />
                </div>
                <div className={`rounded-xl border p-3.5 flex flex-col items-center justify-center ${
                  isDarkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/80 backdrop-blur-sm border-slate-200/60'
                }`}>
                  <div className="flex items-center justify-between w-full mb-2">
                    <h3 className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Platform Activity</h3>
                    <span className={`text-xs font-semibold flex items-center gap-1 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      <Activity size={12} /> This Month
                    </span>
                  </div>
                  <PieChart
                    isDark={isDarkMode}
                    segments={[
                      { label: 'Submissions', value: 34, color: isDarkMode ? '#a78bfa' : '#7c3aed' },
                      { label: 'Reviews', value: 21, color: isDarkMode ? '#818cf8' : '#6366f1' },
                      { label: 'Approvals', value: 16, color: isDarkMode ? '#c4b5fd' : '#8b5cf6' },
                      { label: 'Rejected', value: 5, color: isDarkMode ? '#475569' : '#94a3b8' },
                    ]}
                  />
                </div>
              </div>
            </section>

            {/* ════════ 4. RECENT ACTIVITY ═══════════════════════════ */}
            <section>
              <div className={`rounded-xl border p-3.5 ${
                isDarkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/80 backdrop-blur-sm border-slate-200/60'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    <Activity size={13} className="text-purple-500 dark:text-purple-400" /> Recent Activity
                  </h2>
                  <button className="text-[0.65rem] text-purple-600 dark:text-purple-400 hover:text-purple-500 font-semibold flex items-center gap-1 transition-colors">
                    View all <ChevronRight size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-4 gap-y-0.5">
                  {activityItems.map((item, i) => (
                    <div key={i}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 cursor-default group ${
                        isDarkMode ? 'hover:bg-slate-700/40' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md ${item.bg} ${item.color} flex-shrink-0 transition-transform duration-200 group-hover:scale-110`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.text}</p>
                        <span className={`text-[0.65rem] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
