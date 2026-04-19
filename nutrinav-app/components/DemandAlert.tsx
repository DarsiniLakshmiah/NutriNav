'use client'

interface DemandCount {
  store_id: string
  product: string
  count_7d: number
  count_30d: number
  alert: 'red' | 'yellow' | 'green'
}

interface DemandAlertProps {
  item: DemandCount
}

const alertConfig = {
  red:    { bg: 'bg-red-50',    border: 'border-red-400',    badge: 'bg-red-500',    text: 'Stock This — High Unmet Demand' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-400', badge: 'bg-yellow-500', text: 'Consider Stocking — Growing Need' },
  green:  { bg: 'bg-green-50',  border: 'border-green-400',  badge: 'bg-green-500',  text: 'No action needed' },
}

export default function DemandAlert({ item }: DemandAlertProps) {
  const cfg = alertConfig[item.alert]
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full ${cfg.badge}`} />
        <div>
          <p className="font-semibold text-[#2C2C2C]">{item.product}</p>
          <p className="text-xs text-gray-500">{cfg.text}</p>
        </div>
      </div>
      <div className="text-right text-sm">
        <p className="font-bold text-[#2C2C2C]">{item.count_7d} <span className="font-normal text-gray-400">7d</span></p>
        <p className="text-gray-500">{item.count_30d} 30d</p>
      </div>
    </div>
  )
}
