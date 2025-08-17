import { useState, useEffect } from "react";
import { Calendar, MapPin, LogOut, Users, Clock, Star, Wifi, Zap, Utensils, Book, Bus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getBuses, getBusById } from "../services/book.service";
import { getSchedules, getScheduleById } from "../services/schedule.service";
import { getRoutes, searchRoute } from "../services/route.service";

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allBuses, setAllBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [cities, setCities] = useState([]);
  const navigate = useNavigate();
  
  const [searchData, setSearchData] = useState({
    startLocation: "",
    endLocation: "",
  });

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Extract unique cities when data changes
  useEffect(() => {
    const uniqueCities = new Set();
    
    // Add fallback cities
    ["Mumbai", "Kolkata", "Delhi"].forEach(city => uniqueCities.add(city));
    
    // Extract cities from buses
    if (Array.isArray(allBuses)) {
      allBuses.forEach(bus => {
        if (bus?.startLocation) uniqueCities.add(bus.startLocation);
        if (bus?.endLocation) uniqueCities.add(bus.endLocation);
      });
    }
    
    // Extract cities from routes
    if (Array.isArray(routes)) {
      routes.forEach(route => {
        if (route?.origin) uniqueCities.add(route.origin);
        if (route?.destination) uniqueCities.add(route.destination);
        if (route?.startLocation) uniqueCities.add(route.startLocation);
        if (route?.endLocation) uniqueCities.add(route.endLocation);
      });
    }

    // Extract cities from schedules
    if (Array.isArray(schedules)) {
      schedules.forEach(schedule => {
        if (schedule?.origin) uniqueCities.add(schedule.origin);
        if (schedule?.destination) uniqueCities.add(schedule.destination);
        if (schedule?.startLocation) uniqueCities.add(schedule.startLocation);
        if (schedule?.endLocation) uniqueCities.add(schedule.endLocation);
      });
    }
    
    setCities([...uniqueCities].sort());
  }, [allBuses, routes, schedules]);

  const fetchAllData = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Fetch all data in parallel
      const [busesResponse, schedulesResponse, routesResponse] = await Promise.all([
        getBuses(),
        getSchedules(),
        getRoutes()
      ]);

      setAllBuses(Array.isArray(busesResponse.data) ? busesResponse.data : []);
      setFilteredBuses(Array.isArray(busesResponse.data) ? busesResponse.data : []);
      setSchedules(Array.isArray(schedulesResponse.data) ? schedulesResponse.data : []);
      setRoutes(Array.isArray(routesResponse.data) ? routesResponse.data : []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced search function using searchRoute service
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let filtered = Array.isArray(allBuses) ? [...allBuses] : [];

      if (searchData.startLocation || searchData.endLocation) {
        const routeParams = {
          startLocation: searchData.startLocation,
          endLocation: searchData.endLocation,
        };

        const routeResponse = await searchRoute(routeParams);
        const matchingRoutes = Array.isArray(routeResponse.data) ? routeResponse.data : [];

        // Log for debugging
        console.log("Route Response:", routeResponse.data);

        console.log("Filtered Buses Before:", filtered);

        // Filter buses based on matching routes
  filtered = (Array.isArray(allBuses) ? allBuses : []).filter(bus => {
  if (!bus?.startLocation || !bus?.endLocation) {
    console.warn("Invalid bus data:", bus);
    return false;
  }
  const busId = bus.id?.toString() || bus._id?.toString();

  return matchingRoutes.some(route => {
    if (!route?.startLocation || !route?.endLocation) {
      console.warn("Invalid route data:", route);
      return false;
    }
    const fromMatch =
      route.startLocation?.toLowerCase().includes(bus.startLocation.toLowerCase().trim());

    const toMatch =
      route.endLocation?.toLowerCase().includes(bus.endLocation.toLowerCase().trim());

      console.log("Checking Bus:", busId, bus.startLocation, "→ Route:", route.busId, route.startLocation);

    return (
      route.busId?.toString() === busId ||
      route.bus?.toString() === busId ||
      (fromMatch && toMatch)
    );
  });
});

  
        console.log("Filtered Buses After:", filtered);
      }

      setFilteredBuses(filtered);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search buses. Please try again.");
      setFilteredBuses(Array.isArray(allBuses) ? allBuses : []);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    window.location.href = "/";
  };

  const handleBookNow = async (busId) => {
    if (!busId) return;
    try {
      setLoading(true);
      const busResponse = await getBusById(busId);
      const busData = busResponse.data || {};
      
      // Find related schedule
      const relatedSchedule = (Array.isArray(schedules) ? schedules : []).find(schedule => 
        schedule &&
        (schedule.busId === busId || 
         schedule.bus === busId ||
         schedule.busNumber === busData.busNumber)
      );
      
      setCurrentStep(2);
      navigate('/seat', { 
        state: { 
          busData,
          schedule: relatedSchedule,
          route: (Array.isArray(routes) ? routes : []).find(route => 
            route &&
            (route.busId === busId || 
             route.bus === busId ||
             (route.startLocation === busData.startLocation && route.endLocation === busData.endLocation))
          )
        } 
      });
    } catch (err) {
      console.error("Error fetching bus details:", err);
      setError("Failed to load bus details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get enhanced bus info with schedule and route data
  const getEnhancedBusInfo = (bus) => {
    if (!bus) {
      console.warn("No bus data provided to getEnhancedBusInfo");
      return {};
    }
    const busId = bus.id || bus._id;
    
    // Find related schedule
    const relatedSchedule = (Array.isArray(schedules) ? schedules : []).find(schedule => 
      schedule &&
      (schedule.busId === busId || 
       schedule.bus === busId ||
       schedule.busNumber === bus.busNumber ||
       (schedule.startLocation === bus.startLocation && schedule.endLocation === bus.endLocation))
    );
    
    // Find related route
    const relatedRoute = (Array.isArray(routes) ? routes : []).find(route => 
      route &&
      (route.busId === busId || 
       route.bus === busId ||
       (route.origin === bus.startLocation && route.destination === bus.endLocation) ||
       (route.startLocation === bus.startLocation && route.endLocation === bus.endLocation))
    );
    
    return {
      ...bus,
      schedule: relatedSchedule,
      route: relatedRoute,
      startLocation: bus.startLocation || "N/A",
      endLocation: bus.endLocation || "N/A",
      departureTime: bus.departureTime || bus.departure || relatedSchedule?.departureTime || relatedSchedule?.startTime || "N/A",
      arrivalTime: bus.arrivalTime || bus.arrival || relatedSchedule?.arrivalTime || relatedSchedule?.endTime || "N/A",
      duration: bus.duration || relatedRoute?.duration || relatedSchedule?.duration || "N/A",
      distance: bus.distance || relatedRoute?.distance || "N/A",
      price: bus.price || bus.fare || relatedSchedule?.price || relatedSchedule?.fare || relatedRoute?.price || "N/A",
      availableSeats: bus.availableSeats || 
                      relatedSchedule?.availableSeats || 
                      (Array.isArray(bus.seats) ? bus.seats.filter(s => s?.isAvailable).length : "N/A")
    };
  };

  const steps = [
    { step: 1, label: "Select Bus", icon: Bus, active: currentStep === 1 },
    { step: 2, label: "Select Seat", icon: Users, active: currentStep === 2 },
    { step: 3, label: "Payment", icon: Clock, active: currentStep === 3 }
  ];

  const getAmenityIcon = (amenity) => {
    const icons = {
      "WiFi": <Wifi className="w-3 h-3" />,
      "AC": <Zap className="w-3 h-3" />,
      "Food": <Utensils className="w-3 h-3" />,
      "Reading Light": <Book className="w-3 h-3" />
    };
    return icons[amenity] || <Star className="w-3 h-3" />;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/85 via-purple-800/75 to-blue-800/85 backdrop-blur-sm" />
      </div>

      {/* Header with Sign Out */}
      <header className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">BusEase</h1>
        </div>
        
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 text-white hover:bg-white/30 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </header>

      {/* Step Navigation */}
      <div className="relative z-10 flex justify-center mb-8">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-2 flex items-center space-x-8">
          {steps.map(({ step, label, icon: Icon, active }) => (
            <div key={step} className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                active ? 'bg-white text-purple-600' : 'bg-white/20 text-white/70'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-sm font-medium ${
                active ? 'text-white' : 'text-white/70'
              }`}>{label}</span>
              {step < steps.length && (
                <div className="w-8 h-px bg-white/30 ml-4"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pb-8">
        {/* Search Panel */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Search Your Perfect Journey</h2>
          
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium block">From</label>
              <div className="relative">
                <select
                  value={searchData.startLocation}
                  onChange={(e) => setSearchData({ ...searchData, startLocation: e.target.value })}
                  className="w-full px-4 py-3 pr-12 bg-white/90 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer text-gray-700"
                >
                  <option value="">Select Origin</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <MapPin className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* To */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium block">To</label>
              <div className="relative">
                <select
                  value={searchData.endLocation}
                  onChange={(e) => setSearchData({ ...searchData, endLocation: e.target.value })}
                  className="w-full px-4 py-3 pr-12 bg-white/90 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer text-gray-700"
                >
                  <option value="">Select Destination</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <MapPin className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="space-y-2">
              <label className="text-transparent text-sm font-medium block">Search</label>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Search Buses"}
              </button>
            </div>
          </form>
        </div>

        {/* Data Status */}
        {!loading && (
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2 text-white/70 text-sm">
              Data: {allBuses.length} buses, {schedules.length} schedules, {routes.length} routes
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-white p-4 rounded-xl mb-6">
            {error}
            <button 
              onClick={fetchAllData}
              className="ml-4 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Available Buses</h3>
          <span className="text-white/70 text-sm">
            {loading ? "Loading..." : `${filteredBuses.length} buses found`}
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-white mt-4">Loading buses...</p>
          </div>
        )}

        {/* No Results */}
        {!loading && filteredBuses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/70 text-lg">No buses found matching your criteria.</p>
            {(searchData.startLocation || searchData.endLocation) && (
              <button
                onClick={() => {
                  setSearchData({ startLocation: "", endLocation: "" });
                  setFilteredBuses(Array.isArray(allBuses) ? allBuses : []);
                }}
                className="mt-4 text-blue-400 hover:text-blue-300 underline"
              >
                Clear filters to see all buses
              </button>
            )}
          </div>
        )}

        {/* Search Results */}
        <div className="space-y-4">
          {Array.isArray(filteredBuses) && filteredBuses.map((busData) => {
            if (!busData) {
              console.warn("Null or undefined busData in filteredBuses:", busData);
              return null;
            }
            const bus = getEnhancedBusInfo(busData);
            const busId = bus.id ?? bus._id;
            if (!busId) {
              console.warn("No valid busId for busData:", busData);
              return null;
            }
            
            return (
              <div
                key={busId}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Bus Info */}
                  <div className="lg:col-span-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{bus.name || bus.busName || "Bus Service"}</h3>
                      <span className="text-white/60 text-sm">Distance: {bus.distance || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-8 mb-4">
                      <div>
                        <p className="text-white/60 text-sm mb-1">From</p>
                        <p className="text-white font-semibold">{bus.startLocation}</p>
                        <p className="text-white/80 text-sm">{bus.departureTime}</p>
                        {bus.route && (
                          <p className="text-white/60 text-xs">Route: {bus.route.name || bus.route.routeName || "Standard"}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-white/60 text-sm mb-1">To</p>
                        <p className="text-white font-semibold">{bus.endLocation}</p>
                        <p className="text-white/80 text-sm">{bus.arrivalTime}</p>
                        {bus.schedule && (
                          <p className="text-white/60 text-xs">
                            Schedule: {bus.schedule.scheduleType || "Regular"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-4">
                        <div className="text-center">
                          <p className="text-white/60 text-sm">Duration</p>
                          <p className="text-white font-semibold">{bus.duration}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-white/60 text-sm">Type</p>
                          <p className="text-white font-semibold">{bus.busType || bus.type || "Standard"}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-white/60 text-sm">Available Seats</p>
                          <p className="text-white font-semibold">{bus.availableSeats}</p>
                        </div>
                      </div>
                      {/* Amenities */}
                      {Array.isArray(bus.amenities) && bus.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {bus.amenities.slice(0, 3).map((amenity, index) => (
                            <div key={index} className="bg-white/20 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                              {getAmenityIcon(amenity)}
                              <span>{amenity}</span>
                            </div>
                          ))}
                          {bus.amenities.length > 3 && <div className="bg-white/20 text-white px-2 py-1 rounded text-xs">+{bus.amenities.length - 3} more</div>}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Price & Book Button */}
                  <div className="lg:col-span-4 text-right">
                    <div className="text-right mb-4">
                      <div className="text-3xl font-bold text-white mb-1">₹{bus.price}</div>
                      <div className="text-white/60 text-sm">{bus.priceText || "per person"}</div>
                      {bus.schedule?.discount && (
                        <div className="text-green-400 text-sm">
                          {bus.schedule.discount}% OFF
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleBookNow(busId)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}