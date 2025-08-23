import { useEffect, useState } from "react";
import { CheckCircle, Download, Home, Calendar, MapPin, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function PaymentSuccess() {
  const [showSuccess, setShowSuccess] = useState(false);
  const location = useLocation();
  const { bus, routeId, selectedSeats, payment } = location.state || {};

  const bookingData = {
    busName: bus?.busNumber || "Unknown Bus",
    bookingId: `BG${Math.random().toString(36).substr(2, 8).toUpperCase()}`, 
    paymentId: payment?.paymentId || `PAY${Math.random().toString(36).substr(2, 10).toUpperCase()}`, 
    date: bus?.date ? new Date(bus.date).toDateString() : new Date().toDateString(),
    from: bus?.startLocation?.startLocation || "Unknown",
    to: bus?.endLocation?.endLocation || "Unknown",
    passengers: selectedSeats?.map((seat) => ({
      name: seat.passengerName || "Unknown",
      seat: seat.label || seat.id,
      gender: seat.gender || "N/A",
      type: seat.type || "Seater",
    })) || [],
    totalAmount: payment?.amount || 0, 
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowSuccess(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const generatePDF = () => {
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bus Ticket - ${bookingData.bookingId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { color: #4F46E5; font-size: 28px; font-weight: bold; }
          .ticket-id { color: #666; margin-top: 10px; font-size: 14px; }
          .section { margin: 20px 0; }
          .section-title { font-weight: bold; color: #4F46E5; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px; margin-bottom: 15px; font-size: 18px; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
          .info-item { padding: 12px; background: #F9FAFB; border-radius: 8px; }
          .info-label { font-weight: bold; color: #6B7280; font-size: 12px; text-transform: uppercase; }
          .info-value { color: #111827; margin-top: 5px; font-size: 14px; }
          .passenger-card { border: 1px solid #E5E7EB; border-radius: 8px; padding: 15px; margin: 10px 0; }
          .total { background: #4F46E5; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🚌 BusEase</div>
          <div class="ticket-id">Booking ID: ${bookingData.bookingId}</div>
          <div class="ticket-id">Payment ID: ${bookingData.paymentId}</div>
        </div>

        <div class="section">
          <div class="section-title">Journey Details</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Bus Operator</div>
              <div class="info-value">${bookingData.busName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Travel Date</div>
              <div class="info-value">${bookingData.date}</div>
            </div>

          </div>
        </div>

        <div class="section">
          <div class="section-title">Passenger Details</div>
          ${bookingData.passengers
            .map(
              (passenger) => `
            <div class="passenger-card">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Name</div>
                  <div class="info-value">${passenger.name}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Gender</div>
                  <div class="info-value">${passenger.gender}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Seat Number</div>
                  <div class="info-value">${passenger.seat}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Seat Type</div>
                  <div class="info-value">${passenger.type}</div>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="section">
          <div class="total">Total Amount Paid: ₹${bookingData.totalAmount.toLocaleString()}</div>
        </div>

        <div class="footer">
          <p>Thank you for choosing BusEase!</p>
          <p>Please carry a valid ID proof while traveling.</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([pdfContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BusTicket_${bookingData.bookingId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 md:p-8 relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between mb-8">
        <Link
          to="/home"
          className="flex items-center space-x-2 bg-white/20 backdrop-blur-lg border border-white/30 rounded-full px-5 py-2 text-white hover:bg-white/30 transition-all duration-300"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm font-semibold">Back to Home</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">BusEase</h1>
        <div className="bg-indigo-600 text-white px-5 py-2 rounded-full shadow-md">
          <span className="text-sm font-semibold">Payment Successful</span>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="relative z-10 flex justify-center mb-10">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-full p-3 flex space-x-4">
          <div className="flex items-center space-x-3 px-5 py-2 rounded-full text-white/70 hover:bg-white/10 transition-all duration-300">
            <Users className="w-5 h-5" />
            <span className="text-sm font-semibold">Select Bus</span>
          </div>
          <div className="flex items-center space-x-3 px-5 py-2 rounded-full text-white/70 hover:bg-white/10 transition-all duration-300">
            <Users className="w-5 h-5" />
            <span className="text-sm font-semibold">Select Seat</span>
          </div>
          <div className="flex items-center space-x-3 px-5 py-2 rounded-full bg-indigo-600 text-white shadow-md transition-all duration-300">
            <Users className="w-5 h-5" />
            <span className="text-sm font-semibold">Payment</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pb-8">
        {!bus || !selectedSeats || selectedSeats.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 md:p-8 shadow-xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">No Booking Data Available</h2>
            <p className="text-white/80 text-lg mb-6">It seems there was an issue with your booking details.</p>
            <Link
              to="/home"
              className="inline-flex items-center space-x-2 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold shadow-md hover:shadow-xl transition-all duration-300"
            >
              <Home className="w-5 h-5" />
              <span>Return to Home</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="text-center mb-8">
              <div
                className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-500/20 border-4 border-indigo-400 transition-all duration-1000 ${
                  showSuccess ? "scale-100 opacity-100" : "scale-0 opacity-0"
                }`}
              >
                <CheckCircle className="w-12 h-12 text-indigo-400" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mt-6 mb-2">Payment Successful!</h2>
              <p className="text-white/80 text-lg">Your bus ticket has been confirmed</p>
            </div>

            {/* Booking Summary */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Booking Confirmation</h3>
              <div className="bg-indigo-500/20 text-indigo-100 px-4 py-2 rounded-full inline-block">
                <span className="text-sm font-medium">Booking ID: {bookingData.bookingId}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Journey Details */}
              <div className="bg-white/10 p-6 rounded-lg">
                <h4 className="text-white font-semibold mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Journey Details
                </h4>
                <div className="space-y-3 text-white/80">
                  <div className="flex justify-between">
                    <span>Bus Operator</span>
                    <span className="text-white font-medium">{bookingData.busName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Travel Date</span>
                    <span className="text-white font-medium">{bookingData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>From</span>
                    <span className="text-white font-medium">
                      {bookingData.from}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>To</span>
                    <span className="text-white font-medium">
                      {bookingData.to}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-white/10 p-6 rounded-lg">
                <h4 className="text-white font-semibold mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Payment Details
                </h4>
                <div className="space-y-3 text-white/80">
                  <div className="flex justify-between">
                    <span>Payment ID</span>
                    <span className="text-white font-medium">{bookingData.paymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Date</span>
                    <span className="text-white font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span className="text-white font-medium">Credit Card</span>
                  </div>
                  <div className="flex justify-between border-t border-white/20 pt-3">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold text-indigo-400">
                      ₹{bookingData.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger Details */}
            <div className="bg-white/10 p-6 rounded-lg mb-6">
              <h4 className="text-white font-semibold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Passenger Details
              </h4>
              <div className="space-y-4">
                {bookingData.passengers.map((passenger, index) => (
                  <div key={index} className="bg-white/10 p-4 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-white/60">Name</span>
                        <div className="text-white font-medium">{passenger.name}</div>
                      </div>
                      <div>
                        <span className="text-white/60">Gender</span>
                        <div className="text-white font-medium">{passenger.gender}</div>
                      </div>
                      <div>
                        <span className="text-white/60">Seat No.</span>
                        <div className="text-white font-medium">{passenger.seat}</div>
                      </div>
                      <div>
                        <span className="text-white/60">Seat Type</span>
                        <div className="text-white font-medium">{passenger.type}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={generatePDF}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Download className="w-5 h-5" />
                <span>Download Ticket</span>
              </button>
              <Link
                to="/home"
                className="flex items-center justify-center space-x-2 bg-white/10 text-white py-3 px-6 rounded-lg font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <Home className="w-5 h-5" />
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}