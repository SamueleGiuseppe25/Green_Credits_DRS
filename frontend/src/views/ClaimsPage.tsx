import React from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiForm } from '../lib/api'
import { ClaimSubmitResponse } from '../types/api'

export const ClaimsPage: React.FC = () => {
  const submit = useMutation({
    mutationKey: ['claims','submit'],
    mutationFn: async (data: { file: File; note?: string }) => {
      const form = new FormData()
      form.append('image', data.file)
      if (data.note) form.append('note', data.note)
      return apiForm<ClaimSubmitResponse>('/claims/submit', form)
    },
  })

  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">Claims</h1>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          const file = (e.currentTarget.elements.namedItem('image') as HTMLInputElement).files?.[0]
          const note = (e.currentTarget.elements.namedItem('note') as HTMLInputElement).value
          if (file) submit.mutate({ file, note })
        }}
      >
        <input type="file" name="image" accept="image/*" required />
        <input type="text" name="note" placeholder="Optional note" className="border rounded px-2 py-1" />
        <button className="px-3 py-1 rounded bg-blue-600 text-white" type="submit">Submit</button>
      </form>
      {submit.data && (
        <pre className="mt-4 text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">{JSON.stringify(submit.data, null, 2)}</pre>
      )}
    </section>
  )
}


