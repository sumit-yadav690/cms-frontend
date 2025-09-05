import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/+$/, "");

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailToDisplayName = (addr) => {
    const prefix = (addr || "").split("@")[0] || "";
    const spaced = prefix.replace(/[._-]+/g, " ").trim();
    const titled = spaced.replace(/\b\w/g, (c) => c.toUpperCase());
    return titled || "User";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });

      const ct = res.headers.get("content-type");
      const isJson = typeof ct === "string" && ct.toLowerCase().includes("application/json");
      if (!isJson) {
        const text = await res.text();
        throw new Error(`Server did not return JSON (${res.status}). ${text.slice(0, 120)}`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed");

      const displayName = emailToDisplayName(data?.user?.email || email);

      // --- SAVE important items ---
      const sid = data?.user?._id || "";           // <- student id from backend
      if (sid) {
        localStorage.setItem("studentId", sid);    // <- use this key everywhere
        localStorage.setItem("userId", sid);       // (optional) backward-compat
      }

      if (data?.token) localStorage.setItem("authToken", data.token);
      localStorage.setItem("userEmail", data?.user?.email || email);
      localStorage.setItem("phone", data?.user?.phone || phone);
      localStorage.setItem("displayName", displayName);

      // Optional quick UI cache
      if (data?.user?.referralCode) localStorage.setItem("activeReferralCode", data.user.referralCode);
      if (typeof data?.user?.studentCount !== "undefined") localStorage.setItem("studentCount", String(data.user.studentCount));
      if (typeof data?.user?.reward !== "undefined") localStorage.setItem("userReward", String(data.user.reward));

      // Admin shortcut (aapke sample ke hisaab se)
      const adminCredentials = { email: "admin@placify-connect.com", phone: "9087654321" };
      if (email === adminCredentials.email && phone === adminCredentials.phone) {
        navigate("/admin");
      } else {
        navigate("/student");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('../src/assets/login-bg.png')" }}
    >
      <div className="bg-white/90 p-8 rounded-lg shadow-lg max-w-sm w-full">
        <div className="bg-blue-500 text-white text-center py-2 rounded-t-lg -mt-8 -mx-8 mb-6">
          <h2 className="text-lg font-semibold">Login Form</h2>
        </div>

        {error && <div className="bg-red-100 text-red-600 p-2 rounded mb-4 text-center">{error}</div>}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email (e.g., sumit@placify-connect.com)"
            className="w-full mb-4 p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="text"
            placeholder="Phone (Enter admin phone or your phone)"
            className="w-full mb-4 p-2 border rounded"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoComplete="tel"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white p-2 rounded"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
