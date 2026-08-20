"use client";

import { useState } from "react";

export default function Dashboard() {
  const [tab, setTab] = useState("profile");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4">
        <h1 className="text-2xl font-bold">💚 Bandhamai</h1>
      </div>

      <div className="flex gap-4 border-b p-4 bg-white">
        <button onClick={() => setTab("profile")} className={px-4 py-2 font-bold ${tab === "profile" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-600"}}>👤 Profile</button>
        <button onClick={() => setTab("discover")} className={px-4 py-2 font-bold ${tab === "discover" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-600"}}>🔍 Discover</button>
        <button onClick={() => setTab("inbox")} className={px-4 py-2 font-bold ${tab === "inbox" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-600"}}>💬 Inbox</button>
      </div>

      <div className="p-8 max-w-4xl mx-auto">
        {tab === "profile" && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">📸</div>
              <h2 className="text-3xl font-bold mb-2">Your Name, 28</h2>
              <p className="text-gray-600 mb-6">Bangalore</p>
              <p className="text-gray-700 mb-8">Tech professional, travel lover, family-oriented</p>
              <button className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700">Edit Profile</button>
            </div>
          </div>
        )}

        {tab === "discover" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Discover</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-5xl text-center mb-4">👩‍🦰</div>
                <h3 className="font-bold">Priya, 28</h3>
                <p className="text-gray-600 text-sm">Bangalore</p>
                <p className="text-sm text-purple-600 font-bold mt-2">92% Match</p>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 bg-red-500 text-white py-1 rounded">Pass</button>
                  <button className="flex-1 bg-purple-600 text-white py-1 rounded">Like</button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-5xl text-center mb-4">👩‍💼</div>
                <h3 className="font-bold">Isha, 26</h3>
                <p className="text-gray-600 text-sm">Hyderabad</p>
                <p className="text-sm text-purple-600 font-bold mt-2">87% Match</p>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 bg-red-500 text-white py-1 rounded">Pass</button>
                  <button className="flex-1 bg-purple-600 text-white py-1 rounded">Like</button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-5xl text-center mb-4">👩</div>
                <h3 className="font-bold">Neha, 29</h3>
                <p className="text-gray-600 text-sm">Mumbai</p>
                <p className="text-sm text-purple-600 font-bold mt-2">84% Match</p>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 bg-red-500 text-white py-1 rounded">Pass</button>
                  <button className="flex-1 bg-purple-600 text-white py-1 rounded">Like</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "inbox" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Messages</h2>
            <div className="space-y-3">
              <div className="bg-white rounded-lg shadow p-4 flex gap-4">
                <div className="text-3xl">👩‍🦰</div>
                <div>
                  <h3 className="font-bold">Priya, 28</h3>
                  <p className="text-gray-600 text-sm">That sounds amazing!</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 flex gap-4">
                <div className="text-3xl">👩‍💼</div>
                <div>
                  <h3 className="font-bold">Isha, 26</h3>
                  <p className="text-gray-600 text-sm">I love hiking too!</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 flex gap-4">
                <div className="text-3xl">👩</div>
                <div>
                  <h3 className="font-bold">Neha, 29</h3>
                  <p className="text-gray-600 text-sm">Thanks for the recommendation</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
