'use client';

import { AlertCircle, CheckCircle2, Loader2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type PaymentStatus =
  | 'pending'
  | 'connected'
  | 'signing'
  | 'submitted'
  | 'confirming'
  | 'completed'
  | 'failed'
  | 'expired';

interface TransactionStatusProps {
  status: PaymentStatus;
  txHash?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onClose?: () => void;
}

export function TransactionStatus({
  status,
  txHash,
  errorMessage,
  onRetry,
  onClose,
}: TransactionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-12 w-12 text-blue-500" />,
          title: 'Esperando conexión',
          description: 'Conecta tu wallet para continuar',
          color: 'border-blue-200 bg-blue-50',
        };
      case 'connected':
        return {
          icon: <CheckCircle2 className="h-12 w-12 text-blue-500" />,
          title: 'Wallet conectada',
          description: 'Procede con el pago',
          color: 'border-blue-200 bg-blue-50',
        };
      case 'signing':
        return {
          icon: <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />,
          title: 'Esperando firma',
          description: 'Confirma la transacción en Freighter',
          color: 'border-purple-200 bg-purple-50',
        };
      case 'submitted':
      case 'confirming':
        return {
          icon: <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />,
          title: 'Procesando pago...',
          description: 'Confirmando en la blockchain de Stellar',
          color: 'border-purple-200 bg-purple-50',
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="h-12 w-12 text-green-500" />,
          title: '¡Pago completado!',
          description: 'Tu transacción fue exitosa',
          color: 'border-green-200 bg-green-50',
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-12 w-12 text-red-500" />,
          title: 'Error en el pago',
          description: errorMessage || 'No se pudo completar la transacción',
          color: 'border-red-200 bg-red-50',
        };
      case 'expired':
        return {
          icon: <AlertCircle className="h-12 w-12 text-orange-500" />,
          title: 'Enlace expirado',
          description: 'Este enlace de pago ya no es válido',
          color: 'border-orange-200 bg-orange-50',
        };
      default:
        return {
          icon: <Loader2 className="h-12 w-12 text-gray-500 animate-spin" />,
          title: 'Procesando...',
          description: 'Por favor espera',
          color: 'border-gray-200 bg-gray-50',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card className={`border-2 ${config.color}`}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {config.icon}
          <div>
            <h3 className="text-xl font-semibold mb-1">{config.title}</h3>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>

          {txHash && (
            <div className="w-full p-3 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Hash de transacción:</p>
              <p className="text-xs font-mono break-all">{txHash}</p>
              <a
                href={`https://stellar.expert/explorer/${
                  process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'
                    ? 'public'
                    : 'testnet'
                }/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mt-2 inline-block"
              >
                Ver en Stellar Expert →
              </a>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {status === 'failed' && onRetry && (
              <Button onClick={onRetry} variant="default">
                Reintentar
              </Button>
            )}
            {(status === 'completed' || status === 'failed' || status === 'expired') &&
              onClose && (
                <Button onClick={onClose} variant="outline">
                  Cerrar
                </Button>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
