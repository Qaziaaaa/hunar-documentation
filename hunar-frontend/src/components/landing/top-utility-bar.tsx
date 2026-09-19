import { GlobeIcon } from "./icons";

export function TopUtilityBar() {
  return (
    <aside
      id="lang"
      className="bg-brand-top text-[#A2B8B3] text-xs border-b border-brand-topborder py-2"
      data-purpose="top-utility-bar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center space-x-3 text-[11px] sm:text-xs">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-accent/20 text-brand-accent">
            Verified Platform
          </span>
          <span className="text-slate-200">Peshawar, Twin Cities&nbsp;</span>
        </div>
        <div className="flex items-center space-x-6 text-[11px] sm:text-xs text-slate-200">
          <span className="flex items-center gap-1 text-slate-300">
            Currency:{" "}
            <strong className="text-white font-medium">PKR (Rs.)</strong>
          </span>
          <a className="hover:text-white transition-colors" href="#">
            Help Center
          </a>
          <a
            className="hover:text-white transition-colors flex items-center gap-1"
            href="#lang"
          >
            <GlobeIcon className="w-3.5 h-3.5" />
            English / Urdu
          </a>
        </div>
      </div>
    </aside>
  );
}