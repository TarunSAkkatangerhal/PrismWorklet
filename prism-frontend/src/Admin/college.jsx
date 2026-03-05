import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AdminLeftSidebar } from './AdminSidebar';
import { ThemeContext } from '../context/ThemeContext';
import API from '../api';
import {
  Building2, MapPin, Globe, ChevronDown, CalendarDays, Phone, Award,
  ArrowLeft, Upload, Trash2, Edit3, Home, ChevronRight, Plus, Loader2,
  Image as ImageIcon
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

// ─── Input Field Component ────────────────────────────────────────────
const FormInput = ({ icon: Icon, label, placeholder, type = 'text', value, onChange, name, isDarkMode, required = false }) => (
  <div className="mb-4">
    <label className={`block text-sm font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      <div className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        <Icon size={16} />
      </div>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm transition-all duration-200 outline-none
          ${isDarkMode
            ? 'bg-slate-800/60 border-slate-600 text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30'
            : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30'
          }`}
      />
    </div>
  </div>
);

// ─── Select Dropdown Component ────────────────────────────────────────
const FormSelect = ({ icon: Icon, label, placeholder, options, value, onChange, name, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4">
      <label className={`block text-sm font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
        {label}:
      </label>
      <div className="relative">
        <div className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <Icon size={16} />
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full pl-10 pr-8 py-2.5 rounded-lg border text-sm text-left transition-all duration-200 outline-none
            ${isDarkMode
              ? 'bg-slate-800/60 border-slate-600 text-slate-200 focus:border-purple-500'
              : 'bg-white border-slate-300 text-slate-800 focus:border-purple-500'
            }
            ${!value ? (isDarkMode ? 'text-slate-500' : 'text-slate-400') : ''}`}
        >
          {value || placeholder}
        </button>
        <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${isOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />

        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`absolute top-full left-0 mt-1 w-full z-20 rounded-lg border shadow-lg overflow-hidden ${
                  isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'
                }`}
              >
                {options.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => { onChange({ target: { name, value: opt } }); setIsOpen(false); }}
                    className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                      value === opt
                        ? isDarkMode ? 'bg-purple-600/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                        : isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
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
      ownership: college.infrastructure || '',
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

  return (
    <div className={`flex h-screen font-sans ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <AdminLeftSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-none mx-0 p-4 pl-6">

          {/* ── Header Section (matches AllColleges) ── */}
          <div className={`${
            isDarkMode
              ? 'bg-gradient-to-r from-slate-800/80 via-slate-700/50 to-slate-800/80 backdrop-blur-sm border-slate-700/50'
              : 'bg-gradient-to-r from-white/80 via-purple-50/50 to-indigo-50/30 backdrop-blur-sm border-purple-200/30'
          } rounded-2xl shadow-lg border p-4 mb-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={() => navigate('/admin-colleges')}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    isDarkMode
                      ? 'hover:bg-slate-700/50 text-slate-400 hover:text-white'
                      : 'hover:bg-white/60 text-slate-500 hover:text-slate-800'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft size={22} />
                </motion.button>
                <div>
                <h1 className={`text-4xl font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {editingId ? 'Edit College' : 'Add College'}
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {editingId ? 'Update college details and save changes' : 'Register a new college and manage existing partnerships'}
                </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {colleges.length}
                  </div>
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total</div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className={`mt-4 p-3 rounded-lg border text-sm ${
                    isDarkMode ? 'bg-red-900/20 border-red-700/50 text-red-300' : 'bg-red-50 border-red-200 text-red-600'
                  }`}
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className={`mt-4 p-3 rounded-lg border text-sm ${
                    isDarkMode ? 'bg-green-900/20 border-green-700/50 text-green-300' : 'bg-green-50 border-green-200 text-green-600'
                  }`}
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Content: Form + Table ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* ─── Left: Add College Form ─── */}
            <div className="lg:col-span-2">
              <div className={`${
                isDarkMode
                  ? 'bg-gradient-to-br from-slate-800/80 via-slate-700/50 to-slate-800/80 backdrop-blur-sm border-slate-700/50'
                  : 'bg-gradient-to-br from-white/80 via-purple-50/30 to-indigo-50/20 backdrop-blur-sm border-purple-200/30'
              } rounded-2xl shadow-lg border`}>
                <form onSubmit={handleSubmit} className="p-5">

                  {/* College Logo Upload */}
                  <div className="mb-5">
                    <label className={`block text-sm font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      College Logo:
                    </label>
                    <div className="flex items-center gap-3">
                      <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200
                        ${isDarkMode
                          ? 'bg-slate-700/50 border-slate-600 text-slate-200 hover:bg-slate-600/70'
                          : 'bg-white/70 border-slate-300/50 text-slate-700 hover:bg-slate-50'
                        }`}>
                        <Upload size={14} />
                        Choose File
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                      </label>
                      <span className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {logoFile ? logoFile.name : 'No file chosen'}
                      </span>
                    </div>
                    {logoPreview && (
                      <div className="mt-2">
                        <img src={logoPreview} alt="Logo preview" className="h-16 w-16 object-contain rounded-lg border border-slate-300 dark:border-slate-600" />
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <FormInput
                    icon={Building2}
                    label="Name:"
                    placeholder="Enter College Name"
                    name="college_name"
                    value={form.college_name}
                    onChange={handleChange}
                    isDarkMode={isDarkMode}
                    required
                  />

                  {/* Address */}
                  <FormInput
                    icon={MapPin}
                    label="Address:"
                    placeholder="Enter College Address"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    isDarkMode={isDarkMode}
                  />

                  {/* College Website */}
                  <FormInput
                    icon={Globe}
                    label="College Website:"
                    placeholder="Enter College Website"
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    isDarkMode={isDarkMode}
                  />

                  {/* College Ownership */}
                  <FormSelect
                    icon={Building2}
                    label="College Ownership"
                    placeholder="Select Ownership"
                    options={OWNERSHIP_OPTIONS}
                    name="ownership"
                    value={form.ownership}
                    onChange={handleChange}
                    isDarkMode={isDarkMode}
                  />

                  {/* Establishment Date */}
                  <div className="mb-4">
                    <label className={`block text-sm font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Establishment date:
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="established"
                        value={form.established}
                        onChange={handleChange}
                        placeholder="Enter College Establishment Date *"
                        className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-all duration-200 outline-none
                          ${isDarkMode
                            ? 'bg-slate-800/60 border-slate-600 text-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30'
                            : 'bg-white border-slate-300 text-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30'
                          }`}
                      />
                    </div>
                  </div>

                  {/* Coordinator Contact Number */}
                  <FormInput
                    icon={Phone}
                    label="Cordinator Contact number:"
                    placeholder="Enter Cordinator Contact number"
                    name="coordinator_contact"
                    value={form.coordinator_contact}
                    onChange={handleChange}
                    isDarkMode={isDarkMode}
                  />

                  {/* NIRF Ranking */}
                  <FormInput
                    icon={Award}
                    label="NIRF Ranking:"
                    placeholder="Enter NIRF Ranking"
                    name="nirf_ranking"
                    value={form.nirf_ranking}
                    onChange={handleChange}
                    isDarkMode={isDarkMode}
                  />

                  {/* MoU Checkbox */}
                  <div className="mb-5">
                    <label className={`flex items-center gap-2 cursor-pointer text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      <input
                        type="checkbox"
                        name="mou_completed"
                        checked={form.mou_completed}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      College MoU has been completed
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3">
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                          ${isDarkMode
                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200
                        ${submitting
                          ? 'bg-purple-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:shadow-lg hover:shadow-purple-500/25 active:scale-[0.98]'
                        }`}
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          {editingId ? 'Updating...' : 'Adding...'}
                        </>
                      ) : (
                        <>
                          {editingId ? <Edit3 size={16} /> : <Plus size={16} />}
                          {editingId ? 'Update College' : 'Add College'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* ─── Right: Colleges Table ─── */}
            <div className="lg:col-span-3">
              <div className={`${
                isDarkMode
                  ? 'bg-gradient-to-br from-slate-800/80 via-slate-700/50 to-slate-800/80 backdrop-blur-sm border-slate-700/50'
                  : 'bg-gradient-to-br from-white/80 via-purple-50/30 to-indigo-50/20 backdrop-blur-sm border-purple-200/30'
              } rounded-2xl shadow-lg border overflow-hidden`}>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                          <th className="px-5 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">#</th>
                          <th className="px-5 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">College Logo</th>
                          <th className="px-5 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">College Name</th>
                          <th className="px-5 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Location</th>
                          <th className="px-5 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Ownership</th>
                          <th className="px-5 py-4 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50 dark:divide-slate-600/50">
                        {loading ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12">
                              <Loader2 size={24} className={`animate-spin mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                              <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Loading colleges...</p>
                            </td>
                          </tr>
                        ) : colleges.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12">
                              <Building2 size={32} className={`mx-auto mb-2 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                              <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No colleges added yet</p>
                            </td>
                          </tr>
                        ) : (
                          colleges.map((college, index) => {
                            const extraData = {};
                            if (college.area_of_expertise) {
                              college.area_of_expertise.split('|').forEach(part => {
                                const [key, val] = part.split(':');
                                if (key && val) extraData[key] = val;
                              });
                            }
                            return (
                              <tr
                                key={college.college_id}
                                className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-slate-700/50 dark:hover:to-slate-600/50 transition-all duration-300"
                              >
                                <td className={`px-5 py-3.5 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{index + 1}</td>
                                <td className="px-5 py-3.5">
                                  {college.logo ? (
                                    <img src={college.logo} alt="Logo" className="w-10 h-10 rounded-lg object-contain border border-slate-200 dark:border-slate-600" />
                                  ) : (
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                      <ImageIcon size={18} className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} />
                                    </div>
                                  )}
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                    {college.college_name}
                                  </span>
                                </td>
                                <td className={`px-5 py-3.5 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {college.location || '—'}
                                </td>
                                <td className={`px-5 py-3.5 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {college.infrastructure || '—'}
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center justify-center gap-2">
                                    <motion.button
                                      onClick={() => handleEdit(college)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                        editingId === college.college_id
                                          ? 'bg-purple-500 text-white'
                                          : isDarkMode
                                            ? 'bg-slate-700 text-slate-300 hover:bg-purple-600/30 hover:text-purple-300'
                                            : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-600'
                                      }`}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      {editingId === college.college_id ? 'Editing...' : 'Edit'}
                                    </motion.button>
                                    <motion.button
                                      onClick={() => handleDelete(college.college_id)}
                                      className={`p-2 rounded-lg transition-colors ${
                                        isDarkMode
                                          ? 'hover:bg-red-900/30 text-slate-400 hover:text-red-400'
                                          : 'hover:bg-red-50 text-slate-500 hover:text-red-600'
                                      }`}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      title="Delete"
                                    >
                                      <Trash2 size={15} />
                                    </motion.button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer */}
                  {colleges.length > 0 && (
                    <div className={`px-5 py-3 border-t text-xs ${isDarkMode ? 'border-slate-700 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                      Showing {colleges.length} college{colleges.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddCollege;
