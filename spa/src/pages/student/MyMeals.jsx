import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { Calendar, CheckCircle, Clock, ChefHat } from 'lucide-react';

export default function MyMeals() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    async function fetchHistory() {
      try {
        // Use new endpoint that returns all bookings, not just today's
        const { data } = await apiClient.get(`/api/student/bookings/${user.id}`);
        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      } catch (error) {
        console.error(error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) fetchHistory();
  }, [user.id]);

  if (loading) return <SkeletonLoader type="table" />;

  return (
    <div className="max-w-5xl animate-fade-in">
      <h2 className="text-3xl font-black text-gray-800 mb-2">My Meals History</h2>
      <p className="text-gray-500 font-bold opacity-80 mb-8">
        All your meal bookings across all dates and messes.
      </p>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface border-b border-gray-100">
              <th className="px-6 py-4 font-bold text-gray-500 text-sm tracking-widest uppercase">Reference</th>
              <th className="px-6 py-4 font-bold text-gray-500 text-sm tracking-widest uppercase">Date</th>
              <th className="px-6 py-4 font-bold text-gray-500 text-sm tracking-widest uppercase">Mess</th>
              <th className="px-6 py-4 font-bold text-gray-500 text-sm tracking-widest uppercase">Meal</th>
              <th className="px-6 py-4 font-bold text-gray-500 text-sm tracking-widest uppercase text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-12 text-gray-500 font-medium">
                  <ChefHat className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  No meal bookings found.
                </td>
              </tr>
            ) : (
              bookings.map((b, i) => (
                <tr key={b.booking_ref || i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-5 font-mono font-bold text-sm text-gray-600">{b.booking_ref}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center text-gray-700 font-bold text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-primary opacity-60" />
                      {b.meal_date}
                    </div>
                  </td>
                  <td className="px-6 py-5 font-bold text-gray-700">{b.mess_name?.replace('_', ' ')}</td>
                  <td className="px-6 py-5 font-bold text-gray-800 capitalize">{b.meal_type}</td>
                  <td className="px-6 py-5 text-right">
                    {b.status === 'consumed' ? (
                      <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-wide uppercase bg-success/15 text-success border border-success/20">
                        <CheckCircle className="w-4 h-4 mr-1.5" /> Consumed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
                        <Clock className="w-4 h-4 mr-1.5" /> Booked
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
