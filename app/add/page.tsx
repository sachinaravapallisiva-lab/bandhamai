"use client";

import { useState } from "react";

export default function MatrimonyDashboard() {
  const [activeTab, setActiveTab] = useState("profile");
  const [editingProfile, setEditingProfile] = useState(false);
  
  const [profile, setProfile] = useState({
    name: "Your Name",
    age: 28,
    location: "Bangalore",
    bio: "Tech professional, travel lover, family-oriented",
    height: '5\'6"',
    religion: "Hindu",
    education: "Bachelor's",
    profession: "Software Engineer",
    income: "₹15-20 LPA",
    verified: false,
    online: true,
  });

  const [formData, setFormData] = useState(profile);

  const handleProfileChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const saveProfile = () => {
    setProfile(formData);
    setEditingProfile(false);
  };

  const sampleMatches = [
    {
      id: "1",
      name: "Priya",
      age: 28,
      location: "Bangalore",
      photo: "👩‍🦰",
      compatibility: 92,
      lastMessage: "That sounds amazing! When are you free?",
      unread: true,
      online: true,
    },
    {
      id: "2",
      name: "Isha",
      age: 26,
      location: "Hyderabad",
      photo: "👩‍💼",
      compatibility: 87,
      lastMessage: "I love hiking too!",
      online: false,
    },
    {
      id: "3",
      name: "Neha",
      age: 29,
      location: "Mumbai",
      photo: "👩",
      compatibility: 84,
      lastMessage: "Thanks for the recommendation",
      online: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-purple-50/30">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💚</span>
            <h1 className="text-2xl font-bold">Bandhamai</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm">Find Your Vibe Match?</span>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">👤</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: "profile", label: "👤 Profile" },
            { id: "discover", label: "🔍 Discover" },
            { id: "matches", label: "💚 Matches" },
            { id: "inbox", label: "💬 Inbox" },
            { id: "settings", label: "⚙️ Settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-200">
                {/* Profile Header */}
                <div className="h-40 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative">
                  <div className="absolute bottom-0 left-6 translate-y-1/2">
                    <div className="w-32 h-32 rounded-3xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-6xl">
                      📸
                    </div>
                  </div>
                </div>

                <div className="pt-20 px-6 pb-6">
                  {editingProfile ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleProfileChange("name", e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                          <input
                            type="number"
                            value={formData.age}
                            onChange={(e) => handleProfileChange("age", parseInt(e.target.value))}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => handleProfileChange("location", e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Height</label>
                          <input
                            type="text"
                            value={formData.height}
                            onChange={(e) => handleProfileChange("height", e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => handleProfileChange("bio", e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Profession</label>
                          <input
                            type="text"
                            value={formData.profession}
                            onChange={(e) => handleProfileChange("profession", e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Education</label>
                          <input
                            type="text"
                            value={formData.education}
                            onChange={(e) => handleProfileChange("education", e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button
                          onClick={saveProfile}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all"
                        >
                          ✓ Save Profile
                        </button>
                        <button
                          onClick={() => setEditingProfile(false)}
                          className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-300 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h2 className="text-3xl font-bold text-gray-900">
                            {profile.name}, {profile.age}
                          </h2>
                          <p className="text-gray-600 flex items-center gap-2 mt-1">
                            📍 {profile.location}
                            {profile.online && <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>}
                          </p>
                        </div>
                        {profile.verified && (
                          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                            ✓ Verified
                          </div>
                        )}
                      </div>

                      <p className="text-gray-700 mb-6">{profile.bio}</p>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-purple-50 p-4 rounded-2xl">
                          <p className="text-xs text-gray-600">Height</p>
                          <p className="text-lg font-semibold text-gray-900">{profile.height}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-2xl">
                          <p className="text-xs text-gray-600">Religion</p>
                          <p className="text-lg font-semibold text-gray-900">{profile.religion}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-2xl">
                          <p className="text-xs text-gray-600">Profession</p>
                          <p className="text-lg font-semibold text-gray-900">{profile.profession}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-2xl">
                          <p className="text-xs text-gray-600">Education</p>
                          <p className="text-lg font-semibold text-gray-900">{profile.education}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setEditingProfile(true)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all"
                      >
                        ✏️ Edit Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📸 Photos</h3>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {["📸", "📸", "📸"].map((photo, i) => (
                    <div key={i} className="aspect-square bg-gradient-to-br from-blue-200 to-purple-200 rounded-2xl flex items-center justify-center text-3xl">
                      {photo}
                    </div>
                  ))}
                </div>
                <button className="w-full bg-purple-100 text-purple-600 font-bold py-2 rounded-xl hover:bg-purple-200 transition-all">
                  + Add Photo
                </button>
              </div>

              <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">✓ Verification</h3>
                <div className={p-4 rounded-2xl mb-4 ${profile.verified ? "bg-green-50 border-2 border-green-200" : "bg-yellow-50 border-2 border-yellow-200"}}>
                  <p className={text-sm font-semibold ${profile.verified ? "text-green-700" : "text-yellow-700"}}>
                    {profile.verified ? "✓ Verified Profile" : "⚠️ Verification pending"}
                  </p>
                </div>
                <button className="w-full bg-blue-100 text-blue-600 font-bold py-2 rounded-xl hover:bg-blue-200 transition-all">
                  + Verify Now
                </button>
              </div>

              <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">💪 Profile Strength</h3>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold text-gray-700">78%</p>
                    <p className="text-xs text-gray-500">Good</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full" style={{ width: "78%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DISCOVER TAB */}
        {activeTab === "discover" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🔍 Discover Profiles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleMatches.map((match) => (
                <div key={match.id} className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all">
                  <div className="aspect-square bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center text-7xl relative">
                    {match.photo}
                    {match.online && <div className="absolute top-3 right-3 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>}
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-900">{match.name}, {match.age}</h3>
                    <p className="text-gray-600 text-sm mb-4">📍 {match.location}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2" style={{ width: "120px" }}>
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full" style={{ width: ${match.compatibility}% }}></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 ml-2">{match.compatibility}%</span>
                    </div>
                    <div className="flex gap-3">
                      <button className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-2 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all">
                        ✕ Pass
                      </button>
                      <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all">
                        💚 Like
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MATCHES TAB */}
        {activeTab === "matches" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">💚 My Matches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleMatches.map((match) => (
                <div key={match.id} className="bg-white rounded-3xl shadow-lg overflow-hidden border-2 border-purple-200 hover:shadow-xl transition-all">
                  <div className="aspect-video bg-gradient-to-br from-blue-300 to-purple-300 flex items-center justify-center text-5xl relative">
                    {match.photo}
                    {match.online && <div className="absolute top-3 right-3 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>}
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-900">{match.name}, {match.age}</h3>
                    <p className="text-gray-600 text-sm mb-3">📍 {match.location}</p>
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">{match.lastMessage}</p>
                    <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all">
                      💬 Send Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INBOX TAB */}
        {activeTab === "inbox" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">💬 Inbox</h2>
            <div className="max-w-2xl mx-auto space-y-3">
              {sampleMatches.map((match) => (
                <div key={match.id} className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200 hover:shadow-xl transition-all cursor-pointer">
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center text-3xl relative">
                      {match.photo}
                      {match.online && <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900">{match.name}, {match.age}</h3>
                      <p className={text-sm truncate ${match.unread ? "text-gray-900 font-semibold" : "text-gray-600"}}>
                        {match.lastMessage}
                      </p>
                    </div>
                    {match.unread && <div className="w-3 h-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">⚙️ Settings</h2>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">🔔 Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">New matches</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Messages</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Profile views</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">🔒 Privacy</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Profile visibility</span>
                    <select className="px-3 py-1 border border-gray-300 rounded-lg">
                      <option>Everyone</option>
                      <option>Verified only</option>
                      <option>Hidden</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Show online status</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">📋 Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-700 text-sm font-semibold">Age range</label>
                    <div className="flex gap-2 mt-2">
                      <input type="number" placeholder="Min" className="w-20 px-3 py-2 border border-gray-300 rounded-lg" />
                      <span className="text-gray-600">to</span>
                      <input type="number" placeholder="Max" className="w-20 px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-700 text-sm font-semibold">Location</label>
                    <input type="text" placeholder="City/Region" className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2" />
                  </div>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all">
                💾 Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
