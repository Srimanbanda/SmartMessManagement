import { useState, useEffect } from 'react';
import { Activity, Users } from 'lucide-react';
import apiClient from '../../services/apiClient';
import SkeletonLoader from '../../components/common/SkeletonLoader';

export default function GlobalAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    total_students: 0,
    meals_today: 0
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await apiClient.get('/api/admin/analytics');
        if (data.success) {
          setAnalytics(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const stats = [
    { label: 'Total Active Students', value: analytics.total_students.toLocaleString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Meals Served Today', value: analytics.meals_today.toLocaleString(), icon: Activity, color: 'text-success', bg: 'bg-success/10' }
  ];

  if (loading) return <SkeletonLoader type="table" />;

  return (
    <div className="max-w-6xl animate-fade-in space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-800 mb-1">Global Analytics</h2>
        <p className="text-gray-500 font-bold opacity-80 mt-1">Macro-level system health and operations overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 transition-transform hover:-translate-y-1">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
               <stat.icon className="w-7 h-7" />
            </div>
            <div>
               <p className="text-sm font-bold text-gray-500 opacity-80">{stat.label}</p>
               <h3 className="text-2xl font-black text-gray-800 mt-0.5">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
