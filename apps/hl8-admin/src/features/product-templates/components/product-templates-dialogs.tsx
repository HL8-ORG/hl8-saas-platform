import { ProductTemplatesActionDialog } from './product-templates-action-dialog'
import { ProductTemplatesDeleteDialog } from './product-templates-delete-dialog'
import { useProductTemplates } from './product-templates-provider'

export function ProductTemplatesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useProductTemplates()
  return (
    <>
      <ProductTemplatesActionDialog
        key='product-template-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      {currentRow && (
        <>
          <ProductTemplatesActionDialog
            key={`product-template-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <ProductTemplatesDeleteDialog
            key={`product-template-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  )
}
