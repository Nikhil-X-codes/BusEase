import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/Authcontext';
import Auth from './pages/auth';
import ForgetPassword from './components/Forgetpassword';
import Home from './pages/Home';

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

        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;