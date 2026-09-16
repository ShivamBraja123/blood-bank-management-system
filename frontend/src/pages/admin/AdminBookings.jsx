import { useEffect, useState } from "react";
import { API_URL } from "../../config/api.js";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/admin/camp-bookings`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load bookings");
        setBookings(data.bookings || []);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Booking Management</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <div className="bg-white rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-red-50">
              <tr><th className="p-4">Camp</th><th className="p-4">Donor ID</th><th className="p-4">Booked At</th><th className="p-4">Status</th></tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id} className="border-t">
                  <td className="p-4">{booking.campId?.title || "Camp unavailable"}</td>
                  <td className="p-4 font-mono text-sm">{booking.donorId}</td>
                  <td className="p-4">{new Date(booking.bookedAt).toLocaleString()}</td>
                  <td className="p-4 text-green-700">{booking.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
