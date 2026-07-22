"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Key, Mail, Phone, User as UserIcon, Lock, ArrowRight } from "lucide-react";

export default function SetupSuperAdmin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", phone: "", email: "", password: "", secretKey: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Hit your backend's public setup route (assuming admin.routes is mounted at /admin)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/setup-super`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000); // Redirect to login after 2s
      } else {
        setError(result.message || "Failed to create Super Admin.");
      }
    } catch (err: any) {
      setError("Network error. Could not reach backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 font-sans">
      
      <div className="bg-[#11181C] w-full max-w-xl p-10 rounded-2xl shadow-2xl border border-[#FF8C00]/30">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FF8C00]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#FF8C00]/20">
            <Shield className="w-8 h-8 text-[#FF8C00]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Initialize Platform</h1>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Create Master Super Admin Account</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg mb-6 text-center">{error}</div>}
        {success && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm p-3 rounded-lg mb-6 text-center">Super Admin Created! Redirecting to login...</div>}

        <form onSubmit={handleSetup} className="space-y-5">
          
          {/* THE MASTER SECRET KEY */}
          <div>
            <label className="block text-xs font-bold text-[#FF8C00] uppercase tracking-wider mb-2">Master Setup Key</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF8C00]" />
              <input type="password" name="secretKey" placeholder="Enter ADMIN_SETUP_KEY from Railway" value={formData.secretKey} onChange={handleChange} className="w-full bg-[#1A1A1A] border border-[#FF8C00]/50 text-white text-sm rounded-lg focus:ring-[#FF8C00] outline-none block p-3 pl-10" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">First Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-[#1A1A1A] border border-gray-800 text-white text-sm rounded-lg focus:ring-[#FF8C00] outline-none p-3 pl-10" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Last Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-[#1A1A1A] border border-gray-800 text-white text-sm rounded-lg focus:ring-[#FF8C00] outline-none p-3 pl-10" required />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-[#1A1A1A] border border-gray-800 text-white text-sm rounded-lg focus:ring-[#FF8C00] outline-none p-3 pl-10" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-[#1A1A1A] border border-gray-800 text-white text-sm rounded-lg focus:ring-[#FF8C00] outline-none p-3 pl-10" required />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Secure Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full bg-[#1A1A1A] border border-gray-800 text-white text-sm rounded-lg focus:ring-[#FF8C00] outline-none p-3 pl-10" required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 text-black bg-[#FF8C00] hover:bg-[#e67e00] font-bold rounded-lg text-sm px-5 py-3 mt-4 disabled:opacity-50">
            {loading ? "INITIALIZING..." : "CREATE MASTER ADMIN"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

      </div>
    </div>
  );
}