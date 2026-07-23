/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-no-undef */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation"; // 👉 Import NextAuth signOut

import { 
  LayoutDashboard, Users, UsersRound, ArrowRightLeft, 
  Send, Settings, Shield, Ticket, LogOut, HelpCircle, 
  X
} from "lucide-react";
// import router from "next/router";
import Image from "next/image";
import { useEffect, useState } from "react";
const navItems = [
  { name: "DASHBOARD", icon: LayoutDashboard, path: "/dashboard" },
  { name: "GROUPS", icon: UsersRound, path: "/dashboard/groups" },
  { name: "MEMBERS", icon: Users, path: "/dashboard/members" },
  { name: "TRANSACTIONS", icon: ArrowRightLeft, path: "/dashboard/transactions" },
  { name: "PAYOUTS", icon: Send, path: "/dashboard/payouts" },
  { name: "TICKETS", icon: Ticket, path: "/dashboard/tickets" }, // 👉 Added Tickets!
  { name: "SETTINGS", icon: Settings, path: "/dashboard/settings" },
];

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const pathname = usePathname();
  const [adminData,setAdminData] = useState<any>(null);
  const router = useRouter();

useEffect(() => {
  const adminData = localStorage.getItem("adminData");
  if (adminData) {
    setAdminData(JSON.parse(adminData));
  }
}, []);

  const handleLogout = () => {
  localStorage.removeItem("adminAccessToken");
  router.push("/auth/login");
};

  return (
    <aside className={`w-64 h-screen bg-gray-50 dark:bg-[#0A0A0A] border-r border-gray-200 dark:border-gray-800 flex flex-col fixed left-0 top-0 z-30 transition-transform duration-300 ease-in-out ${
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    }`}>
      {/* Branding */}
      <div className="h-20 flex items-center justify-between px-8 border-b border-gray-200 dark:border-gray-800">
        <Shield className="w-6 h-6 text-[#FF8C00]" />
        <span className="text-[#FF8C00] font-bold tracking-widest text-lg">QUICKSAVE</span>
        {/* Close button for mobile */}
        <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-gray-500 hover:text-[#FF8C00] transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-8 px-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item: any) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.name} href={item.path}>
              <div className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all ${
                isActive 
                  ? "bg-[#FF8C00]/10 text-[#FF8C00] border-l-2 border-[#FF8C00]" 
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 border-l-2 border-transparent"
              }`}>
                <item.icon className="w-5 h-5" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* 👉 NEW: Bottom Actions (Support & Sign Out) */}
      <div className="px-4 pb-4 flex flex-col gap-2 border-t border-gray-200 dark:border-gray-800 pt-4">
        {/* <button className="flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold tracking-wide text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all" onClick={()=> router.push('/dashboard/tickets')}>
          <HelpCircle className="w-5 h-5" />
          SUPPORT
        </button> */}
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold tracking-wide text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          SIGN OUT
        </button>
      </div>

      {/* Admin User Profile */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3 bg-gray-50 dark:bg-[#0A0A0A]">
        <div className="relative group">
  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
  <div className="relative flex items-center gap-4 px-4 py-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
    {/* Avatar Section */}
    <div className="relative">
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-[#FF8C00] transition">
        <Image 
          src={adminData?.photo || "/placeholder.jpg"} 
          alt="User Avatar" 
          width={40} 
          height={40} 
          className="object-cover w-full h-full"
        />
      </div>
      {/* Online Status Indicator */}
      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 shadow-lg"></div>
    </div>

    {/* Info Section */}
    <div>
      <p className="text-sm font-bold text-gray-900 dark:text-white transition group-hover:text-[#FF8C00]">
        {adminData?.name}
      </p>
      <p className="text-xs text-gray-500 truncate w-32 group-hover:text-gray-400 transition">
        {adminData?.email}
      </p>
    </div>
  </div>
</div>
      
      </div>
    </aside>
  );
}