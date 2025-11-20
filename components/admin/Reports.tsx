
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
    
    const downloadXLSX = (data: Application[], filename: string) => {
        if (data.length === 0) return;
        
        // Prepare data for Excel
        const rows = data.map(app => ({
            'Mã HS': app.id,
            'Họ và tên': app.studentName,
            'Ngày sinh': new Date(app.studentDob).toLocaleDateString('vi-VN'),
            'Giới tính': app.studentGender,
            'Số định danh': app.studentPID,
            'Dân tộc': app.ethnicity,
            'Nơi sinh': app.placeOfBirth,
            'Quê quán': app.hometown,
            'Phụ huynh': app.parentName,
            'Số điện thoại': app.parentPhone,
            'Địa chỉ': app.address,
            'Lớp': classes.find(c => c.id === app.classId)?.name || 'Chưa phân lớp',
            'Trạng thái': app.status,
            'Tuyến': app.enrollmentRoute,
            'Ưu tiên': app.isPriority ? 'Có' : 'Không'
        }));

        const XLSX = (window as any).XLSX;
        if (!XLSX) {
            alert("Đang tải thư viện Excel, vui lòng thử lại sau giây lát.");
            return;
        }

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(rows);

        // Set column widths
        const wscols = [
            {wch: 10}, // Mã HS
            {wch: 20}, // Họ tên
            {wch: 12}, // Ngày sinh
            {wch: 8},  // Giới tính
            {wch: 15}, // Số định danh
            {wch: 10}, // Dân tộc
            {wch: 15}, // Nơi sinh
            {wch: 15}, // Quê quán
            {wch: 20}, // Phụ huynh
            {wch: 12}, // SĐT
            {wch: 30}, // Địa chỉ
            {wch: 10}, // Lớp
            {wch: 15}, // Trạng thái
            {wch: 12}, // Tuyến
            {wch: 8}   // Ưu tiên
        ];
        worksheet['!cols'] = wscols;

        // Create workbook and append worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách");

        // Write file
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    };

    const ReportSection: React.FC<{title: string, data: Application[], filename: string, children?: React.ReactNode}> = ({ title, data, filename, children }) => (
         <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">{title} ({data.length} học sinh)</h3>
                <button 
                    onClick={() => downloadXLSX(data, filename)}
                    disabled={data.length === 0}
                    className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md shadow hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Xuất Excel
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
                        <ReportSection key={c.id} title={c.name} data={classLists[c.id]} filename={`DS_Lop_${c.name.replace(/\s+/g, '_')}`}>
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