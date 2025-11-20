
import React, { useState, useContext, useEffect } from 'react';
import { AppContext, API_BASE_URL } from '../../App';
import type { SchoolSettings } from '../../types';

const SettingsManagement: React.FC = () => {
    const appContext = useContext(AppContext);
    
    // Initialize state directly from context to prevent "Loading..." flash or stuck state
    // since appContext is guaranteed to be loaded when this component renders in AdminDashboard
    const [localSettings, setLocalSettings] = useState<SchoolSettings>(
        appContext?.schoolSettings || { schoolName: '' }
    );
    const [schoolName, setSchoolName] = useState(appContext?.schoolSettings?.schoolName || '');
    
    const [newLogo, setNewLogo] = useState<File | null>(null);
    const [newBanner, setNewBanner] = useState<File | null>(null);
    
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Sync state if context updates (e.g. re-fetch)
    useEffect(() => {
        if (appContext?.schoolSettings) {
            setLocalSettings(appContext.schoolSettings);
            // We only update schoolName if it hasn't been edited yet (simple check) 
            // or just allow overwrite if context changes to keep sync. 
            // For now, we sync it to ensure latest server data is reflected if it changes externally.
            if (!schoolName) {
                setSchoolName(appContext.schoolSettings.schoolName);
            }
        }
    }, [appContext?.schoolSettings]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewLogo(e.target.files[0]);
            setLocalSettings({
                ...localSettings,
                logoUrl: URL.createObjectURL(e.target.files[0]) // Preview
            });
        }
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewBanner(e.target.files[0]);
            setLocalSettings({
                ...localSettings,
                bannerUrl: URL.createObjectURL(e.target.files[0]) // Preview
            });
        }
    };

    const removeLogo = () => {
        if (localSettings.logoUrl && localSettings.logoUrl.startsWith('blob:')) {
            URL.revokeObjectURL(localSettings.logoUrl);
        }
        setLocalSettings({ ...localSettings, logoUrl: undefined });
        setNewLogo(null);
    };

    const removeBanner = () => {
        if (localSettings.bannerUrl && localSettings.bannerUrl.startsWith('blob:')) {
            URL.revokeObjectURL(localSettings.bannerUrl);
        }
        setLocalSettings({ ...localSettings, bannerUrl: undefined });
        setNewBanner(null);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setIsSaved(false);

        const formData = new FormData();
        formData.append('schoolName', schoolName);

        if (newLogo) {
            formData.append('logo', newLogo);
        } else if (localSettings.logoUrl === undefined || localSettings.logoUrl === null) {
            formData.append('removeLogo', 'true');
        }

        if (newBanner) {
            formData.append('banner', newBanner);
        } else if (localSettings.bannerUrl === undefined || localSettings.bannerUrl === null) {
            formData.append('removeBanner', 'true');
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/settings`, {
                method: 'PUT',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || response.statusText || 'Failed to update settings');
            }
            
            const updatedSettings = await response.json();
            appContext?.updateSchoolSettings(updatedSettings);
            
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        } catch (error: any) {
            console.error("Error updating settings:", error);
            let msg = error.message;
            if (msg === 'Failed to fetch') msg = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại Backend.';
            alert(`Lỗi khi cập nhật cài đặt: ${msg}`);
        } finally {
            setIsSaving(false);
            setNewLogo(null);
            setNewBanner(null);
        }
    };

    const getFullUrl = (url?: string | null) => {
        if (!url) return '';
        if (url.startsWith('blob:')) return url;
        return `${API_BASE_URL}${url}`;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Cài đặt chung & Thương hiệu</h2>
                
                <div className="space-y-6">
                    {/* Tên trường */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên trường học</label>
                        <input
                            type="text"
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                            placeholder="Ví dụ: TRƯỜNG TIỂU HỌC NGUYỄN HUỆ"
                        />
                    </div>

                    {/* Logo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Logo trường</label>
                        <div className="flex items-start space-x-4">
                            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                                {localSettings.logoUrl ? (
                                    <img src={getFullUrl(localSettings.logoUrl)} alt="Logo Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-gray-400 text-xs">Không có logo</span>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <input
                                    type="file"
                                    onChange={handleLogoChange}
                                    accept="image/*"
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
                                />
                                {localSettings.logoUrl && (
                                    <button onClick={removeLogo} className="text-sm text-danger hover:underline">Xóa logo hiện tại</button>
                                )}
                                <p className="text-xs text-gray-500">Khuyên dùng ảnh vuông, định dạng PNG hoặc JPG.</p>
                            </div>
                        </div>
                    </div>

                    {/* Banner */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh bìa (Banner trang chủ)</label>
                        <div className="space-y-2">
                            <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden relative">
                                {localSettings.bannerUrl ? (
                                    <img src={getFullUrl(localSettings.bannerUrl)} alt="Banner Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
                                        <span className="text-white text-xs opacity-80">Mặc định (Gradient)</span>
                                    </div>
                                )}
                            </div>
                             <div className="flex items-center space-x-4">
                                <input
                                    type="file"
                                    onChange={handleBannerChange}
                                    accept="image/*"
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
                                />
                                 {localSettings.bannerUrl && (
                                    <button onClick={removeBanner} className="text-sm text-danger hover:underline whitespace-nowrap">Xóa banner</button>
                                )}
                             </div>
                             <p className="text-xs text-gray-500">Ảnh này sẽ hiển thị làm nền ở phần đầu trang chủ.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end items-center space-x-4">
                    {isSaved && <span className="text-green-600 font-semibold animate-pulse">Đã lưu thay đổi!</span>}
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-primary text-white font-bold rounded-md shadow hover:bg-primary-dark disabled:bg-gray-400 transition-colors"
                    >
                        {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsManagement;
