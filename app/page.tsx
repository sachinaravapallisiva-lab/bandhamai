'use client';

import { useState } from 'react';

const TAB_ACTIVE = 'flex-1 py-3 px-4 font-semibold text-center transition border-b-2 text-purple-600 border-purple-600';
const TAB_IDLE = 'flex-1 py-3 px-4 font-semibold text-center transition border-b-2 text-gray-600 border-transparent hover:text-gray-900';

const MIC_ON = 'flex-1 py-3 rounded-lg font-semibold transition bg-red-600 text-white hover:bg-red-700';
const MIC_OFF = 'flex-1 py-3 rounded-lg font-semibold transition bg-purple-600 text-white hover:bg-purple-700';

const BUBBLE_MINE = 'max-w-xs px-4 py-2 rounded-lg bg-purple-600 text-white';
const BUBBLE_THEIRS = 'max-w-xs px-4 py-2 rounded-lg bg-gray-200 text-gray-900';

const ROW_MINE = 'flex justify-end';
const ROW_THEIRS = 'flex justify-start';

export default function Home() {
  const [activeTab, setActiveTab] = useState('browse');
  const [searchInput, setSearchInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState('');

  const mockProfiles = [
    { id: 1, name: 'Priya', age: 26, location: 'Bangalore', bio: 'Love travel and adventure! Looking for someone who appreciates good conversations.' },
    { id: 2, name: 'Anjali', age: 24, location: 'Mumbai', bio: 'Engineer by day, artist by night. Coffee enthusiast.' },
    { id: 3, name: 'Neha', age: 27, location: 'Delhi', bio: 'Always up for weekend trips and trying new cuisines!' },
  ];

  const mockMatches = [
    { id: 1, name: 'Priya', lastMessage: 'Hey! How are you?' },
    { id: 2, name: 'Anjali', lastMessage: 'Let me know when you are free!' },
  ];

  const mockMessages = [
    { id: 1, sender: 'Priya', text: 'Hey! How are you doing?', time: '10:30 AM' },
    { id: 2, sender: 'You', text: 'I am doing great! How about you?', time: '10:35 AM' },
    { id: 3, sender: 'Priya', text: 'All good! Wanna grab coffee sometime?', time: '10:40 AM' },
  ];

  function startRecording() {
    setIsRecording(true);
    setNoiseLevel('Detecting...');
    setTimeout(function () {
      setNoiseLevel('Quiet - good for voice');
    }, 1000);
  }

  function stopRecording() {
    setIsRecording(false);
    setNoiseLevel('');
  }

  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">

      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bandhamai</h1>
            <p className="text-xs text-gray-600">Find your vibe match</p>
          </div>
          <button className="text-gray-600 hover:text-gray-900 text-2xl">...</button>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto flex">
          <button
            onClick={function () { setActiveTab('browse'); }}
            className={activeTab === 'browse' ? TAB_ACTIVE : TAB_IDLE}
          >
            Browse
          </button>
          <button
            onClick={function () { setActiveTab('matches'); }}
            className={activeTab === 'matches' ? TAB_ACTIVE : TAB_IDLE}
          >
            Matches
          </button>
          <button
            onClick={function () { setActiveTab('chat'); }}
            className={activeTab === 'chat' ? TAB_ACTIVE : TAB_IDLE}
          >
            Chat
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-20">

        {activeTab === 'browse' ? (
          <div>
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Voice is better. In noisy places, text works too.
              </p>

              <input
                type="text"
                value={searchInput}
                onChange={function (e) { setSearchInput(e.target.value); }}
                placeholder="Find engineers in Bangalore..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />

              <div className="flex gap-2">
                <button onClick={toggleRecording} className={isRecording ? MIC_ON : MIC_OFF}>
                  {isRecording ? 'Recording... tap to stop' : 'Tap to Speak'}
                </button>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                  Search
                </button>
              </div>

              {isRecording ? (
                <p className="mt-3 text-sm text-gray-600">Noise level: {noiseLevel}</p>
              ) : null}
            </div>

            {mockProfiles.map(function (profile) {
              return (
                <div key={profile.id} className="bg-white rounded-lg shadow-lg overflow-hidden mb-4">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-40" />
                  <div className="p-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {profile.name}, {profile.age}
                    </h2>
                    <p className="text-gray-600 text-sm mb-3">{profile.location}</p>
                    <p className="text-gray-700 mb-4">{profile.bio}</p>
                    <div className="flex gap-3">
                      <button className="flex-1 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition">
                        Pass
                      </button>
                      <button className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">
                        Like
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === 'matches' ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Your Matches ({mockMatches.length})
            </h2>
            <div className="space-y-3">
              {mockMatches.map(function (match) {
                return (
                  <div key={match.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{match.name}</h3>
                        <p className="text-sm text-gray-600">{match.lastMessage}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {activeTab === 'chat' ? (
          <div>
            <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400" />
              <h3 className="font-semibold text-gray-900">Priya</h3>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 mb-4 space-y-3">
              {mockMessages.map(function (msg) {
                return (
                  <div key={msg.id} className={msg.sender === 'You' ? ROW_MINE : ROW_THEIRS}>
                    <div className={msg.sender === 'You' ? BUBBLE_MINE : BUBBLE_THEIRS}>
                      <p>{msg.text}</p>
                      <p className="text-xs mt-1 opacity-70">{msg.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">
                Send
              </button>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
