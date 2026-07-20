/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Search, Download, ChevronDown, ArrowUpRight, ArrowDownLeft, Wallet, AlertCircle, Calendar } from "lucide-react";
import { downloadAdminReport } from "@/src/utils/export";

export default function TransactionsDirectoryPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateRange, setDateRange] = useState("all"); 

   const fetchTxs = async () => {
    setLoading(true);
    
    // Calculate dates based on selection
    let startDate = "";
    const now = new Date();
    
    if (dateRange === "today") {
        startDate = new Date(now.setHours(0,0,0,0)).toISOString();
    } else if (dateRange === "7days") {
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
    } else if (dateRange === "30days") {
        startDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
    }

    const query = `?type=${typeFilter}&q=${search}&startDate=${startDate}`;
    
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/transactions${query}`, {
          headers: { Authorization: `Bearer ${session?.accessToken}` }
        });
        const result = await res.json();
        setTransactions(result.data || []);
    } catch (err) {
        console.error("Fetch error", err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) fetchTxs();
  }, [session, typeFilter, dateRange]); // Re-fetch when type changes

 const handleExport = async () => {
    if (!session?.accessToken) return;
    setIsExporting(true);
    await downloadAdminReport(
      '/admin/transactions/export', 
      session.accessToken, 
      'Quicksave_Transactions.csv'
    );
    setIsExporting(false);
  };
  const getTxDetails = (type: string, status: string) => {
    if (type === 'CONTRIBUTION') return { icon: ArrowDownLeft, color: 'text-emerald-500', sign: '+' };
    if (type === 'PAYOUT') return { icon: ArrowUpRight, color: 'text-[#FF8C00]', sign: '-' };
    if (type === 'FUNDING') return { icon: Wallet, color: 'text-blue-500', sign: '+' };
    return { icon: ArrowUpRight, color: 'text-red-500', sign: '-' }; // Withdrawal
  };

  const getStatusBadge = (status: string) => {
    if (status === 'SUCCESS') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (status === 'PENDING') return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Admin &gt; Transactions</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Transactions Directory</h1>
          <p className="text-gray-500 text-sm">Monitor and manage all financial movements across Quicksave groups.</p>
        </div>
        <button onClick={handleExport} disabled={isExporting} className="flex items-center gap-2 bg-white dark:bg-[#11181C] border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* FILTERS & TABLE */}
      <div className="bg-white dark:bg-[#11181C] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-colors">
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex gap-4 bg-gray-50 dark:bg-[#1A2126]">
           <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
                type="text" 
                placeholder="Search Reference or Name..." 
                className="w-full bg-[#11181C] border border-gray-700 text-sm rounded-lg py-2 pl-10 pr-4 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchTxs()}
            />
          </div>
           <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#11181C] border border-gray-700 text-sm rounded-lg px-4 py-2 outline-none cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="CONTRIBUTION">Contribution</option>
            <option value="PAYOUT">Payout</option>
            <option value="FUNDING">Wallet Funding</option>
            <option value="WITHDRAWAL">Withdrawal</option>
          </select>
        </div>

          <div className="flex items-center gap-2 bg-white dark:bg-[#11181C] border border-gray-200 dark:border-gray-700 py-2 px-3 rounded-bl-lg">
            <Calendar className="w-4 h-4 text-[#FF8C00]" />
            <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent text-sm py-2 outline-none cursor-pointer text-gray-700 dark:text-gray-300"
            >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-[#1A2126]">
              <tr className="text-gray-500 dark:text-gray-400 uppercase text-[10px] tracking-wider">
                <th className="px-6 py-4 font-semibold">USER</th>
                <th className="px-6 py-4 font-semibold">REFERENCE ID</th>
                <th className="px-6 py-4 font-semibold">TYPE</th>
                <th className="px-6 py-4 font-semibold">AMOUNT</th>
                <th className="px-6 py-4 font-semibold">DATE & TIME</th>
                <th className="px-6 py-4 font-semibold">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Loading transactions...</td></tr>
              ) : transactions.map((tx: any) => {
                const { icon: Icon, color, sign } = getTxDetails(tx.type, tx.status);
                const txDate = new Date(tx.date);

                return (
                  <tr key={tx.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={tx.avatar} alt="avatar" className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{tx.user}</p>
                          <p className="text-xs text-gray-500">{tx.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{tx.reference}</td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-2 font-medium ${color}`}>
                        <Icon className="w-4 h-4" /> {tx.type.charAt(0) + tx.type.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-bold ${color}`}>
                      {sign}₦{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <div>{txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div className="text-xs">{txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

  );
}