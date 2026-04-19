'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  TextField,
  Label,
  Input,
  Alert
} from '@heroui/react'
import { CheckCircle, XCircle, Mail, RotateCcw, ArrowLeft, Loader2 } from 'lucide-react'
import { safeJsonParse } from '@/lib/api-utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultEmail: string
}

export function ForgotPasswordModal({ open, onOpenChange, defaultEmail }: Props) {
  const [email, setEmail] = useState(defaultEmail)
  const [state, setState] = useState<'input' | 'sent' | 'not_found'>('input')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail)
      setState('input')
    }
  }, [open, defaultEmail])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleSend = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await safeJsonParse(res)
      if (data.code === 'NOT_FOUND') {
        setState('not_found')
      } else {
        setState('sent')
        setCooldown(60)
      }
    } catch {
      setState('not_found')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal 
      isOpen={open} 
      onOpenChange={onOpenChange}
    >
      <ModalBackdrop className="bg-[#020617]/80 backdrop-blur-md" />
      <ModalContainer placement="center">
        <ModalDialog className="max-w-[440px] bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2rem] overflow-hidden outline-none">
          {({ close: onClose }) => (
            <>
              {state === 'input' && (
                <>
                  <ModalHeader className="flex flex-col gap-1 p-8 pb-2">
                    <h3 className="text-2xl font-bold text-white">Reset Password</h3>
                    <p className="text-sm font-normal text-slate-400">Enter your email and we&apos;ll send a recovery link.</p>
                  </ModalHeader>
                  <ModalBody className="p-8 pt-2 pb-6 flex flex-col gap-6">
                    <TextField 
                      value={email}
                      onChange={setEmail}
                      className="space-y-2"
                    >
                      <Label className="text-sm font-medium text-slate-300 ml-1 block">Work Email</Label>
                    <div className="relative group transition-all">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                      </div>
                      <Input
                        placeholder="name@company.com"
                        type="email"
                        className="w-full h-12 pl-11 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 transition-all hover:border-white/20 focus:border-emerald-500/50 outline-none shadow-inner"
                      />
                    </div>
                    </TextField>
                    <Button
                      variant="primary"
                      className="h-14 font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 mt-2 rounded-xl group relative overflow-hidden"
                      onPress={handleSend}
                      isDisabled={!email || loading}
                    >
                      {loading ? (
                        <RotateCcw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span className="relative z-10">Send Recovery Link</span>
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0" />
                        </>
                      )}
                    </Button>
                  </ModalBody>
                  <ModalFooter className="p-8 pt-0 flex flex-col">
                    <Button
                      variant="ghost"
                      className="text-slate-400 font-medium hover:text-white transition-colors"
                      onPress={onClose}
                    >
                      Cancel
                    </Button>
                  </ModalFooter>
                </>
              )}

              {state === 'sent' && (
                <ModalBody className="p-10 text-center flex flex-col items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-2">
                    <CheckCircle className="w-10 h-10 text-success" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">Check your email</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      We sent a recovery link to <span className="font-bold text-white">{email}</span>
                    </p>
                  </div>
                  
                  <Alert
                    status="warning"
                    className="text-xs py-3 bg-warning/10 border-warning/20 text-warning-600 rounded-xl"
                  >
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title className="font-bold">Check your spam folder</Alert.Title>
                      <Alert.Description>If you haven't received it yet, checking your spam folder is a good idea.</Alert.Description>
                    </Alert.Content>
                  </Alert>

                  <Button
                    className="w-full bg-primary text-white font-bold h-14 rounded-xl mt-2 flex items-center justify-center gap-2 group relative overflow-hidden"
                    onPress={handleSend}
                    isDisabled={cooldown > 0 || loading}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                        <span className="relative z-10">
                          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend link'}
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0" />
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full text-slate-400 font-medium flex items-center justify-center gap-2 hover:text-white transition-all"
                    onPress={onClose}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                  </Button>
                </ModalBody>
              )}

              {state === 'not_found' && (
                <ModalBody className="p-10 text-center flex flex-col items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mb-2">
                    <XCircle className="w-10 h-10 text-danger" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">Email not found</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      No account found for <span className="text-white font-bold">{email}</span>. Please double-check or contact support.
                    </p>
                  </div>
                  
                  <Button
                    variant="primary"
                    className="w-full h-14 bg-primary text-white mt-2 font-bold shadow-lg shadow-primary/20 rounded-xl group relative overflow-hidden"
                    onPress={() => setState('input')}
                  >
                    <span className="relative z-10">Try a different email</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0" />
                  </Button>

                  <Button
                    variant="ghost"
                    className="text-slate-400 font-medium hover:text-white transition-colors"
                    onPress={onClose}
                  >
                    Cancel
                  </Button>
                </ModalBody>
              )}
            </>
          )}
        </ModalDialog>
      </ModalContainer>
    </Modal>
  )
}
