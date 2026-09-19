"use client";

import { SearchIcon } from "./icons";

function scrollToServices() {
  document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
}

export function HeroSearchForm() {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        scrollToServices();
      }}
      className="bg-white p-2 rounded-2xl sm:rounded-full shadow-2xl flex flex-col sm:flex-row items-center gap-2 max-w-2xl"
    >
      <div className="flex items-center w-full px-4 py-2">
        <SearchIcon className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" strokeWidth={2.5} />
        <input
          className="w-full bg-transparent border-0 text-slate-800 placeholder-slate-400 text-sm focus:ring-0 p-0 font-medium"
          placeholder="What service do you need? (e.g. AC Repair, Electrician)"
          type="text"
        />
      </div>
      <div className="hidden sm:block w-px h-8 bg-slate-200" />
      <div className="flex items-center w-full sm:w-auto px-4 py-2">
        <select
          onChange={(e) => {
            if (e.target.value) scrollToServices();
          }}
          className="w-full sm:w-44 bg-transparent border-0 text-slate-700 text-sm focus:ring-0 p-0 font-medium cursor-pointer"
          defaultValue=""
        >
          <option value="">Choose Category</option>
          <option value="ac">HVAC & AC Cooling</option>
          <option value="electric">Electrical & Solar</option>
          <option value="plumb">Plumbing & Sanitary</option>
          <option value="wood">Woodwork & Fitout</option>
          <option value="paint">House Paint & Polish</option>
        </select>
      </div>
      <button
        type="submit"
        className="w-full sm:w-auto bg-brand-accent hover:bg-brand-accent-hover text-white text-sm font-semibold px-8 py-3.5 rounded-xl sm:rounded-full transition-all duration-200 flex-shrink-0 flex items-center justify-center shadow-md cursor-pointer"
      >
        Search
      </button>
    </form>
  );
}