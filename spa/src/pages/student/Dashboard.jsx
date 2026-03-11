import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../components/common/ToastProvider';
import MealCard from '../../components/student/MealCard';
import DigitalReceiptModal from '../../components/student/DigitalReceiptModal';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { Calendar, Users, Clock } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { updateCoins } = useWallet();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [menu, setMenu] = useState([]);
  
  const [processingMeal, setProcessingMeal] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [bookedMeals, setBookedMeals] = useState(new Set()); // tracks booked meal_types for selected date+mess
  const [occupancy, setOccupancy] = useState(null); // tracking live wait times

  // Dynamic state for filtering — future dates only (min = tomorrow in LOCAL timezone)
  // NOTE: toISOString() returns UTC, which causes wrong date in IST (UTC+5:30).
  // We use local year/month/day instead.
  const toLocalDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toLocalDateStr(d);
  })();
  const [targetDate, setTargetDate] = useState(tomorrow);
  const [messName, setMessName] = useState('Mess_A');

  useEffect(() => {
    let isMounted = true;
    
    async function fetchDashboardData() {
      try {
        setLoading(true);
        // Fetch menu + booked status for the selected date/mess in parallel
        const [dashRes, menuRes, bookedRes] = await Promise.all([
          apiClient.get(`/api/student/dashboard/${user.id}`).catch(() => ({ data: { recent_bookings: [] } })),
          apiClient.get(`/api/menu/${messName}/${targetDate}`).catch(() => ({ data: [] })),
          apiClient.get(`/api/student/bookings/${user.id}`, { params: { date: targetDate } }).catch(() => ({ data: { bookings: [] } }))
        ]);

        if (isMounted) {
          setDashboardData(dashRes.data);

          // Pre-populate which meals are already booked to survive page navigation
          const alreadyBooked = (bookedRes.data?.bookings || []).map(b => b.meal_type);
          setBookedMeals(new Set(alreadyBooked));
          
          const fetchedMenus = menuRes.data?.menus || [];
          
          // Generate fallback data if API returns empty during dev
          if (fetchedMenus.length === 0) {
             setMenu([
               { meal_type: "breakfast", items: "Poha, Jalebi, Tea", price: 30, start_time: "07:30 AM", is_special: false },
               { meal_type: "lunch", items: "Rice, Dal, Paneer Butter Masala, Roti, Salad", price: 50, start_time: "12:00 PM", is_special: true },
               { meal_type: "dinner", items: "Rice, Mixed Veg, Roti, Dessert", price: 40, start_time: "07:30 PM", is_special: false }
             ]);
          } else {
             setMenu(fetchedMenus);
          }
          
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          addToast('Failed to sync dashboard data', 'error');
          setLoading(false);
        }
      }
    }

    if (user?.id) fetchDashboardData();
    return () => { isMounted = false; };
  }, [user.id, targetDate, messName, addToast]);

  // Live Occupancy Polling
  useEffect(() => {
    const fetchOccupancy = async () => {
      try {
        const { data } = await apiClient.get('/api/student/occupancy');
        if (data.success) {
          setOccupancy(data.occupancy);
        }
      } catch (error) {
        console.error('Failed to fetch occupancy', error);
      }
    };
    fetchOccupancy();
    const interval = setInterval(fetchOccupancy, 30000); // Live poll every 30s
    return () => clearInterval(interval);
  }, []);

  const getWaitStatus = (stats) => {
    if (!stats || stats.booked === 0) return { text: 'Quiet', color: 'text-success', bg: 'bg-success/10' };
    const ratio = stats.consumed / stats.booked;
    if (ratio < 0.2) return { text: 'Quiet (Walk right in)', color: 'text-success', bg: 'bg-success/10' };
    if (ratio < 0.6) return { text: 'Busy (Approx. 10 min wait)', color: 'text-orange-500', bg: 'bg-orange-50' };
    return { text: 'Quiet (Most have eaten)', color: 'text-blue-500', bg: 'bg-blue-50' };
  };

  const handleBookMeal = async (meal) => {
    try {
      setProcessingMeal(meal.meal_type);
      
      const payload = {
        student_id: user.id,
        mess_name: messName,
        meal_type: meal.meal_type,
        meal_date: targetDate
      };

      const { data } = await apiClient.post('/api/booking/book', payload);
      
      if (data.success) {
        updateCoins(data.remaining_coins);
        // Mark this meal as booked locally so UI updates immediately
        setBookedMeals(prev => new Set(prev).add(meal.meal_type));
        setReceipt({
          booking_ref: data.booking_ref || `BK-${Math.floor(Math.random() * 10000)}`,
          remaining_coins: data.remaining_coins,
          meal_type: meal.meal_type,
          meal_date: targetDate
        });
        addToast('Transaction authorized seamlessly!', 'success');
      } else {
         addToast(data.message || 'Booking authorization failed', 'error');
      }
    } catch (error) {
      // 400 Catch: "You have already booked this meal" context constraint
      addToast(error.response?.data?.message || 'Transaction denied. Already booked or insufficient balance.', 'warning');
    } finally {
      setProcessingMeal(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-gray-500 mb-8 pb-4 border-b border-gray-100">
          <Calendar className="w-5 h-5" />
          <span className="font-semibold">{new Date().toDateString()}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonLoader />
          <SkeletonLoader />
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Live Crowd Widget */}
      {occupancy && (
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
             <Clock className="w-5 h-5 text-gray-500" />
             <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest text-sm">Live Entrance Wait Times</h3>
             <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full animate-pulse uppercase tracking-wider">Live</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Mess_A', 'Mess_B'].map(mess => {
              const stats = occupancy[mess];
              const status = getWaitStatus(stats);
              return (
                <div key={mess} className={`p-4 rounded-xl border border-gray-100 flex items-center justify-between transition-colors bg-white hover:border-gray-200 shadow-sm`}>
                   <div className="flex items-center space-x-4">
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status.bg} ${status.color}`}>
                       <Users className="w-6 h-6" />
                     </div>
                     <div>
                       <h4 className="font-black text-gray-800 text-lg uppercase tracking-wide">{mess.replace('_', ' ')}</h4>
                       <p className={`text-sm font-bold mt-0.5 ${status.color}`}>{status.text}</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="text-xl font-black text-gray-800">{stats?.consumed || 0}</div>
                     <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Entered</div>
                   </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-gray-200 border-dashed gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 mb-1">Offerings</h2>
          <div className="flex items-center text-primary font-bold opacity-80 mt-1">
            <Calendar className="w-4 h-4 mr-2" />
            {new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <select 
            value={messName} 
            onChange={(e) => setMessName(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg font-bold text-gray-700 focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-sm cursor-pointer"
          >
            <option value="Mess_A">Mess A</option>
            <option value="Mess_B">Mess B</option>
          </select>

          <input 
            type="date"
            value={targetDate}
            min={tomorrow}
            onChange={(e) => setTargetDate(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg font-bold text-gray-700 focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-sm cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menu.map((meal, idx) => (
          <MealCard 
            key={`${meal.meal_type}-${idx}`} 
            meal={meal} 
            processing={processingMeal === meal.meal_type}
            isBooked={bookedMeals.has(meal.meal_type)}
            onBook={handleBookMeal} 
          />
        ))}
      </div>

      {receipt && (
        <DigitalReceiptModal 
          booking={receipt} 
          onClose={() => setReceipt(null)} 
        />
      )}
    </div>
  );
}
