import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProductTemplates } from './product-templates-provider'

export function ProductTemplatesPrimaryButtons() {
  const { setOpen } = useProductTemplates()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>添加产品模板</span> <Package size={18} />
      </Button>
    </div>
  )
}
