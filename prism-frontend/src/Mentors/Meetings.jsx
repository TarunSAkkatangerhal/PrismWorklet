/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Calendar, 
  Users, 
  Filter,
  User,
  Settings,
  Video,
  Clock,
  MapPin,
  Plus,
  ChevronDown,
  X
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import LeftSidebar from '../components/Left';
import RightSidebar from '../components/Right';
import * as meetingsAPI from '../services/meetings';

// Enhanced Clock Time Picker Component with Beautiful Design
const ClockTimePicker = ({ hour, minute, onTimeChange, size = 240 }) => {
  const [mode, setMode] = useState('hour'); // 'hour' or 'minute'
  const [isAM, setIsAM] = useState(hour < 12);
  
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  const numberRadius = size * 0.3;
  const tickRadius = size * 0.38;

  // Convert 24-hour to 12-hour for display
  const display12Hour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  const getClockPosition = (value, max) => {
    const angle = (value * 360 / max) - 90; // -90 to start from top
    const radian = (angle * Math.PI) / 180;
    return {
      x: centerX + Math.cos(radian) * numberRadius,
      y: centerY + Math.sin(radian) * numberRadius
    };
  };

  const getHandPosition = (value, max) => {
    const angle = (value * 360 / max) - 90;
    const radian = (angle * Math.PI) / 180;
    return {
      x: centerX + Math.cos(radian) * radius,
      y: centerY + Math.sin(radian) * radius
    };
  };

  const getTickPosition = (value, max) => {
    const angle = (value * 360 / max) - 90;
    const radian = (angle * Math.PI) / 180;
    return {
      x1: centerX + Math.cos(radian) * (tickRadius - 8),
      y1: centerY + Math.sin(radian) * (tickRadius - 8),
      x2: centerX + Math.cos(radian) * tickRadius,
      y2: centerY + Math.sin(radian) * tickRadius
    };
  };

  const handleClockClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left - centerX;
    const clickY = event.clientY - rect.top - centerY;
    
    let angle = Math.atan2(clickY, clickX) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    
    if (mode === 'hour') {
      let selectedHour = Math.round(angle / 30) % 12;
      if (selectedHour === 0) selectedHour = 12;
      
      // Convert to 24-hour format
      const newHour = isAM ? 
        (selectedHour === 12 ? 0 : selectedHour) : 
        (selectedHour === 12 ? 12 : selectedHour + 12);
      
      onTimeChange(newHour, minute);
      setMode('minute');
    } else {
      const selectedMinute = Math.round(angle / 6) % 60;
      const roundedMinute = Math.round(selectedMinute / 5) * 5; // Round to 5-minute intervals
      onTimeChange(hour, roundedMinute >= 60 ? 0 : roundedMinute);
    }
  };

  const toggleAMPM = () => {
    const newIsAM = !isAM;
    setIsAM(newIsAM);
    const newHour = newIsAM ? 
      (hour >= 12 ? hour - 12 : hour) : 
      (hour < 12 ? hour + 12 : hour);
    onTimeChange(newHour === 24 ? 0 : newHour, minute);
  };

  const hourNumbers = Array.from({ length: 12 }, (_, i) => i + 1);
  const minuteNumbers = mode === 'minute' ? 
    Array.from({ length: 12 }, (_, i) => i * 5) : // 0, 5, 10, 15, etc.
    [0, 15, 30, 45];

  return (
    <div className="flex flex-col items-center space-y-6 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
      {/* Digital Time Display */}
      <div className="flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-xl px-6 py-4">
        <Clock className="w-6 h-6 text-blue-500" />
        <span className="text-3xl font-mono font-bold text-slate-800 dark:text-slate-100">
          {display12Hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
        </span>
        <button
          type="button"
          onClick={toggleAMPM}
          className="ml-3 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
        >
          {isAM ? 'AM' : 'PM'}
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setMode('hour')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            mode === 'hour' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          Hour
        </button>
        <button
          type="button"
          onClick={() => setMode('minute')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            mode === 'minute' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          Minute
        </button>
      </div>

      {/* Beautiful Clock Face */}
      <div className="relative">
        <svg 
          width={size} 
          height={size} 
          className="cursor-pointer drop-shadow-lg"
          onClick={handleClockClick}
        >
          {/* Outer Ring */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius + 25}
            fill="none"
            stroke="url(#clockGradient)"
            strokeWidth="3"
          />
          
          {/* Inner Clock Face */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius + 20}
            fill="url(#clockBg)"
            className="drop-shadow-sm"
          />

          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="clockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="clockBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>
          </defs>
          
          {/* Hour Marks */}
          {Array.from({ length: 12 }, (_, i) => {
            const tick = getTickPosition(i + 1, 12);
            return (
              <line
                key={i}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke="#64748b"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
          
          {/* Numbers */}
          {(mode === 'hour' ? hourNumbers : minuteNumbers).map((num, index) => {
            const pos = getClockPosition(mode === 'hour' ? index + 1 : num, mode === 'hour' ? 12 : 60);
            
            return (
              <g key={num}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="18"
                  fill="rgba(255,255,255,0.95)"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  className="hover:fill-blue-50 hover:stroke-blue-300 transition-all duration-300 cursor-pointer transform hover:scale-110"
                  filter="url(#clockShadow)"
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-sm font-bold cursor-pointer select-none fill-slate-700 hover:fill-blue-600 transition-all duration-300"
                >
                  {mode === 'hour' ? num : num.toString().padStart(2, '0')}
                </text>
              </g>
            );
          })}
          
          {/* Clock Hand */}
          {(() => {
            const handPos = mode === 'hour' ? 
              getHandPosition(display12Hour === 12 ? 0 : display12Hour, 12) :
              getHandPosition(minute, 60);
            
            return (
              <g>
                {/* Hand Shadow */}
                <line
                  x1={centerX + 2}
                  y1={centerY + 2}
                  x2={handPos.x + 2}
                  y2={handPos.y + 2}
                  stroke="rgba(0,0,0,0.2)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Main Hand */}
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={handPos.x}
                  y2={handPos.y}
                  stroke="url(#clockGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Center Dot */}
                <circle
                  cx={centerX}
                  cy={centerY}
                  r="6"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Hand Tip */}
                <circle
                  cx={handPos.x}
                  cy={handPos.y}
                  r="10"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer"
                />
              </g>
            );
          })()}
        </svg>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium">
        Click on {mode === 'hour' ? 'hour' : 'minute'} numbers or drag the hand
      </p>
    </div>
  );
};

// Professional Time Picker with Visual Clock Display
const CompactClockPicker = ({ hour, minute, onTimeChange, isOpen, onClose }) => {
  const [mode, setMode] = useState('hour');
  
  if (!isOpen) return null;

  const size = 200; // Increased size for better visibility
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.32;
  const numberRadius = size * 0.28;

  // Convert 24-hour to 12-hour for display
  const display12Hour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const isAM = hour < 12;

  const getClockPosition = (value, max) => {
    const angle = (value * 360 / max) - 90;
    const radian = (angle * Math.PI) / 180;
    return {
      x: centerX + Math.cos(radian) * numberRadius,
      y: centerY + Math.sin(radian) * numberRadius
    };
  };

  const getHandPosition = (value, max) => {
    const angle = (value * 360 / max) - 90;
    const radian = (angle * Math.PI) / 180;
    return {
      x: centerX + Math.cos(radian) * radius,
      y: centerY + Math.sin(radian) * radius
    };
  };

  const handleClockClick = (event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left - centerX;
    const clickY = event.clientY - rect.top - centerY;
    
    let angle = Math.atan2(clickY, clickX) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    
    if (mode === 'hour') {
      let selectedHour = Math.round(angle / 30) % 12;
      if (selectedHour === 0) selectedHour = 12;
      
      // Convert to 24-hour format
      const newHour = isAM ? 
        (selectedHour === 12 ? 0 : selectedHour) : 
        (selectedHour === 12 ? 12 : selectedHour + 12);
      
      onTimeChange(newHour, minute);
      setMode('minute');
    } else {
      const selectedMinute = Math.round(angle / 6) % 60;
      const roundedMinute = Math.round(selectedMinute / 5) * 5;
      onTimeChange(hour, roundedMinute >= 60 ? 0 : roundedMinute);
    }
  };

  const toggleAMPM = () => {
    const newHour = isAM ? 
      (hour + 12 >= 24 ? hour - 12 : hour + 12) : 
      (hour - 12 < 0 ? hour + 12 : hour - 12);
    onTimeChange(newHour, minute);
  };

  const hourNumbers = Array.from({ length: 12 }, (_, i) => i + 1);
  const minuteNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div 
      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm z-50 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
      style={{ 
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        width: '350px',
        maxHeight: '500px',
        zIndex: 60
      }}
    >
      {/* Header with Clock Icon */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Select Time</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Choose your preferred time</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* Visual Clock Display at Top with AM/PM Button */}
        <div className="flex justify-center mb-5 relative">
          <div className="relative">
            <svg width={size} height={size} className="cursor-pointer" onClick={handleClockClick}>
              <defs>
                <linearGradient id="clockOuterRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="clockFace" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f8fafc" />
                </linearGradient>
                <radialGradient id="clockCenter">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </radialGradient>
                <filter id="clockShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.15"/>
                </filter>
              </defs>

              {/* Clock Face */}
              <circle
                cx={centerX}
                cy={centerY}
                r={radius + 15}
                fill="url(#clockFace)"
                stroke="url(#clockOuterRing)"
                strokeWidth="2"
                filter="url(#clockShadow)"
              />

              {/* Hour Markers */}
              {Array.from({ length: 12 }, (_, i) => {
                const angle = (i * 30) - 90;
                const radian = (angle * Math.PI) / 180;
                const isMainHour = i % 3 === 0;
                const markerLength = isMainHour ? 8 : 6;
                const markerWidth = isMainHour ? 2 : 1.5;
                const x1 = centerX + Math.cos(radian) * (radius + 10 - markerLength);
                const y1 = centerY + Math.sin(radian) * (radius + 10 - markerLength);
                const x2 = centerX + Math.cos(radian) * (radius + 10);
                const y2 = centerY + Math.sin(radian) * (radius + 10);
                
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isMainHour ? "#1e293b" : "#64748b"}
                    strokeWidth={markerWidth}
                    strokeLinecap="round"
                  />
                );
              })}
              
              {/* Numbers */}
              {(mode === 'hour' ? hourNumbers : minuteNumbers).map((num, index) => {
                const pos = getClockPosition(mode === 'hour' ? index + 1 : num, mode === 'hour' ? 12 : 60);
                
                return (
                  <g key={num}>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="12"
                      fill="rgba(255,255,255,0.95)"
                      stroke="#e2e8f0"
                      strokeWidth="1.5"
                      className="hover:fill-blue-50 hover:stroke-blue-300 transition-all duration-300 cursor-pointer transform hover:scale-110"
                      filter="url(#clockShadow)"
                    />
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-xs font-bold cursor-pointer select-none transition-all duration-300 fill-slate-700 hover:fill-blue-600"
                    >
                      {mode === 'hour' ? num : num.toString().padStart(2, '0')}
                    </text>
                  </g>
                );
              })}
              
              {/* Clock Hand */}
              {(() => {
                const handPos = mode === 'hour' ? 
                  getHandPosition(display12Hour === 12 ? 0 : display12Hour, 12) :
                  getHandPosition(minute, 60);
                
                return (
                  <g>
                    {/* Center Circle */}
                    <circle
                      cx={centerX}
                      cy={centerY}
                      r="6"
                      fill="url(#clockCenter)"
                      stroke="white"
                      strokeWidth="3"
                      filter="url(#clockShadow)"
                    />
                    
                    {/* Outer Glow Ring for Selection */}
                    <circle
                      cx={handPos.x}
                      cy={handPos.y}
                      r="14"
                      fill="none"
                      stroke="url(#clockOuterRing)"
                      strokeWidth="2"
                      opacity="0.3"
                      className="animate-pulse"
                    />
                    
                    {/* Main Selection Indicator */}
                    <circle
                      cx={handPos.x}
                      cy={handPos.y}
                      r="10"
                      fill="url(#clockOuterRing)"
                      stroke="white"
                      strokeWidth="3"
                      className="cursor-pointer"
                      filter="url(#clockShadow)"
                    />
                    
                    {/* Inner gradient highlight */}
                    <circle
                      cx={handPos.x}
                      cy={handPos.y}
                      r="6"
                      fill="url(#clockCenter)"
                      opacity="0.9"
                    />
                    
                    {/* Core white highlight */}
                    <circle
                      cx={handPos.x}
                      cy={handPos.y}
                      r="3"
                      fill="white"
                      opacity="0.9"
                    />
                  </g>
                );
              })()}
            </svg>
          </div>
          
          {/* AM/PM Button positioned at top right of clock */}
          <div className="absolute top-0 right-0">
            <button
              type="button"
              onClick={toggleAMPM}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-sm font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isAM ? 'AM' : 'PM'}
            </button>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex space-x-1 mb-5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setMode('hour')}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === 'hour' 
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md transform scale-[1.02]' 
                : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${mode === 'hour' ? 'bg-blue-600' : 'bg-slate-400'}`}></div>
              <span>Hour</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMode('minute')}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === 'minute' 
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md transform scale-[1.02]' 
                : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${mode === 'minute' ? 'bg-blue-600' : 'bg-slate-400'}`}></div>
              <span>Min</span>
            </div>
          </button>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const Meetings = () => {
  useDocumentTitle('Meetings & Updates');
  const [selectedTab, setSelectedTab] = useState('department-meetings');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showCompletedMeetings, setShowCompletedMeetings] = useState(true); // Changed to true to show completed meetings by default
  const [loading, setLoading] = useState(true);
  const [creatingMeeting, setCreatingMeeting] = useState(false); // Separate loading state for meeting creation
  const [cancellingMeeting, setCancellingMeeting] = useState(false); // Separate loading state for cancelling
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false); // Add Meeting modal
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  
  // Reminder UI state
  const [showReminderSettings, setShowReminderSettings] = useState(false);

  // ---------------- Add Meeting Form State ----------------
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCollege, setFormCollege] = useState(''); // New: College selection
  const [formSelectedWorklets, setFormSelectedWorklets] = useState([]); // New: Multiple worklet selection
  const [formWorklet, setFormWorklet] = useState(''); // Keep for backward compatibility
  const [formStart, setFormStart] = useState(() => {
    // Default to current time rounded to next 30 min (ensure future date)
    const d = new Date();
    d.setMinutes(d.getMinutes() + (30 - (d.getMinutes() % 30)) % 30, 0, 0);
    return d.toISOString().slice(0,16); // yyyy-MM-ddTHH:mm
  });
  const [formDuration, setFormDuration] = useState(30); // minutes
  const [formRepeatDays, setFormRepeatDays] = useState([]); // e.g. ['Mon','Wed']
  const [formRepeatUntil, setFormRepeatUntil] = useState('');
  const [formMeetingLink, setFormMeetingLink] = useState('');
  const [formTouched, setFormTouched] = useState(false);
  const [showRepeatDaysDropdown, setShowRepeatDaysDropdown] = useState(false);

  // Enhanced date/time selection state for new meetings
  const [formDate, setFormDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return d.toISOString().split('T')[0]; // yyyy-MM-dd
  });
  const [formHour, setFormHour] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return d.getHours();
  });
  const [formMinute, setFormMinute] = useState(() => {
    const d = new Date();
    const roundedMinutes = Math.ceil(d.getMinutes() / 15) * 15;
    return roundedMinutes >= 60 ? 0 : roundedMinutes;
  });

  // Enhanced date/time selection state for reschedule
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleHour, setRescheduleHour] = useState(14); // 2 PM default
  const [rescheduleMinute, setRescheduleMinute] = useState(0);

  // Clock picker visibility states
  const [showFormClock, setShowFormClock] = useState(false);
  const [showRescheduleClock, setShowRescheduleClock] = useState(false);

  // Confirmation message states
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const durationOptions = [15, 30, 45, 60, 90, 120];
  const weekdayOptions = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  
  // Dynamic data from API
  const [colleges, setColleges] = useState([]);
  const [availableWorklets, setAvailableWorklets] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [error, setError] = useState(null);

  // Department meetings data - scheduled by higher department mentors
  // Department meetings that are relevant to the current user
  // In a real app, this would be filtered based on user's worklets, department, or invitations
  const departmentMeetings = [
    {
      id: 'dept-1',
      title: 'Monthly Review Meeting',
      date: '15-Nov-25, 10:00 AM - 11:30 AM',
      type: 'Department Review',
      organizer: 'Dr. Sarah Johnson',
      department: 'Academic Affairs',
      participants: 45,
      worklets: ['2STS04VIT', '2STS05SRM', 'AI2024B1'],
      college: 'VIT Vellore',
      status: 'upcoming',
      description: 'Monthly review of all ongoing worklets and project progress assessment',
      meetingLink: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_dept1',
      agenda: ['Project status updates', 'Resource allocation', 'Next month planning'],
      relevantToUser: true // User is invited or has worklets included
    }
  ].filter(meeting => meeting.relevantToUser); // Only show meetings relevant to current user

  const resetAddForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCollege('');
    setFormSelectedWorklets([]);
    setFormWorklet('');
    const d = new Date();
    d.setMinutes(d.getMinutes() + (30 - (d.getMinutes() % 30)) % 30, 0, 0);
    setFormStart(d.toISOString().slice(0,16));
    setFormDuration(30);
    setFormRepeatDays([]);
    setFormRepeatUntil('');
    setFormMeetingLink('');
    setFormTouched(false);
  };

  // Helper function to get unique colleges
  // Helper function to get unique colleges
  const getUniqueColleges = () => {
    return colleges.map(c => c.college_name).sort();
  };

  // Helper function to get worklets by college
  const getWorkletsByCollege = (college) => {
    return availableWorklets.filter(w => w.college === college);
  };

  // Function to open MS Teams for creating meeting links
  const openMSTeams = () => {
    try {
      // Try to open MS Teams desktop app first
      window.open('msteams://', '_blank');
      
      // Fallback to web version after a short delay if desktop app doesn't open
      setTimeout(() => {
        window.open('https://teams.microsoft.com/v2/', '_blank', 'noopener,noreferrer');
      }, 1000);
    } catch (error) {
      // If desktop app fails, open web version directly
      window.open('https://teams.microsoft.com/v2/', '_blank', 'noopener,noreferrer');
    }
  };

  // Function to calculate meeting status based on current date/time
  const calculateMeetingStatus = (meetingDate) => {
    const now = new Date();
    const currentDate = now.toDateString();
    const currentTime = now.getTime();
    
    // Parse the meeting date string (format: "15-Oct-25, 2:00 PM - 3:00 PM")
    const [datePart, timePart] = meetingDate.split(', ');
    const [day, month, year] = datePart.split('-');
    const [startTime, endTime] = timePart.split(' - ');
    
    // Convert month name to number
    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    // Parse start time
    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;
      return { hour: hour24, minute: parseInt(minutes) };
    };
    
    const startTimeObj = parseTime(startTime);
    const endTimeObj = parseTime(endTime);
    
    // Create meeting start and end Date objects
    const meetingStartDate = new Date(2000 + parseInt(year), monthMap[month], parseInt(day), startTimeObj.hour, startTimeObj.minute);
    const meetingEndDate = new Date(2000 + parseInt(year), monthMap[month], parseInt(day), endTimeObj.hour, endTimeObj.minute);
    
    // Compare with current time
    if (currentTime < meetingStartDate.getTime()) {
      return 'upcoming';
    } else if (currentTime >= meetingStartDate.getTime() && currentTime <= meetingEndDate.getTime()) {
      return 'live';
    } else {
      return 'completed';
    }
  };

  // Function to check if join button should be enabled (10 minutes before meeting start)
  const canJoinMeeting = (meetingDate) => {
    const now = new Date();
    const currentTime = now.getTime();
    
    // Parse the meeting date string (format: "15-Oct-25, 2:00 PM - 3:00 PM")
    const [datePart, timePart] = meetingDate.split(', ');
    const [day, month, year] = datePart.split('-');
    const [startTime] = timePart.split(' - ');
    
    // Convert month name to number
    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    // Parse start time
    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;
      return { hour: hour24, minute: parseInt(minutes) };
    };
    
    const startTimeObj = parseTime(startTime);
    
    // Create meeting start Date object
    const meetingStartDate = new Date(2000 + parseInt(year), monthMap[month], parseInt(day), startTimeObj.hour, startTimeObj.minute);
    
    // Check if current time is within 10 minutes before start or during the meeting
    const tenMinutesBeforeStart = meetingStartDate.getTime() - (10 * 60 * 1000); // 10 minutes in milliseconds
    
    return currentTime >= tenMinutesBeforeStart;
  };

  // Helper function to format date for new meetings
  const formatMeetingDate = (dateTimeInput, durationMins) => {
    // Handle both Date objects and datetime strings
    const start = dateTimeInput instanceof Date ? dateTimeInput : new Date(dateTimeInput);
    const end = new Date(start.getTime() + durationMins * 60000);
    const day = start.getDate();
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const month = monthNames[start.getMonth()];
    const year = String(start.getFullYear()).slice(-2);
    const formatTime = (d) => {
      let h = d.getHours();
      const m = d.getMinutes().toString().padStart(2,'0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12; if (h === 0) h = 12;
      return `${h}:${m} ${ampm}`;
    };
    return `${day}-${month}-${year}, ${formatTime(start)} - ${formatTime(end)}`;
  };

  // Meetings state - removed duplicate declaration
  // Reschedule form state
  const [rescheduleDateTime, setRescheduleDateTime] = useState('');
  const [rescheduleDuration, setRescheduleDuration] = useState(60);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleTouched, setRescheduleTouched] = useState(false);

  // Ref for repeat days dropdown click-outside handling
  const repeatDaysRef = useRef(null);

  // Close repeat days dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (repeatDaysRef.current && !repeatDaysRef.current.contains(event.target)) {
        setShowRepeatDaysDropdown(false);
      }
    };

    if (showRepeatDaysDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showRepeatDaysDropdown]);

  // Helper function to fetch worklet details with participant count
  const fetchWorkletParticipants = async (workletId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/worklets/${workletId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch worklet details');
      }
      
      const data = await response.json();
      const studentCount = data.students?.length || 0;
      const professorCount = data.professors?.length || 0;
      return studentCount + professorCount;
    } catch (error) {
      console.error(`Failed to fetch participants for worklet ${workletId}:`, error);
      return 5; // Fallback estimate
    }
  };

  // Automated Reminders functionality
  const [reminders, setReminders] = useState({});
  const [reminderSettings, setReminderSettings] = useState({
    enabled: true,
    intervals: [15, 60, 1440], // 15 min, 1 hour, 1 day before (in minutes)
    methods: ['browser', 'email'] // notification methods
  });

  // Set up reminders for a meeting
  const setupMeetingReminders = (meeting) => {
    const meetingTime = new Date(meeting.datetime).getTime();
    const now = new Date().getTime();
    
    if (meetingTime <= now) return; // Don't set reminders for past meetings
    
    reminderSettings.intervals.forEach(interval => {
      const reminderTime = meetingTime - (interval * 60 * 1000);
      
      if (reminderTime > now) {
        const timeoutId = setTimeout(() => {
          triggerReminder(meeting, interval);
        }, reminderTime - now);
        
        setReminders(prev => ({
          ...prev,
          [`${meeting.id}-${interval}`]: timeoutId
        }));
      }
    });
  };

  // Trigger reminder notification
  const triggerReminder = (meeting, minutesBefore) => {
    const formatReminderTime = (minutes) => {
      if (minutes < 60) return `${minutes} minutes`;
      if (minutes < 1440) return `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) > 1 ? 's' : ''}`;
      return `${Math.floor(minutes / 1440)} day${Math.floor(minutes / 1440) > 1 ? 's' : ''}`;
    };

    // Browser notification
    if (reminderSettings.methods.includes('browser') && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`Meeting Reminder - ${meeting.title}`, {
          body: `Starting in ${formatReminderTime(minutesBefore)}\nWorklets: ${meeting.workletCode}\nParticipants: ${meeting.participants}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `meeting-${meeting.id}`,
          data: { meetingId: meeting.id, action: 'join' },
          actions: [
            { action: 'join', title: 'Join Meeting' },
            { action: 'snooze', title: 'Remind in 5 min' }
          ]
        });
      }
    }

    // In-app notification
    showConfirmationMessage(
      `🔔 Reminder: "${meeting.title}" starts in ${formatReminderTime(minutesBefore)}`,
      'info',
      8000 // Show for 8 seconds
    );

    // Email reminder (would need backend API integration)
    if (reminderSettings.methods.includes('email')) {
      sendEmailReminder(meeting, minutesBefore);
    }
  };

  // Send email reminder (placeholder for backend integration)
  const sendEmailReminder = async (meeting, minutesBefore) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch('/api/meetings/send-reminder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId: meeting.id,
          minutesBefore,
          recipients: 'all' // Could be customized
        })
      });
    } catch (error) {
      console.error('Failed to send email reminder:', error);
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showConfirmationMessage('✅ Notifications enabled for meeting reminders');
      } else {
        showConfirmationMessage('❌ Notifications permission denied. Reminders will show in-app only.');
      }
    }
  };

  // Clear reminders for a meeting (when cancelled/rescheduled)
  const clearMeetingReminders = (meetingId) => {
    Object.keys(reminders).forEach(key => {
      if (key.startsWith(`${meetingId}-`)) {
        clearTimeout(reminders[key]);
        setReminders(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      }
    });
  };

  // Set up reminders for all upcoming meetings
  useEffect(() => {
    if (reminderSettings.enabled && meetings.length > 0) {
      meetings.forEach(meeting => {
        const meetingStatus = meeting.status || calculateMeetingStatus(meeting.date);
        if (meetingStatus === 'upcoming') {
          setupMeetingReminders(meeting);
        }
      });
    }

    return () => {
      // Clean up all timeouts when component unmounts
      Object.values(reminders).forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetings, reminderSettings.enabled]);

  // Request notification permission on component mount
  useEffect(() => {
    if (reminderSettings.enabled && reminderSettings.methods.includes('browser')) {
      requestNotificationPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Data fetching functions
  const fetchColleges = async () => {
    try {
      const data = await meetingsAPI.getColleges();
      setColleges(data);
    } catch (error) {
      console.error('Failed to fetch colleges:', error);
      setError('Failed to load colleges');
    }
  };

  const fetchMentorWorklets = async (collegeId = null) => {
    try {
      const data = await meetingsAPI.getMentorWorklets(collegeId);
      setAvailableWorklets(data);
    } catch (error) {
      console.error('Failed to fetch worklets:', error);
      setError('Failed to load worklets');
    }
  };

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const data = await meetingsAPI.getMeetings();
      
      if (!Array.isArray(data)) {
        console.error('API did not return an array:', data);
        setError('Invalid data format received from server');
        setMeetings([]);
        return;
      }
      
      // Filter out cancelled meetings and transform backend data to frontend format
      const transformedMeetings = await Promise.all(
        data
          .filter(meeting => meeting.status !== 'cancelled')
          .map(async (meeting) => {
          
          // Fetch actual participant counts for each worklet
          let totalParticipants = 0;
          if (meeting.worklets && meeting.worklets.length > 0) {
            const participantCounts = await Promise.all(
              meeting.worklets.map(async (worklet) => {
                const workletId = worklet.worklet_id || worklet.id;
                if (workletId) {
                  return await fetchWorkletParticipants(workletId);
                }
                return 5; // Fallback estimate
              })
            );
            totalParticipants = participantCounts.reduce((sum, count) => sum + count, 0);
          }
          
          return {
            id: meeting.meeting_id,
            title: meeting.title,
            date: formatMeetingDateForDisplay(meeting.start_datetime, meeting.duration_minutes),
            datetime: meeting.start_datetime,
            duration: meeting.duration_minutes,
            workletCode: meeting.worklets?.map(w => w.worklet_cert_id || w.worklet_id).join(', ') || '',
            worklets: meeting.worklets || [],
            college: meeting.college_name,
            participants: totalParticipants,
            meetingLink: meeting.meeting_link,
            organizer: meeting.organizer_name,
            status: meeting.status,
            repeat_days: meeting.repeat_days,
            repeat_until: meeting.repeat_until,
            description: meeting.description
          };
        })
      );
      
      setMeetings(transformedMeetings);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
      setError('Failed to load meetings');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format datetime for display
  const formatMeetingDateForDisplay = (datetime, durationMinutes) => {
    const start = new Date(datetime);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    
    const formatDate = (d) => {
      const day = d.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear().toString().slice(-2);
      return `${day}-${month}-${year}`;
    };
    
    const formatTime = (d) => {
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    };
    
    return `${formatDate(start)}, ${formatTime(start)} - ${formatTime(end)}`;
  };

  // Filter meetings based on selected filter and completed meetings visibility
  const filteredMeetings = meetings.filter(meeting => {
    // Determine status based on backend or calculate from time
    const meetingStatus = meeting.status || calculateMeetingStatus(meeting.date);

    // If not showing completed meetings, exclude them unless specifically filtered
    if (!showCompletedMeetings && meetingStatus === 'completed' && selectedFilter !== 'completed') {
      return false;
    }

    if (selectedFilter === 'all') return true;
    // Calculate dynamic status for filtering
    // Map filter names to meeting statuses
    const filterMap = {
      'present': 'live',
      'upcoming': 'upcoming', 
      'completed': 'completed'
    };
    return meetingStatus === (filterMap[selectedFilter] || selectedFilter);
  });

  // Sort meetings by status priority: live -> upcoming -> completed
  const sortedMeetings = filteredMeetings.sort((a, b) => {
    const statusA = a.status || calculateMeetingStatus(a.date);
    const statusB = b.status || calculateMeetingStatus(b.date);

    // Define priority order: live (1), upcoming (2), completed (3)
    const statusPriority = {
      'live': 1,
      'upcoming': 2,
      'completed': 3
    };

    const priorityA = statusPriority[statusA] || 5;
    const priorityB = statusPriority[statusB] || 5;

    return priorityA - priorityB;
  });

  // Helper function to get filtered meetings
  const getFilteredMeetings = () => {
    return meetings.filter(meeting => {
      // Determine status based on backend or calculate from time
      const meetingStatus = meeting.status || calculateMeetingStatus(meeting.date);

      // If not showing completed meetings, exclude them unless specifically filtered
      if (!showCompletedMeetings && meetingStatus === 'completed' && selectedFilter !== 'completed') {
        return false;
      }

      if (selectedFilter === 'all') return true;
      // Calculate dynamic status for filtering
      // Map filter names to meeting statuses
      const filterMap = {
        'present': 'live',
        'upcoming': 'upcoming', 
        'completed': 'completed'
      };
      return meetingStatus === (filterMap[selectedFilter] || selectedFilter);
    });
  };

  // Optimized filter counts with useMemo
  const filterCounts = useMemo(() => {
    return {
      all: meetings.length,
      upcoming: meetings.filter(m => (m.status || calculateMeetingStatus(m.date)) === 'upcoming').length,
      present: meetings.filter(m => (m.status || calculateMeetingStatus(m.date)) === 'live').length,
      completed: meetings.filter(m => (m.status || calculateMeetingStatus(m.date)) === 'completed').length
    };
  }, [meetings]);

  // Fetch data on mount
  useEffect(() => {
    fetchColleges();
    fetchMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch worklets when college is selected
  useEffect(() => {
    if (formCollege) {
      const selectedCollege = colleges.find(c => c.college_name === formCollege);
      if (selectedCollege) {
        fetchMentorWorklets(selectedCollege.college_id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formCollege]);

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterMenu && !event.target.closest('.filter-dropdown')) {
        setShowFilterMenu(false);
      }
      // Close clock pickers when clicking outside
      if (showFormClock && !event.target.closest('.form-clock-container')) {
        setShowFormClock(false);
      }
      if (showRescheduleClock && !event.target.closest('.reschedule-clock-container')) {
        setShowRescheduleClock(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterMenu, showFormClock, showRescheduleClock]);



  const handleJoinMeeting = (meetingId) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    // If a meeting link exists, open it directly; otherwise show modal (legacy behaviour)
    if (meeting.meetingLink) {
      try {
        window.open(meeting.meetingLink, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.error('Failed to open meeting link', e);
        // Fallback to modal if popup blocked
        setSelectedMeeting(meeting);
        setShowJoinModal(true);
      }
    } else {
      setSelectedMeeting(meeting);
      setShowJoinModal(true);
    }
  };

  const handleRescheduleMeeting = (meetingId) => {
    const meeting = meetings.find(m => m.id === meetingId);
    setSelectedMeeting(meeting);
    setShowRescheduleModal(true);
    if (meeting) {
      // Default new start to 24h later for convenience
      const now = new Date();
      const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      start.setMinutes(start.getMinutes() + (30 - (start.getMinutes() % 30)) % 30, 0, 0);
      setRescheduleDateTime(start.toISOString().slice(0,16));
      setRescheduleDuration(meeting.durationMins || 60);
      setRescheduleReason('');
      setRescheduleTouched(false);
      
      // Initialize enhanced controls
      setRescheduleDate(start.toISOString().split('T')[0]);
      setRescheduleHour(start.getHours());
      setRescheduleMinute(start.getMinutes());
    }
  };

  const handleCancelMeeting = (meetingId) => {
    const meeting = meetings.find(m => m.id === meetingId);
    setSelectedMeeting(meeting);
    setShowCancelModal(true);
  };

  const confirmCancelMeeting = async () => {
    if (selectedMeeting) {
      try {
        setCancellingMeeting(true);
        await meetingsAPI.cancelMeeting(selectedMeeting.id);
        showConfirmationMessage(`✅ Meeting "${selectedMeeting.title}" has been cancelled successfully.`);
        await fetchMeetings(); // Refresh list
      } catch (error) {
        console.error('Failed to cancel meeting:', error);
        const errorMessage = error.response?.data?.detail || 'Failed to cancel meeting';
        showConfirmationMessage(`❌ ${errorMessage}`);
      } finally {
        setCancellingMeeting(false);
      }
    }
    setShowCancelModal(false);
    setSelectedMeeting(null);
  };

  const confirmJoinMeeting = () => {
    if (selectedMeeting && selectedMeeting.meetingLink) {
      window.open(selectedMeeting.meetingLink, '_blank', 'noopener,noreferrer');
    }
    setShowJoinModal(false);
    setSelectedMeeting(null);
  };

  const confirmRescheduleMeeting = async () => {
    if (!selectedMeeting) return;
    if (!rescheduleDateTime) return;

    try {
      setLoading(true);
      
      // Create the new start time in local timezone format
      const dateObj = new Date(rescheduleDate);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(rescheduleHour).padStart(2, '0');
      const minutes = String(rescheduleMinute).padStart(2, '0');
      
      // Create datetime with proper timezone handling
      const localDate = new Date(rescheduleDate);
      const localDateTime = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), rescheduleHour, rescheduleMinute, 0, 0);
      
      // Get timezone offset and adjust for it
      const timezoneOffset = localDateTime.getTimezoneOffset();
      const adjustedDateTime = new Date(localDateTime.getTime() - (timezoneOffset * 60000));
      
      const rescheduleData = {
        start_datetime: adjustedDateTime.toISOString(), // Send timezone-adjusted ISO string
        duration_minutes: rescheduleDuration,
        reason: rescheduleReason.trim() || null
      };
      
      await meetingsAPI.rescheduleMeeting(selectedMeeting.id, rescheduleData);
      showConfirmationMessage(`✅ Meeting "${selectedMeeting.title}" has been rescheduled successfully.`);
      await fetchMeetings(); // Refresh list
      
      setShowRescheduleModal(false);
      setSelectedMeeting(null);
    } catch (error) {
      console.error('Failed to reschedule meeting:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to reschedule meeting';
      showConfirmationMessage(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to show confirmation messages
  const showConfirmationMessage = (message) => {
    setConfirmationMessage(message);
    setShowConfirmation(true);
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setShowConfirmation(false);
    }, 4000);
  };

  // Helper function to parse custom date format to Date object
  const parseCustomDateString = (dateString) => {
    // Format: "11-Oct-25, 2:00 PM - 3:00 PM"
    const [datePart, timePart] = dateString.split(', ');
    const [day, month, year] = datePart.split('-');
    const [startTime] = timePart.split(' - ');
    
    // Convert month name to number
    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    // Parse start time
    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;
      return { hour: hour24, minute: parseInt(minutes) };
    };
    
    const startTimeObj = parseTime(startTime);
    
    // Create Date object
    return new Date(2000 + parseInt(year), monthMap[month], parseInt(day), startTimeObj.hour, startTimeObj.minute);
  };

  // Function to check for meeting time conflicts
  const checkMeetingConflicts = (newMeetingStartTime, durationMins, excludeId = null) => {
    // Defensive: ensure provided start time is a valid Date
    if (!newMeetingStartTime || isNaN(newMeetingStartTime.getTime())) return [];

    const newEndTime = new Date(newMeetingStartTime.getTime() + durationMins * 60000);
    
    const conflicts = meetings.filter(meeting => {
      // Skip the meeting being rescheduled
      if (excludeId && meeting.id === excludeId) return false;
      
      // Parse existing meeting time - use startISO if available, otherwise parse custom date format
      let existingStart;
      if (meeting.startISO) {
        existingStart = new Date(meeting.startISO);
      } else {
        existingStart = parseCustomDateString(meeting.date);
      }
      
      const existingEnd = new Date(existingStart.getTime() + (meeting.durationMins || 60) * 60000);
      
      // Only consider conflicts on the same calendar date (local) as the requested meeting
      const sameLocalDate = (
        existingStart.getFullYear() === newMeetingStartTime.getFullYear() &&
        existingStart.getMonth() === newMeetingStartTime.getMonth() &&
        existingStart.getDate() === newMeetingStartTime.getDate()
      );

      if (!sameLocalDate) return false;

      // Strict overlap detection: new start is before existing end AND new end is after existing start
      const newStartsBeforeExistingEnds = newMeetingStartTime < existingEnd;
      const newEndsAfterExistingStarts = newEndTime > existingStart;
      const hasOverlap = newStartsBeforeExistingEnds && newEndsAfterExistingStarts;
      
      return hasOverlap;
    });
    
    return conflicts;
  };

  // Function to find next available time slot
  const findNextAvailableSlot = (preferredStartTime, durationMins, excludeId = null) => {
    let testTime = new Date(preferredStartTime);
    const maxAttempts = 48; // Check up to 24 hours ahead (in 30-min increments)
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const conflicts = checkMeetingConflicts(testTime, durationMins, excludeId);
      
      if (conflicts.length === 0) {
        return testTime;
      }
      
      // Move to next 30-minute slot
      testTime = new Date(testTime.getTime() + 30 * 60000);
    }
    
    // If no slot found, return original time (user will see warning)
    return preferredStartTime;
  };

  // Helper functions for enhanced date/time selection
  const updateFormDateTime = (date, hour, minute) => {
    const dateTime = new Date(date);
    dateTime.setHours(hour, minute, 0, 0);
    
    // Create local datetime string to avoid timezone conversion issues
    const year = dateTime.getFullYear();
    const month = String(dateTime.getMonth() + 1).padStart(2, '0');
    const day = String(dateTime.getDate()).padStart(2, '0');
    const hours = String(hour).padStart(2, '0');
    const minutes = String(minute).padStart(2, '0');
    
    const localDateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
    setFormStart(localDateTimeString);
  };

  const updateRescheduleDateTime = (date, hour, minute) => {
    const dateTime = new Date(date);
    dateTime.setHours(hour, minute, 0, 0);
    
    // Create local datetime string to avoid timezone conversion issues
    const year = dateTime.getFullYear();
    const month = String(dateTime.getMonth() + 1).padStart(2, '0');
    const day = String(dateTime.getDate()).padStart(2, '0');
    const hours = String(hour).padStart(2, '0');
    const minutes = String(minute).padStart(2, '0');
    
    const localDateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
    setRescheduleDateTime(localDateTimeString);
  };

  // Update formStart when enhanced controls change
  const handleFormDateChange = (newDate) => {
    setFormDate(newDate);
    updateFormDateTime(newDate, formHour, formMinute);
  };

  const handleFormHourChange = (newHour) => {
    setFormHour(newHour);
    updateFormDateTime(formDate, newHour, formMinute);
  };

  const handleFormMinuteChange = (newMinute) => {
    setFormMinute(newMinute);
    updateFormDateTime(formDate, formHour, newMinute);
  };

  // Update rescheduleDateTime when enhanced controls change
  const handleRescheduleDateChange = (newDate) => {
    setRescheduleDate(newDate);
    updateRescheduleDateTime(newDate, rescheduleHour, rescheduleMinute);
  };

  const handleRescheduleHourChange = (newHour) => {
    setRescheduleHour(newHour);
    updateRescheduleDateTime(rescheduleDate, newHour, rescheduleMinute);
  };

  const handleRescheduleMinuteChange = (newMinute) => {
    setRescheduleMinute(newMinute);
    updateRescheduleDateTime(rescheduleDate, rescheduleHour, newMinute);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
      case 'live': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
      case 'completed': return 'bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400';
      default: return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
    }
  };



  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <LeftSidebar />
      
      <main className="flex-1 px-[2vw] py-[1.5vh] overflow-y-auto [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <header className="flex justify-between items-center mb-[3vh]">
          <div>
            <h1 className="text-[clamp(1.75rem,3.5vw,2.25rem)] font-bold text-black dark:text-white">
              Meetings Dashboard
            </h1>
            <p className="text-[clamp(0.875rem,1.2vw,1rem)] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Manage department and mentor meetings
            </p>
          </div>
          
          {/* Settings Actions */}
          <div className="flex items-center gap-3">
            {/* Reminder Settings Button */}
            <button
              onClick={() => setShowReminderSettings(!showReminderSettings)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm font-medium ${
                reminderSettings.enabled 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.18 0 2.34-.2 3.44-.58L12 17V7h5.28c-.34-2.84-2.62-5.14-5.46-5.47C11.56 1.18 11.29 1 11 1s-.56.18-.82.53C9.38 1.86 9.38 2.14 9.62 2.47 9.86 2.8 10.4 2.8 10.64 2.47 10.88 2.14 11.12 2 11 2z" />
              </svg>
              Reminders
              {reminderSettings.enabled && (
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              )}
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-slate-200 dark:border-slate-600">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedTab('department-meetings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'department-meetings'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                Review meeting 
              </button>
              <button
                onClick={() => setSelectedTab('mentor-meetings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'mentor-meetings'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                Add-oc meeting
              </button>
            </nav>
          </div>
        </div>

        {/* Department Meetings Section */}
        {selectedTab === 'department-meetings' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Department Scheduled Meetings
                </h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Meetings scheduled by higher department with fixed meeting links
              </p>
            </div>

            <div className="p-6">
              <div className="grid gap-4">
                {departmentMeetings.map((meeting) => {
                  const status = calculateMeetingStatus(meeting.date);
                  return (
                    <div
                      key={meeting.id}
                      className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 border border-slate-200 dark:border-slate-600 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                              {meeting.title}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                              {status}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Clock className="w-4 h-4" />
                              <span>{meeting.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Users className="w-4 h-4" />
                              <span>{meeting.participants} participants</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <User className="w-4 h-4" />
                              <span>{meeting.organizer}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Settings className="w-4 h-4" />
                              <span>{meeting.department}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <MapPin className="w-4 h-4" />
                              <span>{meeting.college}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Worklets:</span>
                            {meeting.worklets.map((worklet, index) => (
                              <span
                                key={worklet}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs font-medium"
                              >
                                {worklet}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                            {meeting.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {/* Only show Join button if meeting is not completed and can be joined (10 min before start) */}
                          {status !== 'completed' && canJoinMeeting(meeting.date) && (
                            <button
                              onClick={() => window.open(meeting.meetingLink, '_blank')}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Video className="w-4 h-4" />
                              Join Meeting
                            </button>
                          )}
                          {/* Show disabled Join button with tooltip if meeting is upcoming but not yet joinable */}
                          {status === 'upcoming' && !canJoinMeeting(meeting.date) && (
                            <button
                              disabled
                              title="Join button will be available 10 minutes before meeting start"
                              className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-60"
                            >
                              <Video className="w-4 h-4" />
                              Join Meeting
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Mentor Meetings Section */}
        {selectedTab === 'mentor-meetings' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Toolbar */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Mentor Scheduled Meetings
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { resetAddForm(); setShowAddModal(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  Add Meeting
                </button>
                <div className="relative filter-dropdown">
                  <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                      showFilterMenu 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300' 
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {selectedFilter === 'all' ? 'All Meetings' : selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showFilterMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-2 backdrop-blur-sm">
                      {[
                        { value: 'all', label: 'All Meetings', count: filterCounts.all },
                        { value: 'upcoming', label: 'Upcoming', count: filterCounts.upcoming },
                        { value: 'present', label: 'Present', count: filterCounts.present },
                        { value: 'completed', label: 'Completed', count: filterCounts.completed }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSelectedFilter(option.value);
                            setShowFilterMenu(false);
                          }}
                          className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                            selectedFilter === option.value 
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium' 
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>{option.label}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            selectedFilter === option.value 
                              ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300' 
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}>
                            {option.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Meetings you can schedule and manage for your worklets
            </p>
          </div>

          {/* Meetings List */}
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <div className="text-slate-500 dark:text-slate-400">Loading meetings...</div>
              </div>
            ) : sortedMeetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  No meetings found
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-center mb-6">
                  {selectedFilter === 'all' 
                    ? "You don't have any meetings scheduled yet." 
                    : `No ${selectedFilter} meetings at the moment.`}
                </p>
                {selectedFilter === 'all' && (
                  <button
                    onClick={() => { resetAddForm(); setShowAddModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Schedule your first meeting
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedMeetings.map((meeting) => {
                  // Determine status from backend or calculate based on time
                  const status = meeting.status || calculateMeetingStatus(meeting.date);
                  return (
                    <div
                      key={meeting.id}
                      className="group bg-gradient-to-r from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-600 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                              {meeting.title}
                            </h3>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                              {status}
                            </span>
                            {status === 'live' && (
                              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-medium">LIVE</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Calendar className="w-4 h-4 text-blue-500" />
                              <span>{meeting.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Users className="w-4 h-4 text-green-500" />
                              <span>{meeting.participants} participants</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <MapPin className="w-4 h-4 text-orange-500" />
                              <span>{meeting.college}</span>
                            </div>
                          </div>
                          
                          {/* Display worklets prominently */}
                          {meeting.workletCode && (
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Worklets:</span>
                              <div className="flex flex-wrap gap-1">
                                {meeting.workletCode.split(', ').map((code, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium border border-blue-200 dark:border-blue-700"
                                  >
                                    {code}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {meeting.description}
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-6">
                          {/* Only show Join button if meeting is not completed and can be joined (10 min before start) */}
                          {status !== 'completed' && canJoinMeeting(meeting.date) && (
                            <button
                              onClick={() => handleJoinMeeting(meeting.id)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                status === 'live' 
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg' 
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                              }`}
                            >
                              {status === 'live' ? 'Join Now' : 'Join'}
                            </button>
                          )}
                          {/* Show disabled Join button with tooltip if meeting is upcoming but not yet joinable */}
                          {status === 'upcoming' && !canJoinMeeting(meeting.date) && (
                            <button
                              disabled
                              title="Join button will be available 10 minutes before meeting start"
                              className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-60 text-sm font-medium"
                            >
                              Join
                            </button>
                          )}
                          
                          {/* Reschedule and Cancel actions (cancelled meetings are filtered out) */}
                          <>
                            {status !== 'completed' ? (
                              <>
                                <button
                                  onClick={() => handleRescheduleMeeting(meeting.id)}
                                  className="px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
                                >
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => handleCancelMeeting(meeting.id)}
                                  className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-lg text-center">
                                Meeting Completed
                              </div>
                            )}
                          </>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Show Completed Meetings Button */}
                {!showCompletedMeetings && selectedFilter === 'all' && meetings.some(m => calculateMeetingStatus(m.date) === 'completed') && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowCompletedMeetings(true)}
                      className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl transition-all duration-200 flex items-center gap-2 mx-auto"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      more ({meetings.filter(m => calculateMeetingStatus(m.date) === 'completed').length})
                    </button>
                  </div>
                )}
                
                {/* Hide Completed Meetings Button */}
                {showCompletedMeetings && selectedFilter === 'all' && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowCompletedMeetings(false)}
                      className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl transition-all duration-200 flex items-center gap-2 mx-auto"
                    >
                      <svg className="w-4 h-4 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Hide Completed Meetings
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}
      </main>

      <RightSidebar />

      {/* Cancel Meeting Modal */}
      {showCancelModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl relative">
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl font-bold"
                disabled={cancellingMeeting}
              >
                ×
              </button>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Do you want to cancel meeting scheduled at {selectedMeeting.date} for worklet {selectedMeeting.workletCode}?
              </h3>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-6 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={cancellingMeeting}
                >
                  NO
                </button>
                <button
                  onClick={confirmCancelMeeting}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={cancellingMeeting}
                >
                  {cancellingMeeting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    'YES'
                  )}
                </button>
              </div>
            </div>

            {/* Loading Overlay */}
            {cancellingMeeting && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 flex flex-col items-center space-y-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600"></div>
                  <div className="text-center">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">Cancelling Meeting...</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Please wait</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Join Meeting Modal */}
      {showJoinModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setShowJoinModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Join meeting "{selectedMeeting.title}" scheduled for {selectedMeeting.date}?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                You will be redirected to the meeting room with {selectedMeeting.participants} participants.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="px-6 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmJoinMeeting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Join Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Meeting Modal */}
      {showRescheduleModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl mx-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowRescheduleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl font-bold z-10"
              aria-label="Close reschedule modal"
            >
              ×
            </button>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 text-center">Reschedule Meeting</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 text-center">Current: {selectedMeeting.date}</p>
            <form
              onSubmit={(e) => { e.preventDefault(); confirmRescheduleMeeting(); }}
              className="space-y-6"
            >
              {/* Simple Date/Time Selection */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Date</label>
                    <input
                      type="date"
                      value={rescheduleDate}
                      min={(() => {
                        const now = new Date();
                        return now.toISOString().split('T')[0];
                      })()}
                      onChange={(e) => {
                        const selectedDate = new Date(e.target.value);
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);
                        selectedDate.setHours(0, 0, 0, 0);
                        
                        if (selectedDate < now) {
                          alert('Please select a future date.');
                          return;
                        }
                        handleRescheduleDateChange(e.target.value);
                      }}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Time</label>
                    <div className="relative reschedule-clock-container">
                      <button
                        type="button"
                        onClick={() => setShowRescheduleClock(!showRescheduleClock)}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-600"
                      >
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>
                            {(() => {
                              const display12Hour = rescheduleHour === 0 ? 12 : rescheduleHour > 12 ? rescheduleHour - 12 : rescheduleHour;
                              const ampm = rescheduleHour < 12 ? 'AM' : 'PM';
                              return `${display12Hour}:${rescheduleMinute.toString().padStart(2, '0')} ${ampm}`;
                            })()}
                          </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showRescheduleClock ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Backdrop when clock is open */}
                      {showRescheduleClock && (
                        <div 
                          className="fixed inset-0 bg-black/20 z-40"
                          onClick={() => setShowRescheduleClock(false)}
                        />
                      )}
                      
                      <CompactClockPicker
                        hour={rescheduleHour}
                        minute={rescheduleMinute}
                        onTimeChange={(newHour, newMinute) => {
                          setRescheduleHour(newHour);
                          setRescheduleMinute(newMinute);
                          updateRescheduleDateTime(rescheduleDate, newHour, newMinute);
                        }}
                        isOpen={showRescheduleClock}
                        onClose={() => setShowRescheduleClock(false)}
                      />
                    </div>
                  </div>
                </div>

                {/* Duration Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Duration</label>
                  <select
                    value={rescheduleDuration}
                    onChange={(e) => setRescheduleDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {[15,30,45,60,90,120].map(d => (
                      <option key={d} value={d}>
                        {d === 60 ? '1 hour' : d < 60 ? `${d} minutes` : `${d/60} hours`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Reason (Optional)</label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Optional: add a reason for audit trail"
                  className="w-full h-28 resize-none border rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
                />
              </div>
              <div className="flex justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-5 py-2 rounded-md bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-400 dark:hover:bg-slate-500 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                  disabled={!rescheduleDateTime}
                >
                  Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Meeting Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 p-8 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-all duration-200"
              aria-label="Close add meeting form"
            >
              ✕
            </button>
            
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Create New Meeting</h3>
              <p className="text-slate-600 dark:text-slate-400">Schedule a meeting for your worklet participants</p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setFormTouched(true);
                
                // Validate required fields
                if (!formMeetingLink.trim() || !formCollege || formSelectedWorklets.length === 0) {
                  return;
                }

                try {
                  // Create meeting datetime in local timezone and convert properly
                  const dateObj = new Date(formDate);
                  const year = dateObj.getFullYear();
                  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const day = String(dateObj.getDate()).padStart(2, '0');
                  const hours = String(formHour).padStart(2, '0');
                  const minutes = String(formMinute).padStart(2, '0');
                  
                  // Create datetime with proper timezone handling
                  const localDate = new Date(formDate);
                  const localDateTime = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), formHour, formMinute, 0, 0);
                  
                  // Get timezone offset and adjust for it
                  const timezoneOffset = localDateTime.getTimezoneOffset();
                  const adjustedDateTime = new Date(localDateTime.getTime() - (timezoneOffset * 60000));
                  
                  // Get college_id from colleges array
                  const selectedCollege = colleges.find(c => c.college_name === formCollege);
                  if (!selectedCollege) {
                    showConfirmationMessage('❌ College not found');
                    return;
                  }
                  
                  // Get worklet details for consecutive meetings
                  const selectedWorkletDetails = formSelectedWorklets.map(selectedId => {
                    const worklet = availableWorklets.find(w => w.id === selectedId);
                    if (!worklet) {
                      console.error(`Worklet not found: ${selectedId}`);
                      return null;
                    }
                    return worklet;
                  }).filter(worklet => worklet !== null);
                  
                  if (selectedWorkletDetails.length === 0) {
                    showConfirmationMessage('❌ No valid worklets found. Please try again.');
                    return;
                  }
                  
                  setCreatingMeeting(true);
                  
                  // Create consecutive meetings for multiple worklets
                  if (formSelectedWorklets.length > 1) {
                    let successCount = 0;
                    let currentStartTime = new Date(adjustedDateTime);
                    
                    // Create meetings sequentially
                    for (let i = 0; i < selectedWorkletDetails.length; i++) {
                      const worklet = selectedWorkletDetails[i];
                      
                      try {
                        const meetingData = {
                          title: formTitle || `Meeting - ${worklet.name || worklet.worklet_cert_id}`,
                          description: formDescription || `Meeting for worklet: ${worklet.name || worklet.worklet_cert_id}`,
                          college_id: selectedCollege.college_id,
                          worklet_ids: [worklet.id],
                          start_datetime: currentStartTime.toISOString(),
                          duration_minutes: formDuration,
                          meeting_link: formMeetingLink,
                          repeat_days: formRepeatDays.length > 0 ? formRepeatDays.join(',') : null,
                          repeat_until: formRepeatUntil || null
                        };
                        
                        await meetingsAPI.createMeeting(meetingData);
                        successCount++;
                        
                        // Move start time for next meeting (current + duration)
                        currentStartTime = new Date(currentStartTime.getTime() + (formDuration * 60 * 1000));
                        
                      } catch (error) {
                        console.error(`Failed to create meeting for worklet ${worklet.worklet_cert_id}:`, error);
                      }
                    }
                    
                    // Show success message
                    if (successCount === selectedWorkletDetails.length) {
                      showConfirmationMessage(`✅ Successfully created ${successCount} consecutive meetings for all selected worklets!`);
                    } else {
                      showConfirmationMessage(`⚠️ Created ${successCount} out of ${selectedWorkletDetails.length} meetings. Some meetings may have failed.`);
                    }
                    
                  } else {
                    // Single worklet - create single meeting (existing logic)
                    const worklet = selectedWorkletDetails[0];
                    
                    const meetingData = {
                      title: formTitle || `Meeting - ${worklet.name || worklet.worklet_cert_id}`,
                      description: formDescription || `Meeting for worklet: ${worklet.name || worklet.worklet_cert_id}`,
                      college_id: selectedCollege.college_id,
                      worklet_ids: [worklet.id],
                      start_datetime: adjustedDateTime.toISOString(),
                      duration_minutes: formDuration,
                      meeting_link: formMeetingLink,
                      repeat_days: formRepeatDays.length > 0 ? formRepeatDays.join(',') : null,
                      repeat_until: formRepeatUntil || null
                    };
                    
                    await meetingsAPI.createMeeting(meetingData);
                    
                    showConfirmationMessage(`✅ Successfully created meeting for worklet ${worklet.worklet_cert_id}!`);
                  }
                  
                  // Refresh meetings list
                  await fetchMeetings();
                  
                  // Close modal and reset form
                  setShowAddModal(false);
                  resetAddForm();
                  
                } catch (error) {
                  console.error('Failed to create meeting:', error);
                  const errorMessage = error.response?.data?.detail || error.message || 'Failed to create meeting. Please try again.';
                  showConfirmationMessage(`❌ ${errorMessage}`);
                } finally {
                  setCreatingMeeting(false);
                }
              }}
              className="space-y-8"
            >
              {/* Title */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Meeting Title</label>
                <input
                  type="text"
                  placeholder="Enter meeting title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <input
                  type="text"
                  placeholder="Brief description of the meeting"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* College Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Select College <span className="text-red-500">*</span></label>
                <select
                  value={formCollege}
                  onChange={(e) => {
                    setFormCollege(e.target.value);
                    setFormSelectedWorklets([]); // Reset worklet selection when college changes
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="" className="bg-white dark:bg-slate-800">
                    {colleges.length === 0 ? 'Loading colleges...' : 'Choose a college...'}
                  </option>
                  {getUniqueColleges().map(college => (
                    <option key={college} value={college} className="bg-white dark:bg-slate-800">
                      {college}
                    </option>
                  ))}
                </select>
                {colleges.length === 0 && !loading && (
                  <p className="text-xs text-red-500 mt-1">No colleges available. Please contact administrator.</p>
                )}
                {error && (
                  <p className="text-xs text-red-500 mt-1">{error}</p>
                )}
              </div>

              {/* Multiple Worklet Selection */}
              {formCollege && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Select Worklets from {formCollege} <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 max-h-40 overflow-y-auto">
                    {getWorkletsByCollege(formCollege).map(worklet => (
                      <label key={worklet.id} className="flex items-center space-x-3 p-2 hover:bg-white dark:hover:bg-slate-600 rounded-lg cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={formSelectedWorklets.includes(worklet.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormSelectedWorklets(prev => [...prev, worklet.id]);
                            } else {
                              setFormSelectedWorklets(prev => prev.filter(id => id !== worklet.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{worklet.name}</span>
                      </label>
                    ))}
                  </div>
                  {formSelectedWorklets.length > 0 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                        Selected Worklets ({formSelectedWorklets.length}):
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {formSelectedWorklets.join(', ')}
                      </p>
                      {formSelectedWorklets.length > 1 && (
                        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-700">
                          <p className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
                            <span className="text-amber-500">⚡</span>
                            Consecutive Meetings
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            Multiple worklets will create separate consecutive meetings, each lasting {formDuration} minutes starting from the selected time.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Simple Date / Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Start Date <span className="text-red-500">*</span></label>
                  
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => {
                      handleFormDateChange(e.target.value);
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Start Time <span className="text-red-500">*</span></label>
                  
                  <div className="relative form-clock-container">
                    <button
                      type="button"
                      onClick={() => setShowFormClock(!showFormClock)}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>
                          {(() => {
                            const display12Hour = formHour === 0 ? 12 : formHour > 12 ? formHour - 12 : formHour;
                            const ampm = formHour < 12 ? 'AM' : 'PM';
                            return `${display12Hour}:${formMinute.toString().padStart(2, '0')} ${ampm}`;
                          })()}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showFormClock ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <CompactClockPicker
                      hour={formHour}
                      minute={formMinute}
                      onTimeChange={(newHour, newMinute) => {
                        setFormHour(newHour);
                        setFormMinute(newMinute);
                        updateFormDateTime(formDate, newHour, newMinute);
                      }}
                      isOpen={showFormClock}
                      onClose={() => setShowFormClock(false)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Duration</label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {durationOptions.map(min => (
                      <option key={min} value={min} className="bg-white dark:bg-slate-800">
                        {min === 60 ? '1 hour' : min < 60 ? `${min} minutes` : `${min/60} hours`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Repeat Days / Repeat Until */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Select Repeat Days</label>
                  <div className="relative" ref={repeatDaysRef}>
                    <button
                      type="button"
                      onClick={() => setShowRepeatDaysDropdown(!showRepeatDaysDropdown)}
                      className="w-full text-left border-0 border-b border-slate-200 dark:border-slate-600 bg-transparent focus:ring-0 focus:border-blue-500 py-1 text-slate-900 dark:text-white hover:border-blue-400 transition-colors"
                    >
                      {formRepeatDays.length === 0 ? 'Select Repeat Days' : formRepeatDays.join(', ')}
                    </button>
                    {showRepeatDaysDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-700 shadow-lg rounded-md border border-slate-200 dark:border-slate-600 max-h-48 overflow-auto">
                        {weekdayOptions.map(day => {
                          const active = formRepeatDays.includes(day);
                          return (
                            <div
                              key={day}
                              onClick={() => {
                                setFormRepeatDays(prev => active ? prev.filter(d => d!==day) : [...prev, day]);
                              }}
                              className={`px-3 py-2 text-sm cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-600 ${active ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}
                            >
                              {day}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col opacity-100">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Repeat Until</label>
                  <input
                    type="date"
                    disabled={formRepeatDays.length === 0}
                    value={formRepeatUntil}
                    onChange={(e) => setFormRepeatUntil(e.target.value)}
                    className={`w-full border-0 border-b bg-transparent focus:ring-0 focus:border-blue-500 text-slate-900 dark:text-white ${formRepeatDays.length===0 ? 'border-slate-300 dark:border-slate-600 text-slate-400 cursor-not-allowed' : 'border-slate-200 dark:border-slate-600'}`}
                  />
                </div>
              </div>

              {/* Meeting Link */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Meeting Link <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://teams.microsoft.com/..."
                    value={formMeetingLink}
                    onChange={(e) => setFormMeetingLink(e.target.value)}
                    onBlur={() => setFormTouched(true)}
                    className={`w-full px-4 py-3 pr-12 border rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      !formMeetingLink && formTouched 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-transparent'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={openMSTeams}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group ${formMeetingLink.trim() ? 'opacity-0 invisible' : 'opacity-100 visible'}`}
                    title="Open Microsoft Teams to create meeting link"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                </div>
                {!formMeetingLink && formTouched && (
                  <p className="text-sm text-red-600">Meeting link is required</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold rounded-xl py-4 transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
                  disabled={!formMeetingLink || !formCollege || formSelectedWorklets.length === 0 || creatingMeeting}
                >
                  {creatingMeeting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Creating Meeting...</span>
                    </>
                  ) : (
                    (!formMeetingLink || !formCollege || formSelectedWorklets.length === 0) ? 'Please fill required fields' : 'Create Meeting'
                  )}
                </button>
                {(!formMeetingLink || !formCollege || formSelectedWorklets.length === 0) && formTouched && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 text-center">
                    {!formCollege ? 'Please select a college' : 
                     formSelectedWorklets.length === 0 ? 'Please select at least one worklet' : 
                     'Meeting link is required'}
                  </p>
                )}
              </div>
            </form>

            {/* Loading Overlay */}
            {creatingMeeting && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-2xl z-50">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Creating Meeting...</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Please wait while we set everything up</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Message Toast */}
      {showConfirmation && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-4 transform transition-all duration-300 ease-out">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {confirmationMessage.startsWith('✅') ? (
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                </div>
              ) : (
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400 text-sm">✕</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {confirmationMessage.replace(/^[✅❌]\s*/, '')}
              </p>
            </div>
            <button
              onClick={() => setShowConfirmation(false)}
              className="flex-shrink-0 ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Reminder Settings Modal */}
      {showReminderSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Meeting Reminders
                </h3>
                <button
                  onClick={() => setShowReminderSettings(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Enable/Disable Reminders */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-white">
                      Enable Reminders
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Get notified before meetings start
                    </p>
                  </div>
                  <button
                    onClick={() => setReminderSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      reminderSettings.enabled 
                        ? 'bg-blue-600' 
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        reminderSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {reminderSettings.enabled && (
                  <>
                    {/* Reminder Intervals */}
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                        Reminder Times
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: 15, label: '15 minutes before' },
                          { value: 60, label: '1 hour before' },
                          { value: 1440, label: '1 day before' }
                        ].map(interval => (
                          <label key={interval.value} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={reminderSettings.intervals.includes(interval.value)}
                              onChange={(e) => {
                                setReminderSettings(prev => ({
                                  ...prev,
                                  intervals: e.target.checked
                                    ? [...prev.intervals, interval.value]
                                    : prev.intervals.filter(i => i !== interval.value)
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                              {interval.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Notification Methods */}
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                        Notification Methods
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={reminderSettings.methods.includes('browser')}
                            onChange={(e) => {
                              setReminderSettings(prev => ({
                                ...prev,
                                methods: e.target.checked
                                  ? [...prev.methods, 'browser']
                                  : prev.methods.filter(m => m !== 'browser')
                              }));
                            }}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                            Browser notifications
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={reminderSettings.methods.includes('email')}
                            onChange={(e) => {
                              setReminderSettings(prev => ({
                                ...prev,
                                methods: e.target.checked
                                  ? [...prev.methods, 'email']
                                  : prev.methods.filter(m => m !== 'email')
                              }));
                            }}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                            Email notifications
                          </span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-600">
                  <button
                    onClick={() => setShowReminderSettings(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowReminderSettings(false);
                      showConfirmationMessage('✅ Reminder settings saved');
                      
                      // Re-setup reminders for all upcoming meetings with new settings
                      if (reminderSettings.enabled) {
                        meetings.forEach(meeting => {
                          clearMeetingReminders(meeting.id);
                          const meetingStatus = meeting.status || calculateMeetingStatus(meeting.date);
                          if (meetingStatus === 'upcoming') {
                            setupMeetingReminders(meeting);
                          }
                        });
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Meetings;