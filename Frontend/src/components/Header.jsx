import { useState } from "react";
import { Menu, User, History, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("authToken"); 
    setMenuOpen(false);
    navigate("/"); 
  };

  return (
    <header className="relative z-20 flex items-center justify-between px-4 py-6 md:px-8 bg-transparent">
      <h1
        onClick={() => navigate("/home")}
        className="text-3xl font-extrabold text-white tracking-tight cursor-pointer"
      >
        BusEase
      </h1>

      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center space-x-2 bg-white/20 backdrop-blur-lg border border-white/30 rounded-full px-5 py-2 text-white hover:bg-white/30 transition-all duration-300"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          <Menu className="w-5 h-5" />
          <span className="text-sm font-semibold">Menu</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 w-56 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl overflow-hidden z-30 animate-fadeIn">
            <button
              onClick={() => {
                navigate("/profile");
                setMenuOpen(false);
              }}
              className="w-full flex items-center space-x-2 px-5 py-3 text-white hover:bg-white/20 transition-all duration-200 cursor-pointer"
              aria-label="Go to Profile"
            >
              <User className="w-5 h-5 text-indigo-300" />
              <span className="text-sm font-medium">Profile</span>
            </button>

            <button
              onClick={() => {
                navigate("/history");
                setMenuOpen(false);
              }}
              className="w-full flex items-center space-x-2 px-5 py-3 text-white hover:bg-white/20 transition-all duration-200 cursor-pointer"
              aria-label="Go to Booking History"
            >
              <History className="w-5 h-5 text-indigo-300" />
              <span className="text-sm font-medium">Booking History</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-5 py-3 text-white hover:bg-white/20 transition-all duration-200 cursor-pointer"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5 text-indigo-300" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
