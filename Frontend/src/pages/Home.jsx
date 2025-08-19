import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import { searchRoute, getRoutes } from "../services/route.service";
import { useNavigate } from "react-router-dom";
// Profile and History now have their own routes

const Home = () => {
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [departureDate, setDepartureDate] = useState(null);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch routes for autocomplete
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await getRoutes();
        const apiData = response?.data?.data;
        console.log("Fetched routes raw:", response);
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
        console.log("Processed route options:", routeOptions);
      } catch (err) {
        console.error("Error fetching routes:", err?.message || err);
        setError(err?.message || "Failed to load routes");
      }
    };
    fetchRoutes();
  }, []);

  // Handle search form submission
  const handleSearch = async (e) => {
    e.preventDefault();
    console.log("Form submitted with:", { from, to, departureDate });
    if (!from?.value || !to?.value || !departureDate) {
      setError("Please select departure city, destination city, and date");
      console.warn("Validation failed:", { from, to, departureDate });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Query backend: send only locations to ensure buses on the route are shown
      const response = await searchRoute({
        startLocation: from.value,
        endLocation: to.value,
        // date: departureDate?.toISOString(), // optional, backend matches exact Date
      });
      const apiData = response?.data?.data;
      console.log("Bus search result raw:", response);
      const routesArray = Array.isArray(apiData) ? apiData : [];
      const busList = Array.isArray(routesArray)
        ? routesArray.flatMap((route) =>
            Array.isArray(route.buses)
              ? route.buses.map((bus) => ({
                  id: bus._id || '',
                  name: bus.busNumber || 'Unknown Bus',
                  distance: `${route.totalDistance || 0} km`,
                  from: route.startLocation || 'Unknown',
                  to: route.endLocation || 'Unknown',
                  departure: route.date
                    ? new Date(route.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : 'N/A',
                  arrival: route.date && route.totalDuration
                    ? new Date(
                        new Date(route.date).getTime() + route.totalDuration * 60 * 1000
                      ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : 'N/A',
                  duration: route.totalDuration
                    ? `${Math.floor(route.totalDuration / 60)}h ${route.totalDuration % 60}m`
                    : 'N/A',
                  price: bus.Seats && Array.isArray(bus.Seats) && bus.Seats.length > 0
                    ? bus.Seats[0].price || 0
                    : 0,
                  amenities: Array.isArray(bus.amenities) ? bus.amenities : [],
                  routeId: route._id || '',
                }))
              : []
          )
        : [];
      setBuses(busList);
      console.log("Processed bus list:", busList);
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

  // Handle Book Now click
  const handleBookNow = (busId, routeId) => {
    console.log("Navigating to seat selection for bus:", busId, "route:", routeId);
    navigate(`/buses/${busId}/seats?routeId=${routeId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 p-6 relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-30" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-extrabold tracking-wide">BusEase</h1>
        <div className="relative">
          <button
            aria-label="User menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition"
          >
            {/* Triangle avatar-style icon */}
            <span
              className="w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-t-8 border-t-white"
              style={{ borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8 }}
            />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white/95 rounded-lg shadow-xl overflow-hidden">
              <button
                onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
              >
                Profile
              </button>
              <button
                onClick={() => { navigate('/history'); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
              >
                Booking History
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex justify-center space-x-4 mb-6 text-white">
        <button className="px-4 py-2 bg-purple-700 rounded-full">Bus</button>
        <button className="px-4 py-2 bg-gray-700 rounded-full">Select Seat</button>
        <button className="px-4 py-2 bg-gray-700 rounded-full">Payment</button>
      </div>

      {/* Main Home Content */}
      <>
      {/* Search Bar */}
      <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-2xl p-6 mb-6 shadow-lg">
        <h2 className="text-2xl font-bold text-white text-center mb-4">
          Search Your Perfect Journey
        </h2>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-white text-sm mb-2">From</label>
            <Select
              options={routes.filter((route) => route.value !== to?.value)}
              value={from}
              onChange={(option) => {
                console.log("Selected from:", option);
                setFrom(option);
              }}
              placeholder="Select departure city"
              className="text-gray-800"
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                  borderRadius: "0.5rem",
                  padding: "0.25rem",
                }),
                option: (base) => ({
                  ...base,
                  color: "#1a202c",
                }),
              }}
              isClearable
            />
          </div>
          <div>
            <label className="block text-white text-sm mb-2">To</label>
            <Select
              options={routes.filter((route) => route.value !== from?.value)}
              value={to}
              onChange={(option) => {
                console.log("Selected to:", option);
                setTo(option);
              }}
              placeholder="Select destination city"
              className="text-gray-800"
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                  borderRadius: "0.5rem",
                  padding: "0.25rem",
                }),
                option: (base) => ({
                  ...base,
                  color: "#1a202c",
                }),
              }}
              isClearable
            />
          </div>
          <div>
            <label className="block text-white text-sm mb-2">Departure Date</label>
            <DatePicker
              selected={departureDate}
              onChange={(date) => {
                console.log("Selected date:", date);
                setDepartureDate(date);
              }}
              placeholderText="Select date"
              dateFormat="dd-MM-yyyy"
              minDate={new Date()}
              className="w-full px-4 py-2 bg-white bg-opacity-50 rounded-lg text-gray-800 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full md:col-span-3 mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search Buses"}
          </button>
        </form>
        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
      </div>

      {/* Bus Listings */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">
          Available Buses <span className="text-gray-400">{buses.length} buses found</span>
        </h3>
        {loading && <p className="text-white text-center">Loading buses...</p>}
        {!loading && buses.length === 0 && !error && (
          <p className="text-gray-400 text-center">No buses found. Try different search criteria.</p>
        )}
        {buses.map((bus) => (
          <div
            key={bus.id}
            className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-2xl p-4 mb-4 shadow-lg"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="mb-4 md:mb-0">
                <h4 className="text-lg font-semibold text-white">{bus.name}</h4>
                <div className="text-gray-300 text-sm">
                  <p>Distance: {bus.distance}</p>
                  <p>
                    From: {bus.from} <span className="text-gray-400">({bus.departure})</span>
                  </p>
                  <p>
                    To: {bus.to} <span className="text-gray-400">({bus.arrival})</span>
                  </p>
                  <p>Duration: {bus.duration}</p>
                </div>
                <div className="flex space-x-2 mt-2">
                  {bus.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="text-gray-400 text-xs bg-gray-700 px-2 py-1 rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">₹{bus.price}</p>
                <p className="text-gray-400 text-sm">per person</p>
                <button
                  onClick={() => handleBookNow(bus.id, bus.routeId)}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
        </>
    </div>
  );
};

export default Home;
