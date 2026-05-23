import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  Package,
  Plus,
  Shirt,
  Waves,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const stats = [
  { label: 'Today Revenue', value: 'Rs 48K', helper: 'Payments collected', featured: true },
  { label: 'Active Orders', value: '34', helper: 'Bookings in progress' },
  { label: 'Items Out', value: '128', helper: 'Products with customers' },
  { label: 'Visitors', value: '412', helper: 'Customer profiles' },
]

const modules = [
  { title: 'Bookings', detail: 'Pickup, return, payment and customer history in one flow.', icon: CalendarCheck },
  { title: 'Inventory', detail: 'Track item status, condition, branch and availability by date.', icon: Shirt },
  { title: 'Payments', detail: 'Manage advance, balance, refunds and daily collections.', icon: CreditCard },
  { title: 'Washing', detail: 'Move returned items through care stages before they go live again.', icon: Waves },
]

const workflow = [
  'Create a customer booking with dates and item availability.',
  'Collect payment and run the day from a dashboard calendar.',
  'Return, inspect, wash and release inventory back to stock.',
]

export default function LandingPage() {
  return (
    <div className="bg-[#e9ebf5] text-slate-950">
      <section id="about" className="px-4 pb-10 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-[1.75rem] bg-[#f7f8fd] p-4 shadow-sm ring-1 ring-white/80">
            <div className="relative min-h-[560px] overflow-hidden rounded-[1.65rem] bg-white shadow-sm">
              <Image
                src="/images/hero.png"
                alt="Fabb.booking dashboard for clothing rental operations"
                fill
                priority
                sizes="(min-width: 1024px) 736px, 100vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/25" />
              <div className="relative z-10 flex min-h-[560px] flex-col justify-between p-6 sm:p-10">
                <div className="max-w-xl">
                  <Badge className="rounded-full border-0 bg-indigo-50 px-3 py-1 text-[#4f46e5]">Rental operations dashboard</Badge>
                  <h1 className="mt-6 max-w-lg text-5xl font-semibold leading-none tracking-normal text-slate-950 sm:text-6xl">
                    Fabb.booking
                  </h1>
                  <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
                    A calm workspace for apparel rentals: bookings, inventory, payments, staff and washing queues connected through Supabase.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Button className="h-12 rounded-full bg-[#4f46e5] px-5 text-white shadow-sm hover:bg-[#4338ca]" asChild>
                      <Link href="/signup">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                    <Button variant="outline" className="h-12 rounded-full border-white bg-white px-5 shadow-sm" asChild>
                      <Link href="/login">Log in</Link>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {['Branch-wise stock', 'Live calendars', 'Payment clarity'].map((item) => (
                    <div key={item} className="rounded-2xl bg-white/90 p-4 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
                      <CheckCircle2 className="mb-3 h-4 w-4 text-[#4f46e5]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <Card className="rounded-[1.65rem] border-0 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Sales Report</h2>
                    <p className="text-xs text-slate-500">Preview workspace</p>
                  </div>
                  <Button size="sm" className="h-9 rounded-full bg-[#4f46e5] text-white hover:bg-[#4338ca]">
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    New
                  </Button>
                </div>
                <div className="grid gap-3">
                  {stats.map((stat) => (
                    <div key={stat.label} className={stat.featured ? 'rounded-2xl bg-[#4f46e5] p-4 text-white' : 'rounded-2xl bg-slate-50 p-4'}>
                      <p className={stat.featured ? 'text-xs text-white/70' : 'text-xs text-slate-500'}>{stat.label}</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums">{stat.value}</p>
                      <p className={stat.featured ? 'mt-1 text-xs text-white/65' : 'mt-1 text-xs text-slate-500'}>{stat.helper}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.65rem] border-0 bg-white shadow-sm">
              <CardContent className="p-5">
                <h2 className="font-semibold">Product Statistic</h2>
                <p className="text-xs text-slate-500">Inventory health at a glance</p>
                <div className="relative mx-auto my-6 grid h-40 w-40 place-items-center rounded-full bg-[conic-gradient(#4f46e5_0_72%,#e5e7eb_72%_100%)]">
                  <div className="absolute h-28 w-28 rounded-full bg-[conic-gradient(#ef4444_0_42%,#e5e7eb_42%_100%)]" />
                  <div className="relative z-10 grid h-16 w-16 place-items-center rounded-full bg-white shadow-sm">
                    <Package className="h-5 w-5 text-[#4f46e5]" />
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  {['Occasion Wear', 'Active Rentals', 'Wash Queue'].map((item, index) => (
                    <div key={item} className="flex items-center gap-3">
                      <span className={index === 0 ? 'h-2.5 w-2.5 rounded-full bg-[#4f46e5]' : index === 1 ? 'h-2.5 w-2.5 rounded-full bg-[#ef4444]' : 'h-2.5 w-2.5 rounded-full bg-slate-300'} />
                      <span className="flex-1 text-slate-600">{item}</span>
                      <span className="font-semibold">{index === 0 ? '72%' : index === 1 ? '42%' : '18%'}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>

      <section id="features" className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Dashboard modules</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal">Everything the counter needs</h2>
            </div>
            <Button variant="outline" className="rounded-full border-white bg-white shadow-sm" asChild>
              <Link href="/signup">Create workspace <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {modules.map((module) => {
              const Icon = module.icon
              return (
                <Card key={module.title} className="rounded-[1.65rem] border-0 bg-white shadow-sm">
                  <CardContent className="p-5">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 font-semibold">{module.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{module.detail}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.8fr_1fr]">
          <Card className="rounded-[1.65rem] border-0 bg-white shadow-sm">
            <CardContent className="p-6">
              <BarChart3 className="h-8 w-8 text-[#4f46e5]" />
              <h2 className="mt-5 text-3xl font-semibold tracking-normal">A workflow that follows the rental day.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                From booking to return, every action updates the same workspace your dashboard reads.
              </p>
            </CardContent>
          </Card>
          <div className="grid gap-4">
            {workflow.map((item, index) => (
              <div key={item} className="flex gap-4 rounded-[1.65rem] bg-white p-5 shadow-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#4f46e5] text-sm font-bold text-white">{index + 1}</span>
                <div>
                  <h3 className="font-semibold">Step {index + 1}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[1.75rem] bg-[#f7f8fd] p-4 shadow-sm ring-1 ring-white/80">
          <div className="rounded-[1.65rem] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#4f46e5]">Launch offer</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-normal">Set up your rental workspace this week.</h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" className="rounded-full" asChild><Link href="/login">Log in</Link></Button>
                <Button className="rounded-full bg-[#4f46e5] text-white hover:bg-[#4338ca]" asChild><Link href="/signup">Sign up <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
