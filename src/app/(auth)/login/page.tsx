'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Button, 
  Input, 
  Checkbox, 
  Card, 
  CardBody, 
  CardHeader, 
  Divider,
  Alert
} from '@heroui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { GoogleButton } from './components/GoogleButton'
import { ForgotPasswordModal } from './components/ForgotPasswordModal'
import { createClient } from '@/lib/supabase/client'
import { safeJsonParse } from '@/lib/api-utils'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ message: string; code: string } | null>(null)
  const [forgotOpen, setForgotOpen] = useState(false)

  const toggleVisibility = () => setIsVisible(!isVisible)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      })

      const data = await safeJsonParse(res)

      if (!res.ok) {
        setError({ message: data.error || 'Login failed', code: data.code || 'UNKNOWN' })
        return
      }

      const supabase = createClient()
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })

      if (sessionError) throw sessionError

      toast.success('Welcome back to Fabb.booking!')
      router.push(data.staff?.setup_completed === false ? '/setup' : redirect)
      router.refresh()
    } catch (err: any) {
      console.error('Login error:', err)
      setError({ message: 'Something went wrong. Please try again.', code: 'UNKNOWN' })
    } finally {
      setLoading(false)
    }
  }

  const ErrorIcon = error?.code === 'RATE_LIMITED' ? Clock : AlertCircle

  return (
    <div className="flex flex-col gap-6 w-full max-w-[420px] mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-2"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-2 shadow-sm">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground-600 bg-clip-text text-transparent">
          Welcome Back
        </h1>
        <p className="text-default-500 text-sm">
          Sign in to your dashboard to manage bookings
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-none bg-background/60 backdrop-blur-md shadow-2xl shadow-primary/5">
          <CardBody className="p-6 sm:p-8 flex flex-col gap-6">
            <GoogleButton />

            <div className="flex items-center gap-4 py-2">
              <Divider className="flex-1" />
              <span className="text-tiny text-default-400 uppercase font-bold tracking-wider">
                OR EMAIL
              </span>
              <Divider className="flex-1" />
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <Input
                label="Work Email"
                placeholder="name@business.com"
                labelPlacement="outside"
                type="email"
                value={email}
                onValueChange={(val) => { setEmail(val); setError(null); }}
                isRequired
                isDisabled={loading}
                startContent={<Mail className="text-default-400 w-4 h-4" />}
                variant="bordered"
                classNames={{
                  inputWrapper: "h-12 border-default-200 group-data-[focus=true]:border-primary",
                  label: "text-foreground-600 font-medium",
                }}
              />

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-sm text-foreground-600 font-medium ml-1">Password</label>
                  <Button 
                    variant="light" 
                    size="sm" 
                    className="text-primary text-tiny font-bold h-auto min-w-0 p-0 hover:bg-transparent"
                    onPress={() => setForgotOpen(true)}
                  >
                    Forgot password?
                  </Button>
                </div>
                <Input
                  placeholder="••••••••"
                  type={isVisible ? "text" : "password"}
                  value={password}
                  onValueChange={(val) => { setPassword(val); setError(null); }}
                  isRequired
                  isDisabled={loading}
                  startContent={<Lock className="text-default-400 w-4 h-4" />}
                  endContent={
                    <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                      {isVisible ? (
                        <EyeOff className="text-default-400 w-5 h-5" />
                      ) : (
                        <Eye className="text-default-400 w-5 h-5" />
                      )}
                    </button>
                  }
                  variant="bordered"
                  classNames={{
                    inputWrapper: "h-12 border-default-200 group-data-[focus=true]:border-primary",
                  }}
                />
              </div>

              <div className="flex items-center gap-2 px-1">
                <Checkbox
                  isSelected={rememberMe}
                  onValueChange={setRememberMe}
                  size="sm"
                  classNames={{
                    label: "text-default-500",
                  }}
                >
                  Remember me for 30 days
                </Checkbox>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Alert
                      color={error.code === 'RATE_LIMITED' ? 'warning' : 'danger'}
                      variant="flat"
                      title={error.code === 'RATE_LIMITED' ? 'Security Notice' : 'Login Error'}
                      description={error.message}
                      startContent={<ErrorIcon className="w-4 h-4" />}
                      classNames={{
                        base: "p-3",
                        title: "text-tiny font-bold",
                        description: "text-tiny"
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                color="primary"
                size="lg"
                className="font-bold shadow-lg shadow-primary/20 mt-2"
                isLoading={loading}
                endContent={!loading && <ArrowRight className="w-4 h-4" />}
              >
                {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              </Button>
            </form>
          </CardBody>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-center"
      >
        <p className="text-default-500 text-sm">
          New to Fabb.booking?{' '}
          <Link href="/signup" className="text-primary font-bold hover:underline underline-offset-4 transition-all">
            Create Business Account
          </Link>
        </p>
      </motion.div>

      <ForgotPasswordModal open={forgotOpen} onOpenChange={setForgotOpen} defaultEmail={email} />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
