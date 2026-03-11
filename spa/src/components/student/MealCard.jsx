import { useState } from 'react';
import { CheckCircle, ChefHat, Clock, CreditCard, Sparkles } from 'lucide-react';

export default function MealCard({ meal, onBook, processing, isBooked }) {
  return (
    <div className="relative bg-white rounded-2xl p-6 transition-all duration-300 border border-gray-100 shadow-sm hover:shadow-md">

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 capitalize flex items-center">
            {meal.meal_type}
            <ChefHat className="w-5 h-5 ml-2 text-gray-400" />
          </h3>
          <div className="flex items-center text-sm font-medium text-gray-500 mt-2">
            <Clock className="w-4 h-4 mr-1.5" />
            {meal.start_time || '12:00 PM'}
          </div>
        </div>
        <div className="flex items-center text-lg font-black text-primary">
          <CreditCard className="w-5 h-5 mr-1.5 opacity-80" />
          {meal.price} Coins
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-600 leading-relaxed font-medium">
          {meal.items || 'Standard thali with rice, dal, roti, and seasonal vegetable.'}
        </p>
      </div>

      <button
        onClick={() => !isBooked && onBook(meal)}
        disabled={processing || isBooked}
        className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all disabled:cursor-not-allowed ${
          isBooked
            ? 'bg-success/15 text-success border border-success/30 disabled:opacity-100 cursor-default'
            : 'bg-surface hover:bg-gray-200 text-primary border border-gray-200 disabled:opacity-70'
        }`}
      >
        {isBooked ? (
          <span className="flex items-center justify-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Booked
          </span>
        ) : processing ? (
           <span className="flex items-center justify-center">
             <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2 border-primary"></div>
             Processing...
           </span>
        ) : (
           'Book Meal'
        )}
      </button>
    </div>
  );
}
