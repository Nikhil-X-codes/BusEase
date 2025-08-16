import { useState } from "react";
import { Calendar, MapPin, LogOut, Users, Clock, Star, Wifi, Zap, Utensils, Book, Car } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate=useNavigate()
  const [searchData, setSearchData] = useState({
    from: "",
    to: "",
    date: "",
  });

  const cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad"];
  
  const busResults = [
    {
      id: 1,
      name: "Volvo AC Sleeper",
      distance: "1,424 km",
      from: "Mumbai",
      to: "Delhi",
      departureTime: "22:00",
      arrivalTime: "14:00",
      duration: "16h",
      direct: "Direct",
      price: "₹2,400",
      amenities: ["AC", "WiFi", "Charging", "Blanket"]
    },
    {
      id: 2,
      name: "Mercedes Luxury Coach",
      distance: "1,424 km",
      from: "Mumbai", 
      to: "Delhi",
      departureTime: "20:30",
      arrivalTime: "12:30",
      duration: "16h",
      direct: "Direct",
      price: "₹3,200",
      amenities: ["AC", "WiFi", "Meals", "Entertainment"]
    },
    {
      id: 3,
      name: "Scania Multi-Axle",
      distance: "1,424 km",
      from: "Mumbai",
      to: "Delhi", 
      departureTime: "21:15",
      arrivalTime: "13:15",
      duration: "16h",
      direct: "Direct",
      price: "₹2,800",
      amenities: ["AC", "WiFi", "Charging", "Reading Light"]
    }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Search data:", searchData);
  };

  const handleSignOut = () => {
    window.location.href = "/";
  };

  const handleBookNow = (busId) => {
    console.log("Booking bus:", busId);
    setCurrentStep(2);
  };

  const steps = [
    { step: 1, label: "Select Bus", icon: Car, active: true },
    { step: 2, label: "Select Seat", icon: Users, active: false },
    { step: 3, label: "Payment", icon: Clock, active: false }
  ];

  const getAmenityIcon = (amenity) => {
    const icons = {
      "AC": <Car className="w-3 h-3" />,
      "WiFi": <Wifi className="w-3 h-3" />,
      "Charging": <Zap className="w-3 h-3" />,
      "Blanket": <Book className="w-3 h-3" />,
      "Meals": <Utensils className="w-3 h-3" />,
      "Entertainment": <Star className="w-3 h-3" />,
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
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* From */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium block">From</label>
              <div className="relative">
                <select
                  value={searchData.from}
                  onChange={(e) => setSearchData({ ...searchData, from: e.target.value })}
                  className="w-full px-4 py-3 pr-12 bg-white/90 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer text-gray-700"
                >
                  <option value="">Select</option>
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
                  value={searchData.to}
                  onChange={(e) => setSearchData({ ...searchData, to: e.target.value })}
                  className="w-full px-4 py-3 pr-12 bg-white/90 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer text-gray-700"
                >
                  <option value="">Select</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <MapPin className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium block">Departure Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={searchData.date}
                  onChange={(e) =>
                    setSearchData({ ...searchData, date: e.target.value })
                  }
                  placeholder="dd-mm-yyyy"
                  className="w-full px-4 py-3 pr-12 bg-white/90 border border-white/30 rounded-xl 
                            focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700
                            [appearance:textfield] [&::-webkit-calendar-picker-indicator]:hidden"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="space-y-2">
              <label className="text-transparent text-sm font-medium block">Search</label>
              <button
                onClick={handleSearch}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95"
              >
                Search Buses
              </button>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Available Buses</h3>
          <span className="text-white/70 text-sm">{busResults.length} buses found</span>
        </div>

        {/* Search Results */}
        <div className="space-y-4">
          {busResults.map((bus) => (
            <div
              key={bus.id}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Bus Info */}
                <div className="lg:col-span-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{bus.name}</h3>
                    <span className="text-white/60 text-sm">Distance: {bus.distance}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 mb-4">
                    <div>
                      <p className="text-white/60 text-sm mb-1">From</p>
                      <p className="text-white font-semibold">{bus.from}</p>
                      <p className="text-white/80 text-sm">{bus.departureTime}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">To</p>
                      <p className="text-white font-semibold">{bus.to}</p>
                      <p className="text-white/80 text-sm">{bus.arrivalTime}</p>
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
                        <p className="text-white font-semibold">{bus.direct}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {bus.amenities.map((amenity) => (
                        <div
                          key={amenity}
                          className="bg-white/20 text-white px-2 py-1 rounded text-xs flex items-center space-x-1"
                        >
                          {getAmenityIcon(amenity)}
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Price & Book Button */}
                <div className="lg:col-span-4 text-right">
                  <div className="text-right mb-4">
                    <div className="text-3xl font-bold text-white mb-1">{bus.price}</div>
                    <div className="text-white/60 text-sm">{bus.priceText}</div>
                  </div>
                  <button 
                    onClick={() => {
                      handleBookNow(bus.id);
                      navigate(`/seat`);
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}