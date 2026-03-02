import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AdminLeftSidebar } from './AdminSidebar';
import { ThemeContext } from '../context/ThemeContext';
import API from '../api';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet, AlertCircle, Sparkles, Edit3, Search, Building2, Calendar, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Custom dropdown component
const FilterDropdown = ({ label, icon: Icon, value, options, onChange, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 min-w-[140px] ${
          isDarkMode
            ? 'bg-slate-800/50 border-slate-600/50 text-slate-200 hover:bg-slate-700/50'
            : 'bg-white/80 border-slate-300/50 text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Icon size={14} className={isDarkMode ? 'text-slate-400' : 'text-slate-500'} />
        <span className="text-sm font-medium truncate flex-1 text-left">{selectedOption.label}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
              <div className="max-h-60 overflow-y-auto">
                {options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-sm text-left transition-colors ${
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

const Excellent = () => {
  useDocumentTitle('PRISM Admin - Excellent Worklets');
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);

  const [worklets, setWorklets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Filter states
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [colleges, setColleges] = useState([]);
  const [years, setYears] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch worklets
  useEffect(() => {
    const fetchWorklets = async () => {
      try {
        setLoading(true);
        const res = await API.get('/worklets/');
        // Filter for completed worklets (shown as "Excellent" worklets)
        const excellentWorklets = res.data.filter(
          w => w.status && w.status.toLowerCase() === 'completed'
        );
        setWorklets(excellentWorklets);
      } catch (err) {
        console.error('Failed to fetch worklets:', err);
        setError('Failed to load excellent worklets');
      } finally {
        setLoading(false);
      }
    };
    fetchWorklets();
  }, []);

  // Fetch colleges
  useEffect(() => {
    API.get('/api/admin/colleges').then(res => {
      setColleges(res.data || []);
    }).catch(() => setColleges([]));
  }, []);

  // Derive years from worklets data
  useEffect(() => {
    if (worklets.length > 0) {
      const uniqueYears = [...new Set(worklets.map(w => w.year).filter(Boolean))].sort((a, b) => b - a);
      setYears(uniqueYears);
    }
  }, [worklets]);

  // Build filter option arrays
  const collegeOptions = useMemo(() => [
    { value: 'all', label: 'All Colleges' },
    ...colleges.map(c => ({ value: c.name || c.college_name, label: c.name || c.college_name }))
  ], [colleges]);

  const yearOptions = useMemo(() => [
    { value: 'all', label: 'All Years' },
    ...years.map(y => ({ value: y.toString(), label: y.toString() }))
  ], [years]);

  // Filtered list based on search and filters
  const filtered = useMemo(() => {
    let list = worklets;

    // College filter
    if (collegeFilter !== 'all') {
      list = list.filter(w => w.college === collegeFilter);
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
        (w.team || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [worklets, collegeFilter, yearFilter, search]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Reset to page 1 when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, collegeFilter, yearFilter]);

  // Get risk status color
  const getRiskStatusColor = (risk) => {
    if (!risk) return 'text-slate-400';
    const l = risk.toLowerCase();
    if (l === 'safe' || l === 'green') return 'text-green-600 dark:text-green-400';
    if (l === 'medium' || l === 'amber') return 'text-yellow-600 dark:text-yellow-400';
    if (l === 'high' || l === 'red') return 'text-red-600 dark:text-red-400';
    return 'text-slate-400';
  };

  // Excel export
  const handleExportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const exportData = [
        ['Excellent Worklet Details Export'],
        ['Generated On', new Date().toLocaleString()],
        ['Total Worklets', filtered.length],
        [''],
        ['Worklet ID', 'Worklet Name', 'Risk Status', 'Group', 'Amount', 'Remark', 'Status']
      ];
      
      filtered.forEach(w => {
        exportData.push([
          w.cert_id || `#${w.id}`,
          w.title || '',
          w.riskStatus || '',
          w.team || '',
          '', // Amount placeholder
          '', // Remark placeholder
          w.status || ''
        ]);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Excellent Worklets');
      XLSX.writeFile(wb, `Excellent_Worklets_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Pagination controls
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

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
                  Excellent Worklet Details
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  View all completed worklets with excellent performance
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{filtered.length}</div>
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search + Filters inline */}
          <div className={`flex items-center flex-wrap gap-2 mb-6 p-3 rounded-lg ${
            isDarkMode
              ? 'bg-slate-800/80 border-slate-700/50'
              : 'bg-white/60 border-slate-200/50'
          } border shadow-sm`}>
            <div className="relative w-64">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search With name"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border transition-all duration-200 text-sm ${
                  isDarkMode
                    ? 'bg-slate-800/50 border-gray-700/30 text-white placeholder-gray-400/60 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20'
                    : 'bg-white/70 border-gray-300/40 text-slate-800 placeholder-gray-500/60 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20'
                } backdrop-blur-sm`}
              />
            </div>

            <FilterDropdown
              label="College"
              icon={Building2}
              value={collegeFilter}
              options={collegeOptions}
              onChange={setCollegeFilter}
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

            {(collegeFilter !== 'all' || yearFilter !== 'all') && (
              <button
                onClick={() => {
                  setCollegeFilter('all');
                  setYearFilter('all');
                }}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  isDarkMode
                    ? 'text-purple-400 hover:bg-purple-600/20'
                    : 'text-purple-600 hover:bg-purple-100'
                }`}
              >
                Clear all
              </button>
            )}

            <div className="ml-auto">
              <motion.button
                onClick={handleExportToExcel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-all shadow-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FileSpreadsheet size={16} />
                <span>Export</span>
              </motion.button>
            </div>
          </div>

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
              <Sparkles className="w-10 h-10" />
              <p className="text-lg font-medium">No excellent worklets found</p>
              <p className="text-sm">Try adjusting your search</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className={`rounded-lg border overflow-hidden ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <table className="w-full">
                  <thead>
                    <tr className={`text-left text-sm ${
                      isDarkMode ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-50 text-slate-600'
                    }`}>
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Risk Status</th>
                      <th className="px-4 py-3 font-medium">Group</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Remark</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((w, idx) => (
                      <tr
                        key={w.id}
                        onClick={() => navigate(`/admin-worklet/${w.id}`)}
                        className={`border-t cursor-pointer transition-colors ${
                          isDarkMode
                            ? 'border-slate-700 hover:bg-slate-700/50'
                            : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-4 py-3 text-xs font-mono text-slate-400">
                          {w.cert_id || `#${w.id}`}
                        </td>
                        <td className={`px-4 py-3 text-sm font-semibold truncate max-w-xs ${
                          isDarkMode ? 'text-white' : 'text-slate-800'
                        } hover:text-purple-600 transition-colors`}>
                          {w.title}
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium capitalize ${getRiskStatusColor(w.riskStatus)}`}>
                          {w.riskStatus || '—'}
                        </td>
                        <td className={`px-4 py-3 text-sm ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          {w.team || '—'}
                        </td>
                        <td className={`px-4 py-3 text-sm ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          <Edit3 size={14} className="inline text-slate-400" />
                        </td>
                        <td className={`px-4 py-3 text-sm ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          <Edit3 size={14} className="inline text-slate-400" />
                        </td>
                        <td className={`px-4 py-3 text-sm ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          {w.status || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 mt-4">
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      currentPage === 1
                        ? 'text-slate-400 cursor-not-allowed'
                        : isDarkMode
                          ? 'text-slate-300 hover:bg-slate-700'
                          : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    First
                  </button>
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      currentPage === 1
                        ? 'text-slate-400 cursor-not-allowed'
                        : isDarkMode
                          ? 'text-slate-300 hover:bg-slate-700'
                          : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {getPageNumbers().map(page => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : isDarkMode
                            ? 'text-slate-300 hover:bg-slate-700'
                            : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      currentPage === totalPages
                        ? 'text-slate-400 cursor-not-allowed'
                        : isDarkMode
                          ? 'text-slate-300 hover:bg-slate-700'
                          : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Next
                  </button>
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      currentPage === totalPages
                        ? 'text-slate-400 cursor-not-allowed'
                        : isDarkMode
                          ? 'text-slate-300 hover:bg-slate-700'
                          : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Last
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Excellent;
