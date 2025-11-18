
import React, { useState } from 'react';
import ApplicationReview from './ApplicationReview';
import ClassAssignment from './ClassAssignment';
import Reports from './Reports';
import ClassManagement from './ClassManagement';
import AnnouncementManagement from './AnnouncementManagement';

type AdminTab = 'review' | 'assignment' | 'class_management' | 'announcement_management' | 'reports';

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('review');

    const TabButton: React.FC<{tabName: AdminTab, currentTab: AdminTab, onClick: (tab: AdminTab) => void, children: React.ReactNode}> = ({tabName, currentTab, onClick, children}) => {
        const isActive = tabName === currentTab;
        return (
            <button 
                onClick={() => onClick(tabName)}
                className={`px-4 py-3 font-semibold text-sm rounded-lg transition-colors duration-200 ${
                    isActive ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-blue-100'
                }`}
            >
                {children}
            </button>
        )
    }

    return (
        <div className="w-full">
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="flex items-center space-x-2 flex-wrap">
                    <TabButton tabName="review" currentTab={activeTab} onClick={setActiveTab}>
                        Duyệt hồ sơ
                    </TabButton>
                    <TabButton tabName="assignment" currentTab={activeTab} onClick={setActiveTab}>
                        Phân lớp
                    </TabButton>
                    <TabButton tabName="class_management" currentTab={activeTab} onClick={setActiveTab}>
                        Quản lý lớp học
                    </TabButton>
                     <TabButton tabName="announcement_management" currentTab={activeTab} onClick={setActiveTab}>
                        Quản lý Thông báo
                    </TabButton>
                    <TabButton tabName="reports" currentTab={activeTab} onClick={setActiveTab}>
                        Xuất danh sách & Báo cáo
                    </TabButton>
                </div>
            </div>

            <div>
                {activeTab === 'review' && <ApplicationReview />}
                {activeTab === 'assignment' && <ClassAssignment />}
                {activeTab === 'class_management' && <ClassManagement />}
                {activeTab === 'announcement_management' && <AnnouncementManagement />}
                {activeTab === 'reports' && <Reports />}
            </div>
        </div>
    );
};

export default AdminDashboard;