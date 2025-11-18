import React, { useState } from 'react';
import type { Application } from '../../types';
import ParentLogin from './ParentLogin';
import EnrollmentForm from './EnrollmentForm';
import StatusCheck from './StatusCheck';
import StatusResult from './StatusResult';
import WelcomeScreen from './WelcomeScreen';

type ParentView = 'welcome' | 'login' | 'form' | 'status_check' | 'status_result' | 'form_success';

const ParentPortal: React.FC = () => {
    const [view, setView] = useState<ParentView>('welcome');
    const [lastSubmittedApplication, setLastSubmittedApplication] = useState<Application | null>(null);
    const [checkedApplication, setCheckedApplication] = useState<Application | null>(null);

    const handleLoginSuccess = () => {
        // In a real app, you'd fetch user data here.
        // For now, we just proceed to the form.
        setView('form');
    };

    const handleFormSuccess = (application: Application) => {
        setLastSubmittedApplication(application);
        setView('form_success');
    };

    const handleStatusCheck = (application: Application) => {
        setCheckedApplication(application);
        setView('status_result');
    }

    const renderView = () => {
        switch (view) {
            case 'welcome':
                return <WelcomeScreen onStartRegistration={() => setView('login')} onCheckStatus={() => setView('status_check')} />;
            case 'login':
                return <ParentLogin onLoginSuccess={handleLoginSuccess} onBack={() => setView('welcome')} />;
            case 'form':
                return <EnrollmentForm onFormSuccess={handleFormSuccess} />;
            case 'form_success':
                if (!lastSubmittedApplication) return null;

                const removeAccents = (str: string) => {
                  return str
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/đ/g, "d")
                    .replace(/Đ/g, "D");
                };

                const studentNameWithoutAccents = removeAccents(lastSubmittedApplication.studentName);

                const transferInfo = {
                    bin: '970418', // VietinBank BIN
                    accountNo: '111222333444',
                    accountName: 'TRUONG TIEU HOC NGUYEN HUE',
                    amount: 200000, // Lệ phí tuyển sinh giả định
                    description: `${lastSubmittedApplication.id} ${studentNameWithoutAccents}`
                };

                const qrUrl = `https://api.vietqr.io/v2/generate?accountNo=${transferInfo.accountNo}&accountName=${encodeURIComponent(transferInfo.accountName)}&acqId=${transferInfo.bin}&amount=${transferInfo.amount}&addInfo=${encodeURIComponent(transferInfo.description)}&template=compact`;

                return (
                    <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-2xl mx-auto">
                        <svg className="w-16 h-16 mx-auto text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <h2 className="text-2xl font-bold text-gray-800 mt-4">Nộp hồ sơ thành công!</h2>
                        <p className="text-gray-600 mt-2">Mã hồ sơ của học sinh là: <strong className="text-primary">{lastSubmittedApplication.id}</strong>. Vui lòng hoàn tất lệ phí tuyển sinh để hoàn tất đăng ký.</p>
                        
                        <div className="mt-6 p-6 bg-gray-50 rounded-lg border">
                            <h3 className="text-lg font-semibold text-gray-800">Thông tin thanh toán lệ phí</h3>
                            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-4">
                                <img src={qrUrl} alt="Mã QR thanh toán" className="w-48 h-48 rounded-md shadow-md border" />
                                <div className="text-left space-y-2 text-gray-700">
                                    <p><strong>Ngân hàng:</strong> Ngân hàng TMCP Công Thương Việt Nam (VietinBank)</p>
                                    <p><strong>Số tài khoản:</strong> <span className="font-mono">{transferInfo.accountNo}</span></p>
                                    <p><strong>Chủ tài khoản:</strong> {transferInfo.accountName}</p>
                                    <p><strong>Số tiền:</strong> <span className="font-bold text-danger">{transferInfo.amount.toLocaleString('vi-VN')} VNĐ</span></p>
                                    <p className="bg-yellow-100 p-2 rounded-md">
                                        <strong>Nội dung:</strong> <span className="font-mono font-semibold text-primary">{transferInfo.description}</span>
                                    </p>
                                </div>
                            </div>
                             <p className="text-sm text-gray-500 mt-4">Quét mã QR bằng ứng dụng ngân hàng của bạn để thanh toán nhanh chóng và chính xác.</p>
                        </div>

                        <div className="mt-8 flex justify-center space-x-4">
                            <button onClick={() => setView('status_check')} className="px-6 py-2 bg-secondary text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition">Tra cứu hồ sơ</button>
                            <button onClick={() => setView('welcome')} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition">Về trang chủ</button>
                        </div>
                    </div>
                );
            case 'status_check':
                return <StatusCheck onStatusCheck={handleStatusCheck} onBack={() => setView('welcome')} />;
            case 'status_result':
                return <StatusResult application={checkedApplication!} onBack={() => setView('status_check')} />;
        }
    }

    return (
        <div>
            {renderView()}
        </div>
    );
};

export default ParentPortal;