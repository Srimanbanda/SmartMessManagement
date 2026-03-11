import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/common/ToastProvider';
import { Calendar, ChefHat, Save, RefreshCw, Trash2 } from 'lucide-react';
import SkeletonLoader from '../../components/common/SkeletonLoader';

export default function MenuEditor() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly', 'special'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form States
  const [messName, setMessName] = useState('Mess_A');
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState('lunch');
  
  const [items, setItems] = useState('');
  const [price, setPrice] = useState(50);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('14:00');

  // Fetch existing menu data when filters change
  useEffect(() => {
    async function fetchExistingMenu() {
      setLoading(true);
      try {
        // Because the API expects a specific date to fetch menus,
        // For weekly edits, we just fetch a known upcoming day that matches 'dayOfWeek'
        // For simplicity in this editor, we'll fetch the actual menu for the selected date
        let fetchDate = targetDate;
        
        if (activeTab === 'weekly') {
          // Find the next occurrence of dayOfWeek
          const d = new Date();
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const targetDayIdx = days.indexOf(dayOfWeek);
          while (d.getDay() !== targetDayIdx) {
            d.setDate(d.getDate() + 1);
          }
          fetchDate = d.toISOString().split('T')[0];
        }

        const { data } = await apiClient.get(`/api/menu/${messName}/${fetchDate}`);
        if (data.success && data.menus) {
          const specificMeal = data.menus.find(m => m.meal_type === mealType);
          if (specificMeal) {
            setItems(specificMeal.items || '');
            setPrice(specificMeal.price || 50);
            
            // Handle parsing "12:00" from a possible "12:00 PM" if the backend formatted it,
            // or just use as is. Since we use time format '%H:%i' in the backend, it will be "12:00"
            setStartTime(specificMeal.start_time || '12:00');
            setEndTime(specificMeal.end_time || '14:00');
          } else {
            // Reset if not found
            setItems('');
            setPrice(50);
            setStartTime('12:00');
            setEndTime('14:00');
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchExistingMenu();
  }, [messName, targetDate, dayOfWeek, mealType, activeTab]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === 'weekly') {
        const payload = {
          mess_name: messName,
          day_of_week: dayOfWeek,
          meal_type: mealType,
          items,
          start_time: startTime,
          end_time: endTime,
          price: parseInt(price, 10)
        };
        const { data } = await apiClient.put('/api/menu/update', payload);
        if (data.success) addToast(data.message, 'success');
      } else {
        const payload = {
          mess_name: messName,
          specific_date: targetDate,
          meal_type: mealType,
          items,
          start_time: startTime,
          end_time: endTime,
          price: parseInt(price, 10)
        };
        const { data } = await apiClient.put('/api/menu/special', payload);
        if (data.success) addToast(data.message, 'success');
      }
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to update menu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSpecial = async () => {
    try {
      setSaving(true);
      const { data } = await apiClient.delete(`/api/menu/special/${messName}/${targetDate}/${mealType}`);
      if (data.success) {
        addToast(data.message, 'success');
        // Simple trick to refresh the useEffect
        setTargetDate(prev => prev);
      }
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to delete special menu', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-12">
       <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-800 mb-1">Menu Editor</h2>
          <p className="text-gray-500 font-bold opacity-80 mt-1">Configure weekly standards and special overrides</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving || loading}
          className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold flex items-center shadow-md transition-all"
        >
          {saving ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          Publish Changes
        </button>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl mb-8 w-fit border border-gray-200">
        <button
          className={`px-8 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'weekly' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('weekly')}
        >
          Weekly Standard
        </button>
        <button
          className={`px-8 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center ${activeTab === 'special' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('special')}
        >
          <ChefHat className="w-4 h-4 mr-2" />
          Special Overrides
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters Header */}
        <div className="bg-surface p-6 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Mess</label>
            <select value={messName} onChange={(e) => setMessName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary outline-none bg-white">
              <option value="Mess_A">Mess A</option>
              <option value="Mess_B">Mess B</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Meal Type</label>
            <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary outline-none bg-white">
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>

          {activeTab === 'weekly' ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Day of Week</label>
               <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary outline-none bg-white">
                 {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                   <option key={day} value={day}>{day}</option>
                 ))}
               </select>
            </div>
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Specific Date</label>
               <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary outline-none bg-white" />
            </div>
          )}
        </div>

        {/* Editor Body */}
        <div className="p-8">
          {loading ? (
            <SkeletonLoader />
          ) : (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Menu Items</label>
                <textarea 
                  value={items}
                  onChange={(e) => setItems(e.target.value)}
                  placeholder="e.g. Rice, Dal, Paneer Butter Masala, Roti, Salad"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 focus:ring-2 focus:ring-primary outline-none min-h-[120px] resize-y"
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Price (Coins)</label>
                  <input 
                    type="number" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Start Time</label>
                  <input 
                    type="time" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">End Time</label>
                  <input 
                    type="time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              {activeTab === 'special' && (
                <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-sm text-gray-500 font-medium">
                    This overrides the standard weekly menu for the selected date.
                  </div>
                  <button 
                    onClick={handleDeleteSpecial}
                    disabled={saving}
                    className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Revert to Weekly
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
