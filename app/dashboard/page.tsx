'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Eye, TrendingUp, Copy, ExternalLink, Plus, Link as LinkIcon, ArrowLeft, BarChart3, RefreshCcw, Play, Pause, X, Globe, FileText, Webhook, Repeat } from 'lucide-react';
import Link from 'next/link';
import { StarfieldBackground } from '@/components/starfield';

interface LinkStat {
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
  type?: string;
}

interface DashboardStats {
  totalLinks: number;
  totalViews: number;
  totalConversions: number;
  links: LinkStat[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // true = login, false = registro
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState<'links' | 'analytics' | 'invoices' | 'webhooks' | 'recurring'>('links');
  const [selectedLink, setSelectedLink] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [recurrings, setRecurrings] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [loadingRecurring, setLoadingRecurring] = useState(false);

  const [newWebhook, setNewWebhook] = useState({ url: '', events: ['payment.completed'], active: true });
  const [newRecurring, setNewRecurring] = useState({
    recipientAddress: '',
    amount: '',
    currency: 'USDC' as 'USDC' | 'XLM',
    description: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
    startDate: '',
    endDate: '',
  });
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const tabs = [
    { key: 'links', label: 'Enlaces', icon: LinkIcon },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'invoices', label: 'Facturas', icon: FileText },
    { key: 'webhooks', label: 'Webhooks', icon: Webhook },
    { key: 'recurring', label: 'Recurrentes', icon: Repeat },
  ] as const;

  // Verificar sesión al cargar
  useEffect(() => {
    checkSession();
  }, []);

  // Cargar stats cuando se autentica
  useEffect(() => {
    if (isAuthenticated && userEmail) {
      fetchStats();
    }
  }, [isAuthenticated, userEmail]);

  // Cargar data al cambiar de tab
  useEffect(() => {
    if (!isAuthenticated || !userEmail) return;
    if (activeTab === 'analytics' && selectedLink) {
      loadAnalytics(selectedLink);
    }
    if (activeTab === 'invoices') loadInvoices();
    if (activeTab === 'webhooks') loadWebhooks();
    if (activeTab === 'recurring') loadRecurring();
  }, [activeTab, selectedLink, isAuthenticated, userEmail]);

  const checkSession = async () => {
    try {
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();
      // Forzar sesión fresca: si había una sesión previa, la cerramos para requerir login explícito.
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUserEmail('');
    } catch (err) {
      console.error('Error checking session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const translateAuthError = (errorMessage: string): string => {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Correo o contraseña incorrectos',
      'Email not confirmed': 'Debes confirmar tu correo electrónico',
      'User already registered': 'Este correo ya está registrado',
      'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
      'Unable to validate email address: invalid format': 'Formato de correo inválido',
      'Signups not allowed for this instance': 'El registro está deshabilitado',
      'Email rate limit exceeded': 'Demasiados intentos, espera unos minutos',
      'Invalid email or password': 'Correo o contraseña incorrectos',
    };

    return errorMap[errorMessage] || errorMessage;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Completa todos los campos');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();

      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          setError(translateAuthError(error.message));
          return;
        }

        if (data.user) {
          setIsAuthenticated(true);
          setUserEmail(data.user.email || '');
          toast({
            title: 'Bienvenido',
            description: 'Sesión iniciada correctamente',
          });
        }
      } else {
        // Registro
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (error) {
          console.error('Signup error:', error);
          setError(translateAuthError(error.message));
          return;
        }

        if (data.user) {
          toast({
            title: 'Cuenta creada',
            description: 'Ya puedes iniciar sesión',
          });
          setIsLogin(true);
          setPassword('');
        }
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Error en el servidor';
      setError(translateAuthError(errorMessage));
      console.error('Auth error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setStats(null);
      setUserEmail('');
      toast({
        title: 'Sesión cerrada',
        description: 'Has salido correctamente',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/dashboard?email=${encodeURIComponent(userEmail)}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        if (data.data?.links?.length && !selectedLink) {
          setSelectedLink(data.data.links[0].id);
        }
      } else {
        setError(data.error || 'Error cargando datos');
      }
    } catch (err) {
      setError('Error conectando al servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async (linkId: string) => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/analytics/link/${linkId}`);
      const json = await res.json();
      if (json.success) setAnalyticsData(json.data);
    } catch (err) {
      // ignore
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const res = await fetch(`/api/invoices/list?email=${encodeURIComponent(userEmail)}`);
      const json = await res.json();
      if (json.success) setInvoices(json.data || []);
    } catch (err) {
      // ignore
    } finally {
      setLoadingInvoices(false);
    }
  };

  const loadWebhooks = async () => {
    setLoadingWebhooks(true);
    try {
      const res = await fetch(`/api/webhooks?email=${encodeURIComponent(userEmail)}`);
      const json = await res.json();
      if (json.success) setWebhooks(json.data || []);
    } catch (err) {
      // ignore
    } finally {
      setLoadingWebhooks(false);
    }
  };

  const loadRecurring = async () => {
    setLoadingRecurring(true);
    try {
      const res = await fetch(`/api/recurring?email=${encodeURIComponent(userEmail)}`);
      const json = await res.json();
      if (json.success) setRecurrings(json.data || []);
    } catch (err) {
      // ignore
    } finally {
      setLoadingRecurring(false);
    }
  };

  const handleCopyUrl = (linkId: string) => {
    const baseUrl = window.location.origin;
    // Aquí necesitarías el slug, por ahora copias solo el ID
    const url = `${baseUrl}/pay/${linkId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copiado',
      description: 'URL copiada al portapapeles',
    });
  };

  const handleRefresh = () => {
    fetchStats();
  };

  const handleWebhookCreate = async () => {
    setLoadingWebhooks(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerEmail: userEmail,
          url: newWebhook.url,
          events: newWebhook.events,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNewWebhook({ url: '', events: ['payment.completed'], active: true });
        loadWebhooks();
        toast({ title: 'Webhook creado', description: 'Se guardó correctamente' });
      }
    } catch (err) {
      // ignore
    } finally {
      setLoadingWebhooks(false);
    }
  };

  const handleWebhookToggle = async (id: string, active: boolean) => {
    setLoadingWebhooks(true);
    try {
      await fetch('/api/webhooks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active }),
      });
      loadWebhooks();
    } catch (err) {
      // ignore
    } finally {
      setLoadingWebhooks(false);
    }
  };

  const handleWebhookDelete = async (id: string) => {
    setLoadingWebhooks(true);
    try {
      await fetch('/api/webhooks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      loadWebhooks();
    } catch (err) {
      // ignore
    } finally {
      setLoadingWebhooks(false);
    }
  };

  const handleRecurringCreate = async () => {
    setLoadingRecurring(true);
    try {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRecurring,
          amount: parseFloat(newRecurring.amount),
          startDate: new Date(newRecurring.startDate).getTime(),
          endDate: newRecurring.endDate ? new Date(newRecurring.endDate).getTime() : null,
          ownerEmail: userEmail,
        }),
      });
      const json = await res.json();
      if (json.success) {
        loadRecurring();
        toast({ title: 'Recurrente creado', description: 'Se guardó correctamente' });
      }
    } catch (err) {
      // ignore
    } finally {
      setLoadingRecurring(false);
    }
  };

  const handleRecurringAction = async (id: string, action: 'pause' | 'resume' | 'cancel') => {
    setLoadingRecurring(true);
    try {
      await fetch('/api/recurring', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      loadRecurring();
    } catch (err) {
      // ignore
    } finally {
      setLoadingRecurring(false);
    }
  };

  const formatDate = (ts?: number) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (ts?: number) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const deviceBreakdown = analyticsData?.device || { mobile: 0, tablet: 0, desktop: 0 };
  const hourlyPattern = analyticsData?.hourly || [];
  const maxHourly = hourlyPattern.length ? Math.max(...hourlyPattern) : 0;
  const funnelMetrics = analyticsData?.funnel || null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <StarfieldBackground starCount={160} />
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-md mx-auto">
            <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700">
              <div className="p-8">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                  </h1>
                  <p className="text-slate-300">
                    {isLogin ? 'Accede a tu panel de control' : 'Crea tu cuenta para gestionar tus enlaces'}
                  </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="tu@email.com"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-200">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Mínimo 6 caracteres"
                      required
                      disabled={isSubmitting}
                      minLength={6}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setError('');
                        setPassword('');
                      }}
                      className="text-cyan-400 hover:text-cyan-300 text-sm"
                      disabled={isSubmitting}
                    >
                      {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                    </button>
                  </div>
                </form>
              </div>
            </Card>

            <div className="mt-6 text-center">
              <Button
                onClick={() => router.push('/')}
                variant="ghost"
                className="text-slate-300 hover:text-white"
              >
                Volver al Inicio
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <span className="font-bold text-lg md:text-xl text-white">PayByLink</span>
          </Link>
          <div className="flex gap-2 md:gap-3">
            <Link href="/create">
              <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/20">
                <Plus className="w-4 h-4 mr-0 md:mr-2" />
                <span className="hidden md:inline">Nuevo Enlace</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-400 hover:text-white hover:bg-slate-800 hidden md:flex"
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 md:py-8 lg:py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-3 md:mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-xs md:text-sm font-medium">Volver al inicio</span>
          </Link>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-cyan-400 text-sm md:text-lg truncate">{userEmail}</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/20 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-xl hover:shadow-cyan-500/10 transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-cyan-400 text-xs md:text-sm font-semibold uppercase tracking-wide">Enlaces</p>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-cyan-500/10 rounded-lg md:rounded-xl flex items-center justify-center border border-cyan-500/20">
                  <LinkIcon className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
                </div>
              </div>
              <div className="text-3xl md:text-5xl font-bold text-white mb-1 md:mb-2">{stats.totalLinks}</div>
              <p className="text-slate-400 text-xs md:text-sm">Enlaces creados</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/20 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-xl hover:shadow-blue-500/10 transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-blue-400 text-xs md:text-sm font-semibold uppercase tracking-wide">Vistas</p>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/10 rounded-lg md:rounded-xl flex items-center justify-center border border-blue-500/20">
                  <Eye className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                </div>
              </div>
              <div className="text-3xl md:text-5xl font-bold text-white mb-1 md:mb-2">{stats.totalViews}</div>
              <p className="text-slate-400 text-xs md:text-sm">Personas interesadas</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/20 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-xl hover:shadow-emerald-500/10 transition-shadow sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-3">
                <p className="text-emerald-400 text-xs md:text-sm font-semibold uppercase tracking-wide">Conversiones</p>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 rounded-lg md:rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
                </div>
              </div>
              <div className="text-3xl md:text-5xl font-bold text-white mb-1 md:mb-2">{stats.totalConversions}</div>
              <p className="text-slate-400 text-xs md:text-sm">Pagos completados</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-2 mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition border ${isActive ? 'bg-slate-700 text-white border-cyan-500/50 shadow-lg shadow-cyan-500/20' : 'text-slate-300 border-transparent hover:bg-slate-800 hover:text-white'}`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'links' && (
          stats && stats.links.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6">
                <h2 className="text-xl md:text-3xl font-bold text-white">Mis Enlaces</h2>
                <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                  <Button onClick={handleRefresh} size="sm" className="flex-1 sm:flex-none bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white">
                    Actualizar
                  </Button>
                  <Link href="/create" className="flex-1 sm:flex-none">
                    <Button size="sm" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/20">
                      <Plus className="w-4 h-4 mr-2" />
                      <span className="hidden md:inline">Nuevo Enlace</span>
                      <span className="md:hidden">Nuevo</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {stats.links.map((link) => (
                <div key={link.id} className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur border border-slate-700/50 rounded-2xl p-6 hover:shadow-2xl hover:border-cyan-500/30 transition-all duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Description & Amount */}
                    <div className="lg:col-span-4">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-white text-lg">{link.description}</p>
                        <span className="inline-flex px-2.5 py-1 text-xs rounded-full border border-slate-700/70 bg-slate-800/70 text-slate-200">
                          {link.type === 'tip' ? 'Propina' : 'Pago'}
                        </span>
                      </div>
                      <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        {link.amount} {link.currency}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="lg:col-span-2">
                      {link.used ? (
                        <span className="inline-flex px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-semibold border border-emerald-500/30">
                          Pagado
                        </span>
                      ) : link.expired ? (
                        <span className="inline-flex px-4 py-2 bg-amber-500/10 text-amber-400 rounded-xl text-sm font-semibold border border-amber-500/30">
                          Expirado
                        </span>
                      ) : (
                        <span className="inline-flex px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-xl text-sm font-semibold border border-cyan-500/30">
                          Activo
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-center hover:border-blue-500/30 transition-colors">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Eye className="w-4 h-4 text-blue-400" />
                          <p className="text-3xl font-bold text-white">{link.views}</p>
                        </div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide">vistas</p>
                      </div>

                      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-center hover:border-emerald-500/30 transition-colors">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <p className="text-3xl font-bold text-white">{link.conversionRate.toFixed(0)}%</p>
                        </div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide">conversión</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="lg:col-span-2 flex gap-2 justify-end">
                      <Button
                        onClick={() => handleCopyUrl(link.id)}
                        variant="outline"
                        size="sm"
                        className="bg-slate-900/50 border-slate-700 hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="bg-slate-900/50 border-slate-700 hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-400 transition-all"
                      >
                        <a
                          href={`https://stellar.expert/explorer/testnet/account/${link.recipient}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  {/* Date footer */}
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-500">
                      Creado: {new Date(link.createdAt).toLocaleDateString('es-CL', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : isLoading ? (
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-16 text-center">
              <div className="animate-pulse">
                <div className="w-20 h-20 bg-cyan-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Eye className="w-10 h-10 text-cyan-500/50" />
                </div>
                <p className="text-slate-300 text-xl font-semibold">Cargando enlaces...</p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur border border-slate-700/50 rounded-2xl p-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-slate-800 border border-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <LinkIcon className="w-12 h-12 text-cyan-500/50" />
                </div>
                <p className="text-white text-2xl mb-3 font-bold">No tienes enlaces aún</p>
                <p className="text-slate-400 mb-8 text-lg">Crea tu primer enlace de pago en segundos</p>
                <Link href="/create">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-xl shadow-cyan-500/20 text-lg px-8">
                    <Plus className="w-5 h-5 mr-2" />
                    Crear tu primer enlace
                  </Button>
                </Link>
              </div>
            </div>
          )
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-1">
                  <Label className="text-slate-300">Selecciona un enlace</Label>
                  <select
                    value={selectedLink}
                    onChange={(e) => setSelectedLink(e.target.value)}
                    className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  >
                    {stats?.links?.length ? (
                      stats.links.map((link) => (
                        <option key={link.id} value={link.id}>
                          {link.description} • {link.amount} {link.currency}
                        </option>
                      ))
                    ) : (
                      <option value="">No tienes enlaces</option>
                    )}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => selectedLink && loadAnalytics(selectedLink)}
                    disabled={!selectedLink || loadingAnalytics}
                    className="border-slate-600 text-slate-200"
                  >
                    <RefreshCcw className={`w-4 h-4 mr-2 ${loadingAnalytics ? 'animate-spin' : ''}`} />
                    Recargar
                  </Button>
                </div>
              </div>
              {!selectedLink && <p className="text-slate-400 text-sm mt-3">Selecciona un enlace para ver su comportamiento.</p>}
            </div>

            {loadingAnalytics ? (
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 text-center">
                <RefreshCcw className="w-8 h-8 mx-auto text-cyan-400 animate-spin" />
                <p className="mt-3 text-slate-300">Cargando analytics...</p>
              </div>
            ) : analyticsData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <p className="text-sm font-semibold text-white">Dispositivos</p>
                    </div>
                    {(['mobile', 'tablet', 'desktop'] as const).map((d) => {
                      const total = deviceBreakdown.mobile + deviceBreakdown.tablet + deviceBreakdown.desktop || 1;
                      const value = deviceBreakdown[d];
                      const percent = Math.round((value / total) * 100);
                      return (
                        <div key={d} className="mb-3">
                          <div className="flex justify-between text-xs text-slate-400 mb-1 capitalize">
                            <span>{d}</span>
                            <span>{value} ({percent}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      <p className="text-sm font-semibold text-white">Embudo</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
                        <p className="text-slate-400 text-xs">Vistas</p>
                        <p className="text-white text-xl font-bold">{funnelMetrics?.views ?? 0}</p>
                      </div>
                      <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
                        <p className="text-slate-400 text-xs">Wallet connects</p>
                        <p className="text-white text-xl font-bold">{funnelMetrics?.walletConnects ?? 0}</p>
                      </div>
                      <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
                        <p className="text-slate-400 text-xs">Pagos completados</p>
                        <p className="text-white text-xl font-bold">{funnelMetrics?.completedPayments ?? 0}</p>
                      </div>
                      <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
                        <p className="text-slate-400 text-xs">Conversión</p>
                        <p className="text-white text-xl font-bold">{(funnelMetrics?.conversionRate || 0).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <p className="text-sm font-semibold text-white">Distribución horaria (7d)</p>
                    </div>
                    <div className="h-32 flex items-end gap-1">
                      {hourlyPattern.length ? hourlyPattern.map((count: number, hour: number) => {
                        const height = maxHourly ? Math.max((count / maxHourly) * 100, 4) : 4;
                        return (
                          <div key={hour} className="flex-1 bg-cyan-500/30 rounded-t-md" style={{ height: `${height}%` }} title={`${hour}:00 (${count})`} />
                        );
                      }) : <div className="text-slate-400 text-sm">Sin datos</div>}
                    </div>
                    <div className="grid grid-cols-6 text-[10px] text-slate-500 mt-2">
                      <span>00h</span>
                      <span>04h</span>
                      <span>08h</span>
                      <span>12h</span>
                      <span>16h</span>
                      <span>20h</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
                <BarChart3 className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-300">Selecciona un enlace para ver analytics.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" /> Facturas
                </h2>
                <p className="text-slate-400 text-sm">Historial generado desde tus cobros</p>
              </div>
              <Button onClick={loadInvoices} size="sm" className="bg-slate-700 border border-slate-600" disabled={loadingInvoices}>
                <RefreshCcw className={`w-4 h-4 mr-2 ${loadingInvoices ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>

            {loadingInvoices ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
                <RefreshCcw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <p className="mt-2 text-slate-300">Cargando facturas...</p>
              </div>
            ) : invoices.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">#{invoice.invoice_number || invoice.id}</p>
                        <p className="text-lg font-semibold text-white">{invoice.client_name || 'Cliente'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${invoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : invoice.status === 'overdue' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-700/60 text-slate-200 border-slate-600'}`}>
                        {invoice.status || 'draft'}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-white">{Number(invoice.total).toFixed(2)} {invoice.currency}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                      <div>
                        <p className="text-xs text-slate-500">Creada</p>
                        <p>{formatDate(invoice.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Vence</p>
                        <p>{formatDate(invoice.due_date)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm" className="border-slate-600 text-slate-200">
                        <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" /> Ver PDF
                        </a>
                      </Button>
                      {invoice.tx_hash && (
                        <Button asChild variant="outline" size="sm" className="border-slate-600 text-slate-200">
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${invoice.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <LinkIcon className="w-4 h-4 mr-2" /> Tx
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-10 text-center">
                <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-300">Aún no tienes facturas generadas.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-3">
                <Webhook className="w-4 h-4 text-cyan-400" /> Nuevo webhook
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">URL</Label>
                  <Input
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                    placeholder="https://miapp.com/webhook"
                    className="mt-2 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Eventos</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-slate-200">
                    {['payment.completed', 'payment.failed', 'link.viewed', 'link.expired'].map((event) => (
                      <label key={event} className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
                        <input
                          type="checkbox"
                          className="accent-cyan-500"
                          checked={newWebhook.events.includes(event)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...newWebhook.events, event]
                              : newWebhook.events.filter((ev) => ev !== event);
                            setNewWebhook({ ...newWebhook, events: next });
                          }}
                        />
                        <span>{event}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={handleWebhookCreate} disabled={loadingWebhooks || !newWebhook.url} className="bg-gradient-to-r from-cyan-500 to-blue-600">
                  <Plus className="w-4 h-4 mr-2" /> Guardar webhook
                </Button>
              </div>
            </div>

            {loadingWebhooks ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
                <RefreshCcw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <p className="mt-3 text-slate-300">Cargando webhooks...</p>
              </div>
            ) : webhooks.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {webhooks.map((hook) => (
                  <div key={hook.id} className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold break-all">{hook.url}</p>
                        <p className="text-xs text-slate-400">{hook.events?.join(', ')}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${hook.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-700/60 text-slate-300 border-slate-600'}`}>
                        {hook.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Creado {formatDateTime(hook.created_at)}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWebhookToggle(hook.id, !hook.active)}
                        className="border-slate-600 text-slate-200"
                      >
                        {hook.active ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                        {hook.active ? 'Pausar' : 'Reanudar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWebhookDelete(hook.id)}
                        className="border-slate-600 text-red-300 hover:text-red-200 hover:border-red-500"
                      >
                        <X className="w-4 h-4 mr-2" /> Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-10 text-center">
                <Webhook className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-300">Aún no tienes webhooks configurados.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recurring' && (
          <div className="space-y-6">
            <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-3">
                <Repeat className="w-4 h-4 text-cyan-400" /> Nuevo pago recurrente
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Dirección destinatario</Label>
                  <Input
                    value={newRecurring.recipientAddress}
                    onChange={(e) => setNewRecurring({ ...newRecurring, recipientAddress: e.target.value })}
                    placeholder="GCuentaStellar..."
                    className="mt-2 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Monto</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="number"
                      value={newRecurring.amount}
                      onChange={(e) => setNewRecurring({ ...newRecurring, amount: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="100"
                    />
                    <select
                      value={newRecurring.currency}
                      onChange={(e) => setNewRecurring({ ...newRecurring, currency: e.target.value as 'USDC' | 'XLM' })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 text-slate-100"
                    >
                      <option value="USDC">USDC</option>
                      <option value="XLM">XLM</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Descripción</Label>
                  <Input
                    value={newRecurring.description}
                    onChange={(e) => setNewRecurring({ ...newRecurring, description: e.target.value })}
                    placeholder="Suscripción mensual"
                    className="mt-2 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Frecuencia</Label>
                  <select
                    value={newRecurring.frequency}
                    onChange={(e) => setNewRecurring({ ...newRecurring, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                    className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>
                <div>
                  <Label className="text-slate-300">Fecha de inicio</Label>
                  <Input
                    type="date"
                    value={newRecurring.startDate}
                    onChange={(e) => setNewRecurring({ ...newRecurring, startDate: e.target.value })}
                    className="mt-2 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Fecha de término (opcional)</Label>
                  <Input
                    type="date"
                    value={newRecurring.endDate}
                    onChange={(e) => setNewRecurring({ ...newRecurring, endDate: e.target.value })}
                    className="mt-2 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleRecurringCreate}
                  disabled={loadingRecurring || !newRecurring.recipientAddress || !newRecurring.amount || !newRecurring.startDate}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" /> Crear
                </Button>
              </div>
            </div>

            {loadingRecurring ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
                <RefreshCcw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <p className="mt-3 text-slate-300">Cargando pagos recurrentes...</p>
              </div>
            ) : recurrings.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recurrings.map((r) => (
                  <div key={r.id} className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">{r.description || 'Pago recurrente'}</p>
                        <p className="text-xs text-slate-400">{r.recipient_address || r.recipientAddress}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${r.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : r.status === 'paused' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-700/60 text-slate-200 border-slate-600'}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-white">{Number(r.amount).toFixed(2)} {r.currency}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                      <div>
                        <p className="text-xs text-slate-500">Frecuencia</p>
                        <p className="capitalize">{r.frequency}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Próximo pago</p>
                        <p>{formatDate(r.next_payment_date || r.nextPaymentDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Inicio</p>
                        <p>{formatDate(r.start_date || r.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Pagos exitosos</p>
                        <p>{r.successful_payments || r.successfulPayments || 0} / {r.total_payments || r.totalPayments || 0}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {r.status === 'active' && (
                        <Button variant="outline" size="sm" className="border-slate-600 text-slate-200" onClick={() => handleRecurringAction(r.id, 'pause')}>
                          <Pause className="w-4 h-4 mr-2" /> Pausar
                        </Button>
                      )}
                      {r.status === 'paused' && (
                        <Button variant="outline" size="sm" className="border-slate-600 text-slate-200" onClick={() => handleRecurringAction(r.id, 'resume')}>
                          <Play className="w-4 h-4 mr-2" /> Reanudar
                        </Button>
                      )}
                      {r.status !== 'cancelled' && r.status !== 'completed' && (
                        <Button variant="outline" size="sm" className="border-slate-600 text-red-300 hover:text-red-200 hover:border-red-500" onClick={() => handleRecurringAction(r.id, 'cancel')}>
                          <X className="w-4 h-4 mr-2" /> Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-10 text-center">
                <Repeat className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-300">Aún no tienes pagos recurrentes configurados.</p>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
