import React, { useMemo, useState } from 'react'
import { useCollections, useCreateCollection, useCancelCollection } from '../hooks/useCollections'
import { useReturnPoints } from '../hooks/useReturnPoints'

export const CollectionsPage: React.FC = () => {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const { data, isLoading, isError } = useCollections({ page, pageSize })
  const { data: rpData } = useReturnPoints({ pageSize: 200 })
  const createMutation = useCreateCollection()
  const cancelMutation = useCancelCollection()

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const returnPoints = rpData?.items ?? []
  const rpById = useMemo(() => new Map(returnPoints.map(r => [r.id, r])), [returnPoints])

  // Form state
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [returnPointId, setReturnPointId] = useState<number | ''>('')
  const [bagCount, setBagCount] = useState<number>(1)
  const [notes, setNotes] = useState<string>('')

  const scheduledAtISO = useMemo(() => {
    if (!date || !time) return ''
    return `${date}T${time}:00`
  }, [date, time])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scheduledAtISO || !returnPointId) return
    await createMutation.mutateAsync({
      scheduledAt: scheduledAtISO,
      returnPointId: Number(returnPointId),
      bagCount,
      notes: notes || null,
    })
    // reset
    setDate('')
    setTime('')
    setReturnPointId('')
    setBagCount(1)
    setNotes('')
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Collections</h1>
      <p className="text-sm opacity-70 mb-4">
        Schedule home collections for your bags. We’ll send a driver in your chosen time window and credit your wallet after processing.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border rounded-md overflow-hidden">
          <div className="border-b px-3 py-2 font-semibold">Your collections</div>
          <div className="p-3">
            {isLoading && <div className="text-sm opacity-70">Loading your collections…</div>}
            {isError && <div className="text-sm text-red-600">Could not load your collections.</div>}
            {!isLoading && !isError && items.length === 0 && (
              <div className="text-sm opacity-70">You have no collections scheduled yet.</div>
            )}
            {!isLoading && !isError && items.length > 0 && (
              <ul className="divide-y border rounded-md">
                {items.map((c) => {
                  const rp = rpById.get(c.returnPointId)
                  return (
                    <li key={c.id} className="px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium">
                          {new Date(c.scheduledAt).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {c.status}
                          </span>
                          {c.status.toLowerCase() === 'scheduled' && (
                            <button
                              className="text-xs px-2 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                              disabled={cancelMutation.isPending}
                              onClick={async () => {
                                if (window.confirm('Cancel this collection?')) {
                                  await cancelMutation.mutateAsync(c.id)
                                }
                              }}
                              title="Cancel collection"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="opacity-70">
                        RP: {rp ? rp.name : `#${c.returnPointId}`} • Bags: {c.bagCount ?? 0}
                        {c.notes ? ` • ${c.notes}` : ''}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            <div className="flex items-center gap-2 mt-3">
              <button
                className="text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <div className="text-xs opacity-70">Page {page} / {totalPages}</div>
              <button
                className="text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="border rounded-md p-4">
          <div className="font-semibold mb-2">Create a collection</div>
          <form className="space-y-3" onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm opacity-70">Date</label>
              <input type="date" className="border rounded px-2 py-1 bg-transparent" value={date} onChange={(e) => setDate(e.target.value)} />
              <label className="text-sm opacity-70">Time</label>
              <input type="time" className="border rounded px-2 py-1 bg-transparent" value={time} onChange={(e) => setTime(e.target.value)} />
              <label className="text-sm opacity-70">Return point</label>
              <select
                className="border rounded px-2 py-1 bg-transparent"
                value={returnPointId}
                onChange={(e) => setReturnPointId(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">—</option>
                {returnPoints.map((rp) => (
                  <option key={rp.id} value={rp.id}>{rp.name}</option>
                ))}
              </select>
              <label className="text-sm opacity-70">Bags</label>
              <input type="number" min={1} className="border rounded px-2 py-1 bg-transparent"
                value={bagCount} onChange={(e) => setBagCount(Number(e.target.value))}
              />
              <label className="text-sm opacity-70">Notes</label>
              <textarea className="border rounded px-2 py-1 bg-transparent" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
              <button
                type="submit"
                className="text-sm px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
                disabled={createMutation.isPending || !scheduledAtISO || !returnPointId}
              >
                {createMutation.isPending ? 'Creating…' : 'Create'}
              </button>
              {createMutation.isError && (
                <div className="text-xs text-red-600 mt-1">Could not create collection.</div>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}



