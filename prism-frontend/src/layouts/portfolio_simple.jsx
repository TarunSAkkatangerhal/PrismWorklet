// Simple Portfolio Page - No API calls needed
import React from 'react';
import LeftSidebar from '../components/Left';
import RightSidebar from '../components/Right';
import { Award, Star, Trophy, FileText } from 'lucide-react';

const Portfolio = () => {
  // Mock data for display
  const mockAchievements = [
    {
      id: 1,
      type: 'Award',
      title: 'Outstanding Student Award',
      description: 'Recognized for academic excellence',
      date: '2024-05-15'
    },
    {
      id: 2,
      type: 'Certificate',
      title: 'React Development Certification',
      description: 'Completed advanced React course',
      date: '2024-03-10'
    },
    {
      id: 3,
      type: 'Project',
      title: 'E-commerce Website',
      description: 'Built a full-stack e-commerce platform',
      date: '2024-01-20'
    }
  ];

  const achievementIcon = (type) => {
    switch (type) {
      case 'Award':
        return <Award className="h-6 w-6 text-yellow-500" />;
      case 'Certificate':
        return <Star className="h-6 w-6 text-blue-500" />;
      case 'Project':
        return <Trophy className="h-6 w-6 text-green-500" />;
      default:
        return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <LeftSidebar />
      
      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Portfolio
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Showcase of achievements and projects
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          {/* Achievements Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Achievements & Projects
            </h2>
            
            <div className="space-y-4">
              {mockAchievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {achievementIcon(achievement.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {achievement.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {achievement.description}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      {new Date(achievement.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      achievement.type === 'Award' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      achievement.type === 'Certificate' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {achievement.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Section */}
            <div className="mt-8 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Add New Achievement
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Upload certificates, project screenshots, or other achievements
                </p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Upload Files
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Portfolio;