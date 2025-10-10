import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
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
  Shield,
  Target,
  Code,
  Rocket,
  Zap,
  Heart,
} from 'lucide-react'
import LeftSidebar from '../components/Left'

const Portfolio = () => {
  const [activeTab, setActiveTab] = useState('achievements')
  const [expandedRows, setExpandedRows] = useState({})
  const [confetti, setConfetti] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [typewriterText, setTypewriterText] = useState('')
  const [particles, setParticles] = useState([])

  // Typewriter effect
  const fullText = 'My Achievements'
  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setTypewriterText(fullText.slice(0, i + 1))
        i++
      } else {
        clearInterval(timer)
      }
    }, 150)
    return () => clearInterval(timer)
  }, [])

  // Initialize particles on load
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 2 + 1,
    }))
    setParticles(newParticles)
  }, [])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  }

  // Portfolio aggregated data
  const [portfolioData, setPortfolioData] = useState({
    mentor: null,
    achievements: [],
    papers: [],
    patents: [],
    commercializations: [],
    stats: null,
  })
  const [loadingPortfolio, setLoadingPortfolio] = useState(true)
  const [portfolioError, setPortfolioError] = useState(null)

  // Fetch mentor portfolio
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        setLoadingPortfolio(true)
        setPortfolioError(null)
        const token = localStorage.getItem('access_token')
        const profRes = await fetch('http://localhost:8000/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!profRes.ok) throw new Error('Failed to load profile')
        const profile = await profRes.json()
        const resp = await fetch(`http://localhost:8000/api/portfolio/mentor/${profile.id}`)
        if (!resp.ok) throw new Error('Failed to load portfolio data')
        const data = await resp.json()
        setPortfolioData(data)
      } catch (e) {
        console.error(e)
        setPortfolioError(e.message)
      } finally {
        setLoadingPortfolio(false)
      }
    }
    loadPortfolio()
  }, [])

  const achievementIcon = (type) => {
    switch (type) {
      case 'Award':
        return Trophy
      case 'Recognition':
        return Star
      default:
        return Award
    }
  }

  // Animation functions
  const triggerConfetti = () => {
    setConfetti(true)
    setTimeout(() => setConfetti(false), 2000)
  }

  const simulateUpload = (section, id) => {
    setUploadProgress((prev) => ({ ...prev, [`${section}-${id}`]: 0 }))

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const currentProgress = prev[`${section}-${id}`] || 0
        if (currentProgress >= 100) {
          clearInterval(interval)
          triggerConfetti()
          setTimeout(() => {
            setUploadProgress((prev) => {
              const newProgress = { ...prev }
              delete newProgress[`${section}-${id}`]
              return newProgress
            })
          }, 1000)
          return prev
        }
        return { ...prev, [`${section}-${id}`]: currentProgress + 10 }
      })
    }, 200)
  }

  const toggleRowExpansion = (section, id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [`${section}-${id}`]: !prev[`${section}-${id}`],
    }))
  }

  // Animated table row component
  const AnimatedTableRow = ({ children, delay = 0, onClick, isExpanded }) => {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

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
        whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
        {children}
      </motion.tr>
    )
  }

  // Enhanced Upload button
  const AnimatedUploadButton = ({ section, id, label = 'Upload' }) => {
    const progress = uploadProgress[`${section}-${id}`]
    const isUploading = progress !== undefined
    const [isHovered, setIsHovered] = useState(false)

    return (
      <motion.button
        onClick={() => simulateUpload(section, id)}
        disabled={isUploading}
        className={`relative overflow-hidden px-4 py-2 rounded-lg font-semibold transition-all duration-500 text-sm ${
          isUploading
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white cursor-not-allowed shadow-lg shadow-green-500/25'
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-purple-500/25'
        }`}
        whileHover={!isUploading ? { scale: 1.05, y: -2 } : {}}
        whileTap={!isUploading ? { scale: 0.95 } : {}}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12"
          initial={{ x: '-100%' }}
          animate={isHovered && !isUploading ? { x: '200%' } : { x: '-100%' }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
        <div className="flex items-center space-x-2 relative z-10">
          {isUploading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          <span>{isUploading ? `${progress}%` : label}</span>
        </div>
        {isUploading && (
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-sky-400 to-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        )}
        {progress === 100 && (
          <motion.div
            className="absolute inset-0 bg-green-500/20 rounded-xl"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </motion.button>
    )
  }

  // Floating Particles Background
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
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ duration: 0.8, delay: particle.id * 0.1 }}
        />
      ))}
    </div>
  )

  const tabs = [
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'papers', label: 'Papers', icon: FileText },
    { id: 'patents', label: 'Patents', icon: Shield },
    { id: 'commercializations', label: 'Commercializations', icon: Target },
  ]

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      <LeftSidebar />
      <FloatingParticles />

      {/* Enhanced Confetti animation */}
      <AnimatePresence>
        {confetti && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            {[...Array(100)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
                  y: -10,
                  rotate: 0,
                  scale: 0,
                }}
                animate={{
                  y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 10,
                  rotate: Math.random() * 720,
                  scale: [0, 1, 0],
                  x: Math.random() * 200 - 100,
                }}
                transition={{
                  duration: Math.random() * 2 + 2,
                  delay: Math.random() * 0.5,
                }}>
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
          animate="visible">
          {/* Enhanced Animated Header */}
          <motion.div className="text-center mb-12 relative" variants={itemVariants}>
            {/* Floating Icons */}
            <motion.div
              className="absolute -top-10 left-1/4 opacity-30"
              animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
              <Rocket className="w-8 h-8 text-blue-500" />
            </motion.div>
            <motion.div
              className="absolute -top-5 right-1/4 opacity-30"
              animate={{ y: [0, 8, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
              <Code className="w-6 h-6 text-purple-500" />
            </motion.div>
            <motion.div
              className="absolute top-10 left-1/6 opacity-30"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}>
              <Zap className="w-7 h-7 text-yellow-500" />
            </motion.div>

            {/* Typewriter Header */}
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-black dark:text-white relative">
              {typewriterText}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">A showcase of my professional journey and contributions.</p>
          </motion.div>

          {/* NEW: On-page Navigation Bar */}
          <motion.div className="mb-8" variants={itemVariants}>
            <div className="flex justify-center border-b border-gray-200 dark:border-gray-700">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors duration-300
                    ${
                      activeTab === tab.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}>
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                      layoutId="underline"
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Content Sections */}
          <AnimatePresence mode="wait">
            {activeTab === 'achievements' && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loadingPortfolio && (
                    <div className="col-span-full text-center text-sm text-gray-500">Loading achievements...</div>
                  )}
                  {portfolioError && (
                    <div className="col-span-full text-center text-sm text-red-500">{portfolioError}</div>
                  )}
                  {!loadingPortfolio && portfolioData.achievements.length === 0 && (
                    <div className="col-span-full text-center text-sm text-gray-500">No achievements yet.</div>
                  )}
                  {portfolioData.achievements.map((a) => {
                    const IconComp = achievementIcon(a.type)
                    const color = '#3B82F6'
                    return (
                      <motion.div
                        key={a.id}
                        className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                        variants={itemVariants}>
                        <div className="flex items-start space-x-4">
                          <div
                            className="p-3 rounded-lg flex-shrink-0"
                            style={{ backgroundColor: `${color}20`, color: color }}>
                            <IconComp size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1 truncate">
                              {a.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 leading-relaxed">
                              {a.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span className="uppercase tracking-wide font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                {a.type}
                              </span>
                              {a.year && <span className="font-medium">{a.year}</span>}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
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
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Title</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Journal</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Year</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Status</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingPortfolio && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            Loading publications...
                          </td>
                        </tr>
                      )}
                      {portfolioError && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-red-500">
                            {portfolioError}
                          </td>
                        </tr>
                      )}
                      {!loadingPortfolio && portfolioData.papers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            No papers found.
                          </td>
                        </tr>
                      )}
                      {portfolioData.papers.map((paper, index) => (
                        <React.Fragment key={paper.id}>
                          <AnimatedTableRow
                            delay={index * 0.1}
                            onClick={() => toggleRowExpansion('papers', paper.id)}
                            isExpanded={expandedRows[`papers-${paper.id}`]}>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                {expandedRows[`papers-${paper.id}`] ? (
                                  <ChevronUp size={16} className="mr-3 text-gray-500" />
                                ) : (
                                  <ChevronDown size={16} className="mr-3 text-gray-500" />
                                )}
                                <div>
                                  <div className="font-semibold text-gray-900 dark:text-white">{paper.title}</div>
                                  <div className="text-xs text-gray-500">{paper.authors}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{paper.journal}</td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{paper.year}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  paper.status === 'Published'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                }`}>
                                {paper.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <AnimatedUploadButton section="papers" id={paper.id} label="Upload" />
                                <motion.a
                                  href={paper.link || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}>
                                  <ExternalLink size={16} />
                                </motion.a>
                              </div>
                            </td>
                          </AnimatedTableRow>
                          <AnimatePresence>
                            {expandedRows[`papers-${paper.id}`] && (
                              <motion.tr
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}>
                                <td colSpan={5} className="px-8 py-4 bg-gray-50 dark:bg-gray-700/50">
                                  <div className="space-y-3">
                                    <div>
                                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Abstract</h4>
                                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                        {paper.abstract}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600 dark:text-gray-400">
                                      <div className="flex items-center space-x-1.5">
                                        <Eye size={14} className="text-blue-500" />
                                        <span>
                                          <strong>DOI:</strong> {paper.doi || '—'}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-1.5">
                                        <Star size={14} className="text-yellow-500" />
                                        <span>
                                          <strong>Year:</strong> {paper.publication_year || '—'}
                                        </span>
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
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Title</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                          Application #
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                          Filing Year
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Status</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingPortfolio && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            Loading patents...
                          </td>
                        </tr>
                      )}
                      {portfolioError && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-red-500">
                            {portfolioError}
                          </td>
                        </tr>
                      )}
                      {!loadingPortfolio && portfolioData.patents.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            No patents recorded.
                          </td>
                        </tr>
                      )}
                      {portfolioData.patents.map((patent, index) => (
                        <React.Fragment key={patent.id}>
                          <AnimatedTableRow
                            delay={index * 0.1}
                            onClick={() => toggleRowExpansion('patents', patent.id)}
                            isExpanded={expandedRows[`patents-${patent.id}`]}>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                {expandedRows[`patents-${patent.id}`] ? (
                                  <ChevronUp size={16} className="mr-3 text-gray-500" />
                                ) : (
                                  <ChevronDown size={16} className="mr-3 text-gray-500" />
                                )}
                                <div>
                                  <div className="font-semibold text-gray-900 dark:text-white">{patent.title}</div>
                                  <div className="text-xs text-gray-500">{patent.inventors}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-mono text-xs">
                              {patent.application_number || '—'}
                            </td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{patent.filing_year || '—'}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  patent.status === 'Filed'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                }`}>
                                {patent.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <AnimatedUploadButton section="patents" id={patent.id} />
                            </td>
                          </AnimatedTableRow>
                          <AnimatePresence>
                            {expandedRows[`patents-${patent.id}`] && (
                              <motion.tr
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}>
                                <td colSpan={5} className="px-8 py-4 bg-gray-50 dark:bg-gray-700/50">
                                  <div className="space-y-3">
                                    <div>
                                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Description</h4>
                                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                        {patent.description}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-4 text-xs">
                                      <div className="flex items-center space-x-1.5 text-gray-600 dark:text-gray-400">
                                        <Clock size={14} className="text-blue-500" />
                                        <span>
                                          <strong>Stage:</strong> {patent.stage || '—'}
                                        </span>
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
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Title</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Year</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Revenue</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Link</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingPortfolio && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            Loading records...
                          </td>
                        </tr>
                      )}
                      {portfolioError && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-red-500">
                            {portfolioError}
                          </td>
                        </tr>
                      )}
                      {!loadingPortfolio && portfolioData.commercializations.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            No commercialization entries.
                          </td>
                        </tr>
                      )}
                      {portfolioData.commercializations.map((item, index) => (
                        <React.Fragment key={item.id}>
                          <AnimatedTableRow
                            delay={index * 0.1}
                            onClick={() => toggleRowExpansion('commercializations', item.id)}
                            isExpanded={expandedRows[`commercializations-${item.id}`]}>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                {expandedRows[`commercializations-${item.id}`] ? (
                                  <ChevronUp size={16} className="mr-3 text-gray-500" />
                                ) : (
                                  <ChevronDown size={16} className="mr-3 text-gray-500" />
                                )}
                                <div className="font-semibold text-gray-900 dark:text-white">{item.title}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{item.year || '—'}</td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                              {item.revenue != null ? `$${item.revenue.toLocaleString()}` : '—'}
                            </td>
                            <td className="px-6 py-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                              {item.link ? (
                                <a href={item.link} target="_blank" rel="noopener noreferrer">
                                  View
                                </a>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <AnimatedUploadButton section="commercializations" id={item.id} />
                            </td>
                          </AnimatedTableRow>
                          <AnimatePresence>
                            {expandedRows[`commercializations-${item.id}`] && (
                              <motion.tr
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}>
                                <td colSpan={5} className="px-8 py-4 bg-gray-50 dark:bg-gray-700/50">
                                  <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Description</h4>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                      {item.description}
                                    </p>
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
  )
}

export default Portfolio
