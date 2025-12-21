'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WalletConnect } from '@/components/wallet-connect';
import { TransactionStatus, PaymentStatus } from '@/components/transaction-status';
import { useToast } from '@/components/ui/use-toast';
import { Link as LinkIcon, Loader2, Clock, ExternalLink } from 'lucide-react';
import { buildPaymentTransaction } from '@/lib/stellar/transaction';
import { signAndSubmitTransaction } from '@/lib/wallet/freighter';
import { truncateAddress } from '@/lib/stellar/config';
import { formatTimeRemaining } from '@/lib/payment-links';
import { StarfieldBackground } from '@/components/starfield';

interface PaymentLink {
  amount: number;
  currency: 'USDC' | 'XLM';
  description: string;
  recipient: string;
  expired: boolean;
  used: boolean;
  expiresAt: string;
  createdAt: string;
}

export default function PaymentPage() {
  const params = useParams();
  const linkId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const { toast } = useToast();

  // Cargar datos del enlace
  useEffect(() => {
    const fetchLink = async () => {
      try {
        // Registrar view
        await fetch(`/api/links/${linkId}/view`, { method: 'POST' }).catch(() => {});

        const response = await fetch(`/api/links/${linkId}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Link no encontrado');
        }

        setPaymentLink(data.data);

        if (data.data.expired) {
          setPaymentStatus('expired');
        } else if (data.data.used) {
          toast({
            title: 'Link ya utilizado',
            description: 'Este enlace de pago ya fue procesado',
          });
        }
      } catch (error: any) {
        setError(error.message);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLink();
  }, [linkId, toast]);

  // Actualizar contador de tiempo
  useEffect(() => {
    if (!paymentLink || paymentLink.expired) return;

    const interval = setInterval(() => {
      const remaining = formatTimeRemaining(new Date(paymentLink.expiresAt).getTime());
      setTimeRemaining(remaining);

      if (remaining === 'Expirado') {
        setPaymentStatus('expired');
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentLink]);

  const handleWalletConnect = (publicKey: string) => {
    setConnectedWallet(publicKey);
    setPaymentStatus('connected');
  };

  const handlePayment = async () => {
    if (!connectedWallet || !paymentLink) return;

    try {
      setPaymentStatus('signing');

      // 1. Construir transacción
      const xdr = await buildPaymentTransaction({
        sourcePublicKey: connectedWallet,
        destinationPublicKey: paymentLink.recipient,
        amount: paymentLink.amount.toString(),
        assetCode: paymentLink.currency,
        memo: paymentLink.description,
      });

      setPaymentStatus('submitted');

      // 2. Firmar y enviar con Freighter
      const result = await signAndSubmitTransaction(xdr);

      if (result.successful) {
        setTxHash(result.hash);
        setPaymentStatus('confirming');

        // 3. Marcar enlace como usado
        await fetch(`/api/links/${linkId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txHash: result.hash }),
        });

        // Pequeño delay para efecto
        setTimeout(() => {
          setPaymentStatus('completed');
          toast({
            title: '¡Pago exitoso!',
            description: 'Tu transacción ha sido confirmada',
          });
        }, 1500);
      } else {
        throw new Error('Transacción fallida');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      setError(error.message || 'Error al procesar el pago');
      toast({
        variant: 'destructive',
        title: 'Error en el pago',
        description: error.message || 'No se pudo completar la transacción',
      });
    }
  };

  const handleRetry = () => {
    setPaymentStatus('connected');
    setError(null);
    setTxHash(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-cyan-400" />
          <p className="text-slate-400">Cargando enlace de pago...</p>
        </div>
      </div>
    );
  }

  if (error && !paymentLink) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 overflow-hidden flex items-center justify-center p-4">
        <StarfieldBackground starCount={180} />

        <div className="relative z-10">
        <Card className="max-w-md w-full border-red-500/30 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-red-400">Error</CardTitle>
            <CardDescription className="text-slate-400">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-white">
                Volver al Inicio
              </Button>
            </Link>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
      <StarfieldBackground starCount={220} />

      <div className="relative z-10">
      {/* Navbar */}
      <nav className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <LinkIcon className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">PayByLink</span>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto space-y-6">
          {paymentStatus === 'expired' || paymentStatus === 'completed' || paymentStatus === 'failed' ? (
            <TransactionStatus
              status={paymentStatus}
              txHash={txHash || undefined}
              errorMessage={error || undefined}
              onRetry={handleRetry}
              onClose={() => window.location.href = '/'}
            />
          ) : (
            <>
              {/* Información del pago */}
              <Card className="border-2 border-cyan-500/30 bg-slate-900/50">
                <CardHeader className="text-center">
                  <div className="text-sm text-slate-400 mb-2">
                    💳 Pago Solicitado
                  </div>
                  <CardTitle className="text-5xl font-bold mb-2 text-white">
                    {paymentLink?.amount} {paymentLink?.currency}
                  </CardTitle>
                  <CardDescription className="text-lg text-slate-300">
                    {paymentLink?.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Destinatario */}
                  <div className="flex items-center justify-between p-3 bg-slate-800/70 rounded-lg border border-slate-700">
                    <span className="text-sm text-slate-400">Para:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-white">
                        {truncateAddress(paymentLink?.recipient || '')}
                      </span>
                      <a
                        href={`https://stellar.expert/explorer/${
                          process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'
                            ? 'public'
                            : 'testnet'
                        }/account/${paymentLink?.recipient}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  {/* Tiempo restante */}
                  {timeRemaining && timeRemaining !== 'Expirado' && (
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                      <Clock className="h-4 w-4" />
                      <span>Expira en: {timeRemaining}</span>
                    </div>
                  )}

                  {/* Wallet Connect / Pagar */}
                  {paymentStatus === 'pending' && (
                    <div className="pt-4">
                      <WalletConnect
                        onConnect={handleWalletConnect}
                        connectedAddress={connectedWallet || undefined}
                      />
                    </div>
                  )}

                  {paymentStatus === 'connected' && (
                    <div className="pt-4 space-y-3">
                      <WalletConnect
                        onConnect={handleWalletConnect}
                        connectedAddress={connectedWallet || undefined}
                      />
                      <Button onClick={handlePayment} size="lg" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0">
                        Pagar {paymentLink?.amount} {paymentLink?.currency}
                      </Button>
                    </div>
                  )}

                  {(paymentStatus === 'signing' ||
                    paymentStatus === 'submitted' ||
                    paymentStatus === 'confirming') && (
                    <div className="pt-4">
                      <TransactionStatus
                        status={paymentStatus}
                        txHash={txHash || undefined}
                      />
                    </div>
                  )}

                  {/* Seguridad */}
                  <div className="text-center text-xs text-slate-400 pt-2">
                    🔒 Pago seguro en Stellar Network
                  </div>
                </CardContent>
              </Card>

              {/* Info adicional */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2 text-white">
                    <LinkIcon className="h-4 w-4" />
                    ¿No tienes Freighter Wallet?
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">
                    Necesitas Freighter para pagar. Es una wallet gratuita y segura
                    para Stellar.
                  </p>
                  <a
                    href="https://www.freighter.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="w-full border-slate-700 hover:bg-slate-800 text-white">
                      Instalar Freighter
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        </div>
        </div>
      </div>
    );
}
