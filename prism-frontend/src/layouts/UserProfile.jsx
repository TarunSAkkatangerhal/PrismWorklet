import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';
import { Edit, Briefcase, MapPin, Cake, Link as LinkIcon, X, ImageOff } from 'lucide-react';
import axios from 'axios';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200&auto=format&fit=crop',
];

const getInitials = (name) => {
  if (!name) return '';
  const nameParts = name.split(' ');
  if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
};

const generateColorFromName = (name) => {
  if (!name) return '#cccccc';
  const colors = ['#0077b6', '#0096c7', '#48cae4', '#90e0ef', '#ade8f4'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash % colors.length)];
};

const UserProfile = ({ userData, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  // State to hold form data while editing. Initialized when editing starts.
  const [editedData, setEditedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [realUserData, setRealUserData] = useState(userData);
  const navigate = useNavigate();

  // Fetch real user profile data on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        
        if (!token) return;

        const response = await axios.get(
          `http://localhost:8000/auth/me`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        );
        
        if (response.data) {
          // Transform backend data to match frontend format
          const profileData = {
            name: response.data.name,
            avatarUrl: null, // Users table doesn't have avatar_url yet
            bio: `${response.data.role} at ${response.data.college || 'PRISM'}`,
            qualification: response.data.team || response.data.role,
            location: response.data.college || 'Samsung PRISM',
            dob: userData.dob, // Keep default for now since not in users table
            website: userData.website, // Keep default for now since not in users table
            handle: `@${response.data.name.replace(/\s+/g, '').toLowerCase()}`,
            team: response.data.team,
            college: response.data.college,
            role: response.data.role,
          };
          setRealUserData(profileData);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // Use default userData if API fails
      }
    };

    fetchUserProfile();
  }, [userData]);

  // Updates the temporary state, not the parent component's state.
  const handleInputChange = (e) => {
    setEditedData(prevData => ({ ...prevData, [e.target.name]: e.target.value }));
  };

  // Updates the temporary avatar URL.
  const handleAvatarSelect = (url) => {
    setEditedData(prevData => ({ ...prevData, avatarUrl: url }));
  };

  // When "Edit" is clicked, copy current data to a temporary state for editing.
  const handleEditClick = () => {
    setEditedData(realUserData);
    setIsEditing(true);
  };

  // On save, call the API to update the user profile
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        throw new Error("User information not found");
      }

      // Prepare data for API (only send fields that can be updated in users table)
      const updateData = {
        name: editedData.name,
        team: editedData.qualification, // Map qualification to team field
        college: editedData.location, // Map location to college field
      };

      const response = await axios.put(
        `http://localhost:8000/auth/me/profile`,
        updateData,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        // Update local state with saved data
        const updatedData = {
          ...editedData,
          name: response.data.user.name,
          qualification: response.data.user.team,
          location: response.data.user.college,
          bio: `${response.data.user.role} at ${response.data.user.college || 'PRISM'}`,
        };
        setRealUserData(updatedData);
        // Also update parent component
        onProfileUpdate(updatedData);
        setIsEditing(false);
        setEditedData(null);
        navigate('/home');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // On cancel, simply close the modal and clear the temporary state.
  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(null);
  }

  const InitialsAvatar = ({ name }) => (
    <div className="profile-avatar initials-avatar" style={{ backgroundColor: generateColorFromName(name) }}>
      <span>{getInitials(name)}</span>
    </div>
  );

  return (
    <div className="profile-page-container">
      <div className="dynamic-background"></div>
      <div className="profile-card">
        <button className="edit-button" onClick={handleEditClick}><Edit size={18} /></button>
        <div className="profile-header">
          {realUserData.avatarUrl ? (
            <img src={realUserData.avatarUrl} alt="User Avatar" className="profile-avatar" />
          ) : (
            <InitialsAvatar name={realUserData.name} />
          )}
          <h1 className="profile-name">{realUserData.name}</h1>
          <p className="profile-handle">{realUserData.handle}</p>
        </div>
        <div className="profile-body">
          <p className="profile-bio">{realUserData.bio}</p>
          <div className="profile-details">
            <div className="detail-item"><Briefcase size={16} /><span>{realUserData.qualification}</span></div>
            <div className="detail-item"><MapPin size={16} /><span>{realUserData.location}</span></div>
            <div className="detail-item"><Cake size={16} /><span>Born on {realUserData.dob ? new Date(realUserData.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'Not specified'}</span></div>
            <div className="detail-item"><LinkIcon size={16} /><a href={realUserData.website} target="_blank" rel="noopener noreferrer">{realUserData.website}</a></div>
          </div>
        </div>
      </div>

      {isEditing && editedData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal-button" onClick={handleCancel}><X size={20} /></button>
            <h2>Edit Your Profile</h2>
            <form className="edit-form">
              <div className="avatar-picker full-width">
                <label>Choose Avatar</label>
                <div className="avatar-selection-grid">
                  {AVATAR_OPTIONS.map(url => <img key={url} src={url} alt="Avatar option" className={`avatar-option ${editedData.avatarUrl === url ? 'selected' : ''}`} onClick={() => handleAvatarSelect(url)} />)}
                  <button
                    type="button"
                    className={`avatar-option remove-photo ${!editedData.avatarUrl ? 'selected' : ''}`}
                    onClick={() => handleAvatarSelect(null)}
                  >
                    <ImageOff size={24} />
                  </button>
                </div>
              </div>
              {/* Form inputs now read from and write to the temporary 'editedData' state */}
              <div className="form-group"><label>Name</label><input type="text" name="name" value={editedData.name} onChange={handleInputChange} /></div>
              <div className="form-group"><label>Handle</label><input type="text" name="handle" value={editedData.handle} onChange={handleInputChange} /></div>
              <div className="form-group"><label>Qualification</label><input type="text" name="qualification" value={editedData.qualification} onChange={handleInputChange} /></div>
              <div className="form-group"><label>Location</label><input type="text" name="location" value={editedData.location} onChange={handleInputChange} /></div>
              <div className="form-group"><label>Date of Birth</label><input type="date" name="dob" value={editedData.dob} onChange={handleInputChange} /></div>
              <div className="form-group"><label>Website</label><input type="url" name="website" value={editedData.website} onChange={handleInputChange} /></div>
              <div className="form-group full-width"><label>Bio</label><textarea name="bio" value={editedData.bio} onChange={handleInputChange}></textarea></div>
            </form>
            <div className="modal-actions">
              <button className="btn secondary" onClick={handleCancel}>Cancel</button>
              <button 
                className="btn primary" 
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;