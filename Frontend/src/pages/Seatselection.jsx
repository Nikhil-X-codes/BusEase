import { useState } from "react";
import { ArrowLeft, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SeatSelection() {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const navigate=useNavigate()
  
  const generateSeats = () => {
    const seats = [];
    const bookedSeats = ["A2", "A5", "A8", "1B", "3A", "5C", "7D", "9A"];
    // Sleeper seats A1-A10 (single row layout)
    for (let i = 1; i <= 10; i++) {
      const seatLabel = `A${i}`;
      const isBooked = bookedSeats.includes(seatLabel);
      const isSelected = selectedSeats.some(s => s.id === seatLabel);
      
      seats.push({
        id: seatLabel,
        label: seatLabel,
        status: isSelected ? "selected" : isBooked ? "booked" : "available",
        row: 0, // Special row for sleepers
        position: "left",
        type: "sleeper"
      });
    }
    
    // Seater seats (2+2 configuration)
    const rows = 12;
    for (let row = 1; row <= rows; row++) {
      const leftSeats = [`${row}A`, `${row}B`];
      const rightSeats = [`${row}C`, `${row}D`];
      
      [...leftSeats, ...rightSeats].forEach((seatLabel, index) => {
        const seatId = seatLabel;
        const isBooked = bookedSeats.includes(seatLabel);
        const isSelected = selectedSeats.some(s => s.id === seatId);
        
        seats.push({
          id: seatId,
          label: seatLabel,
          status: isSelected ? "selected" : isBooked ? "booked" : "available",
          row,
          position: index < 2 ? "left" : "right",
          type: "seater"
        });
      });
    }
    
    return seats;
  };

  const seats = generateSeats();

  const handleSeatClick = (seat) => {
    if (seat.status === "booked") return;
    
    if (seat.status === "selected") {
      // Deselect seat
      setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
    } else {
      // Select seat (no limit)
      setSelectedSeats(prev => [...prev, {
        id: seat.id,
        label: seat.label,
        passengerName: "",
        gender: "male",
        type: seat.type
      }]);
    }
  };

  const handleDeleteSeat = (seatId) => {
    setSelectedSeats(prev => prev.filter(s => s.id !== seatId));
  };

  const updatePassengerInfo = (seatId, field, value) => {
    setSelectedSeats(prev => prev.map(seat => 
      seat.id === seatId 
        ? { ...seat, [field]: value }
        : seat
    ));
  };

  const handleConfirmDetails = () => {
    // Validate all passengers have names
    const hasEmptyNames = selectedSeats.some(seat => !seat.passengerName.trim());
    
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }
    
    if (hasEmptyNames) {
      alert("Please enter names for all selected passengers.");
      return;
    }

    // Navigate to payment page or handle confirmation
    console.log("Confirmed passengers:", selectedSeats);
  };

  const getSeatColor = (status, type) => {
    const baseStyles = type === "sleeper" ? "h-16 w-8" : "h-8 w-8";
    switch (status) {
      case "available": return `${baseStyles} bg-green-500 hover:bg-green-400 hover:scale-110`;
      case "booked": return `${baseStyles} bg-red-500 cursor-not-allowed`;
      case "selected": return `${baseStyles} bg-yellow-500 hover:bg-yellow-400`;
      default: return `${baseStyles} bg-gray-500`;
    }
  };

  const renderSeaterRow = (rowSeats) => {
    const leftSeats = rowSeats.filter(s => s.position === "left");
    const rightSeats = rowSeats.filter(s => s.position === "right");
    
    return (
      <div key={rowSeats[0].row} className="flex items-center justify-center gap-8 mb-2">
        {/* Left side seats */}
        <div className="flex gap-1">
          {leftSeats.map(seat => (
            <button
              key={seat.id}
              onClick={() => handleSeatClick(seat)}
              className={`rounded text-white text-xs font-medium transition-all duration-200 ${getSeatColor(seat.status, seat.type)}`}
              disabled={seat.status === "booked"}
            >
              {seat.label}
            </button>
          ))}
        </div>
        
        {/* Aisle gap */}
        <div className="w-6"></div>
        
        {/* Right side seats */}
        <div className="flex gap-1">
          {rightSeats.map(seat => (
            <button
              key={seat.id}
              onClick={() => handleSeatClick(seat)}
              className={`rounded text-white text-xs font-medium transition-all duration-200 ${getSeatColor(seat.status, seat.type)}`}
              disabled={seat.status === "booked"}
            >
              {seat.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Group seater seats by row
  const seaterSeatsByRow = seats.filter(s => s.type === "seater").reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const sleeperSeats = seats.filter(s => s.type === "sleeper");

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

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <button 
          onClick={() => navigate('/home')}
          className="flex items-center space-x-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 text-white hover:bg-white/30 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Search</span>
        </button>
        
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-white">BusEase</h1>
        </div>

        <div className="bg-blue-500/20 text-blue-100 px-4 py-2 rounded-full">
          <span className="text-sm font-medium">Select Seats</span>
        </div>
      </header>

      {/* Step Navigation */}
      <div className="relative z-10 flex justify-center mb-8">
        <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full p-2 flex space-x-2">
          <div className="flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 text-white/80">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Select Bus</span>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 bg-white text-purple-600 shadow-lg">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Select Seat</span>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 text-white/80">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Payment</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Seat Map */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Select Your Seats</h2>
            
            {/* Legend */}
            <div className="flex justify-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-white text-sm">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-white text-sm">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-white text-sm">Selected</span>
              </div>
            </div>

            {/* Driver Section */}
            <div className="mb-6">
              <div className="bg-gray-600 text-white text-center py-2 rounded-t-xl text-sm font-medium">
                Driver
              </div>
            </div>

            {/* Sleeper Seats */}
            <div className="mb-6">
              <h3 className="text-white font-medium mb-3 text-center">Sleeper Seats (A1-A10)</h3>
              <div className="bg-white/10 p-4 rounded-xl">
                <div className="flex justify-center gap-2 flex-wrap">
                  {sleeperSeats.map(seat => (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      className={`rounded text-white text-xs font-medium transition-all duration-200 flex items-center justify-center ${getSeatColor(seat.status, seat.type)}`}
                      disabled={seat.status === "booked"}
                      title={`Sleeper ${seat.label}`}
                    >
                      {seat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Seater Seats */}
            <div>
              <h3 className="text-white font-medium mb-3 text-center">Seater Seats</h3>
              <div className="bg-white/10 p-6 rounded-xl">
                {Object.keys(seaterSeatsByRow).map(rowNum => 
                  renderSeaterRow(seaterSeatsByRow[parseInt(rowNum)])
                )}
              </div>
            </div>

            {/* Selected Count */}
            <div className="mt-4 text-center">
              <span className="text-white/70 text-sm">
                {selectedSeats.length} seats selected
              </span>
            </div>
          </div>

          {/* Right Column - Passenger Details */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Passenger Details</h2>
            
            {selectedSeats.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <p className="text-white/60">Please select seats to enter passenger details</p>
              </div>
            ) : (
              <div className="space-y-6">
                {selectedSeats.map((seat) => (
                  <div key={seat.id} className="bg-white/10 p-6 rounded-xl border border-white/20 relative">
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteSeat(seat.id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                      title="Remove seat"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="mb-4 flex items-center justify-between pr-10">
                      <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium">
                        Seat No: {seat.label}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        seat.type === "sleeper" 
                          ? "bg-purple-500/30 text-purple-100" 
                          : "bg-blue-500/30 text-blue-100"
                      }`}>
                        {seat.type === "sleeper" ? "Sleeper" : "Seater"}
                      </span>
                    </div>
                    
                    {/* Passenger Name */}
                    <div className="mb-4">
                      <label className="text-white text-sm font-medium mb-2 block">
                        Passenger Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Name"
                        value={seat.passengerName}
                        onChange={(e) => updatePassengerInfo(seat.id, "passengerName", e.target.value)}
                        className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Gender Selection */}
                    <div>
                      <label className="text-white text-sm font-medium mb-3 block">
                        Gender
                      </label>
                      <div className="flex bg-white/20 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => updatePassengerInfo(seat.id, "gender", "male")}
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                            seat.gender === "male"
                              ? "bg-white text-purple-600 shadow-sm"
                              : "text-white/80 hover:text-white"
                          }`}
                        >
                          Male
                        </button>
                        <button
                          type="button"
                          onClick={() => updatePassengerInfo(seat.id, "gender", "female")}
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                            seat.gender === "female"
                              ? "bg-white text-purple-600 shadow-sm"
                              : "text-white/80 hover:text-white"
                          }`}
                        >
                          Female
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Confirm Details Button */}
             
              <button
  onClick={() => {
    handleConfirmDetails();
    navigate('/payment');
  }}
  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95 flex items-center justify-center space-x-2"
>
                  <Users className="w-5 h-5" />
                  <span>Confirm Details ({selectedSeats.length} passengers)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}