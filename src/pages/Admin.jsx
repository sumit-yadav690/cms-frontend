import React, { useRef, useEffect, useState, useCallback } from 'react';
import Adminformtimer from '../component/Adminformtimer';

const BASE_URL = (import.meta.env.VITE_BASE_URL || '').replace(/\/+$/, '');

const Admin = () => {
  // Refs for different sections
  const userListRef = useRef(null);
  const referralListRef = useRef(null);
  const withdrawalRef = useRef(null);

  // State
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

  const [usersError, setUsersError] = useState('');
  const [withdrawalsError, setWithdrawalsError] = useState('');

  // Scroll helper
  const scrollToSection = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth' });

  // --- small helper: robust date formatting (handles ISO, ms, seconds) ---
  const normalizeDate = (val) => {
    if (!val && val !== 0) return '-';
    // numbers / numeric strings → epoch
    const n = typeof val === 'number' ? val : Number(val);
    if (Number.isFinite(n)) {
      const ms = n < 1e12 ? n * 1000 : n; // seconds → ms
      const d = new Date(ms);
      return isNaN(d.getTime()) ? String(val) : d.toLocaleString();
    }
    // try Date parse
    const d = new Date(val);
    return isNaN(d.getTime()) ? String(val) : d.toLocaleString();
  };

  // ------- USERS -------
  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      setUsersError('');

      if (!BASE_URL) {
        throw new Error('VITE_BASE_URL is not set. Add it to .env and restart dev server.');
      }

      const token = localStorage.getItem('authToken') || '';
      const url = `${BASE_URL}/user/getallusers?ngrok-skip-browser-warning=true&_=${Date.now()}`;

      const headers = {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(url, { method: 'GET', headers, cache: 'no-store' });

      const ctype = res.headers.get('content-type')?.toLowerCase() || '';
      if (!ctype.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Server did not return JSON (${res.status}). ${text.slice(0, 160)}`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load users');

      const listRaw = Array.isArray(data) ? data : data?.users || [];
      const list = [...listRaw].sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return tb - ta;
      });

      setUsers(list);
    } catch (err) {
      setUsersError(err.message || 'Something went wrong');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // ------- WITHDRAWALS -------
  const loadWithdrawals = useCallback(async () => {
    try {
      setLoadingWithdrawals(true);
      setWithdrawalsError('');

      const url = `${BASE_URL}/withdraw/all?ngrok-skip-browser-warning=true&_=${Date.now()}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        cache: 'no-store',
      });

      const ctype = res.headers.get('content-type')?.toLowerCase() || '';
      if (!ctype.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Server did not return JSON (${res.status}). ${text.slice(0, 160)}`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load withdrawal requests');

      // API shape: { requests: [] }  (fallback: [] if array returned directly)
      const list = Array.isArray(data) ? data : (data?.requests || []);
      setWithdrawals(list);
    } catch (err) {
      setWithdrawalsError(err.message || 'Something went wrong');
    } finally {
      setLoadingWithdrawals(false);
    }
  }, []);

  // initial load
  useEffect(() => {
    loadUsers();
    loadWithdrawals();
  }, [loadUsers, loadWithdrawals]);

  // reload when tab visible again
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadUsers();
        loadWithdrawals();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadUsers, loadWithdrawals]);

  return (
    <>
      {/* Header */}
      <div className="grid grid-cols-12 bg-blue-500 sticky top-0 z-50">
        <div className="col-span-5 flex items-center justify-center">
          <h1 className="text-3xl font-bold text-yellow-300">PLACIFY CONNECT</h1>
        </div>
        <div className="col-span-6">
          <div className="flex items-center justify-around py-6 text-2xl text-white">
            <button onClick={() => scrollToSection(userListRef)}>User List</button>
            <button onClick={() => scrollToSection(withdrawalRef)}>Withdrawal Request</button>
          </div>
        </div>
        <div className="col-span-2"></div>
      </div>

      <div className='flex items-center justify-end p-9'>
        <Adminformtimer/>
      </div>

      {/* USER LIST */}
      <div ref={userListRef} className="bg-gray-100">
        <div className="py-20 flex items-center justify-center gap-3">
          <h1 className="text-4xl font-bold">User List Section</h1>
          <button
            onClick={loadUsers}
            className="ml-4 px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 shadow"
            title="Refresh"
          >
            Refresh
          </button>
        </div>

        <div className="relative overflow-x-auto">
          {usersError && (
            <div className="mx-4 mb-3 p-3 rounded bg-red-100 text-red-700 text-sm">
              {usersError}
            </div>
          )}
          {loadingUsers && (
            <div className="mx-4 mb-3 p-3 rounded bg-blue-100 text-blue-700 text-sm">
              Loading users...
            </div>
          )}

          <table className="w-full text-sm text-left rtl:text-right text-gray-700">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Reward</th>
                <th className="px-6 py-3">Students</th>
                <th className="px-6 py-3">Referral Code</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {!loadingUsers && !usersError && users?.length === 0 && (
                <tr className="bg-white border-b border-gray-200">
                  <td className="px-6 py-4 text-gray-500" colSpan={7}>
                    No users found.
                  </td>
                </tr>
              )}

              {users?.map((u) => (
                <tr key={u._id || `${u.email}-${u.phone}`} className="bg-white border-b border-gray-200">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{u.email || '-'}</td>
                  <td className="px-6 py-4">{u.phone || '-'}</td>
                  <td className="px-6 py-4">{typeof u.reward === 'number' ? u.reward : '-'}</td>
                  <td className="px-6 py-4">{typeof u.studentCount === 'number' ? u.studentCount : '-'}</td>
                  <td className="px-6 py-4">{u.referralCode || '-'}</td>
                  <td className="px-6 py-4">{u.role || '-'}</td>
                  <td className="px-6 py-4">
                    {u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WITHDRAWAL SECTION */}
      <div ref={withdrawalRef} className="bg-gray-300">
        <div className="flex items-center justify-center py-20">
          <h1 className="text-4xl font-bold">Withdrawal Request Section</h1>
        </div>

        <div className="relative overflow-x-auto">
          {withdrawalsError && (
            <div className="mx-4 mb-3 p-3 rounded bg-red-100 text-red-700 text-sm">
              {withdrawalsError}
            </div>
          )}
          {loadingWithdrawals && (
            <div className="mx-4 mb-3 p-3 rounded bg-blue-100 text-blue-700 text-sm">
              Loading withdrawal requests...
            </div>
          )}

          <table className="w-full text-sm text-left rtl:text-right text-gray-700">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Request ID</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Requested By</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {!loadingWithdrawals && withdrawals?.length === 0 && !withdrawalsError && (
                <tr className="bg-white border-b border-gray-200">
                  <td className="px-6 py-4" colSpan={5}>
                    No withdrawal requests.
                  </td>
                </tr>
              )}

              {withdrawals?.map((req) => {
                // derive requester contact safely from common keys
                const email =
                  req.email ||
                  req.userEmail ||
                  req.contactEmail ||
                  (req.user && (req.user.email || req.user.userEmail)) ||
                  (req.requestedBy && (req.requestedBy.email || req.requestedBy.userEmail)) ||
                  '-';

                const phone =
                  req.phone ||
                  req.mobile ||
                  req.userPhone ||
                  (req.user && (req.user.phone || req.user.mobile || req.user.userPhone)) ||
                  (req.requestedBy && (req.requestedBy.phone || req.requestedBy.mobile || req.requestedBy.userPhone)) ||
                  '';

                // choose best available date-like field
                const dateRaw =
                  req.date ||
                  req.createdAt ||
                  req.created_on ||
                  req.requestedAt ||
                  req.timestamp ||
                  req.updatedAt ||
                  null;

                return (
                  <tr key={req._id || req.requestId || req.id} className="bg-white border-b border-gray-200">
                    <td className="px-6 py-4">{req.requestId || req._id || req.id || '-'}</td>
                    <td className="px-6 py-4">{typeof req.amount === 'number' ? req.amount : (req.amount || '-')}</td>
                    <td className="px-6 py-4">{req.status || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{email}</div>
                      {phone ? <div className="text-xs text-gray-500">{phone}</div> : null}
                    </td>
                    <td className="px-6 py-4">{normalizeDate(dateRaw)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Admin;
