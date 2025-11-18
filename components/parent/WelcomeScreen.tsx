
import React, { useContext } from 'react';
import { AppContext } from '../../App';

interface WelcomeScreenProps {
    onStartRegistration: () => void;
    onCheckStatus: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartRegistration, onCheckStatus }) => {
    const { announcement, guidelines } = useContext(AppContext)!;
    
    return (
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <div className="text-center mb-8">
                 <h1 className="text-3xl font-bold text-primary">{announcement.title}</h1>
                 <p className="text-gray-600 mt-2">Trường Tiểu học Nguyễn Huệ (xã Đắk Wil, tỉnh Lâm Đồng)</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Section 1: Announcement */}
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">I. Thông báo Tuyển sinh</h2>
                    <ul className="space-y-3 text-gray-700">
                       {announcement.details.map((detail, index) => (
                         <li key={index} className="flex items-start">
                            <span className="font-semibold w-32 shrink-0">{detail.label}:</span>
                            <span>{detail.value}</span>
                        </li>
                       ))}
                    </ul>
                    {announcement.attachmentUrl && (
                        <div className="mt-4">
                            <a
                                href={announcement.attachmentUrl}
                                download={announcement.attachmentName}
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-opacity-90 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                Tải về Thông báo chi tiết
                            </a>
                        </div>
                    )}
                </div>
                
                {/* Section 2: Instructions */}
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                     <h2 className="text-xl font-bold text-gray-800 mb-4">II. Hướng dẫn Đăng ký</h2>
                     <ol className="list-decimal list-inside space-y-3 text-gray-700">
                        {guidelines.map(guideline => (
                            <li key={guideline.id}>{guideline.text}</li>
                        ))}
                     </ol>
                </div>
            </div>
            
            <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <button 
                    onClick={onStartRegistration}
                    className="w-full sm:w-auto px-8 py-3 bg-primary text-white font-bold rounded-lg shadow-lg hover:bg-primary-dark transition-transform transform hover:scale-105"
                >
                    Đăng ký ngay
                </button>
                 <button 
                    onClick={onCheckStatus}
                    className="w-full sm:w-auto px-8 py-3 bg-secondary text-white font-bold rounded-lg shadow-lg hover:bg-opacity-90 transition-transform transform hover:scale-105"
                >
                    Tra cứu hồ sơ
                </button>
            </div>
        </div>
    );
};

export default WelcomeScreen;