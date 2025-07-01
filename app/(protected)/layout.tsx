"use client";

import { Sidebar } from '@/components/Layout/Sidebar';
import { Header } from '@/components/Layout/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex bg-gradient-to-br from-white to-palero-blue1/5">
        <Sidebar />
        <div className="flex-1 flex flex-col md:ml-72">
          <Header />
          <main className="flex-1 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-transparent to-palero-teal1/5 overflow-x-hidden">
            <div className="w-full max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}