
import React, { useState, useCallback } from 'react';
import type { Application, SchoolClass, Announcement, Guideline } from './types';
import { MOCK_APPLICATIONS, MOCK_CLASSES, MOCK_ANNOUNCEMENT, MOCK_GUIDELINES } from './constants';
import Header from './components/shared/Header';
import ParentPortal from './components/parent/ParentPortal';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLogin from './components/admin/AdminLogin';
import Footer from './components/shared/Footer';

export const AppContext = React.createContext<{
  applications: Application[];
  classes: SchoolClass[];
  announcement: Announcement;
  guidelines: Guideline[];
  addApplication: (app: Application) => void;
  updateApplication: (app: Application) => void;
  updateApplications: (apps: Application[]) => void;
  addClass: (newClass: SchoolClass) => void;
  updateClass: (updatedClass: SchoolClass) => void;
  deleteClass: (classId: string) => void;
  updateAnnouncement: (announcement: Announcement) => void;
  updateGuidelines: (guidelines: Guideline[]) => void;
} | null>(null);


const App: React.FC = () => {
  const [view, setView] = useState<'parent' | 'admin'>('parent');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [classes, setClasses] = useState<SchoolClass[]>(MOCK_CLASSES);
  const [announcement, setAnnouncement] = useState<Announcement>(MOCK_ANNOUNCEMENT);
  const [guidelines, setGuidelines] = useState<Guideline[]>(MOCK_GUIDELINES);
  const [portalKey, setPortalKey] = useState(0);

  const addApplication = useCallback((app: Application) => {
    setApplications(prev => [...prev, app]);
  }, []);

  const updateApplication = useCallback((updatedApp: Application) => {
    setApplications(prev => prev.map(app => app.id === updatedApp.id ? updatedApp : app));
  }, []);
  
  const updateApplications = useCallback((updatedApps: Application[]) => {
    setApplications(prev => {
      const updatedIds = new Set(updatedApps.map(u => u.id));
      const unchangedApps = prev.filter(p => !updatedIds.has(p.id));
      return [...unchangedApps, ...updatedApps];
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


  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
  };
  
  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
  }

  const handleGoHome = useCallback(() => {
    setPortalKey(prevKey => prevKey + 1);
  }, []);

  const renderAdminView = () => {
    if (isAdminLoggedIn) {
      return <AdminDashboard key={portalKey} />;
    }
    return <AdminLogin onLoginSuccess={handleAdminLogin} />;
  }

  return (
    <AppContext.Provider value={{ 
      applications, 
      classes, 
      announcement,
      guidelines,
      addApplication, 
      updateApplication, 
      updateApplications, 
      addClass, 
      updateClass, 
      deleteClass,
      updateAnnouncement,
      updateGuidelines
    }}>
      <div className="min-h-screen flex flex-col font-sans bg-gray-50">
        <Header 
          currentView={view} 
          setView={setView} 
          isAdminLoggedIn={isAdminLoggedIn}
          onAdminLogout={handleAdminLogout}
          onGoHome={handleGoHome}
        />
        <main className="flex-grow container mx-auto px-4 py-8">
          {view === 'parent' ? <ParentPortal key={portalKey} /> : renderAdminView()}
        </main>
        <Footer />
      </div>
    </AppContext.Provider>
  );
};

export default App;