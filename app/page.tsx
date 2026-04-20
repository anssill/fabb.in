import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, Shield, Zap, Layout, MessageCircle, Globe } from 'lucide-react'

export default async function IndexPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 font-sans">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-zinc-100 dark:border-zinc-900 sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-50 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white dark:text-zinc-900" />
          </div>
          <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-50 uppercase">Echo</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors pt-2" href="#features">Features</Link>
          <Link className="text-sm font-medium hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors pt-2" href="#pricing">Pricing</Link>
          <Button asChild={true} size="sm" className="bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 ml-2">
            <Link href="/dashboard">Launch Dashboard <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
        </nav>
      </header>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-dot-zinc-200 dark:bg-dot-zinc-800 relative bg-zinc-50/30">
          <div className="container px-4 md:px-6 relative z-10 mx-auto text-center">
            <div className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 px-3 py-1 text-[10px] font-bold text-zinc-900 dark:text-zinc-100 mb-6 animate-in fade-in slide-in-from-top-4 duration-1000 uppercase tracking-widest">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              Now in Private Beta for Rental Businesses
            </div>
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none text-zinc-950 dark:text-zinc-50 mb-6 max-w-4xl mx-auto">
              The OS for Modern <br/><span className="text-zinc-400 dark:text-zinc-700 italic">Rental Networks.</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-zinc-600 md:text-xl dark:text-zinc-400 mb-8 font-medium">
              Real-time inventory sync across branches, automated customer risk profiles, and integrated WhatsApp business API.
            </p>
            <div className="flex flex-col sm:row justify-center items-center gap-4">
              <Button asChild={true} size="lg" className="h-12 px-8 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 shadow-xl hover:scale-105 active:scale-95 transition-all text-sm font-bold uppercase tracking-tight">
                <Link href="/dashboard">Launch Dashboard <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-32 bg-white dark:bg-zinc-950">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-16 lg:grid-cols-3">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-zinc-900 dark:bg-zinc-50 rounded-2xl flex items-center justify-center mb-6">
                  <Layout className="w-6 h-6 text-white dark:text-zinc-900" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Enterprise Multi-tenant</h3>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Support for 100+ branches with unique subdomains. Role-based access control for super admins, managers, and floor staff.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-zinc-900 dark:bg-zinc-50 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-white dark:text-zinc-900" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Data-Driven Risk Engine</h3>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Automated customer blacklisting using behavioral data. Track damage patterns and late return history across your entire network.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-zinc-900 dark:bg-zinc-50 rounded-2xl flex items-center justify-center mb-6">
                  <MessageCircle className="w-6 h-6 text-white dark:text-zinc-900" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Native Meta Integration</h3>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Ditch the manual typing. Automated pickup reminders, return confirmations, and payment links sent directly from the system.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-16 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950">
        <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-4 max-w-xs">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-zinc-900 dark:text-zinc-50" />
              <span className="font-black text-xl text-zinc-900 dark:text-zinc-50 uppercase tracking-tighter italic">Echo</span>
            </div>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Echo is the next-generation operating system for high-growth rental networks. Empowering businesses to scale faster with intelligence.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-20">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Product</h4>
              <nav className="flex flex-col gap-2">
                <Link className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300" href="#features">Features</Link>
                <Link className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300" href="#pricing">Pricing</Link>
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Legal</h4>
              <nav className="flex flex-col gap-2">
                <Link className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300" href="#">Privacy</Link>
                <Link className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300" href="#">Terms</Link>
              </nav>
            </div>
          </div>
        </div>
        <div className="container px-4 md:px-6 mx-auto mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-900 text-center">
          <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest italic">© 2026 Echo Systems. Built for high performance scale. Proudly Made in India.</p>
        </div>
      </footer>
    </div>
  )
}
