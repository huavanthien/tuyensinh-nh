
import React, { useState, useContext, useEffect } from 'react';
import { AppContext, API_BASE_URL } from '../../App';
import type { Announcement, Guideline } from '../../types';

const AnnouncementManagement: React.FC = () => {
    const appContext = useContext(AppContext);
    
    const [localAnnouncement, setLocalAnnouncement] = useState<Announcement | null>(null);
    const [localGuidelines, setLocalGuidelines] = useState<Guideline[]>([]);
    
    const [newAttachment, setNewAttachment] = useState<File | null>(null);
    const [newAdmittedList, setNewAdmittedList] = useState<File | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (appContext?.announcement && appContext?.guidelines) {
            setLocalAnnouncement(appContext.announcement);
            setLocalGuidelines(appContext.guidelines);
        }
    }, [appContext?.announcement, appContext?.guidelines]);

    if (!localAnnouncement) return <div>Đang tải...</div>;

    const handleAnnouncementChange = (index: number, value: string) => {
        const newDetails = [...localAnnouncement.details];
        newDetails[index].value = value;
        setLocalAnnouncement({ ...localAnnouncement, details: newDetails });
    };

    const handleGuidelineChange = (id: string, text: string) => {
        setLocalGuidelines(localGuidelines.map(g => g.id === id ? { ...g, text } : g));
    };
    
    const addGuideline = () => {
        const newGuideline: Guideline = { id: `g${Date.now()}`, text: '' };
        setLocalGuidelines([...localGuidelines, newGuideline]);
    }
    
    const removeGuideline = (id: string) => {
        setLocalGuidelines(localGuidelines.filter(g => g.id !== id));
    }
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewAttachment(e.target.files[0]);
            // Optimistic update for UI
            setLocalAnnouncement({
                ...localAnnouncement,
                attachmentName: e.target.files[0].name,
                attachmentUrl: URL.createObjectURL(e.target.files[0]) // Temporary for preview
            });
        }
    };

    const removeAttachment = () => {
        const { attachmentUrl, attachmentName, ...rest } = localAnnouncement;
        if (attachmentUrl && attachmentUrl.startsWith('blob:')) {
            URL.revokeObjectURL(attachmentUrl);
        }
        setLocalAnnouncement(rest);
        setNewAttachment(null); // Mark for removal on save
    };

    const handleAdmittedListChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewAdmittedList(e.target.files[0]);
            setLocalAnnouncement({
                ...localAnnouncement,
                admittedListName: e.target.files[0].name,
                admittedListUrl: URL.createObjectURL(e.target.files[0])
            });
        }
    };

    const removeAdmittedList = () => {
        const { admittedListUrl, admittedListName, ...rest } = localAnnouncement;
        if (admittedListUrl && admittedListUrl.startsWith('blob:')) {
            URL.revokeObjectURL(admittedListUrl);
        }
        setLocalAnnouncement(rest);
        setNewAdmittedList(null);
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setIsSaved(false);
        try {
            // Use FormData for potential file upload
            const formData = new FormData();
            formData.append('announcementData', JSON.stringify(localAnnouncement));
            formData.append('guidelinesData', JSON.stringify(localGuidelines));
            
            // Handle attachment logic
            if (newAttachment) {
                formData.append('attachment', newAttachment);
            } else if (!localAnnouncement.attachmentUrl) {
                formData.append('removeAttachment', 'true');
            }

            // Handle admitted list logic
            if (newAdmittedList) {
                formData.append('admittedList', newAdmittedList);
            } else if (!localAnnouncement.admittedListUrl) {
                formData.append('removeAdmittedList', 'true');
            }

            const response = await fetch(`${API_BASE_URL}/api/site-content`, {
                method: 'PUT',
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to save content');
            
            await appContext?.fetchData(); // Refetch all data to get the latest version
            
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch (error) {
            console.error(error);
            alert("Lỗi khi lưu thay đổi.");
        } finally {
            setIsSaving(false);
            setNewAttachment(null);
            setNewAdmittedList(null);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Chỉnh sửa Thông báo Tuyển sinh</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
                        <input
                            type="text"
                            value={localAnnouncement.title}
                            onChange={e => setLocalAnnouncement({ ...localAnnouncement, title: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                        />
                    </div>
                    {localAnnouncement.details.map((detail, index) => (
                        <div key={index}>
                            <label className="block text-sm font-medium text-gray-700">{detail.label}</label>
                            <textarea
                                value={detail.value}
                                onChange={e => handleAnnouncementChange(index, e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                rows={2}
                            />
                        </div>
                    ))}
                    <div className="mt-4 border-t pt-4">
                        <label className="block text-sm font-bold text-gray-800">1. Tệp đính kèm (Thông báo chi tiết)</label>
                        {localAnnouncement.attachmentUrl ? (
                            <div className="mt-2 flex items-center justify-between p-2 bg-gray-100 rounded-md">
                                <a href={localAnnouncement.attachmentUrl.startsWith('blob:') ? localAnnouncement.attachmentUrl : `${API_BASE_URL}${localAnnouncement.attachmentUrl}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline truncate" title={localAnnouncement.attachmentName}>
                                    {localAnnouncement.attachmentName}
                                </a>
                                <button onClick={removeAttachment} className="ml-4 text-sm font-semibold text-danger hover:underline">Xóa</button>
                            </div>
                        ) : (
                            <div className="mt-2">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
                                />
                            </div>
                        )}
                    </div>

                     <div className="mt-4 border-t pt-4">
                        <label className="block text-sm font-bold text-gray-800 text-success">2. Danh sách Trúng tuyển (Kết quả)</label>
                        <p className="text-xs text-gray-500 mb-2">Tải file này lên khi có kết quả tuyển sinh. Phụ huynh sẽ thấy file này trên trang chủ.</p>
                        {localAnnouncement.admittedListUrl ? (
                            <div className="mt-2 flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md">
                                <a href={localAnnouncement.admittedListUrl.startsWith('blob:') ? localAnnouncement.admittedListUrl : `${API_BASE_URL}${localAnnouncement.admittedListUrl}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-green-700 hover:underline truncate" title={localAnnouncement.admittedListName}>
                                    {localAnnouncement.admittedListName}
                                </a>
                                <button onClick={removeAdmittedList} className="ml-4 text-sm font-semibold text-danger hover:underline">Xóa</button>
                            </div>
                        ) : (
                            <div className="mt-2">
                                <input
                                    type="file"
                                    onChange={handleAdmittedListChange}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Chỉnh sửa Hướng dẫn Đăng ký</h2>
                <div className="space-y-3">
                    {localGuidelines.map((guideline, index) => (
                        <div key={guideline.id} className="flex items-center space-x-2">
                           <span className="font-semibold text-gray-500">{index + 1}.</span>
                           <input
                                type="text"
                                value={guideline.text}
                                onChange={e => handleGuidelineChange(guideline.id, e.target.value)}
                                className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                            />
                            <button onClick={() => removeGuideline(guideline.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    ))}
                </div>
                 <button onClick={addGuideline} className="mt-4 text-sm font-semibold text-primary hover:underline">
                    + Thêm bước
                </button>
            </div>
            
            <div className="flex justify-end items-center space-x-4">
                {isSaved && <span className="text-green-600 font-semibold">Đã lưu thay đổi!</span>}
                <button 
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="px-6 py-3 bg-success text-white font-bold rounded-lg shadow-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                    {isSaving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
                </button>
            </div>
        </div>
    );
};

export default AnnouncementManagement;
