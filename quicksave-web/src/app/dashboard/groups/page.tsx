/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Filter, Plus, Eye, Edit2, ChevronLeft, ChevronRight, X } from "lucide-react";

export default function GroupsDirectoryPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 👉 FIX: Track exactly which group we are editing!
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // We check if running in browser to safely get localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("adminAccessToken") : null;

  const fetchGroups = useCallback(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/groups`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(result => setGroups(result.data || []))
    .catch(() => console.error("Failed to fetch groups"))
    .finally(() => setLoading(false));
  }, [token, router]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // 👉 FIX: When clicking Edit, we populate the modal with THIS specific group's data
  const openEditModal = (group: any) => {
    setEditingGroupId(group.id);
    setEditName(group.name);
    setEditStatus(group.status);
  };

  const closeEditModal = () => {
    setEditingGroupId(null);
    setEditName("");
    setEditStatus("");
  };
  
  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroupId) return;

    setFormLoading(true);

    try {
      // 👉 FIX: Send the patch request ONLY for the selected group!
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/groups/${editingGroupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, status: editStatus })
      });
      
      if (res.ok) {
        closeEditModal();
        fetchGroups(); // Refresh the table so we see the new name/status instantly!
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update group");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally { 
      setFormLoading(false); 
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === 'ACTIVE') return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
    if (status === 'COMPLETED') return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    return 'bg-[#FF8C00]/10 text-[#FF8C00] border border-[#FF8C00]/20';
  };

  return (
    <div className="space-y-6">
      
      {/* EDIT GROUP MODAL */}
      {editingGroupId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#11181C] w-full max-w-md rounded-2xl border border-gray-800 p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Edit Group Meta</h2>
              <X className="cursor-pointer text-gray-500 hover:text-white" onClick={closeEditModal} />
            </div>
            <form onSubmit={handleEditGroup} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">GROUP NAME</label>
                <input 
                  className="w-full bg-gray-50 dark:bg-[#1A2126] border border-gray-800 p-3 rounded-lg text-sm text-black dark:text-white outline-none focus:border-[#FF8C00]"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">GROUP STATUS</label>
                <select 
                  className="w-full bg-gray-50 dark:bg-[#1A2126] border border-gray-800 p-3 rounded-lg text-sm text-black dark:text-white outline-none focus:border-[#FF8C00]"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PAUSED">PAUSED</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
              <button disabled={formLoading} className="w-full bg-[#FF8C00] text-black font-bold py-3 rounded-lg hover:bg-[#e67e00] transition-colors disabled:opacity-50">
                {formLoading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dashboard &gt; Groups Management</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Groups Directory</h1>
          <p className="text-gray-500 text-sm">Manage and monitor all active savings groups.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 bg-gray-100 dark:bg-[#11181C] border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300">
            <Filter className="w-4 h-4" /> Status: All
          </button>
          <button className="flex items-center gap-2 bg-[#FF8C00] px-4 py-2 rounded-lg text-sm font-bold text-black transition-colors hover:bg-[#e67e00]">
            <Plus className="w-4 h-4" /> New Group
          </button>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white dark:bg-[#11181C] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-[#1A2126]">
              <tr className="text-gray-500 dark:text-gray-400 uppercase text-[10px] tracking-wider">
                <th className="px-6 py-4 font-semibold">GROUP NAME</th>
                <th className="px-6 py-4 font-semibold">MEMBERS</th>
                <th className="px-6 py-4 font-semibold">TOTAL AMOUNT</th>
                <th className="px-6 py-4 font-semibold">FREQUENCY</th>
                <th className="px-6 py-4 font-semibold">STATUS</th>
                <th className="px-6 py-4 font-semibold">NEXT PAYOUT</th>
                <th className="px-6 py-4 font-semibold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">Loading groups...</td></tr>
              ) : groups.map((g: any) => (
                <tr key={g.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FF8C00]/20 flex items-center justify-center text-xs font-bold text-[#FF8C00]">
                        {g.initial}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">{g.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{g.members}</td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">₦{g.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{g.frequency}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(g.status)}`}>
                      {g.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{g.nextPayout}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/dashboard/groups/${g.id}`}>
                        <Eye className="w-4 h-4 text-gray-400 hover:text-[#FF8C00] cursor-pointer transition-colors" />
                      </Link>
                      {/* 👉 FIX: Pass the specific group to the click handler! */}
                      <button onClick={() => openEditModal(g)}>
                        <Edit2 className="w-4 h-4 text-gray-400 hover:text-[#FF8C00] cursor-pointer transition-colors" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#1A2126]">
          <span className="text-xs text-gray-500">Showing 1-10 of 842 groups</span>
          <div className="flex gap-2">
            <button className="p-1 rounded bg-white dark:bg-[#11181C] border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><ChevronLeft className="w-4 h-4" /></button>
            <button className="p-1 rounded bg-white dark:bg-[#11181C] border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}