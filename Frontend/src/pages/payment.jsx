import { useMemo, useState } from "react";
import { ArrowLeft, MapPin, Calendar, User, Users, Receipt, Bus, Armchair, Coins, Mail, AlertTriangle, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPayment } from "../services/payment.service";
import { useAuth } from "../context/Authcontext";

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state || {};
  const bus = navState.bus || null;
  const selectedSeats = Array.isArray(navState.selectedSeats) ? navState.selectedSeats : [];
  const routeId = navState.routeId || null;
  const { user } = useAuth();
  const selectedDate = navState.selectedDate;

  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bookingData = useMemo(() => {
    const username = user?.username || "Passenger";
    const passengers = selectedSeats.map((s) => ({
      name: s.passengerName || username,
      seat: s.label,
      seatType: s.type,
      gender: s.gender || "N/A",
    }));
    return {
      busName: bus?.busNumber || "Unknown Bus",
      username,
      email: contactEmail || user?.email || "Passenger",
      date: selectedDate ? new Date(selectedDate).toDateString() : (bus?.date ? new Date(bus.date).toDateString() : new Date().toDateString()),
      from: bus?.startLocation?.startLocation || "Unknown",
      to: bus?.endLocation?.endLocation || "Unknown",
      passengers,
    };
  }, [bus, selectedSeats, user, selectedDate, contactEmail]);

  const pricing = useMemo(() => {
    const seatPriceByNumber = new Map();
    if (bus?.Seats && Array.isArray(bus.Seats)) {
      bus.Seats.forEach((s) => {
        seatPriceByNumber.set(s.SeatNumber, Number(s.price) || 0);
      });
    }
    const subtotal = selectedSeats.reduce((sum, s) => sum + (seatPriceByNumber.get(s.label) || 0), 0);
    const serviceFee = selectedSeats.length * 50;
    const convenienceFee = Math.round(subtotal * 0.02);
    const gstAmount = Math.round((subtotal + serviceFee + convenienceFee) * 0.12);
    const total = subtotal + serviceFee + convenienceFee + gstAmount;
    const sleeperCount = selectedSeats.filter((s) => s.type === "sleeper").length;
    const seaterCount = selectedSeats.filter((s) => s.type === "seater").length;
    return { subtotal, serviceFee, convenienceFee, gstAmount, total, sleeperCount, seaterCount };
  }, [bus, selectedSeats]);

  const handlePayment = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const seatNumbers = selectedSeats.map((s) => s.label);
      const resp = await createPayment({
        busId: bus?._id,
        seatNumbers,
        selectedDate: selectedDate || bus?.date,
        email: contactEmail || user?.email,
      });
      const payment = resp?.data?.data || null;
      navigate("/success", {
        state: {
          bookingData: { ...bookingData, email: contactEmail || user?.email },
          pricing,
          payment,
          bus,
          selectedSeats,
          routeId,
          selectedDate,
        },
      });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Payment failed";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const returnToSeatSelection = () => {
    const dateParam = selectedDate ? `&date=${encodeURIComponent(selectedDate)}` : "";
    navigate(`/buses/${bus?._id}/seats?routeId=${routeId || ""}${dateParam}`, {
      state: { selectedDate },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 md:p-8 relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between mb-8">
        <button
          onClick={returnToSeatSelection}
          className="flex items-center space-x-2 bg-white/20 backdrop-blur-lg border border-white/30 rounded-full px-5 py-2 text-white hover:bg-white/30 transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">Back to Seat Selection</span>
        </button>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          BusEase
        </h1>
        <div className="bg-indigo-600 text-white px-5 py-2 rounded-full shadow-md">
          <span className="text-sm font-semibold">Secure Payment</span>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="relative z-10 flex justify-center mb-10">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-full p-3 flex space-x-4">
          <div className="flex items-center space-x-3 px-5 py-2 rounded-full text-white/70 hover:bg-white/10 transition-all duration-300">
            <Bus className="w-5 h-5" />
            <span className="text-sm font-semibold">Select Bus</span>
          </div>
          <div className="flex items-center space-x-3 px-5 py-2 rounded-full text-white/70 hover:bg-white/10 transition-all duration-300">
            <Armchair className="w-5 h-5" />
            <span className="text-sm font-semibold">Select Seat</span>
          </div>
          <div className="flex items-center space-x-3 px-5 py-2 rounded-full bg-indigo-600 text-white shadow-md transition-all duration-300">
            <Coins className="w-5 h-5" />
            <span className="text-sm font-semibold">Payment</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pb-8">
        {!bus || selectedSeats.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 md:p-8 shadow-xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              No Booking Data Available
            </h2>
            <p className="text-white/80 text-lg mb-6">
              Please select a bus and seats to proceed with payment.
            </p>
            <button
              onClick={() => navigate("/home")}
              className="inline-flex items-center space-x-2 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold shadow-md hover:shadow-xl transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Return to Home</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Simulation Confirmation */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 md:p-8 shadow-xl">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 flex items-center">
                <Coins className="w-6 h-6 mr-2 text-yellow-400" />
                Demonstration Payment
              </h2>
              <p className="text-white/80 text-sm mb-6">
                This is a simulation booking. E-tickets and official confirmation PDFs will be generated and dispatched automatically to your email.
              </p>

              {/* Recipient Email Input */}
              <div className="mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
                <label className="text-white text-sm font-medium mb-2 flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-indigo-300" />
                  <span>Send Ticket & Confirmation Email To:</span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-2.5 bg-white/90 text-slate-900 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
                />
                <p className="text-white/50 text-xs mt-1.5 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Your booking PDF and receipts will be sent to this email address.</span>
                </p>
              </div>

              <div className="space-y-6">
                {error && (
                  <div className="p-4 bg-rose-900/60 border border-rose-500/50 rounded-xl text-white">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-300 flex-shrink-0" />
                      <span className="font-semibold text-sm">Booking Issue</span>
                    </div>
                    <p className="text-xs text-rose-100 mb-3">{error}</p>
                    <button
                      onClick={returnToSeatSelection}
                      className="w-full py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold border border-white/30 transition"
                    >
                      Return to Seat Selection & Choose New Seats
                    </button>
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Coins className="w-5 h-5" />
                  <span>
                    {isSubmitting ? "Processing Confirmation..." : `Simulate Payment ₹${pricing.total.toLocaleString()}`}
                  </span>
                </button>
              </div>
            </div>

            {/* Booking Summary */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 md:p-8 shadow-xl">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                Booking Summary
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg">
                    <User className="w-5 h-5 text-indigo-300" />
                    <div>
                      <div className="text-white/60 text-xs">Passenger</div>
                      <div className="text-white font-medium text-sm">
                        {bookingData.username}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg">
                    <Mail className="w-5 h-5 text-indigo-300" />
                    <div>
                      <div className="text-white/60 text-xs">Recipient Email</div>
                      <div className="text-white font-medium text-sm truncate max-w-[140px]" title={bookingData.email}>
                        {bookingData.email}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-300" />
                  <div>
                    <div className="text-white/60 text-xs">Travel Date</div>
                    <div className="text-white font-medium">
                      {bookingData.date}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-white/60 text-xs">From</div>
                      <div className="text-white font-medium text-sm">
                        {bookingData.from}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg">
                    <MapPin className="w-5 h-5 text-rose-400" />
                    <div>
                      <div className="text-white/60 text-xs">To</div>
                      <div className="text-white font-medium text-sm">
                        {bookingData.to}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Users className="w-5 h-5 text-indigo-300" />
                    <div className="text-white/60 text-xs">
                      Passengers & Seats ({selectedSeats.length})
                    </div>
                  </div>
                  <div className="space-y-2">
                    {bookingData.passengers.map((passenger, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-white">
                          {passenger.name
                            ? passenger.name.charAt(0).toUpperCase() +
                              passenger.name.slice(1)
                            : ""}{" "}
                          (
                          {passenger.gender
                            ? passenger.gender.charAt(0).toUpperCase()
                            : ""}
                          )
                        </span>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              passenger.seatType === "sleeper"
                                ? "text-indigo-200 bg-indigo-500/20"
                                : "text-blue-200 bg-blue-500/20"
                            }`}
                          >
                            {passenger.seatType}
                          </span>
                          <span className="text-yellow-300 bg-yellow-500/20 px-2 py-0.5 rounded-full text-xs font-bold">
                            {passenger.seat}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-2 mb-4">
                    <Receipt className="w-5 h-5 text-yellow-300" />
                    <div className="text-white/60 text-xs">Price Breakdown</div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/80">Subtotal</span>
                      <span className="text-white">
                        ₹{pricing.subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">
                        Service Fee ({selectedSeats.length} tickets)
                      </span>
                      <span className="text-white">
                        ₹{pricing.serviceFee.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">
                        Convenience Fee (2%)
                      </span>
                      <span className="text-white">
                        ₹{pricing.convenienceFee.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">GST (12%)</span>
                      <span className="text-white">
                        ₹{pricing.gstAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-white/20 pt-3 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold text-base">
                          Total Amount
                        </span>
                        <span className="text-xl font-bold text-indigo-400">
                          ₹{pricing.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}