import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AdminLeftSidebar } from './AdminSidebar';
import { ThemeContext } from '../context/ThemeContext';
import API from '../api';
import {
  Search, Building2, Loader2, FileCheck, Plus,
  Pencil, X, Upload, Download, Trash2, File, Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Date formatter ───────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '';
  try { return new Date(d).toISOString().split('T')[0]; } catch { return ''; }
};

const fmtDisplay = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return '—'; }
};


// ─── Edit Modal ───────────────────────────────────────────────────────
const EditModal = ({ college, onSave, onClose, isDarkMode }) => {
  const [form, setForm] = useState({
    active: college.mou_active ?? false,
    mou_start: fmtDate(college.mou_start) || '',
    mou_end: fmtDate(college.mou_end) || '',
    poc: college.poc || '',
    attachments: college.mou_attachments || [],
  });
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleFileRead = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setForm(f => ({ ...f, attachments: [...f.attachments, { name: file.name, data: e.target.result }] }));
    };
    reader.readAsDataURL(file);
  };

  const handleFilesRead = (files) => {
    Array.from(files).forEach(file => handleFileRead(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFilesRead(e.dataTransfer.files);
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); };

  const handleRemoveFile = (index) => {
    setForm(f => ({ ...f, attachments: f.attachments.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(college.college_id, form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`w-full max-w-lg rounded-2xl shadow-2xl p-6 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            Edit MOU — {college.college_name}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X size={18} className={isDarkMode ? 'text-slate-400' : 'text-slate-500'} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Active Status</label>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, active: !f.active }))}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${form.active ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          {/* MOU Start */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>MOU Start Date</label>
            <input
              type="date"
              value={form.mou_start}
              onChange={e => setForm(f => ({ ...f, mou_start: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all ${
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-slate-200 focus:border-purple-500'
                  : 'bg-white border-slate-300 text-slate-800 focus:border-purple-500'
              }`}
            />
          </div>

          {/* MOU End */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>MOU End Date</label>
            <input
              type="date"
              value={form.mou_end}
              onChange={e => setForm(f => ({ ...f, mou_end: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all ${
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-slate-200 focus:border-purple-500'
                  : 'bg-white border-slate-300 text-slate-800 focus:border-purple-500'
              }`}
            />
          </div>

          {/* POC */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Point of Contact (POC)</label>
            <input
              type="text"
              placeholder="e.g. Dr. Smith — dean@college.edu"
              value={form.poc}
              onChange={e => setForm(f => ({ ...f, poc: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all ${
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-500 focus:border-purple-500'
                  : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500'
              }`}
            />
          </div>

          {/* Attachments Upload (Multiple) */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Attachments</label>

            {/* Existing files */}
            {form.attachments.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {form.attachments.map((att, i) => (
                  <div key={i} className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border ${
                    isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <File size={14} className="text-purple-500 flex-shrink-0" />
                      <span className={`text-sm truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        {att.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {att.data && (
                        <a
                          href={att.data}
                          download={att.name}
                          className="p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-500 transition-colors"
                          title="Download"
                        >
                          <Download size={13} />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(i)}
                        className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Drop zone — always visible so user can add more */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-all ${
                dragActive
                  ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20'
                  : isDarkMode
                    ? 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                    : 'border-slate-300 hover:border-slate-400 bg-white'
              }`}
            >
              <Upload size={18} className={`mx-auto mb-1.5 ${
                dragActive ? 'text-purple-500' : isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`} />
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="font-medium text-purple-500">Click to upload</span> or drag & drop
              </p>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>PDF, DOC, DOCX, images — max 10 MB each</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx"
                multiple
                className="hidden"
                onChange={(e) => { handleFilesRead(e.target.files); e.target.value = ''; }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── MOU Details Page ─────────────────────────────────────────────────
const MOUDetails = () => {
  useDocumentTitle('PRISM Admin - MOU Details');
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);

  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [editingCollege, setEditingCollege] = useState(null);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const res = await API.get('/colleges');
      setColleges(res.data || []);
    } catch (err) {
      console.error('Failed to fetch colleges:', err);
      setError('Failed to load colleges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const handleSaveMOU = async (collegeId, formData) => {
    try {
      await API.patch(`/colleges/${collegeId}/mou`, {
        poc: formData.poc || null,
        mou_start: formData.mou_start || null,
        mou_end: formData.mou_end || null,
        mou_active: formData.active,
        mou_attachments: formData.attachments.length > 0 ? formData.attachments : null,
      });
      await fetchColleges();
      setEditingCollege(null);
    } catch (err) {
      console.error('Failed to save MOU:', err);
      setError('Failed to save MOU details');
    }
  };

  const filtered = useMemo(() => {
    const sorted = [...colleges].sort((a, b) => (a.college_name || '').localeCompare(b.college_name || ''));
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(c =>
      (c.college_name || '').toLowerCase().includes(q) ||
      (c.poc || '').toLowerCase().includes(q)
    );
  }, [colleges, search]);

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
        <AdminLeftSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={32} className="animate-spin mx-auto mb-4 text-slate-500" />
            <p className="text-slate-600 dark:text-slate-400">Loading MOU details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen font-sans ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <AdminLeftSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-none mx-0 p-4 pl-6">

          {/* Header Section */}
          <div className={`${
            isDarkMode
              ? 'bg-gradient-to-r from-slate-800/80 via-slate-700/50 to-slate-800/80 backdrop-blur-sm border-slate-700/50'
              : 'bg-gradient-to-r from-white/80 via-purple-50/50 to-indigo-50/30 backdrop-blur-sm border-purple-200/30'
          } rounded-2xl shadow-lg border p-4 mb-4`}>

            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-4xl font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  MOU Details
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Manage MOU agreements and partnerships with colleges
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {colleges.length}
                  </div>
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total</div>
                </div>
                <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {colleges.filter(c => c.mou_active).length}
                  </div>
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Active</div>
                </div>
                <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    {colleges.filter(c => c.mou_attachments?.length > 0).length}
                  </div>
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>With MOU</div>
                </div>
              </div>
            </div>

            {error && (
              <div className={`mt-4 p-3 rounded-lg border ${
                isDarkMode ? 'bg-red-900/20 border-red-700/50 text-red-300' : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                {error}
              </div>
            )}
          </div>

          {/* Search and Navigation */}
          <div className={`flex items-center gap-3 mb-6 p-4 rounded-lg ${
            isDarkMode ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white/60 border-slate-200/50'
          } border shadow-sm`}>

            <div className="relative flex-1">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search by college name or POC..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full pl-12 pr-4 py-2.5 rounded-xl border transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-slate-800/50 border-gray-700/30 text-white placeholder-gray-400/60 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20'
                    : 'bg-white/70 border-gray-300/40 text-slate-800 placeholder-gray-500/60 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20'
                } backdrop-blur-sm`}
              />
            </div>

            <motion.button
              onClick={() => navigate('/admin-colleges')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-700/50 text-gray-300 border border-gray-700/30 hover:text-white'
                  : 'bg-white/60 text-gray-700 border border-gray-300/40 hover:text-gray-800'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Building2 size={16} />
              <span className="whitespace-nowrap">All Colleges</span>
            </motion.button>
            <motion.button
              onClick={() => navigate('/admin-add-college')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-700/50 text-gray-300 border border-gray-700/30 hover:text-white'
                  : 'bg-white/60 text-gray-700 border border-gray-300/40 hover:text-gray-800'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={16} />
              <span className="whitespace-nowrap">Add College</span>
            </motion.button>
            <motion.button
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg border border-purple-500/50'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg border border-purple-400/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FileCheck size={16} />
              <span className="whitespace-nowrap">MOU Details</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-white/20 text-white">
                {colleges.length}
              </span>
            </motion.button>
          </div>

          {/* MOU Table */}
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
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">College Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">MOU Start</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">MOU End</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">POC</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Attachments</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-600/50">
                    {filtered.map((college, idx) => {
                      const attachments = college.mou_attachments || [];

                      return (
                        <tr
                          key={college.college_id}
                          className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-slate-700/50 dark:hover:to-slate-600/50 transition-all duration-300"
                        >
                          {/* College Name */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                                {(college.college_name || 'C').charAt(0).toUpperCase()}
                              </div>
                              <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                {college.college_name}
                              </span>
                            </div>
                          </td>

                          {/* MOU Start */}
                          <td className="px-6 py-4">
                            <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              {fmtDisplay(college.mou_start)}
                            </span>
                          </td>

                          {/* MOU End */}
                          <td className="px-6 py-4">
                            <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              {fmtDisplay(college.mou_end)}
                            </span>
                          </td>

                          {/* POC */}
                          <td className="px-6 py-4">
                            <span className={`text-sm ${college.poc ? (isDarkMode ? 'text-slate-300' : 'text-slate-700') : (isDarkMode ? 'text-slate-500' : 'text-slate-400')}`}>
                              {college.poc || '—'}
                            </span>
                          </td>

                          {/* Attachments */}
                          <td className="px-6 py-4">
                            {attachments.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {attachments.map((att, i) => (
                                  att.data ? (
                                    <a
                                      key={i}
                                      href={att.data}
                                      download={att.name}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                      title={att.name}
                                    >
                                      <Download size={11} />
                                      {att.name.length > 15 ? att.name.slice(0, 15) + '...' : att.name}
                                    </a>
                                  ) : (
                                    <span
                                      key={i}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                                    >
                                      <Paperclip size={11} />
                                      {att.name.length > 15 ? att.name.slice(0, 15) + '...' : att.name}
                                    </span>
                                  )
                                ))}
                              </div>
                            ) : (
                              <span className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>—</span>
                            )}
                          </td>

                          {/* Edit */}
                          <td className="px-6 py-4 text-center">
                            <motion.button
                              onClick={() => setEditingCollege(college)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDarkMode
                                  ? 'hover:bg-slate-700 text-slate-400 hover:text-purple-400'
                                  : 'hover:bg-purple-50 text-slate-500 hover:text-purple-600'
                              }`}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Pencil size={16} />
                            </motion.button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Empty State */}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <div className="relative mx-auto mb-8">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 
                                rounded-3xl flex items-center justify-center shadow-2xl">
                    <FileCheck className="w-12 h-12 text-blue-500" />
                  </div>
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  No colleges found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg mb-6 max-w-md mx-auto">
                  {search.trim() ? 'Try adjusting your search criteria.' : 'Add colleges first to manage MOU details.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingCollege && (
          <EditModal
            college={editingCollege}
            onSave={handleSaveMOU}
            onClose={() => setEditingCollege(null)}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MOUDetails;
