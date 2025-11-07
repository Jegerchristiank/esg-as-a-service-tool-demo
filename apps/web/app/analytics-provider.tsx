'use client'

import { Analytics } from '@vercel/analytics/react'
import { useEffect } from 'react'

const AnalyticsProvider = (): JSX.Element => {
  useEffect(() => {
    console.log('Vercel Web Analytics initialised')
  }, [])

  return <Analytics />
}

export default AnalyticsProvider
