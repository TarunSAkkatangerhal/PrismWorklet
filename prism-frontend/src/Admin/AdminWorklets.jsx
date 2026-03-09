import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AdminLeftSidebar } from './AdminSidebar';
import { ThemeContext } from '../context/ThemeContext';
import API from '../api';
import * as XLSX from 'xlsx';
import {
  Search, ChevronRight, ChevronLeft, Target, Activity, CheckCircle, X, Clock,
  Users, Grid3X3, List, Building2, Briefcase, AlertCircle, Folder,
  TrendingUp, Filter, ChevronDown, Calendar, Layers, Shield, Download, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'on hold', label: 'On Hold' },
  { value: 'dropped', label: 'Dropped' },
];

const riskOptions = [
  { value: 'all', label: 'All Risk Levels' },
  { value: 'safe', label: 'Safe' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const statusColor = (s) => {
  const map = {
    blue:   { bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-800 dark:text-blue-300',   border: 'border-blue-200'   },
    yellow: { bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-800 dark:text-blue-300',   border: 'border-blue-200'   },
    green:  { bg: 'bg-green-100 dark:bg-green-900/30',   text: 'text-green-800 dark:text-green-300', border: 'border-green-200'  },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', border: 'border-orange-200' },
    red:    { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-800 dark:text-red-300',     border: 'border-red-200'    },
  };
  if (!s) return map.blue;
  const l = s.toLowerCase();
  if (l.includes('ongoing'))   return map.yellow;
  if (l.includes('completed')) return map.green;
  if (l.includes('hold'))      return map.orange;
  if (l.includes('dropped'))   return map.red;
  if (l.includes('start'))     return map.blue;
  return map.blue;
};

const riskColor = (r) => {
  if (!r) return 'text-slate-400';
  const l = r.toLowerCase();
  if (l === 'safe' || l === 'green')   return 'text-green-500';
  if (l === 'medium' || l === 'amber') return 'text-yellow-500';
  if (l === 'high' || l === 'red')     return 'text-red-500';
  return 'text-slate-400';
};

// Custom dropdown component
const FilterDropdown = ({ label, icon: Icon, value, options, onChange, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all duration-200 text-sm w-[150px] ${
          isDarkMode
            ? 'bg-slate-800/50 border-slate-600/50 text-slate-200 hover:bg-slate-700/50'
            : 'bg-white/80 border-slate-300/50 text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Icon size={16} className={`flex-shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
        <span className="font-medium truncate flex-1 text-left">{selectedOption.label}</span>
        <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute top-full left-0 mt-1 z-20 min-w-full rounded-lg border shadow-lg overflow-hidden ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-600'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="max-h-56 overflow-y-auto">
                {options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-sm text-left transition-colors whitespace-nowrap ${
                      value === opt.value
                        ? isDarkMode
                          ? 'bg-purple-600/30 text-purple-300'
                          : 'bg-purple-100 text-purple-700'
                        : isDarkMode
                          ? 'text-slate-300 hover:bg-slate-700'
                          : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminWorklets = () => {
  useDocumentTitle('PRISM Admin - Worklets');
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useContext(ThemeContext);

  // Get initial filters from navigation state (e.g., from dashboard tiles)
  const initialStatusFilter = location.state?.statusFilter || 'all';
  const initialYearFilter = location.state?.yearFilter || 'all';
  const initialTeamFilter = location.state?.teamFilter || 'all';
  const initialDomainFilter = location.state?.domainFilter || 'all';

  const [worklets, setWorklets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  // Filter states
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState(initialTeamFilter);
  const [domainFilter, setDomainFilter] = useState(initialDomainFilter);
  const [riskFilter, setRiskFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(initialYearFilter);

  // Filter options from API
  const [colleges, setColleges] = useState([]);
  const [teams, setTeams] = useState([]);
  const [domains, setDomains] = useState([]);
  const [stages, setStages] = useState([]);
  const [years, setYears] = useState([]);

  // Update filters when navigating from dashboard tiles
  useEffect(() => {
    if (location.state) {
      if (location.state.statusFilter !== undefined) {
        setStatusFilter(location.state.statusFilter);
      }
      if (location.state.yearFilter !== undefined) {
        setYearFilter(location.state.yearFilter);
      }
      if (location.state.teamFilter !== undefined) {
        setTeamFilter(location.state.teamFilter);
      }
      if (location.state.domainFilter !== undefined) {
        setDomainFilter(location.state.domainFilter);
      }
    }
  }, [location.state]);

  // Fetch worklets
  useEffect(() => {
    const fetchWorklets = async () => {
      try {
        setLoading(true);
        const res = await API.get('/worklets/');
        setWorklets(res.data);
      } catch (err) {
        console.error('Failed to fetch worklets:', err);
        setError('Failed to load worklets');
      } finally {
        setLoading(false);
      }
    };
    fetchWorklets();
  }, []);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch colleges
        API.get('/api/admin/colleges').then(res => {
          setColleges(res.data || []);
        }).catch(() => setColleges([]));

        // Teams will be derived from worklets data

        // Fetch stages
        API.get('/worklets/stages').then(res => {
          setStages(res.data || []);
        }).catch(() => setStages([]));
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };
    fetchFilterOptions();
  }, []);

  // Derive years, teams, and domains from worklets data
  useEffect(() => {
    if (worklets.length > 0) {
      const uniqueYears = [...new Set(worklets.map(w => w.year).filter(Boolean))].sort((a, b) => b - a);
      setYears(uniqueYears);
      const uniqueTeams = [...new Set(worklets.map(w => w.team).filter(Boolean))].sort();
      setTeams(uniqueTeams);
      const uniqueDomains = [...new Set(worklets.map(w => w.domain).filter(Boolean))].sort();
      setDomains(uniqueDomains);
    }
  }, [worklets]);

  // Build filter option arrays
  const collegeOptions = useMemo(() => [
    { value: 'all', label: 'All Colleges' },
    ...colleges.map(c => ({ value: c.name, label: c.name }))
  ], [colleges]);

  const teamOptions = useMemo(() => [
    { value: 'all', label: 'All Teams' },
    ...teams.map(t => ({ value: t, label: t }))
  ], [teams]);

  const domainOptions = useMemo(() => [
    { value: 'all', label: 'All Domains' },
    ...domains.map(d => ({ value: d, label: d }))
  ], [domains]);

  const stageOptions = useMemo(() => [
    { value: 'all', label: 'All Stages' },
    ...stages.map(s => ({ value: s.stage, label: s.stage }))
  ], [stages]);

  const yearOptions = useMemo(() => [
    { value: 'all', label: 'All Years' },
    ...years.map(y => ({ value: y.toString(), label: y.toString() }))
  ], [years]);

  const filtered = useMemo(() => {
    let list = worklets;

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(w => {
        const s = (w.status || '').toLowerCase();
        return s.includes(statusFilter);
      });
    }

    // College filter
    if (collegeFilter !== 'all') {
      list = list.filter(w => w.college === collegeFilter);
    }

    // Team filter
    if (teamFilter !== 'all') {
      list = list.filter(w => w.team === teamFilter);
    }

    // Domain filter
    if (domainFilter !== 'all') {
      list = list.filter(w => w.domain === domainFilter);
    }

    // Risk filter
    if (riskFilter !== 'all') {
      list = list.filter(w => {
        const r = (w.riskStatus || '').toLowerCase();
        if (riskFilter === 'safe') return r === 'safe' || r === 'green';
        if (riskFilter === 'medium') return r === 'medium' || r === 'amber';
        if (riskFilter === 'high') return r === 'high' || r === 'red';
        return true;
      });
    }

    // Stage filter
    if (stageFilter !== 'all') {
      list = list.filter(w => w.stage === stageFilter);
    }

    // Year filter
    if (yearFilter !== 'all') {
      list = list.filter(w => w.year?.toString() === yearFilter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(w =>
        (w.title || '').toLowerCase().includes(q) ||
        (w.cert_id || '').toLowerCase().includes(q) ||
        (w.college || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [worklets, statusFilter, collegeFilter, teamFilter, domainFilter, riskFilter, stageFilter, yearFilter, search]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, collegeFilter, teamFilter, domainFilter, riskFilter, stageFilter, yearFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedWorklets = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Excel export function
  const handleExportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Filtered Worklets List
      const workletListData = [
        ['Worklet List Export'],
        ['Generated On', new Date().toLocaleString()],
        ['Total Worklets', filtered.length],
        [''],
        ['ID', 'Certificate ID', 'Title', 'Status', 'College', 'Group', 'Stage', 'Students', 'Progress (%)', 'Performance', 'Risk Status', 'Year']
      ];
      
      filtered.forEach(w => {
        workletListData.push([
          w.id || '',
          w.cert_id || '',
          w.title || '',
          w.status || 'To Start',
          w.college || '',
          w.group_mg_id || '',
          w.stage || '',
          w.student_count || 0,
          w.worklet_progress || 0,
          w.performance || '',
          w.riskStatus || '',
          w.year || ''
        ]);
      });
      
      const ws1 = XLSX.utils.aoa_to_sheet(workletListData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Worklets');

      // Sheet 2: Applied Filters
      const filtersData = [
        ['Applied Filters'],
        ['Generated On', new Date().toLocaleString()],
        [''],
        ['Filter Type', 'Value'],
        ['Search Term', search || 'None'],
        ['Status', statusFilter === 'all' ? 'All Statuses' : statusFilter],
        ['College', collegeFilter === 'all' ? 'All Colleges' : collegeFilter],
        ['Team', teamFilter === 'all' ? 'All Teams' : teamFilter],
        ['Risk Status', riskFilter === 'all' ? 'All Risk Levels' : riskFilter],
        ['Stage', stageFilter === 'all' ? 'All Stages' : stageFilter],
        ['Year', yearFilter === 'all' ? 'All Years' : yearFilter]
      ];
      
      const ws2 = XLSX.utils.aoa_to_sheet(filtersData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Filters');

      // Sheet 3: Summary Statistics
      const total = filtered.length;
      const active = filtered.filter(w => w.status === 'Ongoing').length;
      const completed = filtered.filter(w => w.status === 'Completed').length;
      const pending = filtered.filter(w => w.status === 'To Start' || w.status === 'Pending').length;
      
      const statusBreakdown = {};
      filtered.forEach(w => {
        const status = w.status || 'To Start';
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      });
      
      const riskBreakdown = {};
      filtered.forEach(w => {
        const risk = w.riskStatus || 'Unknown';
        riskBreakdown[risk] = (riskBreakdown[risk] || 0) + 1;
      });
      
      const summaryData = [
        ['Worklet Statistics'],
        ['Generated On', new Date().toLocaleString()],
        [''],
        ['Overview', ''],
        ['Total Worklets', total],
        ['Active (Ongoing)', active],
        ['Completed', completed],
        ['Pending/To Start', pending],
        [''],
        ['Status Breakdown', ''],
        ...Object.entries(statusBreakdown).map(([status, count]) => [status, count]),
        [''],
        ['Risk Status Breakdown', ''],
        ...Object.entries(riskBreakdown).map(([risk, count]) => [risk, count])
      ];
      
      const ws3 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Summary');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = 'PRISM_Admin_Worklets_' + timestamp + '.xlsx';
      
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export worklets to Excel. Please try again.');
    }
  };

  // Base filtered list (year, team, and domain filters from navigation/dashboard)
  const baseFiltered = useMemo(() => {
    let list = worklets;
    
    // Apply year filter
    if (yearFilter !== 'all') {
      list = list.filter(w => w.year?.toString() === yearFilter);
    }
    
    // Apply team filter
    if (teamFilter !== 'all') {
      list = list.filter(w => w.team === teamFilter);
    }
    
    // Apply domain filter
    if (domainFilter !== 'all') {
      list = list.filter(w => w.domain === domainFilter);
    }
    
    return list;
  }, [worklets, yearFilter, teamFilter, domainFilter]);

  // Counts based on base-filtered list (matches dashboard counts)
  const counts = useMemo(() => {
    const c = { all: baseFiltered.length, ongoing: 0, completed: 0, 'on hold': 0, dropped: 0 };
    baseFiltered.forEach(w => {
      const s = (w.status || '').toLowerCase();
      if (s.includes('ongoing'))   c.ongoing++;
      else if (s.includes('completed')) c.completed++;
      else if (s.includes('hold'))      c['on hold']++;
      else if (s.includes('dropped'))   c.dropped++;
    });
    return c;
  }, [baseFiltered]);

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('all');
    setCollegeFilter('all');
    setTeamFilter('all');
    setDomainFilter('all');
    setRiskFilter('all');
    setStageFilter('all');
    setYearFilter('all');
    setSearch('');
  };

  const hasActiveFilters = statusFilter !== 'all' || collegeFilter !== 'all' || 
    teamFilter !== 'all' || domainFilter !== 'all' || riskFilter !== 'all' || stageFilter !== 'all' || 
    yearFilter !== 'all' || search.trim();

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 overflow-hidden dark:bg-slate-900 dark:text-slate-200">
      <AdminLeftSidebar />

      <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        <div className="max-w-none mx-0 p-4 pl-6">

        {/* Header */}
        <div className={`${
          isDarkMode
            ? 'bg-gradient-to-r from-slate-800/80 via-slate-700/50 to-slate-800/80 backdrop-blur-sm border-slate-700/50'
            : 'bg-gradient-to-r from-white/80 via-purple-50/50 to-indigo-50/30 backdrop-blur-sm border-purple-200/30'
        } rounded-2xl shadow-lg border p-4 mb-4`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-4xl font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Worklet Management
              </h1>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {hasActiveFilters ? (
                  <>Showing <span className="font-semibold">{filtered.length}</span> worklets {statusFilter !== 'all' && <span className="capitalize">({statusFilter})</span>} {yearFilter !== 'all' && <span>• Year: {yearFilter}</span>} {teamFilter !== 'all' && <span>• Team: {teamFilter}</span>} {domainFilter !== 'all' && <span>• Domain: {domainFilter}</span>}</>
                ) : (
                  'View and manage all worklets across the platform'
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{counts.all}</div>
                <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total</div>
              </div>
              <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{counts.ongoing}</div>
                <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Active</div>
              </div>
              <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{counts.completed}</div>
                <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Completed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filters inline */}
        <div className={`flex items-center gap-3 mb-4 px-4 py-3 rounded-lg relative z-30 flex-wrap ${
          isDarkMode
            ? 'bg-slate-800/80 border-slate-700/50'
            : 'bg-white/60 border-slate-200/50'
        } border shadow-sm`}>
          <div className="relative flex-shrink-0">
            <button
              onClick={() => {
                const el = document.getElementById('worklet-search-input');
                if (el) { el.classList.toggle('hidden'); if (!el.classList.contains('hidden')) el.focus(); }
              }}
              className={`p-2.5 rounded-lg border transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-800/50 border-slate-600/50 text-slate-200 hover:bg-slate-700/50'
                  : 'bg-white/80 border-slate-300/50 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Search size={18} />
            </button>
            <input
              id="worklet-search-input"
              type="text"
              placeholder="Search worklets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onBlur={e => { if (!e.target.value) e.target.classList.add('hidden'); }}
              className={`hidden absolute left-0 top-full mt-1 w-72 pl-4 pr-4 py-2.5 rounded-lg border transition-all duration-200 text-sm z-40 ${
                isDarkMode
                  ? 'bg-slate-800 border-gray-700/30 text-white placeholder-gray-400/60 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20'
                  : 'bg-white border-gray-300/40 text-slate-800 placeholder-gray-500/60 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20'
              } shadow-lg`}
            />
          </div>

          <FilterDropdown
            label="Team"
            icon={Users}
            value={teamFilter}
            options={teamOptions}
            onChange={setTeamFilter}
            isDarkMode={isDarkMode}
          />
          <FilterDropdown
            label="Domain"
            icon={Folder}
            value={domainFilter}
            options={domainOptions}
            onChange={setDomainFilter}
            isDarkMode={isDarkMode}
          />
          <FilterDropdown
            label="College"
            icon={Building2}
            value={collegeFilter}
            options={collegeOptions}
            onChange={setCollegeFilter}
            isDarkMode={isDarkMode}
          />
          <FilterDropdown
            label="Status"
            icon={Activity}
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
            isDarkMode={isDarkMode}
          />
          <FilterDropdown
            label="Risk Status"
            icon={Shield}
            value={riskFilter}
            options={riskOptions}
            onChange={setRiskFilter}
            isDarkMode={isDarkMode}
          />
          <FilterDropdown
            label="Stage"
            icon={Layers}
            value={stageFilter}
            options={stageOptions}
            onChange={setStageFilter}
            isDarkMode={isDarkMode}
          />
          <FilterDropdown
            label="Year"
            icon={Calendar}
            value={yearFilter}
            options={yearOptions}
            onChange={setYearFilter}
            isDarkMode={isDarkMode}
          />

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className={`flex-shrink-0 p-2 rounded-full transition-colors ${
                isDarkMode
                  ? 'text-red-400 hover:bg-red-600/20'
                  : 'text-red-500 hover:bg-red-100'
              }`}
              title="Reset all filters"
            >
              <RotateCcw size={16} />
            </button>
          )}

          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <motion.button
              onClick={handleExportToExcel}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-purple-400 to-indigo-400 text-white shadow-lg border border-purple-200/50'
                  : 'bg-gradient-to-r from-purple-300 to-indigo-300 text-white shadow-lg border border-purple-200/50'
              }`}
              title="Export filtered worklets to Excel"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download size={15} />
              <span>Export</span>
            </motion.button>
          </div>
        </div>

        {/* Showing count + View toggle + Pagination */}
        {!loading && !error && filtered.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className={`flex rounded-md overflow-hidden border ${isDarkMode ? 'border-slate-600/50' : 'border-slate-300/50'}`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1.5 transition-colors ${
                    viewMode === 'grid'
                      ? isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                      : isDarkMode ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50' : 'bg-white/80 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2.5 py-1.5 transition-colors ${
                    viewMode === 'list'
                      ? isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                      : isDarkMode ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50' : 'bg-white/80 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`p-1 rounded-md transition-colors ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-200 text-slate-600'}`}
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`dots-${i}`} className={`px-1 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-[28px] h-7 rounded-md text-xs font-medium transition-colors ${
                          currentPage === p
                            ? 'bg-purple-600 text-white'
                            : isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-1 rounded-md transition-colors ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-200 text-slate-600'}`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-500 gap-2">
            <AlertCircle className="w-8 h-8" />
            <p>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
            <Briefcase className="w-10 h-10" />
            <p className="text-lg font-medium">No worklets found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[clamp(0.75rem,1.5vw,1.25rem)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {paginatedWorklets.map(w => {
              const sc = statusColor(w.status);
              return (
                <motion.div
                  key={w.id}
                  onClick={() => navigate(`/admin-worklet/${w.id}`)}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl shadow-md p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.01] group"
                  whileHover={{ y: -2 }}
                >
                  {/* Status badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                      {w.status || 'To Start'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{w.cert_id || `#${w.id}`}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {w.title}
                  </h3>

                  {/* Meta info */}
                  <div className="space-y-1.5 mb-3">
                    {w.college && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Building2 className="w-3.5 h-3.5" /> {w.college}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Users className="w-3.5 h-3.5" /> {w.student_count ?? 0} Students
                    </div>
                    {w.group_mg_id && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Target className="w-3.5 h-3.5" /> Group {w.group_mg_id}
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-auto">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400">Progress</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{w.worklet_progress ?? 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.min(w.worklet_progress ?? 0, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-hover:text-purple-500 transition-colors" />
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          /* List view */
          <div className="space-y-2">
            {/* List header */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <div className="col-span-1">ID</div>
              <div className="col-span-3">Title</div>
              <div className="col-span-2">College</div>
              <div className="col-span-1">Students</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Performance</div>
              <div className="col-span-1">Risk</div>
              <div className="col-span-2">Progress</div>
            </div>
            {paginatedWorklets.map(w => {
              const sc = statusColor(w.status);
              return (
                <motion.div
                  key={w.id}
                  onClick={() => navigate(`/admin-worklet/${w.id}`)}
                  className="grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 group"
                  whileHover={{ x: 3 }}
                >
                  <div className="col-span-1 text-xs font-mono text-slate-400">{w.cert_id || `#${w.id}`}</div>
                  <div className="col-span-3 text-sm font-semibold text-slate-800 dark:text-white truncate group-hover:text-purple-600 transition-colors">{w.title}</div>
                  <div className="col-span-2 text-xs text-slate-500 dark:text-slate-400 truncate">{w.college || '—'}</div>
                  <div className="col-span-1 text-xs text-slate-600 dark:text-slate-300 text-center">{w.student_count ?? 0}</div>
                  <div className="col-span-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{w.status || 'To Start'}</span>
                  </div>
                  <div className="col-span-1 text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">{w.performance || '—'}</div>
                  <div className={`col-span-1 text-xs font-bold capitalize ${riskColor(w.riskStatus)}`}>{w.riskStatus || '—'}</div>
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${Math.min(w.worklet_progress ?? 0, 100)}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-8 text-right">{w.worklet_progress ?? 0}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default AdminWorklets;
