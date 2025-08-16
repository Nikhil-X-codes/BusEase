import { useState, useMemo } from "react";
import { ArrowLeft, CreditCard, MapPin, Calendar, User, Users, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Payment() {
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  });
  const navigate=useNavigate()

  // Sample booking data (would come from previous steps or props)
  const bookingData = {
    busName: "Unique Travels",
    username: "John Doe",
    date: "Dec 25, 2024",
    from: "Mumbai",
    to: "Delhi",
    departureTime: "22:00",
    arrivalTime: "14:00",
    passengers: [
      { name: "John Doe", seat: "A1", seatType: "sleeper" },
      { name: "Jane Doe", seat: "A2", seatType: "sleeper" },
      { name: "Bob Smith", seat: "1A", seatType: "seater" }
    ],
    basePricePerSeat: {
      sleeper: 1500, 
      seater: 800  
    },
    taxRates: {
      gst: 0.12,      // 12% GST
      serviceFee: 50, // Fixed service fee per ticket
      convenienceFee: 0.02 // 2% convenience fee
    }
  };

  // Calculate pricing with proper tax logic
  const pricing = useMemo(() => {
    const sleeperCount = bookingData.passengers.filter(p => p.seatType === "sleeper").length;
    const seaterCount = bookingData.passengers.filter(p => p.seatType === "seater").length;
    
    // Calculate base ticket prices
    const sleeperPrice = sleeperCount * bookingData.basePricePerSeat.sleeper;
    const seaterPrice = seaterCount * bookingData.basePricePerSeat.seater;
    const subtotal = sleeperPrice + seaterPrice;
    
    // Calculate taxes and fees
    const serviceFee = bookingData.passengers.length * bookingData.taxRates.serviceFee;
    const convenienceFee = Math.round(subtotal * bookingData.taxRates.convenienceFee);
    const gstAmount = Math.round((subtotal + serviceFee + convenienceFee) * bookingData.taxRates.gst);
    
    // Calculate total
    const total = subtotal + serviceFee + convenienceFee + gstAmount;
    
    return {
      sleeperPrice,
      seaterPrice,
      subtotal,
      serviceFee,
      convenienceFee,
      gstAmount,
      total,
      sleeperCount,
      seaterCount
    };
  }, [bookingData.passengers, bookingData.basePricePerSeat, bookingData.taxRates]);

  const handleInputChange = (field, value) => {
    let formattedValue = value;
    
    if (field === "cardNumber") {
      // Format card number with spaces every 4 digits
      formattedValue = value.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
      if (formattedValue.length > 19) formattedValue = formattedValue.slice(0, 19);
    } else if (field === "expiryDate") {
      // Format expiry date as MM/YY
      formattedValue = value.replace(/\D/g, "").replace(/(.{2})/, "$1/");
      if (formattedValue.length > 5) formattedValue = formattedValue.slice(0, 5);
    } else if (field === "cvv") {
      // Limit CVV to 3-4 digits
      formattedValue = value.replace(/\D/g, "").slice(0, 4);
    }
    
    setPaymentData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const getCardBrand = (cardNumber) => {
    const number = cardNumber.replace(/\s/g, "");
    if (number.startsWith("4")) return "visa";
    if (number.startsWith("5") || number.startsWith("2")) return "mastercard";
    if (number.startsWith("3")) return "amex";
    return "default";
  };

  const handlePayment = async () => {
    // Basic validation
    if (!paymentData.cardNumber || !paymentData.cardName || !paymentData.expiryDate || !paymentData.cvv) {
      alert("Please fill in all payment details.");
      return;
    }

    // Simulate payment processing
    console.log("Processing payment...", {
      paymentData,
      bookingData,
      pricing
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Navigate to success page or show success message
    alert(`Payment successful! Amount charged: ₹${pricing.total.toLocaleString()}`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/85 via-purple-800/75 to-blue-800/85 backdrop-blur-sm" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <button 
          onClick={() => {
            navigate('/home');
          }}
          className="flex items-center space-x-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 text-white hover:bg-white/30 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Home</span>
        </button>
        

        <div className="bg-green-500/20 text-green-100 px-4 py-2 rounded-full">
          <span className="text-sm font-medium">Secure Payment</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Payment Form */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-8">Enter Credit Card Details</h2>
            
            {/* Credit Card Mockup */}
            <div className="relative mb-8">
              <div className={`w-full h-56 rounded-2xl shadow-2xl transform rotate-0 transition-all duration-300 ${
                getCardBrand(paymentData.cardNumber) === "visa" ? "bg-gradient-to-br from-blue-600 to-blue-800" :
                getCardBrand(paymentData.cardNumber) === "mastercard" ? "bg-gradient-to-br from-red-500 to-orange-600" :
                getCardBrand(paymentData.cardNumber) === "amex" ? "bg-gradient-to-br from-green-600 to-teal-700" :
                "bg-gradient-to-br from-gray-700 to-gray-900"
              }`}>
                <div className="p-6 h-full flex flex-col justify-between text-white">
                  {/* Card Brand Logo */}
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-8 bg-yellow-400 rounded opacity-80"></div>
                    <div className="text-right">
                      <div className="text-sm font-medium uppercase tracking-wider">
                        {getCardBrand(paymentData.cardNumber) || "CARD"}
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Number */}
                  <div>
                    <div className="text-2xl font-mono tracking-wider mb-4">
                      {paymentData.cardNumber || "•••• •••• •••• ••••"}
                    </div>
                  </div>
                  
                  {/* Cardholder Name and Expiry */}
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-xs opacity-60 uppercase tracking-wide">Cardholder Name</div>
                      <div className="font-medium uppercase">
                        {paymentData.cardName || "YOUR NAME"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs opacity-60 uppercase tracking-wide">Valid Thru</div>
                      <div className="font-medium">
                        {paymentData.expiryDate || "MM/YY"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="space-y-6">
              {/* Card Number */}
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={paymentData.cardNumber}
                    onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white/90 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                  />
                  <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Cardholder Name */}
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={paymentData.cardName}
                  onChange={(e) => handleInputChange("cardName", e.target.value)}
                  className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Expiry Date and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={paymentData.expiryDate}
                    onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                    className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={paymentData.cvv}
                    onChange={(e) => handleInputChange("cvv", e.target.value)}
                    className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {/* Pay Button */}
<button
  onClick={async () => {
    await handlePayment();
    navigate('/success');
  }}
  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95 flex items-center justify-center space-x-2"
>
                <CreditCard className="w-5 h-5" />
                <span>Pay ₹{pricing.total.toLocaleString()}</span>
              </button>
            </div>
          </div>

          {/* Right Column - Booking Summary */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">{bookingData.busName}</h2>
              <p className="text-white/70">Booking Details</p>
            </div>

            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl">
                <User className="w-5 h-5 text-blue-300" />
                <div>
                  <div className="text-white/60 text-sm">Username</div>
                  <div className="text-white font-medium">{bookingData.username}</div>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-300" />
                <div>
                  <div className="text-white/60 text-sm">Travel Date</div>
                  <div className="text-white font-medium">{bookingData.date}</div>
                </div>
              </div>

              {/* Route */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl">
                  <MapPin className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-white/60 text-sm">From</div>
                    <div className="text-white font-medium">{bookingData.from}</div>
                    <div className="text-blue-200 text-sm">{bookingData.departureTime}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl">
                  <MapPin className="w-5 h-5 text-red-400" />
                  <div>
                    <div className="text-white/60 text-sm">To</div>
                    <div className="text-white font-medium">{bookingData.to}</div>
                    <div className="text-blue-200 text-sm">{bookingData.arrivalTime}</div>
                  </div>
                </div>
              </div>

              {/* Passengers */}
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="w-5 h-5 text-purple-300" />
                  <div className="text-white/60 text-sm">Passengers & Seats</div>
                </div>
                <div className="space-y-2">
                  {bookingData.passengers.map((passenger, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-white">{passenger.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          passenger.seatType === "sleeper" 
                            ? "text-purple-200 bg-purple-500/20" 
                            : "text-blue-200 bg-blue-500/20"
                        }`}>
                          {passenger.seatType}
                        </span>
                        <span className="text-blue-200 bg-blue-500/20 px-2 py-1 rounded-full text-sm">
                          {passenger.seat}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-2 mb-4">
                  <Receipt className="w-5 h-5 text-yellow-300" />
                  <div className="text-white/60 text-sm">Price Breakdown</div>
                </div>
                <div className="space-y-3">
                  {/* Sleeper Seats */}
                  {pricing.sleeperCount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/80">Sleeper Seats ({pricing.sleeperCount}x)</span>
                      <span className="text-white">₹{pricing.sleeperPrice.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {/* Seater Seats */}
                  {pricing.seaterCount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/80">Seater Seats ({pricing.seaterCount}x)</span>
                      <span className="text-white">₹{pricing.seaterPrice.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {/* Service Fee */}
                  <div className="flex justify-between">
                    <span className="text-white/80">Service Fee</span>
                    <span className="text-white">₹{pricing.serviceFee.toLocaleString()}</span>
                  </div>
                  
                  {/* Convenience Fee */}
                  <div className="flex justify-between">
                    <span className="text-white/80">Convenience Fee (2%)</span>
                    <span className="text-white">₹{pricing.convenienceFee.toLocaleString()}</span>
                  </div>
                  
                  {/* GST */}
                  <div className="flex justify-between">
                    <span className="text-white/80">GST (12%)</span>
                    <span className="text-white">₹{pricing.gstAmount.toLocaleString()}</span>
                  </div>
                  
                  <div className="border-t border-white/20 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold text-lg">Total Amount</span>
                      <span className="text-2xl font-bold text-white bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        ₹{pricing.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}