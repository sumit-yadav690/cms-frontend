import React, { useEffect, useMemo, useState } from 'react';

const BASE_URL = (import.meta.env.VITE_BASE_URL || '').replace(/\/+$/, '');

const StatTile = ({ title, value, subtitle }) => (
  <div className="bg-white rounded-xl shadow p-4 text-center">
    <p className="text-2xl font-bold">{value}</p>
    <p className="font-semibold">{title}</p>
    {subtitle ? <p className="text-xs text-gray-500 mt-1">{subtitle}</p> : null}
  </div>
);

// All tiers = blue theme
const TierCard = ({ tone = 'from-blue-300 to-blue-400', title, headline, note, big=false }) => (
  <div className={`rounded-2xl shadow-lg p-5 text-white bg-gradient-to-br ${tone} ${big ? 'md:col-span-2' : ''}`}>
    <div className="flex items-center gap-2 text-sm opacity-90">
      <span>🎯</span>
      <span className="font-medium">{title}</span>
    </div>
    <div className="mt-2 text-2xl md:text-3xl font-extrabold">{headline}</div>
    {note ? <div className="mt-3 text-xs opacity-90">{note}</div> : null}
  </div>
);

const Pill = ({ children, className = '' }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${className}`}>{children}</span>
);

const Referal = () => {
  // core state
  const [referralCode, setReferralCode] = useState('');
  const [studentCount, setStudentCount] = useState(0);
  const [rewardPoints, setRewardPoints] = useState(0);

  // form state
  const [friendName, setFriendName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [friendPhone, setFriendPhone] = useState('');
  const [sharingReferralCode, setSharingReferralCode] = useState('');
  const [sharingStatus, setSharingStatus] = useState('');

  // history state
  const [referrals, setReferrals] = useState([]);
  const [referralsLoading, setReferralsLoading] = useState(false);

  // loading flags
  const [loadingCode, setLoadingCode] = useState(false);
  const [loginFetchError, setLoginFetchError] = useState('');

  // auth + env
  const token = useMemo(() => localStorage.getItem('authToken') || '', []);
  const REF_FORM_URL = import.meta.env.VITE_REFERRAL_FORM_URL || '';

  // --- Direct fetch from /user/login using saved email/phone ---
  const fetchUserFromLogin = async () => {
    const email = localStorage.getItem('userEmail') || '';
    const phone = localStorage.getItem('phone') || '';
    if (!BASE_URL || !email || !phone) {
      throw new Error('Missing BASE_URL or saved login credentials.');
    }

    const res = await fetch(`${BASE_URL}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Login re-fetch failed');

    const code = data?.user?.referralCode || '';
    const sc = Number(data?.user?.studentCount || 0);
    const rw = Number(data?.user?.reward || 0);

    setReferralCode(code);
    setSharingReferralCode((prev) => prev || code);
    setStudentCount(sc);
    setRewardPoints(rw);

    if (code) localStorage.setItem('activeReferralCode', code);
    localStorage.setItem('studentCount', String(sc));
    localStorage.setItem('userReward', String(rw));
    if (data?.token) localStorage.setItem('authToken', data.token);
  };

  // Fallback to your old /referral/share GET if needed
  const fetchCodeFallback = async () => {
    if (!BASE_URL) return;
    const url = `${BASE_URL}/referral/share?ngrok-skip-browser-warning=true&_=${Date.now()}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to fetch referral code');

    const code =
      data?.referralCode ||
      data?.data?.referralCode ||
      data?.user?.referralCode ||
      '';

    if (code) {
      setReferralCode(code);
      setSharingReferralCode((prev) => prev || code);
      localStorage.setItem('activeReferralCode', code);
    }
  };

  // 👇 Fetch referral history
  const fetchReferrals = async () => {
    try {
      setReferralsLoading(true);
      const res = await fetch(`${BASE_URL}/referral/list`, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const arr = data?.data || data?.referrals || (Array.isArray(data) ? data : []);
      const mapped = arr.map((r) => ({
        name: r.friendName || r.name || '',
        email: r.friendEmail || r.email || '',
        phone: r.friendPhone || r.phone || '',
        status: 'Success', // 👈 force success
        createdAt: r.createdAt || r.date || r.updatedAt || null,
      }));
      setReferrals(mapped);
    } catch {
      setReferrals([]); // fail → empty, no error
    } finally {
      setReferralsLoading(false);
    }
  };

  // On mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingCode(true);
        await fetchUserFromLogin();
      } catch (err) {
        if (!cancelled) setLoginFetchError((err && err.message) || 'Login re-fetch failed');
        try {
          await fetchCodeFallback();
        } catch {}
      } finally {
        if (!cancelled) setLoadingCode(false);
        if (!cancelled) fetchReferrals();
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  // submit share
  const handleShareReferral = async () => {
    const codeToUse = sharingReferralCode || referralCode;
    if (!friendName || !friendEmail || !friendPhone || !codeToUse) {
      setSharingStatus('Please fill all the details.');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/referral/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          friendName,
          friendEmail,
          friendPhone,
          referralCode: codeToUse,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Failed to share referral');

      setSharingStatus('Referral shared successfully!');
      setFriendName(''); setFriendEmail(''); setFriendPhone('');
      setSharingReferralCode(referralCode || codeToUse || '');

      const newRec = {
        name: friendName,
        email: friendEmail,
        phone: friendPhone,
        status: 'Success', // 👈 always success
        createdAt: new Date().toISOString(),
      };
      setReferrals((prev) => [newRec, ...prev]);
    } catch (error) {
      setSharingStatus(error.message || 'Something went wrong.');
    }
  };

  // copy
  const handleCopy = async () => {
    try {
      const code = referralCode || sharingReferralCode || '';
      await navigator.clipboard.writeText(code);
      alert('Referral code copied!');
    } catch {
      alert('Could not copy. Please select & copy manually.');
    }
  };

  // google form
  const onSendGoogleForm = () => {
    if (!REF_FORM_URL) return;
    const code = referralCode || sharingReferralCode || '';
    const url = `${REF_FORM_URL}${REF_FORM_URL.includes('?') ? '&' : '?'}ref=${encodeURIComponent(code)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // progress tiles
  const successfulReferrals = Number(studentCount || 0);
  const neededForNext = Math.max(0, 3 - successfulReferrals);
  const invited = successfulReferrals;
  const progressPct = Math.min(100, Math.round((invited / (successfulReferrals + Math.max(1, neededForNext))) * 100));

  const formatDate = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString(); }
    catch { return String(iso); }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-8 px-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg border border-yellow-300 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-700 to-blue-700 text-white py-6 text-center">
          <div className="text-2xl font-extrabold">🎁 Refer & Earn Amazing Rewards!</div>
          <p className="text-sm mt-1 opacity-90">
            Invite friends and earn exclusive rewards from smartwatches to iPhone 16 Pro Max
          </p>
        </div>

        {/* Referral Progress */}
        <div className="bg-yellow-400/20 p-6">
          <h2 className="font-bold text-lg mb-4">🏆 Your Referral Progress</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile title="Successful Referrals" value={successfulReferrals} />
            <StatTile title="Next Reward" value="Smartwatch (₹5,000)" />
            <StatTile title="Referrals Needed" value={neededForNext} />
            <StatTile title="Reward Points" value={rewardPoints} />
          </div>
          <div className="mt-6">
            <div className="w-full bg-white rounded-full h-3 shadow-inner">
              <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="mt-2 text-sm text-center font-medium">Progress to Next Reward</p>
          </div>
        </div>

        {/* Reward Tiers */}
        <div className="px-6 py-8">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">🎯 Reward Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TierCard big title="Mega Contest • Just 300 Referral = Contest Eligibility" headline="Audi Car!" note="📅 Winner Announcement: 21st August 2025" />
            <TierCard title="Smartwatch" headline="3 Referrals" note="Worth ₹5,000" />
            <TierCard title='65" Sony Bravia' headline="50 Referrals" note="Premium Quality" />
            <TierCard title="Mac Book" headline="15 Referrals" note="Latest Model" />
            <TierCard title="iPhone 16" headline="30 Referrals" note="Ultimate Reward!" />
          </div>
        </div>

        {/* Refer a Friend */}
        <div className="bg-blue-50 p-6">
          <h2 className="text-center font-bold text-lg mb-4">📩 Refer a Friend</h2>
          <div className="bg-white p-5 rounded-2xl shadow">
            <div className="bg-yellow-100 text-yellow-900 rounded-xl p-3 text-center font-medium mb-4">
              ✨ Easy Referral Process! – Click the buttons below to send them our Google Form for quick registration
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Friend's Full Name" className="border p-2 rounded-lg w-full"
                value={friendName} onChange={(e) => setFriendName(e.target.value)} />
              <input type="email" placeholder="friend@example.com" className="border p-2 rounded-lg w-full"
                value={friendEmail} onChange={(e) => setFriendEmail(e.target.value)} />
              <input type="tel" placeholder="10-digit phone number" className="border p-2 rounded-lg w-full"
                value={friendPhone} onChange={(e) => setFriendPhone(e.target.value)} />
              <input type="text" placeholder="Referral Code" className="border p-2 rounded-lg w-full md:col-span-2"
                value={sharingReferralCode || referralCode} onChange={(e) => setSharingReferralCode(e.target.value)} />
            </div>

            <div className="flex flex-col md:flex-row justify-center gap-4 mt-5">
              <button onClick={handleShareReferral} className="bg-blue-900 text-white px-5 py-2 rounded-lg hover:opacity-95">
                📝 Record Referral
              </button>
            </div>

            {sharingStatus && (
              <div className={`mt-4 text-center ${sharingStatus.toLowerCase().includes('success') ? 'text-green-600' : 'text-red-500'}`}>
                {sharingStatus}
              </div>
            )}
          </div>
        </div>

        {/* Your Referral Code */}
        <div className="bg-[#7a001f] text-white p-6 text-center">
          <h2 className="font-bold text-xl">🔗 Your Referral Code</h2>
          <div className="max-w-xl mx-auto mt-3 bg-[#9b1537] rounded-full px-6 py-3 font-mono text-lg tracking-widest">
            {loadingCode ? 'loading...' : ((referralCode || sharingReferralCode) || '—')}
          </div>
          <div className="mt-4">
            <button className={`bg-yellow-400 text-black font-semibold px-5 py-2 rounded-lg shadow ${!(referralCode || sharingReferralCode) ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'}`}
              onClick={handleCopy} disabled={!(referralCode || sharingReferralCode)}>
              📋 Copy Code
            </button>
          </div>
          <p className="mt-3 text-sm opacity-90">Share this code with friends when they join Placify</p>
        </div>

        {/* My Referrals */}
        <div className="p-6">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">👥 My Referrals</h2>
          {referralsLoading && <div className="text-center text-sm text-gray-600">Loading…</div>}
          {!referralsLoading && referrals.length === 0 && (
            <p className="text-center text-gray-500">No referral history.</p>
          )}
          <div className="space-y-3">
            {referrals.map((r, idx) => (
              <div key={idx} className="bg-white border rounded-2xl shadow-sm p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{r.name || '—'}</div>
                  <div className="text-sm text-gray-600">
                    {r.email && <span className="underline">{r.email}</span>}
                    {r.phone && <> • {r.phone}</>}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{formatDate(r.createdAt)}</div>
                </div>
                <Pill className="bg-emerald-100 text-emerald-700">Success</Pill>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Referal;
