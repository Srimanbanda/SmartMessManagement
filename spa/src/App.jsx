import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';

// Guards & Layouts
import ProtectedRoute from './routes/ProtectedRoute';
import StudentLayout from './layouts/StudentLayout';
import MessAdminLayout from './layouts/MessAdminLayout';
import CollegeAdminLayout from './layouts/CollegeAdminLayout';

// Public
import Login from './pages/public/Login';

// Student Pages
import Dashboard from './pages/student/Dashboard';
import MyMeals from './pages/student/MyMeals';
import PendingFeedback from './pages/student/PendingFeedback';

// Mess Admin Pages
import LiveMonitor from './pages/mess-admin/LiveMonitor';
import MenuEditor from './pages/mess-admin/MenuEditor';

// College Admin Pages
import GlobalAnalytics from './pages/college-admin/GlobalAnalytics';
import StudentRegistry from './pages/college-admin/StudentRegistry';
import WalletRecharge from './pages/college-admin/WalletRecharge';

const App = () => {
  return (
    <AuthProvider>
      <WalletProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/" element={<Login />} />

            {/* Student Portal */}
            <Route path="/student/*" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="my-meals" element={<MyMeals />} />
              <Route path="feedback" element={<PendingFeedback />} />
            </Route>

            {/* Mess Admin Portal */}
            <Route path="/mess-admin/*" element={<ProtectedRoute allowedRoles={['Mess_Admin']}><MessAdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="monitor" replace />} />
              <Route path="monitor" element={<LiveMonitor />} />
              <Route path="menu" element={<MenuEditor />} />
            </Route>

            {/* College Admin Portal */}
            <Route path="/college-admin/*" element={<ProtectedRoute allowedRoles={['College_Admin']}><CollegeAdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="analytics" replace />} />
              <Route path="analytics" element={<GlobalAnalytics />} />
              <Route path="registry" element={<StudentRegistry />} />
              <Route path="recharge" element={<WalletRecharge />} />
            </Route>

            {/* Absolute Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </AuthProvider>
  );
};

export default App; // Fix typo / App component export
