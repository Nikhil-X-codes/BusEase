import React from 'react';

const Home = () => {
  const buses = [
    {
      id: 1,
      name: 'Volvo AC Sleeper',
      distance: '1,424 km',
      from: 'Mumbai',
      to: 'Delhi',
      departure: '22:00',
      arrival: '14:00',
      duration: '16h',
      price: '2,400',
      amenities: ['AC', 'WiFi', 'Charging', 'Blanket'],
    },
    {
      id: 2,
      name: 'Mercedes Luxury Coach',
      distance: '1,424 km',
      from: 'Mumbai',
      to: 'Delhi',
      departure: '20:50',
      arrival: '12:50',
      duration: '16h',
      price: '3,200',
      amenities: ['AC', 'WiFi', 'Meals', 'Entertainment'],
    },
    {
      id: 3,
      name: 'Scania Multi Axle',
      distance: '1,424 km',
      from: 'Mumbai',
      to: 'Delhi',
      departure: '21:15',
      arrival: '13:15',
      duration: '16h',
      price: '2,800',
      amenities: ['AC', 'WiFi', 'Charging', 'Reading Light'],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 p-6 relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-30" />

      {/* Navigation Tabs */}
      <div className="flex justify-center space-x-4 mb-6 text-white">
        <button className="px-4 py-2 bg-purple-700 rounded-full">Bus</button>
        <button className="px-4 py-2 bg-gray-700 rounded-full">Select Seat</button>
        <button className="px-4 py-2 bg-gray-700 rounded-full">Payment</button>
      </div>

      {/* Search Bar */}
      <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-2xl p-6 mb-6 shadow-lg">
        <h2 className="text-2xl font-bold text-white text-center mb-4">Search Your Perfect Journey</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-white text-sm mb-2">From</label>
            <input
              type="text"
              placeholder="Select departure city"
              className="w-full px-4 py-2 bg-white bg-opacity-50 rounded-lg text-gray-800 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-white text-sm mb-2">To</label>
            <input
              type="text"
              placeholder="Select destination city"
              className="w-full px-4 py-2 bg-white bg-opacity-50 rounded-lg text-gray-800 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-white text-sm mb-2">Departure Date</label>
            <div className="relative">
              <input
                type="text"
                placeholder="dd-mm-yyyy"
                className="w-full px-4 py-2 bg-white bg-opacity-50 rounded-lg text-gray-800 focus:outline-none pr-10"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600">📅</span>
            </div>
          </div>
        </div>
        <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200">
          Search Buses
        </button>
      </div>

      {/* Bus Listings */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Available Buses <span className="text-gray-400">3 buses found</span></h3>
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
                  <p>From: {bus.from} <span className="text-gray-400">({bus.departure})</span></p>
                  <p>To: {bus.to} <span className="text-gray-400">({bus.arrival})</span></p>
                  <p>Duration: {bus.duration}</p>
                </div>
                <div className="flex space-x-2 mt-2">
                  {bus.amenities.map((amenity, index) => (
                    <span key={index} className="text-gray-400 text-xs bg-gray-700 px-2 py-1 rounded-full">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">₹{bus.price}</p>
                <p className="text-gray-400 text-sm">per person</p>
                <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200">
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Note */}
      <div className="bg-yellow-600 bg-opacity-20 border border-yellow-500 border-opacity-50 rounded-lg p-4 mt-6 text-white text-center">
        This is a preview of the bus booking interface. Click "Book Now" to see the booking flow simulation. In the full app, users would proceed to seat selection and payment.
      </div>
    </div>
  );
};

export default Home;