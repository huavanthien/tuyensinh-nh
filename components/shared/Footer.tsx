
import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t mt-auto">
            <div className="container mx-auto px-4 py-6 text-center text-gray-600">
                <p>&copy; {new Date().getFullYear()} Trường Tiểu học Nguyễn Huệ (Đắk Wil, Cư Jút, Đắk Nông)</p>
                <p className="text-sm mt-1">Phát triển bởi Nhóm Công nghệ Giáo dục</p>
            </div>
        </footer>
    );
};

export default Footer;
