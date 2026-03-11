import { CreditCard, Plus } from 'lucide-react';
import { useToast } from '../../components/common/ToastProvider';

import { useState } from 'react';
import apiClient from '../../services/apiClient';

export default function WalletRecharge() {
  const { addToast } = useToast();
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRecharge = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiClient.post('/api/admin/recharge', { student_id: parseInt(studentId), amount: parseInt(amount) });
      if (data.success) {
        addToast(data.message || 'Successfully added coins.', 'success');
        setStudentId('');
        setAmount('');
      } else {
        addToast('Recharge failed', 'error');
      }
    } catch(err) {
      addToast(err.response?.data?.message || 'Recharge failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-800 mb-1">Wallet Management</h2>
        <p className="text-gray-500 font-bold opacity-80 mt-1">Manually credit student wallets via cash/bank receipt</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
         <form onSubmit={handleRecharge} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Student ID (Numeric)</label>
              <input type="number" required value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-gray-50 focus:bg-white font-medium" placeholder="e.g. 9" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Amount to Credit (Coins)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CreditCard className="h-5 w-5 text-primary opacity-60" />
                </div>
                <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} min="10" className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-gray-50 focus:bg-white font-bold" placeholder="500" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all shadow-md mt-4 disabled:opacity-70">
               {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Plus className="w-5 h-5 mr-2" /> Authorize Credit</>}
            </button>
         </form>
      </div>
    </div>
  );
}
