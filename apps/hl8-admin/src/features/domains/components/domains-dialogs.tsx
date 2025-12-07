import { DomainsActionDialog } from './domains-action-dialog'
import { DomainsDeleteDialog } from './domains-delete-dialog'
import { useDomains } from './domains-provider'

export function DomainsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useDomains()
  return (
    <>
      <DomainsActionDialog
        key='domain-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      {currentRow && (
        <>
          <DomainsActionDialog
            key={`domain-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <DomainsDeleteDialog
            key={`domain-delete-${currentRow.id}`}
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
