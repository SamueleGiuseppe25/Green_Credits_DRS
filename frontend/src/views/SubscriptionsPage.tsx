import React, { useMemo, useState } from 'react'
import { useMySubscription, useMyCollectionSlots, useUpsertCollectionSlots } from '../hooks/useSubscription'
import { useReturnPoints } from '../hooks/useReturnPoints'

function StatusBadge({ status }: { status: string }) {
  const color =
    status.toLowerCase() === 'active'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      : status.toLowerCase() === 'cancelled'
      ? 'bg-gray-100 text-gray-700 dark:bg-gray-800/70 dark:text-gray-300'
      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{status}</span>
}

export const SubscriptionsPage: React.FC = () => {
  const { data: sub, isLoading: subLoading, isError: subError } = useMySubscription()
  const { data: slot, isLoading: slotLoading, isError: slotError } = useMyCollectionSlots()
  const { data: rpData } = useReturnPoints({ pageSize: 200 })
  const upsertSlot = useUpsertCollectionSlots()

  const returnPoints = rpData?.items ?? []
  const [editing, setEditing] = useState(false)
  const [weekday, setWeekday] = useState<number | null>(null)
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [preferredId, setPreferredId] = useState<number | null>(null)

  React.useEffect(() => {
    if (slot && !editing) {
      setWeekday(slot.weekday)
      setStartTime(slot.startTime.slice(0,5)) // HH:MM
      setEndTime(slot.endTime.slice(0,5))
      setPreferredId(slot.preferredReturnPointId)
    }
  }, [slot, editing])

  const rows = useMemo(() => {
    const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const chosen = typeof (editing ? weekday : slot?.weekday) === 'number' ? (editing ? weekday! : slot!.weekday) : null
    const s = editing ? startTime : (slot?.startTime?.slice(0,5) ?? '')
    const e = editing ? endTime : (slot?.endTime?.slice(0,5) ?? '')
    return labels.map((label, i) => {
      const active = chosen === i
      return { i, label, active, s: active ? s : '', e: active ? e : '' }
    })
  }, [slot, editing, weekday, startTime, endTime])

  const handleSave = async () => {
    if (weekday == null || !startTime || !endTime) return
    await upsertSlot.mutateAsync({
      weekday,
      startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
      endTime: endTime.length === 5 ? `${endTime}:00` : endTime,
      preferredReturnPointId: preferredId ?? null,
    })
    setEditing(false)
  }

  return (
    <section className="">
      <h1 className="text-2xl font-bold">Subscriptions</h1>
      <p className="text-sm opacity-70 mb-4">
        Your subscription controls how often we collect bags from your home. You can adjust your weekly pickup slot here.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border rounded-md p-4">
          <div className="font-semibold mb-2">Subscription</div>
          {subLoading && <div className="text-sm opacity-70">Loading subscription…</div>}
          {subError && <div className="text-sm text-red-600">Could not load subscription.</div>}
          {!subLoading && !subError && sub && (
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="opacity-70">Status</span>
                <StatusBadge status={sub.status} />
              </div>
              <div><span className="opacity-70">Plan</span> {sub.planCode ?? '-'}</div>
              <div><span className="opacity-70">Start</span> {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : '-'}</div>
              <div><span className="opacity-70">End</span> {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '-'}</div>
            </div>
          )}
          {!subLoading && !subError && !sub && (
            <div className="text-sm opacity-70">You don’t have a subscription yet.</div>
          )}
        </div>

        <div className="border rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Pickup schedule</div>
            {!editing ? (
              <button className="text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setEditing(true)}
              >Edit schedule</button>
            ) : (
              <div className="flex gap-2">
                <button
                  className="text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setEditing(false)}
                >Cancel</button>
                <button
                  className="text-sm px-2 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
                  onClick={handleSave}
                  disabled={upsertSlot.isPending}
                >Save</button>
              </div>
            )}
          </div>

          {slotLoading && <div className="text-sm opacity-70">Loading schedule…</div>}
          {slotError && <div className="text-sm text-red-600">Could not load schedule.</div>}
          {!slotLoading && !slotError && (
            <div className="space-y-2">
              {!editing && (
                <ul className="divide-y border rounded-md">
                  {rows.map((r) => (
                    <li key={r.i} className="px-3 py-2 flex items-center justify-between">
                      <span className="font-medium">{r.label}</span>
                      <span className="text-sm opacity-70">{r.active ? `${r.s}–${r.e}` : 'No pickup'}</span>
                    </li>
                  ))}
                </ul>
              )}

              {editing && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-sm opacity-70">Weekday</label>
                    <select
                      className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100"
                      value={weekday ?? ''}
                      onChange={(e) => setWeekday(e.target.value === '' ? null : Number(e.target.value))}
                    >
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
                    <input type="time" className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    <label className="text-sm opacity-70">End time</label>
                    <input type="time" className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    <label className="text-sm opacity-70">Preferred return point</label>
                    <select
                      className="border rounded px-2 py-1 bg-transparent dark:bg-gray-900 dark:text-gray-100"
                      value={preferredId ?? ''}
                      onChange={(e) => setPreferredId(e.target.value === '' ? null : Number(e.target.value))}
                    >
                      <option value="">—</option>
                      {returnPoints.map((rp) => (
                        <option key={rp.id} value={rp.id}>{rp.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}



