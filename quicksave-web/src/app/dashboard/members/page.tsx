/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/static-components */
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Search, Download, UserPlus, Filter, MoreVertical, ShieldAlert, Activity, X } from "lucide-react";
import MemberDetailsModal from "@/src/components/Dashboard/MemberDetailsModal";
import { downloadCSV } from "@/src/utils/export";

export default function MembersDirectoryPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<{ members: any[], stats: any } | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const fetchMembers = async () => {
    const query = `?q=${search}&status=${statusFilter}`;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/members${query}`, {
      headers: { Authorization: `Bearer ${session?.accessToken}` }
    });
    const result = await res.json();
    setData(result.data || []);
  };

  useEffect(() => { if (session) fetchMembers(); }, [session, search, statusFilter]);


  const StatCard = ({ title, value, sub, isPositive }: any) => (
    <div className="bg-white dark:bg-[#11181C] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
      <p className={`text-xs ${isPositive ? 'text-emerald-500' : 'text-[#FF8C00]'}`}>{sub}</p>
    </div>
  );

  return (
    <div className="space-y-6">
        {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#11181C] w-full max-w-md rounded-2xl p-8 border border-gray-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Register New Member</h2>
              <X className="cursor-pointer" onClick={() => setIsModalOpen(false)} />
            </div>
            <form className="space-y-4">
              <input placeholder="Full Name" className="w-full bg-gray-50 dark:bg-[#1A2126] border border-gray-800 p-3 rounded-lg text-sm" />
              <input placeholder="Email Address" className="w-full bg-gray-50 dark:bg-[#1A2126] border border-gray-800 p-3 rounded-lg text-sm" />
              <button className="w-full bg-[#FF8C00] text-black font-bold py-3 rounded-lg">Create Account</button>
            </form>
          </div>
        </div>
      )}
      {/* MODAL MOUNT */}
      {selectedMember && (
        <MemberDetailsModal memberId={selectedMember} token={session?.accessToken} onClose={() => setSelectedMember(null)} />
      )}

      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Admin &gt; Members</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Member Management</h1>
          <p className="text-gray-500 text-sm">Manage, verify, and monitor 12,482 platform participants.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => downloadCSV(data?.members || [], "Members_Report")} className="flex items-center gap-2 bg-gray-100 dark:bg-[#11181C] border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300">
            <Download className="w-4 h-4" /> EXPORT CSV
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-[#FF8C00] px-4 py-2 rounded-lg text-sm font-bold text-black transition-colors hover:bg-[#e67e00]">
            <UserPlus className="w-4 h-4" /> ADD NEW MEMBER
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="TOTAL MEMBERS" value={data?.stats?.totalMembers || '12,482'} sub="↑ +12% vs last month" isPositive />
        <StatCard title="VERIFIED STATUS" value={data?.stats?.verifiedStatus || '9,240'} sub="74% of total base" isPositive />
        <StatCard title="ACTIVE NOW" value={data?.stats?.activeNow || '1,821'} sub="● Live connections" isPositive={false} />
        <StatCard title="AVG. BALANCE" value={`₦${data?.stats?.avgBalance?.toLocaleString() || '4,250.00'}`} sub="↑ +$430 improvement" isPositive />
      </div>

      {/* FILTERS */}
      {/* <div className="flex gap-4 mt-4">
        {['All Statuses', 'All Tiers'].map(filter => (
          <button key={filter} className="flex items-center gap-2 bg-white dark:bg-[#11181C] border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300">
            {filter} <Filter className="w-3 h-3" />
          </button>
        ))}
      </div> */}
       <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search members..." 
            className="w-full bg-[#11181C] border border-gray-800 rounded-lg py-2 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-[#FF8C00]"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="bg-[#11181C] border border-gray-800 text-sm rounded-lg px-4 py-2 outline-none"
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* TABLE AND AUDIT LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MAIN TABLE (2/3 Width) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#11181C] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-colors">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-[#1A2126]">
                <tr className="text-gray-500 dark:text-gray-400 uppercase text-[10px] tracking-wider">
                  <th className="px-6 py-4 font-semibold">MEMBER NAME</th>
                  <th className="px-6 py-4 font-semibold">STATUS</th>
                  <th className="px-6 py-4 font-semibold">TIER</th>
                  <th className="px-6 py-4 font-semibold">TOTAL TRANSACTIONS</th>
                  <th className="px-6 py-4 font-semibold">ACCOUNT BALANCE</th>
                  <th className="px-6 py-4 font-semibold">RELIABILITY SCORE</th>
                  <th className="px-6 py-4 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {(data?.members || []).map((m: any) => (
                  <tr 
                    key={m.id} 
                    onClick={() => setSelectedMember(m.id)} // 👉 CLICKING A ROW OPENS THE MODAL!
                    className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={m.avatar} alt="avatar" className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{m.name}</p>
                          <p className="text-xs text-gray-500">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        m.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-bold">{m.tier}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{m.totalTransactions}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">₦{m.balance.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: `${m.reliabilityScore}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{m.reliabilityScore}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <MoreVertical className="w-4 h-4 text-gray-400 hover:text-[#FF8C00] inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: AUDIT & HEALTH */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#11181C] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Audit Logs</h3>
              <button className="text-xs text-gray-500 hover:text-[#FF8C00]">View Full History &gt;</button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <ShieldAlert className="w-4 h-4 text-emerald-500 mt-1" />
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">KYC Approved: Aria Vance</p>
                  <p className="text-xs text-gray-500">Verification officer: System Auto • 4 mins ago</p>
                </div>
              </div>
              <div className="flex gap-3">
                <ShieldAlert className="w-4 h-4 text-red-500 mt-1" />
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Account Flagged: David Chen</p>
                  <p className="text-xs text-gray-500">Suspicious login attempt from IP 192.168.1.45 • 15 mins ago</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#11181C] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6">Platform Health</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">ONBOARDING SPEED</span>
                  <span className="text-emerald-500 font-bold">OPTIMAL</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full"><div className="bg-emerald-500 h-full w-[90%]" /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">SYSTEM LOAD</span>
                  <span className="text-[#FF8C00] font-bold">32%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full"><div className="bg-[#FF8C00] h-full w-[32%]" /></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}