'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Eye, TrendingUp, Copy, ExternalLink, Plus, Link as LinkIcon } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Dashboard - Mis Enlaces</CardTitle>
            <CardDescription>Accede con tu correo para ver tus estadísticas</CardDescription>
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
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Cargando...' : 'Acceder'}
              </Button>
            </form>
            <div className="mt-4 pt-4 border-t text-center">
              <p className="text-sm text-slate-600 mb-3">¿No tienes enlaces?</p>
              <Link href="/create">
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Enlace
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-slate-400">{ownerEmail}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setIsAuthenticated(false);
              setStats(null);
              setOwnerEmail('');
            }}
          >
            Cerrar Sesión
          </Button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-purple-100 text-sm font-medium">Enlaces Creados</p>
                <div className="w-10 h-10 bg-purple-400/30 rounded-lg flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{stats.totalLinks}</div>
              <p className="text-purple-200 text-xs">Total de enlaces</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-100 text-sm font-medium">Vistas Totales</p>
                <div className="w-10 h-10 bg-blue-400/30 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{stats.totalViews}</div>
              <p className="text-blue-200 text-xs">Personas que vieron tus enlaces</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-100 text-sm font-medium">Conversiones</p>
                <div className="w-10 h-10 bg-green-400/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{stats.totalConversions}</div>
              <p className="text-green-200 text-xs">Pagos completados</p>
            </div>
          </div>
        )}

        {/* Links Table */}
        {stats && stats.links.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Mis Enlaces</h2>
              <div className="flex gap-3">
                <Button onClick={handleRefresh} variant="outline" size="sm" className="bg-slate-700/50 border-slate-600 hover:bg-slate-600">
                  Actualizar
                </Button>
                <Link href="/create">
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Enlace
                  </Button>
                </Link>
              </div>
            </div>

            {stats.links.map((link) => (
              <div key={link.id} className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:shadow-xl hover:border-slate-600/50 transition-all">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Description & Amount */}
                  <div className="lg:col-span-4">
                    <p className="font-semibold text-white text-lg mb-1">{link.description}</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {link.amount} {link.currency}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="lg:col-span-2">
                    {link.used ? (
                      <span className="inline-flex px-3 py-1.5 bg-green-500/20 text-green-300 rounded-full text-sm font-semibold border border-green-500/30">
                        ✓ Pagado
                      </span>
                    ) : link.expired ? (
                      <span className="inline-flex px-3 py-1.5 bg-red-500/20 text-red-300 rounded-full text-sm font-semibold border border-red-500/30">
                        ⏰ Expirado
                      </span>
                    ) : (
                      <span className="inline-flex px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold border border-blue-500/30">
                        🔗 Activo
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Eye className="w-4 h-4 text-blue-400" />
                        <p className="text-2xl font-bold text-white">{link.views}</p>
                      </div>
                      <p className="text-xs text-slate-400">vistas</p>
                    </div>

                    <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <p className="text-2xl font-bold text-white">{link.conversionRate.toFixed(0)}%</p>
                      </div>
                      <p className="text-xs text-slate-400">conversión</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-2 flex gap-2 justify-end">
                    <Button
                      onClick={() => handleCopyUrl(link.id)}
                      variant="outline"
                      size="sm"
                      className="bg-slate-700/50 border-slate-600 hover:bg-slate-600"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="bg-slate-700/50 border-slate-600 hover:bg-slate-600"
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
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <p className="text-xs text-slate-400">
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
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-12 text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400 text-lg">Cargando enlaces...</p>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700/50 rounded-xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <LinkIcon className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-300 text-lg mb-2 font-semibold">No tienes enlaces aún</p>
              <p className="text-slate-500 mb-6">Crea tu primer enlace de pago en segundos</p>
              <Link href="/create">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Plus className="w-5 h-5 mr-2" />
                  Crear tu primer enlace
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
