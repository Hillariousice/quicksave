/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Shield, DollarSign, Bell, Users, Key, Lock, X, 
  Activity, Loader2, Download, CheckCircle2, AlertCircle, Info 
} from "lucide-react";
import { downloadAdminReport } from "@/src/utils/export";

export default function FullSettingsPage() {
  const { data: session }: any = useSession();
  const [activeTab, setActiveTab] = useState("Security");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [modal, setModal] = useState<null | 'IP' | 'ADMIN' | 'FEE'>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      const result = await res.json();
      // Ensure we set data only if result.data exists
      if (result.success) {
        setData(result.data);
      }
    } catch (e) { 
      console.error("Fetch Error:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (session?.accessToken) fetchSettings();
  }, [session]);

  const updateSetting = async (payload: any) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/settings/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.accessToken}` },
        body: JSON.stringify(payload)
      });
      fetchSettings();
    } catch (e) { alert("Update failed"); }
  };

  // 1. Loader handles the absolute first render
  if (loading || !data) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="w-8 h-8 text-[#FF8C00] animate-spin" />
      <p className="text-gray-500 font-bold text-xs tracking-widest text-center">
        INITIALIZING SECURE CONNECTION...
      </p>
    </div>
  );

  // Safely extract arrays with fallbacks to prevent .length or .map crashes
  const whitelistedIPs = data?.config?.whitelistedIPs || [];
  const adminTeam = data?.adminTeam || [];

  return (
    <div className="space-y-6 relative">
      
      {/* MODAL OVERLAY - Remains same as previous */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#11181C] w-full max-w-md rounded-2xl border border-gray-800 p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Action Required</h2>
              <X className="cursor-pointer text-gray-500 hover:text-white" onClick={() => setModal(null)} />
            </div>
            <p className="text-gray-400 text-sm mb-6">Configure platform parameters below.</p>
            <button onClick={() => setModal(null)} className="w-full bg-[#FF8C00] text-black font-bold py-3 rounded-lg hover:bg-[#e67e00]">Confirm Changes</button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Platform Settings</h1>
          <p className="text-gray-500 text-sm">Global configurations for QuickSave operations.</p>
        </div>
        <button 
          onClick={() => downloadAdminReport('/admin/transactions/export', session.accessToken, 'System_Config.csv')}
          className="flex items-center gap-2 bg-white dark:bg-[#11181C] border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300"
        >
          <Download className="w-4 h-4" /> Export Config
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* TABS SIDEBAR */}
        <div className="w-full lg:w-64 space-y-2">
          {["Security", "Fees", "Admin Team", "Notifications"].map(tabId => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tabId 
                  ? "bg-[#FF8C00] text-black" 
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-[#11181C]"
              }`}
            >
              {tabId === "Security" && <Shield className="w-5 h-5" />}
              {tabId === "Fees" && <DollarSign className="w-5 h-5" />}
              {tabId === "Admin Team" && <Users className="w-5 h-5" />}
              {tabId === "Notifications" && <Bell className="w-5 h-5" />}
              {tabId}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-[500px]">

          {/* 1. SECURITY TAB */}
          {activeTab === "Security" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-[#11181C] p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <Key className="w-5 h-5 text-[#FF8C00]" /> Auth Policies
                  </h3>
                  <div className="space-y-4">
                    <ToggleRow 
                       title="Require 2FA for all admins" 
                       description="Mandatory for system access." 
                       active={data?.config?.require2FA} 
                       onToggle={() => updateSetting({ require2FA: !data.config.require2FA })}
                    />
                    <ToggleRow 
                       title="Enforce strong passwords" 
                       description="Min 12 chars + symbols." 
                       active={data?.config?.enforceStrongPasswords} 
                       onToggle={() => updateSetting({ enforceStrongPasswords: !data.config.enforceStrongPasswords })}
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-[#11181C] p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        <Lock className="w-5 h-5 text-[#FF8C00]" /> Whitelisted IPs
                    </h3>
                    <button onClick={() => setModal('IP')} className="text-xs font-bold text-[#FF8C00] hover:underline">+ ADD IP</button>
                  </div>
                  <div className="space-y-2">
                    {/* FIXED: Check whitelistedIPs array safely */}
                    {whitelistedIPs.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-gray-800 rounded-xl">
                        <p className="text-gray-500 text-sm italic">No IP restrictions active. The platform is accessible from any network.</p>
                      </div>
                    ) : (
                      whitelistedIPs.map((ip: any, idx: number) => (
                        <div key={ip.id || idx} className="flex justify-between p-3 bg-gray-50 dark:bg-[#1A2126] rounded-lg text-sm border border-gray-200 dark:border-gray-800">
                           <span className="font-bold text-gray-900 dark:text-white">{ip.name || 'Office Network'}</span>
                           <span className="text-gray-500 font-mono">{ip.ip}</span>
                           <span className="text-emerald-500 font-bold">ACTIVE</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-[#11181C] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 h-fit">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">System Integrity</h3>
                <div className="flex flex-col items-center gap-4 py-6">
                   <div className="w-24 h-24 rounded-full border-8 border-emerald-500 flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-900 dark:text-white">94%</span>
                   </div>
                   <p className="text-[10px] text-center text-gray-500 uppercase font-bold tracking-tighter">Node Security Optimal</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. FEES TAB */}
          {activeTab === "Fees" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatMini title="Total Fee Revenue" value={`₦${data?.revenueStats?.totalFeeRevenue?.toLocaleString() || '0'}`} />
                  <StatMini title="Current Fee Rate" value={`${data?.config?.contributionFee || '0'}%`} />
                  <StatMini title="Open Payouts" value={data?.revenueStats?.pendingPayouts || '0'} />
                </div>
                <div className="bg-white dark:bg-[#11181C] p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Fee Structures</h3>
                    <button onClick={() => setModal('FEE')} className="text-xs font-bold text-[#FF8C00]">EDIT RATES</button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-800">
                        <span className="text-gray-500">Contribution Fee (Automatic)</span>
                        <span className="font-bold text-[#FF8C00]">{data?.config?.contributionFee}%</span>
                    </div>
                    <div className="flex justify-between py-3">
                        <span className="text-gray-500">Fixed Group Creation Fee</span>
                        <span className="font-bold text-[#FF8C00]">₦{data?.config?.groupCreationFee}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#FF8C00]/5 p-6 rounded-2xl border border-[#FF8C00]/20 h-fit">
                 <h3 className="font-bold flex items-center gap-2 mb-4 text-[#FF8C00]"><Info className="w-4 h-4"/> Revenue Logic</h3>
                 <p className="text-xs leading-relaxed text-gray-500">Fees are calculated at the moment of payout. Changing these values will not affect groups that are already mid-cycle.</p>
              </div>
            </div>
          )}

          {/* 3. ADMIN TEAM */}
          {activeTab === "Admin Team" && (
            <div className="bg-white dark:bg-[#11181C] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <Users className="w-5 h-5 text-[#FF8C00]" /> Internal Staff Directory
                </h3>
                <button onClick={() => setModal('ADMIN')} className="bg-[#FF8C00] text-black px-6 py-2 rounded-lg text-sm font-bold">+ Invite Admin</button>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500 uppercase text-[10px] border-b border-gray-200 dark:border-gray-800">
                      <th className="pb-4">STAFF MEMBER</th>
                      <th className="pb-4">ROLE</th>
                      <th className="pb-4 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* FIXED: Check adminTeam array safely */}
                    {adminTeam.map((staff: any) => (
                      <tr key={staff.id} className="border-b border-gray-100 dark:border-gray-800/50">
                        <td className="py-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#FF8C00]/20 flex items-center justify-center text-[10px] font-bold text-[#FF8C00]">
                            {staff.firstName?.[0] || 'A'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{staff.firstName} {staff.lastName}</p>
                            <p className="text-[10px] text-gray-500">{staff.email}</p>
                          </div>
                        </td>
                        <td className="py-4 font-medium text-gray-400 uppercase text-[10px] tracking-widest">{staff.systemRole}</td>
                        <td className="py-4 text-right">
                            <span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded text-[10px] font-bold uppercase border border-emerald-500/20">
                                {staff.status}
                            </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. NOTIFICATIONS */}
          {activeTab === "Notifications" && (
            <div className="space-y-6">
               <div className="bg-white dark:bg-[#11181C] p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                    <Bell className="w-5 h-5 text-[#FF8C00]" /> Automated Triggers
                  </h3>
                  <ToggleRow 
                    title="User Payout Reminders" 
                    description="Sends notification 24 hours before a rotation payout is processed." 
                    active={data?.config?.payoutReminders} 
                    onToggle={() => updateSetting({ payoutReminders: !data.config.payoutReminders })}
                  />
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS (Safe Props) ---

function ToggleRow({ title, description, active, onToggle }: any) {
  return (
    <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-[#1A2126] rounded-xl border border-gray-200 dark:border-gray-800">
      <div>
        <p className="font-bold text-sm text-gray-900 dark:text-white">{title}</p>
        <p className="text-[10px] text-gray-500">{description}</p>
      </div>
      <div 
        onClick={onToggle}
        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${active ? 'bg-emerald-500' : 'bg-gray-400'}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${active ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </div>
  );
}

function StatMini({ title, value }: any) {
  return (
    <div className="bg-white dark:bg-[#11181C] p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex justify-between items-center">
       <div>
         <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">{title}</p>
         <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
       </div>
       <div className="p-2 bg-[#FF8C00]/10 rounded-lg">
         <Activity className="w-4 h-4 text-[#FF8C00]" />
       </div>
    </div>
  );
}