'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Alert
} from '@heroui/react'
import { CheckCircle, XCircle, Mail, RotateCcw, ArrowLeft } from 'lucide-react'
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
      placement="center"
      backdrop="blur"
      className="max-w-[400px]"
    >
      <ModalContent>
        {(onClose) => (
          <>
            {state === 'input' && (
              <>
                <ModalHeader className="flex flex-col gap-1 p-6 pb-2">
                  <h3 className="text-xl font-bold">Reset your password</h3>
                  <p className="text-sm font-normal text-default-500">Enter your email and we&apos;ll send a recovery link.</p>
                </ModalHeader>
                <ModalBody className="p-6 pt-2 pb-4 flex flex-col gap-4">
                  <Input
                    label="Work Email"
                    placeholder="name@company.com"
                    type="email"
                    variant="bordered"
                    labelPlacement="outside"
                    value={email}
                    onValueChange={setEmail}
                    startContent={<Mail className="w-4 h-4 text-default-400" />}
                    classNames={{
                      inputWrapper: "h-12 border-default-200 group-data-[focus=true]:border-primary",
                      label: "text-foreground-600 font-medium",
                    }}
                  />
                  <Button
                    color="primary"
                    className="h-12 font-bold shadow-lg shadow-primary/20 mt-2"
                    onPress={handleSend}
                    isLoading={loading}
                    disabled={!email}
                  >
                    Send reset link
                  </Button>
                </ModalBody>
                <ModalFooter className="p-6 pt-0 flex flex-col">
                  <Button
                    variant="light"
                    className="text-default-500 font-medium"
                    onPress={onClose}
                  >
                    Cancel
                  </Button>
                </ModalFooter>
              </>
            )}

            {state === 'sent' && (
              <ModalBody className="p-8 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-2">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">Check your email</h3>
                  <p className="text-sm text-default-500 leading-relaxed">
                    We sent a recovery link to <span className="font-bold text-foreground">{email}</span>
                  </p>
                </div>
                
                <Alert
                  color="warning"
                  variant="flat"
                  description="Check your spam folder if you haven't received it yet."
                  classNames={{
                    base: "text-tiny py-2",
                  }}
                />

                <Button
                  variant="bordered"
                  className="w-full h-11 mt-2 font-bold"
                  onPress={handleSend}
                  isDisabled={cooldown > 0}
                  startContent={<RotateCcw className="w-4 h-4" />}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend link'}
                </Button>
                
                <Button
                  variant="light"
                  className="text-primary font-bold"
                  startContent={<ArrowLeft className="w-4 h-4" />}
                  onPress={onClose}
                >
                  Back to login
                </Button>
              </ModalBody>
            )}

            {state === 'not_found' && (
              <ModalBody className="p-8 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mb-2">
                  <XCircle className="w-8 h-8 text-danger" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">Email not found</h3>
                  <p className="text-sm text-default-500 leading-relaxed">
                    No account found for {email}. Please double-check or contact your admin.
                  </p>
                </div>
                
                <Button
                  color="primary"
                  className="w-full h-11 mt-2 font-bold shadow-lg shadow-primary/20"
                  onPress={() => setState('input')}
                >
                  Try a different email
                </Button>

                <Button
                  variant="light"
                  className="text-default-500 font-medium"
                  onPress={onClose}
                >
                  Cancel
                </Button>
              </ModalBody>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
