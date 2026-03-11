import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/ToastProvider';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { Star, CheckCircle, Utensils } from 'lucide-react';

export default function PendingFeedback() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    async function fetchPending() {
      try {
        const { data } = await apiClient.get(`/api/student/feedback/pending/${user.id}`);
        // Backend returns { success: true, pending: [...] } not a raw array
        const pendingMeals = Array.isArray(data.pending) ? data.pending : [];
        setPending(pendingMeals);
      } catch (error) {
        console.error(error);
        setPending([]);
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) fetchPending();
  }, [user.id]);

  const handleSubmit = async (meal, rating) => {
    const mealKey = meal.booking_id; // Backend uses booking_id as PK
    try {
      setSubmitting(mealKey);
      // Backend POST contract: { student_id, mess_name, meal_date, meal_type, rating }
      await apiClient.post('/api/student/feedback', {
        student_id: user.id,
        mess_name: meal.mess_name,
        meal_date: meal.meal_date,
        meal_type: meal.meal_type,
        rating
      });
      addToast('Feedback submitted successfully. Thank you!', 'success');
      setPending(prev => prev.filter(m => m.booking_id !== mealKey));
    } catch (error) {
      console.error(error);
      addToast(error.response?.data?.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <SkeletonLoader type="table" />;

  return (
    <div className="animate-fade-in max-w-4xl">
      <h2 className="text-3xl font-black text-gray-800 mb-2">Pending Feedback</h2>
      <p className="text-primary font-bold opacity-70 mb-8">Rate the meals you've already consumed.</p>

      {pending.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
           <CheckCircle className="w-16 h-16 text-success/40 mb-4" />
           <h3 className="text-xl font-bold text-gray-800">You're all caught up!</h3>
           <p className="text-gray-500 mt-2 font-medium">No pending feedback for consumed meals.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map(meal => (
            <FeedbackCard 
               key={meal.booking_id} 
               meal={meal} 
               onRating={(rating) => handleSubmit(meal, rating)}
               isSubmitting={submitting === meal.booking_id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackCard({ meal, onRating, isSubmitting }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-md">
      <div className="flex items-center space-x-5">
        <div className="w-14 h-14 bg-primary/5 rounded-full flex items-center justify-center text-primary">
          <Utensils className="w-7 h-7" />
        </div>
        <div>
          <h4 className="font-bold text-gray-800 capitalize text-xl">{meal.meal_type}</h4>
          <span className="text-sm text-gray-500 font-bold opacity-80 mt-1 block">{meal.meal_date} &bull; {meal.mess_name.replace('_', ' ')}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
           <button
             key={star}
             disabled={isSubmitting}
             onMouseEnter={() => setHovered(star)}
             onMouseLeave={() => setHovered(0)}
             onClick={() => onRating(star)}
             className="p-1.5 transition-transform hover:scale-125 disabled:opacity-50 outline-none focus:scale-125"
           >
             <Star className={`w-8 h-8 transition-colors ${hovered >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
           </button>
        ))}
      </div>
    </div>
  );
}
