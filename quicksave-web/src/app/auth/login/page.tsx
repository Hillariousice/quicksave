"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, ArrowRight, Activity } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

   const result = await signIn("credentials", {
  redirect: false,
  email,
  password,
});

if (result?.error) {
  // result.error will now contain "Incorrect current password" 
  // or "Please verify your email" instead of just a 401 code
  setError(result.error); 
} else {
  router.push("/dashboard");
}
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center relative font-sans text-gray-300">
      
      {/* Top Left Branding */}
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <Shield className="w-6 h-6 text-[#FF8C00]" />
        <span className="text-[#FF8C00] font-bold tracking-widest text-lg">QUICKSAVE</span>
      </div>

      {/* Top Right Security Node */}
      <div className="absolute top-8 right-8 flex items-center gap-2 text-xs text-gray-500">
        <Lock className="w-3 h-3" />
        <span>Secure Node</span>
      </div>

      {/* Login Card */}
      <div className="bg-[#11181C] w-full max-w-md p-10 rounded-2xl shadow-2xl border border-gray-800">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Admin Console</h1>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Authorized personnel access only</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                placeholder="name@quicksave.security"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-gray-800 text-white text-sm rounded-lg focus:ring-[#FF8C00] focus:border-[#FF8C00] block p-3 pl-10 transition-colors"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
              <a href="#" className="text-xs text-[#FF8C00] hover:underline">Forgot Password?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-gray-800 text-white text-sm rounded-lg focus:ring-[#FF8C00] focus:border-[#FF8C00] block p-3 pl-10 transition-colors"
                required
              />
            </div>
          </div>

          {/* Checkbox */}
          {/* <div className="flex items-center">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-800 bg-[#1A1A1A] text-[#FF8C00] focus:ring-[#FF8C00]" />
            <label className="ml-2 text-xs text-gray-400">Remember this device</label>
          </div> */}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 text-black bg-[#FF8C00] hover:bg-[#e67e00] font-bold rounded-lg text-sm px-5 py-3 transition-colors disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* System Status */}
        <div className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span className="text-xs text-gray-500">System Status: <span className="text-emerald-500 font-medium">All Nodes Operational</span></span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-8 left-8 text-xs text-gray-600">
        © 2026 Quicksave Security. All rights reserved.
      </div>
      <div className="absolute bottom-8 right-8 flex gap-4 text-xs text-gray-600">
        <a href="#" className="hover:text-gray-400">Privacy Policy</a>
        <a href="#" className="hover:text-gray-400">Terms of Service</a>
        <a href="#" className="hover:text-gray-400">Contact Support</a>
      </div>

      {/* Fake IP Logger (As seen in Figma) */}
      {/* <div className="absolute bottom-16 text-center w-full text-[10px] text-gray-700">
        Your IP address 192.168.1.1 is being logged for security auditing.
      </div> */}
    </div>
  );
}