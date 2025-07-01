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
      <div className="h-screen flex bg-gradient-to-br from-white to-palero-blue1/5">
        <Sidebar />
        <div className="flex-1 flex flex-col md:ml-72 min-h-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-transparent to-palero-teal1/5">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}