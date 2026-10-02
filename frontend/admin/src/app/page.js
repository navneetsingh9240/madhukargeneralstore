"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="text-center space-y-2">
        <h1 className="text-lg font-black tracking-tight">Madhukar General Store Admin</h1>
        <p className="text-xs text-slate-400">Redirecting to Admin Dashboard...</p>
      </div>
    </div>
  );
}
