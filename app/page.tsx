"use client";

import { useState } from "react";

export default function Dashboard() {
  const [tab, setTab] = useState("profile");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">Bandhamai</h1>
      </div>

      <div className="flex gap-4 border-b p-4 bg-white">
        <button onClick={() => setTab("profile")} className="px-4 py-2 font-bold text-gray-600 hover:text-purple-600">Profile</button>
        <button onClick={() => setTab("discover")} className="px-4 py-2 font-bold text-gray-600 hover:text-purple-600">Discover</button>
        <button onClick={() => setTab("inbox")} className="px-4 py-2 font-bold text-gray-600 hover:text-purple-600">Inbox</button>
      </div>

      <div className="p-8">
        {tab === "profile" && (
          <div className="bg-white rounded-lg shadow p-8 max-w-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">📸</div>
              <h2 className="text-3xl font-bold mb-2">Your Name, 28</h2>
              <p className="text-gray-600">Bangalore</p>
            </div>
          </div>
        )}

        {tab === "discover" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Discover Profiles</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-5xl text-center mb-4">Female</div>
                <h3 className="font-bold">Priya, 28</h3>
                <p className="text-gray-600 text-sm">Bangalore</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-5xl text-center mb-4">Female</div>
                <h3 className="font-bold">Isha, 26</h3>
                <p className="text-gray-600 text-sm">Hyderabad</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-5xl text-center mb-4">Female</div>
                <h3 className="font-bold">Neha, 29</h3>
                <p className="text-gray-600 text-sm">Mumbai</p>
              </div>
            </div>
          </div>
        )}

        {tab === "inbox" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Inbox</h2>
            <div className="space-y-3">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-bold">Priya, 28</h3>
                <p className="text-gray-600 text-sm">Hi there!</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-bold">Isha, 26</h3>
                <p className="text-gray-600 text-sm">How are you?</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-bold">Neha, 29</h3>
                <p className="text-gray-600 text-sm">Nice to meet you!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
