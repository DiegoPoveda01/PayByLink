'use client';

import { useState, useEffect } from 'react';
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
  Save,
  Folder,
  Trash2,
  MessageCircle,
  Send,
  Mail,
  Share2,
} from 'lucide-react';
import { isValidStellarAddress } from '@/lib/stellar/config';
import { StarfieldBackground } from '@/components/starfield';
import {
  saveTemplate,
  getTemplates,
  deleteTemplate,
  incrementTemplateUsage,
  type PaymentTemplate,
} from '@/lib/templates';
import {
  getWhatsAppShareUrl,
  getTelegramShareUrl,
  getEmailShareUrl,
  isWebShareSupported,
  shareViaWebShare,
} from '@/lib/share';

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

  // Templates
  const [templates, setTemplates] = useState<PaymentTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const { toast } = useToast();

  // Cargar templates al montar
  useEffect(() => {
    setTemplates(getTemplates());
  }, []);

  // Guardar como template
  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ingresa un nombre para el template',
      });
      return;
    }

    try {
      const newTemplate = saveTemplate({
        name: templateName,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        currency: formData.currency,
        description: formData.description || undefined,
        recipientAddress: formData.recipientAddress,
        expiresIn: parseInt(formData.expiresIn),
      });

      setTemplates(getTemplates());
      setTemplateName('');
      setShowSaveTemplate(false);

      toast({
        title: 'Template guardado',
        description: `"${newTemplate.name}" guardado correctamente`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar el template',
      });
    }
  };

  // Cargar template
  const handleLoadTemplate = (template: PaymentTemplate) => {
    setFormData({
      amount: template.amount?.toString() || '',
      currency: template.currency,
      description: template.description || '',
      recipientAddress: template.recipientAddress,
      expiresIn: template.expiresIn.toString(),
      ownerEmail: formData.ownerEmail, // Mantener email actual
    });

    incrementTemplateUsage(template.id);
    setTemplates(getTemplates()); // Actualizar lista
    setShowTemplates(false);

    toast({
      title: 'Template cargado',
      description: `"${template.name}" aplicado al formulario`,
    });
  };

  // Eliminar template
  const handleDeleteTemplate = (id: string, name: string) => {
    if (confirm(`¿Eliminar template "${name}"?`)) {
      deleteTemplate(id);
      setTemplates(getTemplates());
      toast({
        title: 'Template eliminado',
        description: `"${name}" eliminado correctamente`,
      });
    }
  };

  // Compartir mejorado
  const handleShareWhatsApp = () => {
    if (!generatedLink) return;

    const url = getWhatsAppShareUrl(
      formData.description,
      parseFloat(formData.amount),
      formData.currency,
      generatedLink.url
    );

    window.open(url, '_blank');
  };

  const handleShareTelegram = () => {
    if (!generatedLink) return;

    const url = getTelegramShareUrl(
      formData.description,
      parseFloat(formData.amount),
      formData.currency,
      generatedLink.url
    );

    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    if (!generatedLink) return;

    const url = getEmailShareUrl(
      formData.description,
      parseFloat(formData.amount),
      formData.currency,
      generatedLink.url
    );

    window.location.href = url;
  };

  const handleNativeShare = async () => {
    if (!generatedLink) return;

    const shared = await shareViaWebShare({
      title: 'Solicitud de Pago - PayByLink',
      text: `${formData.description} - ${formData.amount} ${formData.currency}`,
      url: generatedLink.url,
    });

    if (shared) {
      toast({
        title: 'Compartido',
        description: 'Link compartido exitosamente',
      });
    }
  };

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
        recipientAddress: { isValid: true, message: 'Dirección válida' },
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
        ownerEmail: { isValid: true, message: 'Email válido' },
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

                    {/* Template Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        aria-label="Cargar Template"
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                        onClick={() => setShowTemplates(!showTemplates)}
                      >
                        <Folder className="w-4 h-4 mr-2" />
                        Cargar Template
                      </Button>
                      <Button
                        type="button"
                        aria-label="Guardar Template"
                        className={`flex-1 text-white border-0 ${formData.recipientAddress ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-700 cursor-not-allowed'}`}
                        onClick={() => setShowSaveTemplate(!showSaveTemplate)}
                        disabled={!formData.recipientAddress}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Guardar
                      </Button>
                    </div>

                    {/* Save Template Form */}
                    {showSaveTemplate && (
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 space-y-2">
                        <Label htmlFor="templateName" className="text-slate-200 text-sm">
                          Nombre del Template
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="templateName"
                            placeholder="Ej: Consultoría mensual"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            className="bg-slate-900/50 border-slate-700 text-white text-sm"
                          />
                          <Button
                            onClick={handleSaveTemplate}
                            size="sm"
                            className="bg-cyan-600 hover:bg-cyan-700 text-white"
                          >
                            Guardar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Templates List */}
                    {showTemplates && (
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 max-h-60 overflow-y-auto">
                        <p className="text-sm text-slate-400 mb-2">
                          Templates guardados ({templates.length})
                        </p>
                        {templates.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-4">
                            No hay templates guardados
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {templates.map((template) => (
                              <div
                                key={template.id}
                                className="flex items-center gap-2 p-2 bg-slate-900/50 rounded border border-slate-700 hover:border-cyan-500/50 transition-colors"
                              >
                                <button
                                  onClick={() => handleLoadTemplate(template)}
                                  className="flex-1 text-left"
                                >
                                  <div className="text-sm text-white font-medium">
                                    {template.name}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    {template.amount
                                      ? `${template.amount} ${template.currency}`
                                      : template.currency}{' '}
                                    • Usado {template.usageCount} veces
                                  </div>
                                </button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleDeleteTemplate(template.id, template.name)
                                  }
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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
                    <Label className="text-slate-200">Código QR</Label>
                    <div className="flex flex-col items-center gap-4 p-6 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300">
                      <img
                        src={generatedLink.qrCode}
                        alt="QR Code"
                        className="w-64 h-64 rounded-lg shadow-lg"
                      />
                      <Button onClick={downloadQR} variant="outline" size="sm" className="w-full bg-white hover:bg-slate-50 border-slate-300 text-slate-800">
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
                    {/* WhatsApp */}
                    <Button
                      onClick={handleShareWhatsApp}
                      variant="outline"
                      className="w-full bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-400"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Button>

                    {/* Telegram */}
                    <Button
                      onClick={handleShareTelegram}
                      variant="outline"
                      className="w-full bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-400"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Telegram
                    </Button>

                    {/* Email */}
                    <Button
                      onClick={handleShareEmail}
                      variant="outline"
                      className="w-full bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </Button>

                    {/* Native Share (si está disponible) */}
                    {isWebShareSupported() && (
                      <Button
                        onClick={handleNativeShare}
                        variant="outline"
                        className="w-full bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400"
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Compartir
                      </Button>
                    )}

                    {/* Copiar */}
                    <Button
                      onClick={copyToClipboard}
                      className={`w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white ${
                        isWebShareSupported() ? '' : 'col-span-2'
                      }`}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Enlace
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
                    <Button className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white">
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
