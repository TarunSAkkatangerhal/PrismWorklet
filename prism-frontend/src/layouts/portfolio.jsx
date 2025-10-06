import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { 
  Award, 
  Star, 
  Trophy, 
  ExternalLink,
  Upload,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  Clock,
  Users,
  Target,
  Shield,
  Flame,
  Zap,
  Code,
  Rocket,
  Heart,
  Download
} from 'lucide-react';
import LeftSidebar from '../components/Left';

const Portfolio = () => {
  const [activeTab, setActiveTab] = useState('achievements');
  const [expandedRows, setExpandedRows] = useState({});
  const [confetti, setConfetti] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const [particles, setParticles] = useState([]);

  // Typewriter effect
  const fullText = "My Achievements";
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setTypewriterText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 150);
    return () => clearInterval(timer);
  }, []);

  // Initialize particles on load
  useEffect(() => {
    setIsLoaded(true);
    
    // Create floating particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 2 + 1,
    }));
    setParticles(newParticles);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  // Removed animation variants for professional static design

  // Subtle floating animation variants (play once)
  const floatingVariants = {
    animate: {
      y: [0, -5, 0],
      rotate: [0, 2, 0],
      transition: {
        duration: 2,
        repeat: 0,
        ease: "easeInOut"
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.02, 1],
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 1.5,
        repeat: 0,
        ease: "easeInOut"
      }
    }
  };

  // Removed glowVariants to prevent continuous animations

  // Removed legacy mock arrays - now pulling dynamic data from backend.

  // Portfolio aggregated data
  const [portfolioData, setPortfolioData] = useState({ mentor: null, achievements: [], papers: [], patents: [], commercializations: [], stats: null });
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [portfolioError, setPortfolioError] = useState(null);

  // Fetch mentor portfolio (single consolidated call)
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        setLoadingPortfolio(true);
        setPortfolioError(null);
        const token = localStorage.getItem('access_token');
        const profRes = await fetch('http://localhost:8000/auth/profile', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!profRes.ok) throw new Error('Failed to load profile');
        const profile = await profRes.json();
        const resp = await fetch(`http://localhost:8000/api/portfolio/mentor/${profile.id}`);
        if (!resp.ok) throw new Error('Failed to load portfolio data');
        const data = await resp.json();
        setPortfolioData(data);
      } catch (e) {
        console.error(e);
        setPortfolioError(e.message);
      } finally {
        setLoadingPortfolio(false);
      }
    };
    loadPortfolio();
  }, []);

  const resolveBadgeColor = (color) => (color && color.startsWith('#') ? color : '#3B82F6');

  const achievementIcon = (type) => {
    switch(type){
      case 'Award': return Trophy;
      case 'Recognition': return Star;
      default: return Award;
    }
  };

  // Animation functions
  const triggerConfetti = () => {
    setConfetti(true);
    setTimeout(() => setConfetti(false), 2000);
  };

  const simulateUpload = (section, id) => {
    setUploadProgress(prev => ({ ...prev, [`${section}-${id}`]: 0 }));
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const currentProgress = prev[`${section}-${id}`] || 0;
        if (currentProgress >= 100) {
          clearInterval(interval);
          triggerConfetti();
          setTimeout(() => {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[`${section}-${id}`];
              return newProgress;
            });
          }, 1000);
          return prev;
        }
        return { ...prev, [`${section}-${id}`]: currentProgress + 10 };
      });
    }, 200);
  };

  const toggleRowExpansion = (section, id) => {
    setExpandedRows(prev => ({
      ...prev,
      [`${section}-${id}`]: !prev[`${section}-${id}`]
    }));
  };



  // Animated table row component
  const AnimatedTableRow = ({ children, delay = 0, onClick, isExpanded }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    
    return (
      <motion.tr
        ref={ref}
        initial={{ opacity: 0, x: -50 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
        transition={{ duration: 0.5, delay }}
        className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 cursor-pointer ${
          isExpanded ? 'bg-blue-50 dark:bg-blue-900/20' : ''
        }`}
        onClick={onClick}
        whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
      >
        {children}
      </motion.tr>
    );
  };

  // Animated Counter Component
  const AnimatedCounter = ({ target, suffix = "", duration = 2000 }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      let startTime;
      let animationFrame;
      
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        // Easing function for smoother animation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(target * easeOut));
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };
      
      animationFrame = requestAnimationFrame(animate);
      
      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }, [target, duration]);
    
    return (
      <span className="tabular-nums">
        {count}{suffix}
      </span>
    );
  };

  // Enhanced Upload button with magical effects
  const AnimatedUploadButton = ({ section, id, label = "Upload" }) => {
    const progress = uploadProgress[`${section}-${id}`];
    const isUploading = progress !== undefined;
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <motion.button
        onClick={() => simulateUpload(section, id)}
        disabled={isUploading}
        className={`relative overflow-hidden px-6 py-3 rounded-xl font-semibold transition-all duration-500 ${
          isUploading
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white cursor-not-allowed shadow-lg shadow-green-500/25'
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-purple-500/25'
        }`}
        whileHover={!isUploading ? { 
          scale: 1.08, 
          y: -3,
          boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.3)" 
        } : {}}
        whileTap={!isUploading ? { scale: 0.95 } : {}}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Magical shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12"
          initial={{ x: "-100%" }}
          animate={isHovered && !isUploading ? { x: "200%" } : { x: "-100%" }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
        
        {/* Sparkle particles for upload state */}
        {isUploading && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                initial={{
                  x: "50%",
                  y: "50%",
                  scale: 0
                }}
                animate={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        )}
        
        <motion.div
          className="flex items-center space-x-2 relative z-10"
          animate={isUploading ? { 
            scale: [1, 1.05, 1],
            rotate: [0, 1, -1, 0] 
          } : {}}
          transition={{ 
            repeat: isUploading ? Infinity : 0, 
            duration: 1.5,
            ease: "easeInOut" 
          }}
        >
          <motion.div
            animate={isUploading ? { rotate: 360 } : { rotate: 0 }}
            transition={{ 
              duration: isUploading ? 2 : 0.3, 
              repeat: isUploading ? Infinity : 0,
              ease: "linear" 
            }}
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload size={18} />
            )}
          </motion.div>
          <motion.span
            animate={isUploading ? {
              background: [
                "linear-gradient(45deg, #ffffff 0%, #ffffff 100%)",
                "linear-gradient(45deg, #fbbf24 0%, #f59e0b 100%)",
                "linear-gradient(45deg, #10b981 0%, #059669 100%)",
                "linear-gradient(45deg, #ffffff 0%, #ffffff 100%)"
              ]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: isUploading ? 'transparent' : 'white' }}
          >
            {isUploading ? `Uploading ${progress}%` : label}
          </motion.span>
        </motion.div>
        
        {/* Enhanced progress bar */}
        {isUploading && (
          <>
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-sky-400 via-green-400 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
            {/* Glowing progress indicator */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-white/50 rounded-full blur-sm"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </>
        )}
        
        {/* Success pulse on completion */}
        {progress === 100 && (
          <motion.div
            className="absolute inset-0 bg-green-500/20 rounded-xl"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </motion.button>
    );
  };

  // Subtle Static Particles Component
  const FloatingParticles = () => (
    <div className="fixed inset-0 pointer-events-none z-10">
      {particles.slice(0, 6).map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute bg-blue-400/10 rounded-full"
          style={{
            width: particle.size / 2,
            height: particle.size / 2,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          initial={{
            opacity: 0,
            scale: 0
          }}
          animate={{
            opacity: 0.15,
            scale: 1
          }}
          transition={{
            duration: 0.8,
            delay: particle.id * 0.1,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      <LeftSidebar />
      
      {/* Floating Particles Background */}
      <FloatingParticles />
      
      {/* Subtle Static Background Gradient */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-5"
        initial={{
          background: "radial-gradient(circle at 30% 40%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)"
        }}
        animate={{
          background: "radial-gradient(circle at 70% 60%, rgba(147, 51, 234, 0.05) 0%, transparent 50%)"
        }}
        transition={{
          duration: 8,
          ease: "easeInOut"
        }}
      />
      
      {/* Enhanced Confetti animation */}
      <AnimatePresence>
        {confetti && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(100)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
                  y: -10,
                  rotate: 0,
                  scale: 0
                }}
                animate={{
                  y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 10,
                  rotate: Math.random() * 720,
                  scale: [0, 1, 0],
                  x: Math.random() * 200 - 100
                }}
                transition={{
                  duration: Math.random() * 2 + 2,
                  delay: Math.random() * 0.5
                }}
              >
                {i % 4 === 0 ? (
                  <Star className="w-4 h-4 text-sky-400" />
                ) : i % 4 === 1 ? (
                  <Trophy className="w-4 h-4 text-sky-500" />
                ) : i % 4 === 2 ? (
                  <Award className="w-4 h-4 text-blue-400" />
                ) : (
                  <Heart className="w-4 h-4 text-pink-400" />
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 p-4 lg:p-8">
        <motion.div
          className="w-full max-w-none mx-auto px-4 lg:px-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Enhanced Animated Header */}
          <motion.div
            className="text-center mb-16 relative"
            variants={itemVariants}
          >
            {/* Floating Icons - animate once only */}
            <motion.div
              className="absolute -top-10 left-1/4"
              initial={{ opacity: 0, y: 20, scale: 0 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Rocket className="w-8 h-8 text-blue-500/30" />
            </motion.div>
            <motion.div
              className="absolute -top-5 right-1/4"
              initial={{ opacity: 0, y: 20, scale: 0 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Code className="w-6 h-6 text-purple-500/30" />
            </motion.div>
            <motion.div
              className="absolute top-10 left-1/6"
              initial={{ opacity: 0, y: 20, scale: 0 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <Zap className="w-7 h-7 text-yellow-500/30" />
            </motion.div>

            {/* Typewriter Header */}
            <motion.div
              className="relative"
            >
              <motion.h1 
                className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent relative leading-[1.25] pb-1 overflow-visible"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
              >
                {typewriterText}
                <motion.span
                  className="inline-block w-1 h-8 lg:h-10 bg-gradient-to-b from-blue-500 to-purple-500 ml-2 align-middle"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </motion.h1>
              
              {/* Glowing Underline */}
              
            </motion.div>

            <motion.div
              className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300 relative"
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 2.5, type: "spring", stiffness: 200 }}
            >
              <motion.div
                initial={{ rotate: 0, scale: 0 }}
                animate={{ rotate: 360, scale: 1 }}
                transition={{ duration: 0.8, delay: 2.8 }}
              >
                <Sparkles className="text-yellow-500" size={20} />
              </motion.div>
              <motion.span
                className="text-sm font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
              >
                Portfolio & Accomplishments
              </motion.span>
              <motion.div
                initial={{ rotate: 0, scale: 0 }}
                animate={{ rotate: -360, scale: 1 }}
                transition={{ duration: 0.8, delay: 2.8 }}
              >
                <Sparkles className="text-yellow-500" size={20} />
              </motion.div>
            </motion.div>

            {/* Floating Achievement Count */}
            <motion.div
              className="absolute -right-10 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20"
              initial={{ opacity: 0, x: 50, scale: 0 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 3.2, type: "spring", stiffness: 200 }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">25+</div>
                <div className="text-xs text-gray-500">Achievements</div>
              </div>
            </motion.div>
          </motion.div>



          {/* Compact 2x2 Navigation Grid - Top Right */}
          <motion.div
            className="fixed top-4 right-4 z-20 grid grid-cols-2 gap-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl p-3 shadow-2xl border border-white/40 dark:border-gray-700/40"
            initial={{ opacity: 0, x: 100, y: -50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {[
              { id: 'achievements', icon: Trophy, color: 'from-violet-300 to-indigo-400' },
              { id: 'papers', icon: FileText, color: 'from-indigo-400 to-blue-500' },
              { id: 'patents', icon: Shield, color: 'from-blue-500 to-purple-400' },
              { id: 'commercializations', icon: Target, color: 'from-purple-600 to-violet-700' }
            ].map((tab, index) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative w-12 h-12 rounded-xl transition-all duration-300 overflow-hidden group ${
                  activeTab === tab.id
                    ? `bg-gradient-to-br ${tab.color} shadow-lg`
                    : 'bg-gray-100/60 dark:bg-gray-700/60 hover:bg-gray-200/80 dark:hover:bg-gray-600/80'
                }`}
                whileHover={{ 
                  scale: 1.1,
                  rotate: 5,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.15 + 0.4, duration: 0.6, type: "spring" }}
              >
                {/* Active state glow */}
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute inset-0 bg-white/25 rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                
                {/* Icon Only */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={activeTab === tab.id ? {
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.2, 1]
                    } : {}}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    <tab.icon 
                      size={22} 
                      className={`${
                        activeTab === tab.id 
                          ? 'text-white drop-shadow-sm' 
                          : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100'
                      } transition-all duration-300`}
                    />
                  </motion.div>
                </div>

                {/* Active pulse ring */}
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute inset-0 border-2 border-white/50 rounded-xl"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                      scale: [0.8, 1.1, 0.8],
                      opacity: [0, 0.6, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>

          {/* Content Sections */}
          <AnimatePresence mode="wait">
            {activeTab === 'achievements' && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="p-4 bg-gradient-to-r from-sky-400 to-blue-500">
                  <h2 className="text-2xl font-bold text-white flex items-center no-underline">
                    <Trophy className="mr-2" size={30} />
                    My Achievements
                  </h2>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loadingPortfolio && <div className="col-span-full text-center text-sm text-gray-500">Loading achievements...</div>}
                    {portfolioError && <div className="col-span-full text-center text-sm text-red-500">{portfolioError}</div>}
                    {!loadingPortfolio && portfolioData.achievements.length === 0 && <div className="col-span-full text-center text-sm text-gray-500">No achievements yet.</div>}
                    {portfolioData.achievements.map((a) => {
                      const IconComp = achievementIcon(a.type);
                      const color = '#3B82F6';
                      return (
                      <div
                        key={a.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 hover:shadow-md transition-all duration-300"
                        style={{ borderLeftColor: color }}
                      >
                        <div className="flex items-start space-x-3">
                          <div 
                            className="p-2 rounded-lg flex-shrink-0"
                            style={{ backgroundColor: `${color}20`, color: color }}
                          >
                            <IconComp size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1">
                              {a.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-xs mb-2 leading-relaxed">
                              {a.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                                {a.type}
                              </span>
                              <div className="flex items-center space-x-2">
                                {a.year && (
                                  <span className="text-xs text-gray-500">{a.year}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'papers' && (
              <motion.div
                key="papers"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <FileText className="mr-2" size={24} />
                    Papers Published
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Journal</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Year</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingPortfolio && <tr><td colSpan={5} className="text-center py-6 text-sm text-gray-500">Loading publications...</td></tr>}
                      {portfolioError && <tr><td colSpan={5} className="text-center py-6 text-sm text-red-500">{portfolioError}</td></tr>}
                      {!loadingPortfolio && portfolioData.papers.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-sm text-gray-500">No papers found.</td></tr>}
                      {portfolioData.papers.map((paper, index) => (
                        <React.Fragment key={paper.id}>
                          <AnimatedTableRow
                            delay={index * 0.1}
                            onClick={() => toggleRowExpansion('papers', paper.id)}
                            isExpanded={expandedRows[`papers-${paper.id}`]}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                {expandedRows[`papers-${paper.id}`] ? (
                                  <ChevronUp size={14} className="mr-2 text-gray-500" />
                                ) : (
                                  <ChevronDown size={14} className="mr-2 text-gray-500" />
                                )}
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {paper.title}
                                  </div>
                                  <div className="text-xs text-gray-500">{paper.authors}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{paper.journal}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{paper.year}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                paper.status === 'Published'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                {paper.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex space-x-1">
                                <AnimatedUploadButton section="papers" id={paper.id} />
                                <motion.button
                                  className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <ExternalLink size={16} />
                                </motion.button>
                              </div>
                            </td>
                          </AnimatedTableRow>
                          <AnimatePresence>
                            {expandedRows[`papers-${paper.id}`] && (
                              <motion.tr
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <td colSpan={5} className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
                                  <div className="space-y-3">
                                    <div>
                                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Abstract</h4>
                                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                        {paper.abstract}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-xs">
                                      <div className="flex items-center space-x-1">
                                        <Eye size={14} className="text-blue-500" />
                                        <span><strong>DOI:</strong> {paper.doi || '—'}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Star size={14} className="text-yellow-500" />
                                        <span><strong>Year:</strong> {paper.publication_year || '—'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'patents' && (
              <motion.div
                key="patents"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="p-4 bg-gradient-to-r from-violet-400 to-purple-400">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <Shield className="mr-2" size={24} />
                    Patents Filed
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Application #</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Filing Year</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingPortfolio && <tr><td colSpan={5} className="text-center py-6 text-sm text-gray-500">Loading patents...</td></tr>}
                      {portfolioError && <tr><td colSpan={5} className="text-center py-6 text-sm text-red-500">{portfolioError}</td></tr>}
                      {!loadingPortfolio && portfolioData.patents.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-sm text-gray-500">No patents recorded.</td></tr>}
                      {portfolioData.patents.map((patent, index) => (
                        <React.Fragment key={patent.id}>
                          <AnimatedTableRow
                            delay={index * 0.1}
                            onClick={() => toggleRowExpansion('patents', patent.id)}
                            isExpanded={expandedRows[`patents-${patent.id}`]}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                {expandedRows[`patents-${patent.id}`] ? (
                                  <ChevronUp size={14} className="mr-2 text-gray-500" />
                                ) : (
                                  <ChevronDown size={14} className="mr-2 text-gray-500" />
                                )}
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {patent.title}
                                  </div>
                                  <div className="text-xs text-gray-500">{patent.inventors}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs">
                              {patent.application_number || '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{patent.filing_year || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                patent.status === 'Filed'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              }`}>
                                {patent.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <AnimatedUploadButton section="patents" id={patent.id} />
                            </td>
                          </AnimatedTableRow>
                          <AnimatePresence>
                            {expandedRows[`patents-${patent.id}`] && (
                              <motion.tr
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <td colSpan={5} className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
                                  <div className="space-y-3">
                                    <div>
                                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                        {patent.description}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-4 text-sm">
                                      <div className="flex items-center space-x-1">
                                        <Clock size={16} className="text-blue-500" />
                                        <span><strong>Stage:</strong> {patent.stage || '—'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'commercializations' && (
              <motion.div
                key="commercializations"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-600">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <Target className="mr-2" size={24} />
                    Commercializations Done
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Year</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Revenue</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Link</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingPortfolio && <tr><td colSpan={5} className="text-center py-6 text-sm text-gray-500">Loading commercialization records...</td></tr>}
                      {portfolioError && <tr><td colSpan={5} className="text-center py-6 text-sm text-red-500">{portfolioError}</td></tr>}
                      {!loadingPortfolio && portfolioData.commercializations.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-sm text-gray-500">No commercialization entries.</td></tr>}
                      {portfolioData.commercializations.map((item, index) => (
                        <React.Fragment key={item.id}>
                          <AnimatedTableRow
                            delay={index * 0.1}
                            onClick={() => toggleRowExpansion('commercializations', item.id)}
                            isExpanded={expandedRows[`commercializations-${item.id}`]}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                {expandedRows[`commercializations-${item.id}`] ? (
                                  <ChevronUp size={14} className="mr-2 text-gray-500" />
                                ) : (
                                  <ChevronDown size={14} className="mr-2 text-gray-500" />
                                )}
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {item.title}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.year || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.revenue != null ? `$${item.revenue}` : '—'}</td>
                            <td className="px-4 py-3 text-sm text-blue-600 dark:text-blue-400 underline">{item.link ? <a href={item.link} target="_blank" rel="noreferrer">Open</a> : '—'}</td>
                            <td className="px-4 py-3">
                              <AnimatedUploadButton section="commercializations" id={item.id} />
                            </td>
                          </AnimatedTableRow>
                          <AnimatePresence>
                            {expandedRows[`commercializations-${item.id}`] && (
                              <motion.tr
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <td colSpan={5} className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
                                  <div className="space-y-3">
                                    <div>
                                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                        {item.description}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm">
                                      <div className="flex items-center space-x-1">
                                        <FileText size={16} className="text-blue-500" />
                                        <span><strong>Year:</strong> {item.year || '—'}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <ExternalLink size={16} className="text-green-500" />
                                        <span><strong>Link:</strong> {item.link ? <a className="underline" href={item.link} target="_blank" rel="noreferrer">Open</a> : '—'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Portfolio;