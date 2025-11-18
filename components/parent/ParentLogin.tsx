import React, { useState } from 'react';
import { API_BASE_URL } from '../../App';

interface ParentLoginProps {
    onLoginSuccess: () => void;
    onBack: () => void;
}

const ParentLogin: React.FC<ParentLoginProps> = ({ onLoginSuccess, onBack }) => {
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!/^\d{10}$/.test(phoneNumber)) {
            setError('Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số.');
            return;
        }
        setLoading(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to send OTP');
            }
            setStep('otp');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
             const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber, otp }),
            });
            const data = await response.json();
            if (!response.ok) {
                 throw new Error(data.message || 'Failed to verify OTP');
            }
            onLoginSuccess();
        } catch (err: any) {
             setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-primary">Đăng ký / Đăng nhập</h1>
                <p className="mt-2 text-slate-500">Sử dụng số điện thoại của quý phụ huynh để tiếp tục.</p>
            </div>

            {step === 'phone' ? (
                <form onSubmit={handleSendOtp} className="mt-8 space-y-6">
                    <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="09xxxxxxxx"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-center text-danger">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-gray-400 transition-colors"
                    >
                        {loading ? 'Đang gửi...' : 'Gửi mã xác thực'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp} className="mt-8 space-y-6">
                     <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                           Mã xác thực (OTP)
                        </label>
                        <p className="text-sm text-gray-600 mb-2">Một mã xác thực đã được gửi đến số <span className="font-semibold">{phoneNumber}</span>.</p>
                        <p className="text-xs text-center text-gray-500 my-2 p-2 bg-gray-100 rounded-md">(Để phục vụ mục đích thử nghiệm, vui lòng sử dụng mã: <strong className="font-mono text-primary">123456</strong>)</p>
                        <input
                            type="text"
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="Nhập mã 6 chữ số"
                            required
                            maxLength={6}
                        />
                    </div>
                     {error && <p className="text-sm text-center text-danger">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-success hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 transition-colors"
                    >
                        {loading ? 'Đang xác thực...' : 'Xác thực & Đăng nhập'}
                    </button>
                </form>
            )}

            <div className="mt-6 text-center">
                <button onClick={onBack} className="font-medium text-secondary hover:text-indigo-500">
                   &larr; Quay lại trang chủ
                </button>
            </div>
        </div>
    );
};

export default ParentLogin;