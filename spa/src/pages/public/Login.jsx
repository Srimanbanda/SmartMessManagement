import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/ToastProvider';
import { KeyRound, Shield, User, UtensilsCrossed, LineChart, Zap } from 'lucide-react';

export default function Login() {
  const [role, setRole] = useState('student'); 
  const [formData, setFormData] = useState({ id: '', password: '' });
  const [loading, setLoading] = useState(false);
  
  const { loginStudent, loginAdmin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (role === 'student') {
        const res = await loginStudent({ roll_no: formData.id, password: formData.password });
        if (res.success) {
          addToast('Student login successful', 'success');
          navigate('/student/dashboard');
        } else {
          addToast(res.error || 'Invalid credentials', 'error');
        }
      } else {
        const res = await loginAdmin({ username: formData.id, password: formData.password, role });
        if (res.success) {
          addToast('Admin login successful', 'success');
          if (res.role === 'Mess_Admin') navigate('/mess-admin/monitor');
          else navigate('/college-admin/analytics');
        } else {
          addToast(res.error || 'Invalid credentials', 'error');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface overflow-hidden">
      {/* Left Column: Branding & Features (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between relative overflow-hidden text-white pattern-dots-sm bg-opacity-95">
        {/* Abstract Background Vectors */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-secondary opacity-20 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="p-12 z-10">
          <div className="flex items-center space-x-3 mb-16">
            <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-primary">
               <UtensilsCrossed className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Smart Mess <span className="text-secondary opacity-90">Management</span></h1>
          </div>

          <div className="space-y-12">
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
               <h2 className="text-5xl font-extrabold leading-tight mb-6">
                 Smarter food.<br />
                 <span className="text-primary-100 italic font-medium">Zero waste.</span>
               </h2>
               <p className="text-lg opacity-80 max-w-md font-medium leading-relaxed">
                 A live-connected enterprise ecosystem for predicting culinary demand, optimizing wait times, and managing student wallets effortlessly.
               </p>
            </div>

            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
               <div className="flex items-start space-x-4">
                 <div className="bg-white/10 p-3 rounded-xl border border-white/20 backdrop-blur-sm">
                   <LineChart className="w-6 h-6 text-white" />
                 </div>
                 <div>
                   <h3 className="font-bold text-xl mb-1">Live Analytics</h3>
                   <p className="opacity-75 text-sm font-medium">Real-time occupancy tracking & wait-time estimates.</p>
                 </div>
               </div>
               
               <div className="flex items-start space-x-4">
                 <div className="bg-white/10 p-3 rounded-xl border border-white/20 backdrop-blur-sm">
                   <Zap className="w-6 h-6 text-white text-yellow-400" />
                 </div>
                 <div>
                   <h3 className="font-bold text-xl mb-1">Frictionless Check-in</h3>
                   <p className="opacity-75 text-sm font-medium">RFID-enabled digital receipts that sync in milliseconds.</p>
                 </div>
               </div>
            </div>
          </div>
        </div>

        <div className="p-12 z-10 text-sm font-medium opacity-60 flex justify-between">
           <span>Created for TechFest Innovation Challenge</span>
           <span>Version 2.0.1</span>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative">
        <div className="max-w-md w-full animate-fade-in">
          
          <div className="text-center mb-10 lg:hidden">
            <div className="w-16 h-16 bg-primary rounded-2xl shadow-lg flex items-center justify-center text-white mx-auto mb-4">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-gray-800">Smart Mess</h2>
            <p className="text-gray-500 font-bold mt-1">Sign in to your account</p>
          </div>

          <div className="hidden lg:block mb-10">
            <h2 className="text-4xl font-black text-gray-800 tracking-tight">Welcome back</h2>
            <p className="text-gray-500 font-bold mt-2 text-lg">Enter your details to access the portal.</p>
          </div>

          {/* Role Tabs */}
          <div className="bg-gray-100/80 p-1.5 rounded-xl mb-10 flex border border-gray-200/50 backdrop-blur-sm shadow-inner">
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${role === 'student' ? 'bg-white text-primary shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'}`}
              onClick={() => { setRole('student'); setFormData({ id: '', password: '' }); }}
            >
              Student
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${role === 'Mess_Admin' ? 'bg-white text-primary shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'}`}
              onClick={() => { setRole('Mess_Admin'); setFormData({ id: '', password: '' }); }}
            >
              Mess Admin
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${role === 'College_Admin' ? 'bg-white text-primary shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'}`}
              onClick={() => { setRole('College_Admin'); setFormData({ id: '', password: '' }); }}
            >
              College Admin
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 ml-1">
                {role === 'student' ? 'Student ID (Roll Number)' : 'Administrator Username'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                  {role === 'student' ? <User className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-gray-50 focus:bg-white shadow-sm font-semibold outline-none"
                  placeholder={role === 'student' ? 'e.g. CS21001' : 'admin_user'}
                  value={formData.id}
                  onChange={(e) => setFormData({...formData, id: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                 <label className="text-sm font-bold text-gray-700">Password</label>
                 <a href="#" className="text-xs font-bold text-primary hover:underline">Forgot password?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                  <KeyRound className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-gray-50 focus:bg-white shadow-sm font-semibold outline-none tracking-widest"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-primary/30 text-base font-black text-white bg-primary hover:bg-primary/95 hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-8 transform active:scale-[0.99]"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   <span>Authenticating...</span>
                </div>
              ) : (
                'Sign In Securely'
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
