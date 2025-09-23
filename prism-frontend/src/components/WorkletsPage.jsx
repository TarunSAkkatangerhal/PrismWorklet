import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  Calendar, 
  Users, 
  Home,
  LayoutGrid, // Icon for Grid View
  List        // Icon for List View
} from "lucide-react";

// --- IMPORT DATA FROM THE NEW FILE ---
import { STATUS_OPTIONS, statusIcons } from "./data";

export default function WorkletsPage() {
  const location = useLocation();
  const [workletsData, setWorkletsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Ongoing");
  const [isHoverActive, setIsHoverActive] = useState(false);
  const [layout, setLayout] = useState("grid"); // 'grid' or 'list'

  // Fetch worklets from backend
  useEffect(() => {
    const fetchWorklets = async () => {
      try {
        setLoading(true);
        const userEmail = localStorage.getItem("user_email");
        const token = localStorage.getItem("access_token");
        
        if (!userEmail || !token) {
          throw new Error("User information not found");
        }

        const response = await axios.get(
          `http://localhost:8000/worklets/mentor/${encodeURIComponent(userEmail)}/worklets`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        );
        
        // Transform backend data to match expected format
        const transformedData = (response.data || []).map((worklet, index) => {
          const imageUrls = [
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop"
          ];
          
          return {
            id: worklet.id,
            title: worklet.cert_id,
            status: worklet.status || "Ongoing",
            progress: worklet.percentage_completion || 0,
            description: worklet.description || "No description available",
            imageUrl: imageUrls[index % imageUrls.length],
            startDate: worklet.start_date ? new Date(worklet.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
            endDate: worklet.end_date ? new Date(worklet.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
            students: [], // Will be fetched separately if needed
            notificationCount: Math.floor(Math.random() * 6),
            quality: ["Excellence", "Good", "Needs Attention"][index % 3],
            college: worklet.college
          };
        });
        
        setWorkletsData(transformedData);
      } catch (error) {
        console.error("Error fetching worklets:", error);
        setWorkletsData([]); // Show empty state instead of fallback
      } finally {
        setLoading(false);
      }
    };

    fetchWorklets();
  }, []);

  const filteredWorklets = workletsData.filter(
    (w) => w.status === activeTab
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl">Loading worklets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* --- SIDEBAR --- */}
      <nav 
        className="w-20 bg-white dark:bg-gray-800 dark:border-r dark:border-gray-700 shadow-md flex flex-col z-20"
        onMouseEnter={() => setIsHoverActive(true)}
        onMouseLeave={() => setIsHoverActive(false)}
      >
        <div className="h-20 flex items-center justify-center">
            <div className="w-12 h-12 flex items-center justify-center rounded-lg">
                <img src="https://play-lh.googleusercontent.com/e8F34JODgtXalC7mK09QocqhT5QCqDBPRPclFZmkcWZFc_oy2FCpofb5AFdyG_1hdg=w480-h960-rw" alt="Prism" className="object-contain"/>
            </div>
        </div>
        <div className="flex-grow flex flex-col items-center justify-center space-y-4 w-full">
          <Link
            to="/home"
            className="relative w-full h-12 flex justify-center items-center text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
          >
            <Home size={27} />
            {isHoverActive && (
              <div className="absolute left-full top-0 h-full flex items-center pl-4 pr-8 bg-gradient-to-r from-white via-white/95 to-transparent dark:from-gray-800 dark:via-gray-800/95 dark:to-transparent rounded-r-lg shadow-sm animate-fade-in-right pointer-events-none">
                <span className="text-gray-800 dark:text-gray-200 font-medium whitespace-nowrap">Home</span>
              </div>
            )}
          </Link>
          <div className="w-full space-y-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`relative w-full h-12 flex justify-center items-center rounded-lg transition-all duration-200 ${
                  activeTab === status
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                    : "text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                }`}
              >
                {statusIcons[status]}
                {isHoverActive && (
                  <div className="absolute left-full top-0 h-full flex items-center pl-4 pr-8 bg-gradient-to-r from-white via-white/95 to-transparent dark:from-gray-800 dark:via-gray-800/95 dark:to-transparent rounded-r-lg shadow-sm animate-fade-in-right pointer-events-none">
                    <span className="text-gray-800 dark:text-gray-200 font-medium whitespace-nowrap">{status}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="h-20"></div>
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-400">{activeTab} Worklets</h2>
            {/* Layout Toggle */}
            <div className="flex items-center gap-1 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
                <button onClick={() => setLayout('grid')} className={`p-1.5 rounded-md transition-colors ${layout === 'grid' ? 'bg-white text-indigo-600 shadow-sm dark:bg-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'}`} aria-label="Grid View">
                    <LayoutGrid size={20} />
                </button>
                <button onClick={() => setLayout('list')} className={`p-1.5 rounded-md transition-colors ${layout === 'list' ? 'bg-white text-indigo-600 shadow-sm dark:bg-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'}`} aria-label="List View">
                    <List size={20} />
                </button>
            </div>
        </div>
        
        <div className={layout === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
          : "flex flex-col gap-4"
        }>
          {filteredWorklets.length > 0 ? (
            filteredWorklets.map((worklet) => (
              layout === 'grid' ? (
                <WorkletGridItem key={worklet.id} worklet={worklet} />
              ) : (
                <WorkletListItem key={worklet.id} worklet={worklet} />
              )
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No worklets found for "{activeTab}".</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// --- Component for Grid View Item ---
const WorkletGridItem = ({ worklet }) => (
  <Link to={`/worklet/${worklet.id}`}>
    <div className="bg-white dark:bg-gray-800 dark:border dark:border-gray-700 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group h-full">
      <img src={worklet.imageUrl} alt={worklet.title} className="h-40 w-full object-cover group-hover:scale-105 transition-transform duration-300"/>
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">{worklet.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 h-10 overflow-hidden">{worklet.description}</p>
        <div className="mt-4 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5"><Calendar size={14}/> {worklet.startDate} - {worklet.endDate}</span>
          <span className="font-semibold">{worklet.progress}%</span>
        </div>
        <div className="mt-2 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" style={{width: `${worklet.progress}%`}}></div>
        </div>
        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"><Users size={16}/> Assigned Students</div>
          <ul className="mt-2 list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            {worklet.students.slice(0, 2).map((student) => (<li key={student}>{student}</li>))}
            {worklet.students.length > 2 && <li className="text-gray-400">...and {worklet.students.length - 2} more</li>}
          </ul>
        </div>
      </div>
    </div>
  </Link>
);

// --- Component for List View Item (ENHANCED) ---
const WorkletListItem = ({ worklet }) => (
    <Link to={`/worklet/${worklet.id}`}>
        {/* --- CHANGE 2: Added entry animation and a subtle "lift" on hover --- */}
        <div className="bg-white dark:bg-gray-800 dark:border dark:border-gray-700 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex items-center group transform hover:scale-[1.01] animate-fade-in">
            <img src={worklet.imageUrl} alt={worklet.title} className="h-full w-40 object-cover flex-shrink-0 rounded-l-lg hidden sm:block"/>
            <div className="p-5 flex-grow">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate pr-4">{worklet.title}</h3>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-500/20 px-3 py-1 rounded-full flex-shrink-0">{worklet.status}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 hidden md:block">{worklet.description}</p>
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Progress</span>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{worklet.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        {/* --- CHANGE 3: Matched progress bar color to theme and added animation --- */}
                        <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${worklet.progress}%` }}></div>
                    </div>
                </div>
                {/* --- CHANGE 4: Reworked the metadata section for better readability --- */}
                <div className="mt-4 flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400 gap-x-4 gap-y-2">
                    {/* --- CHANGE 1: Reduced icon size from 14 to 12 --- */}
                    <span className="flex items-center gap-1.5">
                        <Users size={12}/> 
                        {/* Simplified text and handled pluralization */}
                        {worklet.students.length} Student{worklet.students.length !== 1 ? 's' : ''}
                    </span>
                    {/* Added a subtle separator for clarity on larger screens */}
                    <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                     {/* --- CHANGE 1: Reduced icon size from 14 to 12 --- */}
                    <span className="flex items-center gap-1.5">
                        <Calendar size={12}/> 
                        {worklet.startDate} - {worklet.endDate}
                    </span>
                </div>
            </div>
        </div>
    </Link>
);