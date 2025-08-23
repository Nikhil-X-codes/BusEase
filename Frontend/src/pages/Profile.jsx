import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import { User, Mail, Save, X, Lock } from "lucide-react";
import { updateProfile, changePassword, logout, getUserProfile } from "../services/auth.service";

export default function Profile() {

  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [form, setForm] = useState({
    username: user?.username || user?.name || "Guest",
    email: user?.email || "guest@example.com",
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await getUserProfile();
        
        const currentUser = response.data.data || response.data; 
        
        if (currentUser) {
          setForm({
            username: currentUser.username || currentUser.name || "Guest",
            email: currentUser.email || "guest@example.com",
          });
          
          if (updateUser) {
            updateUser(currentUser);
          } else {
            console.error("updateUser function not available in auth context");
          }
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
        if (user) {
          setForm({
            username: user.username || user.name || "Guest",
            email: user.email || "guest@example.com",
          });
        }
      }
    };

    fetchCurrentUser();
  }, []); 

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
    setMessage(null);
  };

  const onPasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
    setMessage(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.username.trim()) newErrors.username = "Username is required";
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    if (!passwordForm.oldPassword) newErrors.oldPassword = "Old password is required";
    if (!passwordForm.newPassword) newErrors.newPassword = "New password is required";
    else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = "New password must be at least 8 characters";
    }
    if (!passwordForm.confirmNewPassword) {
      newErrors.confirmNewPassword = "Please confirm your new password";
    } else if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      newErrors.confirmNewPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setMessage(null);

    try {
      console.log("Updating profile with data:", { 
        username: form.username, 
        email: form.email 
      });
      
      const response = await updateProfile({ 
        username: form.username, 
        email: form.email 
      });

      const updatedUser = { 
        ...user, 
        username: form.username, 
        name: form.username, 
        email: form.email 
      };
      
      if (updateUser) {
        updateUser(updatedUser);
      } else {
        console.error("updateUser function not available in auth context");
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setEditing(false);
    } catch (err) {
      console.error("Profile update error:", err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.message || err.message || "Failed to update profile" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;
    setLoading(true);
    setMessage(null);
    try {
      await changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage({ type: "success", text: "Password changed successfully!" });
      setEditingPassword(false);
      setPasswordForm({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      console.error("Password change error:", err);
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to change password" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/home");
    } catch (err) {
      console.error("Logout error:", err?.message || err);
      setMessage({ type: "error", text: "Failed to log out" });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20" />
      
      <header className="relative z-20 flex items-center justify-between px-4 py-6 md:px-8 bg-transparent">
        <h1 
          className="text-3xl font-extrabold text-white tracking-tight cursor-pointer hover:text-indigo-300 transition-colors duration-300" 
          onClick={() => navigate("/home")}
        >
          BusEase
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          aria-label="Logout"
        >
          Logout
        </button>
      </header>

      <div className="relative z-10 max-w-2xl mx-auto px-4 md:px-6 pb-8">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center">
            <User className="w-6 h-6 mr-2 text-indigo-300" />
            Your Profile
          </h2>

          {message && (
            <div
              className={`text-center py-3 px-4 mb-4 rounded-lg ${
                message.type === "success" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
              } animate-pulse`}
            >
              {message.text}
            </div>
          )}

          {!editing ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-indigo-300" />
                <div>
                  <span className="text-white/60 text-sm">Username</span>
                  <p className="text-white font-medium">{form.username}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-indigo-300" />
                <div>
                  <span className="text-white/60 text-sm">Email</span>
                  <p className="text-white font-medium">{form.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                aria-label="Edit profile"
              >
                Edit Profile
              </button>
              <button
                onClick={() => setEditingPassword(true)}
                className="w-full mt-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                aria-label="Change password"
              >
                Change Password
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm text-white/80 font-medium mb-1">
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    name="username"
                    value={form.username}
                    onChange={onChange}
                    className="w-full px-4 py-3 bg-white/90 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                    placeholder="Enter your username"
                    aria-invalid={errors.username ? "true" : "false"}
                    aria-describedby={errors.username ? "username-error" : undefined}
                  />
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.username && (
                  <p id="username-error" className="text-red-300 text-sm mt-1">
                    {errors.username}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm text-white/80 font-medium mb-1">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    className="w-full px-4 py-3 bg-white/90 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                    placeholder="Enter your email"
                    aria-invalid={errors.email ? "true" : "false"}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.email && (
                  <p id="email-error" className="text-red-300 text-sm mt-1">
                    {errors.email}
                  </p>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Save profile"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Save className="w-5 h-5 mr-2" />
                      Save
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setErrors({});
                    setMessage(null);
                    setForm({
                      username: user?.username || user?.name || "Guest",
                      email: user?.email || "guest@example.com",
                    });
                  }}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-500 text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  aria-label="Cancel editing"
                >
                  <span className="flex items-center justify-center">
                    <X className="w-5 h-5 mr-2" />
                    Cancel
                  </span>
                </button>
              </div>
            </div>
          )}

          {editingPassword && (
            <div className="mt-6 space-y-4">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-indigo-300" />
                Change Password
              </h3>
              <div>
                <label htmlFor="oldPassword" className="block text-sm text-white/80 font-medium mb-1">
                  Old Password
                </label>
                <div className="relative">
                  <input
                    id="oldPassword"
                    name="oldPassword"
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={onPasswordChange}
                    className="w-full px-4 py-3 bg-white/90 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                    placeholder="Enter old password"
                    aria-invalid={errors.oldPassword ? "true" : "false"}
                    aria-describedby={errors.oldPassword ? "oldPassword-error" : undefined}
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.oldPassword && (
                  <p id="oldPassword-error" className="text-red-300 text-sm mt-1">
                    {errors.oldPassword}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm text-white/80 font-medium mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={onPasswordChange}
                    className="w-full px-4 py-3 bg-white/90 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                    placeholder="Enter new password"
                    aria-invalid={errors.newPassword ? "true" : "false"}
                    aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.newPassword && (
                  <p id="newPassword-error" className="text-red-300 text-sm mt-1">
                    {errors.newPassword}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="confirmNewPassword" className="block text-sm text-white/80 font-medium mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    type="password"
                    value={passwordForm.confirmNewPassword}
                    onChange={onPasswordChange}
                    className="w-full px-4 py-3 bg-white/90 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                    placeholder="Confirm new password"
                    aria-invalid={errors.confirmNewPassword ? "true" : "false"}
                    aria-describedby={errors.confirmNewPassword ? "confirmNewPassword-error" : undefined}
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.confirmNewPassword && (
                  <p id="confirmNewPassword-error" className="text-red-300 text-sm mt-1">
                    {errors.confirmNewPassword}
                  </p>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Save new password"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Save className="w-5 h-5 mr-2" />
                      Save Password
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditingPassword(false);
                    setErrors({});
                    setMessage(null);
                    setPasswordForm({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
                  }}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-500 text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  aria-label="Cancel password change"
                >
                  <span className="flex items-center justify-center">
                    <X className="w-5 h-5 mr-2" />
                    Cancel
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}