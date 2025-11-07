/**
 * Beregning for modul E2 – vandforbrug og vandstress.
 */
import type { E2WaterInput, ModuleEsrsFact, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'

const { e2Water } = factors

export function runE2Water(input: ModuleInput): ModuleResult {
  const raw = (input.E2Water ?? null) as E2WaterInput | null

  const totalWithdrawal = normaliseVolume(raw?.totalWithdrawalM3)
  const stressWithdrawalRaw = normaliseVolume(raw?.withdrawalInStressRegionsM3)
  const dischargeRaw = normaliseVolume(raw?.dischargeM3)
  const reusePercent = clampPercent(raw?.reusePercent, e2Water.defaultReusePercent)
  const reuseRatio = reusePercent / 100
  const dataQualityPercent = clampPercent(raw?.dataQualityPercent, 100)

  const warnings: string[] = []
  const assumptions = [
    'Vandstressindeks beregnes som vægtet sum: 50 % stress, 30 % genbrug og 20 % udledning.',
    'Manglende data for genbrug behandles som 0 % genbrug.',
  ]
  const trace: string[] = []

  if (totalWithdrawal < e2Water.minimumReportableWithdrawalM3) {
    if (totalWithdrawal === 0) {
      warnings.push('Intet vandforbrug registreret. Indtast forbrug for at beregne vandstress.')
    } else {
      warnings.push(
        `Det registrerede vandforbrug (${totalWithdrawal.toFixed(1)} m³) er lavere end minimumsgrænsen på ${e2Water.minimumReportableWithdrawalM3} m³ og afrundes til nul.`,
      )
    }
    return {
      value: 0,
      unit: e2Water.unit,
      assumptions,
      trace: [`totalWithdrawalM3=${totalWithdrawal.toFixed(1)}`],
      warnings,
    }
  }

  let stressWithdrawal = stressWithdrawalRaw
  if (stressWithdrawal > totalWithdrawal) {
    warnings.push('Vandudtag i stressede områder overstiger det totale vandforbrug. Værdien begrænses til totalen.')
    stressWithdrawal = totalWithdrawal
  }

  let discharge = dischargeRaw
  if (discharge > totalWithdrawal) {
    warnings.push('Udledt vand overstiger total udtag. Værdien begrænses til totalen for beregning.')
    discharge = totalWithdrawal
  }

  const stressShare = totalWithdrawal === 0 ? 0 : stressWithdrawal / totalWithdrawal
  const dischargeRatio = totalWithdrawal === 0 ? 0 : discharge / totalWithdrawal
  const stressSharePercent = (stressShare * 100).toFixed(1)
  const stressThresholdPercent = (e2Water.stressWarningThreshold * 100).toFixed(0)

  const totalWeight = e2Water.stressWeight + e2Water.reuseWeight + e2Water.dischargeWeight
  const weightedRisk =
    (stressShare * e2Water.stressWeight +
      (1 - reuseRatio) * e2Water.reuseWeight +
      (1 - dischargeRatio) * e2Water.dischargeWeight) /
    totalWeight
  const value = Number((weightedRisk * 100).toFixed(e2Water.resultPrecision))

  trace.push(`totalWithdrawalM3=${totalWithdrawal.toFixed(2)}`)
  trace.push(`stressWithdrawalM3=${stressWithdrawal.toFixed(2)}`)
  trace.push(`stressShare=${stressShare.toFixed(4)}`)
  trace.push(`stressSharePercent=${stressSharePercent}`)
  trace.push(`dischargeM3=${discharge.toFixed(2)}`)
  trace.push(`dischargeRatio=${dischargeRatio.toFixed(4)}`)
  trace.push(`reusePercent=${reusePercent.toFixed(2)}`)
  trace.push(`reuseRatio=${reuseRatio.toFixed(4)}`)
  trace.push(`weightedRisk=${weightedRisk.toFixed(4)}`)

  if (stressShare > e2Water.stressWarningThreshold) {
    const stressWarningMessage = `Mere end ${stressThresholdPercent} % af vandudtaget (${stressSharePercent} %) foregår i vandstressede områder – prioriter risikoplaner.`
    warnings.push(stressWarningMessage)
  }

  if (reusePercent === 0) {
    warnings.push('Ingen dokumenteret genbrug af vand. Overvej recirkulation eller sekundære kilder.')
  }

  if (dataQualityPercent < e2Water.lowDataQualityThresholdPercent) {
    warnings.push(
      `Dokumentationskvaliteten (${dataQualityPercent.toFixed(0)} %) ligger under anbefalingen på ${e2Water.lowDataQualityThresholdPercent} %. Forbedr datagrundlaget for vandforbrug.`,
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

  pushNumericFact('E2TotalWaterWithdrawalM3', totalWithdrawal, 'm3', 0)
  pushNumericFact('E2WaterWithdrawalInStressRegionsM3', stressWithdrawal, 'm3', 0)
  pushNumericFact('E2WaterDischargeM3', discharge, 'm3', 0)
  pushNumericFact('E2WaterReusePercent', reusePercent, 'percent', 1)
  pushNumericFact('E2WaterStressSharePercent', stressShare * 100, 'percent', 1)
  pushNumericFact('E2WaterDischargeRatioPercent', dischargeRatio * 100, 'percent', 1)
  pushNumericFact('E2WaterDataQualityPercent', dataQualityPercent, 'percent', 1)

  return {
    value,
    unit: e2Water.unit,
    assumptions,
    trace,
    warnings,
    ...(esrsFacts.length > 0 ? { esrsFacts } : {})
  }
}

function normaliseVolume(value: number | null | undefined): number {
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
