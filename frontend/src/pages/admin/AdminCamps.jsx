import { useEffect, useState } from "react";
import { API_URL } from "../../config/api.js";

const statuses = ["Upcoming", "Ongoing", "Completed", "Cancelled"];

export default function AdminCamps() {
  const [camps, setCamps] = useState([]);
  const [error, setError] = useState("");

  const loadCamps = async () => {
    const response = await fetch(`${API_URL}/admin/camps`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load camps");
    setCamps(data.camps || []);
  };

  useEffect(() => {
    loadCamps().catch((err) => setError(err.message));
  }, []);

  const updateStatus = async (id, status) => {
    const response = await fetch(`${API_URL}/admin/camps/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update camp");
    setCamps((current) => current.map((camp) => (camp._id === id ? data.camp : camp)));
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Camp Management</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <div className="grid gap-4">
          {camps.map((camp) => (
            <div key={camp._id} className="bg-white rounded-2xl shadow p-5 flex flex-wrap gap-4 items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">{camp.title}</h2>
                <p className="text-sm text-gray-600">{camp.location?.city}, {camp.location?.state}</p>
                <p className="text-sm text-gray-600">Capacity {camp.expectedDonors} | Booked {camp.actualDonors} | Available {Math.max(0, camp.expectedDonors - camp.actualDonors)}</p>
              </div>
              <select value={camp.status} onChange={(event) => updateStatus(camp._id, event.target.value).catch((err) => setError(err.message))} className="border rounded-lg px-3 py-2">
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
