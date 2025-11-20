
import React, { useContext, useState } from 'react';
import { AppContext, API_BASE_URL } from '../../App';

interface WelcomeScreenProps {
    onStartRegistration: () => void;
    onCheckStatus: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartRegistration, onCheckStatus }) => {
    const appContext = useContext(AppContext);
    const [isDownloading, setIsDownloading] = useState(false);

    if (!appContext || !appContext.announcement) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    const { announcement, guidelines, schoolSettings } = appContext;

    const downloadFile = async (fileUrl: string, fileName: string) => {
        setIsDownloading(true);
        try {
            const fullUrl = `${API_BASE_URL}${fileUrl}`;
            const response = await fetch(fullUrl);
            if (!response.ok) throw new Error('Network response was not ok.');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download failed:", error);
            alert("Tải tệp thất bại. Vui lòng thử lại.");
        } finally {
            setIsDownloading(false);
        }
    };

    // Helper icons
    const CalendarIcon = () => (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
    );
    const UserIcon = () => (
        <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
    );
    const InfoIcon = () => (
        <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    );
    const FileIcon = () => (
        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
    );
    const SuccessFileIcon = () => (
         <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
    );

    // Map detail labels to icons
    const getIconForLabel = (label: string) => {
        const l = label.toLowerCase();
        if (l.includes('thời gian') || l.includes('năm học')) return <CalendarIcon />;
        if (l.includes('đối tượng')) return <UserIcon />;
        return <InfoIcon />;
    };

    const bannerStyle = schoolSettings.bannerUrl 
        ? { backgroundImage: `url(${API_BASE_URL}${schoolSettings.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : {};

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Hero Section */}
            <div 
                className={`rounded-2xl shadow-xl p-8 md:p-12 text-center text-white relative overflow-hidden ${!schoolSettings.bannerUrl ? 'bg-gradient-to-r from-primary to-blue-600' : ''}`}
                style={bannerStyle}
            >
                {/* Overlay if banner exists to ensure text readability */}
                {schoolSettings.bannerUrl && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 z-0"></div>
                )}
                
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 text-shadow">{announcement.title}</h1>
                    <p className="text-blue-100 text-lg mb-8 font-medium uppercase tracking-wide text-shadow">{schoolSettings.schoolName}</p>
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button 
                            onClick={onStartRegistration}
                            className="px-8 py-4 bg-white text-primary font-bold rounded-full shadow-lg hover:bg-gray-50 hover:scale-105 transition-all duration-200 flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            Đăng ký Tuyển sinh ngay
                        </button>
                        <button 
                            onClick={onCheckStatus}
                            className="px-8 py-4 bg-blue-700 bg-opacity-50 border border-blue-300 text-white font-bold rounded-full shadow-lg hover:bg-blue-700 hover:bg-opacity-70 transition-all duration-200 flex items-center justify-center backdrop-blur-sm"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            Tra cứu Hồ sơ
                        </button>
                    </div>
                </div>
                {/* Decorative circles (Only show if no custom banner) */}
                {!schoolSettings.bannerUrl && (
                    <>
                        <div className="absolute top-0 left-0 -ml-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10"></div>
                        <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-80 h-80 rounded-full bg-blue-400 opacity-20"></div>
                    </>
                )}
            </div>

            <div className="grid md:grid-cols-12 gap-8">
                {/* Left Column: Announcement Details (7 cols) */}
                <div className="md:col-span-7 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
                                {announcement.title}
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="grid gap-6">
                                {announcement.details.map((detail, index) => (
                                    <div key={index} className="flex items-start p-4 rounded-lg bg-blue-50 border border-blue-100 transition-all hover:shadow-md">
                                        <div className="flex-shrink-0 mt-1 p-2 bg-white rounded-full shadow-sm">
                                            {getIconForLabel(detail.label)}
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">{detail.label}</h3>
                                            <p className="mt-1 text-gray-900 font-medium">{detail.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {announcement.attachmentUrl && (
                        <div 
                            onClick={() => !isDownloading && announcement.attachmentUrl && announcement.attachmentName ? downloadFile(announcement.attachmentUrl, announcement.attachmentName) : null}
                            className={`group bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between cursor-pointer transition-all hover:border-primary hover:shadow-md ${isDownloading ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            <div className="flex items-center">
                                <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                                    <FileIcon />
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-gray-900 font-bold group-hover:text-primary transition-colors">Tài liệu đính kèm</h3>
                                    <p className="text-sm text-gray-500">{announcement.attachmentName}</p>
                                </div>
                            </div>
                            <div className="bg-gray-100 p-2 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                                {isDownloading ? (
                                    <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                )}
                            </div>
                        </div>
                    )}

                    {announcement.admittedListUrl && (
                        <div 
                            onClick={() => !isDownloading && announcement.admittedListUrl && announcement.admittedListName ? downloadFile(announcement.admittedListUrl, announcement.admittedListName) : null}
                            className={`group bg-green-50 rounded-xl shadow-sm border border-green-200 p-6 flex items-center justify-between cursor-pointer transition-all hover:border-green-500 hover:shadow-md ${isDownloading ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            <div className="flex items-center">
                                <div className="p-3 bg-white rounded-lg group-hover:bg-green-100 transition-colors">
                                    <SuccessFileIcon />
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-green-900 font-bold text-lg group-hover:text-green-700 transition-colors">Danh sách Trúng tuyển</h3>
                                    <p className="text-sm text-green-600 font-medium">Kết quả tuyển sinh chính thức</p>
                                </div>
                            </div>
                            <div className="bg-white p-2 rounded-full text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
                                {isDownloading ? (
                                    <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Guidelines (5 cols) */}
                <div className="md:col-span-5">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full">
                         <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                                Hướng dẫn Đăng ký
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                                {guidelines.map((guideline, index) => (
                                    <div key={guideline.id} className="relative pl-8">
                                        <span className="absolute -left-[11px] top-0 h-6 w-6 rounded-full bg-success text-white flex items-center justify-center text-xs font-bold ring-4 ring-white">
                                            {index + 1}
                                        </span>
                                        <div className="bg-gray-50 rounded-lg p-3 -mt-1">
                                            <p className="text-gray-700 text-sm font-medium leading-relaxed">{guideline.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
