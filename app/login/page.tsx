'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  function handleSignUp() {
    setStatus('Creating account...');
    supabase.auth.signUp({ email: email, password: password }).then(function (result: any) {
      if (result.error) {
        setStatus('Error: ' + result.error.message);
      } else {
        setStatus('Account created and signed in.');
      }
    });
  }

  function handleSignIn() {
    setStatus('Signing in...');
    supabase.auth.signInWithPassword({ email: email, password: password }).then(function (result: any) {
      if (result.error) {
        setStatus('Error: ' + result.error.message);
      } else {
        setStatus('Signed in as ' + result.data.user.email);
      }
    });
  }

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Bandhamai Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={function (e) { setEmail(e.target.value); }}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={function (e) { setPassword(e.target.value); }}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3"
      />

      <div className="flex gap-2">
        <button
          onClick={handleSignIn}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold"
        >
          Sign In
        </button>
        <button
          onClick={handleSignUp}
          className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold"
        >
          Sign Up
        </button>
      </div>

      {status ? <p className="mt-4 text-sm text-gray-700">{status}</p> : null}
    </div>
  );
}
