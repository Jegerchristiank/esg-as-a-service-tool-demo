/**
 * Beregning for modul E4 – påvirkning af biodiversitet.
 */
import type { E4BiodiversityInput, ModuleEsrsFact, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'

const { e4Biodiversity } = factors

export function runE4Biodiversity(input: ModuleInput): ModuleResult {
  const raw = (input.E4Biodiversity ?? null) as E4BiodiversityInput | null

  const sites = normaliseCount(raw?.sitesInOrNearProtectedAreas)
  const impactedArea = normaliseArea(raw?.protectedAreaHectares)
  const restoredArea = normaliseArea(raw?.restorationHectares)
  const incidents = normaliseCount(raw?.significantIncidents)
  const dataQualityPercent = clampPercent(raw?.documentationQualityPercent, 100)

  const assumptions = [
    'Risikoindekset beregnes med vægte: lokaliteter 30 %, påvirket areal 40 % og hændelser 30 %.',
    'Restaurering reducerer risikoen med op til 60 % afhængigt af forholdet mellem restaureret og påvirket areal.',
  ]
  const warnings: string[] = []
  const trace: string[] = []

  const siteScore = Math.min(sites / e4Biodiversity.siteNormalizationCount, 1) * e4Biodiversity.siteWeight
  const areaScore = Math.min(impactedArea / e4Biodiversity.areaNormalizationHectares, 1) * e4Biodiversity.areaWeight
  const incidentScore = Math.min(incidents / e4Biodiversity.incidentNormalizationCount, 1) * e4Biodiversity.incidentWeight

  const restorationRatio = impactedArea === 0 ? 0 : Math.min(restoredArea / impactedArea, 1)
  const restorationMitigation = restorationRatio * e4Biodiversity.restorationMitigationRate

  const totalWeight = e4Biodiversity.siteWeight + e4Biodiversity.areaWeight + e4Biodiversity.incidentWeight
  const rawRisk = Math.max(0, siteScore + areaScore + incidentScore - restorationMitigation)
  const value = Number(((rawRisk / totalWeight) * 100).toFixed(e4Biodiversity.resultPrecision))

  trace.push(`sites=${sites}`)
  trace.push(`impactedAreaHa=${impactedArea.toFixed(2)}`)
  trace.push(`restoredAreaHa=${restoredArea.toFixed(2)}`)
  trace.push(`incidents=${incidents}`)
  trace.push(`siteScore=${siteScore.toFixed(4)}`)
  trace.push(`areaScore=${areaScore.toFixed(4)}`)
  trace.push(`incidentScore=${incidentScore.toFixed(4)}`)
  trace.push(`restorationRatio=${restorationRatio.toFixed(4)}`)
  trace.push(`restorationMitigation=${restorationMitigation.toFixed(4)}`)
  trace.push(`rawRisk=${rawRisk.toFixed(4)}`)

  if (sites > 0) {
    warnings.push(`${sites} lokalitet(er) ligger i eller tæt på beskyttede områder. Iværksæt biodiversitetsplaner.`)
  }

  if (impactedArea > 0 && restoredArea === 0) {
    warnings.push(
      `Der er registreret ${impactedArea.toFixed(1)} ha påvirket natur uden dokumenteret restaurering. Prioritér afbødende tiltag.`,
    )
  }

  if (restorationRatio >= 0.8 && impactedArea > 0) {
    warnings.push('Restaurering dækker størstedelen af det påvirkede areal – dokumentér effekten for assurance.')
  }

  if (incidents > 0) {
    warnings.push(`${incidents} væsentlig(e) biodiversitetshændelse(r) registreret. Gennemfør årsagsanalyse og forebyggelse.`)
  }

  if (value > e4Biodiversity.riskAttentionThreshold) {
    warnings.push('Biodiversitetsrisikoen overstiger 60 point – rapportér handlingsplan til ledelsen.')
  }

  if (dataQualityPercent < e4Biodiversity.dataQualityWarningPercent) {
    warnings.push(
      `Dokumentationskvalitet på ${dataQualityPercent.toFixed(0)} % er under anbefalet niveau på ${e4Biodiversity.dataQualityWarningPercent} %. Suppler feltdata eller tredjepartsverifikation.`,
    )
  }

  trace.push(`dataQualityPercent=${dataQualityPercent.toFixed(2)}`)

  const esrsFacts: ModuleEsrsFact[] = []
  const pushNumericFact = (key: string, value: number, unitId: string, decimals: number) => {
    if (!Number.isFinite(value)) {
      return
    }
    esrsFacts.push({ conceptKey: key, value: Number(value), unitId, decimals })
  }

  pushNumericFact('E4SitesInProtectedAreasCount', sites, 'pure', 0)
  pushNumericFact('E4ProtectedAreaHectares', impactedArea, 'hectare', 2)
  pushNumericFact('E4RestorationHectares', restoredArea, 'hectare', 2)
  pushNumericFact('E4SignificantIncidentsCount', incidents, 'pure', 0)
  pushNumericFact('E4RestorationRatioPercent', restorationRatio * 100, 'percent', 1)
  pushNumericFact('E4DocumentationQualityPercent', dataQualityPercent, 'percent', 1)

  return {
    value,
    unit: e4Biodiversity.unit,
    assumptions,
    trace,
    warnings,
    ...(esrsFacts.length > 0 ? { esrsFacts } : {})
  }
}

function normaliseCount(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) {
    return 0
  }
  return Math.max(0, Math.round(value))
}

function normaliseArea(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) {
    return 0
  }
  return Math.max(0, value)
}

function clampPercent(value: number | null | undefined, fallback: number): number {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) {
    return clampPercentValue(fallback)
  }
  return clampPercentValue(value)
}

function clampPercentValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.min(Math.max(value, 0), 100)
}
