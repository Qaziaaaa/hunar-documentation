import { ChevronDownIcon, GridIcon, SearchIcon } from "./icons";
import { Link } from "@/i18n/navigation";
import { OrderworkerLogo } from "@/components/shared/orderworker-logo";

export function Header() {
  return (
    <header
      className="bg-brand-hero border-b border-white/10 backdrop-blur-md bg-opacity-95"
      data-purpose="main-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link
            className="flex items-center gap-2.5 group hover:opacity-95 transition-opacity"
            href="/"
            title="Orderworker Home"
          >
            <OrderworkerLogo variant="light" size="md" showBadge={true} />
          </Link>
          <a
            href="#services"
            className="hidden lg:flex items-center space-x-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-4 py-2.5 rounded-full border border-white/15 transition duration-150 cursor-pointer"
          >
            <GridIcon className="w-3.5 h-3.5 text-white" />
            <span>Categories</span>
            <ChevronDownIcon className="w-3 h-3 text-slate-300" />
          </a>
        </div>
        <nav
          aria-label="Main Navigation"
          className="hidden xl:flex items-center space-x-7 text-sm font-medium text-slate-200"
        >
          <a className="hover:text-white transition" href="#how-it-works">
            How It Works
          </a>
          <a className="hover:text-white transition" href="#pros">
            Top Rated
          </a>
          <a className="hover:text-white transition" href="#services">
            Services
          </a>
        </nav>
        <div className="flex items-center space-x-5">
          <a
            aria-label="Search"
            href="#services"
            className="text-slate-200 hover:text-white transition p-1"
          >
            <SearchIcon className="w-5 h-5" strokeWidth={2} />
          </a>
          <Link
            href="/customer/dashboard"
            className="bg-white hover:bg-slate-100 text-brand-hero text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full shadow transition-all duration-200 inline-flex items-center justify-center"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}