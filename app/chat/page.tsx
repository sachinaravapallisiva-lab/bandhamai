'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

export default function ChatPage() {
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');
  const recipientRef = useRef('');

  useEffect(function () {
    supabase.auth.getSession().then(function (result: any) {
      const session = result.data.session;
      if (session) {
        setUserId(session.user.id);
        setUserEmail(session.user.email);
      } else {
        setStatus('Not signed in. Go to /login first.');
      }
    });
  }, []);

  useEffect(function () {
    recipientRef.current = recipientId;
  }, [recipientId]);

  useEffect(function () {
    if (!userId) return;

    const channel = supabase
      .channel('messages-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        function (payload: any) {
          const row = payload.new;
          const other = recipientRef.current;
          if (row.sender_id === other || row.recipient_id === other) {
            setMessages(function (prev: any[]) { return prev.concat(row); });
          }
        }
      )
      .subscribe();

    return function () {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  function loadMessages() {
    if (!recipientId) {
      setStatus('Enter a recipient ID first.');
      return;
    }
    setStatus('Loading...');
    supabase
      .from('messages')
      .select('*')
      .or('and(sender_id.eq.' + userId + ',recipient_id.eq.' + recipientId + '),and(sender_id.eq.' + recipientId + ',recipient_id.eq.' + userId + ')')
      .order('created_at', { ascending: true })
      .then(function (result: any) {
        if (result.error) {
          setStatus('Error: ' + result.error.message);
        } else {
          setMessages(result.data);
          setStatus('');
        }
      });
  }

  function sendMessage() {
    if (!draft || !recipientId) return;
    const text = draft;
    setDraft('');
    supabase
      .from('messages')
      .insert({ sender_id: userId, recipient_id: recipientId, body: text })
      .then(function (result: any) {
        if (result.error) {
          setStatus('Send failed: ' + result.error.message);
        }
      });
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-xl font-bold mb-1">Chat</h1>
      <p className="text-xs text-gray-500 mb-4">You: {userEmail}</p>

      <input
        placeholder="Recipient user ID"
        value={recipientId}
        onChange={function (e) { setRecipientId(e.target.value); }}
        className="w-full px-3 py-2 border border-gray-300 rounded mb-2 text-sm"
      />
      <button
        onClick={loadMessages}
        className="px-4 py-2 bg-gray-800 text-white rounded text-sm mb-4"
      >
        Load conversation
      </button>

      <div className="border border-gray-200 rounded p-3 mb-3 min-h-40">
        {messages.map(function (m: any) {
          return (
            <div key={m.id} className={m.sender_id === userId ? 'text-right mb-2' : 'text-left mb-2'}>
              <span className={m.sender_id === userId ? 'inline-block bg-purple-600 text-white px-3 py-2 rounded-lg text-sm' : 'inline-block bg-gray-200 px-3 py-2 rounded-lg text-sm'}>
                {m.body}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={function (e) { setDraft(e.target.value); }}
          placeholder="Type a message"
          className="flex-1 px-3 py-2 border border-gray-300 rounded"
        />
        <button onClick={sendMessage} className="px-4 py-2 bg-purple-600 text-white rounded font-semibold">
          Send
        </button>
      </div>

      {status ? <p className="mt-3 text-sm text-gray-600">{status}</p> : null}
    </div>
  );
}
