'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Eye, TrendingUp, Copy, ExternalLink, Trash2, Plus } from 'lucide-react';
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400">Enlaces Creados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.totalLinks}</div>
                <p className="text-xs text-slate-500 mt-1">Total de enlaces</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400">Vistas Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white flex items-center gap-2">
                  {stats.totalViews}
                  <Eye className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Personas que vieron tus enlaces</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400">Conversiones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white flex items-center gap-2">
                  {stats.totalConversions}
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Pagos completados</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Links Table */}
        {stats && stats.links.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Mis Enlaces</h2>
              <div className="space-x-2">
                <Button onClick={handleRefresh} variant="outline" size="sm">
                  Actualizar
                </Button>
                <Link href="/create">
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo
                  </Button>
                </Link>
              </div>
            </div>

            {stats.links.map((link) => (
              <Card key={link.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    {/* Description */}
                    <div>
                      <p className="font-semibold text-white">{link.description}</p>
                      <p className="text-sm text-slate-400">
                        {link.amount} {link.currency}
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <div className="flex gap-1">
                        {link.used ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs font-medium">
                            Pagado
                          </span>
                        ) : link.expired ? (
                          <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs font-medium">
                            Expirado
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-medium">
                            Activo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Views */}
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                        {link.views}
                        <Eye className="w-4 h-4 text-slate-400" />
                      </p>
                      <p className="text-xs text-slate-400">vistas</p>
                    </div>

                    {/* Conversion Rate */}
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{link.conversionRate.toFixed(1)}%</p>
                      <p className="text-xs text-slate-400">conversión</p>
                    </div>

                    {/* Date */}
                    <div className="text-sm text-slate-400">
                      <p className="text-xs">
                        {new Date(link.createdAt).toLocaleDateString('es-CL')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleCopyUrl(link.id)}
                        className="p-2 hover:bg-slate-700 rounded transition"
                        title="Copiar URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={`https://stellar.expert/explorer/testnet/account/${link.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-slate-700 rounded transition"
                        title="Ver en Stellar"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-400">
              Cargando enlaces...
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-slate-400 mb-4">No tienes enlaces aún</p>
              <Link href="/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear tu primer enlace
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
