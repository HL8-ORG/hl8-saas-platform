import { MenusActionDialog } from './menus-action-dialog'
import { MenusDeleteDialog } from './menus-delete-dialog'
import { useMenus } from './menus-provider'

export function MenusDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useMenus()
  return (
    <>
      <MenusActionDialog
        key='menu-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      {currentRow && (
        <>
          <MenusActionDialog
            key={`menu-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <MenusDeleteDialog
            key={`menu-delete-${currentRow.id}`}
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
