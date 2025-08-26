import React, { useRef, useState } from "react";
import Navbar from "../component/Navbar";
import Referal from "./Referal";
import Withdrawal from "./Withdrawal";
import { FaFacebookF, FaEnvelope, FaPlus } from "react-icons/fa";
import { SiMastodon } from "react-icons/si";

const BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/+$/, ""); // trim trailing slash

const Studentlogin = () => {
  const [showReferral, setShowReferral] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);

  const referralRef = useRef(null);
  const withdrawalRef = useRef(null);

  // BACKEND FIELDS:
  // studentName, dob(YYYY-MM-DD), gender, phone, email, city, state,
  // courseApplied, admissionYear(number), college
  const [formData, setFormData] = useState({
    studentName: "",
    dob: "",
    gender: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    courseApplied: "",
    admissionYear: "",
    college: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" }); // {type: 'success'|'error', text: string}
  const [createdInfo, setCreatedInfo] = useState(null); // {studentId, reward}

  const handleChange = (e) => {
    const { name, value } = e.target;

    // sanitize phone to digits only
    if (name === "phone") {
      return setFormData((p) => ({ ...p, phone: value.replace(/\D/g, "").slice(0, 15) }));
    }

    // limit admissionYear to 4 digits
    if (name === "admissionYear") {
      const digits = value.replace(/\D/g, "").slice(0, 4);
      return setFormData((p) => ({ ...p, admissionYear: digits }));
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setCreatedInfo(null);

    try {
      if (!BASE_URL) throw new Error("VITE_BASE_URL missing. Add it in .env and restart dev server.");
      setLoading(true);

      const token = localStorage.getItem("authToken") || "";

      const payload = {
        studentName: formData.studentName,
        dob: formData.dob, // yyyy-mm-dd (input type="date")
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        city: formData.city,
        state: formData.state,
        courseApplied: formData.courseApplied,
        admissionYear: formData.admissionYear ? Number(formData.admissionYear) : undefined,
        college: formData.college,
      };

      const res = await fetch(`${BASE_URL}/user/addstudent?ngrok-skip-browser-warning=true`, {
  method: "POST",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify(payload),
  cache: "no-store",
});


      const ctype = res.headers.get("content-type")?.toLowerCase() || "";
      if (!ctype.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Server did not return JSON (${res.status}). ${text.slice(0, 180)}`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to submit student");

      // Show success + reward/studentId
      setMsg({ type: "success", text: data?.message || "Student added successfully" });
      setCreatedInfo({
        studentId: data?.student?.studentId,
        reward: data?.reward,
      });

      // Reset form (keep email/phone if you prefer)
      setFormData({
        studentName: "",
        dob: "",
        gender: "",
        phone: "",
        email: "",
        city: "",
        state: "",
        courseApplied: "",
        admissionYear: "",
        college: "",
      });
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const toggleReferral = () => {
    setShowReferral((prev) => !prev);
    setShowWithdrawal(false);
    setTimeout(() => referralRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  const toggleWithdrawal = () => {
    setShowWithdrawal((prev) => !prev);
    setShowReferral(false);
    setTimeout(() => withdrawalRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar onReferralClick={toggleReferral} onWithdrawalClick={toggleWithdrawal} />

      <main className="flex-1">
        {/* Student Form Section */}
        <div className="flex justify-center items-center py-10">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-yellow-400 w-full max-w-3xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-cyan-500 rounded-t-2xl p-6 text-center">
              <h1 className="text-2xl font-bold text-white">Student Application Portal</h1>
              <p className="text-gray-200">Process new Student applications accurately</p>
            </div>

            {/* Alerts */}
            {msg.text && (
              <div
                className={`mx-6 mt-4 rounded px-4 py-3 text-sm ${
                  msg.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                }`}
              >
                {msg.text}
                {createdInfo?.studentId && (
                  <span className="block">
                    Assigned Student ID: <b>{createdInfo.studentId}</b>
                  </span>
                )}
                {typeof createdInfo?.reward === "number" && (
                  <span className="block">Updated Reward: <b>₹{createdInfo.reward}</b></span>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Student Name *</label>
                <input
                  type="text"
                  name="studentName"
                  placeholder="Enter full name as per documents"
                  value={formData.studentName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>

              {/* Row: DOB + Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 bg-white"
                  >
                    <option value="" disabled>
                      Select gender
                    </option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              {/* Row: Phone + Email */}
              <div className="grid grid-cols-1 md-grid-cols-2 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="applicant@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* Row: City + State */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City *</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="e.g., Mumbai"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State *</label>
                  <input
                    type="text"
                    name="state"
                    placeholder="e.g., Maharashtra"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* Row: Course + Admission Year */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Course Applied *</label>
                  <input
                    type="text"
                    name="courseApplied"
                    placeholder="e.g., B.Tech CSE"
                    value={formData.courseApplied}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Admission Year *</label>
                  <input
                    type="text"
                    name="admissionYear"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    placeholder="e.g., 2025"
                    value={formData.admissionYear}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* College */}
              <div>
                <label className="block text-sm font-medium text-gray-700">College *</label>
                <input
                  type="text"
                  name="college"
                  placeholder="e.g., IIT Bombay"
                  value={formData.college}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-900 py-3 px-6 rounded-full text-white font-semibold  shadow-lg disabled:opacity-70"
                >
                  {loading ? "Submitting..." : "✅ Submit Entry (+₹2 Earning)"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Conditional Sections */}
        <div className="px-4">
          <div ref={referralRef}>{showReferral && <Referal />}</div>
          <div ref={withdrawalRef}>{showWithdrawal && <Withdrawal />}</div>
        </div>
      </main>

      {/* Footer content directly in this file */}
      <footer className="bg-gray-50 border-t shadow-sm mt-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center px-6 py-6">
          {/* Left - Social Icons */}
          <div className="flex space-x-3">
            <a href="#" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded" aria-label="Facebook">
              <FaFacebookF size={18} />
            </a>
            <a href="#" className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded" aria-label="Mastodon">
              <SiMastodon size={18} />
            </a>
            <a href="mailto:info@placify.com" className="bg-gray-400 hover:bg-gray-500 text-white p-2 rounded" aria-label="Email">
              <FaEnvelope size={18} />
            </a>
            <a href="#" className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded" aria-label="More">
              <FaPlus size={18} />
            </a>
          </div>

          {/* Right - Copyright */}
          <div className="text-center md:text-right text-sm text-gray-500 mt-3 md:mt-0">
            © 2019-2025 <span className="font-semibold text-teal-700">Placify Data Solutions</span> | Professional Data Management Platform
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Studentlogin;
