type QuickReplyItem = {
  id: string
  label: string
  content: string
}

type QuickRepliesMenuProps = {
  open: boolean
  items: QuickReplyItem[]
  onSelect: (item: QuickReplyItem) => void
}

export default function QuickRepliesMenu({ open, items, onSelect }: QuickRepliesMenuProps) {
  if (!open || !items.length) return null

  return (
    <div
      className="absolute bottom-[72px] left-0 right-0 rounded-xl border bg-white shadow-lg"
      style={{ borderColor: '#D1E5DE', zIndex: 70 }}
    >
      <div className="px-3 py-2 border-b" style={{ borderColor: '#E2E8F0' }}>
        <p className="text-[11px] font-semibold" style={{ color: '#075E54' }}>
          Quick Replies
        </p>
      </div>
      <div className="max-h-56 overflow-y-auto py-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="w-full text-left px-3 py-2 hover:bg-slate-50"
          >
            <p className="text-xs font-semibold" style={{ color: '#0F172A' }}>
              /{item.label}
            </p>
            <p className="text-xs truncate" style={{ color: '#64748B' }}>
              {item.content}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
