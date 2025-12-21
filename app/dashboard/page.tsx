'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Eye, TrendingUp, Copy, ExternalLink, Plus, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface LinkStat {
  id: string;
  description: string;
  amount: number;
  currency: 'USDC' | 'XLM';
  views: number;
  conversions: number;
  conversionRate: number;
  createdAt: number;
  expiresAt: number;
  expired: boolean;
  used: boolean;
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
  
  const [ownerEmail, setOwnerEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  // Cargar stats cuando se autentica
  useEffect(() => {
    if (isAuthenticated && ownerEmail) {
      fetchStats();
    }
  }, [isAuthenticated, ownerEmail]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerEmail.trim()) {
      setError('Ingresa tu correo');
      return;
    }
    setError('');
    setIsAuthenticated(true);
  };

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/dashboard?email=${encodeURIComponent(ownerEmail)}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || 'Error cargando datos');
      }
    } catch (err) {
      setError('Error conectando al servidor');
    } finally {
      setIsLoading(false);
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 overflow-hidden flex items-center justify-center p-4">
        {/* Animated background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/10 to-slate-950"></div>
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700/50 backdrop-blur">
          <CardHeader>
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LinkIcon className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-center text-2xl text-white">Dashboard</CardTitle>
            <CardDescription className="text-center text-slate-400">Accede con tu correo para ver tus estadísticas</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="tu@correo.com"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700" disabled={isLoading}>
                {isLoading ? 'Cargando...' : 'Acceder'}
              </Button>
            </form>
            <div className="mt-6 pt-6 border-t border-slate-700 text-center">
              <p className="text-sm text-slate-400 mb-4">¿No tienes enlaces?</p>
              <Link href="/create">
                <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Enlace
                </Button>
              </Link>
              <Link href="/" className="block mt-3">
                <Button variant="ghost" className="w-full text-slate-400 hover:text-white">
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/10 to-slate-950"></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

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
              <Button variant="outline" size="sm" className="border-slate-700 hover:bg-slate-800">
                <Plus className="w-4 h-4 mr-0 md:mr-2" />
                <span className="hidden md:inline">Nuevo Enlace</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAuthenticated(false);
                setStats(null);
                setOwnerEmail('');
              }}
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
          <p className="text-cyan-400 text-sm md:text-lg truncate">{ownerEmail}</p>
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

        {/* Links Table */}
        {stats && stats.links.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6">
              <h2 className="text-xl md:text-3xl font-bold text-white">Mis Enlaces</h2>
              <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                <Button onClick={handleRefresh} variant="outline" size="sm" className="flex-1 sm:flex-none border-slate-700 hover:bg-slate-800 hover:border-cyan-500/50">
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
                    <p className="font-semibold text-white text-lg mb-2">{link.description}</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                      {link.amount} {link.currency}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="lg:col-span-2">
                    {link.used ? (
                      <span className="inline-flex px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-semibold border border-emerald-500/30">
                        ✓ Pagado
                      </span>
                    ) : link.expired ? (
                      <span className="inline-flex px-4 py-2 bg-amber-500/10 text-amber-400 rounded-xl text-sm font-semibold border border-amber-500/30">
                        ⏰ Expirado
                      </span>
                    ) : (
                      <span className="inline-flex px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-xl text-sm font-semibold border border-cyan-500/30">
                        🔗 Activo
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
                        href={`https://stellar.expert/explorer/testnet/account/${link.id}`}
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
        )}
      </div>
      </div>
    </div>
  );
}
