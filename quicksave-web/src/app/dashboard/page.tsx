/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Download, Activity, ChevronDown } from "lucide-react";
import TransactionTable from "@/src/components/Dashboard/TransactionTable";
import { useRouter } from "next/navigation";
import { downloadCSV } from "@/src/utils/export";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState("30"); 
  const router = useRouter();

  useEffect(() => {
    // 1. Get token inside useEffect to ensure window is defined
    const token = localStorage.getItem("adminAccessToken");

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        // Debugging: Check if API URL is missing
        if (!apiUrl) {
           setError("Configuration Error: NEXT_PUBLIC_API_URL is missing.");
           setLoading(false);
           return;
        }

        const res = await fetch(`${apiUrl}/admin/dashboard`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const result = await res.json();
        
        if (res.ok && result.success) {
          setData(result.data);
        } else {
          setError(result.message || "Failed to load dashboard data");
        }
      } catch (err) {
        setError("Network error. Backend might be sleeping or offline. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  const ListCard = ({ title, items, isGroup, onClickAll }: any) => (
    <div className="bg-white dark:bg-[#11181C] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex-1 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">{title}</h3>
        <button className="text-xs font-bold text-gray-500 hover:text-[#FF8C00]" onClick={onClickAll}>VIEW ALL</button>
      </div>
      <div className="space-y-4">
        {items?.map((item: any, i: number) => (
          <div key={item.id || i} className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A2126] transition-colors cursor-pointer border border-transparent dark:hover:border-gray-800">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white ${isGroup ? 'bg-[#FF8C00]/80' : 'bg-gray-800'}`}>
                {item.initial || item.name?.charAt(0)}
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

  // FIXED: Removed the 'status' reference that was causing the crash
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Activity className="w-8 h-8 text-[#FF8C00] animate-spin" />
        <p className="text-gray-500 animate-pulse">Waking up backend...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-4 border border-red-500/20">
          {error}
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-[#FF8C00] text-black px-4 py-2 rounded-lg font-bold text-sm"
        >
          RETRY CONNECTION
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Overview</h1>
          <p className="text-gray-500 text-sm">Platform performance and real-time activity.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => downloadCSV(data.recentTransactions || [], "Transactions_Report")} className="flex items-center gap-2 bg-[#FF8C00] hover:bg-[#e67e00] px-4 py-2 rounded-lg text-sm font-bold text-black transition-colors">
            <Download className="w-4 h-4" /> EXPORT REPORT
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#11181C] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm transition-colors">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chartData || []}>
              <defs>
                <linearGradient id="colorCont" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1A2126', borderColor: '#333', color: '#fff' }} />
              <Area type="monotone" dataKey="contributions" stroke="#10B981" fill="url(#colorCont)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <ListCard title="Recently Added Groups" isGroup={true} items={data.recentGroups} onClickAll={() => router.push("/dashboard/groups")}/>
        <ListCard title="Recently Added Members" isGroup={false} items={data.recentMembers} onClickAll={() => router.push("/dashboard/members")}/>
      </div>

      <TransactionTable data={data.recentTransactions || []} onClick={()=>router.push('/dashboard/transactions')} />
    </div>
  );
}