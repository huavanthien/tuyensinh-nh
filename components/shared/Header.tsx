import React from 'react';

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
    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    <button onClick={onGoHome} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md">
                        <div className="flex items-center space-x-3 text-left">
                            <img src="https://picsum.photos/50" alt="School Logo" className="h-12 w-12 rounded-full object-cover"/>
                            <div>
                            <h1 className="text-xl font-bold text-primary">TRƯỜNG TIỂU HỌC NGUYỄN HUỆ</h1>
                            <p className="text-sm text-gray-500">Hệ thống Tuyển sinh Trực tuyến</p>
                            </div>
                        </div>
                    </button>
                    <nav className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                            <NavLink active={currentView === 'parent'} onClick={() => setView('parent')}>
                                👨‍👩‍👧 Cổng Phụ huynh
                            </NavLink>
                            <NavLink active={currentView === 'admin'} onClick={() => setView('admin')}>
                                🏫 Cổng Nhà trường
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