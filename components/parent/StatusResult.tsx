
import React, {useContext} from 'react';
import type { Application } from '../../types';
import { ApplicationStatus } from '../../types';
import { AppContext } from '../../App';

interface StatusResultProps {
    application: Application;
    onBack: () => void;
}

const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
        case ApplicationStatus.APPROVED:
        case ApplicationStatus.ASSIGNED:
            return 'bg-success text-white';
        case ApplicationStatus.REJECTED:
            return 'bg-danger text-white';
        case ApplicationStatus.REVIEWING:
            return 'bg-warning text-gray-800';
        case ApplicationStatus.SUBMITTED:
            return 'bg-secondary text-white';
        default:
            return 'bg-gray-500 text-white';
    }
};

const StatusTimelineItem: React.FC<{status: ApplicationStatus, isActive: boolean, isFirst: boolean, isLast: boolean}> = ({ status, isActive, isFirst, isLast }) => {
    return (
        <div className="relative flex items-start">
            {!isFirst && <div className={`absolute top-0 left-4 -ml-px mt-1 w-0.5 h-full ${isActive ? 'bg-primary' : 'bg-gray-300'}`}></div>}
            <div className={`h-8 w-8 rounded-full flex items-center justify-center z-10 ${isActive ? 'bg-primary text-white' : 'bg-gray-300'}`}>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            </div>
            <div className="ml-4">
                <h4 className={`text-md font-semibold ${isActive ? 'text-primary' : 'text-gray-600'}`}>{status}</h4>
                <p className="text-sm text-gray-500">
                    {
                        isActive ? 'Đã hoàn thành' : 'Chưa đến'
                    }
                </p>
            </div>
        </div>
    );
};


const StatusResult: React.FC<StatusResultProps> = ({ application, onBack }) => {
    const { classes } = useContext(AppContext)!;
    const assignedClass = classes.find(c => c.id === application.classId);

    const timelineStatuses = [ApplicationStatus.SUBMITTED, ApplicationStatus.REVIEWING, ApplicationStatus.APPROVED, ApplicationStatus.ASSIGNED];
    const currentStatusIndex = timelineStatuses.indexOf(application.status === ApplicationStatus.REJECTED ? ApplicationStatus.REVIEWING : application.status);

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
             <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Kết quả tra cứu hồ sơ</h2>
                    <p className="text-gray-500 mt-1">Mã hồ sơ: <span className="font-semibold text-primary">{application.id}</span></p>
                </div>
                <button onClick={onBack} className="text-sm font-medium text-primary hover:underline">
                    &larr; Tra cứu hồ sơ khác
                </button>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Thông tin hồ sơ</h3>
                    <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-3 gap-4">
                            <span className="text-gray-500 font-medium">Họ tên HS:</span>
                            <span className="col-span-2 text-gray-800 font-semibold">{application.studentName}</span>
                        </div>
                         <div className="grid grid-cols-3 gap-4">
                            <span className="text-gray-500 font-medium">Ngày sinh:</span>
                            <span className="col-span-2 text-gray-800">{new Date(application.studentDob).toLocaleDateString('vi-VN')}</span>
                        </div>
                         <div className="grid grid-cols-3 gap-4">
                            <span className="text-gray-500 font-medium">Phụ huynh:</span>
                            <span className="col-span-2 text-gray-800">{application.parentName}</span>
                        </div>
                         <div className="grid grid-cols-3 gap-4">
                            <span className="text-gray-500 font-medium">Ngày nộp:</span>
                            <span className="col-span-2 text-gray-800">{application.submittedAt.toLocaleString('vi-VN')}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <span className="text-gray-500 font-medium">Trạng thái:</span>
                            <span className={`col-span-2 text-sm font-bold px-3 py-1 rounded-full inline-block ${getStatusColor(application.status)}`}>
                                {application.status}
                            </span>
                        </div>
                        {application.status === ApplicationStatus.REJECTED && (
                            <div className="grid grid-cols-3 gap-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <span className="text-danger font-medium">Lý do từ chối:</span>
                                <span className="col-span-2 text-danger">{application.rejectionReason}</span>
                            </div>
                        )}
                        {application.status === ApplicationStatus.ASSIGNED && assignedClass && (
                            <div className="grid grid-cols-3 gap-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                <span className="text-success font-medium">Lớp được phân:</span>
                                <span className="col-span-2 text-success font-bold text-lg">{assignedClass.name}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div>
                     <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Tiến độ xử lý</h3>
                     <div className="space-y-4">
                         {timelineStatuses.map((status, index) => (
                             <StatusTimelineItem 
                                key={status}
                                status={status}
                                isActive={index <= currentStatusIndex}
                                isFirst={index === 0}
                                isLast={index === timelineStatuses.length - 1}
                             />
                         ))}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default StatusResult;
