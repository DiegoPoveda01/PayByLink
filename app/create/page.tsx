'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  Link as LinkIcon,
  Copy,
  Download,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { isValidStellarAddress } from '@/lib/stellar/config';

export default function CreateLinkPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<{
    url: string;
    qrCode: string | null;
    expiresAt: string;
  } | null>(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USDC' as 'USDC' | 'XLM',
    description: '',
    recipientAddress: '',
    expiresIn: '1440', // 24 horas
    ownerEmail: '',
  });

  const { toast } = useToast();

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      // Validaciones básicas
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Ingresa un monto válido');
      }

      if (!formData.description.trim()) {
        throw new Error('Ingresa una descripción');
      }

      if (!isValidStellarAddress(formData.recipientAddress)) {
        throw new Error('Dirección Stellar inválida');
      }

      // Llamar API
      const response = await fetch('/api/links/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          description: formData.description,
          recipientAddress: formData.recipientAddress,
          expiresIn: parseInt(formData.expiresIn),
          ownerEmail: formData.ownerEmail || null,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.errors?.[0] || 'Error al crear el link');
      }

      setGeneratedLink({
        url: data.data.url,
        qrCode: data.data.qrCode,
        expiresAt: data.data.expiresAt,
      });

      toast({
        title: '¡Link generado!',
        description: 'Tu enlace de pago está listo para compartir',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink.url);
      toast({
        title: '¡Copiado!',
        description: 'Link copiado al portapapeles',
      });
    }
  };

  const downloadQR = () => {
    if (generatedLink?.qrCode) {
      const link = document.createElement('a');
      link.href = generatedLink.qrCode;
      link.download = 'payment-qr.png';
      link.click();
    }
  };

  const resetForm = () => {
    setGeneratedLink(null);
    setFormData({
      amount: '',
      currency: 'USDC',
      description: '',
      recipientAddress: '',
      expiresIn: '1440',
      ownerEmail: '',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <LinkIcon className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">PayByLink</span>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Link>
            <h1 className="text-4xl font-bold mb-2">Crear Link de Pago</h1>
            <p className="text-muted-foreground">
              Completa los datos para generar tu enlace de pago en Stellar
            </p>
          </div>

          {!generatedLink ? (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Formulario */}
              <Card>
                <CardHeader>
                  <CardTitle>Datos del Pago</CardTitle>
                  <CardDescription>
                    Ingresa la información de tu cobro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGenerateLink} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Monto</Label>
                      <div className="flex gap-2">
                        <Input
                          id="amount"
                          type="number"
                          placeholder="50"
                          step="0.01"
                          min="0.01"
                          max="10000"
                          value={formData.amount}
                          onChange={(e) =>
                            setFormData({ ...formData, amount: e.target.value })
                          }
                          required
                        />
                        <select
                          value={formData.currency}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              currency: e.target.value as 'USDC' | 'XLM',
                            })
                          }
                          className="w-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="USDC">USDC</option>
                          <option value="XLM">XLM</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Input
                        id="description"
                        placeholder="Consultoría desarrollo web"
                        maxLength={100}
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        {formData.description.length}/100 caracteres
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recipient">Tu Dirección Stellar</Label>
                      <Input
                        id="recipient"
                        placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                        value={formData.recipientAddress}
                        onChange={(e) =>
                          setFormData({ ...formData, recipientAddress: e.target.value })
                        }
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Dirección donde recibirás el pago (G...)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ownerEmail">Tu correo (opcional, para notificaciones)</Label>
                      <Input
                        id="ownerEmail"
                        type="email"
                        placeholder="tucorreo@dominio.com"
                        value={formData.ownerEmail}
                        onChange={(e) =>
                          setFormData({ ...formData, ownerEmail: e.target.value })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Si lo ingresas, te enviaremos un correo cuando se complete el pago.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expires">Expira en</Label>
                      <select
                        id="expires"
                        value={formData.expiresIn}
                        onChange={(e) =>
                          setFormData({ ...formData, expiresIn: e.target.value })
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="60">1 hora</option>
                        <option value="360">6 horas</option>
                        <option value="720">12 horas</option>
                        <option value="1440">24 horas</option>
                        <option value="4320">3 días</option>
                        <option value="10080">7 días</option>
                      </select>
                    </div>

                    <Button
                      type="submit"
                      disabled={isGenerating}
                      className="w-full"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="mr-2 h-5 w-5" />
                          Generar Link
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card className="border-2 border-purple-200 bg-purple-50/50">
                <CardHeader>
                  <CardTitle>Vista Previa</CardTitle>
                  <CardDescription>
                    Así verá tu cliente el enlace de pago
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="text-center space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Pago solicitado
                      </div>
                      <div className="text-4xl font-bold">
                        {formData.amount || '0'} {formData.currency}
                      </div>
                      <div className="text-muted-foreground">
                        {formData.description || 'Descripción del pago'}
                      </div>
                      <div className="pt-4">
                        <div className="px-4 py-2 bg-gray-100 rounded text-xs text-muted-foreground">
                          Para: {formData.recipientAddress.substring(0, 8) || 'G...'}...
                        </div>
                      </div>
                      <Button className="w-full" disabled>
                        Conectar Wallet
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Link generado
            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <CardTitle>¡Link Generado Exitosamente!</CardTitle>
                </div>
                <CardDescription>
                  Comparte este enlace para recibir el pago
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* URL */}
                <div className="space-y-2">
                  <Label>Enlace de Pago</Label>
                  <div className="flex gap-2">
                    <Input value={generatedLink.url} readOnly />
                    <Button onClick={copyToClipboard} variant="outline">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* QR Code */}
                {generatedLink.qrCode && (
                  <div className="space-y-2">
                    <Label>Código QR</Label>
                    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg">
                      <img
                        src={generatedLink.qrCode}
                        alt="QR Code"
                        className="w-64 h-64"
                      />
                      <Button onClick={downloadQR} variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Descargar QR
                      </Button>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="text-sm text-muted-foreground">
                  <p>
                    Expira:{' '}
                    {new Date(generatedLink.expiresAt).toLocaleString('es-ES')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button onClick={resetForm} className="flex-1">
                    Crear Otro Link
                  </Button>
                  <Link href="/" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Volver al Inicio
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
