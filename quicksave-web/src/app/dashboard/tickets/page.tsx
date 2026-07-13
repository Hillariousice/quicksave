/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect , useCallback} from "react";
import { useSession } from "next-auth/react";
import { Search, Plus, Ticket, Clock, CheckCircle2, Filter, Download, Eye, CornerUpLeft, X, Loader2 } from "lucide-react";
import { downloadAdminReport } from "@/src/utils/export";

export default function SupportTicketsPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filter States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [priority, setPriority] = useState("All");
  const [status, setStatus] = useState("All");
const [stats, setStats] = useState({
  openCount: 0,
  avgResponseTime: "0m",
  resolvedToday: 0,
  capacity: 0
});

const fetchStats = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/stats`, {
    headers: { Authorization: `Bearer ${session?.accessToken}` }
  });
  const result = await res.json();
  if (result.success) setStats(result.data);
};


 // Inside SupportTicketsPage.tsx

const fetchTickets = useCallback(async () => {
  setLoading(true);
  const query = `?q=${search}&category=${category}&priority=${priority}&status=${status}`;
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets${query}`, {
      headers: { Authorization: `Bearer ${session?.accessToken}` }
    });

    const result = await res.json();
    
    // SAFETY CHECK: Ensure result and result.data exist before accessing .tickets
    if (res.ok && result?.data?.tickets) {
      setTickets(result.data.tickets);
      // Optional: Update total pages if you have pagination
      // setTotalPages(result.data.pages); 
    } else {
      console.error("API Error:", result?.message);
      setTickets([]); // Fallback to empty array to prevent map error
    }
  } catch (e) {
    console.error("Network Error:", e);
    setTickets([]); 
  } finally {
    setLoading(false);
  }
}, [session, search, category, priority, status]);

  useEffect(() => {
  if (session?.accessToken) {
    fetchStats(); // Fetch stats alongside the ticket list
  }
}, [session]);

  useEffect(() => {
    if (session?.accessToken) {
      const delayDebounce = setTimeout(fetchTickets, 500);
      return () => clearTimeout(delayDebounce);
    }
  }, [fetchTickets]);

  const handleExport = async () => {
    setIsExporting(true);
    await downloadAdminReport('/admin/tickets/export', session?.accessToken as string, 'Tickets.csv');
    setIsExporting(false);
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'HIGH') return <span className="text-red-500 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /> HIGH</span>;
    if (priority === 'MEDIUM') return <span className="text-[#FF8C00] flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#FF8C00]" /> MEDIUM</span>;
    return <span className="text-gray-400 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" /> LOW</span>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'OPEN') return 'bg-red-500/10 text-red-500 border border-red-500/20';
    if (status === 'IN PROGRESS') return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
    return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
  };

  return (
    <div className="space-y-6">

       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#11181C] w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Create Internal Ticket</h2>
              <X className="cursor-pointer text-gray-500" onClick={() => setIsModalOpen(false)} />
            </div>
            <form className="space-y-4">
              <input placeholder="Member Email" className="w-full bg-gray-100 dark:bg-[#1A2126] p-3 rounded-lg text-sm border border-transparent focus:border-[#FF8C00] outline-none" />
              <input placeholder="Subject" className="w-full bg-gray-100 dark:bg-[#1A2126] p-3 rounded-lg text-sm border border-transparent focus:border-[#FF8C00] outline-none" />
              <button className="w-full bg-[#FF8C00] text-black font-bold py-3 rounded-lg">Open Ticket</button>
            </form>
          </div>
        </div>
      )}
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Admin Console &gt; Support Management</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Support Tickets</h1>
          <p className="text-gray-500 text-sm">Manage and resolve user inquiries and disputes.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
           <input 
              type="text" 
              placeholder="Search subject or member..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-[#11181C] border border-gray-200 dark:border-gray-800 text-sm rounded-lg py-2 pl-10 pr-4 w-64 outline-none focus:ring-1 focus:ring-[#FF8C00]" 
            />
             </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-[#FF8C00] px-4 py-2 rounded-lg text-sm font-bold text-black transition-colors hover:bg-[#e67e00]">
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        </div>
      </div>

      {/* TOP STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#11181C] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"><Ticket className="w-4 h-4" /> Open Tickets</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stats?.openCount}<span className="text-sm text-red-500 font-normal">↑ +12%</span></p>
            <p className="text-xs text-red-500">Requires immediate attention</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#11181C] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"><Clock className="w-4 h-4" /> Avg Response Time</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stats?.avgResponseTime}<span className="text-sm text-emerald-500 font-normal"></span></p>
            <p className="text-xs text-gray-500">Targeting sub-10m response</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#11181C] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"><CheckCircle2 className="w-4 h-4" /> Resolved Today</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stats?.resolvedToday}<span className="text-sm text-emerald-500 font-normal"></span></p>
            <p className="text-xs text-gray-500">Capacity utilized: {stats?.capacity}%</p>
          </div>
        </div>
      </div>

      {/* TABLE FILTERS */}
      <div className="flex justify-between items-center bg-gray-50 dark:bg-[#1A2126] p-4 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex gap-4">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-white dark:bg-[#11181C] border border-gray-200 dark:border-gray-800 text-xs font-bold px-3 py-2 rounded-lg outline-none">
            <option value="All">All Categories</option>
            <option value="Transaction">Transaction</option>
            <option value="Technical">Technical</option>
            <option value="Account">Account</option>
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="bg-white dark:bg-[#11181C] border border-gray-200 dark:border-gray-800 text-xs font-bold px-3 py-2 rounded-lg outline-none">
            <option value="All">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-white dark:bg-[#11181C] border border-gray-200 dark:border-gray-800 text-xs font-bold px-3 py-2 rounded-lg outline-none">
            <option value="All">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
          Export CSV
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-[#11181C] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-8 h-8 text-[#FF8C00] animate-spin" />
            <p className="text-gray-500 font-bold text-xs tracking-widest">LOADING TICKETS...</p>
          </div>
        ) : ( 
        // <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-[#1A2126]">
              <tr className="text-gray-500 dark:text-gray-400 uppercase text-[10px] tracking-wider">
                <th className="px-6 py-4 font-semibold">TICKET & SUBJECT</th>
                <th className="px-6 py-4 font-semibold">MEMBER</th>
                <th className="px-6 py-4 font-semibold">CATEGORY</th>
                <th className="px-6 py-4 font-semibold">PRIORITY</th>
                <th className="px-6 py-4 font-semibold">STATUS</th>
                <th className="px-6 py-4 font-semibold">LAST UPDATED</th>
                <th className="px-6 py-4 font-semibold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(tickets) && tickets.length > 0 ? (tickets.map((t) => (
                <tr key={t.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1A2126] transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#FF8C00]">{t.id}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.subject}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={t.avatar} alt="avatar" className="w-8 h-8 rounded-full" />
                      <span className="font-bold text-gray-900 dark:text-white">{t.member}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{t.category}</td>
                  <td className="px-6 py-4 text-xs font-bold tracking-wider">{getPriorityBadge(t.priority)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{t.updated}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Eye className="w-4 h-4 text-gray-400 hover:text-[#FF8C00] cursor-pointer transition-colors" />
                      <CornerUpLeft className="w-4 h-4 text-gray-400 hover:text-[#FF8C00] cursor-pointer transition-colors" />
                    </div>
                  </td>
                </tr>
              ))) : !loading ? (
    <tr>
      <td colSpan={7} className="text-center py-10 text-gray-500 italic">
        No tickets found matching your filters.
      </td>
    </tr>
  ) : null}
            </tbody>
          </table>
           )}
        </div>
        
        {/* <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#1A2126]">
          <span className="text-xs text-gray-500">Showing 1-4 of 1,248 tickets</span>
          <div className="flex gap-2 text-gray-500 text-sm font-bold">
            <button className="px-2 hover:text-[#FF8C00]">&lt;</button>
            <button className="px-2 bg-[#FF8C00]/20 text-[#FF8C00] rounded">1</button>
            <button className="px-2 hover:text-[#FF8C00]">2</button>
            <button className="px-2 hover:text-[#FF8C00]">3</button>
            <span className="px-2">...</span>
            <button className="px-2 hover:text-[#FF8C00]">48</button>
            <button className="px-2 hover:text-[#FF8C00]">&gt;</button>
          </div>
        </div> */}
      </div>


  );
}