// Professor Profile Page - Comprehensive profile management for professors
import React, { useState, useEffect } from 'react';
import { 
  User, Mail,
  Edit2, Save, X, School
} from 'lucide-react';
import LeftSidebar from '../components/Left';
import RightSidebar from '../components/Right';
import { getCurrentUser } from '../services/auth';
import secureAPI from '../services/secureAPI';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

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

export default function ProfessorProfile() {
  useDocumentTitle('My Profile - PRISM');

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

  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    department: '',
    designation: '',
    specialization: '',
    googleScholar: ''
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
        designation: user.designation || '',
        specialization: user.specialization || '',
        googleScholar: user.googleScholar || user.google_scholar || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkletStats = async () => {
    try {
      const response = await secureAPI.get('/worklets/professor/me');
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
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: profileData?.name || '',
      email: profileData?.email || '',
      phone: profileData?.phone || '',
      college: profileData?.college || '',
      department: profileData?.department || '',
      designation: profileData?.designation || '',
      specialization: profileData?.specialization || '',
      googleScholar: profileData?.googleScholar || profileData?.google_scholar || ''
    });
    setEditMode(false);
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

      <main className="flex-1 px-8 py-6 overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-hide">
        {/* Modern Profile Header with Gradient */}
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-150 dark:from-slate-800 dark:via-slate-900 dark:to-black rounded-xl p-4 shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {/* Large Avatar */}
              <div className="relative flex-shrink-0">
                {profileData?.avatar_url ? (
                  <img
                    src={profileData.avatar_url}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover shadow-lg border-2 border-purple-400/30 dark:border-white/30"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 border-purple-400/30 dark:border-white/30"
                    style={{ backgroundColor: generateColorFromName(profileData?.name || 'Professor') }}
                  >
                    {getInitials(profileData?.name || 'Professor')}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">✓</span>
                </div>
              </div>

              {/* Name and Info */}
              <div className="flex-1">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                  {profileData?.name || 'Professor'}
                </h1>
                <span className="inline-block px-3 py-0.5 bg-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-600/30 dark:to-blue-600/30 backdrop-blur-sm text-purple-800 dark:text-white rounded-full text-xs font-semibold border border-purple-300 dark:border-white/30 mb-2">
                  {profileData?.role || 'Professor'}
                </span>
                <div className="flex flex-wrap gap-3 mt-1.5">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-white/90">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm font-medium">{profileData?.email}</span>
                  </div>
                  {formData.college && (
                    <div className="flex items-center gap-2 text-slate-700 dark:text-white/90">
                      <School className="w-4 h-4" />
                      <span className="text-sm font-medium">{formData.college}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="flex gap-1.5">
                <div className="bg-white/50 dark:bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-slate-300 dark:border-white/30 min-w-[85px]">
                  <p className="text-xl font-bold text-slate-700 dark:text-white leading-none">{stats.totalWorklets}</p>
                  <p className="text-xs text-slate-700 dark:text-white/80 font-medium mt-1">Worklets</p>
                </div>
                <div className="bg-white/50 dark:bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-slate-300 dark:border-white/30 min-w-[85px]">
                  <p className="text-xl font-bold text-slate-700 dark:text-white leading-none">{stats.completedWorklets}</p>
                  <p className="text-xs text-slate-700 dark:text-white/80 font-medium mt-1">Completed</p>
                </div>
                <div className="bg-white/50 dark:bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-slate-300 dark:border-white/30 min-w-[85px]">
                  <p className="text-xl font-bold text-slate-700 dark:text-white leading-none">{stats.completionRate}%</p>
                  <p className="text-xs text-slate-700 dark:text-white/80 font-medium mt-1">Success</p>
                </div>
              </div>
            </div>

            {/* Edit/Save Buttons */}
            <div className="ml-3">
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-200 dark:bg-white text-purple-800 dark:text-blue-600 rounded-lg hover:bg-purple-300 dark:hover:bg-blue-50 transition-all shadow-md hover:shadow-lg text-sm font-semibold"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md disabled:opacity-50 text-sm font-semibold"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all border border-white/30 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information Card - Two Column Layout */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-700/50 dark:to-blue-700/50">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  Full Name
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-base bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all"
                  />
                ) : (
                  <p className="text-base text-slate-900 dark:text-white font-medium px-4 py-3 bg-blue-50/50 dark:bg-slate-700/50 rounded-lg border border-blue-100/50 dark:border-slate-600">
                    {formData.name || 'Not set'}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                  Email
                </label>
                <p className="text-base text-slate-900 dark:text-white font-medium px-4 py-3 bg-indigo-50/50 dark:bg-slate-700/50 rounded-lg border border-indigo-100/50 dark:border-slate-600 break-all">
                  {formData.email || 'Not set'}
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  Phone Number
                </label>
                {editMode ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 1234567890"
                    className="w-full px-4 py-3 text-base bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all"
                  />
                ) : (
                  <p className="text-base text-slate-900 dark:text-white font-medium px-4 py-3 bg-blue-50/50 dark:bg-slate-700/50 rounded-lg border border-blue-100/50 dark:border-slate-600">
                    {formData.phone || 'Not set'}
                  </p>
                )}
              </div>

              {/* College */}
              <div>
                <label className="block text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                  College
                </label>
                <p className="text-base text-slate-900 dark:text-white font-medium px-4 py-3 bg-indigo-50/50 dark:bg-slate-700/50 rounded-lg border border-indigo-100/50 dark:border-slate-600">
                  {formData.college || 'Not set'}
                </p>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  Department
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science"
                    className="w-full px-4 py-3 text-base bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all"
                  />
                ) : (
                  <p className="text-base text-slate-900 dark:text-white font-medium px-4 py-3 bg-blue-50/50 dark:bg-slate-700/50 rounded-lg border border-blue-100/50 dark:border-slate-600">
                    {formData.department || 'Not set'}
                  </p>
                )}
              </div>

              {/* Designation */}
              <div>
                <label className="block text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                  Designation
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    placeholder="e.g., Assistant Professor, Associate Professor"
                    className="w-full px-4 py-3 text-base bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white transition-all"
                  />
                ) : (
                  <p className="text-base text-slate-900 dark:text-white font-medium px-4 py-3 bg-indigo-50/50 dark:bg-slate-700/50 rounded-lg border border-indigo-100/50 dark:border-slate-600">
                    {formData.designation || 'Not set'}
                  </p>
                )}
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  Area of Specialization
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="e.g., Machine Learning, Data Science"
                    className="w-full px-4 py-3 text-base bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all"
                  />
                ) : (
                  <p className="text-base text-slate-900 dark:text-white font-medium px-4 py-3 bg-blue-50/50 dark:bg-slate-700/50 rounded-lg border border-blue-100/50 dark:border-slate-600">
                    {formData.specialization || 'Not set'}
                  </p>
                )}
              </div>

              {/* Google Scholar */}
              <div>
                <label className="block text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                  Google Scholar Profile
                </label>
                {editMode ? (
                  <input
                    type="url"
                    name="googleScholar"
                    value={formData.googleScholar}
                    onChange={handleInputChange}
                    placeholder="https://scholar.google.com/citations?user=..."
                    className="w-full px-4 py-3 text-base bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white transition-all"
                  />
                ) : (
                  <p className="text-base text-slate-900 dark:text-white font-medium px-4 py-3 bg-indigo-50/50 dark:bg-slate-700/50 rounded-lg border border-indigo-100/50 dark:border-slate-600 break-all">
                    {formData.googleScholar ? (
                      <a href={formData.googleScholar} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        {formData.googleScholar}
                      </a>
                    ) : (
                      'Not set'
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <RightSidebar />
    </div>
  );
}
