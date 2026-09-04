"use client";

import React from "react";
import { Home, History, Settings } from "lucide-react";

interface AppBottomNavProps {
  activeTab: "home" | "history" | "settings";
  onSelectTab: (tab: "home" | "history" | "settings") => void;
}

export const AppBottomNav: React.FC<AppBottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "history", label: "History", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 pointer-events-none flex justify-center">
      <nav className="pointer-events-auto bg-[#06121c]/90 backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-1.5 shadow-2xl shadow-black/80 flex items-center gap-1 sm:gap-2 max-w-xs sm:max-w-sm w-full justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 ${isActive
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold shadow-lg shadow-emerald-500/30 scale-102"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
            >
              <Icon className="w-5 h-5 stroke-[2.2]" />
              <span className="text-[11px] font-semibold mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
