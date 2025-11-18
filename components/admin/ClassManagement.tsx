import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../App';
import type { SchoolClass } from '../../types';

const ClassManagement: React.FC = () => {
    const { classes, applications, addClass, updateClass, deleteClass } = useContext(AppContext)!;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentClass, setCurrentClass] = useState<SchoolClass | null>(null);
    const [formData, setFormData] = useState({ name: '', maxSize: 35 });

    const classOccupancy = useMemo(() => {
        const occupancy: Record<string, number> = {};
        classes.forEach(c => {
            occupancy[c.id] = applications.filter(app => app.classId === c.id).length;
        });
        return occupancy;
    }, [applications, classes]);
    
    const openModal = (schoolClass: SchoolClass | null = null) => {
        setCurrentClass(schoolClass);
        setFormData(schoolClass ? { name: schoolClass.name, maxSize: schoolClass.maxSize } : { name: '', maxSize: 35 });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentClass(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentClass) { // Editing existing class
            updateClass({ ...currentClass, ...formData, maxSize: Number(formData.maxSize) });
        } else { // Adding new class
            const newClass: SchoolClass = {
                id: `CLASS_${Date.now()}`,
                ...formData,
                maxSize: Number(formData.maxSize),
            };
            addClass(newClass);
        }
        closeModal();
    };

    const handleDelete = (classId: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa lớp này không?")) {
            deleteClass(classId);
        }
    }

    const Modal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeModal}>
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{currentClass ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Tên lớp</label>
                        <input
                            type="text" id="name" value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="maxSize" className="block text-sm font-medium text-gray-700">Sĩ số tối đa</label>
                        <input
                            type="number" id="maxSize" value={formData.maxSize}
                            onChange={e => setFormData({ ...formData, maxSize: Number(e.target.value) })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                            required min="1"
                        />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Lưu</button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Danh sách các lớp học</h2>
                    <button onClick={() => openModal()} className="px-4 py-2 bg-primary text-white rounded-md shadow hover:bg-primary-dark">
                        Thêm lớp mới
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên lớp</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sĩ số</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {classes.map(c => {
                                const studentCount = classOccupancy[c.id] || 0;
                                return (
                                <tr key={c.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{c.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{studentCount} / {c.maxSize}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onClick={() => openModal(c)} className="text-secondary hover:underline">Sửa</button>
                                        <button 
                                            onClick={() => handleDelete(c.id)} 
                                            disabled={studentCount > 0}
                                            className="text-danger hover:underline disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline"
                                            title={studentCount > 0 ? "Không thể xóa lớp đã có học sinh" : ""}
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <Modal />}
        </>
    );
};

export default ClassManagement;
