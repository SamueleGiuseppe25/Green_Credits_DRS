import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { submitClaim, fetchMyClaims } from '../lib/claimsApi'
import type { Claim } from '../types/api'

const statusColors: Record<string, string> = {
  open: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  in_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

export const ClaimsPage: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const refreshClaims = () => {
    setLoading(true)
    fetchMyClaims()
      .then(setClaims)
      .catch((e: unknown) => toast.error((e as Error)?.message || 'Failed to load claims'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refreshClaims()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      toast.error('Description is required')
      return
    }
    setSubmitting(true)
    try {
      await submitClaim(description.trim(), imageUrl || undefined)
      toast.success('Claim submitted')
      setDescription('')
      setImageUrl('')
      refreshClaims()
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Failed to submit claim')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Claims</h1>
      <p className="text-sm opacity-70 mb-4">
        If you think a collection is missing from your wallet, describe the issue here and our team will review it.
      </p>

      {/* Submit form */}
      <form onSubmit={handleSubmit} className="border rounded-md p-4 mb-6 space-y-3">
        <div>
          <label className="block text-xs opacity-70 mb-1">Description *</label>
          <textarea
            className="w-full border rounded px-2 py-1 bg-transparent dark:bg-gray-900 resize-none"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue (e.g. missing collection, wrong amount…)"
            required
          />
        </div>
        <div>
          <label className="block text-xs opacity-70 mb-1">Image (optional)</label>
          <input
            type="file"
            accept="image/*"
            className="w-full border rounded px-2 py-1 bg-transparent dark:bg-gray-900"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onloadend = () => setImageUrl(reader.result as string)
              reader.readAsDataURL(file)
            }}
          />
          {imageUrl && (
            <div className="mt-2">
              <img
                src={imageUrl}
                alt="Preview"
                className="max-h-[120px] rounded border object-contain"
              />
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="text-sm px-4 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Claim'}
        </button>
      </form>

      {/* My claims list */}
      <div className="font-semibold mb-3">My Claims</div>
      <div className="border rounded-md overflow-hidden">
        {loading ? (
          <div className="animate-pulse space-y-2 mt-4 p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-md px-4 py-3 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-1/4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : claims.length === 0 ? (
          <div className="text-center py-10 border rounded-md">
            <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">No claims submitted yet</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Use the form above to submit your first claim.</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {claims.map((c) => (
              <div key={c.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-sm">{c.description}</div>
                    {c.imageUrl && (
                      <a
                        href={c.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View image
                      </a>
                    )}
                  </div>
                  <span
                    className={`shrink-0 inline-block text-xs px-2 py-0.5 rounded-full ${
                      statusColors[c.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {c.status.replace('_', ' ')}
                  </span>
                </div>
                {c.adminResponse && (
                  <div className="mt-2 text-xs opacity-80 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                    {c.adminResponse}
                  </div>
                )}
                <div className="mt-1 text-xs opacity-60">
                  {new Date(c.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
