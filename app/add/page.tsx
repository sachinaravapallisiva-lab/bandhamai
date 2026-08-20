"use client";

import { useState } from "react";

export default function Dashboard() {
  const [tab, setTab] = useState("profile");
  const [editing, setEditing] = useState(false);

  const profiles = [
    { id: 1, name: "Priya", age: 28, city: "Bangalore", match: 92, msg: "That sounds amazing!", photo: "👩‍🦰", online: true },
    { id: 2, name: "Isha", age: 26, city: "Hyderabad", match: 87, msg: "I love hiking too!", photo: "👩‍💼", online: false },
    { id: 3, name: "Neha", age: 29, city: "Mumbai", match: 84, msg: "Thanks for the recommendation", photo: "👩", online: true },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white p-4 shadow-lg z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💚</span>
            <h1 className="text-2xl font-bold">Bandhamai</h1>
          </div>
          <span className="text-sm">Find Your Vibe Match?</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 sticky top-16 bg-white z-40">
        <div className="max-w-7xl mx-auto flex gap-4 px-4">
          {[
            { id: "profile", label: "👤 Profile" },
            { id: "discover", label: "🔍 Discover" },
            { id: "inbox", label: "💬 Inbox" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 font-semibold border-b-2 transition-all ${
                tab === t.id
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* PROFILE TAB */}
        {tab === "profile" && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Name</label>
                    <input type="text" defaultValue="Your Name" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Age</label>
                      <input type="number" defaultValue="28" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Location</label>
                      <input type="text" defaultValue="Bangalore" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Bio</label>
                    <textarea rows={3} defaultValue="Tech professional, travel lover, family-oriented" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setEditing(false)} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2 rounded-lg hover:from-blue-700 hover:to-purple-700">
                      Save
                    </button>
                    <button onClick={() => setEditing(false)} className="flex-1 bg-gray-200 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-300">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">📸</div>
                    <h2 className="text-3xl font-bold">Your Name, 28</h2>
                    <p className="text-gray-600">📍 Bangalore 🟢</p>
                  </div>

                  <p className="text-gray-700 text-center mb-8">Tech professional, travel lover, family-oriented</p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-xs text-gray-600">Height</p>
                      <p className="font-bold">5'6"</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-xs text-gray-600">Profession</p>
                      <p className="font-bold">Engineer</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-xs text-gray-600">Religion</p>
                      <p className="font-bold">Hindu</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-xs text-gray-600">Education</p>
                      <p className="font-bold">Bachelor's</p>
                    </div>
                  </div>

                  <button onClick={() => setEditing(true)} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700">
                    ✏️ Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DISCOVER TAB */}
        {tab === "discover" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">🔍 Discover Profiles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all">
                  <div className="aspect-square bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center text-7xl relative">
                    {p.photo}
                    {p.online && <div className="absolute top-3 right-3 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>}
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold">{p.name}, {p.age}</h3>
                    <p className="text-gray-600 text-sm mb-4">📍 {p.city}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full" style={{ width: ${p.match}% }}></div>
                      </div>
                      <span className="text-sm font-bold">{p.match}%</span>
                    </div>
                    <div className="flex gap-3">
                      <button className="flex-1 bg-red-500 text-white font-bold py-2 rounded-lg hover:bg-red-600">✕ Pass</button>
                      <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2 rounded-lg hover:from-blue-700 hover:to-purple-700">💚 Like</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INBOX TAB */}
        {tab === "inbox" && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">💬 Inbox</h2>
            <div className="space-y-3">
              {profiles.map((p) => (
                <div key={p.id} className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 hover:shadow-xl transition-all cursor-pointer flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center text-3xl relative">
                    {p.photo}
                    {p.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold">{p.name}, {p.age}</h3>
                    <p className="text-sm text-gray-600 truncate">{p.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
