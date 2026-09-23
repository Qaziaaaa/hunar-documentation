"use client";

import React from "react";

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans antialiased">
      {children}
    </div>
  );
}
