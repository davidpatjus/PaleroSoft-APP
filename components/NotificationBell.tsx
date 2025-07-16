"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { unreadCount } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      <div className="relative z-50">
        <Button 
          ref={buttonRef}
          variant="ghost" 
          size="sm" 
          className="relative hover:bg-palero-blue1/10 text-palero-navy1 rounded-xl transition-all duration-200 p-2"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-palero-green1 hover:bg-palero-green1 border-0 animate-pulse shadow-lg"
            >
              <span className="absolute inset-0 rounded-full bg-palero-green1 animate-ping opacity-75"></span>
              <span className="relative text-white font-semibold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </Badge>
          )}
        </Button>
      </div>

      {/* Portal for dropdown */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        (
          <div>
            {/* Mobile overlay */}
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9997] md:hidden"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown container */}
            <div 
              className="fixed z-[9999] md:top-auto md:right-auto"
              style={{ 
                top: window.innerWidth < 768 ? '4rem' : `${dropdownPosition.top}px`,
                right: window.innerWidth < 768 ? '1rem' : `${dropdownPosition.right}px`,
                left: window.innerWidth < 768 ? '1rem' : 'auto'
              }}
            >
              <div className="relative">
                {/* Mobile close button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -top-2 -right-2 z-[10000] md:hidden bg-palero-navy1 text-white hover:bg-palero-navy2 rounded-full h-8 w-8 p-0 shadow-lg"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                
                <NotificationDropdown onClose={() => setIsOpen(false)} />
              </div>
            </div>
          </div>
        ) as React.ReactNode,
        document.body
      )}
    </>
  );
}
