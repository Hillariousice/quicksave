"use client"; // Required for App Router hooks

import { useState } from "react";
import { Search, Bell, Menu } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
const tab = pathname.split("/").pop();
  // Function to handle search execution
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      // Navigate to a search page (we'll create this or use existing list logic)
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery(""); // Clear after search
    }
  };

  // Logic to clean up breadcrumbs based on URL
  const pathLabel = pathname.split("/").pop()?.replace(/-/g, " ") || "Dashboard";

  return (
    <header className="h-20 bg-white dark:bg-[#0A0A0A] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 sticky top-0 z-10 transition-colors">
      
      <div className="flex items-center gap-2">
        {/* 👉 Shows ONLY on mobile (< lg) */}
        <button onClick={onMenuClick} className="lg:hidden p-2 text-gray-500 hover:text-[#FF8C00] transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      {/* Dynamic Breadcrumbs */}
      <div className="hidden md:block text-sm font-semibold text-gray-500">
        Admin Console <span className="text-[#FF8C00] mx-2">&gt;</span> 
        <span className="text-gray-900 dark:text-white">{pathLabel}</span>
      </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 md:gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search groups, members..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="bg-gray-100 dark:bg-[#11181C] border-none text-sm text-gray-900 dark:text-white rounded-full py-2 pl-10 pr-4 focus:ring-1 focus:ring-[#FF8C00] outline-none transition-colors"
          />
        </div>
        
        <button onClick={() => router.push(`/dashboard/settings?tab=${tab}`)} className="relative">
          <Bell className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-900 dark:hover:text-white" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF8C00] rounded-full border-2 border-white dark:border-[#0A0A0A]"></span>
        </button>
        
        <button 
          className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 md:px-4 md:py-2 text-xs font-bold tracking-wider rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" 
          onClick={() => router.push('/dashboard/tickets')}
        >
          SUPPORT
        </button>
      </div>
    </header>
  );
}