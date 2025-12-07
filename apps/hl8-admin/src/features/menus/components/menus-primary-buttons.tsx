import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMenus } from './menus-provider'

export function MenusPrimaryButtons() {
  const { setOpen } = useMenus()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Add Menu</span> <Menu size={18} />
      </Button>
    </div>
  )
}
