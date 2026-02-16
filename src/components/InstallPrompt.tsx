import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // Check if dismissed recently (within 7 days)
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Listen for install prompt (Android/Desktop)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Show iOS prompt after a short delay
    if (iOS) {
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', new Date().toISOString());
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-fade-in">
      <div className="max-w-md mx-auto glass-card rounded-xl p-4 border border-primary/30 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-primary-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">Install App</h3>
            {isIOS ? (
              <p className="text-sm text-muted-foreground mt-1">
                Tap <Share className="w-4 h-4 inline mx-1" /> then "Add to Home Screen" for quick access
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                Install for quick access from your home screen
              </p>
            )}
          </div>

          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isIOS && deferredPrompt && (
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={handleDismiss}>
              Not now
            </Button>
            <Button className="flex-1" onClick={handleInstall}>
              Install
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
