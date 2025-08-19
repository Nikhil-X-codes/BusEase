import { useEffect, useState } from "react";
import { getPayments } from "../services/payment.service";

export default function WatchHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await getPayments();
        const data = resp?.data?.data;
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.message || "Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg text-white max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Booking History</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-300">{error}</p>}
      {!loading && !error && (
        <div className="space-y-3">
          {items.length === 0 && <p className="text-gray-300">No bookings found.</p>}
          {items.map((p) => (
            <div key={p._id} className="bg-white/10 border border-white/10 rounded-xl p-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">Amount: ₹{p.amount}</p>
                  <p className="text-sm text-gray-200">Bus: {p.bus?.busNumber || '—'}</p>
                </div>
                <div className="text-sm text-gray-300">
                  {new Date(p.createdAt).toLocaleString()}
                </div>
              </div>
              {Array.isArray(p.seats) && p.seats.length > 0 && (
                <div className="mt-2 text-sm text-gray-200">Seats: {p.seats.map(s => s.seatNumber).join(', ')}</div>
              )}
              {/* If you store bus/seat details in payment later, render here */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


