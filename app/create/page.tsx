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
import { StarfieldBackground } from '@/components/starfield';

// Función de validación de email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function CreateLinkPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<{
    id: string;
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

  // Estados de validación
  const [validations, setValidations] = useState({
    recipientAddress: { isValid: true, message: '' },
    ownerEmail: { isValid: true, message: '' },
  });

  const { toast } = useToast();

  // Validar dirección Stellar en tiempo real
  const validateStellarAddress = (address: string) => {
    if (!address) {
      setValidations(prev => ({
        ...prev,
        recipientAddress: { isValid: true, message: '' },
      }));
      return;
    }

    if (!isValidStellarAddress(address)) {
      setValidations(prev => ({
        ...prev,
        recipientAddress: {
          isValid: false,
          message: 'Debe comenzar con G y tener 56 caracteres',
        },
      }));
    } else {
      setValidations(prev => ({
        ...prev,
        recipientAddress: { isValid: true, message: '✓ Dirección válida' },
      }));
    }
  };

  // Validar email en tiempo real
  const validateEmail = (email: string) => {
    if (!email) {
      setValidations(prev => ({
        ...prev,
        ownerEmail: { isValid: true, message: '' },
      }));
      return;
    }

    if (!isValidEmail(email)) {
      setValidations(prev => ({
        ...prev,
        ownerEmail: {
          isValid: false,
          message: 'Formato de email inválido',
        },
      }));
    } else {
      setValidations(prev => ({
        ...prev,
        ownerEmail: { isValid: true, message: '✓ Email válido' },
      }));
    }
  };

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      // Validaciones básicas
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Ingresa un monto válido mayor a 0');
      }

      if (!formData.description.trim()) {
        throw new Error('Ingresa una descripción del pago');
      }

      // Validar dirección Stellar
      if (!formData.recipientAddress.trim()) {
        throw new Error('Ingresa tu dirección Stellar');
      }

      if (!isValidStellarAddress(formData.recipientAddress)) {
        throw new Error('La dirección Stellar debe comenzar con G y tener 56 caracteres');
      }

      // Validar email si se proporciona
      if (formData.ownerEmail && !isValidEmail(formData.ownerEmail)) {
        throw new Error('Ingresa un correo electrónico válido');
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
        id: data.data.id,
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
      link.download = `paybylink-qr-${generatedLink.id}.png`;
      link.click();
      toast({
        title: 'QR Descargado',
        description: 'Código QR guardado correctamente',
      });
    }
  };

  const shareWhatsApp = () => {
    if (generatedLink) {
      const text = `Pago de ${formData.amount} ${formData.currency} - ${formData.description}\n\nPaga aquí: ${generatedLink.url}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const shareTwitter = () => {
    if (generatedLink) {
      const text = `💳 Solicitud de pago: ${formData.amount} ${formData.currency}\n\nPaga con Stellar de forma instantánea:\n${generatedLink.url}`;
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(twitterUrl, '_blank');
    }
  };

  const shareEmail = () => {
    if (generatedLink) {
      const subject = `Solicitud de pago - ${formData.amount} ${formData.currency}`;
      const body = `Hola,\n\nTe solicito un pago de ${formData.amount} ${formData.currency} por: ${formData.description}\n\nPuedes pagar de forma segura a través de este enlace:\n${generatedLink.url}\n\nGracias!`;
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;
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
    <div className="min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
      <StarfieldBackground starCount={200} />

      <div className="relative z-10">
      {/* Navbar */}
      <nav className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <LinkIcon className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">PayByLink</span>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-3 md:mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              <span className="text-xs md:text-sm font-medium">Volver al inicio</span>
            </Link>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Crear Enlace de Pago</h1>
            <p className="text-slate-400 text-sm md:text-lg">
              Genera un link de pago en segundos. Sin registro.
            </p>
          </div>

          {!generatedLink ? (
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {/* Formulario */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-lg md:text-xl">Datos del Pago</CardTitle>
                  <CardDescription className="text-slate-400 text-sm">
                    Ingresa la información de tu cobro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGenerateLink} className="space-y-3 md:space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-slate-200 text-sm">Monto</Label>
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
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
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
                          className="w-24 rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white"
                        >
                          <option value="USDC">USDC</option>
                          <option value="XLM">XLM</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-slate-200">Descripción</Label>
                      <Input
                        id="description"
                        placeholder="Consultoría desarrollo web"
                        maxLength={100}
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                        required
                      />
                      <p className="text-xs text-slate-500">
                        {formData.description.length}/100 caracteres
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recipient" className="text-slate-200">Tu Dirección Stellar</Label>
                      <Input
                        id="recipient"
                        placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                        value={formData.recipientAddress}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, recipientAddress: value });
                          validateStellarAddress(value);
                        }}
                        onBlur={() => validateStellarAddress(formData.recipientAddress)}
                        className={`bg-slate-800/50 text-white placeholder:text-slate-500 font-mono text-sm ${
                          formData.recipientAddress && !validations.recipientAddress.isValid
                            ? 'border-red-500 focus-visible:ring-red-500'
                            : formData.recipientAddress && validations.recipientAddress.isValid
                            ? 'border-emerald-500 focus-visible:ring-emerald-500'
                            : 'border-slate-700'
                        }`}
                        required
                      />
                      <p className={`text-xs ${
                        formData.recipientAddress && !validations.recipientAddress.isValid
                          ? 'text-red-400'
                          : formData.recipientAddress && validations.recipientAddress.isValid && validations.recipientAddress.message
                          ? 'text-emerald-400'
                          : 'text-slate-500'
                      }`}>
                        {validations.recipientAddress.message || 'Dirección donde recibirás el pago (G...)'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ownerEmail" className="text-slate-200">Tu correo (opcional, para notificaciones)</Label>
                      <Input
                        id="ownerEmail"
                        type="email"
                        placeholder="tucorreo@dominio.com"
                        value={formData.ownerEmail}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, ownerEmail: value });
                          validateEmail(value);
                        }}
                        onBlur={() => validateEmail(formData.ownerEmail)}
                        className={`bg-slate-800/50 text-white placeholder:text-slate-500 ${
                          formData.ownerEmail && !validations.ownerEmail.isValid
                            ? 'border-red-500 focus-visible:ring-red-500'
                            : formData.ownerEmail && validations.ownerEmail.isValid && validations.ownerEmail.message
                            ? 'border-emerald-500 focus-visible:ring-emerald-500'
                            : 'border-slate-700'
                        }`}
                      />
                      <p className={`text-xs ${
                        formData.ownerEmail && !validations.ownerEmail.isValid
                          ? 'text-red-400'
                          : formData.ownerEmail && validations.ownerEmail.isValid && validations.ownerEmail.message
                          ? 'text-emerald-400'
                          : 'text-slate-500'
                      }`}>
                        {validations.ownerEmail.message || 'Si lo ingresas, te enviaremos un correo cuando se complete el pago.'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expires" className="text-slate-200">Expira en</Label>
                      <select
                        id="expires"
                        value={formData.expiresIn}
                        onChange={(e) =>
                          setFormData({ ...formData, expiresIn: e.target.value })
                        }
                        className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white"
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
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0"
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
              <Card className="border-2 border-cyan-500/30 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-white">Vista Previa</CardTitle>
                  <CardDescription className="text-slate-400">
                    Así verá tu cliente el enlace de pago
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-800/70 rounded-lg p-6 shadow-sm border border-slate-700">
                    <div className="text-center space-y-4">
                      <div className="text-sm text-slate-400">
                        Pago solicitado
                      </div>
                      <div className="text-4xl font-bold text-white">
                        {formData.amount || '0'} {formData.currency}
                      </div>
                      <div className="text-slate-300">
                        {formData.description || 'Descripción del pago'}
                      </div>
                      <div className="pt-4">
                        <div className="px-4 py-2 bg-slate-900/70 rounded text-xs text-slate-500 font-mono">
                          Para: {formData.recipientAddress.substring(0, 8) || 'G...'}...
                        </div>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0" disabled>
                        Conectar Wallet
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Link generado
            <Card className="border-2 border-emerald-500/50 bg-slate-900/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  <CardTitle className="text-white">¡Link Generado Exitosamente!</CardTitle>
                </div>
                <CardDescription className="text-slate-400">
                  Comparte este enlace para recibir el pago
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* URL */}
                <div className="space-y-2">
                  <Label className="text-slate-200">Enlace de Pago</Label>
                  <div className="flex gap-2">
                    <Input value={generatedLink.url} readOnly className="bg-slate-800/50 border-slate-700 text-white font-mono text-sm" />
                    <Button onClick={copyToClipboard} variant="outline" className="border-slate-700 hover:bg-slate-800 hover:text-white">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* QR Code */}
                {generatedLink.qrCode && (
                  <div className="space-y-2">
                    <Label>Código QR</Label>
                    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-xl border-2 border-dashed border-slate-200">
                      <img
                        src={generatedLink.qrCode}
                        alt="QR Code"
                        className="w-64 h-64 rounded-lg shadow-lg"
                      />
                      <Button onClick={downloadQR} variant="outline" size="sm" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Descargar QR como PNG
                      </Button>
                    </div>
                  </div>
                )}

                {/* Share Options */}
                <div className="space-y-3">
                  <Label className="text-slate-200">Compartir Enlace</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={shareWhatsApp} variant="outline" className="w-full bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-400">
                      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      WhatsApp
                    </Button>
                    <Button onClick={shareTwitter} variant="outline" className="w-full bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-400">
                      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                      Twitter
                    </Button>
                    <Button onClick={copyToClipboard} variant="outline" className="w-full col-span-2 border-slate-700 hover:bg-slate-800 text-white">
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Enlace
                    </Button>
                    <Button onClick={shareEmail} variant="outline" className="w-full col-span-2 border-slate-700 hover:bg-slate-800 text-white">
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                      Enviar por Email
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="text-sm text-slate-400">
                  <p>
                    Expira:{' '}
                    {new Date(generatedLink.expiresAt).toLocaleString('es-ES')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button onClick={resetForm} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0">
                    Crear Otro Link
                  </Button>
                  <Link href="/" className="flex-1">
                    <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-white">
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
      </div>
    );
}
