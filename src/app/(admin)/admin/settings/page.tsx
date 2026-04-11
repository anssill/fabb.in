import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Database } from 'lucide-react'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings</h1>
        <p className="text-sm text-slate-500">Global configuration for the Fabb.booking platform.</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Security & Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow New Registrations</Label>
                <p className="text-xs text-slate-500">Allow new businesses to sign up without manual approval.</p>
              </div>
              <Switch checked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Required Email Verification</Label>
                <p className="text-xs text-slate-500">Force all staff members to verify their email address.</p>
              </div>
              <Switch checked />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              System Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Debug Mode</Label>
                <p className="text-xs text-slate-500">Enable verbose logging across the application.</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-xs text-slate-500">Redirect all users to a maintenance page.</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline">Reset to Defaults</Button>
          <Button className="bg-blue-600 hover:bg-blue-700">Save Configuration</Button>
        </div>
      </div>
    </div>
  )
}
