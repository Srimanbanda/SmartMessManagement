import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { Star, Microchip, Laptop, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CollegeAdminReviews() {
  const [feedbackData, setFeedbackData] = useState({ stats: [], distribution: [], recent: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeedback() {
      try {
        const { data } = await apiClient.get('/api/admin/feedback/stats');
        if (data.success) {
           setFeedbackData({
             stats: data.stats || [],
             distribution: data.distribution || [],
             recent: data.recent || []
           });
        }
      } catch (error) {
        console.error(error);
        setFeedbackData({ stats: [], distribution: [], recent: [] });
      } finally {
        setLoading(false);
      }
    }
    
    fetchFeedback();
    const interval = setInterval(fetchFeedback, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <SkeletonLoader type="table" />;

  return (
    <div className="max-w-6xl animate-fade-in space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-800 mb-1 flex items-center">
           <Star className="w-8 h-8 mr-3 text-yellow-400 fill-yellow-400" />
           Global Student Reviews
        </h2>
        <p className="text-gray-500 font-bold opacity-80 mt-1">Live sentiment feedback and analytical rating distributions from all sources.</p>
      </div>

      {/* Analytics Charts */}
      {feedbackData.stats.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {/* Average Rating Bar Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center">
              <BarChart2 className="w-5 h-5 mr-2 text-primary" />
              Average Rating per Mess
            </h3>
            <div className="flex-1 min-h-[250px] max-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feedbackData.stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="mess_name" tickFormatter={(val) => val.replace('_', ' ')} axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12, fontWeight: 600}} dy={10} />
                  <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#F3F4F6'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#374151', textTransform: 'capitalize' }}
                  />
                  <Bar dataKey="avg_rating" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} name="Average Rating" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-widest text-gray-500 font-bold">
                <th className="p-6 pl-8">Student</th>
                <th className="p-6">Mess & Meal</th>
                <th className="p-6">Rating</th>
                <th className="p-6">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-base">
              {feedbackData.recent.length > 0 ? (
                feedbackData.recent.map((review, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-6 pl-8 font-bold text-gray-800">{review.name}</td>
                    <td className="p-6">
                       <span className="font-semibold text-gray-700 block">{review.mess_name.replace('_', ' ')}</span>
                       <span className="block text-sm text-gray-400 capitalize font-medium mt-0.5">{review.meal_type} • {new Date(review.meal_date).toLocaleDateString()}</span>
                    </td>
                    <td className="p-6">
                       <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                             <Star key={i} className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                          ))}
                       </div>
                    </td>
                    <td className="p-6">
                      {review.source === 'esp32' ? (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-purple-100 text-purple-700 border border-purple-200">
                          <Microchip className="w-4 h-4 mr-2" />
                          RFID Kiosk
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-blue-100 text-blue-700 border border-blue-200">
                          <Laptop className="w-4 h-4 mr-2" />
                          Web Portal
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-gray-500 font-medium text-lg">
                    No recent feedback found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
