import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Link as LinkIcon,
  Zap,
  Shield,
  Sparkles,
  ArrowRight,
  Globe,
} from 'lucide-react';
import { StarfieldBackground } from '@/components/starfield';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
      <StarfieldBackground starCount={220} />

      {/* Content */}
      <div className="relative z-10">
      {/* Navbar */}
      <nav className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <LinkIcon className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">PayByLink</span>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                Dashboard
              </Button>
            </Link>
            <Link href="/create">
              <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                Crear Link
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-sm font-semibold text-cyan-400 mb-4">
            <Sparkles className="h-4 w-4" />
            Powered by Stellar
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
            Cobra en Segundos,
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              No en Días
            </span>
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Genera enlaces de pago en Stellar sin registro. Sin comisiones ocultas.
            Sin complicaciones. Solo comparte el link y recibe tu pago.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/create">
              <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/20">
                <Zap className="mr-2 h-5 w-5" />
                Crear Link Gratis
              </Button>
            </Link>
            <Button size="lg" className="text-lg px-8 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white shadow-lg">
              Ver Demo
            </Button>
          </div>

          <div className="flex flex-wrap gap-8 justify-center pt-8 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <CheckIcon />
              <span>Sin registro</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon />
              <span>Pagos instantáneos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon />
              <span>Fees mínimos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            ¿Por qué PayByLink?
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur hover:border-cyan-500/30 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-cyan-400" />
                </div>
                <CardTitle className="text-white">Instantáneo</CardTitle>
                <CardDescription className="text-slate-400">
                  Crea un link en 10 segundos. Tu cliente paga y recibes el dinero
                  inmediatamente en tu wallet.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur hover:border-blue-500/30 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Sin Registro</CardTitle>
                <CardDescription className="text-slate-400">
                  No necesitas crear cuenta ni proporcionar datos. Solo conecta tu wallet
                  cuando recibas el primer pago.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur hover:border-emerald-500/30 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-emerald-400" />
                </div>
                <CardTitle className="text-white">Global</CardTitle>
                <CardDescription className="text-slate-400">
                  Cobra desde cualquier parte del mundo. Sin restricciones bancarias ni
                  fronteras. Powered by Stellar.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16 bg-slate-900/50 rounded-3xl border border-slate-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            Cómo Funciona
          </h2>

          <div className="space-y-8">
            <StepCard
              number={1}
              title="Crea tu link"
              description="Ingresa el monto, descripción y tu dirección de Stellar. Listo en segundos."
            />
            <StepCard
              number={2}
              title="Comparte"
              description="Envía el link por WhatsApp, email, Telegram o donde prefieras."
            />
            <StepCard
              number={3}
              title="Recibe el pago"
              description="Tu cliente paga con su wallet Freighter. El dinero llega instantáneamente."
            />
          </div>

          <div className="text-center pt-12">
            <Link href="/create">
              <Button size="lg" className="px-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/20">
                Empezar Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16 bg-slate-900/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-md flex items-center justify-center">
                <LinkIcon className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-white">PayByLink</span>
            </div>
            <div className="text-sm text-slate-400">
              Construido para la Ideatón Stellar 2025
            </div>
            <div className="flex gap-4 text-sm text-slate-400">
              <a href="#" className="hover:text-cyan-400 transition-colors">GitHub</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">Docs</a>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <div className="w-5 h-5 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center">
      <svg
        className="w-3 h-3 text-cyan-400"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 group">
      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
        <p className="text-slate-400">{description}</p>
      </div>
    </div>
  );
}
