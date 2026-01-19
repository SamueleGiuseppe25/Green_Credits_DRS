import React, { useMemo, useState } from 'react'
import { useCollections, useCreateCollection, useCancelCollection, useDeleteCollection } from '../hooks/useCollections'
import { useMyCollectionSlots, useUpsertCollectionSlots, useDeleteCollectionSlot } from '../hooks/useSubscription'
import { useReturnPoints } from '../hooks/useReturnPoints'
import toast from 'react-hot-toast'

const SERVICE_START_MINUTES = 8 * 60
const SERVICE_END_MINUTES = 20 * 60

function timeToMinutes(value: string): number | null {
  if (!value) return null
  const [h, m] = value.split(':').map((n) => Number(n))
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function isWithinServiceHours(value: string): boolean {
  const minutes = timeToMinutes(value)
  if (minutes === null) return false
  return minutes >= SERVICE_START_MINUTES && minutes <= SERVICE_END_MINUTES
}

function formatTodayInputValue() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export const CollectionsPage: React.FC = () => {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const { data, isLoading, isError } = useCollections({ page, pageSize })
  const { data: rpData } = useReturnPoints({ pageSize: 200 })
  const createMutation = useCreateCollection()
  const cancelMutation = useCancelCollection()
  const deleteMutation = useDeleteCollection()
  const slot = useMyCollectionSlots()
  const upsertSlot = useUpsertCollectionSlots()
  const deleteSlot = useDeleteCollectionSlot()

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const returnPoints = rpData?.items ?? []
  const rpById = useMemo(() => new Map(returnPoints.map(r => [r.id, r])), [returnPoints])
  const slotEnabled = Boolean(slot.data?.enabled)
  const now = useMemo(() => new Date(), [])
  const hasUpcomingOneOff = useMemo(() => {
    return (data?.items ?? []).some(c => c.status.toLowerCase() !== 'canceled' && new Date(c.scheduledAt) >= now)
  }, [data, now])

  // Form state
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [returnPointId, setReturnPointId] = useState<number | ''>('')
  const [bagCount, setBagCount] = useState<number>(1)
  const [notes, setNotes] = useState<string>('')
  const minDate = formatTodayInputValue()

  const scheduledAtISO = useMemo(() => {
    if (!date || !time) return ''
    return `${date}T${time}:00`
  }, [date, time])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scheduledAtISO || !returnPointId) return
    const scheduledDate = new Date(scheduledAtISO)
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
      toast.error('Date must be today or later.')
      return
    }
    if (!isWithinServiceHours(time)) {
      toast.error('You can only book collections between 08:00 and 20:00.')
      return
    }
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
                          {c.status.toLowerCase() === 'canceled' && (
                            <button
                              className="text-xs px-2 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                              disabled={deleteMutation.isPending}
                              onClick={async () => {
                                if (window.confirm('Remove this canceled collection?')) {
                                  await deleteMutation.mutateAsync(c.id)
                                }
                              }}
                              title="Remove collection"
                            >
                              Remove
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

        <div className={`border rounded-md p-4 ${slotEnabled ? 'opacity-60 pointer-events-none' : ''}`}>
          <div className="font-semibold mb-2">Create a collection</div>
          {slotEnabled && (
            <div className="text-xs mb-2 opacity-70">
              You have a recurring pickup schedule enabled. Disable it to place a one-off collection.
            </div>
          )}
          <form className="space-y-3" onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm opacity-70">Date</label>
              <input type="date" min={minDate} className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100" value={date} onChange={(e) => setDate(e.target.value)} />
              <label className="text-sm opacity-70">Time</label>
              <input type="time" min="08:00" max="20:00" className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100" value={time} onChange={(e) => setTime(e.target.value)} />
              <label className="text-sm opacity-70">Return point</label>
              <select
                className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100"
                value={returnPointId}
                onChange={(e) => setReturnPointId(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">—</option>
                {returnPoints.map((rp) => (
                  <option key={rp.id} value={rp.id}>{rp.name}</option>
                ))}
              </select>
              <label className="text-sm opacity-70">Bags</label>
              <input type="number" min={1} className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100"
                value={bagCount} onChange={(e) => setBagCount(Number(e.target.value))}
              />
              <label className="text-sm opacity-70">Notes</label>
              <textarea className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
              <button
                type="submit"
                className="text-sm px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
                disabled={slotEnabled || createMutation.isPending || !scheduledAtISO || !returnPointId}
              >
                {createMutation.isPending ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>

        <div className="border rounded-md p-4">
          <div className="font-semibold mb-2">Recurring pickup schedule</div>
          {slotEnabled && slot.data && (
            <div className="mb-3 text-sm border rounded px-3 py-2 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
              <div>
                {(() => {
                  const freq = (slot.data?.frequency || 'weekly')
                  const weekday = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][Number(slot.data?.weekday) || 0]
                  const start = (slot.data?.startTime || '').slice(0,5)
                  const end = (slot.data?.endTime || '').slice(0,5)
                  const rp = slot.data?.preferredReturnPointId ? rpById.get(slot.data.preferredReturnPointId) : null
                  return `Your recurring pickup: ${freq.charAt(0).toUpperCase()}${freq.slice(1)} • ${weekday} • ${start}–${end}` + (rp ? ` • ${rp.name}` : '')
                })()}
              </div>
              <button
                className="text-xs px-2 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 ml-3"
                disabled={deleteSlot.isPending}
                onClick={async () => {
                  if (window.confirm('Disable recurring pickup schedule?')) {
                    await deleteSlot.mutateAsync()
                  }
                }}
              >
                {deleteSlot.isPending ? 'Disabling…' : 'Disable schedule'}
              </button>
            </div>
          )}
          {slot.isLoading && <div className="text-sm opacity-70">Loading schedule…</div>}
          {slot.isError && <div className="text-sm text-red-600">Could not load schedule.</div>}
          {!slot.isLoading && !slot.isError && (
            <>
              {!slotEnabled && hasUpcomingOneOff && (
                <div className="text-xs mb-2 opacity-70">
                  You already have a collection scheduled. Cancel it to enable recurring pickups.
                </div>
              )}
            <RecurringScheduleForm
              slot={slot.data || null}
              returnPoints={returnPoints}
              onSave={async (payload) => {
                await upsertSlot.mutateAsync(payload as any)
              }}
            />
            </>
          )}
        </div>
      </div>
    </section>
  )
}

const RecurringScheduleForm: React.FC<{
  slot: { weekday: number; startTime: string; endTime: string; preferredReturnPointId: number | null; frequency: string } | null
  returnPoints: { id: number; name: string }[]
  onSave: (payload: {
    weekday: number
    startTime: string
    endTime: string
    preferredReturnPointId: number | null
    frequency: 'weekly' | 'fortnightly' | 'every_2_weeks' | 'monthly'
  }) => Promise<void>
}> = ({ slot, returnPoints, onSave }) => {
  const [weekday, setWeekday] = useState<number | ''>(slot?.weekday ?? '')
  const [startTime, setStartTime] = useState<string>(slot ? slot.startTime.slice(0,5) : '')
  const [endTime, setEndTime] = useState<string>(slot ? slot.endTime.slice(0,5) : '')
  const [preferredId, setPreferredId] = useState<number | ''>(slot?.preferredReturnPointId ?? '')
  const [frequency, setFrequency] = useState<'weekly' | 'fortnightly' | 'every_2_weeks' | 'monthly'>((slot?.frequency as any) ?? 'weekly')
  const [saving, setSaving] = useState(false)
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault()
        if (weekday === '' || !startTime || !endTime) return
        if (!isWithinServiceHours(startTime) || !isWithinServiceHours(endTime)) {
          toast.error('You can only book collections between 08:00 and 20:00.')
          return
        }
        setSaving(true)
        try {
          await onSave({
            weekday: Number(weekday),
            startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
            endTime: endTime.length === 5 ? `${endTime}:00` : endTime,
            preferredReturnPointId: preferredId === '' ? null : Number(preferredId),
            frequency,
          })
        } finally {
          setSaving(false)
        }
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm opacity-70">How often?</label>
        <select className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100" value={frequency} onChange={(e) => setFrequency(e.target.value as any)}>
          <option value="weekly">Weekly</option>
          <option value="fortnightly">Every 2 weeks</option>
          <option value="monthly">Monthly</option>
        </select>
        <label className="text-sm opacity-70">Weekday</label>
        <select className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100" value={weekday} onChange={(e) => setWeekday(e.target.value === '' ? '' : Number(e.target.value))}>
          <option value="">—</option>
          <option value={0}>Sun</option>
          <option value={1}>Mon</option>
          <option value={2}>Tue</option>
          <option value={3}>Wed</option>
          <option value={4}>Thu</option>
          <option value={5}>Fri</option>
          <option value={6}>Sat</option>
        </select>
        <label className="text-sm opacity-70">Start time</label>
        <input type="time" min="08:00" max="20:00" className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <label className="text-sm opacity-70">End time</label>
        <input type="time" min="08:00" max="20:00" className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        <label className="text-sm opacity-70">Preferred return point</label>
        <select className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100" value={preferredId} onChange={(e) => setPreferredId(e.target.value === '' ? '' : Number(e.target.value))}>
          <option value="">—</option>
          {returnPoints.map((rp) => (
            <option key={rp.id} value={rp.id}>{rp.name}</option>
          ))}
        </select>
      </div>
      <div>
        <button className="text-sm px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50" disabled={saving} type="submit">
          {saving ? 'Saving…' : 'Save schedule'}
        </button>
      </div>
    </form>
  )
}


