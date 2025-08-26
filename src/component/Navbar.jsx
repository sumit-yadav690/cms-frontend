import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/+$/, "");

const Navbar = ({ onReferralClick, onWithdrawalClick }) => {
  const navigate = useNavigate();

  const name = localStorage.getItem("displayName") || "User";
  const studentId = localStorage.getItem("studentId") || localStorage.getItem("userId"); // <- prefer studentId
  const token = localStorage.getItem("authToken");

  const [totalEntries, setTotalEntries] = useState(0);
  const [todayEntries, setTodayEntries] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // IST clock
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const istTime = useMemo(
    () =>
      now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
    [now]
  );

  // Fetch stats for this student
  useEffect(() => {
    if (!studentId) return;

    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${BASE_URL}/user/${studentId}/details`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: ctrl.signal,
        });

        const ct = res.headers.get("content-type");
        const isJson = typeof ct === "string" && ct.toLowerCase().includes("application/json");
        const data = isJson ? await res.json() : null;

        if (!res.ok) {
          const msg = data?.message || `HTTP ${res.status}`;
          throw new Error(msg);
        }

        const tEntries = Number(data?.totalStudents ?? data?.user?.studentCount ?? 0);
        const dEntries = Number(data?.todayStudents ?? 0);
        const earnings = Number(data?.totalReward ?? data?.user?.reward ?? 0);

        setTotalEntries(Number.isFinite(tEntries) ? tEntries : 0);
        setTodayEntries(Number.isFinite(dEntries) ? dEntries : 0);
        setTotalEarnings(Number.isFinite(earnings) ? earnings : 0);
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "Failed to load stats");
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [studentId, token]);

  const handleLogout = () => {
    localStorage.removeItem("displayName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("phone");
    localStorage.removeItem("authToken");
    localStorage.removeItem("studentId");
    localStorage.removeItem("userId");
    navigate("/login", { replace: true });
  };

  return (
    <div className="w-full shadow-md">
      {/* Top Navbar */}
      <div className="bg-gradient-to-r from-cyan-400 to-blue-600 text-white px-6 py-4 flex justify-between items-center">
        {/* Left Logo */}
        <div className="flex items-center">
          <h1 className="text-3xl font-bold text-gray-100">PLACIFY CONNECT</h1>
        </div>

        {/* Center Icons */}
        <div className="flex space-x-6 text-2xl">
          <span className="cursor-pointer">💻</span>
          <span className="cursor-pointer">📄</span>
          <span className="cursor-pointer">💰</span>
        </div>

        {/* Right User */}
        <div className="flex items-center space-x-4">
          <span className="text-sm">
            Welcome, <b>{name}</b>
          </span>
          <button
            onClick={handleLogout}
            className="border-2 border-yellow-300 text-yellow-200 px-4 py-1 rounded-full hover:bg-yellow-400 hover:text-black transition"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-600 text-white px-6 py-2 flex flex-wrap items-center justify-center gap-6 text-sm font-medium">
        <span>📑 Your Total Entries: <b>{loading ? "…" : totalEntries}</b></span>
        <span>🎯 Today’s Entries: <b>{loading ? "…" : `${todayEntries}/500`}</b></span>
        <span>💵 Total Earnings: <b>₹{loading ? "…" : totalEarnings}</b></span>
        <span>⏰ IST Time: <b>{istTime}</b></span>

        {/* Withdraw Button */}
        <button
          onClick={onWithdrawalClick}
          className="hover:underline cursor-pointer text-red-800 font-semibold"
        >
          🏦 Withdraw Money
        </button>

        {/* Referral Button */}
        <button
          onClick={onReferralClick}
          className="hover:underline cursor-pointer text-blue-900 font-semibold"
        >
          🎁 Refer & Earn
        </button>
      </div>

      {err && (
        <div className="bg-red-50 text-red-600 text-center py-2 text-sm">{err}</div>
      )}
    </div>
  );
};

export default Navbar;
