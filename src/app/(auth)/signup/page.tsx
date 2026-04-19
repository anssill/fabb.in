'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  Divider,
} from '@heroui/react'
import {
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Building,
  User,
  Mail,
  Smartphone,
  MapPin,
  Lock,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { safeJsonParse } from '@/lib/api-utils'
import { motion, AnimatePresence } from 'framer-motion'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirmPassword: '',
  })

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
    if (error) setError('')
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' })
      return
    }

    setLoading(true)
    setError('')
    setFieldErrors({})

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          email: form.email.toLowerCase(),
        }),
      })

      const data = await safeJsonParse(res)

      if (!res.ok) {
        if (data.fieldErrors && typeof data.fieldErrors === 'object') {
          const fe: Record<string, string> = {}
          for (const [k, v] of Object.entries(data.fieldErrors)) {
            fe[k] = Array.isArray(v) ? (v[0] as string) : String(v)
          }
          setFieldErrors(fe)
        }
        setError(typeof data.error === 'string' ? data.error : 'Please fix the errors below.')
        return
      }

      const supabase = createClient()
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })

      toast.success('Account created! Setting up your workspace...')
      router.push('/setup')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 bg-clip-text">
            Start Your Journey
          </h1>
          <p className="mt-2 text-default-500">
            Join the elite clothing rental businesses in India.
          </p>
        </div>

        <Card className="border-none shadow-2xl shadow-primary/10 bg-white/80 backdrop-blur-md">
          <CardBody className="p-8">
            <form onSubmit={handleSignup} className="flex flex-col gap-5">
              <Input
                label="Business Name"
                placeholder="e.g. Raj Bridal Collections"
                labelPlacement="outside"
                variant="bordered"
                radius="lg"
                size="lg"
                startContent={<Building className="text-default-400 w-5 h-5" />}
                value={form.businessName}
                onValueChange={(v) => updateField('businessName', v)}
                isInvalid={!!fieldErrors.businessName}
                errorMessage={fieldErrors.businessName}
                isDisabled={loading}
                isRequired
                classNames={{
                   label: "font-semibold text-gray-700",
                   inputWrapper: "border-gray-200 hover:border-primary focus-within:border-primary transition-all",
                }}
              />

              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  label="Your Name"
                  placeholder="Full Name"
                  labelPlacement="outside"
                  variant="bordered"
                  radius="lg"
                  size="lg"
                  startContent={<User className="text-default-400 w-5 h-5" />}
                  value={form.ownerName}
                  onValueChange={(v) => updateField('ownerName', v)}
                  isInvalid={!!fieldErrors.ownerName}
                  errorMessage={fieldErrors.ownerName}
                  isDisabled={loading}
                  isRequired
                  className="flex-1"
                  classNames={{
                    label: "font-semibold text-gray-700",
                    inputWrapper: "border-gray-200",
                  }}
                />
                <Input
                  label="City"
                  placeholder="e.g. Thrissur"
                  labelPlacement="outside"
                  variant="bordered"
                  radius="lg"
                  size="lg"
                  startContent={<MapPin className="text-default-400 w-5 h-5" />}
                  value={form.city}
                  onValueChange={(v) => updateField('city', v)}
                  isInvalid={!!fieldErrors.city}
                  errorMessage={fieldErrors.city}
                  isDisabled={loading}
                  isRequired
                  className="flex-1"
                  classNames={{
                    label: "font-semibold text-gray-700",
                    inputWrapper: "border-gray-200",
                  }}
                />
              </div>

              <Input
                label="Work Email"
                placeholder="you@yourbusiness.com"
                labelPlacement="outside"
                variant="bordered"
                radius="lg"
                size="lg"
                type="email"
                startContent={<Mail className="text-default-400 w-5 h-5" />}
                value={form.email}
                onValueChange={(v) => updateField('email', v)}
                isInvalid={!!fieldErrors.email}
                errorMessage={fieldErrors.email}
                isDisabled={loading}
                isRequired
                classNames={{
                  label: "font-semibold text-gray-700",
                  inputWrapper: "border-gray-200",
                }}
              />

              <Input
                label="WhatsApp Number"
                placeholder="98765 43210"
                labelPlacement="outside"
                variant="bordered"
                radius="lg"
                size="lg"
                type="tel"
                startContent={<Smartphone className="text-default-400 w-5 h-5" />}
                description="International format without +91"
                value={form.phone}
                onValueChange={(v) => updateField('phone', v.replace(/\D/g, '').slice(0, 10))}
                isInvalid={!!fieldErrors.phone}
                errorMessage={fieldErrors.phone}
                isDisabled={loading}
                isRequired
                classNames={{
                  label: "font-semibold text-gray-700",
                  inputWrapper: "border-gray-200",
                }}
              />

              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  label="Password"
                  placeholder="••••••••"
                  labelPlacement="outside"
                  variant="bordered"
                  radius="lg"
                  size="lg"
                  type={showPassword ? "text" : "password"}
                  startContent={<Lock className="text-default-400 w-5 h-5" />}
                  endContent={
                    <button type="button" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="text-default-400" /> : <Eye className="text-default-400" />}
                    </button>
                  }
                  value={form.password}
                  onValueChange={(v) => updateField('password', v)}
                  isInvalid={!!fieldErrors.password}
                  errorMessage={fieldErrors.password}
                  isDisabled={loading}
                  isRequired
                  className="flex-1"
                  classNames={{
                    label: "font-semibold text-gray-700",
                    inputWrapper: "border-gray-200",
                  }}
                />
                <Input
                  label="Confirm Password"
                  placeholder="••••••••"
                  labelPlacement="outside"
                  variant="bordered"
                  radius="lg"
                  size="lg"
                  type={showPassword ? "text" : "password"}
                  startContent={<Lock className="text-default-400 w-5 h-5" />}
                  value={form.confirmPassword}
                  onValueChange={(v) => updateField('confirmPassword', v)}
                  isInvalid={!!fieldErrors.confirmPassword}
                  errorMessage={fieldErrors.confirmPassword}
                  isDisabled={loading}
                  isRequired
                  className="flex-1"
                  classNames={{
                    label: "font-semibold text-gray-700",
                    inputWrapper: "border-gray-200",
                  }}
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-200 rounded-xl text-danger text-sm"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                color="primary"
                size="lg"
                radius="lg"
                className="font-bold text-white shadow-xl shadow-primary/30 h-14 mt-2"
                isLoading={loading}
                endContent={!loading && <ArrowRight className="w-5 h-5" />}
              >
                {loading ? 'Creating Your Universe...' : 'Start 14-Day Free Trial'}
              </Button>

              <div className="flex flex-col items-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-[11px] text-default-400 font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Verified SaaS Secure · No Credit Card</span>
                </div>
                
                <p className="text-sm text-default-500">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary font-bold hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </CardBody>
        </Card>

        <p className="mt-8 text-[11px] text-default-400 text-center px-4">
          By joining Fabb.booking, you agree to our{' '}
          <Link href="#" className="font-semibold hover:text-default-600 transition-colors underline underline-offset-2">Terms of Service</Link>
          {' '}and{' '}
          <Link href="#" className="font-semibold hover:text-default-600 transition-colors underline underline-offset-2">Privacy Policy</Link>.
        </p>
      </motion.div>
    </div>
  )
}
