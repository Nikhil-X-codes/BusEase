import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import { searchRoute, getRoutes } from "../services/route.service";
import { useNavigate } from "react-router-dom";
import { Bus, Armchair,Coins ,Calendar } from "lucide-react";
import Header from "../components/Header"

const Home = () => {
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [departureDate, setDepartureDate] = useState(null);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await getRoutes();
        const apiData = response?.data?.data;
        const routesArray = Array.isArray(apiData) ? apiData : [];
        const uniqueLocations = [
          ...new Set(
            routesArray
              .flatMap((route) => [route?.startLocation, route?.endLocation])
              .filter((loc) => loc && typeof loc === "string")
          ),
        ];
        const routeOptions = uniqueLocations.map((loc) => ({ value: loc, label: loc }));
        setRoutes(routeOptions);
      } catch (err) {
        console.error("Error fetching routes:", err?.message || err);
        setError(err?.message || "Failed to load routes");
      }
    };
    fetchRoutes();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!from?.value || !to?.value || !departureDate) {
      setError("Please select departure city, destination city, and date");
      console.warn("Validation failed:", { from, to, departureDate });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await searchRoute({
        startLocation: from.value,
        endLocation: to.value,
      });
      const apiData = response?.data?.data;
      const routesArray = Array.isArray(apiData) ? apiData : [];
      const busList = Array.isArray(routesArray)
        ? routesArray.flatMap((route) =>
            Array.isArray(route.buses)
              ? route.buses.map((bus) => ({
                  id: bus._id || "",
                  name: bus.busNumber || "Unknown Bus",
                  distance: `${route.totalDistance || 0} km`,
                  from: route.startLocation || "Unknown",
                  to: route.endLocation || "Unknown",
                  duration: route.totalDuration
                    ? `${route.totalDuration}h`
                    : "N/A",
price: bus.Seats && Array.isArray(bus.Seats) && bus.Seats.length > 0
  ? Math.min(...bus.Seats.map(seat => seat.price || 0))
  : 0,
                  amenities: Array.isArray(bus.amenities) ? bus.amenities : [],
                  routeId: route._id || "",
                }))
              : []
          )
        : [];
      setBuses(busList);
      if (busList.length === 0) {
        setError("No buses found for the selected criteria");
      }
    } catch (err) {
      setError(err?.message || "Search failed");
      console.error("Search error:", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

 const handleBookNow = (busId, routeId) => {
  navigate(`/buses/${busId}/seats?routeId=${routeId}`, {
    state: { selectedDate: departureDate }
  });
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 md:p-8 relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20" />

      {/* Header */}
      <Header />

      {/* Navigation Tabs */}
      <div className="relative z-10 flex justify-center mb-10">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-full p-3 flex space-x-4">
          <div className="flex items-center space-x-3 px-5 py-2 rounded-full bg-indigo-600 text-white shadow-md transition-all duration-300">
            <Bus className="w-5 h-5" />
            <span className="text-sm font-semibold">Select Bus</span>
          </div>
          <div className="flex items-center space-x-3 px-5 py-2 rounded-full text-white/70 hover:bg-white/10 transition-all duration-300">
            <Armchair className="w-5 h-5" />
            <span className="text-sm font-semibold">Select Seat</span>
          </div>
          <div className="flex items-center space-x-3 px-5 py-2 rounded-full text-white/70 hover:bg-white/10 transition-all duration-300">
            <Coins className="w-5 h-5" />
            <span className="text-sm font-semibold">Payment</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
<div className="relative z-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 md:p-8 mb-8 shadow-xl">
  <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-6">
    Find Your Perfect Journey
  </h2>
  <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
    <div className="relative">
      <label className="block text-white text-sm font-medium mb-2">From</label>
<Select
  options={routes.filter((route) => route.value !== to?.value)}
  value={from}
  onChange={(option) => setFrom(option)}
  placeholder="Select departure city"
  className="text-gray-800"
  menuPortalTarget={document.body}   
  styles={{
    control: (base) => ({
      ...base,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderRadius: "0.75rem",
      padding: "0.5rem",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      "&:hover": { borderColor: "rgba(99, 102, 241, 0.5)" },
      zIndex: 20, 
    }),
    option: (base, state) => ({
      ...base,
      color: "#1a202c",
      backgroundColor: state.isSelected ? "#e0e7ff" : "white",
      "&:hover": { backgroundColor: "#f1f5f9" },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "white",
      borderRadius: "0.75rem",
      marginTop: "0.5rem", 
      zIndex: 9999,       
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }), 
  }}
  isClearable
/>

    </div>
    
    <div className="relative">
      <label className="block text-white text-sm font-medium mb-2">To</label>
      <Select
  options={routes.filter((route) => route.value !== from?.value)}
  value={to}
  onChange={(option) => setTo(option)}  // ✅ FIXED
  placeholder="Select destination city"
  className="text-gray-800"
  menuPortalTarget={document.body}   
  styles={{
    control: (base) => ({
      ...base,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderRadius: "0.75rem",
      padding: "0.5rem",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      "&:hover": { borderColor: "rgba(99, 102, 241, 0.5)" },
      zIndex: 20, 
    }),
    option: (base, state) => ({
      ...base,
      color: "#1a202c",
      backgroundColor: state.isSelected ? "#e0e7ff" : "white",
      "&:hover": { backgroundColor: "#f1f5f9" },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "white",
      borderRadius: "0.75rem",
      marginTop: "0.5rem", 
      zIndex: 9999,       
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }), 
  }}
  isClearable
/>
    </div>
    
    <div className="relative">
      <label className="block text-white text-sm font-medium mb-2">
        Departure Date
      </label>
      <div className="relative">
        <DatePicker
          selected={departureDate}
          onChange={(date) => {
            setDepartureDate(date);
          }}
          placeholderText="Select date"
          dateFormat="dd-MM-yyyy"
          minDate={new Date()}
          className="w-full px-4 py-[0.875rem] pr-10 bg-white/90 rounded-xl text-gray-800 border border-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 shadow-sm hover:border-indigo-400"
          wrapperClassName="w-full"
        />
        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
    </div>

    <button
      type="submit"
      className="w-full md:col-span-3 mt-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition duration-300 font-semibold shadow-md hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={loading}
      aria-label="Search Buses"
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
          Searching...
        </span>
      ) : (
        "Search Buses"
      )}
    </button>
  </form>
  {error && (
    <p className="text-red-300 text-center mt-4 font-medium animate-pulse">{error}</p>
  )}
</div>

      {/* Bus Listings */}
      <div className="relative z-10">
        <h3 className="text-2xl font-bold text-white mb-6">
          Available Buses <span className="text-gray-300 text-sm">({buses.length} found)</span>
        </h3>
        {loading && (
          <div className="text-center py-12">
            <svg
              className="animate-spin h-8 w-8 text-indigo-400 mx-auto"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-white text-lg mt-4">Loading buses...</p>
          </div>
        )}

        {buses.map((bus) => (
          <div
            key={bus.id}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-white/15"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-white">{bus.name}</h4>
                <div className="text-gray-200 text-sm space-y-1 mt-2">
                  <p><span className="font-medium">Route:</span> {bus.from} → {bus.to}</p>
                  <p><span className="font-medium">Distance:</span> {bus.distance}</p>
                  <p><span className="font-medium">Duration:</span> {bus.duration}</p>
                  <p><span className="font-medium">Starting Price:</span> ₹{bus.price.toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {bus.amenities.length > 0 ? (
                    bus.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="text-gray-200 text-xs bg-indigo-800/50 px-3 py-1 rounded-full border border-indigo-500/30"
                      >
                        {amenity}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-200 text-xs bg-gray-800/50 px-3 py-1 rounded-full border border-gray-500/30">
                      No amenities listed
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full md:w-auto">
                <button
                  onClick={() => handleBookNow(bus.id, bus.routeId)}
                  className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-all duration-300 font-semibold shadow-md hover:shadow-xl transform hover:scale-105"
                  aria-label={`Book ${bus.name}`}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;