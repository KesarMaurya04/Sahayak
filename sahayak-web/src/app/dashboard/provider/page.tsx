'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    // Client-side redirect to match your server redirect
    router.replace('/dashboard/provider/listings')
  }, [router])

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to listings...</p>
    </div>
  )
}