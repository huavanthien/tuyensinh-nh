import React, { useContext, useState, useMemo } from 'react';
import { AppContext, API_BASE_URL } from '../../App';
import type { Application } from '../../types';
import { ApplicationStatus } from '../../types';
import ApplicationDetailModal from './ApplicationDetailModal';

const ApplicationReview: React.FC = () => {
    const appContext = useContext(AppContext);
    const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'all'>('all');
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleUpdateStatus = async (app: Application, status: ApplicationStatus, reason?: string) => {
        const updatedApp = { ...app, status, rejectionReason: reason || app.rejectionReason };
        try {
            const response = await fetch(`${API_BASE_URL}/api/applications/${app.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedApp),
            });
            if (!response.ok) throw new Error('Failed to update application');
            const data = await response.json();
            appContext!.updateApplication(data);
            setIsDetailModalOpen(false);
        } catch (error) {
            console.error(error);
            alert("Đã xảy ra lỗi khi cập nhật hồ sơ.");
        }
    };

    const handleApprove = (app: Application) => handleUpdateStatus(app, ApplicationStatus.APPROVED);
    const handleReject = (app: Application, reason: string) => handleUpdateStatus(app, ApplicationStatus.REJECTED, reason);
    
    const openDetailModal = (app: Application) => {
        setSelectedApp(app);
        setIsDetailModalOpen(true);
    }
    
    const filteredApplications = useMemo(() => {
        let apps = appContext!.applications;
        if (filterStatus !== 'all') {
            apps = apps.filter(app => app.status === filterStatus);
        }
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            apps = apps.filter(app => 
                app.studentName.toLowerCase().includes(lowercasedQuery) || 
                app.id.toLowerCase().includes(lowercasedQuery)
            );
        }
        return apps;
    }, [appContext, filterStatus, searchQuery]);
    
    const getStatusColor = (status: ApplicationStatus) => {
        switch (status) {
            case ApplicationStatus.APPROVED: case ApplicationStatus.ASSIGNED: return 'bg-green-100 text-green-800';
            case ApplicationStatus.REJECTED: return 'bg-red-100 text-red-800';
            case ApplicationStatus.REVIEWING: return 'bg-yellow-100 text-yellow-800';
            case ApplicationStatus.SUBMITTED: return 'bg-blue-100 text-blue-800';
            case ApplicationStatus.PAID_FEE: return 'bg-indigo-100 text-indigo-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Danh sách hồ sơ cần duyệt</h2>
                
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                     <div className="flex space-x-2 flex-wrap">
                        <button onClick={() => setFilterStatus('all')} className={`px-3 py-1 text-sm rounded-full ${filterStatus === 'all' ? 'bg-primary text-white' : 'bg-gray-200'}`}>Tất cả</button>
                        {Object.values(ApplicationStatus).map(status => (
                            <button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-1 text-sm rounded-full ${filterStatus === status ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                                {status}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc mã HS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full focus:ring-primary focus:border-primary"
                        />
                         <svg className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã HS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày nộp</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredApplications.map(app => (
                                <tr key={app.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{app.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.studentName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(app.submittedAt).toLocaleDateString('vi-VN')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(app.status)}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                       <button onClick={() => openDetailModal(app)} className="px-3 py-1 text-sm font-semibold bg-secondary text-white rounded-md hover:bg-opacity-80 transition-colors">
                                            Xem chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredApplications.length === 0 && <p className="text-center p-4 text-gray-500">Không có hồ sơ nào phù hợp.</p>}
                </div>
            </div>

            <ApplicationDetailModal 
                isOpen={isDetailModalOpen}
                application={selectedApp}
                onClose={() => setIsDetailModalOpen(false)}
                onApprove={handleApprove}
                onReject={handleReject}
                updateApplication={appContext!.updateApplication}
            />
        </>
    );
};

export default ApplicationReview;