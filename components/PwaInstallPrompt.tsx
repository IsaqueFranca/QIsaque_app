
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share, X, GraduationCap } from 'lucide-react';
import { Button } from './ui/button';

export const PwaInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Chrome/Android deferred prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not already installed and not dismissed recently
      if (!localStorage.getItem('pwaPromptDismissed')) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS and not installed, show prompt (unless dismissed)
    if (isIosDevice && !localStorage.getItem('pwaPromptDismissed')) {
      // Delay slightly for better UX
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwaPromptDismissed', 'true');
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-8 md:bottom-8 md:w-96"
      >
        <div className="bg-card/95 backdrop-blur-md border border-primary/20 p-4 rounded-xl shadow-2xl relative">
          <button 
            onClick={handleDismiss} 
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-700 to-slate-900 flex items-center justify-center shrink-0 shadow-lg">
               <GraduationCap className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-base mb-1">Instale o QIsaque</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Adicione à tela inicial para acesso rápido e modo offline.
              </p>

              {isIOS ? (
                <div className="text-sm bg-secondary/50 p-3 rounded-lg border border-border">
                  <p className="flex items-center gap-2 mb-1">
                    1. Toque em Compartilhar <Share className="w-4 h-4" />
                  </p>
                  <p className="flex items-center gap-2">
                    2. Selecione "Adicionar à Tela de Início"
                  </p>
                </div>
              ) : (
                <Button 
                  onClick={handleInstallClick} 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Instalar Aplicativo
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
