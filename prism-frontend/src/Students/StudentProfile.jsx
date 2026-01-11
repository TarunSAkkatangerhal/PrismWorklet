// Student Profile Page - Comprehensive profile management for students
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, MapPin, Calendar, Award, BookOpen, 
  Edit2, Save, X, Camera, School, Target, TrendingUp,
  Clock, CheckCircle, Trophy, Star, Briefcase, Plus, Download,
  ExternalLink, Upload, FileText, Medal, Shield
} from 'lucide-react';
import LeftSidebar from '../components/Left';
import RightSidebar from '../components/Right';
import { getCurrentUser } from '../services/auth';
import secureAPI from '../services/secureAPI';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import samsungLogo from '../assets/prism_logo.png';

// Helper to get initials from name
const getInitials = (name) => {
  if (!name) return '';
  const nameParts = name.split(' ');
  if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
};

// Helper to generate color from name
const generateColorFromName = (name) => {
  const colors = ['#0077b6', '#0096c7', '#48cae4', '#90e0ef', '#ade8f4'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash % colors.length)];
};

export default function StudentProfile() {
  useDocumentTitle('My Profile - PRISM');
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState({
    totalWorklets: 0,
    completedWorklets: 0,
    ongoingWorklets: 0,
    completionRate: 0
  });

  // Certificates and Badges state
  const [certificates, setCertificates] = useState([
    { id: 1, title: 'JavaScript Fundamentals', issuer: 'FreeCodeCamp', date: '2025-12-15', image: null },
    { id: 2, title: 'React Advanced Concepts', issuer: 'Udemy', date: '2026-01-05', image: null },
  ]);
  const [badges, setBadges] = useState([
    { id: 1, name: 'Fast Learner', icon: '⚡', color: 'from-yellow-400 to-orange-500' },
    { id: 2, name: 'Team Player', icon: '🤝', color: 'from-blue-400 to-indigo-500' },
    { id: 3, name: 'Perfect Attendance', icon: '✓', color: 'from-green-400 to-teal-500' },
  ]);
  const [showAddCertificate, setShowAddCertificate] = useState(false);
  const [newCertificate, setNewCertificate] = useState({ title: '', issuer: '', date: '' });

  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    department: '',
    year: '',
    bio: '',
    github: '',
    linkedin: '',
    portfolio: ''
  });

  // Load user profile data
  useEffect(() => {
    loadProfileData();
    loadWorkletStats();
  }, []);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      setProfileData(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        college: user.college || '',
        department: user.department || '',
        year: user.year || '',
        bio: user.bio || '',
        github: user.github || '',
        linkedin: user.linkedin || '',
        portfolio: user.portfolio || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkletStats = async () => {
    try {
      const response = await secureAPI.get('/worklets/my-worklets');
      const worklets = response.data;
      const completed = worklets.filter(w => w.status === 'Completed').length;
      const total = worklets.length;
      const ongoing = total - completed;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      setStats({
        totalWorklets: total,
        completedWorklets: completed,
        ongoingWorklets: ongoing,
        completionRate
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await secureAPI.put('/users/profile', formData);
      setProfileData(prev => ({ ...prev, ...formData }));
      setEditMode(false);
      // Show success message
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to original profile data
    setFormData({
      name: profileData?.name || '',
      email: profileData?.email || '',
      phone: profileData?.phone || '',
      college: profileData?.college || '',
      department: profileData?.department || '',
      year: profileData?.year || '',
      bio: profileData?.bio || '',
      github: profileData?.github || '',
      linkedin: profileData?.linkedin || '',
      portfolio: profileData?.portfolio || ''
    });
    setEditMode(false);
  };

  const handleAddCertificate = () => {
    if (newCertificate.title && newCertificate.issuer && newCertificate.date) {
      setCertificates([...certificates, { 
        id: Date.now(), 
        ...newCertificate,
        image: null 
      }]);
      setNewCertificate({ title: '', issuer: '', date: '' });
      setShowAddCertificate(false);
    }
  };

  const handleDeleteCertificate = (id) => {
    setCertificates(certificates.filter(cert => cert.id !== id));
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
        <LeftSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading profile...</p>
          </div>
        </div>
        <RightSidebar />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden">
      <LeftSidebar />

      <main className="flex-1 px-6 py-4 overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-hide">
        {/* Compact Profile Header */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4 flex-1">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {profileData?.avatar_url ? (
                  <img
                    src={profileData.avatar_url}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover shadow-md border-2 border-white dark:border-slate-700"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md border-2 border-white dark:border-slate-700"
                    style={{ backgroundColor: generateColorFromName(profileData?.name || 'Student') }}
                  >
                    {getInitials(profileData?.name || 'Student')}
                  </div>
                )}
                {editMode && (
                  <button className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                    <Camera className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Name & Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white truncate">
                    {profileData?.name || 'Student'}
                  </h1>
                  <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium border border-blue-500/20">
                    {profileData?.role || 'Student'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 mb-2">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{profileData?.email || 'Not set'}</span>
                  </div>
                  {formData.college && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <div className="flex items-center gap-1">
                        <School className="w-3.5 h-3.5" />
                        <span className="truncate">{formData.college}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Quick Stats Inline */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-slate-700 dark:text-slate-300"><span className="font-semibold">{stats.totalWorklets}</span> Worklets</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-slate-700 dark:text-slate-300"><span className="font-semibold">{stats.completedWorklets}</span> Completed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-slate-700 dark:text-slate-300"><span className="font-semibold">{stats.completionRate}%</span> Success</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-md"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 text-sm shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - About & Contact */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Personal Info + About Me - Merged */}
            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-xl p-5 border border-white/20 dark:border-slate-700/50 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Personal Information
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-5">
                {/* Name */}
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Full Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{formData.name || <span className="text-slate-400">Not provided</span>}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Phone Number</label>
                  {editMode ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 1234567890"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{formData.phone || <span className="text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" />Not provided</span>}</p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Department</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      placeholder="e.g., Computer Science"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{formData.department || <span className="text-slate-400">Not provided</span>}</p>
                  )}
                </div>

                {/* Year */}
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Year of Study</label>
                  {editMode ? (
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {formData.year ? `${formData.year}${!isNaN(formData.year) ? (formData.year === '1' ? 'st' : formData.year === '2' ? 'nd' : formData.year === '3' ? 'rd' : 'th') : ''} Year` : <span className="text-slate-400">Not provided</span>}
                    </p>
                  )}
                </div>
              </div>

              {/* Bio Section - Inline */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">About Me</label>
                {editMode ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Tell us about yourself, your interests, goals, and aspirations..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                ) : (
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {formData.bio || <span className="text-slate-400 italic">No bio added. Click edit to add information about yourself.</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Social Links - Compact */}
            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-xl p-5 border border-white/20 dark:border-slate-700/50 shadow-md">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <ExternalLink className="w-4 h-4" />
                Social & Professional Links
              </h3>
              
              <div className="space-y-3">
                {/* GitHub */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-slate-700 dark:text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">GitHub</p>
                    {editMode ? (
                      <input
                        type="url"
                        name="github"
                        value={formData.github}
                        onChange={handleInputChange}
                        placeholder="https://github.com/username"
                        className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-white mt-1"
                      />
                    ) : (
                      <p className="text-sm text-slate-900 dark:text-white truncate">{formData.github || <span className="text-slate-400 text-xs">Not provided</span>}</p>
                    )}
                  </div>
                  {formData.github && !editMode && (
                    <a href={formData.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* LinkedIn */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-slate-700 dark:text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">LinkedIn</p>
                    {editMode ? (
                      <input
                        type="url"
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-white mt-1"
                      />
                    ) : (
                      <p className="text-sm text-slate-900 dark:text-white truncate">{formData.linkedin || <span className="text-slate-400 text-xs">Not provided</span>}</p>
                    )}
                  </div>
                  {formData.linkedin && !editMode && (
                    <a href={formData.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Portfolio */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Portfolio</p>
                    {editMode ? (
                      <input
                        type="url"
                        name="portfolio"
                        value={formData.portfolio}
                        onChange={handleInputChange}
                        placeholder="https://yourportfolio.com"
                        className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-white mt-1"
                      />
                    ) : (
                      <p className="text-sm text-slate-900 dark:text-white truncate">{formData.portfolio || <span className="text-slate-400 text-xs">Not provided</span>}</p>
                    )}
                  </div>
                  {formData.portfolio && !editMode && (
                    <a href={formData.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Achievements & Skills */}
          <div className="space-y-6">
            
            {/* Certificates - Compact */}
            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-xl p-5 border border-white/20 dark:border-slate-700/50 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Certificates
                </h3>
                <button
                  onClick={() => setShowAddCertificate(true)}
                  className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Add Certificate"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add Certificate Form */}
              {showAddCertificate && (
                <div className="mb-3 p-3 bg-blue-50/50 dark:bg-slate-800/50 rounded-lg border border-blue-200/50 dark:border-slate-600/50">
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Certificate Title"
                      value={newCertificate.title}
                      onChange={(e) => setNewCertificate({...newCertificate, title: e.target.value})}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Issuing Organization"
                      value={newCertificate.issuer}
                      onChange={(e) => setNewCertificate({...newCertificate, issuer: e.target.value})}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white text-xs"
                    />
                    <input
                      type="date"
                      value={newCertificate.date}
                      onChange={(e) => setNewCertificate({...newCertificate, date: e.target.value})}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white text-xs"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleAddCertificate}
                        className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddCertificate(false);
                          setNewCertificate({ title: '', issuer: '', date: '' });
                        }}
                        className="flex-1 px-3 py-1.5 bg-slate-500 text-white rounded hover:bg-slate-600 transition-colors text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Certificates List - Compact */}
              <div className="space-y-2">
                {certificates.length > 0 ? (
                  certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="group relative bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-lg p-3 border border-slate-200/50 dark:border-slate-600/50 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-lg bg-yellow-500/10 dark:bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                          <Medal className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-0.5 truncate">
                            {cert.title}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                            {cert.issuer}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                            {new Date(cert.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteCertificate(cert.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                    <Award className="w-8 h-8 mx-auto mb-1.5 opacity-20" />
                    <p className="text-xs">No certificates yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Badges - Compact Grid */}
            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-xl p-5 border border-white/20 dark:border-slate-700/50 shadow-md">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Badges
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-lg border border-slate-200/50 dark:border-slate-600/50 hover:shadow-md hover:scale-105 transition-all cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center text-xl shadow-md mb-1.5`}>
                      {badge.icon}
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white text-center leading-tight">
                      {badge.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills - Compact Chips */}
            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-xl p-5 border border-white/20 dark:border-slate-700/50 shadow-md">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Skills
              </h3>
              
              <div className="flex flex-wrap gap-1.5">
                {['JavaScript', 'React', 'Python', 'Node.js', 'SQL', 'Git', 'Docker', 'AWS'].map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-xs font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-pointer"
                  >
                    {skill}
                  </span>
                ))}
                <button className="px-2.5 py-1 border border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-full text-xs font-medium hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <RightSidebar />
    </div>
  );
}
