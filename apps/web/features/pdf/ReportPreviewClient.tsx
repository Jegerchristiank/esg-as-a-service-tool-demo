/**
 * Klientkomponent der renderer PDF-preview for beregnede moduler.
 */
'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { CalculatedModuleResult } from '@org/shared'

const PDFViewer = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFViewer), {
  ssr: false
})
const DocumentComponent = dynamic(() => import('@org/shared').then((mod) => mod.EsgReportPdf), {
  ssr: false
})

export default function ReportPreviewClient({
  results
}: {
  results: CalculatedModuleResult[]
}): JSX.Element {
  const printable = useMemo(
    () => results.filter((entry) => !entry.result.assumptions.includes('Stubberegning')),
    [results]
  )

  if (!printable.length) {
    return <p>Ingen resultater at vise endnu.</p>
  }

  return (
    <PDFViewer style={{ width: '100%', height: '100%' }}>
      <DocumentComponent results={printable} />
    </PDFViewer>
  )
}
