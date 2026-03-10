import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Check if we've already shown it in this session
      const hasShown = sessionStorage.getItem('pwa_prompt_shown');
      if (!hasShown) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
      console.log('PWA was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
    } catch (error) {
      console.error('Error during PWA installation:', error);
    } finally {
      // We've used the prompt, and can't use it again
      setDeferredPrompt(null);
      setShowPrompt(false);
      sessionStorage.setItem('pwa_prompt_shown', 'true');
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_shown', 'true');
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:right-6 md:w-96"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#215732]/10 p-3 rounded-xl">
                <Smartphone className="h-6 w-6 text-[#215732]" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Instalar Aplicación</h3>
                <p className="text-sm text-slate-500">Accede más rápido desde tu pantalla de inicio.</p>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-[#215732] text-white py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-[#1a4528] transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Instalar Ahora
            </button>
            <button
              onClick={handleClose}
              className="flex-1 bg-slate-100 text-slate-700 py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-slate-200 transition-colors"
            >
              Más tarde
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
