import { useEffect, useState } from "react";
import { ArrowLeft, History, MapPin, Calendar, Users, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPayments } from "../services/payment.service";

export default function WatchHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await getPayments();
        const data = resp?.data?.data;
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || "Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 md:p-8 relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between mb-8">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center space-x-2 bg-white/20 backdrop-blur-lg border border-white/30 rounded-full px-5 py-2 text-white hover:bg-white/30 transition-all duration-300"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">Back to Home</span>
        </button>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">BusEase</h1>
        <div className="bg-indigo-600 text-white px-5 py-2 rounded-full shadow-md">
          <span className="text-sm font-semibold">Booking History</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pb-8">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 md:p-8 shadow-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center">
            <History className="w-6 h-6 mr-2" />
            Booking History
          </h2>

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-400 border-t-transparent"></div>
              <p className="text-white/80 text-lg mt-4">Loading your booking history...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-300 text-lg font-medium">{error}</p>
              <button
                onClick={() => navigate("/home")}
                className="mt-4 inline-flex items-center space-x-2 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                aria-label="Return to Home"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Return to Home</span>
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <p className="text-white/80 text-lg">No bookings found.</p>
                  <button
                    onClick={() => navigate("/home")}
                    className="mt-4 inline-flex items-center space-x-2 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    aria-label="Book a Trip"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Book a Trip</span>
                  </button>
                </div>
              ) : (
                items.map((p) => (
                  <div
                    key={p._id}
                    className="bg-white/5 border border-white/10 rounded-lg p-6 transition-all duration-300 hover:bg-white/10 hover:shadow-xl"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{p.bus?.busNumber || "Unknown Bus"}</h3>
                        <p className="text-sm text-white/60">
                          Booking ID: {p._id.slice(-8).toUpperCase()}
                        </p>
                      </div>
                      <div className="text-sm text-white/80">
                        {new Date(p.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Journey Details */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-5 h-5 text-indigo-300" />
                          <div>
                            <span className="text-white/60 text-sm">Journey</span>
                            <div className="text-white font-medium">
                              {p.startLocation || "Unknown"} → {p.endLocation || "Unknown"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-5 h-5 text-indigo-300" />
                          <div>
                            <span className="text-white/60 text-sm">Travel Date</span>
                            <div className="text-white font-medium">
                              {new Date(p.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Seats and Amount */}
                      <div className="space-y-3">
                        {Array.isArray(p.seats) && p.seats.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Users className="w-5 h-5 text-indigo-300" />
                            <div>
                              <span className="text-white/60 text-sm">Seats</span>
                              <div className="text-white font-medium">
                                {p.seats.map((s) => (
                                  <span
                                    key={s.seatNumber}
                                    className={`inline-block mr-2 px-2 py-1 rounded-full text-xs ${
                                      s.type === "Sleeper"
                                        ? "text-indigo-200 bg-indigo-500/20"
                                        : "text-blue-200 bg-blue-500/20"
                                    }`}
                                  >
                                    {s.seatNumber} ({s.type})
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Receipt className="w-5 h-5 text-yellow-300" />
                          <div>
                            <span className="text-white/60 text-sm">Total Amount</span>
                            <div className="text-white font-medium">₹{p.amount.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}