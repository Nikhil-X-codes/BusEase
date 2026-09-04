import { useEffect, useState } from "react";
import { Activity, Bus, CalendarDays, Coins, Map, Plus, RefreshCw, ToggleLeft, FileDown } from "lucide-react";
import { useAuth } from "../context/Authcontext";
import { useNavigate } from "react-router-dom";
import {
  createAdminBus, createAdminRoute, deleteAdminRoute, getAdminBuses, getAdminRoutes, getDashboardSummary,
  getRecentBookings, updateBusStatus, updateRouteStatus,
} from "../services/admin.service";
import { cancelAdminBooking, getAdminBookings, refundAdminBooking, downloadAdminBookingPdf } from "../services/booking.admin.service";

const emptyBus = { busNumber: "", startLocationName: "", endLocationName: "", seatCount: "40", fare: "500", amenities: "WiFi,Charging" };
const emptyRoute = { startLocation: "", endLocation: "", date: "", totalDistance: "", totalDuration: "" };

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [buses, setBuses] = useState(null);
  const [routes, setRoutes] = useState(null);
  const [tab, setTab] = useState("overview");
  const [busForm, setBusForm] = useState(emptyBus);
  const [routeForm, setRouteForm] = useState(emptyRoute);
  const [message, setMessage] = useState("");
  const [adminBookings, setAdminBookings] = useState(null);
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");

  const load = async () => {
    try {
      const [summaryResponse, bookingsResponse] = await Promise.all([getDashboardSummary(), getRecentBookings()]);
      setSummary(summaryResponse.data.data);
      setBookings(bookingsResponse.data.data || []);
      if (tab === "buses") setBuses((await getAdminBuses({ page: 1, limit: 20 })).data.data);
      if (tab === "routes") setRoutes((await getAdminRoutes({ page: 1, limit: 20 })).data.data);
      if (tab === "bookings") setAdminBookings((await getAdminBookings({ page: 1, limit: 20, search: bookingSearch, status: bookingStatus })).data.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load dashboard data");
    }
  };

  useEffect(() => {
    if (!user || !["admin", "superadmin"].includes(user.role)) {
      navigate("/home");
      return undefined;
    }
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [user, tab]);

  const submitBus = async (event) => {
    event.preventDefault();
    try {
      const seatCount = Number(busForm.seatCount);
      const fare = Number(busForm.fare);
      if (!Number.isInteger(seatCount) || seatCount < 1 || !Number.isFinite(fare) || fare <= 0) throw new Error("Seat count and fare must be valid positive values");
      const seats = Array.from({ length: seatCount }, (_, index) => ({ SeatNumber: String(index + 1), Type: "Seater", Seating: index % 4 < 2 ? "Window" : "Non-Window", price: fare }));
      await createAdminBus({ busNumber: busForm.busNumber, startLocationName: busForm.startLocationName, endLocationName: busForm.endLocationName, amenities: busForm.amenities.split(",").map((item) => item.trim()).filter(Boolean), Seats: seats });
      setBusForm(emptyBus); setMessage("Bus added successfully"); load();
    } catch (error) { setMessage(error.response?.data?.message || error.message || "Unable to add bus"); }
  };

  const submitRoute = async (event) => {
    event.preventDefault();
    try {
      await createAdminRoute({ ...routeForm, totalDistance: Number(routeForm.totalDistance), totalDuration: Number(routeForm.totalDuration) });
      setRouteForm(emptyRoute); setMessage("Route added successfully"); load();
    } catch (error) { setMessage(error.response?.data?.message || "Unable to add route"); }
  };

  if (!summary) return <main className="min-h-screen bg-slate-950 p-8 text-white">Loading dashboard...</main>;
  const metricCards = [
    ["Active buses", summary.activeBuses, Bus, "text-cyan-300"],
    ["Bookings today", summary.bookings.today, CalendarDays, "text-amber-300"],
    ["Revenue today", `₹${summary.revenue.today.toLocaleString()}`, Coins, "text-emerald-300"],
    ["Seat occupancy", `${summary.seats.occupied}/${summary.seats.total}`, Activity, "text-rose-300"],
  ];

  return <main className="min-h-screen bg-[#07131d] text-slate-100">
    <header className="border-b border-white/10 px-5 py-5 md:px-10 flex justify-between items-center">
      <div><p className="text-cyan-300 text-xs uppercase tracking-[0.2em]">BusEase operations</p><h1 className="text-3xl font-bold mt-1">Admin control room</h1></div>
      <div className="flex gap-4"><button onClick={() => navigate("/admin/users")} className="text-sm text-cyan-300 hover:text-white">Users</button><button onClick={() => navigate("/home")} className="text-sm text-slate-300 hover:text-white">Exit dashboard</button></div>
    </header>
    <section className="max-w-7xl mx-auto px-5 py-8 md:px-10">
      <div className="flex flex-wrap gap-2 mb-8">
        {[['overview', 'Overview'], ['buses', 'Buses'], ['routes', 'Routes'], ['bookings', 'Bookings']].map(([value, label]) => <button key={value} onClick={() => setTab(value)} className={`px-4 py-2 rounded-lg text-sm ${tab === value ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-slate-300"}`}>{label}</button>)}
        <button onClick={load} aria-label="Refresh dashboard" className="ml-auto p-2 rounded-lg bg-white/10"><RefreshCw size={18} /></button>
      </div>
      {message && <p className="mb-5 rounded-lg bg-amber-300/10 border border-amber-300/30 px-4 py-3 text-amber-200">{message}</p>}
      {tab === "overview" && <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{metricCards.map(([label, value, Icon, color]) => <div key={label} className="border border-white/10 bg-white/[.04] rounded-xl p-5"><Icon className={color} size={22} /><p className="text-slate-400 text-sm mt-5">{label}</p><strong className="text-2xl block mt-1">{value}</strong></div>)}</div>
        <div className="grid lg:grid-cols-[1fr_280px] gap-6"><section className="border border-white/10 rounded-xl overflow-hidden"><div className="px-5 py-4 border-b border-white/10"><h2 className="font-semibold">Recent bookings</h2></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-slate-400"><tr><th className="p-4">Passenger</th><th className="p-4">Bus</th><th className="p-4">Amount</th><th className="p-4">Date</th></tr></thead><tbody>{bookings.map((booking) => <tr key={booking._id} className="border-t border-white/5"><td className="p-4">{booking.user?.username || "Unknown"}</td><td className="p-4">{booking.bus?.busNumber || "Unknown"}</td><td className="p-4">₹{booking.amount?.toLocaleString()}</td><td className="p-4 text-slate-400">{new Date(booking.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></section><aside className="border border-white/10 rounded-xl p-5"><h2 className="font-semibold mb-4">Quick actions</h2><div className="grid gap-3"><button onClick={() => setTab("buses")} className="flex gap-2 items-center justify-center rounded-lg bg-cyan-400 text-slate-950 py-3"><Plus size={17} /> Add bus</button><button onClick={() => setTab("routes")} className="flex gap-2 items-center justify-center rounded-lg bg-white/10 py-3"><Map size={17} /> Add route</button><button onClick={() => setTab("overview")} className="flex gap-2 items-center justify-center rounded-lg bg-white/10 py-3"><CalendarDays size={17} /> View bookings</button></div></aside></div>
      </>}
      {tab === "buses" && <ManagementSection title="Bus management" icon={Bus} form={<form onSubmit={submitBus} className="grid md:grid-cols-3 gap-3 mb-6">{[['busNumber','Bus number'],['startLocationName','Origin'],['endLocationName','Destination'],['seatCount','Total seats'],['fare','Fare per seat'],['amenities','Amenities, comma separated']].map(([key, placeholder]) => <input required key={key} type={['seatCount','fare'].includes(key) ? 'number' : 'text'} value={busForm[key]} onChange={(e) => setBusForm({ ...busForm, [key]: e.target.value })} placeholder={placeholder} className="rounded-lg bg-white/10 border border-white/10 px-3 py-3" />)}<button className="rounded-lg bg-cyan-400 text-slate-950 font-semibold py-3">Add bus</button></form>} data={buses} onToggle={(id, active) => updateBusStatus(id, !active).then(load).catch((e) => setMessage(e.response?.data?.message || "Unable to update bus status"))} type="bus" />}
      {tab === "routes" && <ManagementSection title="Route management" icon={Map} form={<form onSubmit={submitRoute} className="grid md:grid-cols-5 gap-3 mb-6">{[['startLocation','Origin'],['endLocation','Destination'],['date','Date'],['totalDistance','Distance km'],['totalDuration','Duration hours']].map(([key, placeholder]) => <input required key={key} type={key === 'date' ? 'date' : key.includes('total') ? 'number' : 'text'} value={routeForm[key]} onChange={(e) => setRouteForm({ ...routeForm, [key]: e.target.value })} placeholder={placeholder} className="rounded-lg bg-white/10 border border-white/10 px-3 py-3" />)}<button className="rounded-lg bg-cyan-400 text-slate-950 font-semibold py-3">Add route</button></form>} data={routes} onToggle={(id, active) => updateRouteStatus(id, !active).then(load).catch((e) => setMessage(e.response?.data?.message || "Unable to update route status"))} onDelete={(id) => { if (!window.confirm("Are you sure you want to delete this route?")) return; deleteAdminRoute(id).then(load).catch((e) => setMessage(e.response?.data?.message || "Unable to delete route")); }} type="route" />}
      {tab === "bookings" && (
        <section>
          <h2 className="text-2xl font-semibold mb-5">Booking management</h2>
          <div className="flex flex-wrap gap-3 mb-5">
            <input
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
              placeholder="Booking reference or user"
              className="rounded-lg bg-white/10 border border-white/10 px-3 py-3"
            />
            <select
              value={bookingStatus}
              onChange={(e) => setBookingStatus(e.target.value)}
              className="rounded-lg bg-slate-900 border border-white/10 px-3 py-3"
            >
              <option value="">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
            <button onClick={load} className="rounded-lg bg-cyan-400 text-slate-950 px-4 py-3">
              Search
            </button>
          </div>
          <div className="border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[.04] text-left text-slate-400">
                <tr>
                  <th className="p-4">Reference</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(adminBookings?.bookings || []).map((booking) => (
                  <tr key={booking._id} className="border-t border-white/5">
                    <td className="p-4">{booking.transactionReference}</td>
                    <td className="p-4">{booking.user?.username || booking.user?.email || "Unknown"}</td>
                    <td className="p-4">{booking.startLocation} → {booking.endLocation}</td>
                    <td className="p-4">{booking.selectedDate ? new Date(booking.selectedDate).toLocaleDateString() : "-"}</td>
                    <td className="p-4">₹{booking.amount?.toLocaleString()}</td>
                    <td className="p-4">{booking.status}</td>
                    <td className="p-4 flex items-center gap-3">
                      <button
                        onClick={() => downloadAdminBookingPdf(booking._id, booking.bookingId || booking.transactionReference)}
                        className="text-cyan-300 hover:text-cyan-200 flex items-center gap-1 text-xs"
                        title="Download official PDF ticket"
                      >
                        <FileDown size={14} /> PDF
                      </button>
                      {booking.status === "confirmed" && (
                        <button
                          onClick={() => {
                            const reason = window.prompt("Cancellation reason");
                            if (reason) cancelAdminBooking(booking._id, reason).then(load);
                          }}
                          className="text-rose-300"
                        >
                          Cancel
                        </button>
                      )}
                      {booking.status === "cancelled" && (
                        <button
                          onClick={() => {
                            const amount = window.prompt("Refund amount", String(booking.refundAmount || booking.amount));
                            if (amount) refundAdminBooking(booking._id, Number(amount)).then(load);
                          }}
                          className="text-emerald-300"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  </main>;
}

function ManagementSection({ title, icon: Icon, form, data, onToggle, onDelete, type }) {
  return <section><h2 className="flex items-center gap-2 text-2xl font-semibold mb-5"><Icon size={23} className="text-cyan-300" />{title}</h2>{form}<div className="border border-white/10 rounded-xl overflow-hidden"><table className="w-full text-sm"><thead className="bg-white/[.04] text-left text-slate-400"><tr><th className="p-4">{type === "bus" ? "Bus" : "Route"}</th><th className="p-4">Details</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead><tbody>{(data?.[type === "bus" ? "buses" : "routes"] || []).map((item) => <tr key={item._id} className="border-t border-white/5"><td className="p-4 font-medium">{type === "bus" ? item.busNumber : `${item.startLocation} → ${item.endLocation}`}</td><td className="p-4 text-slate-400">{type === "bus" ? `${item.capacity || 0} seats` : `${item.totalDistance} km · ${item.totalDuration} h`}</td><td className="p-4">{item.isActive === false ? "Inactive" : "Active"}</td><td className="p-4 flex gap-3"><button onClick={() => onToggle(item._id, item.isActive !== false)} className="text-cyan-300"><ToggleLeft size={20} /></button>{onDelete && <button onClick={() => onDelete(item._id)} className="text-rose-300 text-xs">Delete</button>}</td></tr>)}</tbody></table></div></section>;
}
