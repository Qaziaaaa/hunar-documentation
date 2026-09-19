"use client";

import { useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { MOCK_CATEGORIES } from "@/mocks/admin.mock";
import type { ServiceCategory } from "@/types/admin";
import { FolderTree, Plus, Power, Wrench } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>(MOCK_CATEGORIES);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const handleToggleCategory = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const handleAddCategory = () => {
    if (!newCatName) return;
    const newCat: ServiceCategory = {
      id: `cat-${categories.length + 1}`,
      name: newCatName,
      iconName: "Wrench",
      activeWorkersCount: 0,
      totalJobsCount: 0,
      isActive: true,
    };
    setCategories((prev) => [...prev, newCat]);
    setNewCatName("");
    setShowAddModal(false);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
                <FolderTree className="size-3.5" /> Trades & Categories
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
              Service Categories Management
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Add new service trades, edit details, or toggle category availability
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-navy/90"
          >
            <Plus className="size-4 text-teal-300" /> Add New Category
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-navy text-white">
                  <Wrench className="size-5 text-teal-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-navy text-sm">{cat.name}</h3>
                  <p className="text-xs text-slate-500">
                    {cat.activeWorkersCount} Workers • {cat.totalJobsCount} Jobs
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleCategory(cat.id)}
                className={`flex size-9 items-center justify-center rounded-xl transition ${
                  cat.isActive
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                }`}
                title={cat.isActive ? "Deactivate" : "Activate"}
              >
                <Power className="size-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Modal */}
        {showAddModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-extrabold text-navy">Add Service Category</h3>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category name (e.g., Appliance Repair)..."
                className="mt-4 h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-teal"
              />
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">
                  Cancel
                </button>
                <button type="button" onClick={handleAddCategory} className="rounded-xl bg-navy px-5 py-2 text-xs font-bold text-white shadow-md">
                  Add Category
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
