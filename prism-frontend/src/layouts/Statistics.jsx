import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Users, CheckCircle, Download } from 'lucide-react';
import LeftSidebar from "../components/Left";
import { ThemeContext } from '../context/ThemeContext'
// Animation styles component
const AnimationStyles = () => (
  <style>{`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes growBar {
      from { transform: scaleY(0); }
      to { transform: scaleY(1); }
    }
    @keyframes spinIn {
      from { opacity: 0; transform: scale(0.5) rotate(-90deg); }
      to { opacity: 1; transform: scale(1) rotate(0deg); }
    }
    @keyframes pulseShadow {
      0% { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07); }
      50% { box-shadow: 0 8px 12px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1); }
      100% { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07); }
    }
  `}</style>
);

// Animated number component
const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let start = 0;
          const end = value;
          const duration = 1500;
          const startTime = performance.now();

          const animate = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const currentVal = Math.floor(progress * (end - start) + start);
            setDisplayValue(currentVal);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayValue(end);
            }
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{displayValue.toLocaleString()}</span>;
};

// Bar chart component
const Bar = ({ value, label, maxValue, color, delay }) => {
  const barHeight = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div style={styles.barContainer}>
      <div style={styles.barValue}>{value}</div>
      <div style={{
        ...styles.bar,
        height: `${barHeight}%`,
        backgroundColor: color,
        animationDelay: delay
      }}></div>
      <div style={styles.barLabel}>{label}</div>
    </div>
  );
};

// Main Statistics Dashboard component
const StatisticsDashboard = () => {
  // ThemeContext is imported, but static styles object is used below
  const [statisticsData, setStatisticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mentorInfo, setMentorInfo] = useState(null);

  // Fetch mentor-specific statistics from API
  useEffect(() => {
    const fetchMentorStatistics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("access_token");
        
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch('http://localhost:8000/api/dashboard/mentor-statistics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please login again.');
          }
          throw new Error(`Failed to fetch statistics: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("📊 Mentor statistics received:", data); // Debug log
        console.log("👥 My Students count:", data.engagement_data?.["My Students"]); // Debug students
        setStatisticsData(data);
        setMentorInfo(data.mentor_info);
        setError(null);
      } catch (err) {
        console.error('Error fetching mentor statistics:', err);
        setError(err.message);
        
        // Use fallback data for demo purposes
        setStatisticsData({
          status_counts: {
            "Ongoing": 3,
            "Completed": 2,
            "On Hold": 1,
            "Not Started": 1
          },
          engagement_data: {
            "My Worklets": 7,
            "My Students": 15,
            "Avg Progress": 72,
            "High Priority": 2,
            "Papers Published": 1,
            "Patents Filed": 0
          },
          performance_counts: {
            "Excellent": 2,
            "Very Good": 3,
            "Good": 1,
            "Needs Attention": 1
          },
          risk_data: {
            "High Risk": 1,
            "Medium Risk": 2,
            "Low Risk": 4
          }
        });
        setMentorInfo({
          name: localStorage.getItem("user_name") || "Mentor",
          total_worklets: 7,
          active_worklets: 5
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMentorStatistics();
    // Refresh data every 60 seconds for real-time updates
    const interval = setInterval(fetchMentorStatistics, 60000);

    return () => clearInterval(interval);
  }, []);

  // Calculate derived stats from real-time data
  let stats = {
    statusCounts: {},
    totalStudents: 0,
    totalWorklets: 0,
    performanceCounts: {}
  };
  if (statisticsData) {
    stats = {
      statusCounts: statisticsData.status_counts || {},
      totalStudents: statisticsData.engagement_data?.["My Students"] || 0,
      totalWorklets: statisticsData.engagement_data?.["My Worklets"] || 0,
      performanceCounts: statisticsData.performance_counts || {}
    };
  }

  // Use real-time data with proper field mapping
  const engagementData = statisticsData?.engagement_data || {
    "My Students": 0,
    "My Worklets": 0,
    "Avg Progress": 0,
    "High Priority": 0,
    "Papers Published": 0,
    "Patents Filed": 0
  };

  const riskData = statisticsData?.risk_data || {
    'High Risk': 0,
    'Medium Risk': 0,
    'Low Risk': 0,
  };
  
  const totalRisk = Object.values(riskData).reduce((a, b) => a + b, 0);

  const statusColors = {
    Completed: '#2D3748',
    Ongoing: '#4299E1',
    'On Hold': '#ECC94B',
    Dropped: '#F6AD55',
    Terminated: '#E2E8F0',
  };
  
  const performanceColors = {
    Excellent: '#2D3748',
    'Very Good': '#4299E1',
    Good: '#A0AEC0',
    Average: '#F6AD55',
    Poor: '#E2E8F0',
  };
  
  const riskSliceColors = {
    'High Risk': '#2D3748',
    'Medium Risk': '#4299E1',
    'Low Risk': '#E2E8F0',
  };

  const maxStatusValue = Math.max(...Object.values(stats.statusCounts || {}), 1);
  const maxPerformanceValue = Math.max(...Object.values(stats.performanceCounts || {}), 1);

  return (
    <>
      <AnimationStyles />
  <div style={styles.pageContainer} className="hide-scrollbar bg-gradient-to-t from-purple-300 via-indigo-50 to-blue-100">
        <div style={styles.sidebarWrapper} className="hide-scrollbar"><LeftSidebar /></div>
        <main style={styles.mainContent}>
          <header style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.logoContainer}>
                <span style={styles.samsungLogo}>SAMSUNG</span>
                <span style={styles.prismLogo}>
                  <span style={styles.prismBracket}>&lt;/&gt;</span>PRISM
                </span>
              </div>
            </div>
            <div style={styles.headerRight}>
              <div style={{...styles.dropdown, display: 'flex', alignItems: 'center', gap: '8px'}}>
                {loading && (
                  <div style={{fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <div style={{width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulseShadow 2s infinite'}}></div>
                    Live
                  </div>
                )}
                {error && (
                  <div style={{fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <div style={{width: '6px', height: '6px', backgroundColor: '#ef4444', borderRadius: '50%'}}></div>
                    Offline
                  </div>
                )}
                {!loading && !error && (
                  <div style={{fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <div style={{width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%'}}></div>
                    Real-time
                  </div>
                )}
              </div>
              <div style={styles.dropdown}>
                <button style={styles.dropdownButton}>TECH STRATEGY TEAM <ChevronDown size={16} /></button>
              </div>
              <div style={styles.dropdown}>
                <button style={styles.dropdownButton}>R&D Strategy Group <ChevronDown size={16} /></button>
              </div>
              <div style={styles.dropdown}>
                <button style={styles.dropdownButton}>All Parts <ChevronDown size={16} /></button>
              </div>
              <div style={styles.dropdown}>
                <button style={styles.dropdownButton}>All Years <ChevronDown size={16} /></button>
              </div>
            </div>
          </header>

          {/* Mentor Description */}
          <div style={{
            margin: '20px 40px',
            padding: '16px 24px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1a202c',
              margin: '0 0 8px 0'
            }}>
              {mentorInfo ? `${mentorInfo.name}'s Statistics` : 'My Mentor Statistics'}
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              margin: '0',
              lineHeight: '1.5'
            }}>
              {loading 
                ? 'Loading your personal mentor statistics...'
                : error 
                ? 'Showing demo data. Please ensure you are logged in and the backend is running.'
                : mentorInfo 
                ? `Personalized metrics for your ${mentorInfo.total_worklets} worklets and ${mentorInfo.active_worklets} active assignments.`
                : 'Your personal mentor statistics and worklet metrics.'
              }
            </p>
          </div>

          <div style={styles.dashboardContainer}>
            <div style={{...styles.card, animationDelay: '0.1s'}}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>My Worklet Status</h3>
                <button style={styles.exportButton}>Export <Download size={14} style={{marginLeft: '4px'}}/></button>
              </div>
              <div style={styles.barChart}>
                {Object.entries(stats.statusCounts || {}).map(([status, count], index) => (
                  <Bar
                    key={status}
                    label={status}
                    value={count}
                    maxValue={maxStatusValue}
                    color={statusColors[status]}
                    delay={`${index * 0.1 + 0.5}s`}
                  />
                ))}
              </div>
            </div>

            <div style={{...styles.card, animationDelay: '0.2s'}}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>My Mentoring Overview</h3>
                <button style={styles.exportButton}>Export <Download size={14} style={{marginLeft: '4px'}}/></button>
              </div>
              <div style={styles.engagementGrid}>
                {Object.entries(engagementData).map(([label, value], index) => (
                  <div key={label} style={{...styles.kpiBubble, animationDelay: `${index * 0.05 + 0.3}s`}}>
                    {label === 'My Students' && <Users size={28} style={styles.kpiBubbleIcon} />}
                    {label === 'My Worklets' && <CheckCircle size={28} style={styles.kpiBubbleIcon} />}
                    {label === 'Avg Progress' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.kpiBubbleIcon}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    )}
                    {label === 'High Priority' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.kpiBubbleIcon}>
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                    )}
                    {label === 'Papers Published' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.kpiBubbleIcon}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    )}
                    {label === 'Patents Filed' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.kpiBubbleIcon}>
                        <path d="M12 22c-3.31 0-6-2.69-6-6V6l6-4 6 4v10c0 3.31-2.69 6-6 6z"></path>
                        <path d="M12 22v-6"></path>
                        <path d="M9.5 16h5"></path>
                        <path d="M12 2L6 6h12z"></path>
                      </svg>
                    )}
                    <h4 style={styles.kpiBubbleH4}>
                      <AnimatedNumber value={value || 0} />
                      {label === 'Avg Progress' && '%'}
                    </h4>
                    <p style={styles.kpiBubbleP}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{...styles.card, animationDelay: '0.3s'}}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>My Worklet Performance</h3>
                <button style={styles.exportButton}>Export <Download size={14} style={{marginLeft: '4px'}}/></button>
              </div>
              <div style={styles.barChart}>
                {Object.entries(stats.performanceCounts || {}).map(([quality, count], index) => (
                  <Bar
                    key={quality}
                    label={quality}
                    value={count}
                    maxValue={maxPerformanceValue}
                    color={performanceColors[quality]}
                    delay={`${index * 0.1 + 0.5}s`}
                  />
                ))}
              </div>
            </div>

            <div style={{...styles.card, animationDelay: '0.4s'}}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>My Worklet Risk Assessment</h3>
                <button style={styles.exportButton}>Export <Download size={14} style={{marginLeft: '4px'}}/></button>
              </div>
              <div style={styles.donutChartContainer}>
                <div style={{...styles.donutChartWrapper, animationDelay: '0.6s'}}>
                  <div
                    style={{
                      ...styles.donutChart,
                      background: totalRisk > 0 ? `conic-gradient(
                        ${riskSliceColors['High Risk']} 0deg ${(riskData['High Risk'] || 0) / totalRisk * 360}deg,
                        ${riskSliceColors['Medium Risk']} ${(riskData['High Risk'] || 0) / totalRisk * 360}deg ${((riskData['High Risk'] || 0) + (riskData['Medium Risk'] || 0)) / totalRisk * 360}deg,
                        ${riskSliceColors['Low Risk']} ${((riskData['High Risk'] || 0) + (riskData['Medium Risk'] || 0)) / totalRisk * 360}deg 360deg
                      )` : '#e2e8f0',
                    }}
                  ></div>
                  <div style={styles.donutChartCenter}>
                    <span style={styles.donutChartTotalLabel}>Total</span>
                    <span style={styles.donutChartTotalValue}><AnimatedNumber value={totalRisk} /></span>
                  </div>
                </div>
                <div style={styles.donutLegend}>
                  {Object.entries(riskData).map(([riskType, count]) => (
                    <div key={riskType} style={styles.legendItem}>
                      <span style={{...styles.legendDot, backgroundColor: riskSliceColors[riskType]}}></span>
                      {riskType} <span style={styles.legendCount}><AnimatedNumber value={count || 0} /></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default StatisticsDashboard;

// Styles object
const styles = {
  pageContainer: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#eef2f6',
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    color: '#334155',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
    position: 'sticky',
    zIndex: 10,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    marginRight: '24px',
  },
  samsungLogo: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0a1d41',
    letterSpacing: '-0.5px',
  },
  prismLogo: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#005a9e',
    display: 'flex',
    alignItems: 'baseline',
  },
  prismBracket: {
    color: '#60a5fa',
    fontSize: '18px',
    marginRight: '2px',
    fontWeight: '700',
  },
  headerRight: {
    display: 'flex',
    gap: '12px',
  },
  dropdown: {
    position: 'relative',
  },
  dropdownButton: {
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '14px',
    color: '#475569',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'background-color 0.2s, border-color 0.2s',
  },
  dashboardContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
    gap: '24px',
    padding: '24px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    opacity: 0,
    transform: 'translateY(20px)',
    animation: 'fadeInUp 0.6s ease-out forwards',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  cardTitle: {
    margin: 0,
    color: '#1e293b',
    fontSize: '18px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  exportButton: {
    backgroundColor: 'transparent',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '13px',
    color: '#475569',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
  },
  barChart: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '220px',
    padding: '16px 0',
    flexGrow: 1,
    position: 'relative',
    backgroundSize: '100% 25%',
    backgroundImage: 'linear-gradient(to top, #f1f5f9 1px, transparent 1px)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  barContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '18%',
    textAlign: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
    zIndex: 1,
  },
  bar: {
    width: '80%',
    borderRadius: '4px 4px 0 0',
    boxShadow: 'inset 0 -2px 4px rgba(0, 0, 0, 0.1)',
    transformOrigin: 'bottom',
    animation: 'growBar 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards',
  },
  barValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px',
    whiteSpace: 'nowrap',
  },
  barLabel: {
    marginTop: '12px',
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  engagementGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    textAlign: 'center',
    flexGrow: 1,
    paddingTop: '10px',
  },
  kpiBubble: {
    padding: '16px',
    borderRadius: '12px',
    backgroundColor: '#e0f2fe',
    border: '1px solid #90cdf4',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'transform 0.2s',
    opacity: 0,
    transform: 'translateY(10px)',
    animation: 'fadeInUp 0.4s ease-out forwards',
  },
  kpiBubbleIcon: {
    color: '#1d4ed8',
    marginBottom: '8px',
  },
  kpiBubbleH4: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e3a8a',
  },
  kpiBubbleP: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#3b82f6',
    fontWeight: '500',
  },
  donutChartContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '30px',
    flexGrow: 1,
    paddingTop: '16px',
  },
  donutChartWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'spinIn 0.8s ease-out forwards',
    width: '180px',
    height: '180px',
  },
  donutChart: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
  },
  donutChartCenter: {
    position: 'absolute',
    backgroundColor: 'white',
    width: '110px',
    height: '110px',
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e2e8f0',
  },
  donutChartTotalLabel: {
    color: '#64748b',
    fontSize: '13px',
    fontWeight: '500',
  },
  donutChartTotalValue: {
    color: '#1e293b',
    fontSize: '26px',
    fontWeight: '700',
  },
  donutLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontSize: '14px',
    color: '#475569',
    minWidth: '120px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'color 0.2s',
  },
  legendDot: {
    height: '12px',
    width: '12px',
    borderRadius: '4px',
    display: 'inline-block',
    flexShrink: 0,
  },
  legendCount: {
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 'auto',
  }
};