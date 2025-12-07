import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Role } from '../data/schema'

type RolesDialogType = 'add' | 'edit' | 'delete'

type RolesContextType = {
  open: RolesDialogType | null
  setOpen: (str: RolesDialogType | null) => void
  currentRow: Role | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Role | null>>
  refreshRoles?: () => void
}

const RolesContext = React.createContext<RolesContextType | null>(null)

export function RolesProvider({
  children,
  refreshRoles,
}: {
  children: React.ReactNode
  refreshRoles?: () => void
}) {
  const [open, setOpen] = useDialogState<RolesDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Role | null>(null)

  return (
    <RolesContext
      value={{ open, setOpen, currentRow, setCurrentRow, refreshRoles }}
    >
      {children}
    </RolesContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useRoles = () => {
  const rolesContext = React.useContext(RolesContext)

  if (!rolesContext) {
    throw new Error('useRoles has to be used within <RolesContext>')
  }

  return rolesContext
}
