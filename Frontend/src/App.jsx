import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/Authcontext';
import Auth from './pages/auth';
import ForgetPassword from './components/Forgetpassword';
import Home from './pages/Home';
import SeatSelection from './pages/Seatselection';
import Payment from './pages/payment';
import PaymentSuccess from './pages/paymentsuccess';

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

          <Route path='/seat'
          element = {
              <SeatSelection/>
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