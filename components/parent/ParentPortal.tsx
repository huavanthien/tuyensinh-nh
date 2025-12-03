import React, { useState, useEffect, useContext } from 'react';
import type { Application } from '../../types';
import ParentLogin from './ParentLogin';
import EnrollmentForm from './EnrollmentForm';
import StatusCheck from './StatusCheck';
import StatusResult from './StatusResult';
import WelcomeScreen from './WelcomeScreen';
import { API_BASE_URL, AppContext } from '../../App';


type ParentView = 'welcome' | 'login' | 'form' | 'status_check' | 'status_result' | 'form_success';


const PaymentInfo: React.FC<{ application: Application }> = ({ application }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchQrCode = async () => {
            try {
                setLoading(true);
                setError('');
                 const response = await fetch(`${API_BASE_URL}/api/qr-code/${application.id}`);
                if (!response.ok) {
                    throw new Error('Không thể tạo mã QR.');
                }
                const data = await response.json();
                setQrCodeUrl(data.qrDataURL);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchQrCode();
    }, [application.id]);
    
    const removeAccents = (str: string) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
    };
    const studentNameWithoutAccents = removeAccents(application.studentName);
    const description = `${application.id} ${studentNameWithoutAccents}`;

    return (
        <div className="mt-6 p-6 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800">Thông tin thanh toán lệ phí</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-4">
                <div className="w-48 h-48 rounded-md shadow-md border flex items-center justify-center bg-gray-100">
                    {loading && <div className="text-sm text-gray-500">Đang tải mã...</div>}
                    {error && <div className="text-sm text-red-500 text-center p-2">{error}</div>}
                    {qrCodeUrl && <img src={qrCodeUrl} alt="Mã QR thanh toán" className="w-full h-full object-contain rounded-md" />}
                </div>

                <div className="text-left space-y-2 text-gray-700">
                    <p><strong>Ngân hàng:</strong> (AgriBank)</p>
                    <p><strong>Số tài khoản:</strong> <span className="font-mono">5308201000461</span></p>
                    <p><strong>Chủ tài khoản:</strong> TRUONG TIEU HOC NGUYEN HUE</p>
                    <p><strong>Số tiền:</strong> <span className="font-bold text-danger">200.000 VNĐ</span></p>
                    <p className="bg-yellow-100 p-2 rounded-md">
                        <strong>Nội dung:</strong> <span className="font-mono font-semibold text-primary">{description}</span>
                    </p>
                </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Quét mã QR bằng ứng dụng ngân hàng của bạn để thanh toán nhanh chóng và chính xác.</p>
        </div>
    );
};

const PaymentView: React.FC<{ application: Application }> = ({ application }) => {
    const appContext = useContext(AppContext);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [error, setError] = useState('');

    const handleConfirmPayment = async () => {
        setIsConfirming(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/api/applications/${application.id}/confirm-payment`, {
                method: 'POST',
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Xác nhận thanh toán thất bại.');
            }
            const updatedApplication = await response.json();
            appContext?.updateApplication(updatedApplication);
            setIsConfirmed(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsConfirming(false);
        }
    };

    if (isConfirmed) {
        return (
             <div className="mt-6 p-6 bg-green-50 rounded-lg border border-green-200 text-center">
                <svg className="w-12 h-12 mx-auto text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h3 className="text-lg font-semibold text-green-800 mt-2">Đã xác nhận thanh toán! Chụp màn hình thanh toán lưu trong máy</h3>
                <p className="text-sm text-green-700">Cảm ơn bạn đã hoàn tất lệ phí. Nhà trường sẽ sớm xét duyệt hồ sơ.</p>
            </div>
        )
    }

    return (
        <>
            <PaymentInfo application={application} />
            <div className="mt-6 text-center">
                <button
                    onClick={handleConfirmPayment}
                    disabled={isConfirming}
                    className="px-8 py-3 bg-success text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100"
                >
                    {isConfirming ? 'Đang xử lý...' : 'Tôi đã hoàn tất thanh toán'}
                </button>
                {error && <p className="text-sm text-danger mt-2">{error}</p>}
            </div>
        </>
    );
};


const ParentPortal: React.FC = () => {
    const [view, setView] = useState<ParentView>('welcome');
    const [lastSubmittedApplication, setLastSubmittedApplication] = useState<Application | null>(null);
    const [checkedApplication, setCheckedApplication] = useState<Application | null>(null);

    const handleLoginSuccess = () => setView('form');
    
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
                return (
                    <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-2xl mx-auto">
                        <svg className="w-16 h-16 mx-auto text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <h2 className="text-2xl font-bold text-gray-800 mt-4">Nộp hồ sơ thành công!</h2>
                        <p className="text-gray-600 mt-2">Mã hồ sơ của học sinh là: <strong className="text-primary">{lastSubmittedApplication.id}</strong>. Vui lòng hoàn tất lệ phí tuyển sinh để hoàn tất đăng ký.</p>
                        
                        <PaymentView application={lastSubmittedApplication} />

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

    return <div>{renderView()}</div>;
};

export default ParentPortal;
