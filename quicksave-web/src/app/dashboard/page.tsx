/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Download, Activity, ChevronDown } from "lucide-react";
import TransactionTable from "@/src/components/Dashboard/TransactionTable";
import { useRouter } from "next/navigation";
import { downloadCSV } from "@/src/utils/export";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
   const router = useRouter()
  const [dateRange, setDateRange] = useState("30"); 

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Pass the range as a query parameter
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard?range=${dateRange}`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      const result = await res.json();
      if (res.ok) setData(result.data);
    } catch (err) {
      console.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever dateRange changes
  useEffect(() => {
    if (status === "authenticated") {
      fetchStats();
    }
  }, [session, status, dateRange]);


  // Reusable List Component
  const ListCard = ({ title, items, isGroup , onClickAll}: any) => (
    <div className="bg-white dark:bg-[#11181C] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex-1 shadow-sm transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">{title}</h3>
        <button className="text-xs font-bold text-gray-500 hover:text-[#FF8C00]" onClick={onClickAll}>VIEW ALL</button>
      </div>
      <div className="space-y-4">
        {items.map((item: any, i: number) => (
          <div key={item.id || i} className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A2126] transition-colors cursor-pointer border border-transparent dark:hover:border-gray-800">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white ${isGroup ? 'bg-[#FF8C00]/80' : 'bg-gray-800'}`}>
                {item.initial}
              </div>
              <div>
                <p className="font-bold text-sm">{item.name}</p>
                <p className="text-xs text-gray-500">{item.sub}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400">{item.time}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // Loading / Error States
  if (loading || status === "loading") {
    return <div className="flex items-center justify-center h-[60vh]"><Activity className="w-8 h-8 text-[#FF8C00] animate-spin" /></div>;
  }
  if (error) {
    return <div className="p-6 bg-red-500/10 text-red-500 rounded-xl">{error}</div>;
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Overview</h1>
          <p className="text-gray-500 text-sm">Platform performance and real-time activity.</p>
        </div>
        <div className="flex gap-4">
           <div className="relative group">
            <div className="flex items-center gap-2 bg-white dark:bg-[#11181C] border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300">
              <Calendar className="w-4 h-4 text-[#FF8C00]" />
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent outline-none appearance-none cursor-pointer pr-6"
              >
                <option value="7">LAST 7 DAYS</option>
                <option value="30">LAST 30 DAYS</option>
                <option value="90">LAST 90 DAYS</option>
                <option value="365">LAST YEAR</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-3 pointer-events-none" />
            </div>
          </div>
          <button onClick={() => downloadCSV(data.recentTransactions || [], "Transactions_Report")} className="flex items-center gap-2 bg-[#FF8C00] hover:bg-[#e67e00] px-4 py-2 rounded-lg text-sm font-bold text-black transition-colors">
            <Download className="w-4 h-4" /> EXPORT REPORT
          </button>
        </div>
      </div>

      {/* CHART SECTION */}
      <div className="bg-white dark:bg-[#11181C] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm transition-colors">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold">Money Coming In</h3>
            <p className="text-sm text-gray-500">Inflow trends and revenue growth overview.</p>
          </div>
          <div className="flex gap-4 text-xs font-bold text-gray-500">
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> CONTRIBUTIONS</span>
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#FF8C00]"></div> PAYOUTS</span>
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {/* 👉 INJECT REAL CHART DATA */}
            <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCont" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPay" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF8C00" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF8C00" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1A2126', borderColor: '#333', borderRadius: '8px', color: '#fff' }} />
              <Area type="monotone" dataKey="contributions" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorCont)" />
              <Area type="monotone" dataKey="payouts" stroke="#FF8C00" strokeWidth={2} fillOpacity={1} fill="url(#colorPay)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 👉 INJECT REAL GROUPS AND MEMBERS DATA */}
      <div className="flex flex-col lg:flex-row gap-6">
        <ListCard title="Recently Added Groups" isGroup={true} items={data.recentGroups} onClick={() => router.push("/dashboard/groups")}/>
        <ListCard title="Recently Added Members" isGroup={false} items={data.recentMembers} onClick={() => router.push("/dashboard/members")}/>
      </div>

      {/* 👉 INJECT REAL TRANSACTION DATA */}
      <TransactionTable data={data.recentTransactions} onClick={()=>router.push('/dashboard/transactions')} />

    </div>
  );
}