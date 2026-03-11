import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { Activity, QrCode, ShieldCheck, Clock, Utensils } from 'lucide-react';

export default function LiveMonitor() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [messFilter, setMessFilter] = useState('Mess_A');

  useEffect(() => {
    async function fetchBookings() {
      try {
        const { data } = await apiClient.get('/api/admin/bookings', {
          params: { date, mess_name: messFilter }
        });
        // Backend returns { success: true, bookings: [...] }
        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      } catch (error) {
        console.error(error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBookings();
    const interval = setInterval(fetchBookings, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [date, messFilter]);

  if (loading) return <SkeletonLoader type="table" />;

  // Aggregate counts per meal type
  const mealStats = bookings.reduce((acc, current) => {
    const meal = current.meal_type;
    const status = current.status; // 'booked' or 'consumed'
    
    if (!acc[meal]) {
      acc[meal] = { booked: 0, consumed: 0 };
    }
    
    // If status is consumed, it means it *was* booked and now eaten
    if (status === 'consumed') {
      acc[meal].consumed += 1;
      acc[meal].booked += 1; // It still counts towards total prepared
    } else {
      acc[meal].booked += 1; // Just booked, not yet eaten
    }
    
    return acc;
  }, {});

  return (
    <div className="max-w-6xl animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 mb-1 flex items-center">
             <Activity className="w-8 h-8 mr-3 text-primary animate-pulse" />
             Live Entrance Monitor
          </h2>
          <p className="text-gray-500 font-bold opacity-80 mt-1">Real-time tracking of student entries via RF/QR scans</p>
        </div>
        <div className="flex items-center space-x-3">
          <select value={messFilter} onChange={e => setMessFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg font-bold text-gray-700 focus:ring-2 focus:ring-primary outline-none shadow-sm">
            <option value="Mess_A">Mess A</option>
            <option value="Mess_B">Mess B</option>
          </select>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg font-bold text-gray-700 focus:ring-2 focus:ring-primary outline-none shadow-sm" />
          <div className="bg-white px-5 py-2 rounded-full border border-gray-100 shadow-sm flex items-center space-x-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
            </div>
            <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>

      {/* Aggregation Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {['breakfast', 'lunch', 'dinner'].map(meal => {
          const stats = mealStats[meal] || { booked: 0, consumed: 0 };
          return (
            <div key={meal} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">{meal}</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-gray-800">{stats.booked}</span>
                  <span className="text-sm font-bold text-gray-400">Total Booked</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-success font-black text-xl">{stats.consumed}</div>
                <div className="text-xs font-bold text-gray-400 uppercase">Consumed</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface border-b border-gray-100">
              <th className="px-6 py-4 font-bold text-gray-500 text-sm tracking-widest uppercase">Student</th>
              <th className="px-6 py-4 font-bold text-gray-500 text-sm tracking-widest uppercase">Meal Detail</th>
              <th className="px-6 py-4 font-bold text-gray-500 text-sm tracking-widest uppercase">Timestamp</th>
              <th className="px-6 py-4 font-bold text-gray-500 text-sm tracking-widest uppercase text-right">Entrance Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-5">
                   {/* Backend returns 'name' and 'roll_no' from the JOIN */}
                   <div className="font-bold text-gray-800 text-lg">{booking.name}</div>
                   <div className="text-sm font-bold text-gray-500 opacity-80">{booking.roll_no}</div>
                </td>
                <td className="px-6 py-5">
                   <div className="font-bold text-gray-800 capitalize text-lg flex items-center">
                     <Utensils className="w-4 h-4 mr-2 text-primary opacity-60" />
                     {booking.meal_type}
                   </div>
                </td>
                <td className="px-6 py-5">
                   <div className="flex items-center text-gray-600 font-bold opacity-90 text-sm">{new Date().toLocaleTimeString()}</div>
                </td>
                <td className="px-6 py-5 text-right">
                  {booking.status === 'consumed' ? (
                     <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-black tracking-wide uppercase bg-success/15 text-success border border-success/20 shadow-sm">
                       <ShieldCheck className="w-4 h-4 mr-1.5" /> Consumed
                     </span>
                  ) : (
                     <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-black tracking-wide uppercase bg-primary/10 text-primary border border-primary/20 shadow-sm">
                       <QrCode className="w-4 h-4 mr-1.5" /> Booked
                     </span>
                  )}
                </td>
              </tr>
            ))}
            
            {bookings.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-10 text-gray-500 font-medium tracking-wide">No active bookings found for this session.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
