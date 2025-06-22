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
      <div className="h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col md:ml-72">
          <Header />
          <main className="flex-1 overflow-auto p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}