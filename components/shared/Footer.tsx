
import React, { useContext } from 'react';
import { AppContext } from '../../App';

const Footer: React.FC = () => {
    const appContext = useContext(AppContext);
    return (
        <footer className="bg-white border-t mt-auto">
            <div className="container mx-auto px-4 py-6 text-center text-gray-600">
                <p>&copy; {new Date().getFullYear()} {appContext?.schoolSettings.schoolName}</p>
                <p className="text-sm mt-1">Phát triển bởi Nhóm Công nghệ Giáo dục</p>
            </div>
        </footer>
    );
};

export default Footer;
