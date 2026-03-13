'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from './ui/button';

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: any) => {
      // Evitar que el navegador muestre automáticamente el prompt
      e.preventDefault();
      // Guardar el evento para dispararlo más tarde
      setDeferredPrompt(e);
      setIsReady(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar el prompt de instalación
    deferredPrompt.prompt();

    // Esperar a que el usuario responda
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
    setIsReady(false);
  };

  // No mostrar nada si ya está instalada o si el navegador no soporta el prompt
  if (isInstalled) return null;

  // En iOS, beforeinstallprompt no existe, así que isReady será false siempre.
  // Podríamos mostrar instrucciones específicas para iOS aquí, pero primero implementaremos el botón estándar.
  if (!isReady) {
    // Opcional: Mostrar esto solo en iOS si queremos dar instrucciones manuales
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      return (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4 text-sm text-amber-200">
          <p className="font-semibold mb-1">Para instalar en iOS:</p>
          <p>Pulsa el icono de compartir y selecciona &quot;Añadir a la pantalla de inicio&quot;.</p>
        </div>
      );
    }
    return null;
  }

  return (
    <Button 
      onClick={handleInstallClick}
      className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white"
    >
      <Download size={18} />
      Descargar App
    </Button>
  );
}
