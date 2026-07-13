/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Wallet, Clock, Calendar, Download, CheckCircle2, AlertTriangle, Eye, X, Activity } from "lucide-react";
import { downloadAdminReport } from "@/src/utils/export";

export default function PayoutsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // FOR NEW PAYOUT
  const [isExporting, setIsExporting] = useState(false);

  const fetchPayouts = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/payouts`, {
      headers: { Authorization: `Bearer ${session?.accessToken}` }
    });
    const result = await res.json();
    if (result.success) setData(result.data);
  };

  useEffect(() => {
    if (session?.accessToken)
      { 
        fetchPayouts()

      };
  }, [session]);

  const handlePayoutExport = async () => {
    setIsExporting(true);
    // You can use the same transaction export or create a specific Payout export
    await downloadAdminReport(
      '/admin/transactions/export?type=PAYOUT', 
      session?.accessToken as string, 
      'Payout_Report.csv'
    );
    setIsExporting(false);
  };

  if (!data) return <div className="p-8 text-[#FF8C00] font-bold">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* TRIGGER PAYOUT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#11181C] w-full max-w-md p-8 rounded-2xl border border-gray-800">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Initiate Manual Payout</h2>
                <X className="cursor-pointer" onClick={() => setIsModalOpen(false)} />
             </div>
             <p className="text-gray-400 text-sm mb-6">Select a rotation slot to bypass automatic scheduling and payout immediately.</p>
             <button className="w-full bg-[#FF8C00] text-black font-bold py-3 rounded-lg">Search Groups</button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold">Payout Management</h1>
          <p className="text-gray-500 text-sm">Review, approve, and track platform payouts.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setIsModalOpen(true)} className="bg-emerald-500 text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
            NEW PAYOUT
          </button>
          <button className="flex items-center gap-2 bg-[#FF8C00] px-4 py-2 rounded-lg text-sm font-bold text-black" onClick={handlePayoutExport} disabled={isExporting}>
            <Download className="w-4 h-4" /> Download Report
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Payouts (YTD)" value={`₦${data.stats.totalYtd.toLocaleString()}`} icon={<Wallet className="text-[#FF8C00]" />} />
        <StatCard title="Pending Approvals" value={data.stats.pendingCount} icon={<AlertTriangle className="text-yellow-500" />} />
        <StatCard title="Next Rotation" value={new Date(data.stats.nextRotationDate).toLocaleDateString()} icon={<Calendar className="text-blue-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TABLE */}
        <div className="lg:col-span-2 bg-[#11181C] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex justify-between">
            <h3 className="font-bold">Pending Approvals</h3>
            {/* DROPDOWN FILTER */}
            <select className="bg-[#1A2126] border border-gray-700 text-xs rounded px-2 py-1 outline-none">
                <option>All Groups</option>
                <option>Lekki Traders</option>
                <option>Tech Founders</option>
            </select>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-500 uppercase text-[10px] bg-[#1A2126]">
                <th className="px-6 py-4">RECIPIENT</th>
                <th className="px-6 py-4">GROUP</th>
                <th className="px-6 py-4">AMOUNT</th>
                <th className="px-6 py-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {data.pending.map((p: any) => (
                <tr key={p.id} className="border-t border-gray-800">
                  <td className="px-6 py-4 font-bold">{p.recipient}</td>
                  <td className="px-6 py-4 text-gray-500">{p.group}</td>
                  <td className="px-6 py-4">₦{p.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right"><Eye className="inline cursor-pointer hover:text-[#FF8C00]" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RECENT Payouts List */}
        <div className="bg-[#11181C] rounded-2xl border border-gray-800 p-6">
            <h3 className="font-bold mb-6">Recent History</h3>
            {data.recent.map((r: any) => (
                <div key={r.id} className="mb-4 flex justify-between items-center border-b border-gray-800 pb-4">
                    <div>
                        <p className="text-sm font-bold">{r.name}</p>
                        <p className="text-[10px] text-gray-500">{new Date(r.time).toLocaleDateString()}</p>
                    </div>
                    <p className="text-emerald-500 font-bold">₦{r.amount.toLocaleString()}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-[#11181C] p-6 rounded-2xl border border-gray-800 shadow-sm flex justify-between">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">{icon}</div>
    </div>
  );
}