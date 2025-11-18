import React, { useState, useEffect } from 'react';
import type { Application } from '../../types';
import { ApplicationStatus } from '../../types';
import { API_BASE_URL } from '../../App';

interface ApplicationDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: Application | null;
    onApprove: (app: Application) => void;
    onReject: (app: Application, reason: string) => void;
    updateApplication: (app: Application) => void;
}

const DetailItem: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 font-semibold">{value}</dd>
    </div>
);


const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({ isOpen, onClose, application, onApprove, onReject, updateApplication }) => {
    const [showRejectionInput, setShowRejectionInput] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setShowRejectionInput(false);
            setRejectionReason('');
        }
        
        if (isOpen && application && application.status === ApplicationStatus.SUBMITTED) {
            const updatedApp = { ...application, status: ApplicationStatus.REVIEWING };
             fetch(`${API_BASE_URL}/api/applications/${application.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedApp),
            })
            .then(res => res.json())
            .then(data => updateApplication(data))
            .catch(err => console.error("Failed to update status", err));
        }
    }, [isOpen, application, updateApplication]);

    if (!isOpen || !application) return null;
    
    const handleRejectClick = () => setShowRejectionInput(true);
    const handleCancelReject = () => {
        setShowRejectionInput(false);
        setRejectionReason('');
    };

    const handleConfirmReject = () => {
        if (!rejectionReason) {
            alert("Vui lòng nhập lý do từ chối.");
            return;
        }
        onReject(application, rejectionReason);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Chi tiết hồ sơ: <span className="text-primary">{application.id}</span></h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg text-gray-900 mb-3">I. Thông tin học sinh</h3>
                        <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
                            <DetailItem label="Họ và tên" value={application.studentName} />
                            <DetailItem label="Ngày sinh" value={new Date(application.studentDob).toLocaleDateString('vi-VN')} />
                            <DetailItem label="Giới tính" value={application.studentGender} />
                        </dl>
                    </div>
                    
                     <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg text-gray-900 mb-3">II. Thông tin phụ huynh</h3>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                            <DetailItem label="Họ tên phụ huynh" value={application.parentName} />
                            <DetailItem label="Số điện thoại" value={application.parentPhone} />
                            <DetailItem label="Địa chỉ" value={application.address} />
                        </dl>
                    </div>

                     <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg text-gray-900 mb-3">III. Thông tin đăng ký</h3>
                        <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
                            <DetailItem label="Loại hình" value={application.enrollmentType} />
                            <DetailItem label="Tuyến" value={application.enrollmentRoute} />
                            <DetailItem label="Diện ưu tiên" value={application.isPriority ? "Có" : "Không"} />
                        </dl>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg text-gray-900 mb-3">IV. Minh chứng đính kèm</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {application.birthCertUrl && (
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                                    <div className="flex items-center space-x-3">
                                        <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        <span className="font-medium text-gray-700">Giấy khai sinh</span>
                                    </div>
                                    <a href={`${API_BASE_URL}${application.birthCertUrl}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-sm font-semibold bg-secondary text-white rounded-md hover:bg-opacity-80 transition-colors">
                                        Xem Tệp
                                    </a>
                                </div>
                            )}
                            {application.residenceProofUrl && (
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                                    <div className="flex items-center space-x-3">
                                        <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        <span className="font-medium text-gray-700">Hộ khẩu/Xác nhận cư trú</span>
                                    </div>
                                    <a href={`${API_BASE_URL}${application.residenceProofUrl}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-sm font-semibold bg-secondary text-white rounded-md hover:bg-opacity-80 transition-colors">
                                        Xem Tệp
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {showRejectionInput && (
                        <div className="p-4 bg-red-50 border-l-4 border-danger rounded-r-lg">
                            <h3 className="font-semibold text-danger mb-2">Phản hồi lý do từ chối</h3>
                            <textarea 
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                rows={3}
                                placeholder="Ví dụ: Giấy tờ không hợp lệ, thiếu thông tin..."
                            />
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end items-center space-x-3">
                     {showRejectionInput ? (
                        <>
                             <button onClick={handleCancelReject} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                                Hủy
                            </button>
                             <button onClick={handleConfirmReject} className="px-4 py-2 bg-danger text-white rounded-md hover:bg-red-700 disabled:bg-gray-400" disabled={!rejectionReason}>
                                Xác nhận từ chối
                            </button>
                        </>
                     ) : (
                         (application.status === ApplicationStatus.SUBMITTED || application.status === ApplicationStatus.REVIEWING) && (
                            <>
                                <button onClick={handleRejectClick} className="px-6 py-2 bg-danger text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors">
                                    Từ chối
                                </button>
                                <button onClick={() => onApprove(application)} className="px-6 py-2 bg-success text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors">
                                    Duyệt
                                </button>
                            </>
                        )
                     )}
                </div>
            </div>
        </div>
    );
};

export default ApplicationDetailModal;