import React, { useState, useContext } from 'react';
import type { Application } from '../../types';
import { AppContext } from '../../App';

interface StatusCheckProps {
    onStatusCheck: (application: Application) => void;
    onBack: () => void;
}

const StatusCheck: React.FC<StatusCheckProps> = ({ onStatusCheck, onBack }) => {
    const appContext = useContext(AppContext);
    const [applicationId, setApplicationId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        setTimeout(() => {
            const foundApplication = appContext!.applications.find(app => app.id.toLowerCase() === applicationId.toLowerCase());
            if (foundApplication) {
                onStatusCheck(foundApplication);
            } else {
                setError('Không tìm thấy hồ sơ với mã đã nhập. Vui lòng kiểm tra lại.');
            }
            setLoading(false);
        }, 500);
    };

    return (
        <div className="max-w-xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Tra cứu tiến độ hồ sơ</h2>
                    <p className="text-gray-500 mt-2">Nhập mã hồ sơ đã được cấp để xem trạng thái.</p>
                </div>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="applicationId" className="block text-sm font-medium text-gray-700">Mã hồ sơ</label>
                        <input
                            type="text"
                            id="applicationId"
                            value={applicationId}
                            onChange={(e) => setApplicationId(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="Ví dụ: NH25001"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-danger">{error}</p>}
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-gray-400 transition-colors"
                    >
                        {loading ? 'Đang tra cứu...' : 'Tra cứu'}
                    </button>
                </form>
                 <div className="mt-6 text-center">
                    <button onClick={onBack} className="font-medium text-secondary hover:text-indigo-500">
                       &larr; Quay lại trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatusCheck;