import React, { useState } from 'react';

const BASE_URL = (import.meta.env.VITE_BASE_URL || '').replace(/\/+$/, '');

const Withdrawal = ({ availableBalance = 0 }) => {
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState(''); // keep as string for controlled input

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' }); // 'success' | 'error'

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    // basic validations
    const numericAmount = Number(amount);
    if (!name.trim()) return setMsg({ type: 'error', text: 'Please enter your name.' });
    if (!upiId.trim()) return setMsg({ type: 'error', text: 'Please enter a valid UPI ID.' });
    if (!Number.isFinite(numericAmount) || numericAmount < 50) {
      return setMsg({ type: 'error', text: 'Minimum withdrawal amount is ₹50.' });
    }

    try {
      if (!BASE_URL) throw new Error('VITE_BASE_URL is missing in .env');

      setLoading(true);
      const token = localStorage.getItem('authToken') || '';

      const payload = {
        name: name.trim(),
        upiId: upiId.trim(),
        amount: numericAmount,
      };

      const res = await fetch(
        `${BASE_URL}/withdraw/amount?ngrok-skip-browser-warning=true`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
          cache: 'no-store',
        }
      );

      const ctype = res.headers.get('content-type')?.toLowerCase() || '';
      if (!ctype.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Server did not return JSON (${res.status}). ${text.slice(0, 180)}`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Withdrawal request failed');

      setMsg({ type: 'success', text: data?.message || 'Withdrawal request submitted successfully.' });
      // reset form
      setName('');
      setUpiId('');
      setAmount('');
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-6">
      {/* Header */}
      <div className="w-full max-w-3xl bg-blue-900 text-white p-4 rounded-t-lg text-center shadow-md">
        <h1 className="text-lg font-bold">💳 Withdrawal</h1>
        <p className="text-sm">Select a withdrawal channel and submit your request</p>
      </div>

      {/* Info + Form Card */}
      <div className="w-full max-w-3xl bg-blue-50 text-black rounded-b-lg shadow-md p-5">
        {/* Quick Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-md shadow px-4 py-3 text-center">
            <p className="text-xs text-gray-500">Available balance</p>
            <p className="text-xl font-bold">₹{availableBalance}</p>
          </div>
          <div className="bg-white rounded-md shadow px-4 py-3 text-center">
            <p className="text-xs text-gray-500">Withdrawal limit</p>
            <p className="text-xl font-bold">Min ₹100</p>
          </div>
          {/* <div className="bg-white rounded-md shadow px-4 py-3 text-center">
            <p className="text-xs text-gray-500">Last withdrawal</p>
            <p className="text-xl font-bold">Never</p>
          </div> */}
        </div>

        {/* Rules */}
        <div className="bg-white rounded-md p-4 border">
          <ul className="text-sm list-disc pl-5 space-y-1 text-gray-600">
            <li>Minimum withdrawal ₹100</li>
            <li>Requests are processed within 24–48 hours</li>
            <li>Make sure your UPI ID is correct</li>
            <li>A service fee may apply depending on the channel</li>
          </ul>
        </div>

        {/* Status Messages */}
        {msg.text && (
          <div
            className={`mt-4 rounded px-4 py-3 text-sm ${
              msg.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              UPI ID *
            </label>
            <input
              type="text"
              placeholder="e.g., name@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount (₹) *
            </label>
            <input
              type="number"
              min={100}
              step={1}
              placeholder="Minimum ₹100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-900 hover:bg-blue-500 text-white font-semibold rounded-full shadow disabled:opacity-70"
            >
              {loading ? 'Submitting...' : 'Withdraw Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Withdrawal;
