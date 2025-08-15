"use client";

import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charSet="UTF-8" />
        <title>PaleroSoft</title>
        <link rel="icon" type="image/x-icon" href="/images/LogoPalerosoft.jpg" />
        <link rel="apple-touch-icon" href="/images/LogoPalerosoft.jpg" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}