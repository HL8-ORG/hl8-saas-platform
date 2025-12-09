import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type ProductTemplate } from '../data/schema'

type ProductTemplatesDialogType = 'add' | 'edit' | 'delete'

type ProductTemplatesContextType = {
  open: ProductTemplatesDialogType | null
  setOpen: (str: ProductTemplatesDialogType | null) => void
  currentRow: ProductTemplate | null
  setCurrentRow: React.Dispatch<React.SetStateAction<ProductTemplate | null>>
  refreshProductTemplates?: () => void
}

const ProductTemplatesContext =
  React.createContext<ProductTemplatesContextType | null>(null)

export function ProductTemplatesProvider({
  children,
  refreshProductTemplates,
}: {
  children: React.ReactNode
  refreshProductTemplates?: () => void
}) {
  const [open, setOpen] = useDialogState<ProductTemplatesDialogType>(null)
  const [currentRow, setCurrentRow] = useState<ProductTemplate | null>(null)

  return (
    <ProductTemplatesContext
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        refreshProductTemplates,
      }}
    >
      {children}
    </ProductTemplatesContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useProductTemplates = () => {
  const productTemplatesContext = React.useContext(ProductTemplatesContext)

  if (!productTemplatesContext) {
    throw new Error(
      'useProductTemplates has to be used within <ProductTemplatesContext>'
    )
  }

  return productTemplatesContext
}
