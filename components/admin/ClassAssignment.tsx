import React, { useContext, useState, useMemo } from 'react';
import { AppContext, API_BASE_URL } from '../../App';
import type { Application } from '../../types';
import { ApplicationStatus, EnrollmentRoute } from '../../types';

const ClassAssignment: React.FC = () => {
    const appContext = useContext(AppContext);
    const { applications, classes, updateApplications, updateApplication } = appContext!;
    const [isLoading, setIsLoading] = useState(false);
    
    const unassignedStudents = useMemo(() => 
        applications.filter(app => app.status === ApplicationStatus.APPROVED),
        [applications]
    );

    const classOccupancy = useMemo(() => {
        const occupancy: Record<string, number> = {};
        classes.forEach(c => {
            occupancy[c.id] = applications.filter(app => app.classId === c.id).length;
        });
        return occupancy;
    }, [applications, classes]);

    const handleAutoAssign = async () => {
        setIsLoading(true);
        // This logic remains client-side for calculation, but the result is sent to the backend.
        let studentsToAssign = [...unassignedStudents];
        const assignments: { id: string, classId: string, status: ApplicationStatus }[] = [];
        const tempOccupancy = { ...classOccupancy };

        studentsToAssign.sort((a, b) => {
            if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
            if (a.enrollmentRoute !== b.enrollmentRoute) return a.enrollmentRoute === EnrollmentRoute.IN_ROUTE ? -1 : 1;
            return 0;
        });

        for (const student of studentsToAssign) {
            for (const schoolClass of classes) {
                if (tempOccupancy[schoolClass.id] < schoolClass.maxSize) {
                    assignments.push({ id: student.id, classId: schoolClass.id, status: ApplicationStatus.ASSIGNED });
                    tempOccupancy[schoolClass.id]++;
                    break;
                }
            }
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/applications/bulk-update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates: assignments }),
            });
            if (!response.ok) throw new Error('Failed to assign classes');
            const updatedApps = await response.json();
            updateApplications(updatedApps);
        } catch (error) {
            console.error(error);
            alert("Lỗi khi phân lớp tự động.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualAssign = async (studentId: string, classId: string) => {
        if (!classId) return;
        const student = applications.find(app => app.id === studentId);
        if (student) {
            const updatedApp = { ...student, classId, status: ApplicationStatus.ASSIGNED };
            try {
                 const response = await fetch(`${API_BASE_URL}/api/applications/${student.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedApp),
                });
                if (!response.ok) throw new Error('Failed to assign class');
                const data = await response.json();
                updateApplication(data);
            } catch (error) {
                 console.error(error);
                 alert("Lỗi khi phân lớp.");
            }
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Học sinh chờ phân lớp</h2>
                <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600">
                        Có <span className="font-bold text-primary">{unassignedStudents.length}</span> học sinh đã trúng tuyển và đang chờ được xếp lớp.
                    </p>
                    <button 
                        onClick={handleAutoAssign}
                        disabled={isLoading || unassignedStudents.length === 0}
                        className="px-4 py-2 bg-primary text-white rounded-md shadow hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Đang xử lý...' : 'Phân lớp tự động'}
                    </button>
                </div>
                <div className="overflow-y-auto h-96 border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mã HS</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tuyến</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ưu tiên</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {unassignedStudents.map(app => (
                                <tr key={app.id}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{app.id}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{app.studentName}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{app.enrollmentRoute}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        {app.isPriority ? 
                                            <span className="text-green-600 font-bold">Có</span> : 
                                            <span className="text-gray-500">Không</span>}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        <select
                                            onChange={(e) => handleManualAssign(app.id, e.target.value)}
                                            defaultValue=""
                                            className="text-sm rounded border-gray-300 focus:ring-primary focus:border-primary py-1"
                                        >
                                            <option value="" disabled>-- Chọn lớp --</option>
                                            {classes.map(c => {
                                                const currentSize = classOccupancy[c.id] || 0;
                                                const isFull = currentSize >= c.maxSize;
                                                return (
                                                    <option key={c.id} value={c.id} disabled={isFull}>
                                                        {c.name} ({currentSize}/{c.maxSize}) {isFull ? '(Đầy)' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {unassignedStudents.length === 0 && <p className="text-center p-4 text-gray-500">Không có học sinh nào chờ phân lớp.</p>}
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
                 <h2 className="text-xl font-bold text-gray-800 mb-4">Tình hình sĩ số các lớp</h2>
                 <div className="space-y-4">
                     {classes.map(schoolClass => {
                         const currentSize = classOccupancy[schoolClass.id] || 0;
                         const percentage = schoolClass.maxSize > 0 ? (currentSize / schoolClass.maxSize) * 100 : 0;
                         return (
                             <div key={schoolClass.id}>
                                 <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-semibold">{schoolClass.name}</h3>
                                    <p className="text-sm text-gray-600">{currentSize} / {schoolClass.maxSize}</p>
                                 </div>
                                 <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div 
                                        className="bg-primary h-2.5 rounded-full"
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                 </div>
                             </div>
                         );
                     })}
                 </div>
            </div>
        </div>
    );
};

export default ClassAssignment;