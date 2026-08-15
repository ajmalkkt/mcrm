import React, { useEffect, useState } from 'react'

export default function App() {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    fetch(import.meta.env.VITE_API_BASE_URL + '/health')
      .then(r => r.json())
      .then(() => setStatus('ok'))
      .catch(() => setStatus('unreachable'))
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">m-crm</h1>
      <p>API status: {status}</p>
    </div>
  )
}
