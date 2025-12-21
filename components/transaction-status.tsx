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
  onRefund?: () => void;
  showRefund?: boolean;
}

export function TransactionStatus({
  status,
  txHash,
  errorMessage,
  onRetry,
  onClose,
  onRefund,
  showRefund = false,
}: TransactionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-12 w-12 text-cyan-400" />,
          title: 'Esperando conexión',
          description: 'Conecta tu wallet para continuar',
          color: 'border-cyan-500/30 bg-slate-900/50',
        };
      case 'connected':
        return {
          icon: <CheckCircle2 className="h-12 w-12 text-cyan-400" />,
          title: 'Wallet conectada',
          description: 'Procede con el pago',
          color: 'border-cyan-500/30 bg-slate-900/50',
        };
      case 'signing':
        return {
          icon: <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />,
          title: 'Esperando firma',
          description: 'Confirma la transacción en Freighter',
          color: 'border-blue-500/30 bg-slate-900/50',
        };
      case 'submitted':
      case 'confirming':
        return {
          icon: <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />,
          title: 'Procesando pago...',
          description: 'Confirmando en la blockchain de Stellar',
          color: 'border-blue-500/30 bg-slate-900/50',
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="h-12 w-12 text-emerald-400" />,
          title: '¡Pago completado!',
          description: 'Tu transacción fue exitosa',
          color: 'border-emerald-500/30 bg-slate-900/50',
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-12 w-12 text-red-400" />,
          title: 'Error en el pago',
          description: errorMessage || 'No se pudo completar la transacción',
          color: 'border-red-500/30 bg-slate-900/50',
        };
      case 'expired':
        return {
          icon: <AlertCircle className="h-12 w-12 text-orange-400" />,
          title: 'Enlace expirado',
          description: 'Este enlace de pago ya no es válido',
          color: 'border-orange-500/30 bg-slate-900/50',
        };
      default:
        return {
          icon: <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />,
          title: 'Procesando...',
          description: 'Por favor espera',
          color: 'border-slate-700 bg-slate-900/50',
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
            <h3 className="text-xl font-semibold mb-1 text-white">{config.title}</h3>
            <p className="text-sm text-slate-400">{config.description}</p>
          </div>

          {txHash && (
            <div className="w-full p-3 bg-slate-800/70 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Hash de transacción:</p>
              <p className="text-xs font-mono break-all text-white">{txHash}</p>
              <a
                href={`https://stellar.expert/explorer/${
                  process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'
                    ? 'public'
                    : 'testnet'
                }/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline mt-2 inline-block"
              >
                Ver en Stellar Expert →
              </a>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {status === 'failed' && onRetry && (
              <Button onClick={onRetry} variant="default" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0">
                Reintentar
              </Button>
            )}
            {status === 'completed' && showRefund && onRefund && (
              <Button onClick={onRefund} variant="outline" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
                Solicitar Reembolso
              </Button>
            )}
            {(status === 'completed' || status === 'failed' || status === 'expired') &&
              onClose && (
                <Button onClick={onClose} variant="outline" className="border-slate-700 hover:bg-slate-800 text-white">
                  Cerrar
                </Button>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
