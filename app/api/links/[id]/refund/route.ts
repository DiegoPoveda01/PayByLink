import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildPaymentTransaction } from '@/lib/stellar/transaction';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { reason, refundAddress } = await request.json();
    const params = await context.params;
    const linkId = params.id;

    // Validaciones
    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Proporciona un motivo de al menos 5 caracteres' },
        { status: 400 }
      );
    }

    if (!refundAddress || !refundAddress.startsWith('G') || refundAddress.length !== 56) {
      return NextResponse.json(
        { success: false, error: 'Dirección de reembolso inválida' },
        { status: 400 }
      );
    }

    // Obtener información del payment link
    const { data: paymentLink, error: linkError } = await supabase
      .from('payment_links')
      .select('*')
      .eq('id', linkId)
      .single();

    if (linkError || !paymentLink) {
      return NextResponse.json(
        { success: false, error: 'Enlace de pago no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el pago fue completado
    if (!paymentLink.completed) {
      return NextResponse.json(
        { success: false, error: 'Este enlace no ha sido pagado aún' },
        { status: 400 }
      );
    }

    // Verificar si ya existe un reembolso
    const { data: existingRefund } = await supabase
      .from('refunds')
      .select('*')
      .eq('payment_link_id', linkId)
      .eq('status', 'completed')
      .single();

    if (existingRefund) {
      return NextResponse.json(
        { success: false, error: 'Este pago ya fue reembolsado' },
        { status: 400 }
      );
    }

    // Crear registro de refund pendiente
    const { data: refundRecord, error: refundError } = await supabase
      .from('refunds')
      .insert({
        payment_link_id: linkId,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        refund_address: refundAddress,
        reason: reason,
        status: 'pending',
      })
      .select()
      .single();

    if (refundError) {
      console.error('Error creating refund:', refundError);
      return NextResponse.json(
        { success: false, error: 'Error al crear registro de reembolso' },
        { status: 500 }
      );
    }

    // NOTA: En un escenario real, aquí deberías:
    // 1. Tener una wallet del servidor con XLM para fees
    // 2. Construir y firmar la transacción de reembolso
    // 3. Enviar el reembolso automáticamente
    //
    // Por ahora, retornamos el XDR para que el OWNER lo firme manualmente
    // ya que no tenemos acceso a su clave privada (lo cual es correcto por seguridad)

    try {
      // Construir transacción de reembolso (del recipient hacia el payer)
      const xdr = await buildPaymentTransaction({
        sourcePublicKey: paymentLink.recipient_address,
        destinationPublicKey: refundAddress,
        amount: paymentLink.amount.toString(),
        assetCode: paymentLink.currency,
        memo: `Reembolso: ${reason.substring(0, 28)}`,
      });

      // Actualizar estado a "pending_signature"
      await supabase
        .from('refunds')
        .update({ status: 'pending_signature' })
        .eq('id', refundRecord.id);

      return NextResponse.json({
        success: true,
        data: {
          refundId: refundRecord.id,
          xdr: xdr,
          message: 'Transacción de reembolso generada. Debes firmarla con tu wallet para completar el reembolso.',
          amount: paymentLink.amount,
          currency: paymentLink.currency,
          to: refundAddress,
        },
      });
    } catch (txError: any) {
      console.error('Error building refund transaction:', txError);
      
      // Eliminar registro fallido
      await supabase.from('refunds').delete().eq('id', refundRecord.id);

      return NextResponse.json(
        { success: false, error: `Error al construir transacción: ${txError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Refund error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar reembolso' },
      { status: 500 }
    );
  }
}

// Endpoint para confirmar reembolso (cuando se firma y envía el XDR)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { refundId, txHash } = await request.json();

    if (!refundId || !txHash) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Actualizar refund a completado
    const { error } = await supabase
      .from('refunds')
      .update({
        status: 'completed',
        transaction_hash: txHash,
        completed_at: new Date().toISOString(),
      })
      .eq('id', refundId);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Error al actualizar reembolso' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reembolso completado exitosamente',
    });
  } catch (error: any) {
    console.error('Refund confirmation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
