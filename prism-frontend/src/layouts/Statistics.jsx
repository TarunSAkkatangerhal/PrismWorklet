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
const Bar = ({ value, label, maxValue, color, delay, dataType }) => {
  const barHeight = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div
      style={styles.barContainer}
      data-bar="true"
      data-type={dataType || ''}
      data-label={label}
      data-value={value}
    >
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
  const [filters, setFilters] = useState({ group: 'All', part: 'All', year: 'All' });
  const [options, setOptions] = useState({ years: [], domains: [], colleges: [] });

  // Fetch mentor-specific statistics from API and then platform stats/filters
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
        setMentorInfo(data.mentor_info);
        // Load filter options for platform stats
        try {
          const filterRes = await fetch('http://localhost:8000/api/dashboard/filters');
          if (filterRes.ok) {
            const fJson = await filterRes.json();
            setOptions(fJson);
          }
        } catch (e) {
          console.warn('Could not load filters');
        }
        // Load platform stats
        await loadPlatformStats(filters);
        setError(null);
      } catch (err) {
        console.error('Error fetching mentor statistics:', err);
        setError(err.message);
        
        // Use fallback data for demo purposes
        setStatisticsData({
          totals: { total_mentors: 10, total_students: 120, total_worklets: 25, ongoing_worklets: 12, completed_worklets: 8, completion_rate: 32 },
          status_counts: { Approved: 3, Ongoing: 12, Completed: 8, 'On Hold': 1, Dropped: 1 },
          performance_counts: { Excellent: 8, 'Very Good': 5, Good: 3, 'Needs Attention': 2 },
          risk_data: { 'High Risk': 1, 'Medium Risk': 1, 'Low Risk': 20 }
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

  // Load platform stats given current filters
  const loadPlatformStats = async (flt) => {
    try {
      const params = new URLSearchParams();
      if (flt?.year && flt.year !== 'All') params.set('year', flt.year);
      if (flt?.group && flt.group !== 'All') params.set('domain', flt.group);
      if (flt?.part && flt.part !== 'All') params.set('college', flt.part);
      const url = `http://localhost:8000/api/dashboard/statistics${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setStatisticsData(json);
      }
    } catch (e) {
      console.error('Failed to load platform stats', e);
    }
  };

  // Export helpers
  const exportPlatform = (section) => {
    try {
      const toCSV = (rows) => rows.map(r => r.map(v => `${String(v).replaceAll('"','""')}`).join(',')).join('\n');
      let rows = [];
      if (section === 'status') {
        rows = [['Status', 'Count'], ...Object.entries(statisticsData?.status_counts || {})];
      } else if (section === 'overview') {
        rows = [['KPI', 'Value'], ...Object.entries({
          'All Worklets': statisticsData?.totals?.total_worklets || 0,
          'All Students': statisticsData?.totals?.total_students || 0,
          'Completion Rate (%)': statisticsData?.totals?.completion_rate || 0,
          'Ongoing': statisticsData?.totals?.ongoing_worklets || 0,
          'Completed': statisticsData?.totals?.completed_worklets || 0,
          'All Mentors': statisticsData?.totals?.total_mentors || 0,
        })];
      } else if (section === 'performance') {
        rows = [['Bucket', 'Count'], ...Object.entries(statisticsData?.performance_counts || {})];
      } else if (section === 'risk') {
        rows = [['Risk', 'Count'], ...Object.entries(statisticsData?.risk_data || {})];
      }
      const csv = toCSV(rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${section}_stats.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
    }
  };

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

  // Platform overview KPIs
  const engagementData = {
    "All Worklets": statisticsData?.totals?.total_worklets || 0,
    "All Students": statisticsData?.totals?.total_students || 0,
    "Completion Rate": statisticsData?.totals?.completion_rate || 0,
    "Ongoing": statisticsData?.totals?.ongoing_worklets || 0,
    "Completed": statisticsData?.totals?.completed_worklets || 0,
    "All Mentors": statisticsData?.totals?.total_mentors || 0
  };

  const riskData = statisticsData?.risk_data || {
    'High Risk': 0,
    'Medium Risk': 0,
    'Low Risk': 0,
  };
  
  const totalRisk = Object.values(riskData).reduce((a, b) => a + b, 0);

  const statusColors = {
    Approved: '#7c3aed',
    Completed: '#2D3748',
    Ongoing: '#4299E1',
    'On Hold': '#ECC94B',
    Dropped: '#F6AD55',
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
    <div className="hide-scrollbar flex-shrink-0" style={{ width: 120 }}><LeftSidebar /></div>
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
              {/* Domain */}
              <div style={styles.dropdown}>
                <select
                  value={filters.group}
                  onChange={(e) => { const f = { ...filters, group: e.target.value }; setFilters(f); loadPlatformStats(f); }}
                  style={styles.dropdownSelect}
                >
                  <option value="All">All Domains</option>
                  {options.domains.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              {/* College */}
              <div style={styles.dropdown}>
                <select
                  value={filters.part}
                  onChange={(e) => { const f = { ...filters, part: e.target.value }; setFilters(f); loadPlatformStats(f); }}
                  style={styles.dropdownSelect}
                >
                  <option value="All">All Colleges</option>
                  {options.colleges.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {/* Year */}
              <div style={styles.dropdown}>
                <select
                  value={filters.year}
                  onChange={(e) => { const f = { ...filters, year: e.target.value }; setFilters(f); loadPlatformStats(f); }}
                  style={styles.dropdownSelect}
                >
                  <option value="All">All Years</option>
                  {options.years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
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
              Platform Statistics
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              margin: '0',
              lineHeight: '1.5'
            }}>
              {loading
                ? 'Loading real-time platform insights...'
                : error
                ? 'Showing demo data. Please ensure you are logged in and the backend is running.'
                : 'Aggregated metrics across all worklets, students, and mentors.'}
            </p>
          </div>

          <div style={styles.dashboardContainer}>
            <div style={{...styles.card, animationDelay: '0.1s'}}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Worklet Status</h3>
                <button style={styles.exportButton} onClick={() => exportPlatform('status')}>Export <Download size={14} style={{marginLeft: '4px'}}/></button>
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
                    dataType="status"
                  />
                ))}
              </div>
            </div>

            <div style={{...styles.card, animationDelay: '0.2s'}}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Platform Overview</h3>
                <button style={styles.exportButton} onClick={() => exportPlatform('overview')}>Export <Download size={14} style={{marginLeft: '4px'}}/></button>
              </div>
              <div style={styles.engagementGrid}>
                {Object.entries(engagementData).map(([label, value], index) => (
                  <div
                    key={label}
                    style={{...styles.kpiBubble, animationDelay: `${index * 0.05 + 0.3}s`}}
                    data-kpi="true"
                    data-label={label}
                    data-value={value}
                  >
                    {label.includes('Students') && <Users size={28} style={styles.kpiBubbleIcon} />}
                    {label.includes('Worklets') && <CheckCircle size={28} style={styles.kpiBubbleIcon} />}
                    {label.includes('Completion') && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.kpiBubbleIcon}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    )}
                    {label === 'Ongoing' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.kpiBubbleIcon}>
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    )}
                    {label === 'Completed' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.kpiBubbleIcon}>
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                    {label === 'All Mentors' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.kpiBubbleIcon}>
                        <path d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM5 8c1.66 0 3-1.34 3-3S6.66 2 5 2 2 3.34 2 5s1.34 3 3 3z"></path>
                        <path d="M13 16.5c0-2.5 3-4 3-4s3 1.5 3 4-1.34 4-3 4-3-1.5-3-4z"></path>
                      </svg>
                    )}
                    <h4 style={styles.kpiBubbleH4}>
                      <AnimatedNumber value={value || 0} />
                      {label.includes('Rate') && '%'}
                    </h4>
                    <p style={styles.kpiBubbleP}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{...styles.card, animationDelay: '0.3s'}}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Performance</h3>
                <button style={styles.exportButton} onClick={() => exportPlatform('performance')}>Export <Download size={14} style={{marginLeft: '4px'}}/></button>
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
                    dataType="performance"
                  />
                ))}
              </div>
            </div>

            <div style={{...styles.card, animationDelay: '0.4s'}}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Risk Assessment</h3>
                <button style={styles.exportButton} onClick={() => exportPlatform('risk')}>Export <Download size={14} style={{marginLeft: '4px'}}/></button>
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
                    <div key={riskType} style={styles.legendItem} data-risk="true" data-label={riskType} data-value={count}>
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
    top: 0,
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
  dropdownSelect: {
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '14px',
    color: '#475569',
    cursor: 'pointer',
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