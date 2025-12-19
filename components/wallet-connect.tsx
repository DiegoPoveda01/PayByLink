'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle2 } from 'lucide-react';
import {
  connectFreighterWallet,
  isFreighterInstalled,
  FreighterError,
} from '@/lib/wallet/freighter';
import { useToast } from '@/components/ui/use-toast';
import { truncateAddress } from '@/lib/stellar/config';

interface WalletConnectProps {
  onConnect: (publicKey: string) => void;
  connectedAddress?: string;
}

export function WalletConnect({ onConnect, connectedAddress }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Verificar instalación
      const installed = await isFreighterInstalled();
      
      if (!installed) {
        toast({
          variant: 'destructive',
          title: 'Freighter no instalado',
          description: (
            <div>
              Instala Freighter Wallet desde{' '}
              <a
                href="https://www.freighter.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                freighter.app
              </a>
            </div>
          ),
        });
        return;
      }

      // Conectar wallet
      const publicKey = await connectFreighterWallet();
      onConnect(publicKey);
      
      toast({
        title: '¡Wallet conectada!',
        description: `Conectado a ${truncateAddress(publicKey)}`,
      });
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      
      let errorMessage = 'Error al conectar wallet';
      if (error.message === FreighterError.NOT_ALLOWED) {
        errorMessage = 'Debes autorizar el acceso a Freighter';
      }
      
      toast({
        variant: 'destructive',
        title: 'Error de conexión',
        description: errorMessage,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  if (connectedAddress) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <span className="text-sm font-medium text-green-900">
          {truncateAddress(connectedAddress)}
        </span>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      size="lg"
      className="w-full"
    >
      <Wallet className="mr-2 h-5 w-5" />
      {isConnecting ? 'Conectando...' : 'Conectar Freighter Wallet'}
    </Button>
  );
}
