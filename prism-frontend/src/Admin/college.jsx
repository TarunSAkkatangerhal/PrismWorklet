import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AdminLeftSidebar } from './AdminSidebar';
import { ThemeContext } from '../context/ThemeContext';
import API from '../api';
import {
  Building2, MapPin, Globe, ChevronDown, CalendarDays, Phone, Award,
  FileCheck, Upload, Trash2, Edit3, Home, ChevronRight, Plus, Loader2,
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
            ? 'bg-slate-800/60 border-slate-600 text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
            : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
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
              ? 'bg-slate-800/60 border-slate-600 text-slate-200 focus:border-blue-500'
              : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
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
                        ? isDarkMode ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-100 text-blue-700'
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
    });
    setLogoFile(null);
    setLogoPreview(null);
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
      };

      await API.post('/colleges', payload);
      setSuccess('College added successfully!');
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
      fetchColleges();
    } catch (err) {
      setError('Failed to delete college.');
    }
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
      <AdminLeftSidebar />

      <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        <div className="p-4 pl-6 max-w-none mx-0">

          {/* Breadcrumb */}
          <div className="flex items-center justify-between mb-4">
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              Add College
            </h1>
            <nav className="flex items-center gap-1.5 text-sm">
              <button onClick={() => navigate('/admin-dashboard')} className={`flex items-center gap-1 hover:underline ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
                <Home size={14} /> Home
              </button>
              <ChevronRight size={12} className={isDarkMode ? 'text-slate-600' : 'text-slate-400'} />
              <button onClick={() => navigate('/admin-colleges')} className={`hover:underline ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
                College
              </button>
              <ChevronRight size={12} className={isDarkMode ? 'text-slate-600' : 'text-slate-400'} />
              <span className={isDarkMode ? 'text-blue-400 font-medium' : 'text-blue-600 font-medium'}>Add College</span>
            </nav>
          </div>

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-sm"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 text-sm"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content: Form + Table side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* ─── Left: Add College Form ─── */}
            <div className="lg:col-span-2">
              <div className={`rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                <form onSubmit={handleSubmit} className="p-5">

                  {/* College Logo Upload */}
                  <div className="mb-5">
                    <label className={`block text-sm font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      College Logo:
                    </label>
                    <div className="flex items-center gap-3">
                      <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200
                        ${isDarkMode
                          ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600'
                          : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
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
                            ? 'bg-slate-800/60 border-slate-600 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
                            : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
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
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      College MoU has been completed
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200
                      ${submitting
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow'
                      }`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Add College
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* ─── Right: Colleges Table ─── */}
            <div className="lg:col-span-3">
              <div className={`rounded-xl border shadow-sm overflow-hidden ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={isDarkMode ? 'bg-slate-700/60' : 'bg-slate-50'}>
                        <th className={`px-4 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>#</th>
                        <th className={`px-4 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>College Logo</th>
                        <th className={`px-4 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>College Name</th>
                        <th className={`px-4 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>College Location</th>
                        <th className={`px-4 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Ownership</th>
                        <th className={`px-4 py-3 text-center font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
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
                          // Parse extra data from area_of_expertise if stored there
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
                              className={`border-t transition-colors ${
                                isDarkMode
                                  ? 'border-slate-700 hover:bg-slate-700/40'
                                  : 'border-slate-100 hover:bg-slate-50'
                              }`}
                            >
                              <td className={`px-4 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{index + 1}</td>
                              <td className="px-4 py-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                  <ImageIcon size={18} className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} />
                                </div>
                              </td>
                              <td className={`px-4 py-3 font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                {college.college_name}
                              </td>
                              <td className={`px-4 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                {college.location || '—'}
                              </td>
                              <td className={`px-4 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                {college.infrastructure || '—'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => navigate(`/admin-college/${college.college_id}`)}
                                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                                    title="Edit"
                                  >
                                    <Edit3 size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(college.college_id)}
                                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={15} />
                                  </button>
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
                  <div className={`px-4 py-3 border-t text-xs ${isDarkMode ? 'border-slate-700 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                    Showing {colleges.length} college{colleges.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddCollege;
