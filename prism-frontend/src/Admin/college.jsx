import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AdminLeftSidebar } from './AdminSidebar';
import { ThemeContext } from '../context/ThemeContext';
import API from '../api';
import {
  Building2, MapPin, Globe, ChevronDown, ChevronLeft, ChevronRight, CalendarDays, Phone,
  ArrowLeft, Upload, Trash2, Edit3, Plus, Loader2, X, Check, Search,
  Image as ImageIcon, FileCheck, Shield, Hash, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Ownership Options ────────────────────────────────────────────────
const OWNERSHIP_OPTIONS = [
  'Government',
  'Private',
  'Public-Private',
  'Deemed University',
  'Autonomous',
];

// ─── Floating Label Input ─────────────────────────────────────────────
const FormField = ({ icon: Icon, label, placeholder, type = 'text', value, onChange, name, isDarkMode, required = false }) => (
  <div>
    <label className={`flex items-center gap-1.5 text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
      <Icon size={13} className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} />
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all duration-200 outline-none
        ${isDarkMode
          ? 'bg-slate-900/50 border-slate-600/40 text-slate-200 placeholder-slate-600 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15 focus:bg-slate-900/70'
          : 'bg-slate-50/80 border-slate-200/80 text-slate-800 placeholder-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 focus:bg-white'
        }`}
    />
  </div>
);

// ─── Select Dropdown ──────────────────────────────────────────────────
const FormDropdown = ({ icon: Icon, label, placeholder, options, value, onChange, name, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <label className={`flex items-center gap-1.5 text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        <Icon size={13} className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} />
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-left transition-all duration-200 outline-none pr-8
            ${isDarkMode
              ? 'bg-slate-900/50 border-slate-600/40 text-slate-200 hover:border-slate-500 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15'
              : 'bg-slate-50/80 border-slate-200/80 text-slate-800 hover:border-slate-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10'
            }
            ${!value ? (isDarkMode ? 'text-slate-600' : 'text-slate-400') : ''}`}
        >
          {value || placeholder}
        </button>
        <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />

        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className={`absolute top-full left-0 mt-1 w-full z-20 rounded-lg border shadow-xl overflow-hidden ${
                  isDarkMode ? 'bg-slate-800 border-slate-600/50' : 'bg-white border-slate-200/80'
                }`}
              >
                {options.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => { onChange({ target: { name, value: opt } }); setIsOpen(false); }}
                    className={`w-full px-3.5 py-2 text-sm text-left transition-all duration-100 flex items-center justify-between ${
                      value === opt
                        ? isDarkMode ? 'bg-purple-500/15 text-purple-300' : 'bg-purple-50 text-purple-700'
                        : isDarkMode ? 'text-slate-300 hover:bg-slate-700/60' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                    {value === opt && <Check size={13} className="text-purple-400" />}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── Add College Component ────────────────────────────────────────────
const AddCollege = () => {
  useDocumentTitle('PRISM Admin - Add College');
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);

  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    college_name: '',
    location: '',
    website: '',
    ownership: '',
    established: '',
    coordinator_contact: '',
    nirf_ranking: '',
    mou_completed: false,
  });

  // Fetch existing colleges
  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const res = await API.get('/colleges');
      setColleges(res.data || []);
    } catch (err) {
      console.error('Failed to fetch colleges:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setForm({
      college_name: '',
      location: '',
      website: '',
      ownership: '',
      established: '',
      coordinator_contact: '',
      nirf_ranking: '',
      mou_completed: false,
      _existingLogo: null,
    });
    setLogoFile(null);
    setLogoPreview(null);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.college_name.trim()) {
      setError('College name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        college_name: form.college_name.trim(),
        location: form.location.trim(),
        established: form.established ? parseInt(form.established.split('-')[0]) : null,
        infrastructure: form.ownership || null,
        ownership_type: form.ownership || null,
        area_of_expertise: [
          form.website && `website:${form.website}`,
          form.coordinator_contact && `contact:${form.coordinator_contact}`,
          form.nirf_ranking && `nirf:${form.nirf_ranking}`,
          form.mou_completed && 'mou:completed',
        ].filter(Boolean).join('|') || null,
        logo: logoPreview || (editingId ? form._existingLogo : null) || null,
      };

      if (editingId) {
        await API.put(`/colleges/${editingId}`, payload);
        setSuccess('College updated successfully!');
      } else {
        await API.post('/colleges', payload);
        setSuccess('College added successfully!');
      }
      resetForm();
      fetchColleges();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to add college.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (collegeId) => {
    if (!window.confirm('Are you sure you want to delete this college?')) return;
    try {
      await API.delete(`/colleges/${collegeId}`);
      if (editingId === collegeId) resetForm();
      fetchColleges();
    } catch (err) {
      setError('Failed to delete college.');
    }
  };

  const handleEdit = (college) => {
    // Parse extra data stored in area_of_expertise
    const extraData = {};
    if (college.area_of_expertise) {
      college.area_of_expertise.split('|').forEach(part => {
        const [key, ...rest] = part.split(':');
        if (key && rest.length) extraData[key] = rest.join(':');
      });
    }

    setForm({
      college_name: college.college_name || '',
      location: college.location || '',
      website: extraData.website || '',
      ownership: college.ownership_type || college.infrastructure || '',
      established: college.established ? `${college.established}-01-01` : '',
      coordinator_contact: extraData.contact || '',
      nirf_ranking: extraData.nirf || '',
      mou_completed: !!extraData.mou,
      _existingLogo: college.logo || null,
    });
    setEditingId(college.college_id);
    setLogoFile(null);
    setLogoPreview(college.logo || null);
    setError(null);
    setSuccess(null);
    // Scroll to top so user sees the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Search / filter for the colleges table
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const filteredColleges = colleges.filter(c =>
    c.college_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.ownership_type?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => (a.college_name || '').localeCompare(b.college_name || ''));

  const totalPages = Math.max(1, Math.ceil(filteredColleges.length / PAGE_SIZE));
  const paginatedColleges = filteredColleges.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to page 1 when search changes
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const mouCount = colleges.filter(c => c.area_of_expertise?.includes('mou:completed')).length;

  return (
    <div className={`flex h-screen font-sans ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <AdminLeftSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-none mx-0 p-4 pl-6 pb-8">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center justify-between mb-5 ${
              isDarkMode
                ? 'bg-gradient-to-r from-slate-800/90 via-purple-900/15 to-slate-800/90 border-slate-700/50'
                : 'bg-gradient-to-r from-white/90 via-purple-50/50 to-indigo-50/30 border-purple-200/30'
            } rounded-2xl shadow-lg border backdrop-blur-sm p-5`}
          >
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => navigate('/admin-colleges')}
                className={`p-2.5 rounded-xl border transition-all duration-200 ${
                  isDarkMode
                    ? 'border-slate-700/50 hover:bg-slate-700/60 text-slate-400 hover:text-white'
                    : 'border-slate-200/50 hover:bg-white/80 text-slate-500 hover:text-slate-800'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft size={20} />
              </motion.button>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {editingId ? 'Edit College' : 'Add College'}
                  </h1>
                  {editingId && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    >
                      Editing
                    </motion.span>
                  )}
                </div>
                <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {editingId ? 'Update college details and save changes' : 'Register a new college and manage partnerships'}
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <div className={`text-center px-4 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/60 border-slate-200/50'}`}>
                <div className={`text-xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{colleges.length}</div>
                <div className={`text-[10px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Total</div>
              </div>
              <div className={`text-center px-4 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/60 border-slate-200/50'}`}>
                <div className={`text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{mouCount}</div>
                <div className={`text-[10px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>MoU</div>
              </div>
            </div>
          </motion.div>

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className={`mb-4 p-3.5 rounded-xl border text-sm flex items-center gap-2.5 ${
                  isDarkMode ? 'bg-red-900/15 border-red-700/40 text-red-300' : 'bg-red-50 border-red-200/60 text-red-600'
                }`}
              >
                <div className="p-1 rounded-full bg-red-500/10"><X size={12} className="text-red-500" /></div>
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className={`mb-4 p-3.5 rounded-xl border text-sm flex items-center gap-2.5 ${
                  isDarkMode ? 'bg-green-900/15 border-green-700/40 text-green-300' : 'bg-green-50 border-green-200/60 text-green-600'
                }`}
              >
                <div className="p-1 rounded-full bg-green-500/10"><Check size={12} className="text-green-500" /></div>
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Form Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className={`mb-5 rounded-2xl shadow-lg border overflow-hidden ${
              isDarkMode
                ? 'bg-slate-800/80 border-slate-700/50 backdrop-blur-sm'
                : 'bg-white/90 border-slate-200/40 backdrop-blur-sm'
            }`}
          >
            <form onSubmit={handleSubmit}>
              {/* Form body — 3 per row */}
              <div className="p-5 space-y-4">

                {/* Row 1: Logo + College Name + Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                  {/* Logo */}
                  <div>
                    <label className={`flex items-center gap-1.5 text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <ImageIcon size={13} className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} />
                      College Logo
                    </label>
                    <label className={`cursor-pointer flex items-center gap-3 rounded-lg border p-2.5 transition-all duration-200 group
                      ${logoPreview
                        ? isDarkMode ? 'border-purple-500/30 bg-purple-500/5' : 'border-purple-200/60 bg-purple-50/30'
                        : isDarkMode ? 'border-slate-600/40 bg-slate-900/50 hover:border-purple-500/30' : 'border-slate-200/80 bg-slate-50/80 hover:border-purple-300'
                      }`}
                    >
                      <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                      {logoPreview ? (
                        <>
                          <img src={logoPreview} alt="Logo" className={`h-8 w-8 object-contain rounded-lg border ${isDarkMode ? 'border-slate-600 bg-slate-700/50' : 'border-slate-200 bg-white'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                              {logoFile ? logoFile.name : 'Current logo'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLogoFile(null); setLogoPreview(null); }}
                            className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}
                          >
                            <X size={13} />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-700/50 group-hover:bg-purple-500/10' : 'bg-slate-100 group-hover:bg-purple-50'}`}>
                            <Upload size={14} className={`transition-colors ${isDarkMode ? 'text-slate-500 group-hover:text-purple-400' : 'text-slate-400 group-hover:text-purple-500'}`} />
                          </div>
                          <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Upload logo</span>
                        </>
                      )}
                    </label>
                  </div>

                  <FormField
                    icon={Building2}
                    label="College Name"
                    placeholder="e.g. Indian Institute of Technology"
                    name="college_name"
                    value={form.college_name}
                    onChange={handleChange}
                    isDarkMode={isDarkMode}
                    required
                  />

                  <FormField
                    icon={MapPin}
                    label="Location"
                    placeholder="City, State"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    isDarkMode={isDarkMode}
                  />
                </div>

                {/* Row 2: Ownership + Contact + Established */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                  <FormDropdown
                    icon={Shield}
                    label="Ownership Type"
                    placeholder="Select type"
                    options={OWNERSHIP_OPTIONS}
                    name="ownership"
                    value={form.ownership}
                    onChange={handleChange}
                    isDarkMode={isDarkMode}
                  />

                  <FormField
                    icon={Phone}
                    label="Coordinator Contact"
                    placeholder="+91 98765 43210"
                    name="coordinator_contact"
                    value={form.coordinator_contact}
                    onChange={handleChange}
                    isDarkMode={isDarkMode}
                  />

                  <div>
                    <label className={`flex items-center gap-1.5 text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <CalendarDays size={13} className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} />
                      Established
                    </label>
                    <input
                      type="date"
                      name="established"
                      value={form.established}
                      onChange={handleChange}
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all duration-200 outline-none
                        ${isDarkMode
                          ? 'bg-slate-900/50 border-slate-600/40 text-slate-200 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15'
                          : 'bg-slate-50/80 border-slate-200/80 text-slate-800 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10'
                        }`}
                    />
                  </div>
                </div>

                {/* Row 3: NIRF + Website + MoU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                  <FormField
                    icon={Hash}
                    label="NIRF Ranking"
                    placeholder="e.g. 25"
                    name="nirf_ranking"
                    value={form.nirf_ranking}
                    onChange={handleChange}
                    isDarkMode={isDarkMode}
                  />

                  <FormField
                    icon={Globe}
                    label="Website"
                    placeholder="https://example.edu"
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    isDarkMode={isDarkMode}
                  />

                  {/* MoU Toggle */}
                  <div>
                    <label className={`flex items-center gap-1.5 text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <FileCheck size={13} className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} />
                      MoU Status
                    </label>
                    <div
                      onClick={() => handleChange({ target: { name: 'mou_completed', type: 'checkbox', checked: !form.mou_completed } })}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border cursor-pointer transition-all duration-200 ${
                        form.mou_completed
                          ? isDarkMode
                            ? 'bg-green-500/8 border-green-500/25'
                            : 'bg-green-50/60 border-green-200/80'
                          : isDarkMode
                            ? 'bg-slate-900/50 border-slate-600/40 hover:border-slate-500'
                            : 'bg-slate-50/80 border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <span className={`text-sm whitespace-nowrap ${form.mou_completed ? (isDarkMode ? 'text-green-300' : 'text-green-700') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`}>
                        {form.mou_completed ? 'Completed' : 'Pending'}
                      </span>
                      <div className={`relative w-10 rounded-full transition-colors duration-200 ${
                        form.mou_completed ? 'bg-green-500' : isDarkMode ? 'bg-slate-600' : 'bg-slate-300'
                      }`} style={{ height: '22px' }}>
                        <motion.div
                          className="absolute top-0.5 w-[18px] h-[18px] bg-white rounded-full shadow-sm"
                          animate={{ left: form.mou_completed ? '20px' : '2px' }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Form Footer — Submit */}
              <div className={`px-6 py-4 border-t flex items-center justify-between ${isDarkMode ? 'border-slate-700/40 bg-slate-800/40' : 'border-slate-100 bg-slate-50/50'}`}>
                <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span className="text-red-400">*</span> Required field
                </p>
                <div className="flex items-center gap-3">
                  {editingId && (
                    <motion.button
                      type="button"
                      onClick={resetForm}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border flex items-center gap-2
                        ${isDarkMode
                          ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/70 border-slate-600/50'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                        }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <X size={15} />
                      Cancel
                    </motion.button>
                  )}
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 flex items-center gap-2 shadow-md
                      ${submitting
                        ? 'bg-purple-400/80 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg hover:shadow-purple-500/20'
                      }`}
                    whileHover={!submitting ? { scale: 1.02 } : {}}
                    whileTap={!submitting ? { scale: 0.98 } : {}}
                  >
                    {submitting ? (
                      <><Loader2 size={15} className="animate-spin" />{editingId ? 'Updating...' : 'Adding...'}</>
                    ) : (
                      <>{editingId ? <Edit3 size={15} /> : <Plus size={15} />}{editingId ? 'Update College' : 'Add College'}</>
                    )}
                  </motion.button>
                </div>
              </div>
            </form>
          </motion.div>

          {/* ── Colleges Table ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className={`rounded-2xl shadow-lg border overflow-hidden ${
              isDarkMode
                ? 'bg-slate-800/80 border-slate-700/50 backdrop-blur-sm'
                : 'bg-white/90 border-slate-200/40 backdrop-blur-sm'
            }`}
          >
            {/* Table Header */}
            <div className={`px-5 py-3.5 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-700/40' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                  <Building2 size={16} className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'} />
                </div>
                <h2 className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  Registered Colleges
                </h2>
                <span className={`text-xs px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                  {filteredColleges.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                <input
                  type="text"
                  placeholder="Search colleges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-8 pr-8 py-1.5 rounded-lg border text-sm w-48 transition-all duration-200 outline-none
                    ${isDarkMode
                      ? 'bg-slate-900/50 border-slate-600/40 text-slate-200 placeholder-slate-600 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15'
                      : 'bg-slate-50/80 border-slate-200/80 text-slate-800 placeholder-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10'
                    }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors ${isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              {/* Pagination */}
              {totalPages > 1 ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`p-1 rounded-md transition-all duration-150 ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : isDarkMode ? 'hover:bg-slate-700/50 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-6 h-6 rounded-md text-xs font-semibold transition-all duration-150 ${
                        page === currentPage
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                          : isDarkMode ? 'text-slate-400 hover:bg-slate-700/50' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-1 rounded-md transition-all duration-150 ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : isDarkMode ? 'hover:bg-slate-700/50 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              ) : <div />}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDarkMode ? 'bg-slate-800/30' : 'bg-slate-50/60'}>
                    <th className={`px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>#</th>
                    <th className={`px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Logo</th>
                    <th className={`px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>College Name</th>
                    <th className={`px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Location</th>
                    <th className={`px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Ownership</th>
                    <th className={`px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Website</th>
                    <th className={`px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/25' : 'divide-slate-100/80'}`}>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-14">
                        <Loader2 size={24} className={`animate-spin mx-auto ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                        <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading...</p>
                      </td>
                    </tr>
                  ) : filteredColleges.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-14">
                        <div className={`inline-flex p-3.5 rounded-xl mb-2 ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100/80'}`}>
                          <Building2 size={28} className={isDarkMode ? 'text-slate-600' : 'text-slate-300'} />
                        </div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {searchQuery ? 'No matches found' : 'No colleges yet'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedColleges.map((college, idx) => {
                      const index = (currentPage - 1) * PAGE_SIZE + idx;
                      const extraData = {};
                      if (college.area_of_expertise) {
                        college.area_of_expertise.split('|').forEach(part => {
                          const [key, val] = part.split(':');
                          if (key && val) extraData[key] = val;
                        });
                      }
                      const isEditing = editingId === college.college_id;
                      return (
                        <motion.tr
                          key={college.college_id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className={`group transition-all duration-150 ${
                            isEditing
                              ? isDarkMode ? 'bg-purple-500/5' : 'bg-purple-50/30'
                              : isDarkMode ? 'hover:bg-slate-700/20' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className={`px-5 py-3 text-sm tabular-nums ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{index + 1}</td>
                          <td className="px-5 py-3">
                            {college.logo ? (
                              <img src={college.logo} alt="" className={`w-9 h-9 rounded-lg object-contain border ${isDarkMode ? 'border-slate-600/40 bg-slate-700/30' : 'border-slate-200 bg-white'}`} />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {college.college_name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                              {college.college_name}
                            </span>
                          </td>
                          <td className={`px-5 py-3 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {college.location || '—'}
                          </td>
                          <td className="px-5 py-3">
                            {(college.ownership_type || (college.infrastructure && OWNERSHIP_OPTIONS.includes(college.infrastructure))) ? (
                              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                isDarkMode ? 'bg-slate-700/40 text-slate-300' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {college.ownership_type || college.infrastructure}
                              </span>
                            ) : (
                              <span className={`text-sm ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-center">
                            {extraData.website ? (
                              <a
                                href={extraData.website.startsWith('http') ? extraData.website : `https://${extraData.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 group/link ${
                                  isDarkMode
                                    ? 'text-purple-400 hover:bg-purple-500/10 hover:text-purple-300'
                                    : 'text-purple-600 hover:bg-purple-50 hover:text-purple-700'
                                }`}
                                title={extraData.website}
                              >
                                <Globe size={13} className="shrink-0" />
                                <span className="hidden xl:inline truncate max-w-[120px]">Visit</span>
                                <ExternalLink size={10} className="shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                              </a>
                            ) : (
                              <span className={`text-sm ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>—</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <motion.button
                                onClick={() => handleEdit(college)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                  isEditing
                                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow shadow-purple-500/20'
                                    : isDarkMode
                                      ? 'text-slate-400 hover:bg-purple-500/15 hover:text-purple-300'
                                      : 'text-slate-500 hover:bg-purple-50 hover:text-purple-600'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {isEditing ? <span className="flex items-center gap-1"><Edit3 size={11} /> Editing</span> : 'Edit'}
                              </motion.button>
                              <motion.button
                                onClick={() => handleDelete(college.college_id)}
                                className={`p-1.5 rounded-lg transition-all duration-200 ${
                                  isDarkMode
                                    ? 'text-slate-500 hover:bg-red-500/10 hover:text-red-400'
                                    : 'text-slate-400 hover:bg-red-50 hover:text-red-500'
                                }`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            {filteredColleges.length > 0 && (
              <div className={`px-5 py-2.5 border-t flex items-center justify-between text-xs ${isDarkMode ? 'border-slate-700/30 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                <span>
                  {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredColleges.length)} of {filteredColleges.length} college{filteredColleges.length !== 1 ? 's' : ''}
                </span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`flex items-center gap-1 text-xs font-medium transition-colors ${isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-500 hover:text-purple-600'}`}
                  >
                    <X size={11} /> Clear
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AddCollege;
