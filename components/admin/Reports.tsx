
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../App';
import type { Application } from '../../types';
import { ApplicationStatus, EnrollmentRoute } from '../../types';

const Reports: React.FC = () => {
    const { applications, classes } = useContext(AppContext)!;

    const approvedList = useMemo(() => 
        applications.filter(app => app.status === ApplicationStatus.APPROVED || app.status === ApplicationStatus.ASSIGNED),
        [applications]
    );

    const classLists = useMemo(() => {
        const lists: Record<string, Application[]> = {};
        classes.forEach(c => {
            lists[c.id] = applications.filter(app => app.classId === c.id);
        });
        return lists;
    }, [applications, classes]);

    const outOfRouteList = useMemo(() => 
        applications.filter(app => app.enrollmentRoute === EnrollmentRoute.OUT_OF_ROUTE && (app.status === ApplicationStatus.APPROVED || app.status === ApplicationStatus.ASSIGNED)),
        [applications]
    );
    
    const downloadCSV = (data: Application[], filename: string) => {
        if (data.length === 0) return;
        const headers = ['Mã HS', 'Họ tên', 'Ngày sinh', 'Giới tính', 'Phụ huynh', 'SĐT', 'Địa chỉ', 'Lớp'];
        const rows = data.map(app => [
            app.id,
            app.studentName,
            app.studentDob,
            app.studentGender,
            app.parentName,
            app.parentPhone,
            `"${app.address}"`,
            classes.find(c => c.id === app.classId)?.name || 'Chưa phân lớp'
        ].join(','));

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const ReportSection: React.FC<{title: string, data: Application[], filename: string, children?: React.ReactNode}> = ({ title, data, filename, children }) => (
         <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">{title} ({data.length} học sinh)</h3>
                <button 
                    onClick={() => downloadCSV(data, filename)}
                    disabled={data.length === 0}
                    className="px-4 py-2 text-sm bg-secondary text-white rounded-md shadow hover:bg-opacity-90 disabled:bg-gray-400"
                >
                    Xuất CSV
                </button>
            </div>
             {children}
        </div>
    );
    
    const ApplicationList: React.FC<{apps: Application[]}> = ({apps}) => (
        <div className="overflow-y-auto max-h-72 border rounded-md">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 sticky top-0">
                    <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">Mã HS</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">Họ tên</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">Lớp</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {apps.map(app => (
                        <tr key={app.id}>
                            <td className="px-3 py-2 whitespace-nowrap">{app.id}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{app.studentName}</td>
                            <td className="px-3 py-2 whitespace-nowrap font-semibold">{classes.find(c => c.id === app.classId)?.name || ''}</td>
                        </tr>
                    ))}
                     {apps.length === 0 && (
                        <tr>
                            <td colSpan={3} className="text-center p-4 text-gray-500">Không có dữ liệu</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )


    return (
        <div className="space-y-6">
            <ReportSection title="Danh sách trúng tuyển" data={approvedList} filename="DS_Trung_Tuyen">
                <ApplicationList apps={approvedList} />
            </ReportSection>

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Danh sách theo lớp</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map(c => (
                        <ReportSection key={c.id} title={c.name} data={classLists[c.id]} filename={`DS_Lop_${c.name.replace(' ', '_')}`}>
                            <ApplicationList apps={classLists[c.id]} />
                        </ReportSection>
                    ))}
                </div>
            </div>

            <ReportSection title="Danh sách học sinh ngoài tuyến" data={outOfRouteList} filename="DS_Ngoai_Tuyen">
                <ApplicationList apps={outOfRouteList} />
            </ReportSection>
        </div>
    );
};

export default Reports;
