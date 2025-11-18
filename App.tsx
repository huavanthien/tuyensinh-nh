import React, { useState, useCallback, useEffect } from 'react';
import type { Application, SchoolClass, Announcement, Guideline } from './types';
import Header from './components/shared/Header';
import ParentPortal from './components/parent/ParentPortal';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLogin from './components/admin/AdminLogin';
import Footer from './components/shared/Footer';

// IMPORTANT: Replace this with your actual Render backend URL after deployment
export const API_BASE_URL = 'https://tuyensinh-backend.onrender.com';

export const AppContext = React.createContext<{
  applications: Application[];
  classes: SchoolClass[];
  announcement: Announcement | null;
  guidelines: Guideline[];
  addApplication: (app: Application) => void;
  updateApplication: (app: Application) => void;
  updateApplications: (apps: Application[]) => void;
  addClass: (newClass: SchoolClass) => void;
  updateClass: (updatedClass: SchoolClass) => void;
  deleteClass: (classId: string) => void;
  updateAnnouncement: (announcement: Announcement) => void;
  updateGuidelines: (guidelines: Guideline[]) => void;
  fetchData: () => Promise<void>;
} | null>(null);


const App: React.FC = () => {
  const [view, setView] = useState<'parent' | 'admin'>('parent');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [portalKey, setPortalKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/data`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setApplications(data.applications.map((app: Application) => ({...app, submittedAt: new Date(app.submittedAt) })));
      setClasses(data.classes);
      setAnnouncement(data.announcement);
      setGuidelines(data.guidelines);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addApplication = useCallback((app: Application) => {
    setApplications(prev => [...prev, {...app, submittedAt: new Date(app.submittedAt) }]);
  }, []);

  const updateApplication = useCallback((updatedApp: Application) => {
    setApplications(prev => prev.map(app => app.id === updatedApp.id ? {...updatedApp, submittedAt: new Date(updatedApp.submittedAt)} : app));
  }, []);
  
  const updateApplications = useCallback((updatedApps: Application[]) => {
     setApplications(prev => {
      const updatedMap = new Map(updatedApps.map(u => [u.id, {...u, submittedAt: new Date(u.submittedAt)}]));
      return prev.map(p => updatedMap.get(p.id) || p);
    });
  }, []);

  const addClass = useCallback((newClass: SchoolClass) => {
    setClasses(prev => [...prev, newClass]);
  }, []);

  const updateClass = useCallback((updatedClass: SchoolClass) => {
    setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));
  }, []);

  const deleteClass = useCallback((classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
  }, []);

  const updateAnnouncement = useCallback((newAnnouncement: Announcement) => {
    setAnnouncement(newAnnouncement);
  }, []);

  const updateGuidelines = useCallback((newGuidelines: Guideline[]) => {
    setGuidelines(newGuidelines);
  }, []);

  const handleAdminLogin = () => setIsAdminLoggedIn(true);
  const handleAdminLogout = () => setIsAdminLoggedIn(false);
  const handleGoHome = useCallback(() => setPortalKey(prevKey => prevKey + 1), []);

  const renderAdminView = () => {
    if (isAdminLoggedIn) {
      return <AdminDashboard key={portalKey} />;
    }
    return <AdminLogin onLoginSuccess={handleAdminLogin} />;
  }

  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          <p className="ml-4 text-lg text-gray-600">Đang tải dữ liệu...</p>
        </div>
      );
    }
    return view === 'parent' ? <ParentPortal key={portalKey} /> : renderAdminView();
  }

  return (
    <AppContext.Provider value={{ 
      applications, classes, announcement, guidelines,
      addApplication, updateApplication, updateApplications, 
      addClass, updateClass, deleteClass,
      updateAnnouncement, updateGuidelines, fetchData
    }}>
      <div className="min-h-screen flex flex-col font-sans bg-gray-50">
        <Header 
          currentView={view} setView={setView} 
          isAdminLoggedIn={isAdminLoggedIn} onAdminLogout={handleAdminLogout}
          onGoHome={handleGoHome}
        />
        <main className="flex-grow container mx-auto px-4 py-8">
          {renderMainContent()}
        </main>
        <Footer />
      </div>
    </AppContext.Provider>
  );
};

export default App;