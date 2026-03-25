import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRole } from './RoleContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type?: 'info' | 'warning' | 'error' | 'success';
  target_role?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (title: string, message: string, type?: Notification['type'], targetRole?: string) => void;
  removeNotification: (id: string) => void;
  requestPermission: () => Promise<void>;
  permission: NotificationPermission;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { role } = useRole();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Listen for real-time notifications from Supabase
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new;
          // Only show if it matches current role or is for everyone
          // And don't show if it's from the same user (we already show it locally)
          // But since we don't have user IDs yet, we'll just show it if the role matches
          // and it's not the role that sent it? No, that's complex.
          // Let's just show it if target_role matches.
          if (!newNotif.target_role || newNotif.target_role === role) {
            addLocalNotification(
              newNotif.title,
              newNotif.message,
              newNotif.type as Notification['type']
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role]);

  const playSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log('Audio play failed', e));
  };

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  const addLocalNotification = (title: string, message: string, type: Notification['type'] = 'success') => {
    const id = Math.random().toString(36).substring(7);
    const newNotification: Notification = {
      id,
      title,
      message,
      timestamp: new Date(),
      read: false,
      type,
    };

    setNotifications(prev => [newNotification, ...prev]);
    playSound();

    // Auto-remove after 8 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 8000);

    // Show system notification if permitted
    if (permission === 'granted') {
      try {
        new window.Notification(title, {
          body: message,
          icon: '/vite.svg'
        });
      } catch (e) {
        console.error('Failed to show system notification', e);
      }
    }
  };

  const addNotification = async (title: string, message: string, type: Notification['type'] = 'success', targetRole?: string) => {
    // 1. Add locally immediately for the current user
    addLocalNotification(title, message, type);

    // 2. Persist to Supabase if it's intended for others
    if (targetRole) {
      try {
        await supabase.from('notifications').insert([
          { title, message, type, target_role: targetRole }
        ]);
      } catch (error) {
        console.error('Error persisting notification:', error);
      }
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, requestPermission, permission }}>
      {children}
      {/* Visual Toast for In-App Notification */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {notifications.slice(0, 5).map((notif) => (
          <div 
            key={notif.id} 
            className={`bg-white border-l-4 ${
              notif.type === 'error' ? 'border-red-600' : 
              notif.type === 'warning' ? 'border-amber-500' : 
              notif.type === 'info' ? 'border-green-500' : 
              'border-green-600'
            } shadow-2xl rounded-lg p-4 flex items-start animate-in slide-in-from-right duration-300 w-80 pointer-events-auto ring-1 ring-black/5`}
          >
            <div className="flex-shrink-0">
              <Bell className={`h-5 w-5 ${
                notif.type === 'error' ? 'text-red-500' : 
                notif.type === 'warning' ? 'text-amber-500' : 
                notif.type === 'info' ? 'text-green-500' : 
                'text-green-500'
              }`} />
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
              <p className="mt-1 text-xs text-gray-500 leading-relaxed">{notif.message}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={() => removeNotification(notif.id)}
                className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">Cerrar</span>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
