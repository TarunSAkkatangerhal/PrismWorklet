// Student Profile Page - Comprehensive profile management for students
import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Award, 
  Edit2, Save, X, School,
  ExternalLink
} from 'lucide-react';
import ProfessionalSelect from '../components/ProfessionalSelect';
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

export default function StudentProfile() {
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
                    style={{ backgroundColor: generateColorFromName(profileData?.name || 'Student') }}
                  >
                    {getInitials(profileData?.name || 'Student')}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">✓</span>
                </div>
              </div>

              {/* Name and Info */}
              <div className="flex-1">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                  {profileData?.name || 'Student'}
                </h1>
                <span className="inline-block px-3 py-0.5 bg-purple-200 dark:bg-white/20 backdrop-blur-sm text-purple-800 dark:text-white rounded-full text-xs font-semibold border border-purple-300 dark:border-white/30 mb-2">
                  {profileData?.role || 'Student'}
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
                <div className="bg-white/50 dark:bg-white/20 backdrop-blur-sm rounded-lg p-2 border border-purple-300 dark:border-white/30 min-w-[70px]">
                  <p className="text-lg font-bold text-indigo-700 dark:text-white leading-none">{stats.totalWorklets}</p>
                  <p className="text-[10px] text-slate-700 dark:text-white/80 font-medium mt-0.5">Worklets</p>
                </div>
                <div className="bg-white/50 dark:bg-white/20 backdrop-blur-sm rounded-lg p-2 border border-purple-300 dark:border-white/30 min-w-[70px]">
                  <p className="text-lg font-bold text-indigo-700 dark:text-white leading-none">{stats.completedWorklets}</p>
                  <p className="text-[10px] text-slate-700 dark:text-white/80 font-medium mt-0.5">Completed</p>
                </div>
                <div className="bg-white/50 dark:bg-white/20 backdrop-blur-sm rounded-lg p-2 border border-purple-300 dark:border-white/30 min-w-[70px]">
                  <p className="text-lg font-bold text-indigo-700 dark:text-white leading-none">{stats.completionRate}%</p>
                  <p className="text-[10px] text-slate-700 dark:text-white/80 font-medium mt-0.5">Success</p>
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

        {/* Content Grid Layout */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-shadow">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3 pb-3 border-b-2 border-blue-100 dark:border-slate-700">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                Personal Information
              </h3>
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Full Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 text-base bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all"
                    />
                  ) : (
                    <p className="text-base font-medium text-slate-900 dark:text-white px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      {formData.name || 'Not set'}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Phone Number</label>
                  {editMode ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 1234567890"
                      className="w-full px-3 py-2.5 text-base bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all"
                    />
                  ) : (
                    <p className="text-base font-medium text-slate-900 dark:text-white px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      {formData.phone || 'Not set'}
                    </p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Department</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      placeholder="e.g., Computer Science"
                      className="w-full px-3 py-2.5 text-base bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all"
                    />
                  ) : (
                    <p className="text-base font-medium text-slate-900 dark:text-white px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      {formData.department || 'Not set'}
                    </p>
                  )}
                </div>

                {/* Year of Study */}
                <div>
                  <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Year of Study</label>
                  {editMode ? (
                    <ProfessionalSelect
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      placeholder="Select Year"
                      options={[
                        { value: "1", label: "1st Year" },
                        { value: "2", label: "2nd Year" },
                        { value: "3", label: "3rd Year" },
                        { value: "4", label: "4th Year" },
                        { value: "Graduate", label: "Graduate" }
                      ]}
                    />
                  ) : (
                    <p className="text-base font-medium text-slate-900 dark:text-white px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      {formData.year ? (formData.year === '1' ? '1st Year' : formData.year === '2' ? '2nd Year' : formData.year === '3' ? '3rd Year' : formData.year === '4' ? '4th Year' : formData.year) : 'Not set'}
                    </p>
                  )}
                </div>
              </div>

              {/* About Me - Full Width */}
              <div className="mt-5 pt-5 border-t-2 border-slate-100 dark:border-slate-800">
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">About Me</label>
                {editMode ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Tell us about yourself, your interests, goals, and aspirations..."
                    className="w-full px-3 py-2.5 text-base bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white resize-none"
                  />
                ) : (
                  <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    {formData.bio || 'Tell us about yourself, your interests, goals, and aspirations...'}
                  </p>
                )}
              </div>
            </div>

            {/* Social & Professional Links */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3 pb-3 border-b-2 border-blue-100 dark:border-slate-700">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                Social & Professional Links
              </h3>
              <div className="space-y-4">
                {/* GitHub */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">GitHub</label>
                  {editMode ? (
                    <input
                      type="url"
                      name="github"
                      value={formData.github}
                      onChange={handleInputChange}
                      placeholder="https://github.com/username"
                      className="w-full px-3 py-2.5 text-base bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all"
                    />
                  ) : (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5 rounded-xl">
                      <svg className="w-5 h-5 text-slate-700 dark:text-slate-300 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      {formData.github ? (
                        <a href={formData.github} target="_blank" rel="noopener noreferrer" className="text-base text-blue-600 dark:text-blue-400 hover:underline truncate">
                          {formData.github}
                        </a>
                      ) : (
                        <span className="text-base text-slate-500 dark:text-slate-400">Not provided</span>
                      )}
                    </div>
                  )}
                </div>

                {/* LinkedIn */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">LinkedIn</label>
                  {editMode ? (
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-3 py-2.5 text-base bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all"
                    />
                  ) : (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5 rounded-xl">
                      <svg className="w-5 h-5 text-slate-700 dark:text-slate-300 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                      {formData.linkedin ? (
                        <a href={formData.linkedin} target="_blank" rel="noopener noreferrer" className="text-base text-blue-600 dark:text-blue-400 hover:underline truncate">
                          {formData.linkedin}
                        </a>
                      ) : (
                        <span className="text-base text-slate-500 dark:text-slate-400">Not provided</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Portfolio */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Portfolio</label>
                  {editMode ? (
                    <input
                      type="url"
                      name="portfolio"
                      value={formData.portfolio}
                      onChange={handleInputChange}
                      placeholder="https://yourportfolio.com"
                      className="w-full px-3 py-2.5 text-base bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all"
                    />
                  ) : (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5 rounded-xl">
                      <Award className="w-5 h-5 text-slate-700 dark:text-slate-300 flex-shrink-0" />
                      {formData.portfolio ? (
                        <a href={formData.portfolio} target="_blank" rel="noopener noreferrer" className="text-base text-blue-600 dark:text-blue-400 hover:underline truncate">
                          {formData.portfolio}
                        </a>
                      ) : (
                        <span className="text-base text-slate-500 dark:text-slate-400">Not provided</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <RightSidebar />
    </div>
  );
}
