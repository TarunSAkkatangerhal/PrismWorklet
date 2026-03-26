import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AdminLeftSidebar } from './AdminSidebar';
import { ThemeContext } from '../context/ThemeContext';
import API from '../api';
import {
  ArrowLeft, Building2, Users, GraduationCap, UserCheck, Calendar,
  FileText, GitBranch, Link2, Tag, CheckCircle, AlertCircle,
  Clock, BarChart3, Award, Database, Paperclip, Plus,
  Save, Trash2, ChevronUp, X, ExternalLink,
  Settings, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ───────────────────────────── helpers ───────────────────────────── */
const statusOpts  = ['To Start', 'Ongoing', 'Completed', 'On Hold', 'Dropped'];
const stageOpts   = ['First Review', 'Second Review', 'Mid Review', 'Fourth Review', 'End Review', 'Extended Review', 'Add OC', 'Kicked-Off'];
const perfOpts    = ['NA', 'Poor', 'Average', 'Good', 'Very Good'];
const riskOpts    = ['NA', 'High', 'Medium', 'Safe'];
const dataOpts    = ['Self-generated/Collected', 'Open Source', 'Not Applicable'];

const fmt = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

const fmtFull = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }); }
  catch { return d; }
};

const dateToInput = (d) => {
  if (!d) return '';
  try {
    const dt = new Date(d);
    return dt.toISOString().split('T')[0];
  } catch { return ''; }
};

const statusColor = (s) => {
  if (!s) return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  const l = s.toLowerCase();
  if (l.includes('ongoing'))   return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
  if (l.includes('completed')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  if (l.includes('hold'))      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
  if (l.includes('dropped'))   return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
};


/* ───────── Reusable section card ───────── */
const Section = ({ title, children, className = '' }) => (
  <fieldset className={`rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm p-5 shadow-sm ${className}`}>
    <legend className="px-3 text-sm font-bold text-indigo-600 dark:text-indigo-400">{title}</legend>
    {children}
  </fieldset>
);

/* ───────── Update button ───────── */
const UpdateBtn = ({ onClick, loading, label = 'Update' }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
  >
    {loading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Save className="w-4 h-4" />}
    {label}
  </button>
);

/* ═══════════════════════════════════════════════════════════════════ */
/*                        MAIN COMPONENT                              */
/* ═══════════════════════════════════════════════════════════════════ */
const AdminWorkletDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  useContext(ThemeContext);
  useDocumentTitle('PRISM Admin - Worklet Detail');

  const [worklet, setWorklet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [saving, setSaving] = useState({});
  const [toast, setToast] = useState(null);
  const [colleges, setColleges] = useState([]);

  // Profiles state
  const [addRole, setAddRole] = useState('Student');
  const [addCollege, setAddCollege] = useState('');
  const [addName, setAddName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // User profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, userId: null, userName: '' });

  // Modify form state
  const [form, setForm] = useState({});
  const [modalityOpen, setModalityOpen] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ─── fetch worklet ─── */
  const fetchWorklet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching worklet with ID:', id);
      const res = await API.get(`/worklets/${id}`);
      console.log('Worklet API response:', res.data);
      
      if (!res.data) {
        throw new Error('No data received from server');
      }
      
      setWorklet(res.data);
      setForm({
        college_id:      res.data.college_id || '',
        group:           res.data.team || res.data.group || '',
        assign_date:     dateToInput(res.data.assign_date),
        github_url:      res.data.github_repo_url || res.data.github_url || '',
        start_date:      dateToInput(res.data.start_date),
        end_date:        dateToInput(res.data.end_date),
        status:          res.data.status || 'Ongoing',
        stage:           res.data.current_stage || res.data.stage || '',
        cert_id:         res.data.cert_id || '',
        performance:     res.data.performance || 'NA',
        riskStatus:      res.data.riskStatus || res.data.risk_status || 'NA',
        riskNotes:       res.data.risk_status_notes || res.data.riskNotes || '',
        paperDetails:    res.data.paper_details || '',
        patentDetails:   res.data.patent_details || '',
        commerceDetails: res.data.commercialization_details || '',
        groupHeadComments: res.data.group_head_comments || '',
        isExcellent:     !!res.data.is_excellent,
        isDataCollected: res.data.is_data_collected || 'Not Applicable',
        isGenAI:         !!res.data.is_genai,
        modality:        res.data.modality || '',
        category:        res.data.category || '',
      });
    } catch (err) {
      console.error('Failed to fetch worklet:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.status === 404 
        ? 'Worklet not found. It may have been deleted or the ID is incorrect.'
        : err.response?.data?.detail || err.message || 'Failed to load worklet details. Please try again.';
      setError(errorMsg);
      setWorklet(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchWorklet(); }, [fetchWorklet]);

  useEffect(() => {
    API.get('/api/admin/colleges').then(r => setColleges(r.data)).catch(() => {});
  }, []);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSearchDropdown && !e.target.closest('.search-dropdown-container')) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchDropdown]);

  // Reset search when role or college changes
  useEffect(() => {
    setAddName('');
    setSelectedUser(null);
    setSearchResults([]);
    setShowSearchDropdown(false);
  }, [addRole, addCollege]);

  /* ─── generic update helper ─── */
  const handleUpdate = async (key, payload) => {
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await API.put(`/worklets/${worklet.id}`, payload);
      showToast(`${key} updated successfully`);
      fetchWorklet();
    } catch (err) {
      showToast(`Failed to update ${key}`, 'error');
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  /* ─── search users as typing ─── */
  const handleSearchUsers = async (searchText) => {
    setAddName(searchText);
    if (!searchText.trim() || searchText.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    
    try {
      setSearchLoading(true);
      const params = new URLSearchParams({
        search: searchText,
        role: addRole,
        page: '1',
        page_size: '10'
      });
      if (addCollege) {
        params.append('college_id', addCollege);
      }
      
      const res = await API.get(`/api/admin/users?${params.toString()}`);
      const users = res.data?.users || [];
      setSearchResults(users);
      setShowSearchDropdown(users.length > 0);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  /* ─── select user from dropdown ─── */
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setAddName(user.name);
    setShowSearchDropdown(false);
  };

  /* ─── add user to worklet ─── */
  const handleAddUser = async () => {
    if (!selectedUser) {
      return showToast('Please search and select a user from the dropdown', 'error');
    }
    
    try {
      setSaving(s => ({ ...s, addUser: true }));
      await API.post('/api/associations/', { 
        user_id: selectedUser.id, 
        worklet_id: worklet.id, 
        role_in_worklet: addRole 
      });
      showToast(`${addRole} '${selectedUser.name}' added successfully`);
      setAddName('');
      setSelectedUser(null);
      setSearchResults([]);
      fetchWorklet();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to add user', 'error');
    } finally {
      setSaving(s => ({ ...s, addUser: false }));
    }
  };

  /* ─── remove user from worklet (with confirmation) ─── */
  const confirmRemoveUser = (userId, userName = 'this user') => {
    setDeleteConfirm({ show: true, userId, userName });
  };

  const handleRemoveUser = async () => {
    const { userId } = deleteConfirm;
    setDeleteConfirm({ show: false, userId: null, userName: '' });
    try {
      await API.delete(`/api/associations/${userId}/${worklet.id}`);
      showToast('User removed');
      fetchWorklet();
    } catch (err) {
      showToast('Failed to remove', 'error');
    }
  };

  const cancelRemoveUser = () => {
    setDeleteConfirm({ show: false, userId: null, userName: '' });
  };

  /* ─── view user profile ─── */
  const handleViewProfile = async (userId, userName) => {
    console.log('handleViewProfile called with:', { userId, userName });
    if (!userId) {
      console.log('No userId provided, skipping profile fetch');
      showToast('Cannot view profile - user ID not available', 'error');
      return;
    }
    try {
      setProfileLoading(true);
      setShowProfileModal(true);
      console.log('Fetching profile for user ID:', userId);
      const res = await API.get(`/api/admin/users/${userId}`);
      console.log('Profile data received:', res.data);
      setProfileUser(res.data);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      showToast('Failed to load user profile', 'error');
      setShowProfileModal(false);
    } finally {
      setProfileLoading(false);
    }
  };

  const tabs = [
    { key: 'description',  label: 'Description',   icon: <FileText className="w-4 h-4" /> },
    { key: 'profiles',     label: 'Profiles',       icon: <Users className="w-4 h-4" /> },
    { key: 'feedback',     label: 'Feedback',       icon: <MessageCircle className="w-4 h-4" /> },
    { key: 'certificates', label: 'Certificates',   icon: <Award className="w-4 h-4" /> },
    { key: 'modify',       label: 'Modify Worklet', icon: <Settings className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-slate-100 dark:bg-slate-900">
        <AdminLeftSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
        </div>
      </div>
    );
  }

  if (error || !worklet) {
    return (
      <div className="flex h-screen w-full bg-slate-100 dark:bg-slate-900">
        <AdminLeftSidebar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 max-w-md text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Worklet Not Found</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{error || 'Unable to load worklet details'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-6">Worklet ID: {id}</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => navigate('/admin-worklets')} 
                className="px-5 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors shadow-md flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Worklets
              </button>
              <button 
                onClick={fetchWorklet} 
                className="px-5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors shadow-md"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const professors = worklet.professors || [];
  const students   = worklet.students   || [];

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 overflow-hidden dark:bg-slate-900 dark:text-slate-200">
      <AdminLeftSidebar />

      <main className="wdf flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-0" style={{ scrollbarWidth: 'none' }}>
        <style>{`
          .wdf select,
          .wdf textarea,
          .wdf input:not([type="checkbox"]):not([type="radio"]):not([type="file"]) {
            border-radius: 0.75rem;
            padding: 0.625rem 0.875rem;
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            transition: all 0.2s;
            outline: none;
          }
          .wdf select:hover,
          .wdf textarea:hover,
          .wdf input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):hover {
            border-color: #a5b4fc;
          }
          .dark .wdf select:hover,
          .dark .wdf textarea:hover,
          .dark .wdf input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):hover {
            border-color: rgba(99, 102, 241, 0.5);
          }
          .wdf select:focus,
          .wdf textarea:focus,
          .wdf input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):focus {
            border-color: #818cf8;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
          }
          .wdf select {
            cursor: pointer;
            -webkit-appearance: none;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
            background-position: right 0.5rem center;
            background-repeat: no-repeat;
            background-size: 1.25em 1.25em;
            padding-right: 2.5rem;
          }
          .dark .wdf select {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
          }
        `}</style>
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
            >
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirm.show && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
              onClick={cancelRemoveUser}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', duration: 0.3 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Confirm Removal</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Are you sure you want to remove <span className="font-semibold text-slate-800 dark:text-slate-200">{deleteConfirm.userName}</span> from this worklet? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={cancelRemoveUser}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    No, Cancel
                  </button>
                  <button
                    onClick={handleRemoveUser}
                    className="px-4 py-2 text-sm font-medium rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition"
                  >
                    Yes, Remove
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex h-full">
          {/* ─────── LEFT INFO PANEL ─────── */}
          <div className="w-[clamp(16rem,22vw,20rem)] border-r border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-b from-white/60 to-slate-50/40 dark:from-slate-800/50 dark:to-slate-900/30 overflow-y-auto flex-shrink-0 [&::-webkit-scrollbar]:w-0" style={{ scrollbarWidth: 'none' }}>
            <div className="p-5 pb-4">
              <button onClick={() => navigate('/admin-worklets')} className="flex items-center gap-1.5 text-sm text-purple-600 dark:text-purple-400 hover:underline mb-4">
                <ArrowLeft className="w-4 h-4" /> Back to Worklets
              </button>
              <h3 className="text-base font-bold text-slate-800 dark:text-white leading-snug mb-2 line-clamp-2">{worklet.title}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{fmtFull(worklet.created_at)}</span>
              </div>
              {worklet.created_by && (
                <p className="text-xs text-slate-400 mt-1">by {worklet.created_by}</p>
              )}
              <div className="w-12 h-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 mt-3" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2.5 px-4 pt-4">
              <div className="bg-white dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Professors</span>
                </div>
                <span className="text-lg font-bold text-slate-800 dark:text-white">{professors.length}</span>
              </div>
              <div className="bg-white dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Students</span>
                </div>
                <span className="text-lg font-bold text-slate-800 dark:text-white">{students.length}</span>
              </div>
              <div className="bg-white dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Status</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor(worklet.status)}`}>{worklet.status || 'To Start'}</span>
              </div>
              <div className="bg-white dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <Tag className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Worklet ID</span>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate block">{worklet.cert_id || `#${worklet.id}`}</span>
              </div>
            </div>

            {/* About Worklet Section */}
            <div className="mx-4 my-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
              <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4">About Worklet</h4>

              <div className="space-y-3">
                {/* College - special handling for long names */}
                <div className="py-2 border-b border-slate-200/60 dark:border-slate-600/40">
                  <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 mb-1.5">
                    <span className="text-slate-400 dark:text-slate-500"><Building2 className="w-4 h-4" /></span>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">College</span>
                  </div>
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 pl-6 truncate" title={worklet.college || '—'}>
                    {worklet.college || '—'}
                  </p>
                </div>
                <InfoItem icon={<Tag className="w-4 h-4" />} label="Stream" badge={worklet.stream || 'Any'} badgeColor="green" />
                <InfoItem icon={<UserCheck className="w-4 h-4" />} label="POC" badge={worklet.poc ? 'Yes' : 'No'} badgeColor={worklet.poc ? 'green' : 'red'} />
                <InfoItem icon={<GraduationCap className="w-4 h-4" />} label="Degree Type" badge={worklet.degree || 'Any'} badgeColor="green" />
                <InfoItem icon={<BarChart3 className="w-4 h-4" />} label="Complexity Type" badge={worklet.complexity || 'Medium'} badgeColor="yellow" />
                <InfoItem icon={<Award className="w-4 h-4" />} label="Research" badge={worklet.research ? 'Yes' : 'No'} badgeColor={worklet.research ? 'green' : 'red'} />
                <InfoItem icon={<Database className="w-4 h-4" />} label="DataCollection" badge={worklet.data_collection ? 'Yes' : 'No'} badgeColor={worklet.data_collection ? 'green' : 'red'} />
                <InfoItem icon={<Link2 className="w-4 h-4" />} label="LinkedProject" badge={worklet.linked_project ? 'Yes' : 'No'} badgeColor={worklet.linked_project ? 'green' : 'red'} />
                {worklet.attachments && worklet.attachments.length > 0 && (
                  <div className="flex items-center justify-between py-2 border-t border-slate-200 dark:border-slate-600">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Paperclip className="w-4 h-4" /> <span className="text-xs font-medium">Attachments</span>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {worklet.attachments.map((a, i) => (
                        <span key={i} className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">{a.name || `File ${i + 1}`}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─────── RIGHT CONTENT AREA ─────── */}
          <div className="flex-1 p-5 overflow-y-auto [&::-webkit-scrollbar]:w-0" style={{ scrollbarWidth: 'none' }}>
            {/* Tabs */}
            <div className="relative flex border-b border-slate-200 dark:border-slate-700 mb-6">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`relative px-5 py-3 text-sm font-semibold transition-colors duration-200 flex items-center gap-2
                    ${activeTab === t.key
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                  {t.icon}
                  {t.label}
                  {activeTab === t.key && (
                    <motion.div
                      layoutId="workletDetailTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* ════════ DESCRIPTION TAB ════════ */}
            {activeTab === 'description' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <Section title="Problem Statement">
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{worklet.description || worklet.problem_statement || '—'}</p>
                </Section>
                <Section title="Expectations">
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{worklet.expectation || '—'}</p>
                </Section>
                <Section title="Prerequisites">
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{worklet.prerequisites || '—'}</p>
                </Section>
                {worklet.github_repo_url && (
                  <Section title="GitHub Repository">
                    <a href={worklet.github_repo_url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4" /> {worklet.github_repo_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Section>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Section title="Duration">
                    <div className="flex gap-6 text-sm">
                      <div><span className="text-slate-400">Start:</span> <span className="font-semibold">{fmt(worklet.start_date)}</span></div>
                      <div><span className="text-slate-400">End:</span> <span className="font-semibold">{fmt(worklet.end_date)}</span></div>
                    </div>
                  </Section>
                  <Section title="Progress">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${worklet.worklet_progress || 0}%` }} />
                      </div>
                      <span className="text-sm font-bold">{worklet.worklet_progress || 0}%</span>
                    </div>
                  </Section>
                </div>
              </motion.div>
            )}

            {/* ════════ PROFILES TAB ════════ */}
            {activeTab === 'profiles' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <Section title="Update Students and Professors">
                  {/* Add user row */}
                  <div className="flex flex-wrap items-end gap-3 mb-5">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Role</label>
                      <select value={addRole} onChange={e => setAddRole(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm">
                        <option>Student</option>
                        <option>Professor</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">College</label>
                      <select value={addCollege} onChange={e => setAddCollege(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm min-w-[180px]">
                        <option value="">All Colleges</option>
                        {colleges.map(c => <option key={c.id} value={c.id}>{c.college_name || c.name}</option>)}
                      </select>
                    </div>
                    <div className="relative flex-1 min-w-[200px] search-dropdown-container">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Search Name</label>
                      <input 
                        value={addName} 
                        onChange={e => handleSearchUsers(e.target.value)} 
                        onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                        placeholder="Type to search..." 
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" 
                      />
                      {searchLoading && (
                        <div className="absolute right-3 top-9 animate-spin h-4 w-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full" />
                      )}
                      
                      {/* Search Results Dropdown */}
                      {showSearchDropdown && searchResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                          {searchResults.map(user => (
                            <div
                              key={user.id}
                              onClick={() => handleSelectUser(user)}
                              className="px-3 py-2 hover:bg-purple-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                            >
                              <div className="text-sm font-medium text-slate-800 dark:text-white">{user.name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {user.email} • {user.college || 'No College'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* No results message */}
                      {addName.length >= 2 && !searchLoading && searchResults.length === 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg px-3 py-2">
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            No {addRole.toLowerCase()}s found{addCollege ? ' in selected college' : ''}.
                          </div>
                        </div>
                      )}
                    </div>
                    <UpdateBtn onClick={handleAddUser} loading={saving.addUser} label="Add" />
                  </div>

                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 rounded-t-xl bg-indigo-50 dark:bg-indigo-900/20 text-xs font-semibold text-slate-500 uppercase">
                    <div className="col-span-5">Name</div>
                    <div className="col-span-2">Eligible</div>
                    <div className="col-span-4">College</div>
                    <div className="col-span-1" />
                  </div>

                  {/* Professors */}
                  {professors.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700">
                        Professor ({professors.length})
                      </h4>
                      {professors.map((p, idx) => {
                        // Handle both string names and object formats
                        const isString = typeof p === 'string';
                        const professorName = isString ? p : (p.name || p.user_name || 'Unknown');
                        const professorId = isString ? null : (p.id || p.user_id);
                        const professorCollege = isString ? '—' : (p.college || p.college_name || '—');
                        const professorEligible = isString ? false : (p.eligible || false);
                        
                        return (
                          <div key={professorId || `prof-${idx}`} className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                            <div 
                              className={`col-span-5 text-sm font-medium ${
                                professorId 
                                  ? 'text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline' 
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                              onClick={professorId ? () => handleViewProfile(professorId, professorName) : undefined}
                              title={professorId ? 'Click to view profile' : 'Profile not available'}
                            >
                              {professorName}
                            </div>
                            <div className="col-span-2"><input type="checkbox" defaultChecked={professorEligible} className="rounded text-indigo-600" /></div>
                            <div className="col-span-4 text-xs text-slate-500">{professorCollege}</div>
                            <div className="col-span-1">
                              {professorId && (
                                <button onClick={() => confirmRemoveUser(professorId, professorName)} className="text-red-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Students */}
                  {students.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700">
                        Student ({students.length})
                      </h4>
                      {students.map((s, idx) => {
                        // Handle both string names and object formats
                        const isString = typeof s === 'string';
                        const studentName = isString ? s : (s.name || s.user_name || 'Unknown');
                        const studentId = isString ? null : (s.id || s.user_id);
                        const studentCollege = isString ? '—' : (s.college || s.college_name || '—');
                        const studentEligible = isString ? false : (s.eligible || false);
                        
                        return (
                          <div key={studentId || `student-${idx}`} className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                            <div 
                              className={`col-span-5 text-sm font-medium ${
                                studentId 
                                  ? 'text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline' 
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                              onClick={studentId ? () => handleViewProfile(studentId, studentName) : undefined}
                              title={studentId ? 'Click to view profile' : 'Profile not available'}
                            >
                              {studentName}
                            </div>
                            <div className="col-span-2"><input type="checkbox" defaultChecked={studentEligible} className="rounded text-indigo-600" /></div>
                            <div className="col-span-4 text-xs text-slate-500">{studentCollege}</div>
                            <div className="col-span-1">
                              {studentId && (
                                <button onClick={() => confirmRemoveUser(studentId, studentName)} className="text-red-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {professors.length === 0 && students.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-8">No users assigned to this worklet yet.</p>
                  )}
                </Section>
              </motion.div>
            )}

            {/* ════════ FEEDBACK TAB ════════ */}
            {activeTab === 'feedback' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <Section title="Feedback">
                  <p className="text-sm text-slate-400 text-center py-8">Milestone feedback will appear here once available.</p>
                </Section>
              </motion.div>
            )}

            {/* ════════ CERTIFICATES TAB ════════ */}
            {activeTab === 'certificates' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <Section title="Certificates">
                  <p className="text-sm text-slate-400 text-center py-8">Certificate management will appear here.</p>
                </Section>
              </motion.div>
            )}

            {/* ════════ MODIFY WORKLET TAB ════════ */}
            {activeTab === 'modify' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

                {/* Update College & Group */}
                <Section title="Update College &amp; Group">
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[160px]">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">College:</label>
                      <select value={form.college_id} onChange={e => setForm(f => ({ ...f, college_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm">
                        <option value="">Select College</option>
                        {colleges.map(c => <option key={c.id} value={c.id}>{c.college_name || c.name}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Group:</label>
                      <select value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm">
                        <option value="">Select Group</option>
                        <option>R&D Strategy Group</option>
                        <option>Visual Intelligence Group</option>
                        <option>Device Solutions Group</option>
                      </select>
                    </div>
                    <div className="min-w-[140px]">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Assign Date</label>
                      <input type="date" value={form.assign_date} onChange={e => setForm(f => ({ ...f, assign_date: e.target.value }))} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" />
                    </div>
                    <UpdateBtn onClick={() => handleUpdate('College & Group', { college_id: form.college_id ? parseInt(form.college_id) : null })} loading={saving['College & Group']} />
                  </div>
                </Section>

                {/* Update Github Link */}
                <Section title="Update Github Link">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Github Link:</label>
                      <input type="url" value={form.github_url} onChange={e => setForm(f => ({ ...f, github_url: e.target.value }))} placeholder="https://github.com/..." className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" />
                    </div>
                    <UpdateBtn onClick={() => handleUpdate('Github', { github_url: form.github_url })} loading={saving['Github']} />
                  </div>
                </Section>

                {/* Worklet Duration */}
                <Section title="Worklet Duration">
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[140px]">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Start Date</label>
                      <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">End Date</label>
                      <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" />
                    </div>
                    <UpdateBtn onClick={() => handleUpdate('Duration', { start_date: form.start_date, end_date: form.end_date })} loading={saving['Duration']} />
                  </div>
                </Section>

                {/* Update Status */}
                <Section title="Update Status">
                  <div className="flex items-end gap-4">
                    <div className="flex-1 max-w-sm">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Update Status:</label>
                      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm">
                        {statusOpts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <UpdateBtn onClick={() => handleUpdate('Status', { status: form.status })} loading={saving['Status']} />
                  </div>
                </Section>

                {/* Update Stage */}
                <Section title="Update Stage">
                  <div className="flex items-end gap-4">
                    <div className="flex-1 max-w-sm">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Update Stage:</label>
                      <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm">
                        <option value="">Select Stage</option>
                        {stageOpts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <UpdateBtn onClick={() => handleUpdate('Stage', { stage: form.stage })} loading={saving['Stage']} />
                  </div>
                </Section>

                {/* Update Worklet ID */}
                <Section title="Update Worklet ID">
                  <div className="flex items-end gap-4">
                    <div className="flex-1 max-w-sm">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">WorkletID:</label>
                      <input value={form.cert_id} onChange={e => setForm(f => ({ ...f, cert_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" />
                    </div>
                    <UpdateBtn onClick={() => handleUpdate('Worklet ID', { cert_id: form.cert_id })} loading={saving['Worklet ID']} label="Save" />
                  </div>
                </Section>

                {/* Attachments */}
                <Section title="Attachments">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Update Attachment:</label>
                      <input type="file" className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 dark:file:bg-indigo-900/30 dark:file:text-indigo-400 hover:file:bg-indigo-100" />
                    </div>
                    <UpdateBtn onClick={() => showToast('Attachment upload coming soon', 'error')} loading={false} />
                  </div>
                  {worklet.attachments && worklet.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {worklet.attachments.map((a, i) => (
                        <span key={i} className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-3 py-1 rounded-lg">{a.name || `Attachment${i + 1}`}</span>
                      ))}
                    </div>
                  )}
                </Section>

                {/* Additional Details */}
                <Section title="Additional Details">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Performance */}
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Performance</label>
                      <select value={form.performance} onChange={e => setForm(f => ({ ...f, performance: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm">
                        {perfOpts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    {/* Risk Status */}
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">RiskStatus</label>
                      <select value={form.riskStatus} onChange={e => setForm(f => ({ ...f, riskStatus: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm">
                        {riskOpts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    {/* Risk Status Notes */}
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">RiskStatusNotes</label>
                      <textarea value={form.riskNotes} onChange={e => setForm(f => ({ ...f, riskNotes: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm resize-y" />
                    </div>
                    {/* Paper Details */}
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Paper Details</label>
                      <select value={form.paperDetails} onChange={e => setForm(f => ({ ...f, paperDetails: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm">
                        <option value="">Select</option>
                        <option>Published</option>
                        <option>Under Review</option>
                        <option>Submitted</option>
                        <option>Not Started</option>
                      </select>
                    </div>
                    {/* Patent Details */}
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Patent Details</label>
                      <select value={form.patentDetails} onChange={e => setForm(f => ({ ...f, patentDetails: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm">
                        <option value="">Select</option>
                        <option>Filed</option>
                        <option>Granted</option>
                        <option>Published</option>
                        <option>Not Started</option>
                      </select>
                    </div>
                    {/* Commercialization Details */}
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Commercialization Details</label>
                      <select value={form.commerceDetails} onChange={e => setForm(f => ({ ...f, commerceDetails: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm">
                        <option value="">Select</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                        <option>Not Applicable</option>
                      </select>
                    </div>
                    {/* GroupHead Comments */}
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">GroupHead Comments</label>
                      <textarea value={form.groupHeadComments} onChange={e => setForm(f => ({ ...f, groupHeadComments: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm resize-y" />
                    </div>
                  </div>

                  {/* Checkboxes & Radios */}
                  <div className="mt-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 w-36">Is Excellent</label>
                      <input type="checkbox" checked={form.isExcellent} onChange={e => setForm(f => ({ ...f, isExcellent: e.target.checked }))} className="rounded text-indigo-600 w-5 h-5" />
                    </div>
                    <div className="flex items-start gap-3">
                      <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 w-36 pt-0.5">Is Data Collected</label>
                      <div className="flex flex-wrap gap-4">
                        {dataOpts.map(o => (
                          <label key={o} className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                            <input type="radio" name="dataCollected" checked={form.isDataCollected === o} onChange={() => setForm(f => ({ ...f, isDataCollected: o }))} className="text-indigo-600" />
                            {o}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 w-36">Is_GenAI_TF</label>
                      <input type="checkbox" checked={form.isGenAI} onChange={e => setForm(f => ({ ...f, isGenAI: e.target.checked }))} className="rounded text-indigo-600 w-5 h-5" />
                    </div>
                  </div>

                  {/* Add Modality & Category */}
                  <button
                    onClick={() => setModalityOpen(o => !o)}
                    className="w-full mt-5 flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition"
                  >
                    Add Modality &amp; Category
                    {modalityOpen ? <ChevronUp className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </button>
                  <AnimatePresence>
                    {modalityOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-4 pt-4">
                          <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">Modality</label>
                            <input value={form.modality} onChange={e => setForm(f => ({ ...f, modality: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">Category</label>
                            <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Final Update */}
                  <div className="mt-5">
                    <UpdateBtn
                      onClick={() => handleUpdate('Additional Details', {
                        performance: form.performance,
                        riskStatus: form.riskStatus,
                        risk_status_notes: form.riskNotes,
                        paper_details: form.paperDetails,
                        patent_details: form.patentDetails,
                        commercialization_details: form.commerceDetails,
                        group_head_comments: form.groupHeadComments,
                        is_excellent: form.isExcellent,
                        is_data_collected: form.isDataCollected,
                        is_genai: form.isGenAI,
                        modality: form.modality,
                        category: form.category,
                      })}
                      loading={saving['Additional Details']}
                    />
                  </div>
                </Section>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* User Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-[90%] max-w-2xl max-h-[85vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">User Profile</h2>
                    <p className="text-sm text-indigo-100">Detailed Information</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-88px)]">
                {profileLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Loading profile...</p>
                  </div>
                ) : profileUser ? (
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Full Name</label>
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">{profileUser.name || '—'}</p>
                        </div>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Role</label>
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <span className="inline-block px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                            {profileUser.role || '—'}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Email Address</label>
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <p className="text-sm text-slate-700 dark:text-slate-300">{profileUser.email || '—'}</p>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">College</label>
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <p className="text-sm text-slate-700 dark:text-slate-300">{profileUser.college || profileUser.college_name || '—'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    {profileUser.student_id && (
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Student ID</label>
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{profileUser.student_id}</p>
                        </div>
                      </div>
                    )}

                    {/* Worklet Involvement */}
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Worklet Summary</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="px-4 py-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Total Worklets</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{profileUser.worklet_count || 0}</p>
                        </div>
                        <div className="px-4 py-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">Status</span>
                          </div>
                          <p className="text-sm font-bold text-green-700 dark:text-green-300">
                            {profileUser.is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Account Details */}
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Account Information</label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <span className="text-xs text-slate-500 dark:text-slate-400">Profile Completed</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${profileUser.profile_completed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                            {profileUser.profile_completed ? 'Yes' : 'No'}
                          </span>
                        </div>
                        {profileUser.created_at && (
                          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Member Since</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {fmtFull(profileUser.created_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">Failed to load profile</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Small helper component ─── */
const badgeStyles = {
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const InfoItem = ({ icon, label, value, badge, badgeColor }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-200/60 dark:border-slate-600/40 last:border-0">
    <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
      <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
    </div>
    {badge ? (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${badgeStyles[badgeColor] || badgeColor}`}>{badge}</span>
    ) : (
      <p className="text-sm font-medium text-slate-800 dark:text-white">{value}</p>
    )}
  </div>
);

export default AdminWorkletDetail;
