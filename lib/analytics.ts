import { supabase } from './supabase';
import crypto from 'crypto';

export interface LinkStats {
  id: string;
  description: string;
  amount: number;
  currency: 'USDC' | 'XLM';
  recipient: string;
  views: number;
  conversions: number;
  conversionRate: number;
  createdAt: number;
  expiresAt: number;
  expired: boolean;
  used: boolean;
}

export interface DashboardStats {
  totalLinks: number;
  totalViews: number;
  totalConversions: number;
  links: LinkStats[];
}

/**
 * Registrar una view de un enlace
 */
export async function recordLinkView(
  linkId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<void> {
  if (!supabase) return;

  const ipHash = ipAddress ? crypto.createHash('sha256').update(ipAddress).digest('hex') : null;

  try {
    await supabase.from('payment_link_views').insert({
      link_id: linkId,
      viewed_at: Date.now(),
      user_agent: userAgent || null,
      ip_hash: ipHash,
    });
  } catch (error) {
    console.error('Error recording view:', error);
  }
}

/**
 * Obtener stats de un enlace específico
 */
export async function getLinkStats(linkId: string): Promise<LinkStats | null> {
  if (!supabase) return null;

  try {
    // Obtener enlace
    const { data: link, error: linkError } = await supabase
      .from('payment_links')
      .select('*')
      .eq('id', linkId)
      .single();

    if (linkError || !link) return null;

    // Contar views
    const { count: viewCount, error: viewError } = await supabase
      .from('payment_link_views')
      .select('*', { count: 'exact' })
      .eq('link_id', linkId);

    const views = viewCount || 0;
    const conversions = link.used ? 1 : 0;
    const conversionRate = views > 0 ? (conversions / views) * 100 : 0;

    return {
      id: link.id,
      description: link.description,
      amount: Number(link.amount),
      currency: link.currency,
      recipient: link.recipient,
      views,
      conversions,
      conversionRate,
      createdAt: link.created_at,
      expiresAt: link.expires_at,
      expired: Date.now() > link.expires_at,
      used: link.used,
    };
  } catch (error) {
    console.error('Error getting link stats:', error);
    return null;
  }
}

/**
 * Obtener dashboard completo del usuario
 */
export async function getUserDashboard(ownerEmail: string): Promise<DashboardStats | null> {
  if (!supabase) return null;

  try {
    // Obtener todos los enlaces del usuario
    const { data: links, error: linksError } = await supabase
      .from('payment_links')
      .select('*')
      .eq('owner_email', ownerEmail)
      .order('created_at', { ascending: false });

    if (linksError || !links) return null;

    // Calcular stats por enlace
    const linkStats: LinkStats[] = [];
    let totalViews = 0;
    let totalConversions = 0;

    for (const link of links) {
      const { count: viewCount } = await supabase
        .from('payment_link_views')
        .select('*', { count: 'exact' })
        .eq('link_id', link.id);

      const views = viewCount || 0;
      const conversions = link.used ? 1 : 0;
      const conversionRate = views > 0 ? (conversions / views) * 100 : 0;

      totalViews += views;
      totalConversions += conversions;

      linkStats.push({
        id: link.id,
        description: link.description,
        amount: Number(link.amount),
        currency: link.currency,
        recipient: link.recipient,
        views,
        conversions,
        conversionRate,
        createdAt: link.created_at,
        expiresAt: link.expires_at,
        expired: Date.now() > link.expires_at,
        used: link.used,
      });
    }

    return {
      totalLinks: links.length,
      totalViews,
      totalConversions,
      links: linkStats,
    };
  } catch (error) {
    console.error('Error getting dashboard:', error);
    return null;
  }
}
