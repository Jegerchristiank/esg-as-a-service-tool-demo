/**
 * Beregning for modul S1 – arbejdsstyrke og headcount.
 */
import type {
  ModuleEsrsFact,
  ModuleEsrsTable,
  ModuleInput,
  ModuleMetric,
  ModuleResult,
  ModuleTable,
  S1Input
} from '../../types'
import { factors } from '../factors'

const { s1 } = factors

type NormalisedRow = {
  index: number
  segment: string
  headcount: number
  femalePercent: number | null
  labourRightsCoverage: number | null
}

type EmploymentContractInputRow = NonNullable<NonNullable<S1Input['employmentContractBreakdown']>[number]>
type EmploymentContractType = EmploymentContractInputRow['contractType']

type NormalisedEmploymentContractRow = {
  index: number
  contractType: EmploymentContractType
  headcount: number
  fte: number
  femalePercent: number | null
}

type EmploymentStatusInputRow = NonNullable<NonNullable<S1Input['employmentStatusBreakdown']>[number]>
type EmploymentStatusType = EmploymentStatusInputRow['status']

type NormalisedEmploymentStatusRow = {
  index: number
  status: EmploymentStatusType
  headcount: number
  fte: number
}

const employmentContractLabels: Record<EmploymentContractType, string> = {
  permanentEmployees: 'Fastansatte',
  temporaryEmployees: 'Tidsbegrænsede ansatte',
  nonEmployeeWorkers: 'Andre arbejdstagere (ikke-ansatte)',
  apprentices: 'Lærlinge/trainees',
  other: 'Øvrige'
}

const employmentStatusLabels: Record<EmploymentStatusType, string> = {
  fullTime: 'Fuldtid',
  partTime: 'Deltid',
  seasonal: 'Sæsonansatte',
  other: 'Øvrige'
}

export function runS1(input: ModuleInput): ModuleResult {
  const raw = (input.S1 ?? null) as S1Input | null
  const breakdown = normaliseBreakdown(raw?.headcountBreakdown)
  const employmentContracts = normaliseEmploymentContracts(raw?.employmentContractBreakdown)
  const employmentStatuses = normaliseEmploymentStatuses(raw?.employmentStatusBreakdown)
  const trace: string[] = []
  const warnings: string[] = []
  const assumptions = [
    'Scoren vægter total headcount (35 %), segmentfordeling (35 %), datadækning (20 %) og faglig repræsentation (10 %).',
    'Datadækning og arbejdsrettigheder vurderes proportionelt ud fra angivne procenttal (0-100%).'
  ]

  const totalHeadcount = resolveNumber(raw?.totalHeadcount)
  const totalFte = resolveNumber(raw?.totalFte)
  const coveragePercent = clampPercent(raw?.dataCoveragePercent)
  const fteCoveragePercent = clampPercent(raw?.fteCoveragePercent)
  const averageWeeklyHours = clampHours(raw?.averageWeeklyHours)
  const hasCollectiveBargainingAgreements =
    raw?.hasCollectiveBargainingAgreements == null ? null : Boolean(raw.hasCollectiveBargainingAgreements)
  const genderPayGapPercent = clampPercentRange(raw?.genderPayGapPercent, -100, 100)
  const genderPayGapPercentManagement = clampPercentRange(raw?.genderPayGapPercentManagement, -100, 100)
  const genderPayGapPercentOperations = clampPercentRange(raw?.genderPayGapPercentOperations, -100, 100)
  const absenteeismRatePercent = clampPercent(raw?.absenteeismRatePercent)
  const lostTimeInjuryFrequencyRate = clampNonNegative(raw?.lostTimeInjuryFrequencyRate, 3)
  const workRelatedAccidentsCount = clampNonNegative(raw?.workRelatedAccidentsCount, 0)
  const workRelatedFatalitiesCount = clampNonNegative(raw?.workRelatedFatalitiesCount, 0)
  const averageTrainingHoursPerEmployee = clampNonNegative(raw?.averageTrainingHoursPerEmployee, 1)
  const trainingCoveragePercent = clampPercent(raw?.trainingCoveragePercent)
  const socialProtectionCoveragePercent = clampPercent(raw?.socialProtectionCoveragePercent)
  const healthCareCoveragePercent = clampPercent(raw?.healthCareCoveragePercent)
  const pensionPlanCoveragePercent = clampPercent(raw?.pensionPlanCoveragePercent)

  if (totalHeadcount == null || totalHeadcount <= 0) {
    warnings.push('Total headcount mangler. Udfyld samlet medarbejdertal for at forbedre scoringen.')
  } else {
    trace.push(`totalHeadcount=${totalHeadcount}`)
  }

  if (totalFte == null || totalFte <= 0) {
    warnings.push('Total FTE mangler. Angiv fuldtidsekvivalenter for at opfylde ESRS S1-6.')
  } else {
    trace.push(`totalFte=${totalFte}`)
  }

  if (coveragePercent == null) {
    warnings.push('Datadækning i procent er ikke angivet. Feltet bruges til at validere CSRD-kravet om fuld arbejdsstyrkedækning.')
  } else {
    trace.push(`dataCoveragePercent=${coveragePercent}`)
    if (coveragePercent < s1.coverageWarningThresholdPercent) {
      warnings.push(`Datadækningen er kun ${coveragePercent}% – CSRD kræver dokumenteret dækning tæt på 100%.`)
    }
  }

  if (fteCoveragePercent == null) {
    warnings.push('Datadækning for FTE er ikke angivet. Feltet dokumenterer ESRS S1-6 krav om fuldt overblik.')
  } else {
    trace.push(`fteCoveragePercent=${fteCoveragePercent}`)
    if (fteCoveragePercent < s1.fteCoverageWarningThresholdPercent) {
      warnings.push(`FTE-dækningen er kun ${fteCoveragePercent}% – udvid kilderne for at opfylde ESRS S1-6.`)
    }
  }

  if (breakdown.length === 0) {
    warnings.push('Ingen segmentfordeling registreret. Tilføj segmenter (fx lande, funktioner) for at dokumentere headcount.')
    trace.push('segments=0')
  } else {
    trace.push(`segments=${breakdown.length}`)
  }

  if (employmentContracts.length === 0) {
    warnings.push('Ingen ansættelsesformer registreret. Fordel medarbejdere på faste, tidsbegrænsede mv. for ESRS S1-6.')
    trace.push('employmentContracts=0')
  } else {
    trace.push(`employmentContracts=${employmentContracts.length}`)
  }

  if (employmentStatuses.length === 0) {
    warnings.push('Ingen opdeling på fuldtid/deltid registreret. Tilføj beskæftigelsesstatusser for ESRS S1-7.')
    trace.push('employmentStatuses=0')
  } else {
    trace.push(`employmentStatuses=${employmentStatuses.length}`)
  }

  const labourRightsCoverage = computeAverage(
    breakdown.map((row) => (row.labourRightsCoverage == null ? null : clampPercent(row.labourRightsCoverage)))
  )

  const averageFemalePercent = computeAverage(
    breakdown.map((row) => (row.femalePercent == null ? null : clampPercent(row.femalePercent)))
  )

  const totalSegmentHeadcount = breakdown.reduce((sum, row) => sum + row.headcount, 0)
  const totalFemaleHeadcount = breakdown.reduce((sum, row) => {
    if (row.femalePercent == null) {
      return sum
    }
    return sum + Number(((row.femalePercent / 100) * row.headcount).toFixed(1))
  }, 0)
  const totalContractHeadcount = employmentContracts.reduce((sum, row) => sum + row.headcount, 0)
  const totalContractFte = employmentContracts.reduce((sum, row) => sum + row.fte, 0)
  const totalStatusHeadcount = employmentStatuses.reduce((sum, row) => sum + row.headcount, 0)
  const totalStatusFte = employmentStatuses.reduce((sum, row) => sum + row.fte, 0)

  if (labourRightsCoverage != null) {
    trace.push(`avgLabourRightsCoverage=${labourRightsCoverage}`)
    if (labourRightsCoverage < s1.labourRightsWarningThresholdPercent) {
      warnings.push(
        `Faglig repræsentation/dækningsgrad er kun ${labourRightsCoverage}% – vurder behov for kollektive aftaler og arbejdsmiljøudvalg.`
      )
    }
  } else {
    warnings.push('Dækning af kollektive aftaler eller medarbejderrepræsentation er ikke angivet.')
  }

  if (hasCollectiveBargainingAgreements === null) {
    warnings.push('Marker om medarbejderne er dækket af kollektive overenskomster for at understøtte ESRS S1-7.')
  } else {
    trace.push(`collectiveAgreements=${hasCollectiveBargainingAgreements ? 'yes' : 'no'}`)
    if (!hasCollectiveBargainingAgreements) {
      warnings.push('Der er angivet at ingen kollektive overenskomster dækker medarbejderne – forvent opfølgning i handlingsplaner.')
    }
  }

  if (
    totalHeadcount != null &&
    totalContractHeadcount > 0 &&
    Math.abs(totalHeadcount - totalContractHeadcount) > Math.max(1, totalHeadcount * 0.02)
  ) {
    warnings.push(
      `Ansættelsesformernes headcount (${totalContractHeadcount}) stemmer ikke overens med total headcount (${totalHeadcount}). Kontrollér opgørelsen.`
    )
  }

  if (totalFte != null && totalContractFte > 0 && Math.abs(totalFte - totalContractFte) > 0.5) {
    warnings.push(
      `Ansættelsesformernes FTE (${totalContractFte.toFixed(2)}) stemmer ikke overens med total FTE (${totalFte}). Juster fordeling eller total.`
    )
  }

  if (totalHeadcount != null && totalStatusHeadcount > 0 && Math.abs(totalHeadcount - totalStatusHeadcount) > Math.max(1, totalHeadcount * 0.02)) {
    warnings.push(
      `Statusfordelingens headcount (${totalStatusHeadcount}) matcher ikke total headcount (${totalHeadcount}).`
    )
  }

  if (totalFte != null && totalStatusFte > 0 && Math.abs(totalFte - totalStatusFte) > 0.5) {
    warnings.push(
      `Statusfordelingens FTE (${totalStatusFte.toFixed(2)}) matcher ikke total FTE (${totalFte}).`
    )
  }

  breakdown.forEach((row) => {
    if (row.femalePercent != null && (row.femalePercent < 20 || row.femalePercent > 80)) {
      warnings.push(
        `Segmentet "${row.segment}" har en kønsfordeling på ${row.femalePercent}% kvinder – markér indsats i S2 for at adressere ubalancer.`
      )
    }
    trace.push(
      `segment[${row.index}]=${encodeTrace(row.segment)}|headcount=${row.headcount}|female=${
        row.femalePercent ?? 'null'
      }|labour=${row.labourRightsCoverage ?? 'null'}`
    )
  })

  employmentContracts.forEach((row) => {
    if (row.femalePercent != null && (row.femalePercent < 20 || row.femalePercent > 80)) {
      warnings.push(
        `${employmentContractLabels[row.contractType]} har en kønsfordeling på ${row.femalePercent}% kvinder – vurder ligeløn og rekruttering.`
      )
    }
    trace.push(
      `employmentContract[${row.index}]=${row.contractType}|headcount=${row.headcount}|fte=${row.fte}|female=${row.femalePercent ?? 'null'}`
    )
  })

  employmentStatuses.forEach((row) => {
    trace.push(`employmentStatus[${row.index}]=${row.status}|headcount=${row.headcount}|fte=${row.fte}`)
  })

  if (genderPayGapPercent == null) {
    warnings.push('Løngab (samlet) er ikke angivet. ESRS S1 kræver kønsopdelt aflønning.')
  } else {
    trace.push(`genderPayGapPercent=${genderPayGapPercent}`)
    if (Math.abs(genderPayGapPercent) > s1.genderPayGapWarningPercent) {
      warnings.push(`Samlet løngab er ${genderPayGapPercent}% – adresser ligelønspolitikker og handlingsplaner.`)
    }
  }

  if (genderPayGapPercentManagement == null) {
    warnings.push('Løngab for ledelse er ikke angivet.')
  } else {
    trace.push(`genderPayGapPercentManagement=${genderPayGapPercentManagement}`)
    if (Math.abs(genderPayGapPercentManagement) > s1.genderPayGapWarningPercent) {
      warnings.push(`Løngab i ledelseslag er ${genderPayGapPercentManagement}% – vurder målrettede initiativer.`)
    }
  }

  if (genderPayGapPercentOperations == null) {
    warnings.push('Løngab for øvrige medarbejdere er ikke angivet.')
  } else {
    trace.push(`genderPayGapPercentOperations=${genderPayGapPercentOperations}`)
    if (Math.abs(genderPayGapPercentOperations) > s1.genderPayGapWarningPercent) {
      warnings.push(`Løngab blandt øvrige medarbejdere er ${genderPayGapPercentOperations}% – dokumentér korrigerende handlinger.`)
    }
  }

  if (absenteeismRatePercent == null) {
    warnings.push('Fraværsrate mangler. Oplys procent for at dække ESRS S1-8.')
  } else {
    trace.push(`absenteeismRatePercent=${absenteeismRatePercent}`)
    if (absenteeismRatePercent > s1.absenteeismWarningThresholdPercent) {
      warnings.push(`Fraværsraten er ${absenteeismRatePercent}% – undersøg årsager og forbedringstiltag.`)
    }
  }

  if (lostTimeInjuryFrequencyRate == null) {
    warnings.push('LTIFR er ikke angivet. Arbejdsmiljødata er påkrævet under ESRS S1-8.')
  } else {
    trace.push(`lostTimeInjuryFrequencyRate=${lostTimeInjuryFrequencyRate}`)
    if (lostTimeInjuryFrequencyRate > s1.lostTimeInjuryWarningThreshold) {
      warnings.push(`LTIFR er ${lostTimeInjuryFrequencyRate} – styrk sikkerhedstræning og rapportering.`)
    }
  }

  if (workRelatedAccidentsCount != null) {
    trace.push(`workRelatedAccidents=${workRelatedAccidentsCount}`)
    if (workRelatedAccidentsCount > 0) {
      warnings.push(`Registrerede arbejdsulykker: ${workRelatedAccidentsCount}. Dokumentér forebyggelse.`)
    }
  } else {
    warnings.push('Angiv antal arbejdsrelaterede ulykker for at opfylde ESRS S1-8.')
  }

  if (workRelatedFatalitiesCount != null) {
    trace.push(`workRelatedFatalities=${workRelatedFatalitiesCount}`)
    if (workRelatedFatalitiesCount > 0) {
      warnings.push('Der er registreret arbejdsrelaterede dødsfald – redegør for remediering og støtte til pårørende.')
    }
  } else {
    warnings.push('Angiv antal arbejdsrelaterede dødsfald (0 hvis ingen).')
  }

  if (averageTrainingHoursPerEmployee == null) {
    warnings.push('Gennemsnitlige træningstimer pr. medarbejder er ikke angivet. ESRS S1 kræver rapportering af kompetenceudvikling.')
  } else {
    trace.push(`trainingHours=${averageTrainingHoursPerEmployee}`)
    if (averageTrainingHoursPerEmployee < s1.trainingHoursMinimum) {
      warnings.push(
        `Træningstimer pr. medarbejder er ${averageTrainingHoursPerEmployee} – vurder behov for flere efteruddannelsesinitiativer.`
      )
    }
  }

  if (trainingCoveragePercent == null) {
    warnings.push('Andel af medarbejdere med træning er ikke angivet.')
  } else {
    trace.push(`trainingCoveragePercent=${trainingCoveragePercent}`)
    if (trainingCoveragePercent < s1.trainingCoverageWarningThresholdPercent) {
      warnings.push(`Kun ${trainingCoveragePercent}% af medarbejderne modtog træning – udvid programmerne.`)
    }
  }

  if (socialProtectionCoveragePercent == null) {
    warnings.push('Dækning af social beskyttelse er ikke angivet.')
  } else {
    trace.push(`socialProtectionCoveragePercent=${socialProtectionCoveragePercent}`)
    if (socialProtectionCoveragePercent < s1.socialProtectionWarningThresholdPercent) {
      warnings.push(`Social beskyttelse dækker kun ${socialProtectionCoveragePercent}% – vurder forbedringer af ydelserne.`)
    }
  }

  if (healthCareCoveragePercent == null) {
    warnings.push('Dækning af sundhedsordninger er ikke angivet.')
  } else {
    trace.push(`healthCareCoveragePercent=${healthCareCoveragePercent}`)
    if (healthCareCoveragePercent < s1.benefitCoverageWarningThresholdPercent) {
      warnings.push(`Sundhedsordninger dækker ${healthCareCoveragePercent}% – vurder forbedringer.`)
    }
  }

  if (pensionPlanCoveragePercent == null) {
    warnings.push('Dækning af pensionsordninger er ikke angivet.')
  } else {
    trace.push(`pensionPlanCoveragePercent=${pensionPlanCoveragePercent}`)
    if (pensionPlanCoveragePercent < s1.benefitCoverageWarningThresholdPercent) {
      warnings.push(`Pensionsordninger dækker ${pensionPlanCoveragePercent}% – dokumentér plan for udvidelse.`)
    }
  }

  const totalScore =
    (totalHeadcount != null && totalHeadcount > 0 ? s1.totalHeadcountWeight : 0) +
    s1.breakdownWeight * computeBreakdownScore(breakdown.length) +
    s1.coverageWeight * normalisePercent(coveragePercent) +
    s1.labourRightsWeight * normalisePercent(labourRightsCoverage)

  const value = Number((Math.max(0, Math.min(totalScore, 1)) * 100).toFixed(s1.resultPrecision))

  const esrsFacts: ModuleEsrsFact[] = []
  const pushNumericFact = (key: string, value: number | null | undefined, unitId: string, decimals: number) => {
    if (value == null || Number.isNaN(value) || !Number.isFinite(Number(value))) {
      return
    }
    esrsFacts.push({ conceptKey: key, value: Number(value), unitId, decimals })
  }
  const pushBooleanFact = (key: string, value: boolean | null | undefined) => {
    if (value == null) {
      return
    }
    esrsFacts.push({ conceptKey: key, value })
  }

  pushNumericFact('S1TotalHeadcount', totalHeadcount, 'pure', 0)
  pushNumericFact('S1TotalFte', totalFte, 'pure', 1)
  pushNumericFact('S1DataCoveragePercent', coveragePercent, 'percent', 1)
  pushNumericFact('S1FteCoveragePercent', fteCoveragePercent, 'percent', 1)
  pushNumericFact('S1CollectiveAgreementCoveragePercent', labourRightsCoverage, 'percent', 1)
  pushNumericFact('S1AverageFemalePercent', averageFemalePercent, 'percent', 1)
  pushBooleanFact('S1HasCollectiveAgreements', hasCollectiveBargainingAgreements)
  pushNumericFact('S1GenderPayGapPercentTotal', genderPayGapPercent, 'percent', 1)
  pushNumericFact('S1GenderPayGapPercentManagement', genderPayGapPercentManagement, 'percent', 1)
  pushNumericFact('S1GenderPayGapPercentOperations', genderPayGapPercentOperations, 'percent', 1)
  pushNumericFact('S1AbsenteeismRatePercent', absenteeismRatePercent, 'percent', 1)
  pushNumericFact('S1LostTimeInjuryFrequencyRate', lostTimeInjuryFrequencyRate, 'pure', 3)
  pushNumericFact('S1WorkRelatedAccidentsCount', workRelatedAccidentsCount, 'pure', 0)
  pushNumericFact('S1WorkRelatedFatalitiesCount', workRelatedFatalitiesCount, 'pure', 0)
  pushNumericFact('S1AverageTrainingHoursPerEmployee', averageTrainingHoursPerEmployee, 'hour', 1)
  pushNumericFact('S1TrainingCoveragePercent', trainingCoveragePercent, 'percent', 1)
  pushNumericFact('S1SocialProtectionCoveragePercent', socialProtectionCoveragePercent, 'percent', 1)
  pushNumericFact('S1HealthCareCoveragePercent', healthCareCoveragePercent, 'percent', 1)
  pushNumericFact('S1PensionPlanCoveragePercent', pensionPlanCoveragePercent, 'percent', 1)

  if (averageWeeklyHours != null) {
    pushNumericFact('S1AverageWeeklyHours', averageWeeklyHours, 'hour', 1)
  }

  if (breakdown.length > 0 && totalSegmentHeadcount > 0) {
    pushNumericFact('S1SegmentHeadcountTotal', totalSegmentHeadcount, 'pure', 0)
    if (totalFemaleHeadcount > 0) {
      pushNumericFact('S1SegmentFemaleHeadcountEstimate', Number(totalFemaleHeadcount.toFixed(1)), 'pure', 1)
    }
  }

  if (employmentContracts.length > 0 && totalContractHeadcount > 0) {
    pushNumericFact('S1EmploymentContractHeadcountTotal', totalContractHeadcount, 'pure', 0)
    pushNumericFact('S1EmploymentContractFteTotal', Number(totalContractFte.toFixed(2)), 'pure', 2)
  }

  if (employmentStatuses.length > 0 && totalStatusHeadcount > 0) {
    pushNumericFact('S1EmploymentStatusHeadcountTotal', totalStatusHeadcount, 'pure', 0)
    pushNumericFact('S1EmploymentStatusFteTotal', Number(totalStatusFte.toFixed(2)), 'pure', 2)
  }

  const esrsTablesInternal: ModuleEsrsTable[] = []
  if (breakdown.length > 0) {
    esrsTablesInternal.push({
      conceptKey: 'S1HeadcountBreakdownTable',
      rows: breakdown.map((row) => ({
        segment: row.segment,
        headcount: row.headcount,
        femalePercent: row.femalePercent,
        collectiveAgreementCoveragePercent: row.labourRightsCoverage
      }))
    })
  }
  if (employmentContracts.length > 0) {
    esrsTablesInternal.push({
      conceptKey: 'S1EmploymentContractBreakdownTable',
      rows: employmentContracts.map((row) => ({
        contractType: employmentContractLabels[row.contractType],
        headcount: row.headcount,
        fte: Number(row.fte.toFixed(2)),
        femalePercent: row.femalePercent
      }))
    })
  }
  if (employmentStatuses.length > 0) {
    esrsTablesInternal.push({
      conceptKey: 'S1EmploymentStatusBreakdownTable',
      rows: employmentStatuses.map((row) => ({
        status: employmentStatusLabels[row.status],
        headcount: row.headcount,
        fte: Number(row.fte.toFixed(2))
      }))
    })
  }
  const esrsTables = esrsTablesInternal.length > 0 ? esrsTablesInternal : undefined

  const metrics: ModuleMetric[] = []
  if (totalHeadcount != null) {
    metrics.push({ label: 'Total headcount', value: totalHeadcount, unit: 'personer' })
  }
  if (totalFte != null) {
    metrics.push({ label: 'Total FTE', value: totalFte, unit: 'FTE' })
  }
  if (totalSegmentHeadcount > 0 && (totalHeadcount == null || Math.abs(totalHeadcount - totalSegmentHeadcount) > 1)) {
    metrics.push({
      label: 'Headcount i segmenter',
      value: totalSegmentHeadcount,
      unit: 'personer',
      context: 'Sum af registrerede segmenter'
    })
  }
  if (totalContractHeadcount > 0) {
    metrics.push({
      label: 'Headcount fordelt på ansættelsesformer',
      value: totalContractHeadcount,
      unit: 'personer'
    })
  }
  if (totalContractFte > 0) {
    metrics.push({
      label: 'FTE fordelt på ansættelsesformer',
      value: Number(totalContractFte.toFixed(2)),
      unit: 'FTE'
    })
  }
  if (averageFemalePercent != null) {
    metrics.push({ label: 'Gennemsnitlig andel kvinder', value: averageFemalePercent, unit: '%' })
  }
  if (totalFemaleHeadcount > 0) {
    metrics.push({
      label: 'Estimeret antal kvinder',
      value: Number(totalFemaleHeadcount.toFixed(0)),
      unit: 'personer',
      context: 'Beregnet ud fra segmentfordeling'
    })
  }
  if (labourRightsCoverage != null) {
    metrics.push({ label: 'Dækning af kollektive aftaler', value: labourRightsCoverage, unit: '%' })
  }
  if (coveragePercent != null) {
    metrics.push({ label: 'Datadækning', value: coveragePercent, unit: '%' })
  }
  if (fteCoveragePercent != null) {
    metrics.push({ label: 'FTE-dækning', value: fteCoveragePercent, unit: '%' })
  }
  if (genderPayGapPercent != null) {
    metrics.push({ label: 'Løngab (samlet)', value: genderPayGapPercent, unit: '%' })
  }
  if (genderPayGapPercentManagement != null) {
    metrics.push({ label: 'Løngab (ledelse)', value: genderPayGapPercentManagement, unit: '%' })
  }
  if (genderPayGapPercentOperations != null) {
    metrics.push({ label: 'Løngab (øvrige)', value: genderPayGapPercentOperations, unit: '%' })
  }
  if (absenteeismRatePercent != null) {
    metrics.push({ label: 'Fraværsrate', value: absenteeismRatePercent, unit: '%' })
  }
  if (lostTimeInjuryFrequencyRate != null) {
    metrics.push({ label: 'LTIFR', value: lostTimeInjuryFrequencyRate, unit: 'ulykker/1M timer' })
  }
  if (workRelatedAccidentsCount != null) {
    metrics.push({ label: 'Arbejdsulykker', value: workRelatedAccidentsCount, unit: 'hændelser' })
  }
  if (workRelatedFatalitiesCount != null) {
    metrics.push({ label: 'Arbejdsrelaterede dødsfald', value: workRelatedFatalitiesCount, unit: 'hændelser' })
  }
  if (averageTrainingHoursPerEmployee != null) {
    metrics.push({ label: 'Træningstimer pr. medarbejder', value: averageTrainingHoursPerEmployee, unit: 'timer' })
  }
  if (trainingCoveragePercent != null) {
    metrics.push({ label: 'Træningsdækning', value: trainingCoveragePercent, unit: '%' })
  }
  if (socialProtectionCoveragePercent != null) {
    metrics.push({ label: 'Social beskyttelse', value: socialProtectionCoveragePercent, unit: '%' })
  }
  if (healthCareCoveragePercent != null) {
    metrics.push({ label: 'Sundhedsordninger', value: healthCareCoveragePercent, unit: '%' })
  }
  if (pensionPlanCoveragePercent != null) {
    metrics.push({ label: 'Pensionsordninger', value: pensionPlanCoveragePercent, unit: '%' })
  }
  if (averageWeeklyHours != null) {
    metrics.push({ label: 'Gns. ugentlige arbejdstimer', value: averageWeeklyHours, unit: 'timer' })
  }

  const tables: ModuleTable[] = []
  if (breakdown.length > 0) {
    tables.push({
      id: 's1-headcount-breakdown',
      title: 'Headcount pr. segment',
      summary: 'Segmenteret headcount med kønsfordeling og faglig repræsentation.',
      columns: [
        { key: 'segment', label: 'Segment' },
        { key: 'headcount', label: 'Headcount', align: 'end', format: 'number' },
        { key: 'femalePercent', label: 'Kvinder (%)', align: 'end', format: 'percent' },
        {
          key: 'collectiveAgreementCoveragePercent',
          label: 'Kollektive aftaler (%)',
          align: 'end',
          format: 'percent'
        }
      ],
      rows: breakdown.map((row) => ({
        segment: row.segment,
        headcount: row.headcount,
        femalePercent: row.femalePercent,
        collectiveAgreementCoveragePercent: row.labourRightsCoverage
      }))
    })
  }
  if (employmentContracts.length > 0) {
    tables.push({
      id: 's1-employment-contracts',
      title: 'Ansættelsesformer',
      summary: 'Fordeling af headcount og FTE på faste, tidsbegrænsede og øvrige kategorier.',
      columns: [
        { key: 'contractType', label: 'Ansættelsesform' },
        { key: 'headcount', label: 'Headcount', align: 'end', format: 'number' },
        { key: 'fte', label: 'FTE', align: 'end', format: 'number' },
        { key: 'femalePercent', label: 'Kvinder (%)', align: 'end', format: 'percent' }
      ],
      rows: employmentContracts.map((row) => ({
        contractType: employmentContractLabels[row.contractType],
        headcount: row.headcount,
        fte: Number(row.fte.toFixed(2)),
        femalePercent: row.femalePercent
      }))
    })
  }
  if (employmentStatuses.length > 0) {
    tables.push({
      id: 's1-employment-status',
      title: 'Beskæftigelsesstatus',
      summary: 'Fuldtid/deltid og øvrige statusser med headcount og FTE.',
      columns: [
        { key: 'status', label: 'Status' },
        { key: 'headcount', label: 'Headcount', align: 'end', format: 'number' },
        { key: 'fte', label: 'FTE', align: 'end', format: 'number' }
      ],
      rows: employmentStatuses.map((row) => ({
        status: employmentStatusLabels[row.status],
        headcount: row.headcount,
        fte: Number(row.fte.toFixed(2))
      }))
    })
  }

  const narratives =
    raw?.workforceNarrative && raw.workforceNarrative.trim().length > 0
      ? [
          {
            label: 'Arbejdsstyrkens udvikling',
            content: raw.workforceNarrative.trim()
          },
        ]
      : undefined

  return {
    value,
    unit: s1.unit,
    assumptions,
    trace,
    warnings,
    ...(metrics.length > 0 ? { metrics } : {}),
    ...(narratives ? { narratives } : {}),
    ...(tables.length > 0 ? { tables } : {}),
    ...(esrsFacts.length > 0 ? { esrsFacts } : {}),
    ...(esrsTables ? { esrsTables } : {})
  }
}

function normaliseBreakdown(rows: S1Input['headcountBreakdown']): NormalisedRow[] {
  if (!Array.isArray(rows)) {
    return []
  }

  return rows
    .map((row, index) => {
      const segment = (row?.segment ?? '').trim()
      const headcount = resolveNumber(row?.headcount) ?? 0
      const femalePercent = row?.femalePercent == null ? null : clampPercent(row.femalePercent)
      const labourRightsCoverage =
        row?.collectiveAgreementCoveragePercent == null
          ? null
          : clampPercent(row.collectiveAgreementCoveragePercent)

      if (segment.length === 0 || headcount <= 0) {
        return null
      }

      return {
        index,
        segment,
        headcount,
        femalePercent,
        labourRightsCoverage
      }
    })
    .filter((row): row is NormalisedRow => row != null)
}

function normaliseEmploymentContracts(
  rows: S1Input['employmentContractBreakdown']
): NormalisedEmploymentContractRow[] {
  if (!Array.isArray(rows)) {
    return []
  }

  return rows
    .map((row, index) => {
      if (!row || !row.contractType) {
        return null
      }
      const headcountRaw = resolveNumber(row.headcount)
      const fteRaw = resolveNumber(row.fte)
      const femalePercent = row.femalePercent == null ? null : clampPercent(row.femalePercent)
      const headcount = headcountRaw == null ? 0 : Number(Math.max(0, headcountRaw).toFixed(1))
      const fte = fteRaw == null ? 0 : Number(Math.max(0, fteRaw).toFixed(2))
      if (headcount <= 0 && fte <= 0) {
        return null
      }
      return {
        index,
        contractType: row.contractType,
        headcount,
        fte,
        femalePercent
      }
    })
    .filter((row): row is NormalisedEmploymentContractRow => row != null)
}

function normaliseEmploymentStatuses(
  rows: S1Input['employmentStatusBreakdown']
): NormalisedEmploymentStatusRow[] {
  if (!Array.isArray(rows)) {
    return []
  }

  return rows
    .map((row, index) => {
      if (!row || !row.status) {
        return null
      }
      const headcountRaw = resolveNumber(row.headcount)
      const fteRaw = resolveNumber(row.fte)
      const headcount = headcountRaw == null ? 0 : Number(Math.max(0, headcountRaw).toFixed(1))
      const fte = fteRaw == null ? 0 : Number(Math.max(0, fteRaw).toFixed(2))
      if (headcount <= 0 && fte <= 0) {
        return null
      }
      return {
        index,
        status: row.status,
        headcount,
        fte
      }
    })
    .filter((row): row is NormalisedEmploymentStatusRow => row != null)
}

function computeBreakdownScore(segmentCount: number): number {
  if (segmentCount <= 0) {
    return 0
  }
  const ratio = segmentCount / s1.minSegmentsForFullScore
  return Math.min(1, ratio)
}

function computeAverage(values: Array<number | null>): number | null {
  const valid = values.filter((value): value is number => value != null && Number.isFinite(value))
  if (valid.length === 0) {
    return null
  }
  const sum = valid.reduce((acc, value) => acc + value, 0)
  return Number((sum / valid.length).toFixed(1))
}

function clampPercent(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) {
    return null
  }
  return Math.max(0, Math.min(100, Number(value)))
}

function clampPercentRange(value: number | null | undefined, min: number, max: number): number | null {
  if (value == null || Number.isNaN(value)) {
    return null
  }
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return null
  }
  return Math.max(min, Math.min(max, numeric))
}

function clampHours(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) {
    return null
  }
  const normalised = Math.max(0, Math.min(80, Number(value)))
  return Number(normalised.toFixed(1))
}

function clampNonNegative(value: number | null | undefined, decimals = 0): number | null {
  if (value == null || Number.isNaN(value)) {
    return null
  }
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return null
  }
  const clamped = Math.max(0, numeric)
  return Number(clamped.toFixed(Math.max(0, decimals)))
}

function normalisePercent(value: number | null): number {
  if (value == null) {
    return 0
  }
  return Math.max(0, Math.min(1, value / 100))
}

function resolveNumber(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) {
    return null
  }
  return Number(value)
}

function encodeTrace(value: string): string {
  return value.replaceAll('|', '/').replaceAll('\n', ' ')
}
