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
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error("User information not found");
        }
        // Get user id first
        const userResp = await axios.get("http://localhost:8000/auth/profile", {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const userId = userResp?.data?.id;
        if (!userId) throw new Error("User ID not found");
        // Fetch ALL worklets so we can show Completed / On Hold etc.
        const response = await axios.get(
          `http://localhost:8000/api/associations/mentor/${userId}/all-worklets`,
          { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }
        );
        
        // Transform backend data to match expected format (purely dynamic)
  const list = response?.data?.all_worklets || response?.data?.ongoing_worklets || [];
        const imageUrls = [
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=400&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=400&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=400&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=400&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop"
        ];

        const transformedData = list.map((worklet, index) => {
          let pct = typeof worklet.percentage_completion === 'number' ? worklet.percentage_completion : 0;
          if ((worklet.status === 'Completed' || worklet.status === 'Approved') && pct < 100) {
            pct = 100; // Normalize completed/approved to full progress if backend hasn't set it.
          }
          const studentNames = Array.isArray(worklet.students)
            ? worklet.students.map(s => s.name || s).filter(Boolean)
            : [];
          return {
            id: worklet.id,
            title: worklet.cert_id || worklet.title || `Worklet ${worklet.id}`,
            status: worklet.status || 'Ongoing',
            progress: pct,
            description: worklet.description || "No description available",
            imageUrl: imageUrls[index % imageUrls.length],
            startDate: worklet.start_date ? new Date(worklet.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
            endDate: worklet.end_date ? new Date(worklet.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
            students: studentNames,
            quality: worklet.quality || (pct >= 70 ? 'Excellence' : pct >= 30 ? 'Good' : 'Needs Attention'),
            college: worklet.college || null
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
      <main className="flex-1 p-[2vw] overflow-y-auto">
        <div className="flex justify-between items-center mb-[2vh]">
            <h2 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-blue-900 dark:text-blue-400">{activeTab} Worklets</h2>
            {/* Layout Toggle */}
            <div className="flex items-center gap-[0.2vw] p-[0.3vw] bg-gray-200 dark:bg-gray-700 rounded-lg">
                <button onClick={() => setLayout('grid')} className={`p-[0.4vw] rounded-md transition-colors ${layout === 'grid' ? 'bg-white text-indigo-600 shadow-sm dark:bg-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'}`} aria-label="Grid View">
                    <LayoutGrid size={Math.max(16, Math.min(24, window.innerWidth * 0.015))} />
                </button>
                <button onClick={() => setLayout('list')} className={`p-[0.4vw] rounded-md transition-colors ${layout === 'list' ? 'bg-white text-indigo-600 shadow-sm dark:bg-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'}`} aria-label="List View">
                    <List size={Math.max(16, Math.min(24, window.innerWidth * 0.015))} />
                </button>
            </div>
        </div>
        
        <div className={layout === 'grid' 
          ? "grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-[clamp(1rem,2vw,2rem)]" 
          : "flex flex-col gap-[1vh]"
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
      <img src={worklet.imageUrl} alt={worklet.title} className="h-[clamp(8rem,12vw,10rem)] w-full object-cover group-hover:scale-105 transition-transform duration-300"/>
      <div className="p-[clamp(1rem,1.5vw,1.25rem)]">
        <h3 className="font-bold text-[clamp(1rem,1.2vw,1.125rem)] text-gray-900 dark:text-gray-100 truncate">{worklet.title}</h3>
        <p className="text-[clamp(0.75rem,0.9vw,0.875rem)] text-gray-600 dark:text-gray-400 mt-[0.25vw] h-[2.5em] overflow-hidden">{worklet.description}</p>
        <div className="mt-[1vw] flex justify-between items-center text-[clamp(0.6rem,0.8vw,0.75rem)] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-[0.4vw]"><Calendar size={Math.max(12, Math.min(16, window.innerWidth * 0.01))}/> {worklet.startDate} - {worklet.endDate}</span>
          <span className="font-semibold">{worklet.progress}%</span>
        </div>
        <div className="mt-[0.5vw] h-[0.4vw] w-full bg-gray-200 dark:bg-gray-700 rounded-full">
          <div className="h-[0.4vw] bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" style={{width: `${worklet.progress}%`}}></div>
        </div>
        <div className="mt-[1vw]">
          <div className="flex items-center gap-[0.5vw] text-[clamp(0.75rem,0.9vw,0.875rem)] font-semibold text-gray-700 dark:text-gray-300"><Users size={Math.max(14, Math.min(18, window.innerWidth * 0.012))}/> Assigned Students</div>
          <ul className="mt-[0.5vw] list-disc list-inside text-[clamp(0.75rem,0.9vw,0.875rem)] text-gray-600 dark:text-gray-400 space-y-[0.2vw]">
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
            <img src={worklet.imageUrl} alt={worklet.title} className="h-full w-[clamp(8rem,12vw,10rem)] object-cover flex-shrink-0 rounded-l-lg hidden sm:block"/>
            <div className="p-[clamp(1rem,1.5vw,1.25rem)] flex-grow">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-[clamp(1rem,1.2vw,1.125rem)] text-gray-900 dark:text-gray-100 truncate pr-[1vw]">{worklet.title}</h3>
                    <span className="text-[clamp(0.6rem,0.8vw,0.75rem)] font-semibold text-indigo-600 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-500/20 px-[0.75vw] py-[0.25vw] rounded-full flex-shrink-0">{worklet.status}</span>
                </div>
                <p className="text-[clamp(0.75rem,0.9vw,0.875rem)] text-gray-600 dark:text-gray-400 mt-[0.25vw] hidden md:block">{worklet.description}</p>
                <div className="mt-[1vw]">
                    <div className="flex justify-between items-center mb-[0.25vw]">
                        <span className="text-[clamp(0.6rem,0.8vw,0.75rem)] font-medium text-gray-500 dark:text-gray-400">Progress</span>
                        <span className="text-[clamp(0.6rem,0.8vw,0.75rem)] font-bold text-indigo-600 dark:text-indigo-400">{worklet.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-[0.4vw]">
                        {/* --- CHANGE 3: Matched progress bar color to theme and added animation --- */}
                        <div className="bg-indigo-600 h-[0.4vw] rounded-full transition-all duration-500 ease-out" style={{ width: `${worklet.progress}%` }}></div>
                    </div>
                </div>
                {/* --- CHANGE 4: Reworked the metadata section for better readability --- */}
                <div className="mt-[1vw] flex flex-wrap items-center text-[clamp(0.6rem,0.8vw,0.75rem)] text-gray-500 dark:text-gray-400 gap-x-[1vw] gap-y-[0.5vh]">
                    {/* --- CHANGE 1: Reduced icon size from 14 to 12 --- */}
                    <span className="flex items-center gap-[0.4vw]">
                        <Users size={Math.max(10, Math.min(14, window.innerWidth * 0.008))}/> 
                        {/* Simplified text and handled pluralization */}
                        {worklet.students.length} Student{worklet.students.length !== 1 ? 's' : ''}
                    </span>
                    {/* Added a subtle separator for clarity on larger screens */}
                    <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                     {/* --- CHANGE 1: Reduced icon size from 14 to 12 --- */}
                    <span className="flex items-center gap-[0.4vw]">
                        <Calendar size={Math.max(10, Math.min(14, window.innerWidth * 0.008))}/> 
                        {worklet.startDate} - {worklet.endDate}
                    </span>
                </div>
            </div>
        </div>
    </Link>
);