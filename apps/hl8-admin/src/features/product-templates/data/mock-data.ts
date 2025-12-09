import { type ProductTemplate } from './schema'

/**
 * 产品模板模拟数据
 * 用于开发和测试环境
 */
export const mockProductTemplates: ProductTemplate[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max',
    code: 'IPHONE15PM',
    type: 'product',
    categoryId: 'electronics',
    image:
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&h=200&fit=crop',
    canSale: true,
    canPurchase: false,
    active: true,
    tagIds: ['premium', 'new', 'bestseller'],
    attributeLineIds: ['color', 'storage'],
    productVariantIds: ['iphone15pm-256-black', 'iphone15pm-512-blue'],
    description: '苹果最新旗舰手机，配备A17 Pro芯片和钛金属机身',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    name: 'MacBook Pro 16英寸',
    code: 'MBP16',
    type: 'product',
    categoryId: 'computers',
    image:
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=200&h=200&fit=crop',
    canSale: true,
    canPurchase: true,
    active: true,
    tagIds: ['professional', 'high-performance'],
    attributeLineIds: ['chip', 'memory', 'storage'],
    productVariantIds: ['mbp16-m3-32-1tb'],
    description: '专业级笔记本电脑，适合创意工作者和开发者',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '3',
    name: 'AirPods Pro 2',
    code: 'APP2',
    type: 'product',
    categoryId: 'audio',
    image:
      'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=200&h=200&fit=crop',
    canSale: true,
    canPurchase: true,
    active: true,
    tagIds: ['wireless', 'noise-cancelling'],
    attributeLineIds: [],
    productVariantIds: ['app2-standard'],
    description: '主动降噪无线耳机，支持空间音频',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '4',
    name: '网站设计服务',
    code: 'WEB-DESIGN',
    type: 'service',
    categoryId: 'services',
    image:
      'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=200&h=200&fit=crop',
    canSale: true,
    canPurchase: false,
    active: true,
    tagIds: ['design', 'web'],
    attributeLineIds: ['package'],
    productVariantIds: [],
    description: '专业的网站设计和开发服务，包括UI/UX设计',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-08'),
  },
  {
    id: '5',
    name: '云服务器托管',
    code: 'CLOUD-HOST',
    type: 'service',
    categoryId: 'services',
    image:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=200&fit=crop',
    canSale: true,
    canPurchase: false,
    active: true,
    tagIds: ['cloud', 'hosting'],
    attributeLineIds: ['plan'],
    productVariantIds: ['cloud-basic', 'cloud-pro', 'cloud-enterprise'],
    description: '高性能云服务器托管服务，支持弹性扩容',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-25'),
  },
  {
    id: '6',
    name: '打印纸 A4',
    code: 'PAPER-A4',
    type: 'consu',
    categoryId: 'office-supplies',
    image:
      'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=200&h=200&fit=crop',
    canSale: true,
    canPurchase: true,
    active: true,
    tagIds: ['office', 'consumable'],
    attributeLineIds: ['weight', 'quantity'],
    productVariantIds: ['paper-a4-80gsm-500', 'paper-a4-80gsm-1000'],
    description: '标准A4打印纸，80g/m²，适用于办公和打印',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-06'),
  },
  {
    id: '7',
    name: '墨盒 HP 803',
    code: 'INK-HP803',
    type: 'consu',
    categoryId: 'office-supplies',
    image:
      'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=200&h=200&fit=crop',
    canSale: true,
    canPurchase: true,
    active: true,
    tagIds: ['printer', 'consumable'],
    attributeLineIds: ['color'],
    productVariantIds: ['ink-hp803-black', 'ink-hp803-color'],
    description: 'HP 803系列打印机墨盒，黑色和彩色可选',
    createdAt: new Date('2024-02-08'),
    updatedAt: new Date('2024-02-09'),
  },
  {
    id: '8',
    name: 'iPad Air',
    code: 'IPAD-AIR',
    type: 'product',
    categoryId: 'electronics',
    image:
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&h=200&fit=crop',
    canSale: true,
    canPurchase: true,
    active: true,
    tagIds: ['tablet', 'apple'],
    attributeLineIds: ['storage', 'color'],
    productVariantIds: ['ipad-air-64-blue', 'ipad-air-256-silver'],
    description: '轻薄便携的平板电脑，适合学习和娱乐',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-30'),
  },
  {
    id: '9',
    name: '咨询服务',
    code: 'CONSULT',
    type: 'service',
    categoryId: 'services',
    image:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=200&fit=crop',
    canSale: true,
    canPurchase: false,
    active: true,
    tagIds: ['consulting', 'professional'],
    attributeLineIds: ['duration'],
    productVariantIds: [],
    description: '专业的业务咨询服务，提供战略规划和解决方案',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-12'),
  },
  {
    id: '10',
    name: '数据线 USB-C',
    code: 'CABLE-USB-C',
    type: 'consu',
    categoryId: 'accessories',
    image:
      'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=200&h=200&fit=crop',
    canSale: true,
    canPurchase: true,
    active: true,
    tagIds: ['cable', 'accessory'],
    attributeLineIds: ['length'],
    productVariantIds: ['cable-1m', 'cable-2m', 'cable-3m'],
    description: 'USB-C数据线，支持快充和数据传输',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-16'),
  },
  {
    id: '11',
    name: 'Apple Watch Series 9',
    code: 'AW-S9',
    type: 'product',
    categoryId: 'wearables',
    image:
      'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=200&h=200&fit=crop',
    canSale: true,
    canPurchase: false,
    active: true,
    tagIds: ['smartwatch', 'fitness'],
    attributeLineIds: ['size', 'band'],
    productVariantIds: ['aw-s9-41-sport', 'aw-s9-45-sport'],
    description: '智能手表，支持健康监测和运动追踪',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: '12',
    name: '已停用产品示例',
    code: 'DISABLED-PROD',
    type: 'product',
    categoryId: 'electronics',
    image: undefined,
    canSale: false,
    canPurchase: false,
    active: false,
    tagIds: [],
    attributeLineIds: [],
    productVariantIds: [],
    description: '这是一个已停用的产品示例',
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

/**
 * 获取模拟的产品模板列表（支持分页和筛选）
 */
export function getMockProductTemplates(params?: {
  current?: number
  size?: number
  name?: string
  code?: string
  type?: 'product' | 'service' | 'consu'
  active?: boolean
}): {
  records: ProductTemplate[]
  total: number
  current: number
  size: number
} {
  let filtered = [...mockProductTemplates]

  // 按名称筛选
  if (params?.name) {
    const nameLower = params.name.toLowerCase()
    filtered = filtered.filter((item) =>
      item.name.toLowerCase().includes(nameLower)
    )
  }

  // 按编码筛选
  if (params?.code) {
    const codeLower = params.code.toLowerCase()
    filtered = filtered.filter((item) =>
      item.code.toLowerCase().includes(codeLower)
    )
  }

  // 按类型筛选
  if (params?.type) {
    filtered = filtered.filter((item) => item.type === params.type)
  }

  // 按激活状态筛选
  if (params?.active !== undefined) {
    filtered = filtered.filter((item) => item.active === params.active)
  }

  const total = filtered.length
  const current = params?.current || 1
  const size = params?.size || 10
  const start = (current - 1) * size
  const end = start + size

  return {
    records: filtered.slice(start, end),
    total,
    current,
    size,
  }
}
