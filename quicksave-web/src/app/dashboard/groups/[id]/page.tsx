/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit2, UserPlus, CheckCircle2, XCircle, Clock, View, X } from "lucide-react";

export default function GroupAnalyticsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

const fetchDetails = () => {
    // 👉 FIX: Added (session as any)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/groups/${id}`, {
      headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
    })
    .then(res => res.json())
    .then(result => {
      setData(result.data);
      setEditName(result.data.name);
      setEditStatus(result.data.status);
    });
  };

  useEffect(() => {
    // 👉 FIX: Added (session as any)
    if ((session as any)?.accessToken) fetchDetails();
  }, [id, session]);

   const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/groups/${id}/members`, {
        method: 'POST',
        // 👉 FIX: Added (session as any)
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(session as any)?.accessToken}` },
        body: JSON.stringify({ email: memberEmail })
      });
      const result = await res.json();
      if (res.ok) {
        alert("Member added successfully");
        setShowAddMember(false);
        fetchDetails();
      } else {
        alert(result.message);
      }
    } finally { setFormLoading(false); }
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/groups/${id}`, {
        method: 'PATCH',
        // 👉 FIX: Added (session as any)
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(session as any)?.accessToken}` },
        body: JSON.stringify({ name: editName, status: editStatus })
      });
      if (res.ok) {
        setShowEditGroup(false);
        fetchDetails();
      }
    } finally { setFormLoading(false); }
  };

  if (!data) return <div className="p-8 text-[#FF8C00] font-bold">Loading Analytics...</div>;

  const renderMatrixCell = (status: boolean | null) => {
    if (status === true) return <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />;
    if (status === false) return <XCircle className="w-4 h-4 text-red-500 mx-auto" />;
    return <div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded mx-auto" />;
  };

  return (
    <div className="space-y-6">
        {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#11181C] w-full max-w-md rounded-2xl border border-gray-800 p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add Member</h2>
              <X className="cursor-pointer text-gray-500" onClick={() => setShowAddMember(false)} />
            </div>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">USER EMAIL ADDRESS</label>
                <input 
                  className="w-full bg-gray-50 dark:bg-[#1A2126] border border-gray-800 p-3 rounded-lg text-sm"
                  placeholder="e.g. user@example.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  required
                />
              </div>
              <button disabled={formLoading} className="w-full bg-[#FF8C00] text-black font-bold py-3 rounded-lg hover:bg-[#e67e00] disabled:opacity-50">
                {formLoading ? "Adding..." : "Confirm Addition"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT GROUP MODAL */}
      {showEditGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#11181C] w-full max-w-md rounded-2xl border border-gray-800 p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Edit Group Meta</h2>
              <X className="cursor-pointer text-gray-500" onClick={() => setShowEditGroup(false)} />
            </div>
            <form onSubmit={handleEditGroup} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">GROUP NAME</label>
                <input 
                  className="w-full bg-gray-50 dark:bg-[#1A2126] border border-gray-800 p-3 rounded-lg text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">GROUP STATUS</label>
                <select 
                  className="w-full bg-gray-50 dark:bg-[#1A2126] border border-gray-800 p-3 rounded-lg text-sm"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PAUSED">PAUSED</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
              <button disabled={formLoading} className="w-full bg-[#FF8C00] text-black font-bold py-3 rounded-lg disabled:opacity-50">
                {formLoading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HEADER & BREADCRUMBS */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            <button onClick={() => router.back()} className="hover:text-[#FF8C00] transition-colors"><ArrowLeft className="w-4 h-4" /></button>
            <span>Groups</span> <span className="text-[#FF8C00]">&gt;</span> <span className="text-gray-900 dark:text-white">{data.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{data.name}</h1>
            <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
              {data.status}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-2">Weekly contribution circle for local business owners. Rotating payout every Friday.</p>
        </div>
        
        <div className="flex gap-4">
          <button className="flex items-center gap-2 bg-gray-100 dark:bg-[#11181C] border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300" onClick={() => setShowEditGroup(true)}>
            <Edit2 className="w-4 h-4" /> Edit Group
          </button>
          <button className="flex items-center gap-2 bg-[#FF8C00] px-4 py-2 rounded-lg text-sm font-bold text-black" onClick={() => setShowAddMember(true)}>
            <UserPlus className="w-4 h-4" /> Add Member
          </button>
        </div>
      </div>

      {/* TOP STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-3 grid grid-cols-3 gap-6">
          {Object.entries(data.stats).map(([k, v]: any) => (
            <div key={k} className="bg-white dark:bg-[#11181C] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {k.includes('Amount') || k.includes('Pool') ? `₦${v.toLocaleString()}` : v}
              </p>
            </div>
          ))}
        </div>
        {/* GROUP META */}
        <div className="bg-white dark:bg-[#1A2126] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-bold mb-4 text-gray-900 dark:text-white">Group Meta</h3>
          <div className="space-y-3 text-sm">
            {Object.entries(data.meta).map(([k, v]: any) => (
              <div key={k} className="flex justify-between border-b border-gray-100 dark:border-gray-800/50 pb-2">
                <span className="text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MATRIX & ROTATION ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ROTATION ORDER (1/3 Width) */}
        <div className="bg-white dark:bg-[#11181C] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Rotation</h3>
          <div className="space-y-4">
            {data.rotation.map((r: any) => (
              <div key={r.pos} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500">#{r.pos}</span>
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs">👤</div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{r.name}</span>
                </div>
                {r.status === 'PAID' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-gray-500" />}
              </div>
            ))}
          </div>
        </div>

        {/* CONTRIBUTION MATRIX (2/3 Width) */}
        <div className="col-span-2 bg-white dark:bg-[#11181C] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-x-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Contribution Matrix</h3>
            <div className="flex gap-4 text-xs font-bold text-gray-500">
              <span className="flex items-center gap-1"><View className="w-2 h-2 rounded-full bg-emerald-500" /> Paid</span>
              <span className="flex items-center gap-1"><View className="w-2 h-2 rounded-full bg-gray-800" /> Pending</span>
            </div>
          </div>
          
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-500 uppercase text-[10px] tracking-wider border-b border-gray-200 dark:border-gray-800">
                <th className="pb-4 font-semibold">MEMBER</th>
                <th className="pb-4 font-semibold text-center">C1</th>
                <th className="pb-4 font-semibold text-center">C2</th>
                <th className="pb-4 font-semibold text-center">C3</th>
                <th className="pb-4 font-semibold text-center">C4</th>
                <th className="pb-4 font-semibold text-center">C5</th>
              </tr>
            </thead>
            <tbody>
              {data.matrix.map((m: any, i: number) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50">
                  <td className="py-4 font-bold text-gray-900 dark:text-white">{m.name}</td>
                  {m.cycles.map((status: boolean | null, j: number) => (
                    <td key={j} className="py-4 text-center">{renderMatrixCell(status)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
