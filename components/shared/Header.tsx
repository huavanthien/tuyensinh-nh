
import React, { useContext } from 'react';
import { AppContext, API_BASE_URL } from '../../App';

interface HeaderProps {
    currentView: 'parent' | 'admin';
    setView: (view: 'parent' | 'admin') => void;
    isAdminLoggedIn: boolean;
    onAdminLogout: () => void;
    onGoHome: () => void;
}

const NavLink: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${
                active 
                ? 'bg-primary text-white shadow-md' 
                : 'text-gray-600 hover:bg-primary-dark hover:text-white'
            }`}
        >
            {children}
        </button>
    );
};

const Header: React.FC<HeaderProps> = ({ currentView, setView, isAdminLoggedIn, onAdminLogout, onGoHome }) => {
    const appContext = useContext(AppContext);
    const settings = appContext?.schoolSettings;

    const getLogoSrc = () => {
        if (settings?.logoUrl) {
            return `${API_BASE_URL}${settings.logoUrl}`;
        }
        // Placeholder SVG if no logo uploaded
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230056b3'%3E%3Cpath d='M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z'/%3E%3C/svg%3E";
    }

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    <button onClick={onGoHome} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md">
                        <div className="flex items-center space-x-3 text-left">
                            <img 
                                src={getLogoSrc()} 
                                alt="School Logo" 
                                className="h-12 w-12 object-contain"
                            />
                            <div>
                            <h1 className="text-xl font-bold text-primary uppercase">{settings?.schoolName || "TRƯỜNG TIỂU HỌC"}</h1>
                            <p className="text-sm text-gray-500">Hệ thống Tuyển sinh Trực tuyến</p>
                            </div>
                        </div>
                    </button>
                    <nav className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                            <NavLink active={currentView === 'parent'} onClick={() => setView('parent')}>
                                Cổng Phụ huynh
                            </NavLink>
                            <NavLink active={currentView === 'admin'} onClick={() => setView('admin')}>
                                Cổng Nhà trường
                            </NavLink>
                        </div>
                        {currentView === 'admin' && isAdminLoggedIn && (
                             <button
                                onClick={onAdminLogout}
                                className="px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 text-danger hover:bg-red-100"
                            >
                                Đăng xuất
                            </button>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
