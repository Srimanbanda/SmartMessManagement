import { CheckCircle2, QrCode, X } from 'lucide-react';

export default function DigitalReceiptModal({ booking, onClose }) {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-slideUp">
        
        <div className="bg-success text-white p-6 pb-8 text-center relative border-b-8 border-success-dark">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg border-4 border-success-dark/20 text-success">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black tracking-tight">Booking Confirmed!</h3>
          <p className="text-success-100 opacity-90 text-sm mt-1 font-medium text-white/80">Digital Receipt Generated</p>
        </div>

        <div className="p-8 pt-6 relative bg-gray-50">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex space-x-1 items-center justify-center opacity-30">
            <div className="w-1 h-1 rounded-full bg-gray-500"></div><div className="w-1 h-1 rounded-full bg-gray-500"></div><div className="w-1 h-1 rounded-full bg-gray-500"></div>
          </div>
          
          <div className="flex flex-col items-center justify-center mb-6">
            <QrCode className="w-24 h-24 text-gray-800" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200 border-dashed">
              <span className="text-sm font-semibold text-gray-500">Reference ID</span>
              <span className="text-sm font-bold text-gray-900 bg-gray-200 px-2 py-0.5 rounded">{booking.booking_ref}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-200 border-dashed">
              <span className="text-sm font-semibold text-gray-500">Meal</span>
              <span className="text-sm font-bold text-gray-900 capitalize">{booking.meal_type}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-200 border-dashed">
              <span className="text-sm font-semibold text-gray-500">Date</span>
              <span className="text-sm font-bold text-gray-900">{booking.meal_date}</span>
            </div>

            <div className="flex justify-between items-center py-3 bg-primary/5 px-4 rounded-lg mt-4">
              <span className="text-sm font-semibold text-primary">Remaining Coins</span>
              <span className="text-lg font-black text-primary">{booking.remaining_coins}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-8 w-full py-3 px-4 rounded-xl text-sm font-bold bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
