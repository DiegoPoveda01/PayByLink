'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { StarfieldBackground } from '@/components/starfield';
import { WalletConnect } from '@/components/wallet-connect';
import { TransactionStatus } from '@/components/transaction-status';
import { Heart, Coffee, DollarSign, Sparkles, Loader2 } from 'lucide-react';
import { buildPaymentTransaction } from '@/lib/stellar/transaction';
import { signAndSubmitTransaction } from '@/lib/wallet/freighter';
import { recordLinkView } from '@/lib/analytics';

interface TipConfig {
  recipient: string;
  currency: 'USDC' | 'XLM';
  description: string;
  suggestedAmounts: number[];
}

const DEFAULT_TIPS = [2, 5, 10, 20];

export default function TipPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tipId = params?.id as string;

  const [tipConfig, setTipConfig] = useState<TipConfig | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [wallet, setWallet] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<'pending' | 'completed' | 'failed' | null>(null);

  useEffect(() => {
    loadTipConfig();
  }, [tipId]);

  const loadTipConfig = async () => {
    try {
      // Record view
      if (typeof window !== 'undefined') {
        await recordLinkView(
          tipId,
          navigator.userAgent,
          undefined // IP will be captured server-side if needed
        );
      }

      const response = await fetch(`/api/tips/${tipId}`);
      if (!response.ok) {
        throw new Error('Tip link not found');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Invalid tip link');
      }

      setTipConfig(data.data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar el enlace de propina',
      });
      setTimeout(() => router.push('/'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount('');
  };

  const handleCustom = () => {
    setIsCustom(true);
    setSelectedAmount(null);
  };

  const handleSendTip = async () => {
    if (!wallet || !tipConfig) return;

    const amount = isCustom ? parseFloat(customAmount) : selectedAmount;
    if (!amount || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ingresa un monto válido',
      });
      return;
    }

    setIsProcessing(true);
    setTxStatus('pending');

    try {
      // Build transaction
      const xdr = await buildPaymentTransaction({
        sourcePublicKey: wallet,
        destinationPublicKey: tipConfig.recipient,
        amount: amount.toString(),
        assetCode: tipConfig.currency,
        memo: `Propina: ${tipConfig.description.substring(0, 20)}`,
      });

      // Submit transaction
      const result = await signAndSubmitTransaction(xdr);

      if (result.hash) {
        setTxHash(result.hash);
        setTxStatus('completed');

        // Record conversion
        await fetch(`/api/tips/${tipId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txHash: result.hash,
            amount,
          }),
        });

        toast({
          title: '¡Gracias por tu propina!',
          description: `${amount} ${tipConfig.currency} enviados exitosamente`,
        });
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      setTxStatus('failed');
      toast({
        variant: 'destructive',
        title: 'Error al enviar propina',
        description: error.message || 'Intenta nuevamente',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <StarfieldBackground starCount={200} />
        <div className="relative z-10">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
        </div>
      </div>
    );
  }

  if (!tipConfig) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <StarfieldBackground starCount={200} />
        <div className="relative z-10 text-center">
          <p className="text-xl text-slate-400">Enlace de propina no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <StarfieldBackground starCount={200} />

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-cyan-500/30 bg-slate-900/90 backdrop-blur">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-3xl text-white">Enviar Propina</CardTitle>
              <CardDescription className="text-lg text-slate-300">
                {tipConfig.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {!wallet ? (
                <div className="space-y-4">
                  <div className="text-center text-slate-400 mb-6">
                    Conecta tu wallet para enviar una propina
                  </div>
                  <WalletConnect onConnect={setWallet} />
                </div>
              ) : txStatus === 'completed' ? (
                <TransactionStatus 
                  status="completed"
                  txHash={txHash || ''}
                />
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-slate-400 mb-4">Selecciona un monto</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {(tipConfig.suggestedAmounts || DEFAULT_TIPS).map((amount) => (
                        <Button
                          key={amount}
                          onClick={() => handleAmountSelect(amount)}
                          className={`h-20 text-xl font-bold border-2 ${
                            selectedAmount === amount
                              ? 'bg-cyan-600 border-cyan-400 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <DollarSign className="h-5 w-5 mr-1" />
                          {amount} {tipConfig.currency}
                        </Button>
                      ))}
                    </div>

                    <Button
                      onClick={handleCustom}
                      variant="outline"
                      className={`w-full border-2 ${
                        isCustom
                          ? 'border-cyan-400 bg-cyan-600/20 text-cyan-300'
                          : 'border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Monto Personalizado
                    </Button>
                  </div>

                  {isCustom && (
                    <div className="space-y-2">
                      <Label className="text-slate-200">Monto Personalizado</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0.01"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="bg-slate-800/50 border-slate-700 text-white text-xl text-center"
                          autoFocus
                        />
                        <span className="text-slate-400 font-medium">{tipConfig.currency}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button
                      onClick={handleSendTip}
                      disabled={isProcessing || (!selectedAmount && !customAmount)}
                      className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Coffee className="mr-2 h-5 w-5" />
                          Enviar {isCustom ? customAmount : selectedAmount} {tipConfig.currency}
                        </>
                      )}
                    </Button>
                  </div>

                  {txStatus === 'failed' && (
                    <TransactionStatus 
                      status="failed"
                      message="Error al procesar. Intenta nuevamente"
                    />
                  )}

                  <div className="text-center text-xs text-slate-500 pt-4">
                    Wallet conectada: {wallet.substring(0, 8)}...{wallet.substring(wallet.length - 8)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
