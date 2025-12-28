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
 * Extraer información del dispositivo del User-Agent
 */
export function parseDeviceInfo(userAgent: string): {
  device: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
} {
  const ua = userAgent.toLowerCase();
  
  // Detect device type
  let device: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(userAgent)) {
    device = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|opera mobi/i.test(userAgent)) {
    device = 'mobile';
  }

  // Detect OS
  let os = 'unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac os|macos/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

  // Detect browser
  let browser = 'unknown';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  return { device, os, browser };
}

/**
 * Registrar una view de un enlace con análisis avanzado
 */
export async function recordLinkView(
  linkId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<void> {
  if (!supabase) return;

  const ipHash = ipAddress ? crypto.createHash('sha256').update(ipAddress).digest('hex') : null;
  const deviceInfo = userAgent ? parseDeviceInfo(userAgent) : null;

  try {
    await supabase.from('payment_link_views').insert({
      link_id: linkId,
      viewed_at: Date.now(),
      user_agent: userAgent || null,
      ip_hash: ipHash,
      device_type: deviceInfo?.device || null,
      os: deviceInfo?.os || null,
      browser: deviceInfo?.browser || null,
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

/**
 * Obtener distribución de dispositivos para un enlace
 */
export async function getDeviceBreakdown(linkId: string): Promise<{
  mobile: number;
  tablet: number;
  desktop: number;
} | null> {
  if (!supabase) return null;

  try {
    const { data: views } = await supabase
      .from('payment_link_views')
      .select('device_type')
      .eq('link_id', linkId);

    if (!views) return null;

    const breakdown = { mobile: 0, tablet: 0, desktop: 0 };
    views.forEach((view: any) => {
      if (view.device_type && breakdown.hasOwnProperty(view.device_type)) {
        breakdown[view.device_type as keyof typeof breakdown]++;
      }
    });

    return breakdown;
  } catch (error) {
    console.error('Error getting device breakdown:', error);
    return null;
  }
}

/**
 * Obtener distribución horaria de vistas (últimos 7 días)
 */
export async function getHourlyPattern(linkId: string): Promise<number[] | null> {
  if (!supabase) return null;

  try {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    const { data: views } = await supabase
      .from('payment_link_views')
      .select('viewed_at')
      .eq('link_id', linkId)
      .gte('viewed_at', sevenDaysAgo);

    if (!views) return null;

    // Initialize 24-hour array
    const hourlyData = Array(24).fill(0);
    
    views.forEach((view: any) => {
      const hour = new Date(view.viewed_at).getHours();
      hourlyData[hour]++;
    });

    return hourlyData;
  } catch (error) {
    console.error('Error getting hourly pattern:', error);
    return null;
  }
}

/**
 * Obtener métricas de conversión en el tiempo
 */
export async function getConversionFunnel(ownerEmail: string): Promise<{
  views: number;
  walletConnects: number;
  completedPayments: number;
  conversionRate: number;
} | null> {
  if (!supabase) return null;

  try {
    // Get total views
    const { data: links } = await supabase
      .from('payment_links')
      .select('id')
      .eq('owner_email', ownerEmail);

    if (!links) return null;

    const linkIds = links.map(l => l.id);
    
    const { count: totalViews } = await supabase
      .from('payment_link_views')
      .select('*', { count: 'exact' })
      .in('link_id', linkIds);

    // Get completed payments
    const { count: completedPayments } = await supabase
      .from('payment_links')
      .select('*', { count: 'exact' })
      .eq('owner_email', ownerEmail)
      .eq('used', true);

    const views = totalViews || 0;
    const completed = completedPayments || 0;
    const conversionRate = views > 0 ? (completed / views) * 100 : 0;

    // Estimate wallet connects (approximation: 60% of views)
    const walletConnects = Math.floor(views * 0.6);

    return {
      views,
      walletConnects,
      completedPayments: completed,
      conversionRate,
    };
  } catch (error) {
    console.error('Error getting conversion funnel:', error);
    return null;
  }
}
