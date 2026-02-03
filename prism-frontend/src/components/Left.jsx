import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Home, BarChart, GraduationCap, Calendar, Folder, Settings, Moon, Sun, Info, LogOut, Award, MessageCircle,User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';
import { ThemeContext } from '../context/ThemeContext';
import { useWebSocket } from '../context/WebSocketContext';
import profilePic from '../assets/profilePic.jpg';
import secureAPI from '../services/secureAPI';

// --- PORTAL COMPONENT IS NOW DEFINED INSIDE THIS FILE ---
const Portal = ({ children }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Ensure the portal root element exists
        let portalRoot = document.getElementById('portal-root');
        if (!portalRoot) {
            portalRoot = document.createElement('div');
            portalRoot.id = 'portal-root';
            document.body.appendChild(portalRoot);
        }

        return () => setMounted(false);
    }, []);

    const portalRoot = typeof document !== 'undefined' ? document.getElementById('portal-root') : null;

    return mounted && portalRoot ? createPortal(children, portalRoot) : null;
};
// --- END OF PORTAL DEFINITION ---


// Reusable Settings Menu Item
const SettingsMenuItem = ({ icon, title, subtitle, onClick, colorClass = 'text-blue-500' }) => (
    <button onClick={onClick} className="w-full flex items-center p-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200">
        <div className={`p-2 rounded-full bg-opacity-10 ${colorClass.replace('text-', 'bg-')} mr-3`}>
            {React.cloneElement(icon, { className: `w-5 h-5 ${colorClass}` })}
        </div>
        <div>
            <h3 className="font-semibold text-sm text-slate-800 dark:text-white">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
    </button>
);


const LeftSidebar = () => {
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSettingsIconRotating, setIsSettingsIconRotating] = useState(false);
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
    
    // Get user data from validated JWT token instead of localStorage
    const [userData, setUserData] = useState(null);

    // Use global theme state from context
    const { isDarkMode, toggleTheme } = useContext(ThemeContext);
    const { unreadCount } = useWebSocket();

    // Get user data on component mount
    useEffect(() => {
        const getCurrentUserFromToken = () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) return null;
                
                // Simple JWT decode for client-side (validation done server-side)
                const base64Url = token.split('.')[1];
                if (!base64Url) return null;
                
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                
                const decoded = JSON.parse(jsonPayload);
                const currentTime = Date.now() / 1000;
                
                if (decoded.exp < currentTime) {
                    return null; // Token expired
                }
                
                return decoded;
            } catch (error) {
                return null;
            }
        };
        
        setUserData(getCurrentUserFromToken());
    }, []);

    // Update unread message status based on WebSocket unreadCount
    useEffect(() => {
        setHasUnreadMessages(unreadCount > 0);
    }, [unreadCount]);

    // Floating UI hook for robust menu positioning
    const { x, y, refs, strategy } = useFloating({
        whileElementsMounted: autoUpdate,
        placement: 'right-end',
        middleware: [offset(16), flip(), shift()],
    });

    // Event handlers
    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_role');
        navigate('/');
    };
    const handleAboutUs = () => {
        alert('About PRISM: Professional Resource and Internship Support Management.');
        setIsSettingsOpen(false);
    };

    // Effect to close menu on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (refs.domReference.current && !refs.domReference.current.contains(event.target) &&
                refs.floating.current && !refs.floating.current.contains(event.target)) {
                setIsSettingsOpen(false);
            }
        };
        if (isSettingsOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSettingsOpen, refs]);

    return (
        <aside className="w-[clamp(5rem,8vw,7.5rem)] h-screen sticky top-0 bg-gradient-to-t from-purple-300 via-indigo-50 to-blue-100 dark:from-slate-800 dark:via-slate-900 dark:to-black flex flex-col py-[1vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <nav className="flex flex-col gap-[2vh] items-center">
                {/* Role-based navigation - Using validated token data */}
                {userData && userData.role && userData.role.toLowerCase() === 'student' ? (
                    <>
                        <SidebarItem icon={<Home size={20} />} label="Home" onClick={() => navigate('/student-dashboard')} />
                        <SidebarItem icon={<MessageCircle size={20} />} label="Chats" onClick={() => navigate('/student-chat')} hasUnread={hasUnreadMessages} unreadCount={unreadCount} />
                        <SidebarItem icon={<Award size={20} />} label="Portfolio" onClick={() => navigate('/portfolio')} />
                        <SidebarItem icon={<User size={20} />} label="Profile" onClick={() => navigate('/student-profile')} />
                    </>
                ) : userData && userData.role && userData.role.toLowerCase() === 'professor' ? (
                    <>
                        <SidebarItem icon={<Home size={20} />} label="Home" onClick={() => navigate('/professor-dashboard')} />
                        <SidebarItem icon={<MessageCircle size={20} />} label="Chats" onClick={() => navigate('/professor-chat')} hasUnread={hasUnreadMessages} unreadCount={unreadCount} />
                        <SidebarItem icon={<Award size={20} />} label="Portfolio" onClick={() => navigate('/portfolio')} />
                        <SidebarItem icon={<User size={20} />} label="Profile" onClick={() => navigate('/professor-profile')} />
                    </>
                ) : userData && userData.role ? (
                    <>
                        <SidebarItem icon={<Home size={20} />} label="Home" onClick={() => navigate('/home')} />
                        <SidebarItem icon={<MessageCircle size={20} />} label="Chats" onClick={() => navigate('/mentor-chat')} hasUnread={hasUnreadMessages} unreadCount={unreadCount} />
                        <SidebarItem icon={<Calendar size={20} />} label="Meetings" onClick={() => navigate('/meeting')} />
                        <SidebarItem icon={<Folder size={20} />} label="Portfolio" onClick={() => navigate('/portfolio')} />
                                                                        {/* Top separator for Dashboard/Academia group */}
                                                                        <div className="w-[75%] mx-auto my-[1.2vh]">
                                                                            <hr
                                                                                className="h-1 rounded-full border-0 bg-gradient-to-r from-indigo-500 via-purple-400 to-blue-400 dark:from-indigo-700 dark:via-purple-800 dark:to-blue-700 shadow-md opacity-95"
                                                                            />
                                                                        </div>
                                                                        <div className="flex flex-col gap-[1vh] items-center bg-white/60 dark:bg-slate-800/60 rounded-xl py-[0.7vh] shadow-sm border border-slate-200 dark:border-slate-700 w-[90%] mx-auto">
                                                                            <SidebarItem icon={<BarChart size={20} />} label="Dashboard" onClick={() => navigate('/Dashboard')} />
                                                                            <SidebarItem icon={<GraduationCap size={20} />} label="Academia" onClick={() => navigate('/academia')} />
                                                                        </div>
                                                                        {/* Bottom separator for Dashboard/Academia group */}
                                                                        <div className="w-[75%] mx-auto my-[1.2vh]">
                                                                            <hr
                                                                                className="h-1 rounded-full border-0 bg-gradient-to-r from-indigo-500 via-purple-400 to-blue-400 dark:from-indigo-700 dark:via-purple-800 dark:to-blue-700 shadow-md opacity-95"
                                                                            />
                                                                        </div>
                    </>
                ) : null}
            </nav>

            <div className="mt-auto px-[0.5vw] pt-[1vh] pb-[0.5vh]">
                <button
                    ref={refs.setReference}
                    onClick={() => {
                        setIsSettingsIconRotating(true)
                        setIsSettingsOpen(prev => !prev)
                        setTimeout(() => setIsSettingsIconRotating(false), 300)
                    }}
                    className="w-full flex items-center justify-center rounded-2xl p-[0.75vw] transition-all duration-200 hover:bg-black/10 dark:hover:bg-white/10"
                    aria-label="Open Settings"
                >
                    <div className="relative">
                        {!imgError ? (
                            <img src={profilePic} alt="Profile" className="w-[clamp(2rem,3vw,2.5rem)] h-[clamp(2rem,3vw,2.5rem)] rounded-full object-cover shadow-md" onError={() => setImgError(true)} />
                        ) : (
                            <div className="w-[clamp(2rem,3vw,2.5rem)] h-[clamp(2rem,3vw,2.5rem)] rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-md">
                                <Settings 
                                    className={`w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-white transition-transform duration-300 ${isSettingsIconRotating ? 'rotate-180' : ''}`} 
                                />
                            </div>
                        )}
                    </div>
                </button>
            </div>

            <AnimatePresence>
                {isSettingsOpen && (
                    <Portal>
                        <motion.div
                            ref={refs.setFloating}
                            style={{
                                position: strategy,
                                top: y ?? 0,
                                left: x ?? 0,
                            }}
                            className="w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50"
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                        >
                            <div className="space-y-1">
                                <SettingsMenuItem icon={isDarkMode ? <Sun /> : <Moon />} title="Appearance" subtitle={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"} onClick={toggleTheme} colorClass="text-purple-500" />
                                <SettingsMenuItem icon={<Info />} title="About PRISM" subtitle="Learn more about our mission" onClick={handleAboutUs} colorClass="text-amber-500" />
                                <div className="px-1 pt-1"><hr className="border-slate-200 dark:border-slate-700" /></div>
                                <SettingsMenuItem icon={<LogOut />} title="Sign Out" onClick={handleLogout} colorClass="text-red-500" />
                            </div>
                        </motion.div>
                    </Portal>
                )}
            </AnimatePresence>
        </aside>
    );
};

export default LeftSidebar;

function SidebarItem({ icon, label, onClick, hasUnread }) {
  return (
    <div 
      className="flex flex-col items-center px-[clamp(0.75rem,1.5vw,1rem)] rounded-2xl cursor-pointer 
                 text-gray-600 transition-all duration-200 transform 
                 hover:scale-105 hover:shadow-md hover:bg-white hover:text-purple-700
                 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-purple-400 relative"
      onClick={onClick}
    >
      {/* Unread indicator - blue dot */}
      {hasUnread && (
        <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-lg"></div>
      )}
      <div className="p-[clamp(0.5rem,1vw,0.75rem)]">{icon}</div>
      <span className="text-[clamp(0.75rem,1vw,0.875rem)] font-semibold mt-[clamp(0.25rem,0.5vh,0.5rem)] text-center">{label}</span>
    </div>
  );
}