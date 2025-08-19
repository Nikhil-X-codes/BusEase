import { useState } from "react";
import { useAuth } from "../context/Authcontext";

export default function Profile() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "Guest",
    email: user?.email || "guest@example.com",
  });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg text-white max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      {!editing ? (
        <div className="space-y-2">
          <p><span className="text-gray-300">Name:</span> {form.name}</p>
          <p><span className="text-gray-300">Email:</span> {form.email}</p>
          <button onClick={() => setEditing(true)} className="mt-4 bg-blue-600 px-4 py-2 rounded-lg">Edit</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-200 mb-1">Name</label>
            <input name="name" value={form.name} onChange={onChange} className="w-full px-4 py-2 rounded bg-white/80 text-gray-900" />
          </div>
          <div>
            <label className="block text-sm text-gray-2 00 mb-1">Email</label>
            <input name="email" value={form.email} onChange={onChange} className="w-full px-4 py-2 rounded bg-white/80 text-gray-900" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="bg-green-600 px-4 py-2 rounded-lg">Save</button>
            <button onClick={() => setEditing(false)} className="bg-gray-600 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}


