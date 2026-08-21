'use client';

import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('browse');
  const [searchInput, setSearchInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(null);

  // Mock profiles data
  const mockProfiles = [
    {
      id: 1,
      name: 'Priya',
      age: 26,
      location: 'Bangalore',
      bio: 'Love travel and adventure! Looking for someone who appreciates good conversations.',
    },
    {
      id: 2,
      name: 'Anjali',
      age: 24,
      location: 'Mumbai',
      bio: 'Engineer by day, artist by night. Coffee enthusiast.',
    },
    {
      id: 3,
      name: 'Neha',
      age: 27,
      location: 'Delhi',
      bio: 'Always up for weekend trips and trying new cuisines!',
    },
  ];

  const mockMatches = [
    {
      id: 1,
      name: 'Priya',
      lastMessage: 'Hey! How are you?',
    },
    {
      id: 2,
      name: 'Anjali',
      lastMessage: 'Let me know when you are free!',
    },
  ];

  const mockMessages = [
    {
      id: 1,
      sender: 'Priya',
      text: 'Hey! How are you doing?',
      time: '10:30 AM',
    },
    {
      id: 2,
      sender: 'You',
      text: 'I am doing great! How about you?',
      time: '10:35 AM',
    },
    {
      id: 3,
      sender: 'Priya',
      text: 'All good! Wanna grab coffee sometime?',
      time: '10:40 AM',
    },
  ];

  const startRecording = () => {
    setIsRecording(true);
    setNoiseLevel('DETECTING');
    setTimeout(() => {
      setNoiseLevel('QUIET');
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setNoiseLevel(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💕 Bandhamai</h1>
            <p className="text-xs text-gray-600">"Find your vibe match"</p>
          </div>
          <button className="text-gray-600 hover:text-gray-900 text-2xl">⚙️</button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-20 z-40">
        <div className="max-w-2xl mx-auto flex">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 py-3 px-4 font-semibold text-center transition border-b-2 ${
              activeTab === 'browse'
                ? 'text-purple-600 border-purple-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            🔍 Browse
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex-1 py-3 px-4 font-semibold text-center transition border-b-2 ${
              activeTab === 'matches'
                ? 'text-purple-600 border-purple-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            ✨ Matches
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 px-4 font-semibold text-center transition border-b-2 ${
              activeTab === 'chat'
                ? 'text-purple-600 border-purple-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            💬 Chat
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 pb-20">
        {/* BROWSE TAB */}
        {activeTab === 'browse' && (
          <div>
            {/* Search Input */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="mb-3">
                <p className="text-sm text-gray-600">
                  💡 Voice is better! But in noisy places? Text works too! 💬
                </p>
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Find engineers in Bangalore..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex-1 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    isRecording
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <span className="text-xl animate-pulse">🔴</span> Recording...
                    </>
                  ) : (
                    <>
                      <span>🎤</span> Tap to Speak
                    </>
                  )}
                </button>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                  🔍
                </button>
              </div>

              {isRecording && (
                <div className="mt-3 text-sm text-gray-600">
                  <p>🔊 Noise Level: {noiseLevel}</p>
                </div>
              )}
            </div>

            {/* Profile Cards */}
            {mockProfiles.map((profile) => (
              <div key={profile.id} className="bg-white rounded-lg shadow-lg overflow-hidden mb-4">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-40 flex items-center justify-center">
                  <div className="text-6xl">👤</div>
                </div>

                <div className="p-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profile.name}, {profile.age}
                  </h2>
                  <p className="text-gray-600 text-sm mb-3">📍 {profile.location}</p>
                  <p className="text-gray-700 mb-4">{profile.bio}</p>

                  <div className="flex gap-3">
                    <button className="flex-1 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition">
                      👎 Pass
                    </button>
                    <button className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">
                      ❤️ Like
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">✨ Your Matches ({mockMatches.length})</h2>
            </div>

            <div className="space-y-3">
              {mockMatches.map((match) => (
                <div key={match.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-xl">
                      👤
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{match.name}</h3>
                      <p className="text-sm text-gray-600">Last: {match.lastMessage}</p>
                    </div>
                    <span className="text-2xl">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-96">
            {/* Chat Header */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-xl">
                👤
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Priya</h3>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 bg-white rounded-lg shadow-md p-4 overflow-y-auto mb-4 space-y-3">
              {mockMessages.map((msg, idx) => (
                <div key={idx} className={flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.sender === 'You' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className="text-xs mt-1 opacity-70">{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
