import React, { useState, useContext, useEffect } from 'react';
import { AppContext, API_BASE_URL } from '../../App';
import type { Application } from '../../types';
import { ApplicationStatus, EnrollmentType, EnrollmentRoute } from '../../types';

interface EnrollmentFormProps {
    onFormSuccess: (application: Application) => void;
}

// FIX: Changed props from `value` to `defaultValue` to support uncontrolled inputs, which matches the form's usage of FormData.
const InputField: React.FC<{label: string, id: string, name: string, type: string, defaultValue: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, required?: boolean}> = 
({label, id, name, type, defaultValue, onChange, required=true}) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <input type={type} id={id} name={name} defaultValue={defaultValue} onChange={onChange} required={required} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
    </div>
);

const EnrollmentForm: React.FC<EnrollmentFormProps> = ({ onFormSuccess }) => {
    const appContext = useContext(AppContext);
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [birthCert, setBirthCert] = useState<File | null>(null);
    const [residenceProof, setResidenceProof] = useState<File | null>(null);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (isDirty) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const handleAnythingChanged = () => {
        if (!isDirty) setIsDirty(true);
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
        if (e.target.files && e.target.files[0]) {
            handleAnythingChanged();
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!birthCert || !residenceProof) {
            alert('Vui lòng tải lên đầy đủ giấy tờ.');
            return;
        }
        setLoading(true);

        const formElement = e.currentTarget;
        const formData = new FormData(formElement);
        formData.append('birthCert', birthCert);
        formData.append('residenceProof', residenceProof);

        try {
            const response = await fetch(`${API_BASE_URL}/api/applications`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit application');
            }

            const newApplication: Application = await response.json();
            appContext!.addApplication(newApplication);
            setIsDirty(false); // Reset dirty state on successful submission
            onFormSuccess(newApplication);

        } catch (error: any) {
            console.error('Submission failed:', error);
            alert(`Lỗi: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    const FileInput: React.FC<{label: string, id: string, file: File | null, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, accept: string}> = ({label, id, file, onChange, accept}) => (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                     {file ? (
                        <p className="text-sm text-green-600 font-semibold">{file.name} (Đã tải lên)</p>
                     ) : (
                        <>
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                            <label htmlFor={id} className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                                <span>Tải tệp lên</span>
                                <input id={id} name={id} type="file" className="sr-only" onChange={onChange} accept={accept} required/>
                            </label>
                            <p className="pl-1">hoặc kéo và thả</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, PDF tối đa 10MB</p>
                        </>
                     )}
                </div>
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} onChange={handleAnythingChanged} className="space-y-8 bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900">Phiếu Đăng ký Tuyển sinh Trực tuyến</h2>
            
            <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">I. Thông tin học sinh</h3>
                <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                        <InputField label="Họ và tên học sinh" id="studentName" name="studentName" type="text" defaultValue="Nguyễn Thị Hoa" onChange={() => {}} />
                    </div>
                     <div className="sm:col-span-3">
                        <label htmlFor="studentGender" className="block text-sm font-medium text-gray-700">Giới tính</label>
                        <select id="studentGender" name="studentGender" defaultValue="Nữ" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                            <option>Nam</option>
                            <option>Nữ</option>
                        </select>
                    </div>
                    <div className="sm:col-span-3">
                        <InputField label="Ngày sinh" id="studentDob" name="studentDob" type="date" defaultValue="2018-10-20" onChange={() => {}} />
                    </div>
                </div>
            </div>

             <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">II. Thông tin phụ huynh</h3>
                <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                        <InputField label="Họ và tên cha/mẹ/người giám hộ" id="parentName" name="parentName" type="text" defaultValue="Nguyễn Văn Hùng" onChange={() => {}} />
                    </div>
                     <div className="sm:col-span-3">
                         <InputField label="Số điện thoại" id="parentPhone" name="parentPhone" type="tel" defaultValue="0988776655" onChange={() => {}} />
                    </div>
                    <div className="sm:col-span-6">
                         <InputField label="Địa chỉ thường trú" id="address" name="address" type="text" defaultValue="Thôn 1, xã Đắk Wil, Cư Jút, Đắk Nông" onChange={() => {}} />
                    </div>
                </div>
            </div>

             <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">III. Thông tin đăng ký</h3>
                <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                        <label htmlFor="enrollmentType" className="block text-sm font-medium text-gray-700">Loại hình tuyển sinh</label>
                        <select id="enrollmentType" name="enrollmentType" defaultValue={EnrollmentType.GRADE_1} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                            {Object.values(EnrollmentType).map(et => <option key={et}>{et}</option>)}
                        </select>
                    </div>
                    <div className="sm:col-span-3">
                        <label htmlFor="enrollmentRoute" className="block text-sm font-medium text-gray-700">Tuyến tuyển sinh</label>
                        <select id="enrollmentRoute" name="enrollmentRoute" defaultValue={EnrollmentRoute.IN_ROUTE} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                             {Object.values(EnrollmentRoute).map(er => <option key={er}>{er}</option>)}
                        </select>
                    </div>
                    <div className="sm:col-span-6">
                        <div className="relative flex items-start">
                            <div className="flex items-center h-5">
                                <input id="isPriority" name="isPriority" type="checkbox" className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded" />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="isPriority" className="font-medium text-gray-700">Thuộc diện ưu tiên</label>
                                <p className="text-gray-500">Con thương binh, bệnh binh, gia đình chính sách...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold leading-6 text-gray-900">IV. Tải lên minh chứng</h3>
                <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                   <FileInput label="Ảnh Giấy khai sinh" id="birthCert" file={birthCert} onChange={(e) => handleFileChange(e, setBirthCert)} accept="image/*,application/pdf" />
                   <FileInput label="Ảnh Hộ khẩu/Giấy xác nhận cư trú" id="residenceProof" file={residenceProof} onChange={(e) => handleFileChange(e, setResidenceProof)} accept="image/*,application/pdf" />
                </div>
            </div>

            <div className="pt-5">
                <div className="flex justify-end">
                    <button type="submit" disabled={loading} className="ml-3 inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400">
                        {loading ? 'Đang gửi...' : 'Nộp hồ sơ'}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default EnrollmentForm;