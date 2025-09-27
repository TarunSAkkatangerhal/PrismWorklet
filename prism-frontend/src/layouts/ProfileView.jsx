import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Cake, Link as LinkIcon, ArrowLeft, Clock, Award, Users, Phone, Github, Linkedin } from 'lucide-react';
import axios from 'axios';

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

const ProfileView = ({ userData }) => {
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



  return (
    <div style={{ 
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      minHeight: '100vh',
      position: 'relative',
      color: '#fff',
      padding: 'clamp(3rem, 8vh, 5rem) clamp(1rem, 2vw, 2rem)',
      background: 'linear-gradient(45deg, #2555e5, #b9bdcb, #3a506b)',
      backgroundSize: '400% 400%',
      animation: 'prism-effect 25s ease infinite'
    }}>
      <style jsx>{`
        @keyframes prism-effect {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        maxWidth: 'clamp(20rem, 50vw, 30rem)',
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        background: 'rgba(22, 22, 22, 0.25)',
        backdropFilter: 'blur(15px) saturate(180%)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.125)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        textAlign: 'center',
        margin: 0
      }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/home')}
          style={{
            position: 'absolute',
            top: 'clamp(1rem, 3vw, 1.5rem)',
            left: 'clamp(1rem, 3vw, 1.5rem)',
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            width: 'clamp(2rem, 5vw, 2.5rem)',
            height: 'clamp(2rem, 5vw, 2.5rem)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.15)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          <ArrowLeft size={18} />
        </button>

        {/* Profile Header */}
        <div style={{ marginBottom: 'clamp(1rem, 3vw, 1.5rem)' }}>
          {realUserData.avatarUrl ? (
            <img 
              src={realUserData.avatarUrl} 
              alt="User Avatar" 
              style={{
                width: 'clamp(6rem, 12vw, 8rem)',
                height: 'clamp(6rem, 12vw, 8rem)',
                borderRadius: '50%',
                border: '3px solid rgba(255, 255, 255, 0.8)',
                marginBottom: 'clamp(0.5rem, 2vw, 1rem)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                objectFit: 'cover'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          ) : (
            <div
              style={{
                width: 'clamp(6rem, 12vw, 8rem)',
                height: 'clamp(6rem, 12vw, 8rem)',
                borderRadius: '50%',
                border: '3px solid rgba(255, 255, 255, 0.8)',
                marginBottom: 'clamp(0.5rem, 2vw, 1rem)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                backgroundColor: generateColorFromName(realUserData.name),
                margin: '0 auto clamp(0.5rem, 2vw, 1rem) auto'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '600' }}>
                {getInitials(realUserData.name)}
              </span>
            </div>
          )}
          <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.8rem)', fontWeight: '600', margin: 0 }}>
            {realUserData.name}
          </h1>
          <p style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)', color: '#d1d1d1', margin: 'clamp(0.25rem, 1vw, 0.5rem) 0 clamp(1rem, 3vw, 1.5rem) 0' }}>
            {realUserData.handle}
          </p>
        </div>

        {/* Profile Body */}
        <div>
          <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: '#f0f0f0', marginBottom: '2rem' }}>
            {realUserData.bio}
          </p>
          
          {/* Profile Details */}
          <div style={{ 
            marginTop: '1.5rem', 
            marginBottom: '2rem', 
            textAlign: 'left', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.8rem', 
            color: '#e0e0e0' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
              <Briefcase size={16} style={{ flexShrink: 0, opacity: 0.8 }} />
              <span>{realUserData.qualification}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
              <MapPin size={16} style={{ flexShrink: 0, opacity: 0.8 }} />
              <span>{realUserData.location}</span>
            </div>
            
            {realUserData.dob && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                <Cake size={16} style={{ flexShrink: 0, opacity: 0.8 }} />
                <span>Born on {realUserData.dob ? new Date(realUserData.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'Not specified'}</span>
              </div>
            )}
            
            {realUserData.website && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                <LinkIcon size={16} style={{ flexShrink: 0, opacity: 0.8 }} />
                <a 
                  href={realUserData.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#a7c5ff', 
                    textDecoration: 'none', 
                    transition: 'color 0.2s' 
                  }}
                  onMouseOver={(e) => {
                    e.target.style.color = '#fff';
                    e.target.style.textDecoration = 'underline';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.color = '#a7c5ff';
                    e.target.style.textDecoration = 'none';
                  }}
                >
                  {realUserData.website}
                </a>
              </div>
            )}
            
            {/* Mentor-Specific Information */}
            {realUserData.experience && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                <Award size={16} style={{ flexShrink: 0, opacity: 0.8 }} />
                <span>{realUserData.experience} years of experience</span>
              </div>
            )}
            
            {realUserData.expertise && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.9rem' }}>
                <Users size={16} style={{ flexShrink: 0, opacity: 0.8, marginTop: '0.1rem' }} />
                <span>{realUserData.expertise}</span>
              </div>
            )}
            
            {realUserData.availability && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.9rem' }}>
                <Clock size={16} style={{ flexShrink: 0, opacity: 0.8, marginTop: '0.1rem' }} />
                <span>{realUserData.availability}</span>
              </div>
            )}
            
            {realUserData.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                <Phone size={16} style={{ flexShrink: 0, opacity: 0.8 }} />
                <span>{realUserData.phone}</span>
              </div>
            )}
            
            {realUserData.linkedin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                <Linkedin size={16} style={{ flexShrink: 0, opacity: 0.8 }} />
                <a 
                  href={realUserData.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#a7c5ff', 
                    textDecoration: 'none', 
                    transition: 'color 0.2s' 
                  }}
                  onMouseOver={(e) => {
                    e.target.style.color = '#fff';
                    e.target.style.textDecoration = 'underline';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.color = '#a7c5ff';
                    e.target.style.textDecoration = 'none';
                  }}
                >
                  LinkedIn Profile
                </a>
              </div>
            )}
            
            {realUserData.github && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                <Github size={16} style={{ flexShrink: 0, opacity: 0.8 }} />
                <a 
                  href={realUserData.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#a7c5ff', 
                    textDecoration: 'none', 
                    transition: 'color 0.2s' 
                  }}
                  onMouseOver={(e) => {
                    e.target.style.color = '#fff';
                    e.target.style.textDecoration = 'underline';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.color = '#a7c5ff';
                    e.target.style.textDecoration = 'none';
                  }}
                >
                  GitHub Profile
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;