'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PERMISSION_GROUPS, PermissionKey } from '@/lib/permissions'
import { Building2, Check, Search, Shield, X as XIcon } from 'lucide-react'

export interface StaffBranchOption {
  id: string
  name: string | null
  prefix: string | null
  city: string | null
  is_default: boolean | null
}

interface PermissionAccessEditorProps {
  permissions: Record<string, boolean>
  onPermissionsChange: (permissions: Record<string, boolean>) => void
  branches: StaffBranchOption[]
  selectedBranchIds: string[]
  primaryBranchId: string | null
  onBranchAccessChange: (branchIds: string[], primaryBranchId: string | null) => void
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase()
}

export function PermissionAccessEditor({
  permissions,
  onPermissionsChange,
  branches,
  selectedBranchIds,
  primaryBranchId,
  onBranchAccessChange,
}: PermissionAccessEditorProps) {
  const [permissionQuery, setPermissionQuery] = useState('')
  const [branchQuery, setBranchQuery] = useState('')

  const normalizedPermissionQuery = normalizeQuery(permissionQuery)
  const normalizedBranchQuery = normalizeQuery(branchQuery)
  const selectedBranchSet = useMemo(() => new Set(selectedBranchIds), [selectedBranchIds])

  const filteredGroups = useMemo(() => {
    if (!normalizedPermissionQuery) return PERMISSION_GROUPS

    return PERMISSION_GROUPS
      .map(group => {
        const groupMatches = `${group.label} ${group.description}`.toLowerCase().includes(normalizedPermissionQuery)
        const matchedPermissions = group.permissions.filter(permission =>
          `${permission.label} ${permission.description} ${permission.key}`.toLowerCase().includes(normalizedPermissionQuery)
        )

        return {
          ...group,
          permissions: groupMatches ? group.permissions : matchedPermissions,
        }
      })
      .filter(group => group.permissions.length > 0)
  }, [normalizedPermissionQuery])

  const filteredBranches = useMemo(() => {
    if (!normalizedBranchQuery) return branches

    return branches.filter(branch =>
      `${branch.name || ''} ${branch.prefix || ''} ${branch.city || ''}`.toLowerCase().includes(normalizedBranchQuery)
    )
  }, [branches, normalizedBranchQuery])

  const visiblePermissionKeys = filteredGroups.flatMap(group => group.permissions.map(permission => permission.key))
  const totalPermissions = PERMISSION_GROUPS.reduce((sum, group) => sum + group.permissions.length, 0)
  const enabledPermissions = PERMISSION_GROUPS
    .flatMap(group => group.permissions)
    .filter(permission => permissions[permission.key] !== false).length

  function setPermission(key: PermissionKey, enabled: boolean) {
    onPermissionsChange({
      ...permissions,
      [key]: enabled,
    })
  }

  function setPermissionKeys(keys: readonly PermissionKey[], enabled: boolean) {
    const next = { ...permissions }
    for (const key of keys) {
      next[key] = enabled
    }
    onPermissionsChange(next)
  }

  function toggleBranch(branchId: string) {
    const next = selectedBranchSet.has(branchId)
      ? selectedBranchIds.filter(id => id !== branchId)
      : [...selectedBranchIds, branchId]

    if (next.length === 0) return

    const nextPrimary = next.includes(primaryBranchId || '') ? primaryBranchId : next[0]
    onBranchAccessChange(next, nextPrimary || null)
  }

  function selectAllBranches() {
    const ids = branches.map(branch => branch.id)
    if (ids.length === 0) return
    onBranchAccessChange(ids, primaryBranchId && ids.includes(primaryBranchId) ? primaryBranchId : ids[0])
  }

  function selectOnlyPrimary() {
    const fallbackId = primaryBranchId || selectedBranchIds[0] || branches[0]?.id || null
    if (!fallbackId) return
    onBranchAccessChange([fallbackId], fallbackId)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="min-w-0 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Label className="text-sm font-semibold">Feature permissions</Label>
            <p className="text-xs text-slate-500">{enabledPermissions} of {totalPermissions} features enabled</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPermissionKeys(visiblePermissionKeys, true)}>
              Select visible
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setPermissionKeys(visiblePermissionKeys, false)}>
              Clear visible
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={permissionQuery}
            onChange={(event) => setPermissionQuery(event.target.value)}
            placeholder="Search permissions, features, or modules..."
            className="h-10 rounded-xl border-slate-200 pl-10"
          />
        </div>

        <div className="max-h-[min(52vh,34rem)] space-y-3 overflow-y-auto pr-1">
          {filteredGroups.map(group => {
            const groupKeys = group.permissions.map(permission => permission.key)
            const enabledInGroup = groupKeys.filter(key => permissions[key] !== false).length
            const allEnabled = enabledInGroup === groupKeys.length

            return (
              <div key={group.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-950">{group.label}</p>
                      <Badge variant="outline" className="rounded-full text-[10px]">
                        {enabledInGroup}/{groupKeys.length}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{group.description}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0"
                    onClick={() => setPermissionKeys(groupKeys, !allEnabled)}
                  >
                    {allEnabled ? 'Clear group' : 'Select group'}
                  </Button>
                </div>

                <div className="mt-3 grid gap-2">
                  {group.permissions.map(permission => {
                    const isEnabled = permissions[permission.key] !== false
                    return (
                      <label
                        key={permission.key}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                          isEnabled
                            ? 'border-indigo-100 bg-indigo-50 text-indigo-950'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}
                      >
                        <Checkbox
                          checked={isEnabled}
                          onCheckedChange={(checked) => setPermission(permission.key, checked === true)}
                          className="mt-0.5"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{permission.label}</span>
                          <span className="block text-xs text-slate-500">{permission.description}</span>
                        </span>
                        <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${isEnabled ? 'bg-[#4f46e5] text-white' : 'bg-slate-200 text-slate-400'}`}>
                          {isEnabled ? <Check className="h-3.5 w-3.5" /> : <XIcon className="h-3.5 w-3.5" />}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {filteredGroups.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <Shield className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No permissions match your search</p>
            </div>
          )}
        </div>
      </section>

      <section className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div>
          <Label className="text-sm font-semibold">Branch access</Label>
          <p className="text-xs text-slate-500">{selectedBranchIds.length} of {branches.length} branches selected</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={branchQuery}
            onChange={(event) => setBranchQuery(event.target.value)}
            placeholder="Search branches..."
            className="h-10 rounded-xl border-slate-200 bg-white pl-10"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={selectAllBranches} disabled={branches.length === 0}>
            Select all
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={selectOnlyPrimary} disabled={branches.length === 0}>
            Primary only
          </Button>
        </div>

        <div className="max-h-[min(46vh,28rem)] space-y-2 overflow-y-auto pr-1">
          {filteredBranches.map(branch => {
            const isSelected = selectedBranchSet.has(branch.id)
            const isPrimary = primaryBranchId === branch.id

            return (
              <div
                key={branch.id}
                className={`rounded-xl border p-3 transition-colors ${
                  isSelected ? 'border-indigo-100 bg-white' : 'border-slate-200 bg-white/60 opacity-70'
                }`}
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleBranch(branch.id)}
                    className="mt-1"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-slate-950">{branch.name || 'Main Branch'}</span>
                      {branch.prefix && <Badge variant="outline" className="rounded-full text-[10px]">{branch.prefix}</Badge>}
                      {branch.is_default && <Badge className="rounded-full bg-slate-900 text-[10px] text-white hover:bg-slate-900">Default</Badge>}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                      <Building2 className="h-3.5 w-3.5" />
                      {branch.city || 'No city set'}
                    </span>
                  </span>
                </label>

                {isSelected && (
                  <Button
                    type="button"
                    variant={isPrimary ? 'default' : 'outline'}
                    size="sm"
                    className="mt-3 h-8 w-full"
                    onClick={() => onBranchAccessChange(selectedBranchIds, branch.id)}
                  >
                    {isPrimary ? 'Primary branch' : 'Make primary'}
                  </Button>
                )}
              </div>
            )
          })}

          {filteredBranches.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
              <Building2 className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No branches match your search</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
