import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/Authcontext";
import { deactivateAdminUser, getAdminUsers } from "../services/user.admin.service";

export default function AdminUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ users: [] });
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => {
    try { setData((await getAdminUsers({ page: 1, limit: 20, search })).data.data); }
    catch (error) { setMessage(error.response?.data?.message || "Unable to load users"); }
  };
  useEffect(() => {
    if (!user || !["admin", "superadmin"].includes(user.role)) { navigate("/home"); return; }
    load();
  }, [user]);
  return <main className="min-h-screen bg-[#07131d] text-slate-100 p-5 md:p-10"><div className="max-w-7xl mx-auto"><button onClick={() => navigate("/admin")} className="flex items-center gap-2 text-slate-300 mb-8"><ArrowLeft size={18} /> Dashboard</button><h1 className="text-3xl font-bold mb-2">User management</h1><p className="text-slate-400 mb-6">Support view for registered customers and booking history.</p>{message && <p className="mb-5 text-rose-300">{message}</p>}<div className="flex gap-3 mb-5"><div className="relative flex-1"><Search size={18} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && load()} placeholder="Search name, email, or phone" className="w-full rounded-lg bg-white/10 border border-white/10 pl-10 pr-3 py-3" /></div><button onClick={load} className="rounded-lg bg-cyan-400 text-slate-950 px-5">Search</button></div><div className="border border-white/10 rounded-xl overflow-x-auto"><table className="w-full text-sm"><thead className="bg-white/[.04] text-left text-slate-400"><tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Phone</th><th className="p-4">Joined</th><th className="p-4">Bookings</th><th className="p-4">Spent</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead><tbody>{(data.users || []).map((customer) => <tr key={customer._id} className="border-t border-white/5"><td className="p-4">{customer.username}</td><td className="p-4">{customer.email}</td><td className="p-4">{customer.phone || "-"}</td><td className="p-4">{new Date(customer.createdAt).toLocaleDateString()}</td><td className="p-4">{customer.totalBookings}</td><td className="p-4">₹{customer.totalSpent?.toLocaleString()}</td><td className="p-4">{customer.isActive === false ? "Inactive" : "Active"}</td><td className="p-4">{customer.isActive !== false && <button onClick={() => deactivateAdminUser(customer._id).then(load)} className="text-rose-300">Deactivate</button>}</td></tr>)}</tbody></table></div></div></main>;
}
