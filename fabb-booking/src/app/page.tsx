'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShieldCheck, 
  MapPin, 
  Waves, 
  LayoutDashboard, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Smartphone,
  Users,
  Menu,
  X,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      } else {
        setIsLoading(false)
      }
    }
    checkUser()
  }, [router])

  const features = [
    {
      title: "Inventory Master",
      description: "Complete tracking of 10,000+ items with size variants, colors, and condition monitoring.",
      icon: LayoutDashboard,
      color: "blue"
    },
    {
      title: "6-Step Booking Wizard",
      description: "Streamlined booking flow with group discounts, security deposits, and multi-piece support.",
      icon: CheckCircle2,
      color: "emerald"
    },
    {
      title: "GPS Staff Attendance",
      description: "Real-time location-based attendance tracking for distributed staff teams.",
      icon: MapPin,
      color: "rose"
    },
    {
      title: "Smart Washing Queue",
      description: "Automated maintenance pipeline ensuring every item is ready for its next booking.",
      icon: Waves,
      color: "cyan"
    },
    {
      title: "Precision Analytics",
      description: "Deep insights into revenue, inventory turnover, and staff performance.",
      icon: TrendingUp,
      color: "purple"
    },
    {
      title: "Mobile Optimized",
      description: "Full dashboard power on any device. Manage your business from your pocket.",
      icon: Smartphone,
      color: "orange"
    }
  ]

  if (isLoading) return null

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Fabb.booking</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">Get Started</Button>
            </Link>
          </div>

          {/* Mobile Nav Toggle */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 animate-in slide-in-from-top duration-300">
            <div className="p-4 flex flex-col gap-4">
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-lg">Sign In</Button>
              </Link>
              <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full text-lg bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-40 pb-16 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-[40%] -left-[10%] w-[70%] h-[120%] bg-blue-100/50 rounded-full blur-3xl opacity-50 animate-pulse decoration-8" />
          <div className="absolute top-[20%] -right-[10%] w-[50%] h-[80%] bg-purple-100/50 rounded-full blur-3xl opacity-50 animate-pulse duration-5000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Badge variant="outline" className="px-3 py-1 bg-white border-blue-100 text-blue-600 mb-8 shadow-sm">
              Professional Rental Management
            </Badge>
          </div>
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            Scale Your Rental <br className="hidden md:block" /> Business with Precision.
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-xl text-slate-600 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            The all-in-one platform for inventory, bookings, and staff management. Designed for modern rental businesses that demand excellence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/25 transition-all hover:scale-105 active:scale-95">
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg border-slate-200 bg-white hover:bg-slate-50 transition-all">
                View Demo
              </Button>
            </Link>
          </div>

          {/* Social Proof / Trust */}
          <div className="mt-20 pt-10 border-t border-slate-200/60">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">Trusted by growing businesses in India</p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6" /> <span className="text-xl font-bold">Loomer</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-6 h-6" /> <span className="text-xl font-bold">FitTrack</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6" /> <span className="text-xl font-bold">Tempo</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6" /> <span className="text-xl font-bold">SecureRent</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Built for Every Operational Detail</h2>
            <p className="text-slate-500 max-w-xl mx-auto">From the first customer inquiry to the final item maintenance, Fabb.booking handles the heavy lifting.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-500/10 text-${feature.color}-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative rounded-3xl bg-slate-900 p-8 md:p-16 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="text-center md:text-left">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Ready to optimize your operations?</h2>
                <p className="text-slate-400 text-lg">Join 50+ businesses transforming their rental workflow today.</p>
              </div>
              <div className="flex-shrink-0">
                <Link href="/signup">
                  <Button size="lg" className="h-16 px-10 text-xl bg-white text-slate-900 hover:bg-slate-100">
                    Get Started Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">Fabb.booking</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-500">
            <Link href="#" className="hover:text-blue-600">Privacy Policy</Link>
            <Link href="#" className="hover:text-blue-600">Terms of Service</Link>
            <Link href="#" className="hover:text-blue-600">Contact Us</Link>
          </div>
          <p className="text-sm text-slate-400">© 2026 Fabb.booking. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
