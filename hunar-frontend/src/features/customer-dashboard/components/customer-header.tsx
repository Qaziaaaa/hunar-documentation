"use client";

import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface CustomerHeaderProps {
  onOpenSidebar: () => void;
}

export function CustomerHeader({ onOpenSidebar }: CustomerHeaderProps) {
  const router = useRouter();
  const locale = useLocale();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/customer/post-job?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const placeholderText = locale === "ur" ? "سروس تلاش کریں..." : "Search services...";

  return (
    <header className="sticky top-0 start-0 end-0 z-30 bg-transparent px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3">
      {/* Start: Sidebar Toggle Icon Button (Visible on mobile & tablet) */}
      <div className="flex items-center shrink-0 lg:hidden">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open Sidebar"
          className="size-10 rounded-xl text-slate-700 hover:text-[#123B5D] hover:bg-slate-100/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="size-5 stroke-[2.2]" />
        </button>
      </div>

      {/* End Corner: Search & Language Switcher */}
      <div className="flex items-center gap-2 ms-auto">
        {/* Desktop / Expanded Search Form */}
        <form
          onSubmit={handleSearch}
          className={`relative transition-all duration-200 ${
            searchOpen
              ? "flex items-center w-48 sm:w-72"
              : "hidden sm:flex items-center w-56 sm:w-64"
          }`}
        >
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholderText}
            className="w-full h-10 ps-9 pe-8 text-xs font-medium rounded-xl border border-slate-200 bg-white/90 focus:bg-white focus:border-[#0F8B8D] focus:outline-none transition-all placeholder:text-slate-400 shadow-2xs"
          />
          {searchOpen ? (
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setQuery("");
              }}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 size-5 rounded-full text-slate-400 hover:text-slate-700 flex items-center justify-center sm:hidden cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </form>

        {/* Mobile Search Toggle Icon Button */}
        {!searchOpen ? (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search Services"
            className="sm:hidden size-10 rounded-xl text-slate-700 hover:text-[#0F8B8D] hover:bg-slate-100/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            title="Search Services"
          >
            <Search className="size-5 stroke-[2.2]" />
          </button>
        ) : null}
      </div>
    </header>
  );
}
