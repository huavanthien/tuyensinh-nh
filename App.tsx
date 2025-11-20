
import React, { useState, useCallback, useEffect } from 'react';
import type { Application, SchoolClass, Announcement, Guideline, SchoolSettings } from './types';
import Header from './components/shared/Header';
import ParentPortal from './components/parent/ParentPortal';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLogin from './components/admin/AdminLogin';
import Footer from './components/shared/Footer';

// --- Cấu hình Địa chỉ Máy chủ ---
// Ưu tiên sử dụng biến môi trường VITE_API_URL (Cấu hình trên Vercel).
// Nếu không có (khi chạy local), sẽ dùng http://localhost:3001.
export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

export const AppContext = React.createContext<{
  applications: Application[];
  classes: SchoolClass[];
  announcement: Announcement | null;
  guidelines: Guideline[];
  schoolSettings: SchoolSettings;
  addApplication: (app: Application) => void;
  updateApplication: (app: Application) => void;
  updateApplications: (apps: Application[]) => void;
  addClass: (newClass: SchoolClass) => void;
  updateClass: (updatedClass: SchoolClass) => void;
  deleteClass: (classId: string) => void;
  updateAnnouncement: (announcement: Announcement) => void;
  updateGuidelines: (guidelines: Guideline[]) => void;
  updateSchoolSettings: (settings: SchoolSettings) => void;
  fetchData: () => Promise<void>;
  error: string | null;
} | null>(null);


const App: React.FC = () => {
  const [view, setView] = useState<'parent' | 'admin'>('parent');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({ schoolName: "TRƯỜNG TIỂU HỌC NGUYỄN HUỆ" });
  const [portalKey, setPortalKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Connecting to Backend at:", API_BASE_URL); // Debug log
      const response = await fetch(`${API_BASE_URL}/api/data`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setApplications(data.applications.map((app: Application) => ({...app, submittedAt: new Date(app.submittedAt) })));
      setClasses(data.classes);
      setAnnouncement(data.announcement);
      setGuidelines(data.guidelines);
      if (data.settings) {
        setSchoolSettings(data.settings);
      }
    } catch (error: any) {
      console.error("Failed to fetch data:", error);
      setError(`Không thể tải dữ liệu. Lỗi: ${error.message || error}. Vui lòng kiểm tra kết nối đến Backend (${API_BASE_URL}).`);
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

  const updateSchoolSettings = useCallback((newSettings: SchoolSettings) => {
      setSchoolSettings(newSettings);
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

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-64 text-center px-4">
                <svg className="w-16 h-16 text-danger mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Không thể kết nối đến máy chủ</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <div className="bg-gray-100 p-4 rounded-md text-left text-sm text-gray-700 mb-6 max-w-md">
                     <p className="font-bold mb-1">Cách khắc phục:</p>
                     <ul className="list-disc list-inside">
                         <li>Nếu chạy trên máy cá nhân: Đảm bảo đã chạy <code>node server.js</code> trong thư mục backend.</li>
                         <li>Nếu chạy trên Vercel: Đảm bảo bạn đã thêm biến môi trường <strong>VITE_API_URL</strong> trỏ đến địa chỉ Backend trên Render (có dạng <code>https://...onrender.com</code>).</li>
                     </ul>
                </div>
                <button 
                    onClick={fetchData}
                    className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return view === 'parent' ? <ParentPortal key={portalKey} /> : renderAdminView();
  }

  return (
    <AppContext.Provider value={{ 
      applications, classes, announcement, guidelines, schoolSettings,
      addApplication, updateApplication, updateApplications, 
      addClass, updateClass, deleteClass,
      updateAnnouncement, updateGuidelines, updateSchoolSettings, fetchData,
      error
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
