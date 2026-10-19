export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-3">
      <div className="size-10 rounded-full border-3 border-teal-500 border-t-transparent animate-spin" />
      <p className="text-sm font-semibold text-slate-600">Loading visit details...</p>
    </div>
  );
}
