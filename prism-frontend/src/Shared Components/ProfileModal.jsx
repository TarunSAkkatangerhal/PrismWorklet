import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap, Github, Linkedin, ExternalLink, Globe, User as UserIcon, Loader } from 'lucide-react';
import apiClient from '../services/secureAPI';

const ProfileModal = ({ isOpen, onClose, userName, userEmail, userId }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && (userId || userName || userEmail)) {
      fetchUserProfile();
    }
  }, [isOpen, userId, userName, userEmail]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      else if (userEmail) params.append('email', userEmail);
      else if (userName) params.append('name', userName);
      
      const response = await apiClient.get(`/api/students/profile/search?${params.toString()}`);
      setProfile(response.data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to load profile';
      
      // Provide more helpful error message
      if (err.response?.status === 404) {
        setError(`User profile not found. This user may not have registered yet or their account may have been removed.`);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {profile?.profile?.avatar_url ? (
                <img 
                  src={profile.profile.avatar_url} 
                  alt={profile.name}
                  className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center">
                  <UserIcon className="w-10 h-10 text-indigo-500" />
                </div>
              )}
              {loading ? (
                <div className="flex items-center gap-2 text-white">
                  <Loader className="animate-spin" size={20} />
                  <span>Loading profile...</span>
                </div>
              ) : profile ? (
                <div>
                  <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                  <p className="text-indigo-100 text-sm">{profile.role}</p>
                  {profile.college && (
                    <p className="text-indigo-100 text-xs mt-1 flex items-center gap-1">
                      <GraduationCap size={14} />
                      {profile.college}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-white">
                  <h2 className="text-2xl font-bold">{userName}</h2>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="animate-spin text-indigo-500" size={48} />
            </div>
          ) : profile ? (
            <>
              {/* Contact Information */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
                  <Mail size={18} className="text-indigo-500" />
                  Contact Information
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Mail size={16} className="text-gray-400" />
                    <a href={`mailto:${profile.email}`} className="hover:text-indigo-500 transition-colors">
                      {profile.email}
                    </a>
                  </div>
                  
                  {profile.profile?.contact_number && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Phone size={16} className="text-gray-400" />
                      <a href={`tel:${profile.profile.contact_number}`} className="hover:text-indigo-500 transition-colors">
                        {profile.profile.contact_number}
                      </a>
                    </div>
                  )}
                  
                  {profile.profile?.location && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <MapPin size={16} className="text-gray-400" />
                      <span>{profile.profile.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile.profile?.bio && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">About</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {profile.profile.bio}
                  </p>
                </div>
              )}

              {/* Professional Information */}
              {(profile.profile?.qualification || profile.profile?.organization || profile.profile?.experience_years || profile.profile?.expertise) && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
                    <Briefcase size={18} className="text-indigo-500" />
                    Professional Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {profile.profile.qualification && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block mb-1">Qualification</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {profile.profile.qualification}
                        </span>
                      </div>
                    )}
                    
                    {profile.profile.organization && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block mb-1">Organization</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {profile.profile.organization}
                        </span>
                      </div>
                    )}
                    
                    {profile.profile.experience_years !== null && profile.profile.experience_years !== undefined && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block mb-1">Experience</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {profile.profile.experience_years} {profile.profile.experience_years === 1 ? 'year' : 'years'}
                        </span>
                      </div>
                    )}
                    
                    {profile.profile.expertise && (
                      <div className="md:col-span-2">
                        <span className="text-gray-500 dark:text-gray-400 block mb-1">Expertise</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {profile.profile.expertise}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {(profile.profile?.date_of_birth || profile.profile?.handle) && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Additional Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {profile.profile.date_of_birth && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Calendar size={16} className="text-gray-400" />
                        <div>
                          <span className="text-gray-500 dark:text-gray-400 block text-xs">Date of Birth</span>
                          <span>{formatDate(profile.profile.date_of_birth)}</span>
                        </div>
                      </div>
                    )}
                    
                    {profile.profile.handle && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <UserIcon size={16} className="text-gray-400" />
                        <div>
                          <span className="text-gray-500 dark:text-gray-400 block text-xs">Handle</span>
                          <span>@{profile.profile.handle}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {(profile.profile?.github || profile.profile?.linkedin || profile.profile?.portfolio_url || profile.profile?.website) && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Links</h3>
                  
                  <div className="flex flex-wrap gap-3">
                    {profile.profile.github && (
                      <a
                        href={profile.profile.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <Github size={16} />
                        GitHub
                        <ExternalLink size={14} />
                      </a>
                    )}
                    
                    {profile.profile.linkedin && (
                      <a
                        href={profile.profile.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
                      >
                        <Linkedin size={16} />
                        LinkedIn
                        <ExternalLink size={14} />
                      </a>
                    )}
                    
                    {profile.profile.portfolio_url && (
                      <a
                        href={profile.profile.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm"
                      >
                        <Briefcase size={16} />
                        Portfolio
                        <ExternalLink size={14} />
                      </a>
                    )}
                    
                    {profile.profile.website && (
                      <a
                        href={profile.profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm"
                      >
                        <Globe size={16} />
                        Website
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Account Information */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Account Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block mb-1">User ID</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{profile.id}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block mb-1">Status</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      profile.is_verified 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {profile.is_verified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                  
                  {profile.created_at && (
                    <div className="md:col-span-2">
                      <span className="text-gray-500 dark:text-gray-400 block mb-1">Member Since</span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {formatDate(profile.created_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-100 dark:bg-gray-700 p-4 rounded-b-2xl border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
