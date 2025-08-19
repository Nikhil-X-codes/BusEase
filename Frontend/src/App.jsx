import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/Authcontext';
import Auth from './pages/auth';
import ForgetPassword from './components/Forgetpassword';
import Home from './pages/Home';
import SeatSelection from './pages/Seatselection';
import Payment from './pages/payment';
import PaymentSuccess from './pages/paymentsuccess';
import Profile from './pages/Profile';
import WatchHistory from './pages/WatchHistory';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forget-password" element={<ForgetPassword />} />

          <Route path='/home'
          element = {
              <Home/>
          } />

          <Route path='/buses/:busId/seats'
          element = {
              <SeatSelection/>
          } />

          <Route path='/profile'
          element = {
              <Profile/>
          } />

          <Route path='/history'
          element = {
              <WatchHistory/>
          } />
                    
                    
          <Route path='/payment'
          element = {
              <Payment/>
          } />

          <Route path='/success'
          element = {
             <PaymentSuccess/>
          } />







        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;