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

  // Mock data
  const badgesData = [
    {
      id: 1,
      title: "Trail Member",
      level: "Trail",
      year: "2023",
      category: "Development",
      description: "Foundation level achievement in software development and basic programming principles.",
      icon: Target,
      primaryColor: "#3B82F6"
    },
    {
      id: 2,
      title: "Core Developer",
      level: "Core",
      year: "2024",
      category: "Advanced Development",
      description: "Advanced development skills and team leadership in complex project environments.",
      icon: Code,
      primaryColor: "#8B5CF6"
    },
    {
      id: 3,
      title: "Project Leader",
      level: "Leader",
      year: "2024",
      category: "Leadership",
      description: "Project management excellence and strategic thinking in cross-functional teams.",
      icon: Users,
      primaryColor: "#10B981"
    },
    {
      id: 4,
      title: "Innovation Master",
      level: "Master",
      year: "2025",
      category: "Research & Innovation",
      description: "Excellence in innovation, research, and mentorship of junior developers.",
      icon: Rocket,
      primaryColor: "#F59E0B"
    },
    {
      id: 5,
      title: "Security Expert",
      level: "Expert",
      year: "2024",
      category: "Cybersecurity",
      description: "Specialized expertise in cybersecurity protocols and secure system architecture.",
      icon: Shield,
      primaryColor: "#EF4444"
    },
    {
      id: 6,
      title: "Performance Optimizer",
      level: "Specialist",
      year: "2023",
      category: "Performance",
      description: "Exceptional skills in system optimization and performance enhancement strategies.",
      icon: Zap,
      primaryColor: "#F97316"
    }
  ];

  const papersData = [
    {
      id: 1,
      title: "Machine Learning Applications in Healthcare",
      authors: "John Doe, Jane Smith, Mary Christian",
      journal: "IEEE Transactions on Medical Imaging",
      year: "2024",
      status: "Published",
      citations: 15,
      impact: "4.5",
      abstract: "This paper explores the revolutionary applications of machine learning algorithms in modern healthcare diagnostics, focusing on image analysis and pattern recognition techniques."
    },
    {
      id: 2,
      title: "Quantum Computing for Cryptographic Security",
      authors: "Mary Christian, Dr. Wilson, Prof. Adams",
      journal: "Nature Quantum Information",
      year: "2024",
      status: "Under Review",
      citations: 0,
      impact: "8.2",
      abstract: "An investigation into quantum-resistant cryptographic methods and their implementation in distributed systems."
    }
  ];

  const patentsData = [
    {
      id: 1,
      title: "AI-Powered Smart Home Security System",
      inventors: "Mary Christian, Team Alpha",
      applicationNo: "US2024/123456",
      filingDate: "2024-03-15",
      status: "Filed",
      description: "An intelligent security system that uses computer vision and machine learning for threat detection and automated response.",
      stage: "Examination"
    },
    {
      id: 2,
      title: "Blockchain-Based Identity Verification",
      inventors: "Mary Christian, Dr. Johnson",
      applicationNo: "US2024/789012",
      filingDate: "2024-06-20",
      status: "Pending",
      description: "A decentralized identity verification system using blockchain technology for enhanced security and privacy.",
      stage: "Initial Review"
    }
  ];

  const commercializationsData = [
    {
      id: 1,
      product: "EcoTrack Mobile App",
      company: "GreenTech Solutions",
      launchDate: "2024-01-15",
      revenue: "$50,000",
      users: "10,000+",
      description: "A carbon footprint tracking application that helps users monitor and reduce their environmental impact.",
      status: "Active",
      growth: "+25%"
    }
  ];

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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 relative overflow-hidden">
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
                className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
              >
                {typewriterText}
                <motion.span
                  className="inline-block w-1 h-10 bg-gradient-to-b from-blue-500 to-purple-500 ml-2"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </motion.h1>
              
              {/* Glowing Underline */}
              <motion.div
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: typewriterText.length > 0 ? "60%" : 0 }}
                transition={{ duration: 1, delay: 2 }}
              />
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
                Professional Portfolio & Accomplishments
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

          {/* Animated Statistics Section */}
          <motion.div
            className="mb-12 relative"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              {[
                { 
                  number: 50, 
                  suffix: "+", 
                  label: "Projects Completed",
                  icon: Code,
                  accentColor: "indigo-500",
                  description: "Successfully delivered"
                },
                { 
                  number: 3, 
                  suffix: "+", 
                  label: "Years Experience",
                  icon: Award,
                  accentColor: "blue-500",
                  description: "Professional growth"
                },
                { 
                  number: 98, 
                  suffix: "%", 
                  label: "Client Satisfaction",
                  icon: Star,
                  accentColor: "purple-500",
                  description: "Happy customers"
                },
                { 
                  number: 24, 
                  suffix: "/7", 
                  label: "Available",
                  icon: Zap,
                  accentColor: "slate-500",
                  description: "Always ready"
                }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="relative group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.15,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    transition: { duration: 0.3 }
                  }}
                >
                  <div className="bg-white dark:bg-gray-800/50 backdrop-blur-lg p-4 rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 border border-gray-200/20 dark:border-gray-700/30 relative overflow-hidden">
                    {/* Animated accent line */}
                    <motion.div
                      className={`absolute top-0 left-0 h-1 bg-${stat.accentColor} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1, delay: index * 0.2 + 0.5 }}
                    />
                    
                    {/* Floating background elements */}
                    <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full opacity-20 blur-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-full opacity-30"></div>
                    
                    <div className="relative z-10">
                      {/* Icon with modern background */}
                      <div className={`w-10 h-10 bg-${stat.accentColor}/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                        <stat.icon className={`text-${stat.accentColor} w-5 h-5`} />
                      </div>
                      
                      {/* Number with modern typography */}
                      <motion.div
                        className="text-2xl font-black text-gray-900 dark:text-white mb-1 leading-none"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.2 + 0.8, duration: 0.6, type: "spring" }}
                      >
                        <AnimatedCounter 
                          target={stat.number} 
                          suffix={stat.suffix}
                          duration={2500 + index * 300}
                        />
                      </motion.div>
                      
                      {/* Label and description */}
                      <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1 uppercase tracking-wider">
                        {stat.label}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {stat.description}
                      </p>
                    </div>
                    
                    {/* Subtle hover overlay */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br from-${stat.accentColor}/5 to-transparent rounded-2xl`}
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Enhanced Navigation Tabs */}
          <motion.div
            className="flex flex-wrap justify-center mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-2 shadow-lg border border-white/20"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            {[
              { id: 'achievements', label: 'Achievements', icon: Trophy, color: 'from-sky-400 to-blue-500' },
              { id: 'papers', label: 'Papers Published', icon: FileText, color: 'from-blue-400 to-cyan-500' },
              { id: 'patents', label: 'Patents Filed', icon: Shield, color: 'from-violet-300 to-purple-500' },
              { id: 'commercializations', label: 'Commercializations', icon: Target, color: 'from-purple-500 to-pink-400' }
            ].map((tab, index) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center space-x-2 px-4 py-3 rounded-xl font-semibold transition-all duration-500 overflow-hidden ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                }`}
                whileHover={{ 
                  scale: 1.08, 
                  y: -2,
                  transition: { type: "spring", stiffness: 400, damping: 10 }
                }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 3 }}
              >
                {/* Ripple effect on click */}
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute inset-0 bg-white/20 rounded-2xl"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 4, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                )}
                
                {/* Floating icon animation */}
                <motion.div
                  animate={activeTab === tab.id ? {
                    rotate: [0, 10, -10, 0],
                    y: [0, -2, 2, 0]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <tab.icon size={16} />
                </motion.div>
                
                <motion.span
                  className="text-xs lg:text-sm"
                  animate={activeTab === tab.id ? {
                    scale: [1, 1.05, 1]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {tab.label}
                </motion.span>
                
                {/* Active indicator */}
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute bottom-0 left-1/2 w-8 h-1 bg-white/50 rounded-full"
                    initial={{ width: 0, x: "-50%" }}
                    animate={{ width: "2rem", x: "-50%" }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
            ))}
            
            {/* Background indicator */}
            <motion.div
              className="absolute inset-0 -z-10"
              animate={{
                background: [
                  "radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 75% 25%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 75% 75%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 25% 75%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)"
                ]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
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
                    {badgesData.map((badge, index) => (
                      <div
                        key={badge.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 hover:shadow-md transition-all duration-300"
                        style={{ borderLeftColor: badge.primaryColor }}
                      >
                        <div className="flex items-start space-x-3">
                          <div 
                            className="p-2 rounded-lg flex-shrink-0"
                            style={{ backgroundColor: `${badge.primaryColor}20`, color: badge.primaryColor }}
                          >
                            <badge.icon size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1">
                              {badge.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-xs mb-2 leading-relaxed">
                              {badge.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                                {badge.category}
                              </span>
                              <div className="flex items-center space-x-2">
                                {badge.level && (
                                  <span 
                                    className="px-2 py-1 rounded-full text-xs font-semibold"
                                    style={{ 
                                      backgroundColor: `${badge.primaryColor}20`,
                                      color: badge.primaryColor
                                    }}
                                  >
                                    {badge.level}
                                  </span>
                                )}
                                {badge.year && (
                                  <span className="text-xs text-gray-500">
                                    {badge.year}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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
                      {papersData.map((paper, index) => (
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
                                        <span><strong>Citations:</strong> {paper.citations}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Star size={14} className="text-yellow-500" />
                                        <span><strong>Impact Factor:</strong> {paper.impact}</span>
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
                        <th className="px-4 py-3 text-left text-sm font-semibold">Application No.</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Filing Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patentsData.map((patent, index) => (
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
                              {patent.applicationNo}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{patent.filingDate}</td>
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
                                        <span><strong>Stage:</strong> {patent.stage}</span>
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
                        <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Company</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Launch Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Revenue</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commercializationsData.map((item, index) => (
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
                                    {item.product}
                                  </div>
                                  <div className="text-xs text-gray-500">{item.status}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.company}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.launchDate}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-1">
                                <span className="text-sm font-semibold text-green-600">{item.revenue}</span>
                                <span className="text-xs text-gray-500">({item.growth})</span>
                              </div>
                            </td>
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
                                        <Users size={16} className="text-blue-500" />
                                        <span><strong>Users:</strong> {item.users}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Flame size={16} className="text-green-500" />
                                        <span><strong>Growth:</strong> {item.growth}</span>
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