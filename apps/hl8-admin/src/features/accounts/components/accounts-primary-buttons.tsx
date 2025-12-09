import { Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccounts } from './accounts-provider'

export function AccountsPrimaryButtons() {
  const { setOpen } = useAccounts()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>添加科目</span> <Wallet size={18} />
      </Button>
    </div>
  )
}
