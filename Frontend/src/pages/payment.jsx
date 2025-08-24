import { useMemo, useState } from "react";
import { ArrowLeft, CreditCard, MapPin, Calendar, User, Users, Receipt,Bus, Armchair,Coins } from "lucide-react";
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
  const  {user} = useAuth();
  const selectedDate = navState.selectedDate;

  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  });
  const [error, setError] = useState(null);

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
    date: selectedDate ? new Date(selectedDate).toDateString() : (bus?.date ? new Date(bus.date).toDateString() : new Date().toDateString()),
    from: bus?.startLocation?.startLocation || "Unknown",
    to: bus?.endLocation?.endLocation || "Unknown",
    passengers,
  };
}, [bus, selectedSeats, user, selectedDate]);

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

  const handleInputChange = (field, value) => {
    let formattedValue = value;
    if (field === "cardNumber") {
      formattedValue = value.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
      if (formattedValue.length > 19) formattedValue = formattedValue.slice(0, 19);
    } else if (field === "expiryDate") {
      formattedValue = value.replace(/\D/g, "").replace(/(.{2})/, "$1/");
      if (formattedValue.length > 5) formattedValue = formattedValue.slice(0, 5);
    } else if (field === "cvv") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4);
    }
    setPaymentData((prev) => ({ ...prev, [field]: formattedValue }));
    setError(null);
  };

  const getCardBrand = (cardNumber) => {
    const number = cardNumber.replace(/\s/g, "");
    if (number.startsWith("4")) return "visa";
    if (number.startsWith("5") || number.startsWith("2")) return "mastercard";
    if (number.startsWith("3")) return "amex";
    return "default";
  };

  const handlePayment = async () => {
    if (!paymentData.cardNumber || !paymentData.cardName || !paymentData.expiryDate || !paymentData.cvv) {
      setError("Please fill in all payment details.");
      return;
    }
    try {
      const seatNumbers = selectedSeats.map((s) => s.label);
      const resp = await createPayment({
        busId: bus?._id,
        seatNumbers,
          selectedDate: selectedDate || bus?.date,
        cardDetails: {
          cardNumber: paymentData.cardNumber.replace(/\s/g, ""),
          cardHolderName: paymentData.cardName,
          expiryDate: paymentData.expiryDate,
          cvv: paymentData.cvv,
        },
      });
      const payment = resp?.data?.data || null;
      navigate("/success", { state: { bookingData, pricing, payment, bus, selectedSeats, routeId, selectedDate } });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Payment failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 md:p-8 relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between mb-8">
        <button
          onClick={() =>
            navigate("/buses/" + bus?._id + "/seats?routeId=" + routeId)
          }
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
            {/* Payment Form */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 md:p-8 shadow-xl">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 flex items-center">
                <CreditCard className="w-6 h-6 mr-2" />
                Enter Credit Card Details
              </h2>

              {/* Card Preview */}
              <div className="relative mb-8">
                <div
                  className={`w-full h-56 rounded-xl shadow-2xl transform transition-all duration-300 ${
                    getCardBrand(paymentData.cardNumber) === "visa"
                      ? "bg-gradient-to-br from-blue-600 to-blue-800"
                      : getCardBrand(paymentData.cardNumber) === "mastercard"
                      ? "bg-gradient-to-br from-red-500 to-orange-600"
                      : getCardBrand(paymentData.cardNumber) === "amex"
                      ? "bg-gradient-to-br from-green-600 to-teal-700"
                      : "bg-gradient-to-br from-gray-700 to-gray-900"
                  }`}
                >
                  <div className="p-6 h-full flex flex-col justify-between text-white">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-8 bg-yellow-400/80 rounded"></div>
                      <div className="text-right">
                        <div className="text-sm font-semibold uppercase tracking-wider">
                          {getCardBrand(paymentData.cardNumber).toUpperCase() ||
                            "CARD"}
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-mono tracking-wider">
                      {paymentData.cardNumber || "•••• •••• •••• ••••"}
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-xs opacity-60 uppercase tracking-wide">
                          Cardholder Name
                        </div>
                        <div className="font-medium uppercase truncate">
                          {paymentData.cardName || "YOUR NAME"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs opacity-60 uppercase tracking-wide">
                          Valid Thru
                        </div>
                        <div className="font-medium">
                          {paymentData.expiryDate || "MM/YY"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Input Form */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={paymentData.cardNumber}
                      onChange={(e) =>
                        handleInputChange("cardNumber", e.target.value)
                      }
                      className="w-full px-4 py-3 pr-12 bg-white/90 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                    />
                    <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">
                    Cardholder Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={paymentData.cardName}
                      onChange={(e) =>
                        handleInputChange("cardName", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                    />
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-white text-sm font-medium">
                      Expiry Date
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={paymentData.expiryDate}
                        onChange={(e) =>
                          handleInputChange("expiryDate", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-white text-sm font-medium">
                      CVV
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="123"
                        value={paymentData.cvv}
                        onChange={(e) =>
                          handleInputChange("cvv", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                      />
                      <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="text-red-300 text-center text-sm font-medium">
                    {error}
                  </p>
                )}

                <button
                  onClick={handlePayment}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 active:scale-95 flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Pay ₹{pricing.total.toLocaleString()}</span>
                </button>
              </div>
            </div>

            {/* Booking Summary */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 md:p-8 shadow-xl">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                Booking Summary
              </h2>

              <div className="space-y-6">
                <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg">
                  <User className="w-5 h-5 text-indigo-300" />
                  <div>
                    <div className="text-white/60 text-sm">Booked By</div>
                    <div className="text-white font-medium">
                      {bookingData.username}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-300" />
                  <div>
                    <div className="text-white/60 text-sm">Travel Date</div>
                    <div className="text-white font-medium">
                      {bookingData.date}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg">
                    <MapPin className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="text-white/60 text-sm">From</div>
                      <div className="text-white font-medium">
                        {bookingData.from}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg">
                    <MapPin className="w-5 h-5 text-red-400" />
                    <div>
                      <div className="text-white/60 text-sm">To</div>
                      <div className="text-white font-medium">
                        {bookingData.to}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Users className="w-5 h-5 text-indigo-300" />
                    <div className="text-white/60 text-sm">
                      Passengers & Seats
                    </div>
                  </div>
                  <div className="space-y-2">
                    {bookingData.passengers.map((passenger, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
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
                            className={`px-2 py-1 rounded-full text-xs ${
                              passenger.seatType === "sleeper"
                                ? "text-indigo-200 bg-indigo-500/20"
                                : "text-blue-200 bg-blue-500/20"
                            }`}
                          >
                            {passenger.seatType}
                          </span>
                          <span className="text-indigo-200 bg-indigo-500/20 px-2 py-1 rounded-full text-sm">
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
                    <div className="text-white/60 text-sm">Price Breakdown</div>
                  </div>
                  <div className="space-y-3">
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
                    <div className="border-t border-white/20 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold text-lg">
                          Total Amount
                        </span>
                        <span className="text-2xl font-bold text-indigo-400">
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