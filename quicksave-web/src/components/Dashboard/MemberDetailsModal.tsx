/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { X, Mail, Phone, MapPin, Calendar, AlertTriangle, Activity,AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function MemberDetailsModal({ memberId, onClose, token }: any) {
  const { data: session }: any = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPromoting, setIsPromoting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false); 

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (memberId && token) {
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/members/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    }
  }, [memberId, token]);

   const handlePromote = async () => {
    setIsPromoting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/members/${memberId}/promote`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        alert("Success! User has been promoted to Admin.");
        setShowConfirm(false);
        onClose(); // Close modal to refresh list
      } else {
        alert(result.message);
      }
    } catch (e) {
      alert("Promotion failed. Network error.");
    } finally {
      setIsPromoting(false);
    }
  };

  if (!memberId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
       {showConfirm && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-[#1A2126] p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-sm text-center">
            <AlertCircle className="w-12 h-12 text-[#FF8C00] mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Confirm Promotion</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to make <b>{data?.name}</b> an Admin? They will have access to all management tools.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handlePromote}
                disabled={isPromoting}
                className="flex-1 px-4 py-2 text-sm font-bold bg-[#FF8C00] text-black rounded-lg hover:bg-[#e67e00] disabled:opacity-50"
              >
                {isPromoting ? "Processing..." : "Yes, Promote"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#11181C] w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col transition-colors min-h-[400px]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Member Intelligence</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20">
            <Activity className="w-8 h-8 text-[#FF8C00] animate-spin mb-4" />
            <p className="text-gray-500 text-sm font-bold tracking-widest">FETCHING DATA...</p>
          </div>
        ) : data ? (
          <div className="p-8 overflow-y-auto max-h-[80vh]">
            {/* PROFILE HEADER */}
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <img src={data.avatar} alt="avatar" className="w-16 h-16 rounded-full border-2 border-[#FF8C00]" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{data.name}</h3>
                  <p className="text-sm text-[#FF8C00]">{data.tier}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 border border-[#FF8C00] text-[#FF8C00] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#FF8C00]/10 transition-colors">
                  <Mail className="w-4 h-4" /> Message
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* LEFT COL: PERSONAL INFO */}
              <div className="space-y-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">PERSONAL INFORMATION</h4>
                <div className="space-y-4 text-sm text-gray-900 dark:text-white">
                  <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-gray-500" /> {data.phone}</div>
                  <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-gray-500" /> {data.email}</div>
                  <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-gray-500" /> {data.location}</div>
                  <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-gray-500" /> Joined {data.joinedDate}</div>
                </div>

                {/* ACCOUNT HEALTH */}
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider pt-4">ACCOUNT HEALTH</h4>
                <div className="bg-gray-50 dark:bg-[#1A2126] p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Reliability Score</span>
                    <span className="text-sm font-bold text-[#FF8C00]">{data.reliabilityScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full mb-3">
                    <div className="bg-[#FF8C00] h-2 rounded-full" style={{ width: `${data.reliabilityScore}%` }}></div>
                  </div>
                </div>
              </div>

              {/* RIGHT COL: STATS & ACTIVITY */}
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1 bg-gray-50 dark:bg-[#1A2126] p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">Account Balance</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">₦{data.totalSaved?.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-[#1A2126] p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">Active Groups</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{data.activeGroups} Groups</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">RECENT ACTIVITIES</h4>
                  <div className="space-y-3">
                    {data.recentActivity && data.recentActivity.length > 0 ? (
                      data.recentActivity.map((act: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-800/50 pb-2">
                          <span className="text-gray-900 dark:text-white">{act.title}</span>
                          <span className={act.isPositive ? 'text-emerald-500 font-bold' : 'text-red-400'}>{act.amount}</span>
                          <span className="text-xs text-gray-500">{act.date}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic">No recent activity found.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center text-red-500">Failed to load member details.</div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end bg-gray-50 dark:bg-[#1A2126]">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors">
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
}
