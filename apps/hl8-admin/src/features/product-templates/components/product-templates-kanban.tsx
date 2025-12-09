import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { statusColors, typeColors } from '../data/data'
import { type ProductTemplate } from '../data/schema'
import { useProductTemplates } from './product-templates-provider'

type ProductTemplatesKanbanProps = {
  data: ProductTemplate[]
}

/**
 * 产品模板看板视图组件
 * 以卡片形式展示产品模板列表
 * 根据 XML 配置：左侧显示图片，右侧显示名称、编码、类型、类别、标签、激活状态
 */
export function ProductTemplatesKanban({ data }: ProductTemplatesKanbanProps) {
  const { setOpen, setCurrentRow } = useProductTemplates()
  const typeLabels: Record<ProductTemplate['type'], string> = {
    product: '产品',
    service: '服务',
    consu: '消耗品',
  }

  if (data.length === 0) {
    return (
      <div className='flex items-center justify-center py-12'>
        <p className='text-muted-foreground'>暂无数据</p>
      </div>
    )
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {data.map((productTemplate) => {
        const status = productTemplate.active ? 'active' : 'inactive'
        const statusBadgeColor = statusColors.get(status)
        const typeBadgeColor = typeColors.get(productTemplate.type)

        return (
          <Card
            key={productTemplate.id}
            className={cn(
              'hover:border-primary cursor-pointer transition-all hover:shadow-md'
            )}
            onClick={() => {
              setCurrentRow(productTemplate)
              setOpen('edit')
            }}
          >
            <CardContent className='p-4'>
              <div className='flex gap-4'>
                {/* 图片区域 - 左侧，w-28 (112px) */}
                <div className='w-28 flex-shrink-0'>
                  {productTemplate.image ? (
                    <img
                      src={productTemplate.image}
                      alt={productTemplate.name}
                      className='h-28 w-28 rounded object-cover'
                    />
                  ) : (
                    <div className='bg-muted flex h-28 w-28 items-center justify-center rounded'>
                      <span className='text-muted-foreground px-2 text-center text-xs'>
                        无图片
                      </span>
                    </div>
                  )}
                </div>

                {/* 内容区域 - 右侧，flex-1 */}
                <div className='min-w-0 flex-1'>
                  <h3 className='mb-1 truncate text-base font-semibold'>
                    {productTemplate.name}
                  </h3>
                  <p className='text-muted-foreground mb-2 truncate text-sm'>
                    {productTemplate.code}
                  </p>

                  <div className='mb-2 flex flex-wrap gap-1'>
                    <Badge
                      variant='outline'
                      className={cn('text-xs', typeBadgeColor?.className)}
                    >
                      {typeLabels[productTemplate.type] || productTemplate.type}
                    </Badge>
                    <Badge
                      variant='outline'
                      className={cn('text-xs', statusBadgeColor?.className)}
                    >
                      {status === 'active' ? '激活' : '未激活'}
                    </Badge>
                  </div>

                  {productTemplate.categoryId && (
                    <p className='text-muted-foreground mb-1 truncate text-xs'>
                      类别: {productTemplate.categoryId}
                    </p>
                  )}

                  {productTemplate.tagIds &&
                    productTemplate.tagIds.length > 0 && (
                      <div className='mt-1 flex flex-wrap gap-1'>
                        {productTemplate.tagIds.slice(0, 3).map((tagId) => (
                          <Badge
                            key={tagId}
                            variant='secondary'
                            className='text-xs'
                          >
                            {tagId}
                          </Badge>
                        ))}
                        {productTemplate.tagIds.length > 3 && (
                          <Badge variant='secondary' className='text-xs'>
                            +{productTemplate.tagIds.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
