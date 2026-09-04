import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Users, X, Bus, Armchair, Coins, AlertTriangle } from "lucide-react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { getBusById } from "../services/book.service";

export default function SeatSelection() {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState(null);
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const busId = params?.busId;
  const routeId = searchParams.get("routeId");
  const location = useLocation();

  const selectedDate = useMemo(() => {
    const rawDate = searchParams.get("date") || location.state?.selectedDate;
    if (rawDate) {
      try {
        const parsed = new Date(rawDate);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      } catch {}
    }
    return new Date().toISOString();
  }, [searchParams, location.state]);

  // Load Bus details and seat availability
  const fetchBus = async () => {
    try {
      if (!busId) return;
      const busResp = await getBusById(busId);
      const busData = busResp?.data?.data;
      if (busData) {
        setBus(busData);
      }
    } catch (err) {
      console.error("[SEAT_SELECTION] Error fetching bus details:", err?.message || err);
      setErrorNotice("Failed to load bus seat details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBus();
  }, [busId]);

  // Compute display seats
  const seats = useMemo(() => {
    if (!bus || !Array.isArray(bus.Seats)) return [];
    return bus.Seats.map((s) => {
      const label = String(s.SeatNumber);
      const isSelected = selectedSeats.some(
        (x) => String(x.id).trim().toUpperCase() === label.trim().toUpperCase()
      );

      let status = "available";
      if (isSelected) {
        status = "selected";
      } else if (s.isAvailable === false) {
        status = "booked";
      } else {
        status = "available";
      }

      const isSleeper = s.Type === "Sleeper";
      let row = 0;
      let position = "left";
      if (!isSleeper) {
        const match = label.match(/(\d+)([A-Z])/);
        if (match) {
          row = parseInt(match[1], 10);
          const col = match[2];
          position = col === "A" || col === "B" ? "left" : "right";
        }
      }
      return {
        id: label,
        label,
        status,
        row,
        position,
        type: isSleeper ? "sleeper" : "seater",
      };
    });
  }, [bus, selectedSeats]);

  const handleSeatClick = (seat) => {
    if (seat.status === "booked") {
      setErrorNotice(`Seat ${seat.label} is already booked on this bus.`);
      setTimeout(() => setErrorNotice(null), 3000);
      return;
    }

    if (seat.status === "selected") {
      setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id));
    } else {
      setErrorNotice(null);
      setSelectedSeats((prev) => [
        ...prev,
        { id: seat.id, label: seat.label, passengerName: "", gender: "male", type: seat.type },
      ]);
    }
  };

  const handleDeleteSeat = (seatId) => {
    setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));
  };

  const updatePassengerInfo = (seatId, field, value) => {
    setSelectedSeats((prev) =>
      prev.map((seat) => (seat.id === seatId ? { ...seat, [field]: value } : seat))
    );
  };

  const handleConfirmDetails = () => {
    const hasEmptyNames = selectedSeats.some((seat) => !seat.passengerName.trim());
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }
    if (hasEmptyNames) {
      alert("Please enter names for all selected passengers.");
      return;
    }

    const payload = {
      bus,
      routeId,
      selectedSeats,
      selectedDate,
    };
    navigate("/payment", { state: payload });
  };

  const getSeatColor = (status, type) => {
    const baseStyles = type === "sleeper" ? "h-10 w-20" : "h-11 w-11";
    switch (status) {
      case "available":
        return `${baseStyles} bg-emerald-600 hover:bg-emerald-500 hover:scale-105 active:scale-95 border border-emerald-400/50 cursor-pointer shadow-md text-white font-bold`;
      case "booked":
        return `${baseStyles} bg-rose-950/70 text-white/40 cursor-not-allowed border border-rose-900/50`;
      case "selected":
        return `${baseStyles} bg-yellow-400 text-slate-950 font-extrabold hover:bg-yellow-300 border-2 border-yellow-100 shadow-lg scale-105`;
      default:
        return `${baseStyles} bg-gray-600/50 border border-gray-400/50`;
    }
  };

  const seaterSeatsByRow = seats
    .filter((s) => s.type === "seater")
    .reduce((acc, seat) => {
      if (!acc[seat.row]) acc[seat.row] = [];
      acc[seat.row].push(seat);
      return acc;
    }, {});

  const sleeperSeats = seats.filter((s) => s.type === "sleeper");

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 md:p-8 relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between mb-8">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center space-x-2 bg-white/20 backdrop-blur-lg border border-white/30 rounded-full px-5 py-2 text-white hover:bg-white/30 transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">Back to Search</span>
        </button>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">BusEase</h1>
        <div className="bg-indigo-600 text-white px-5 py-2 rounded-full shadow-md">
          <span className="text-sm font-semibold">Select Seats</span>
        </div>
      </header>

      {/* Notification banner for concurrency / booked seats */}
      {errorNotice && (
        <div className="relative z-20 max-w-4xl mx-auto mb-6 bg-rose-600/90 backdrop-blur border border-rose-400 text-white px-5 py-3 rounded-xl shadow-lg flex items-center justify-between animate-bounce">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-300 flex-shrink-0" />
            <span className="text-sm font-semibold">{errorNotice}</span>
          </div>
          <button onClick={() => setErrorNotice(null)} className="text-white hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="relative z-10 flex justify-center mb-10">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-full p-3 flex space-x-4">
          <div className="flex items-center space-x-3 px-5 py-2 rounded-full text-white/70 hover:bg-white/10 transition-all duration-300">
            <Bus className="w-5 h-5" />
            <span className="text-sm font-semibold">Select Bus</span>
          </div>
          <div className="flex items-center space-x-3 px-5 py-2 rounded-full bg-indigo-600 text-white shadow-md transition-all duration-300">
            <Armchair className="w-5 h-5" />
            <span className="text-sm font-semibold">Select Seat</span>
          </div>
          <div className="flex items-center space-x-3 px-5 py-2 rounded-full text-white/70 hover:bg-white/10 transition-all duration-300">
            <Coins className="w-5 h-5" />
            <span className="text-sm font-semibold">Payment</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Seat Selection Section */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white">Select Your Seats</h2>
            </div>

            {/* Seat Status Legend */}
            <div className="flex justify-center flex-wrap gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-600 rounded"></div>
                <span className="text-white text-xs font-medium">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span className="text-white text-xs font-medium">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-rose-950/70 border border-rose-900/50 rounded"></div>
                <span className="text-white text-xs font-medium">Booked</span>
              </div>
            </div>

            {/* Driver Indicator */}
            <div className="mb-6">
              <div className="bg-gray-700/80 text-white text-center py-2 rounded-lg text-xs font-semibold tracking-wide border border-gray-600/40">
                Driver and Conductor Cabin
              </div>
            </div>

            {/* Sleeper Seats */}
            {sleeperSeats.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3 text-center text-sm">Sleeper Berths</h3>
                <div className="bg-white/10 p-4 rounded-lg">
                  <div className="flex justify-center gap-2 flex-wrap">
                    {sleeperSeats.map((seat) => (
                      <button
                        key={seat.id}
                        onClick={() => handleSeatClick(seat)}
                        disabled={seat.status === "booked"}
                        className={`rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center ${getSeatColor(
                          seat.status,
                          seat.type
                        )}`}
                        title={`Sleeper ${seat.label} - ${seat.status}`}
                      >
                        {seat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Seater Seats */}
            <div>
              <h3 className="text-white font-semibold mb-3 text-center text-sm">Seater Layout</h3>
              <div className="bg-white/10 p-6 rounded-lg">
                <div
                  className="grid gap-2 justify-center"
                  style={{
                    gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))",
                  }}
                >
                  {Object.keys(seaterSeatsByRow).map((rowNum) =>
                    seaterSeatsByRow[parseInt(rowNum, 10)].map((seat) => (
                      <button
                        key={seat.id}
                        onClick={() => handleSeatClick(seat)}
                        disabled={seat.status === "booked"}
                        className={`rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center ${getSeatColor(
                          seat.status,
                          seat.type
                        )}`}
                        title={`Seat ${seat.label} - ${seat.status}`}
                      >
                        {seat.label}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Selected Seats Count */}
            <div className="mt-4 text-center">
              <span className="text-white/80 text-sm font-medium">
                {selectedSeats.length} {selectedSeats.length === 1 ? "seat" : "seats"} selected
              </span>
            </div>
          </div>

          {/* Passenger Details Section */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Passenger Details</h2>

            {selectedSeats.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <p className="text-white/60 text-lg">Please select seats to enter passenger details</p>
                <p className="text-white/40 text-xs mt-2">Choose any available green seat to begin</p>
              </div>
            ) : (
              <div className="space-y-6">
                {selectedSeats.map((seat) => (
                  <div key={seat.id} className="bg-white/10 p-6 rounded-lg border border-white/20 relative">
                    <button
                      onClick={() => handleDeleteSeat(seat.id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-rose-600/80 hover:bg-rose-500 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                      title="Remove seat"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="mb-4 flex items-center justify-between pr-10">
                      <span className="bg-yellow-400 text-slate-950 px-3 py-1 rounded-full text-sm font-bold">
                        Seat: {seat.label}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          seat.type === "sleeper" ? "bg-indigo-500/30 text-indigo-200" : "bg-blue-500/30 text-blue-200"
                        }`}
                      >
                        {seat.type === "sleeper" ? "Sleeper" : "Seater"}
                      </span>
                    </div>

                    <div className="mb-4">
                      <label className="text-white text-sm font-medium mb-2 block">Passenger Name *</label>
                      <input
                        type="text"
                        placeholder="Enter passenger name"
                        value={seat.passengerName}
                        onChange={(e) => updatePassengerInfo(seat.id, "passengerName", e.target.value)}
                        className="w-full px-4 py-3 bg-white/90 text-slate-900 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-white text-sm font-medium mb-3 block">Gender</label>
                      <div className="flex bg-white/10 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => updatePassengerInfo(seat.id, "gender", "male")}
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                            seat.gender === "male" ? "bg-white text-indigo-600 shadow-sm" : "text-white/80 hover:text-white"
                          }`}
                        >
                          Male
                        </button>
                        <button
                          type="button"
                          onClick={() => updatePassengerInfo(seat.id, "gender", "female")}
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                            seat.gender === "female" ? "bg-white text-indigo-600 shadow-sm" : "text-white/80 hover:text-white"
                          }`}
                        >
                          Female
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleConfirmDetails}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Users className="w-5 h-5" />
                  <span>Confirm Details ({selectedSeats.length} {selectedSeats.length === 1 ? "passenger" : "passengers"})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}