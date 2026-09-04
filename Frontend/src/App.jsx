import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/Authcontext';
import { lazy, Suspense, useEffect } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import ToastProvider from './components/ToastProvider';

const Auth = lazy(() => import('./pages/auth'));
const ForgetPassword = lazy(() => import('./components/Forgetpassword'));
const Home = lazy(() => import('./pages/Home'));
const SeatSelection = lazy(() => import('./pages/Seatselection'));
const Payment = lazy(() => import('./pages/payment'));
const PaymentSuccess = lazy(() => import('./pages/paymentsuccess'));
const Profile = lazy(() => import('./pages/Profile'));
const WatchHistory = lazy(() => import('./pages/WatchHistory'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));

const App = () => {
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_BASE_URL;
    if (!API_BASE) return;
    let isCancelled = false;
    const warmup = () => {
      fetch(`${API_BASE}/` , { credentials: 'include' }).catch(() => {});
    };
    warmup();
    const id = setInterval(() => {
      if (!isCancelled) warmup();
    }, 5 * 60 * 1000);
    return () => {
      isCancelled = true;
      clearInterval(id);
    };
  }, []);
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
        <ErrorBoundary>
        <Suspense fallback={<main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</main>}>
        
        <Routes>
          <Route path="/" element={<ProtectedRoute guestOnly><Auth /></ProtectedRoute>} />
          <Route path="/auth" element={<ProtectedRoute guestOnly><Auth /></ProtectedRoute>} />
          <Route path="/forget-password" element={<ProtectedRoute guestOnly><ForgetPassword /></ProtectedRoute>} />

          <Route path='/home'
          element = {
              <Home/>
          } />

            <Route path='/buses/:busId/seats' element={<ProtectedRoute requireAuth><SeatSelection/></ProtectedRoute>} />

            <Route path='/profile' element={<ProtectedRoute requireAuth><Profile/></ProtectedRoute>} />

            <Route path='/history' element={<ProtectedRoute requireAuth><WatchHistory/></ProtectedRoute>} />

            <Route path='/admin' element={<ProtectedRoute requireAuth requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path='/admin/users' element={<ProtectedRoute requireAuth requireAdmin><AdminUsers /></ProtectedRoute>} />
                    
                    
            <Route path='/payment' element={<ProtectedRoute requireAuth><Payment/></ProtectedRoute>} />

           <Route path='/success' element={<ProtectedRoute requireAuth><PaymentSuccess/></ProtectedRoute>} />







        </Routes>
        </Suspense>
        </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;