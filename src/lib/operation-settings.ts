export type OperationSettings = {
  enabled: boolean
  showInSidebar: boolean
  bookingWorkspace: boolean
  checklist: boolean
  itemPrep: boolean
  tasks: boolean
  fittingAlterations: boolean
  delivery: boolean
  signatures: boolean
  staffNotes: boolean
  whatsappActions: boolean
  draftList: boolean
}

export const DEFAULT_OPERATION_SETTINGS: OperationSettings = {
  enabled: true,
  showInSidebar: true,
  bookingWorkspace: true,
  checklist: true,
  itemPrep: true,
  tasks: true,
  fittingAlterations: true,
  delivery: true,
  signatures: true,
  staffNotes: true,
  whatsappActions: true,
  draftList: true,
}

export function getOperationSettings(settings: unknown): OperationSettings {
  const branchSettings = settings && typeof settings === 'object' && !Array.isArray(settings)
    ? settings as Record<string, unknown>
    : {}
  const operations = branchSettings.operations && typeof branchSettings.operations === 'object' && !Array.isArray(branchSettings.operations)
    ? branchSettings.operations as Partial<OperationSettings>
    : {}

  return {
    ...DEFAULT_OPERATION_SETTINGS,
    ...operations,
  }
}
