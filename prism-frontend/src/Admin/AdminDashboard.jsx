import React from 'react';
import ModernStatisticsDashboard from '../Mentors/dashboard';
import { AdminLeftSidebar } from './AdminSidebar';

// AdminDashboard now reuses the Mentor's ModernStatisticsDashboard component
// with the Admin sidebar for navigation
const AdminDashboard = () => {
  return <ModernStatisticsDashboard SidebarComponent={AdminLeftSidebar} />;
};

export default AdminDashboard;
