'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { StarfieldBackground } from '@/components/starfield';
import { Plus, Trash2, FileText, Loader2, ArrowLeft, Calculator } from 'lucide-react';
import { calculateInvoiceTotals, type InvoiceItem } from '@/lib/invoices';
import { isValidStellarAddress } from '@/lib/stellar/config';

export default function CreateInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    recipientAddress: '',
    currency: 'USDC' as 'USDC' | 'XLM',
    ownerName: '',
    ownerBusinessName: '',
    clientName: '',
    clientEmail: '',
    taxRate: '19',
    notes: '',
    dueInDays: '30',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, amount: 0 },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<{
    id: string;
    invoiceNumber: string;
  } | null>(null);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate amount
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setItems(newItems);
  };

  const totals = calculateInvoiceTotals(items, parseFloat(formData.taxRate) || 0);

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      // Validations
      if (!isValidStellarAddress(formData.recipientAddress)) {
        throw new Error('Dirección Stellar inválida');
      }

      if (items.some(item => !item.description.trim() || item.amount <= 0)) {
        throw new Error('Completa todos los items de la factura');
      }

      if (totals.total <= 0) {
        throw new Error('El total de la factura debe ser mayor a 0');
      }

      const dueDate = Date.now() + parseInt(formData.dueInDays) * 24 * 60 * 60 * 1000;

      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientAddress: formData.recipientAddress,
          currency: formData.currency,
          items,
          subtotal: totals.subtotal,
          taxRate: parseFloat(formData.taxRate),
          taxAmount: totals.taxAmount,
          total: totals.total,
          notes: formData.notes || undefined,
          dueDate,
          ownerName: formData.ownerName || undefined,
          ownerBusinessName: formData.ownerBusinessName || undefined,
          clientName: formData.clientName || undefined,
          clientEmail: formData.clientEmail || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.errors?.[0] || 'Error al crear factura');
      }

      setGeneratedInvoice({
        id: data.data.id,
        invoiceNumber: data.data.invoiceNumber,
      });

      toast({
        title: 'Factura creada',
        description: `Factura ${data.data.invoiceNumber} generada exitosamente`,
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

  if (generatedInvoice) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <StarfieldBackground starCount={200} />
        
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-emerald-500/50 bg-slate-900/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Factura Generada</CardTitle>
                <CardDescription className="text-slate-400">
                  Número: {generatedInvoice.invoiceNumber}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
                  <p className="text-lg text-slate-300 mb-6">
                    Tu factura ha sido creada y guardada
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => window.open(`/api/invoices/${generatedInvoice.id}/pdf`, '_blank')}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Descargar PDF
                    </Button>
                    <Button
                      onClick={() => router.push('/dashboard')}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
                    >
                      Ver Dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <StarfieldBackground starCount={200} />

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-4 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Volver al Dashboard</span>
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">Crear Factura</h1>
            <p className="text-slate-400 text-lg">
              Genera facturas profesionales con soporte para Stellar
            </p>
          </div>

          <form onSubmit={handleGenerateInvoice}>
            <div className="grid gap-6">
              {/* Business Info */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Tu Información</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-200">Nombre del Negocio</Label>
                      <Input
                        placeholder="Mi Empresa SAS"
                        value={formData.ownerBusinessName}
                        onChange={(e) => setFormData({ ...formData, ownerBusinessName: e.target.value })}
                        className="bg-slate-800/50 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-200">Tu Nombre</Label>
                      <Input
                        placeholder="Juan Pérez"
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        className="bg-slate-800/50 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client Info */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Información del Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-200">Nombre del Cliente</Label>
                      <Input
                        placeholder="Cliente ABC"
                        value={formData.clientName}
                        onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                        className="bg-slate-800/50 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-200">Email del Cliente</Label>
                      <Input
                        type="email"
                        placeholder="cliente@ejemplo.com"
                        value={formData.clientEmail}
                        onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                        className="bg-slate-800/50 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-200">Dirección Stellar del Cliente *</Label>
                    <Input
                      placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      value={formData.recipientAddress}
                      onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white font-mono"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">Items</CardTitle>
                    <Button
                      type="button"
                      onClick={addItem}
                      variant="outline"
                      size="sm"
                      className="border-slate-700 hover:bg-slate-800 text-slate-300"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="grid md:grid-cols-12 gap-3 p-3 bg-slate-800/30 rounded-lg">
                      <div className="md:col-span-5">
                        <Label className="text-slate-200 text-xs">Descripción</Label>
                        <Input
                          placeholder="Servicio o producto"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="bg-slate-800/50 border-slate-700 text-white text-sm"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-slate-200 text-xs">Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="bg-slate-800/50 border-slate-700 text-white text-sm"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-slate-200 text-xs">Precio Unit.</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="bg-slate-800/50 border-slate-700 text-white text-sm"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-slate-200 text-xs">Total</Label>
                        <Input
                          type="text"
                          value={item.amount.toFixed(2)}
                          readOnly
                          className="bg-slate-900/50 border-slate-700 text-emerald-400 font-semibold text-sm"
                        />
                      </div>
                      <div className="md:col-span-1 flex items-end">
                        <Button
                          type="button"
                          onClick={() => removeItem(index)}
                          variant="ghost"
                          size="sm"
                          disabled={items.length === 1}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Totals & Settings */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Configuración</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-slate-200">Moneda</Label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'USDC' | 'XLM' })}
                        className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-white"
                      >
                        <option value="USDC">USDC</option>
                        <option value="XLM">XLM</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-slate-200">Impuesto (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.taxRate}
                        onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                        className="bg-slate-800/50 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-200">Vencimiento (días)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.dueInDays}
                        onChange={(e) => setFormData({ ...formData, dueInDays: e.target.value })}
                        className="bg-slate-800/50 border-slate-700 text-white"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-2 border-cyan-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-slate-300">
                      <span>Subtotal:</span>
                      <span className="font-semibold">{totals.subtotal.toFixed(2)} {formData.currency}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Impuesto ({formData.taxRate}%):</span>
                      <span className="font-semibold">{totals.taxAmount.toFixed(2)} {formData.currency}</span>
                    </div>
                    <div className="border-t border-slate-700 pt-3 flex justify-between text-xl text-cyan-400 font-bold">
                      <span>TOTAL:</span>
                      <span>{totals.total.toFixed(2)} {formData.currency}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Notas (opcional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    placeholder="Términos y condiciones, información adicional..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-white placeholder:text-slate-500"
                  />
                </CardContent>
              </Card>

              <Button
                type="submit"
                disabled={isGenerating}
                className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-5 w-5" />
                    Generar Factura
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
