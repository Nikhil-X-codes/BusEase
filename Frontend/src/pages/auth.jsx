import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { register,login } from '../services/auth.service';

const Auth = () => {
    const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isTypingPassword, setIsTypingPassword] = useState(false);
  const [eyeBlink, setEyeBlink] = useState(false);


  useEffect(() => {
    if (!isTypingPassword) {
      const blinkInterval = setInterval(() => {
        setEyeBlink(true);
        setTimeout(() => setEyeBlink(false), 150);
      }, 3000);
      return () => clearInterval(blinkInterval);
    }
  }, [isTypingPassword]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordFocus = () => {
    setIsTypingPassword(true);
  };

  const handlePasswordBlur = () => {
    setIsTypingPassword(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({ username: '', email: '', password: '' });
    setShowPassword(false);
    setIsTypingPassword(false);
  };


const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        if (isSignUp) {
            // Handle Register
            const formDataObj = new FormData();
            formDataObj.append('username', formData.username);
            formDataObj.append('email', formData.email);
            formDataObj.append('password', formData.password);
            
            const response = await register(formDataObj);
            setIsSignUp(false);
        } else {
            const formDataObj = new FormData();
            formDataObj.append('email', formData.email);
            formDataObj.append('password', formData.password);
            
            const response = await login(formDataObj);

            navigate('/home'); 
        }
    } catch (error) {
        console.error('Auth error:', error?.response?.data?.message || error.message);
    }
};

  const CharacterAvatar = () => (
    <div className="relative w-24 h-24 mx-auto mb-8">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-105">
        <div className="relative">
          <div className="flex space-x-3 mb-2">
            <div className={`w-3 h-3 bg-white rounded-full transition-all duration-200 ${
              isTypingPassword || eyeBlink ? 'transform scale-y-0' : 'transform scale-y-100'
            }`}>
              <div className="w-1.5 h-1.5 bg-gray-800 rounded-full mx-auto mt-0.5"></div>
            </div>
            <div className={`w-3 h-3 bg-white rounded-full transition-all duration-200 ${
              isTypingPassword || eyeBlink ? 'transform scale-y-0' : 'transform scale-y-100'
            }`}>
              <div className="w-1.5 h-1.5 bg-gray-800 rounded-full mx-auto mt-0.5"></div>
            </div>
          </div>

          <div className="w-4 h-2 bg-white rounded-full mx-auto opacity-80"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">

      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/90 via-purple-50/90 to-pink-100/90"></div>
      <div 
        className="absolute inset-0 opacity-30 blur-sm"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Cg fill='%234F46E5' opacity='0.1'%3E%3Crect x='100' y='200' width='300' height='180' rx='20'/%3E%3Crect x='120' y='220' width='60' height='60' rx='8' fill='%23A855F7'/%3E%3Crect x='200' y='220' width='60' height='60' rx='8' fill='%23A855F7'/%3E%3Crect x='280' y='220' width='60' height='60' rx='8' fill='%23A855F7'/%3E%3Ccircle cx='150' cy='400' r='25' fill='%23374151'/%3E%3Ccircle cx='350' cy='400' r='25' fill='%23374151'/%3E%3Crect x='80' y='180' width='20' height='40' rx='10'/%3E%3Crect x='420' y='180' width='20' height='40' rx='10'/%3E%3Crect x='500' y='250' width='200' height='120' rx='15'/%3E%3Crect x='520' y='270' width='40' height='40' rx='6' fill='%23EC4899'/%3E%3Crect x='580' y='270' width='40' height='40' rx='6' fill='%23EC4899'/%3E%3Crect x='640' y='270' width='40' height='40' rx='6' fill='%23EC4899'/%3E%3Ccircle cx='540' cy='390' r='20' fill='%23374151'/%3E%3Ccircle cx='660' cy='390' r='20' fill='%23374151'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>
      <div className="w-full max-w-md relative z-10">
        {/* Toggle Switch */}
        <div className="flex bg-white rounded-full p-1 mb-8 shadow-lg">
          <button
            onClick={() => !isSignUp && toggleMode()}
            className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all duration-300 ${
              isSignUp
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md transform scale-105'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => isSignUp && toggleMode()}
            className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all duration-300 ${
              !isSignUp
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md transform scale-105'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Sign In
          </button>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
          <CharacterAvatar />

          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          <div className="space-y-6">
            {isSignUp && (
              <div className="transform transition-all duration-300">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 placeholder-gray-400"
                />
              </div>
            )}

            <div className="transform transition-all duration-300">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 placeholder-gray-400"
              />
            </div>

            <div className="transform transition-all duration-300">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={handlePasswordFocus}
                  onBlur={handlePasswordBlur}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>

<button
  type="button"
  onClick={() => navigate('/forget-password')}
  className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors duration-200"
>
  Forgot Password?
</button>

          <button
    onClick={handleSubmit}
    disabled={isLoading}
    className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
>
    {isLoading ? (
        <span>Loading...</span>
    ) : (
        isSignUp ? 'Create Account' : 'Sign In'
    )}
</button>

{error && (
    <div className="mt-4 text-red-500 text-sm text-center">
        {error}
    </div>
)}
          </div>

          <div className="mt-6 text-center">
            <span className="text-gray-600 text-sm">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button
              onClick={toggleMode}
              className="ml-1 text-purple-600 hover:text-purple-800 font-semibold text-sm transition-colors duration-200"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;