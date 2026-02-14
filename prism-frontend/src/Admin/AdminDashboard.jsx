import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AdminLeftSidebar, AdminRightSidebar } from './AdminSidebar';
import {
  Users, Briefcase, GraduationCap, UserCheck, TrendingUp,
  Clock, CheckCircle, AlertCircle, BarChart3, Activity,
  BookOpen, ArrowRight
} from 'lucide-react';
import samsungLogo from '../assets/prism_logo.png';

// Stat card – same glass-card style as mentor Home.jsx
const AdminStatCard = ({ icon, label, value, accent, onClick }) => (
  <div
    onClick={onClick}
    className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${accent} backdrop-blur-xl shadow-lg p-[clamp(1rem,1.5vw,1.25rem)] transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[clamp(0.75rem,0.9vw,0.85rem)] text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        <p className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-slate-800 dark:text-white mt-[0.3vw]">{value}</p>
      </div>
      <div className="w-[clamp(2.5rem,3.5vw,3rem)] h-[clamp(2.5rem,3.5vw,3rem)] rounded-xl bg-white/50 dark:bg-slate-700/50 flex items-center justify-center shadow-sm">
        {icon}
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  useDocumentTitle('PRISM Admin - Dashboard');
  const navigate = useNavigate();

  const [stats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalMentors: 0,
    totalProfessors: 0,
    totalWorklets: 0,
    totalColleges: 0,
    pendingApprovals: 0,
    activeWorklets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const base64Url = token.split('.')[1];
      if (!base64Url) return;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      const decoded = JSON.parse(jsonPayload);
      if (decoded.exp > Date.now() / 1000) setUserData(decoded);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const getFirstName = (name) => {
    if (!name) return 'Admin';
    const parts = name.split(' ');
    if (parts.length > 1 && (parts[0].length === 1 || parts[0].endsWith('.'))) {
      return parts.slice(0, 2).join(' ');
    }
    return parts[0];
  };

  const statCards = [
    { icon: <Users className="w-[clamp(1.25rem,1.8vw,1.5rem)] h-[clamp(1.25rem,1.8vw,1.5rem)] text-blue-500" />, label: 'Total Users', value: stats.totalUsers, accent: 'from-blue-50 to-white hover:border-blue-300 dark:from-slate-800/50 dark:to-slate-800/20 dark:hover:border-blue-600' },
    { icon: <GraduationCap className="w-[clamp(1.25rem,1.8vw,1.5rem)] h-[clamp(1.25rem,1.8vw,1.5rem)] text-emerald-500" />, label: 'Students', value: stats.totalStudents, accent: 'from-emerald-50 to-white hover:border-emerald-300 dark:from-slate-800/50 dark:to-slate-800/20 dark:hover:border-emerald-600' },
    { icon: <UserCheck className="w-[clamp(1.25rem,1.8vw,1.5rem)] h-[clamp(1.25rem,1.8vw,1.5rem)] text-purple-500" />, label: 'Mentors', value: stats.totalMentors, accent: 'from-purple-50 to-white hover:border-purple-300 dark:from-slate-800/50 dark:to-slate-800/20 dark:hover:border-purple-600' },
    { icon: <BookOpen className="w-[clamp(1.25rem,1.8vw,1.5rem)] h-[clamp(1.25rem,1.8vw,1.5rem)] text-amber-500" />, label: 'Total Worklets', value: stats.totalWorklets, accent: 'from-amber-50 to-white hover:border-amber-300 dark:from-slate-800/50 dark:to-slate-800/20 dark:hover:border-amber-600' },
    { icon: <Activity className="w-[clamp(1.25rem,1.8vw,1.5rem)] h-[clamp(1.25rem,1.8vw,1.5rem)] text-indigo-500" />, label: 'Active Worklets', value: stats.activeWorklets, accent: 'from-indigo-50 to-white hover:border-indigo-300 dark:from-slate-800/50 dark:to-slate-800/20 dark:hover:border-indigo-600' },
    { icon: <Clock className="w-[clamp(1.25rem,1.8vw,1.5rem)] h-[clamp(1.25rem,1.8vw,1.5rem)] text-orange-500" />, label: 'Pending Approvals', value: stats.pendingApprovals, accent: 'from-orange-50 to-white hover:border-orange-300 dark:from-slate-800/50 dark:to-slate-800/20 dark:hover:border-orange-600' },
    { icon: <GraduationCap className="w-[clamp(1.25rem,1.8vw,1.5rem)] h-[clamp(1.25rem,1.8vw,1.5rem)] text-teal-500" />, label: 'Colleges', value: stats.totalColleges, accent: 'from-teal-50 to-white hover:border-teal-300 dark:from-slate-800/50 dark:to-slate-800/20 dark:hover:border-teal-600' },
    { icon: <UserCheck className="w-[clamp(1.25rem,1.8vw,1.5rem)] h-[clamp(1.25rem,1.8vw,1.5rem)] text-pink-500" />, label: 'Professors', value: stats.totalProfessors, accent: 'from-pink-50 to-white hover:border-pink-300 dark:from-slate-800/50 dark:to-slate-800/20 dark:hover:border-pink-600' },
  ];

  const quickActions = [
    { label: 'Review Pending Worklets', icon: <Clock className="w-[clamp(1rem,1.3vw,1.125rem)] h-[clamp(1rem,1.3vw,1.125rem)]" />, color: 'text-orange-500', path: '/admin-worklets' },
    { label: 'Manage Users', icon: <Users className="w-[clamp(1rem,1.3vw,1.125rem)] h-[clamp(1rem,1.3vw,1.125rem)]" />, color: 'text-blue-500', path: '/admin-users' },
    { label: 'View Mentors', icon: <UserCheck className="w-[clamp(1rem,1.3vw,1.125rem)] h-[clamp(1rem,1.3vw,1.125rem)]" />, color: 'text-purple-500', path: '/admin-mentors' },
    { label: 'College Management', icon: <GraduationCap className="w-[clamp(1rem,1.3vw,1.125rem)] h-[clamp(1rem,1.3vw,1.125rem)]" />, color: 'text-teal-500', path: '/admin-colleges' },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 overflow-hidden dark:bg-slate-900 dark:text-slate-200">
      <AdminLeftSidebar />

      <main className="flex-1 px-[2vw] py-[1.5vh] overflow-y-auto [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Header – matches mentor Home.jsx */}
        <header className="flex justify-between items-center mb-[3vh]">
          <div>
            <h1 className="text-[clamp(1.75rem,3.5vw,2.25rem)] font-bold text-black dark:text-white">
              Welcome, {getFirstName(userData?.name)}
            </h1>
            <p className="text-[clamp(0.875rem,1.2vw,1rem)] text-slate-500 dark:text-slate-400">
              Here's what's happening across PRISM today.
            </p>
          </div>
          <div className="flex items-center gap-[1vw]">
            <span className="text-[clamp(0.7rem,0.85vw,0.8rem)] text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 px-[0.8vw] py-[0.3vw] rounded-full font-semibold">
              Admin Panel
            </span>
            <img src={samsungLogo} alt="PRISM" className="h-[clamp(2.5rem,4vw,3.5rem)] opacity-90" />
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(0.75rem,1.5vw,1.25rem)] mb-[3vh]">
              {statCards.map((card, idx) => (
                <AdminStatCard key={idx} {...card} />
              ))}
            </section>

            {/* Quick Actions & Recent Activity */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(1rem,2vw,1.5rem)]">
              {/* Quick Actions */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 backdrop-blur-xl shadow-lg p-[clamp(1.25rem,2vw,1.5rem)] dark:bg-slate-900/50 dark:border-slate-700">
                <h2 className="text-[clamp(1.125rem,1.5vw,1.25rem)] font-bold text-slate-900 dark:text-white mb-[1.5vh] flex items-center gap-[0.5vw]">
                  <BarChart3 className="w-[clamp(1.125rem,1.5vw,1.25rem)] h-[clamp(1.125rem,1.5vw,1.25rem)] text-purple-500" />
                  Quick Actions
                </h2>
                <div className="space-y-[clamp(0.5rem,0.8vh,0.625rem)]">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigate(action.path)}
                      className="w-full flex items-center gap-[clamp(0.5rem,0.8vw,0.75rem)] p-[clamp(0.75rem,1vw,0.875rem)] rounded-xl text-left text-[clamp(0.8rem,1vw,0.875rem)] font-semibold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-slate-700 transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:scale-[1.01] group"
                    >
                      <span className={action.color}>{action.icon}</span>
                      <span className="flex-1">{action.label}</span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 backdrop-blur-xl shadow-lg p-[clamp(1.25rem,2vw,1.5rem)] dark:bg-slate-900/50 dark:border-slate-700">
                <h2 className="text-[clamp(1.125rem,1.5vw,1.25rem)] font-bold text-slate-900 dark:text-white mb-[1.5vh] flex items-center gap-[0.5vw]">
                  <Activity className="w-[clamp(1.125rem,1.5vw,1.25rem)] h-[clamp(1.125rem,1.5vw,1.25rem)] text-indigo-500" />
                  Recent Activity
                </h2>
                <div className="space-y-[clamp(0.75rem,1vh,0.875rem)]">
                  {[
                    { text: 'System initialized', time: 'Just now', icon: <CheckCircle className="w-[clamp(1rem,1.2vw,1.125rem)] h-[clamp(1rem,1.2vw,1.125rem)] text-green-500" /> },
                    { text: 'Admin panel loaded', time: 'Just now', icon: <Activity className="w-[clamp(1rem,1.2vw,1.125rem)] h-[clamp(1rem,1.2vw,1.125rem)] text-blue-500" /> },
                    { text: 'Dashboard data will populate with API', time: 'Pending', icon: <AlertCircle className="w-[clamp(1rem,1.2vw,1.125rem)] h-[clamp(1rem,1.2vw,1.125rem)] text-amber-500" /> },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-[clamp(0.5rem,0.8vw,0.75rem)] p-[clamp(0.5rem,0.8vw,0.625rem)] rounded-xl bg-white/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50">
                      <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                      <div>
                        <p className="text-[clamp(0.8rem,0.95vw,0.875rem)] text-slate-700 dark:text-slate-300 font-medium">{item.text}</p>
                        <p className="text-[clamp(0.65rem,0.8vw,0.75rem)] text-slate-400 mt-[0.2vw]">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <AdminRightSidebar />
    </div>
  );
};

export default AdminDashboard;
