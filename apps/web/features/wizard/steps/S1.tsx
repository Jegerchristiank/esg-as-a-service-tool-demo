/**
 * Wizardtrin for modul S1 – arbejdsstyrke og headcount.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'

import {
  runS1,
  s1EmploymentContractTypeOptions,
  s1EmploymentStatusOptions,
  type ModuleInput,
  type ModuleResult,
  type S1Input
} from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

const EMPTY_S1: S1Input = {
  reportingYear: null,
  totalHeadcount: null,
  totalFte: null,
  dataCoveragePercent: null,
  fteCoveragePercent: null,
  averageWeeklyHours: null,
  headcountBreakdown: [],
  employmentContractBreakdown: [],
  employmentStatusBreakdown: [],
  hasCollectiveBargainingAgreements: null,
  genderPayGapPercent: null,
  genderPayGapPercentManagement: null,
  genderPayGapPercentOperations: null,
  absenteeismRatePercent: null,
  lostTimeInjuryFrequencyRate: null,
  workRelatedAccidentsCount: null,
  workRelatedFatalitiesCount: null,
  averageTrainingHoursPerEmployee: null,
  trainingCoveragePercent: null,
  socialProtectionCoveragePercent: null,
  healthCareCoveragePercent: null,
  pensionPlanCoveragePercent: null,
  workforceNarrative: null
}

type BreakdownRow = NonNullable<S1Input['headcountBreakdown']>[number]

type ContractRow = NonNullable<S1Input['employmentContractBreakdown']>[number]
type StatusRow = NonNullable<S1Input['employmentStatusBreakdown']>[number]

type NumericField =
  | 'totalHeadcount'
  | 'totalFte'
  | 'dataCoveragePercent'
  | 'fteCoveragePercent'
  | 'reportingYear'
  | 'averageWeeklyHours'
  | 'genderPayGapPercent'
  | 'genderPayGapPercentManagement'
  | 'genderPayGapPercentOperations'
  | 'absenteeismRatePercent'
  | 'lostTimeInjuryFrequencyRate'
  | 'workRelatedAccidentsCount'
  | 'workRelatedFatalitiesCount'
  | 'averageTrainingHoursPerEmployee'
  | 'trainingCoveragePercent'
  | 'socialProtectionCoveragePercent'
  | 'healthCareCoveragePercent'
  | 'pensionPlanCoveragePercent'

type RowNumericField = 'headcount' | 'femalePercent' | 'collectiveAgreementCoveragePercent'

type RowTextField = 'segment'

type ContractRowNumericField = 'headcount' | 'fte' | 'femalePercent'
type ContractRowSelectField = 'contractType'

type StatusRowNumericField = 'headcount' | 'fte'
type StatusRowSelectField = 'status'

const MAX_NARRATIVE = 2000

function createEmptyRow(): BreakdownRow {
  return {
    segment: '',
    headcount: null,
    femalePercent: null,
    collectiveAgreementCoveragePercent: null
  }
}

function createEmptyContractRow(): ContractRow {
  return {
    contractType: s1EmploymentContractTypeOptions[0],
    headcount: null,
    fte: null,
    femalePercent: null
  }
}

function createEmptyStatusRow(): StatusRow {
  return {
    status: s1EmploymentStatusOptions[0],
    headcount: null,
    fte: null
  }
}

function parseNumber(value: string): number | null {
  const normalised = value.replace(',', '.').trim()
  if (normalised === '') {
    return null
  }
  const parsed = Number.parseFloat(normalised)
  return Number.isFinite(parsed) ? parsed : null
}

const CONTRACT_LABELS: Record<ContractRow['contractType'], string> = {
  permanentEmployees: 'Fastansatte',
  temporaryEmployees: 'Tidsbegrænsede ansatte',
  nonEmployeeWorkers: 'Andre arbejdstagere (ikke-ansatte)',
  apprentices: 'Lærlinge/trainees',
  other: 'Øvrige'
}

const STATUS_LABELS: Record<StatusRow['status'], string> = {
  fullTime: 'Fuldtid',
  partTime: 'Deltid',
  seasonal: 'Sæsonansatte',
  other: 'Øvrige'
}

export function S1Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.S1 as S1Input | undefined) ?? EMPTY_S1
  const rows = current.headcountBreakdown ?? []
  const contractRows = current.employmentContractBreakdown ?? []
  const statusRows = current.employmentStatusBreakdown ?? []

  const preview = useMemo<ModuleResult>(() => runS1({ S1: current } as ModuleInput), [current])

  const rootErrors = useMemo(() => {
    const errors: Partial<Record<NumericField, string>> = {}
    if (current.dataCoveragePercent != null && (current.dataCoveragePercent < 0 || current.dataCoveragePercent > 100)) {
      errors.dataCoveragePercent = 'Datadækning skal være mellem 0 og 100%.'
    }
    if (current.fteCoveragePercent != null && (current.fteCoveragePercent < 0 || current.fteCoveragePercent > 100)) {
      errors.fteCoveragePercent = 'FTE-dækning skal være mellem 0 og 100%.'
    }
    if (current.reportingYear != null && (current.reportingYear < 1900 || current.reportingYear > 2100)) {
      errors.reportingYear = 'Rapporteringsår skal være mellem 1900 og 2100.'
    }
    if (current.averageWeeklyHours != null && (current.averageWeeklyHours < 0 || current.averageWeeklyHours > 80)) {
      errors.averageWeeklyHours = 'Ugentlige arbejdstimer skal være mellem 0 og 80.'
    }
    if (current.totalHeadcount != null && current.totalHeadcount < 0) {
      errors.totalHeadcount = 'Headcount kan ikke være negativ.'
    }
    if (current.totalFte != null && current.totalFte < 0) {
      errors.totalFte = 'FTE kan ikke være negativ.'
    }
    const validatePercentRange = (value: number | null | undefined, field: NumericField) => {
      if (value == null) {
        return
      }
      if (value < -100 || value > 100) {
        errors[field] = 'Angiv en procent mellem -100 og 100.'
      }
    }
    validatePercentRange(current.genderPayGapPercent, 'genderPayGapPercent')
    validatePercentRange(current.genderPayGapPercentManagement, 'genderPayGapPercentManagement')
    validatePercentRange(current.genderPayGapPercentOperations, 'genderPayGapPercentOperations')
    const validateNonNegative = (value: number | null | undefined, field: NumericField) => {
      if (value != null && value < 0) {
        errors[field] = 'Værdien skal være 0 eller højere.'
      }
    }
    validateNonNegative(current.absenteeismRatePercent, 'absenteeismRatePercent')
    validateNonNegative(current.lostTimeInjuryFrequencyRate, 'lostTimeInjuryFrequencyRate')
    validateNonNegative(current.workRelatedAccidentsCount, 'workRelatedAccidentsCount')
    validateNonNegative(current.workRelatedFatalitiesCount, 'workRelatedFatalitiesCount')
    validateNonNegative(current.averageTrainingHoursPerEmployee, 'averageTrainingHoursPerEmployee')
    const validateZeroToHundred = (value: number | null | undefined, field: NumericField) => {
      if (value != null && (value < 0 || value > 100)) {
        errors[field] = 'Angiv en procent mellem 0 og 100.'
      }
    }
    validateZeroToHundred(current.absenteeismRatePercent, 'absenteeismRatePercent')
    validateZeroToHundred(current.trainingCoveragePercent, 'trainingCoveragePercent')
    validateZeroToHundred(current.socialProtectionCoveragePercent, 'socialProtectionCoveragePercent')
    validateZeroToHundred(current.healthCareCoveragePercent, 'healthCareCoveragePercent')
    validateZeroToHundred(current.pensionPlanCoveragePercent, 'pensionPlanCoveragePercent')
    return errors
  }, [
    current.absenteeismRatePercent,
    current.averageTrainingHoursPerEmployee,
    current.averageWeeklyHours,
    current.dataCoveragePercent,
    current.fteCoveragePercent,
    current.genderPayGapPercent,
    current.genderPayGapPercentManagement,
    current.genderPayGapPercentOperations,
    current.healthCareCoveragePercent,
    current.lostTimeInjuryFrequencyRate,
    current.pensionPlanCoveragePercent,
    current.reportingYear,
    current.socialProtectionCoveragePercent,
    current.totalFte,
    current.totalHeadcount,
    current.trainingCoveragePercent,
    current.workRelatedAccidentsCount,
    current.workRelatedFatalitiesCount
  ])

  const breakdownErrors = useMemo(() => {
    return rows.map((row) => {
      const errors: Partial<Record<RowNumericField, string>> = {}
      if (row.headcount != null && row.headcount < 0) {
        errors.headcount = 'Headcount skal være 0 eller højere.'
      }
      if (row.femalePercent != null && (row.femalePercent < 0 || row.femalePercent > 100)) {
        errors.femalePercent = 'Angiv en procent mellem 0 og 100.'
      }
      if (
        row.collectiveAgreementCoveragePercent != null &&
        (row.collectiveAgreementCoveragePercent < 0 || row.collectiveAgreementCoveragePercent > 100)
      ) {
        errors.collectiveAgreementCoveragePercent = 'Angiv en procent mellem 0 og 100.'
      }
      return errors
    })
  }, [rows])

  const contractErrors = useMemo(() => {
    return contractRows.map((row) => {
      const errors: Partial<Record<ContractRowNumericField, string>> = {}
      if (row.headcount != null && row.headcount < 0) {
        errors.headcount = 'Headcount skal være 0 eller højere.'
      }
      if (row.fte != null && row.fte < 0) {
        errors.fte = 'FTE skal være 0 eller højere.'
      }
      if (row.femalePercent != null && (row.femalePercent < 0 || row.femalePercent > 100)) {
        errors.femalePercent = 'Angiv en procent mellem 0 og 100.'
      }
      return errors
    })
  }, [contractRows])

  const statusErrors = useMemo(() => {
    return statusRows.map((row) => {
      const errors: Partial<Record<StatusRowNumericField, string>> = {}
      if (row.headcount != null && row.headcount < 0) {
        errors.headcount = 'Headcount skal være 0 eller højere.'
      }
      if (row.fte != null && row.fte < 0) {
        errors.fte = 'FTE skal være 0 eller højere.'
      }
      return errors
    })
  }, [statusRows])

  const updateRoot = (partial: Partial<S1Input>) => {
    onChange('S1', { ...current, ...partial })
  }

  const handleNumericChange = (field: NumericField) => (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseNumber(event.target.value)
    updateRoot({ [field]: parsed } as Partial<S1Input>)
  }

  const handleNarrativeChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value.slice(0, MAX_NARRATIVE)
    updateRoot({ workforceNarrative: text.trim() === '' ? null : text })
  }

  const handleAddRow = () => {
    updateRoot({ headcountBreakdown: [...rows, createEmptyRow()] })
  }

  const handleRemoveRow = (index: number) => () => {
    updateRoot({ headcountBreakdown: rows.filter((_, rowIndex) => rowIndex !== index) })
  }

  const handleRowNumericChange = (index: number, field: RowNumericField) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const parsed = parseNumber(event.target.value)
    const nextRows = rows.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            [field]: parsed
          }
        : row
    )
    updateRoot({ headcountBreakdown: nextRows })
  }

  const handleRowTextChange = (index: number, field: RowTextField) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value.slice(0, 120)
    const nextRows = rows.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            [field]: value
          }
        : row
    )
    updateRoot({ headcountBreakdown: nextRows })
  }

  const handleAddContractRow = () => {
    updateRoot({ employmentContractBreakdown: [...contractRows, createEmptyContractRow()] })
  }

  const handleRemoveContractRow = (index: number) => () => {
    updateRoot({ employmentContractBreakdown: contractRows.filter((_, rowIndex) => rowIndex !== index) })
  }

  const handleContractNumericChange = (index: number, field: ContractRowNumericField) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const parsed = parseNumber(event.target.value)
    const nextRows = contractRows.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            [field]: parsed
          }
        : row
    )
    updateRoot({ employmentContractBreakdown: nextRows })
  }

  const handleContractSelectChange = (index: number, field: ContractRowSelectField) => (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value as ContractRow['contractType']
    const nextRows = contractRows.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            [field]: value
          }
        : row
    )
    updateRoot({ employmentContractBreakdown: nextRows })
  }

  const handleAddStatusRow = () => {
    updateRoot({ employmentStatusBreakdown: [...statusRows, createEmptyStatusRow()] })
  }

  const handleRemoveStatusRow = (index: number) => () => {
    updateRoot({ employmentStatusBreakdown: statusRows.filter((_, rowIndex) => rowIndex !== index) })
  }

  const handleStatusNumericChange = (index: number, field: StatusRowNumericField) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const parsed = parseNumber(event.target.value)
    const nextRows = statusRows.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            [field]: parsed
          }
        : row
    )
    updateRoot({ employmentStatusBreakdown: nextRows })
  }

  const handleStatusSelectChange = (index: number, field: StatusRowSelectField) => (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value as StatusRow['status']
    const nextRows = statusRows.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            [field]: value
          }
        : row
    )
    updateRoot({ employmentStatusBreakdown: nextRows })
  }

  const handleBooleanChange = (field: 'hasCollectiveBargainingAgreements') => (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value
    updateRoot({ [field]: value === '' ? null : value === 'true' } as Partial<S1Input>)
  }

  const hasRows = rows.length > 0
  const hasContractRows = contractRows.length > 0
  const hasStatusRows = statusRows.length > 0
  const hasInput =
    hasRows ||
    hasContractRows ||
    hasStatusRows ||
    current.totalHeadcount != null ||
    current.totalFte != null ||
    current.dataCoveragePercent != null ||
    current.fteCoveragePercent != null ||
    current.averageWeeklyHours != null ||
    current.genderPayGapPercent != null ||
    current.genderPayGapPercentManagement != null ||
    current.genderPayGapPercentOperations != null ||
    current.absenteeismRatePercent != null ||
    current.lostTimeInjuryFrequencyRate != null ||
    current.workRelatedAccidentsCount != null ||
    current.workRelatedFatalitiesCount != null ||
    current.averageTrainingHoursPerEmployee != null ||
    current.trainingCoveragePercent != null ||
    current.socialProtectionCoveragePercent != null ||
    current.healthCareCoveragePercent != null ||
    current.pensionPlanCoveragePercent != null ||
    current.hasCollectiveBargainingAgreements != null ||
    (current.workforceNarrative ?? '').length > 0

  return (
    <form className="ds-form ds-stack" noValidate>
      <header className="ds-stack-sm">
        <h2 className="ds-heading-sm">S1 – Arbejdsstyrke &amp; headcount</h2>
        <p className="ds-text-muted">
          Kortlæg arbejdsstyrkens størrelse og segmenter. Indtast kvantitative data og suppler med en kort narrativ kontekst for
          at opfylde ESRS S1.
        </p>
      </header>

      <section className="ds-card ds-stack" aria-label="Overblik over headcount">
        <div className="ds-stack-sm">
          <label className="ds-field">
            <span>Rapporteringsår</span>
            <input
              type="number"
              value={current.reportingYear ?? ''}
              onChange={handleNumericChange('reportingYear')}
              className="ds-input"
              min={1900}
              max={2100}
              placeholder="2024"
              data-invalid={rootErrors.reportingYear ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.reportingYear)}
              aria-describedby={rootErrors.reportingYear ? 's1-reportingYear-error' : undefined}
            />
            {rootErrors.reportingYear && (
              <p id="s1-reportingYear-error" className="ds-error">
                {rootErrors.reportingYear}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Total headcount</span>
            <input
              type="number"
              value={current.totalHeadcount ?? ''}
              onChange={handleNumericChange('totalHeadcount')}
              className="ds-input"
              min={0}
              placeholder="520"
              data-invalid={rootErrors.totalHeadcount ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.totalHeadcount)}
              aria-describedby={rootErrors.totalHeadcount ? 's1-totalHeadcount-error' : undefined}
            />
            {rootErrors.totalHeadcount && (
              <p id="s1-totalHeadcount-error" className="ds-error">
                {rootErrors.totalHeadcount}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Total FTE</span>
            <input
              type="number"
              value={current.totalFte ?? ''}
              onChange={handleNumericChange('totalFte')}
              className="ds-input"
              min={0}
              step="0.1"
              placeholder="480"
              data-invalid={rootErrors.totalFte ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.totalFte)}
              aria-describedby={rootErrors.totalFte ? 's1-totalFte-error' : undefined}
            />
            {rootErrors.totalFte && (
              <p id="s1-totalFte-error" className="ds-error">
                {rootErrors.totalFte}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Datadækning (%)</span>
            <input
              type="number"
              value={current.dataCoveragePercent ?? ''}
              onChange={handleNumericChange('dataCoveragePercent')}
              className="ds-input"
              min={0}
              max={100}
              placeholder="90"
              data-invalid={rootErrors.dataCoveragePercent ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.dataCoveragePercent)}
              aria-describedby={rootErrors.dataCoveragePercent ? 's1-dataCoverage-error' : undefined}
            />
            {rootErrors.dataCoveragePercent && (
              <p id="s1-dataCoverage-error" className="ds-error">
              {rootErrors.dataCoveragePercent}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>FTE-dækning (%)</span>
            <input
              type="number"
              value={current.fteCoveragePercent ?? ''}
              onChange={handleNumericChange('fteCoveragePercent')}
              className="ds-input"
              min={0}
              max={100}
              placeholder="95"
              data-invalid={rootErrors.fteCoveragePercent ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.fteCoveragePercent)}
              aria-describedby={rootErrors.fteCoveragePercent ? 's1-fteCoverage-error' : undefined}
            />
            {rootErrors.fteCoveragePercent && (
              <p id="s1-fteCoverage-error" className="ds-error">
                {rootErrors.fteCoveragePercent}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Gns. ugentlige arbejdstimer (FTE)</span>
            <input
              type="number"
              value={current.averageWeeklyHours ?? ''}
              onChange={handleNumericChange('averageWeeklyHours')}
              className="ds-input"
              min={0}
              max={80}
              step="0.1"
              placeholder="37"
              data-invalid={rootErrors.averageWeeklyHours ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.averageWeeklyHours)}
              aria-describedby={rootErrors.averageWeeklyHours ? 's1-averageWeeklyHours-error' : undefined}
            />
            {rootErrors.averageWeeklyHours && (
              <p id="s1-averageWeeklyHours-error" className="ds-error">
              {rootErrors.averageWeeklyHours}
              </p>
            )}
          </label>
          <label className="ds-field" htmlFor="s1-collective-agreements">
            <span id="s1-collective-agreements-label">Kollektive overenskomster</span>
            <select
              id="s1-collective-agreements"
              aria-labelledby="s1-collective-agreements-label"
              aria-describedby="s1-collective-agreements-help"
              value={
                current.hasCollectiveBargainingAgreements == null
                  ? ''
                  : current.hasCollectiveBargainingAgreements
                  ? 'true'
                  : 'false'
              }
              onChange={handleBooleanChange('hasCollectiveBargainingAgreements')}
              className="ds-input"
            >
              <option value="">Vælg status</option>
              <option value="true">Ja, medarbejderne er dækket</option>
              <option value="false">Nej, ikke dækket</option>
            </select>
            <p id="s1-collective-agreements-help" className="ds-text-subtle">
              Angiv om medarbejderne er omfattet af kollektive aftaler eller tilsvarende ordninger.
            </p>
          </label>
        </div>

        <div className="ds-stack">
          <header className="ds-stack-xs">
            <h3 className="ds-heading-xs">Segmenteret headcount</h3>
            <p className="ds-text-subtle">
              Registrér centrale segmenter (lande, funktioner, sites) inkl. kønsfordeling og dækning af kollektive aftaler.
            </p>
            <button type="button" className="ds-button" onClick={handleAddRow}>
              Tilføj segment
            </button>
          </header>

          {hasRows ? (
            <div className="ds-stack" role="group" aria-label="Headcount segmenter">
              {rows.map((row, index) => (
                <div key={index} className="ds-card ds-stack-sm" data-variant="subtle">
                  <div className="ds-stack-sm ds-stack--responsive">
                    <label className="ds-field">
                      <span>Segmentnavn</span>
                      <input
                        value={row.segment ?? ''}
                        onChange={handleRowTextChange(index, 'segment')}
                        className="ds-input"
                        placeholder="Produktion DK"
                      />
                    </label>
                    <label className="ds-field">
                      <span>Headcount</span>
                      <input
                        type="number"
                        value={row.headcount ?? ''}
                        onChange={handleRowNumericChange(index, 'headcount')}
                        className="ds-input"
                        min={0}
                        placeholder="150"
                        data-invalid={breakdownErrors[index]?.headcount ? 'true' : 'false'}
                        aria-invalid={Boolean(breakdownErrors[index]?.headcount)}
                        aria-describedby={
                          breakdownErrors[index]?.headcount ? `s1-row-${index}-headcount-error` : undefined
                        }
                      />
                      {breakdownErrors[index]?.headcount && (
                        <p id={`s1-row-${index}-headcount-error`} className="ds-error">
                          {breakdownErrors[index]?.headcount}
                        </p>
                      )}
                    </label>
                    <label className="ds-field">
                      <span>Andel kvinder (%)</span>
                      <input
                        type="number"
                        value={row.femalePercent ?? ''}
                        onChange={handleRowNumericChange(index, 'femalePercent')}
                        className="ds-input"
                        min={0}
                        max={100}
                        placeholder="45"
                        data-invalid={breakdownErrors[index]?.femalePercent ? 'true' : 'false'}
                        aria-invalid={Boolean(breakdownErrors[index]?.femalePercent)}
                        aria-describedby={
                          breakdownErrors[index]?.femalePercent ? `s1-row-${index}-female-error` : undefined
                        }
                      />
                      {breakdownErrors[index]?.femalePercent && (
                        <p id={`s1-row-${index}-female-error`} className="ds-error">
                          {breakdownErrors[index]?.femalePercent}
                        </p>
                      )}
                    </label>
                    <label className="ds-field">
                      <span>Dækning af kollektive aftaler (%)</span>
                      <input
                        type="number"
                        value={row.collectiveAgreementCoveragePercent ?? ''}
                        onChange={handleRowNumericChange(index, 'collectiveAgreementCoveragePercent')}
                        className="ds-input"
                        min={0}
                        max={100}
                        placeholder="80"
                        data-invalid={
                          breakdownErrors[index]?.collectiveAgreementCoveragePercent ? 'true' : 'false'
                        }
                        aria-invalid={Boolean(breakdownErrors[index]?.collectiveAgreementCoveragePercent)}
                        aria-describedby={
                          breakdownErrors[index]?.collectiveAgreementCoveragePercent
                            ? `s1-row-${index}-collective-error`
                            : undefined
                        }
                      />
                      {breakdownErrors[index]?.collectiveAgreementCoveragePercent && (
                        <p id={`s1-row-${index}-collective-error`} className="ds-error">
                          {breakdownErrors[index]?.collectiveAgreementCoveragePercent}
                        </p>
                      )}
                    </label>
                  </div>

                  <div className="ds-stack-xs">
                    <button type="button" className="ds-button ds-button--ghost" onClick={handleRemoveRow(index)}>
                      Fjern segment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="ds-text-subtle">Ingen segmenter endnu. Tilføj mindst ét for at dokumentere headcount-fordelingen.</p>
          )}
        </div>

        <div className="ds-stack">
          <header className="ds-stack-xs">
            <h3 className="ds-heading-xs">Ansættelsesformer</h3>
            <p className="ds-text-subtle">
              Registrér headcount og FTE fordelt på faste, tidsbegrænsede og øvrige ansættelser. Feltet dækker ESRS S1-6.
            </p>
            <button type="button" className="ds-button" onClick={handleAddContractRow}>
              Tilføj ansættelsesform
            </button>
          </header>

          {hasContractRows ? (
            <div className="ds-stack" role="group" aria-label="Ansættelsesformer">
              {contractRows.map((row, index) => (
                <div key={index} className="ds-card ds-stack-sm" data-variant="subtle">
                  <div className="ds-stack-sm ds-stack--responsive">
                    <label className="ds-field">
                      <span>Ansættelsesform</span>
                      <select
                        value={row.contractType}
                        onChange={handleContractSelectChange(index, 'contractType')}
                        className="ds-input"
                      >
                        {s1EmploymentContractTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {CONTRACT_LABELS[option]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="ds-field">
                      <span>Headcount</span>
                      <input
                        type="number"
                        value={row.headcount ?? ''}
                        onChange={handleContractNumericChange(index, 'headcount')}
                        className="ds-input"
                        min={0}
                        placeholder="120"
                        data-invalid={contractErrors[index]?.headcount ? 'true' : 'false'}
                        aria-invalid={Boolean(contractErrors[index]?.headcount)}
                        aria-describedby={
                          contractErrors[index]?.headcount ? `s1-contract-${index}-headcount-error` : undefined
                        }
                      />
                      {contractErrors[index]?.headcount && (
                        <p id={`s1-contract-${index}-headcount-error`} className="ds-error">
                          {contractErrors[index]?.headcount}
                        </p>
                      )}
                    </label>
                    <label className="ds-field">
                      <span>FTE</span>
                      <input
                        type="number"
                        value={row.fte ?? ''}
                        onChange={handleContractNumericChange(index, 'fte')}
                        className="ds-input"
                        min={0}
                        step="0.1"
                        placeholder="95"
                        data-invalid={contractErrors[index]?.fte ? 'true' : 'false'}
                        aria-invalid={Boolean(contractErrors[index]?.fte)}
                        aria-describedby={
                          contractErrors[index]?.fte ? `s1-contract-${index}-fte-error` : undefined
                        }
                      />
                      {contractErrors[index]?.fte && (
                        <p id={`s1-contract-${index}-fte-error`} className="ds-error">
                          {contractErrors[index]?.fte}
                        </p>
                      )}
                    </label>
                    <label className="ds-field">
                      <span>Andel kvinder (%)</span>
                      <input
                        type="number"
                        value={row.femalePercent ?? ''}
                        onChange={handleContractNumericChange(index, 'femalePercent')}
                        className="ds-input"
                        min={0}
                        max={100}
                        placeholder="45"
                        data-invalid={contractErrors[index]?.femalePercent ? 'true' : 'false'}
                        aria-invalid={Boolean(contractErrors[index]?.femalePercent)}
                        aria-describedby={
                          contractErrors[index]?.femalePercent ? `s1-contract-${index}-female-error` : undefined
                        }
                      />
                      {contractErrors[index]?.femalePercent && (
                        <p id={`s1-contract-${index}-female-error`} className="ds-error">
                          {contractErrors[index]?.femalePercent}
                        </p>
                      )}
                    </label>
                  </div>
                  <div className="ds-stack-xs">
                    <button type="button" className="ds-button ds-button--ghost" onClick={handleRemoveContractRow(index)}>
                      Fjern ansættelsesform
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="ds-text-subtle">Ingen ansættelsesformer registreret endnu.</p>
          )}
        </div>

        <div className="ds-stack">
          <header className="ds-stack-xs">
            <h3 className="ds-heading-xs">Beskæftigelsesstatus</h3>
            <p className="ds-text-subtle">Fordel medarbejdere på fuldtid, deltid og sæsonansatte for at dække ESRS S1-7.</p>
            <button type="button" className="ds-button" onClick={handleAddStatusRow}>
              Tilføj status
            </button>
          </header>

          {hasStatusRows ? (
            <div className="ds-stack" role="group" aria-label="Beskæftigelsesstatus">
              {statusRows.map((row, index) => (
                <div key={index} className="ds-card ds-stack-sm" data-variant="subtle">
                  <div className="ds-stack-sm ds-stack--responsive">
                    <label className="ds-field">
                      <span>Status</span>
                      <select
                        value={row.status}
                        onChange={handleStatusSelectChange(index, 'status')}
                        className="ds-input"
                      >
                        {s1EmploymentStatusOptions.map((option) => (
                          <option key={option} value={option}>
                            {STATUS_LABELS[option]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="ds-field">
                      <span>Headcount</span>
                      <input
                        type="number"
                        value={row.headcount ?? ''}
                        onChange={handleStatusNumericChange(index, 'headcount')}
                        className="ds-input"
                        min={0}
                        placeholder="260"
                        data-invalid={statusErrors[index]?.headcount ? 'true' : 'false'}
                        aria-invalid={Boolean(statusErrors[index]?.headcount)}
                        aria-describedby={
                          statusErrors[index]?.headcount ? `s1-status-${index}-headcount-error` : undefined
                        }
                      />
                      {statusErrors[index]?.headcount && (
                        <p id={`s1-status-${index}-headcount-error`} className="ds-error">
                          {statusErrors[index]?.headcount}
                        </p>
                      )}
                    </label>
                    <label className="ds-field">
                      <span>FTE</span>
                      <input
                        type="number"
                        value={row.fte ?? ''}
                        onChange={handleStatusNumericChange(index, 'fte')}
                        className="ds-input"
                        min={0}
                        step="0.1"
                        placeholder="210"
                        data-invalid={statusErrors[index]?.fte ? 'true' : 'false'}
                        aria-invalid={Boolean(statusErrors[index]?.fte)}
                        aria-describedby={statusErrors[index]?.fte ? `s1-status-${index}-fte-error` : undefined}
                      />
                      {statusErrors[index]?.fte && (
                        <p id={`s1-status-${index}-fte-error`} className="ds-error">
                          {statusErrors[index]?.fte}
                        </p>
                      )}
                    </label>
                  </div>
                  <div className="ds-stack-xs">
                    <button type="button" className="ds-button ds-button--ghost" onClick={handleRemoveStatusRow(index)}>
                      Fjern status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="ds-text-subtle">Ingen statusfordeling endnu. Tilføj mindst én række.</p>
          )}
        </div>
      </section>

      <section className="ds-card ds-stack">
        <h3 className="ds-heading-xs">Kønsopdelt aflønning</h3>
        <p className="ds-text-subtle">
          Angiv løngabet mellem køn for hele organisationen samt ledelse og øvrige medarbejdere. Negative værdier betyder at kvinder tjener mere end mænd.
        </p>
        <div className="ds-stack-sm ds-stack--responsive">
          <label className="ds-field">
            <span>Løngab (samlet) %</span>
            <input
              type="number"
              value={current.genderPayGapPercent ?? ''}
              onChange={handleNumericChange('genderPayGapPercent')}
              className="ds-input"
              min={-100}
              max={100}
              step="0.1"
              placeholder="5"
              data-invalid={rootErrors.genderPayGapPercent ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.genderPayGapPercent)}
              aria-describedby={rootErrors.genderPayGapPercent ? 's1-genderPayGap-error' : undefined}
            />
            {rootErrors.genderPayGapPercent && (
              <p id="s1-genderPayGap-error" className="ds-error">
                {rootErrors.genderPayGapPercent}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Løngab (ledelse) %</span>
            <input
              type="number"
              value={current.genderPayGapPercentManagement ?? ''}
              onChange={handleNumericChange('genderPayGapPercentManagement')}
              className="ds-input"
              min={-100}
              max={100}
              step="0.1"
              placeholder="12"
              data-invalid={rootErrors.genderPayGapPercentManagement ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.genderPayGapPercentManagement)}
              aria-describedby={
                rootErrors.genderPayGapPercentManagement ? 's1-genderPayGapManagement-error' : undefined
              }
            />
            {rootErrors.genderPayGapPercentManagement && (
              <p id="s1-genderPayGapManagement-error" className="ds-error">
                {rootErrors.genderPayGapPercentManagement}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Løngab (øvrige) %</span>
            <input
              type="number"
              value={current.genderPayGapPercentOperations ?? ''}
              onChange={handleNumericChange('genderPayGapPercentOperations')}
              className="ds-input"
              min={-100}
              max={100}
              step="0.1"
              placeholder="-2"
              data-invalid={rootErrors.genderPayGapPercentOperations ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.genderPayGapPercentOperations)}
              aria-describedby={
                rootErrors.genderPayGapPercentOperations ? 's1-genderPayGapOperations-error' : undefined
              }
            />
            {rootErrors.genderPayGapPercentOperations && (
              <p id="s1-genderPayGapOperations-error" className="ds-error">
                {rootErrors.genderPayGapPercentOperations}
              </p>
            )}
          </label>
        </div>
      </section>

      <section className="ds-card ds-stack">
        <h3 className="ds-heading-xs">Arbejdsmiljø &amp; fravær</h3>
        <p className="ds-text-subtle">
          Dokumentér fravær, ulykkesfrekvens og antal registrerede hændelser for at opfylde ESRS S1-8.
        </p>
        <div className="ds-stack-sm ds-stack--responsive">
          <label className="ds-field">
            <span>Fraværsrate (%)</span>
            <input
              type="number"
              value={current.absenteeismRatePercent ?? ''}
              onChange={handleNumericChange('absenteeismRatePercent')}
              className="ds-input"
              min={0}
              max={100}
              step="0.1"
              placeholder="4.5"
              data-invalid={rootErrors.absenteeismRatePercent ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.absenteeismRatePercent)}
              aria-describedby={rootErrors.absenteeismRatePercent ? 's1-absenteeism-error' : undefined}
            />
            {rootErrors.absenteeismRatePercent && (
              <p id="s1-absenteeism-error" className="ds-error">
                {rootErrors.absenteeismRatePercent}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>LTIFR</span>
            <input
              type="number"
              value={current.lostTimeInjuryFrequencyRate ?? ''}
              onChange={handleNumericChange('lostTimeInjuryFrequencyRate')}
              className="ds-input"
              min={0}
              step="0.001"
              placeholder="1.8"
              data-invalid={rootErrors.lostTimeInjuryFrequencyRate ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.lostTimeInjuryFrequencyRate)}
              aria-describedby={
                rootErrors.lostTimeInjuryFrequencyRate ? 's1-ltifr-error' : undefined
              }
            />
            {rootErrors.lostTimeInjuryFrequencyRate && (
              <p id="s1-ltifr-error" className="ds-error">
                {rootErrors.lostTimeInjuryFrequencyRate}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Arbejdsulykker (antal)</span>
            <input
              type="number"
              value={current.workRelatedAccidentsCount ?? ''}
              onChange={handleNumericChange('workRelatedAccidentsCount')}
              className="ds-input"
              min={0}
              step="1"
              placeholder="3"
              data-invalid={rootErrors.workRelatedAccidentsCount ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.workRelatedAccidentsCount)}
              aria-describedby={
                rootErrors.workRelatedAccidentsCount ? 's1-accidents-error' : undefined
              }
            />
            {rootErrors.workRelatedAccidentsCount && (
              <p id="s1-accidents-error" className="ds-error">
                {rootErrors.workRelatedAccidentsCount}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Arbejdsrelaterede dødsfald (antal)</span>
            <input
              type="number"
              value={current.workRelatedFatalitiesCount ?? ''}
              onChange={handleNumericChange('workRelatedFatalitiesCount')}
              className="ds-input"
              min={0}
              step="1"
              placeholder="0"
              data-invalid={rootErrors.workRelatedFatalitiesCount ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.workRelatedFatalitiesCount)}
              aria-describedby={
                rootErrors.workRelatedFatalitiesCount ? 's1-fatalities-error' : undefined
              }
            />
            {rootErrors.workRelatedFatalitiesCount && (
              <p id="s1-fatalities-error" className="ds-error">
                {rootErrors.workRelatedFatalitiesCount}
              </p>
            )}
          </label>
        </div>
      </section>

      <section className="ds-card ds-stack">
        <h3 className="ds-heading-xs">Træning &amp; sociale ydelser</h3>
        <p className="ds-text-subtle">
          Opgør træningstimer pr. medarbejder og dækning af sociale beskyttelsesordninger, sundhed og pension.
        </p>
        <div className="ds-stack-sm ds-stack--responsive">
          <label className="ds-field">
            <span>Træningstimer pr. medarbejder</span>
            <input
              type="number"
              value={current.averageTrainingHoursPerEmployee ?? ''}
              onChange={handleNumericChange('averageTrainingHoursPerEmployee')}
              className="ds-input"
              min={0}
              step="0.1"
              placeholder="12"
              data-invalid={rootErrors.averageTrainingHoursPerEmployee ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.averageTrainingHoursPerEmployee)}
              aria-describedby={
                rootErrors.averageTrainingHoursPerEmployee ? 's1-trainingHours-error' : undefined
              }
            />
            {rootErrors.averageTrainingHoursPerEmployee && (
              <p id="s1-trainingHours-error" className="ds-error">
                {rootErrors.averageTrainingHoursPerEmployee}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Træningsdækning (%)</span>
            <input
              type="number"
              value={current.trainingCoveragePercent ?? ''}
              onChange={handleNumericChange('trainingCoveragePercent')}
              className="ds-input"
              min={0}
              max={100}
              step="0.1"
              placeholder="80"
              data-invalid={rootErrors.trainingCoveragePercent ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.trainingCoveragePercent)}
              aria-describedby={rootErrors.trainingCoveragePercent ? 's1-trainingCoverage-error' : undefined}
            />
            {rootErrors.trainingCoveragePercent && (
              <p id="s1-trainingCoverage-error" className="ds-error">
                {rootErrors.trainingCoveragePercent}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Social beskyttelse (%)</span>
            <input
              type="number"
              value={current.socialProtectionCoveragePercent ?? ''}
              onChange={handleNumericChange('socialProtectionCoveragePercent')}
              className="ds-input"
              min={0}
              max={100}
              step="0.1"
              placeholder="90"
              data-invalid={rootErrors.socialProtectionCoveragePercent ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.socialProtectionCoveragePercent)}
              aria-describedby={
                rootErrors.socialProtectionCoveragePercent ? 's1-socialProtection-error' : undefined
              }
            />
            {rootErrors.socialProtectionCoveragePercent && (
              <p id="s1-socialProtection-error" className="ds-error">
                {rootErrors.socialProtectionCoveragePercent}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Sundhedsordninger (%)</span>
            <input
              type="number"
              value={current.healthCareCoveragePercent ?? ''}
              onChange={handleNumericChange('healthCareCoveragePercent')}
              className="ds-input"
              min={0}
              max={100}
              step="0.1"
              placeholder="75"
              data-invalid={rootErrors.healthCareCoveragePercent ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.healthCareCoveragePercent)}
              aria-describedby={
                rootErrors.healthCareCoveragePercent ? 's1-healthCoverage-error' : undefined
              }
            />
            {rootErrors.healthCareCoveragePercent && (
              <p id="s1-healthCoverage-error" className="ds-error">
                {rootErrors.healthCareCoveragePercent}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Pensionsordninger (%)</span>
            <input
              type="number"
              value={current.pensionPlanCoveragePercent ?? ''}
              onChange={handleNumericChange('pensionPlanCoveragePercent')}
              className="ds-input"
              min={0}
              max={100}
              step="0.1"
              placeholder="88"
              data-invalid={rootErrors.pensionPlanCoveragePercent ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.pensionPlanCoveragePercent)}
              aria-describedby={
                rootErrors.pensionPlanCoveragePercent ? 's1-pensionCoverage-error' : undefined
              }
            />
            {rootErrors.pensionPlanCoveragePercent && (
              <p id="s1-pensionCoverage-error" className="ds-error">
                {rootErrors.pensionPlanCoveragePercent}
              </p>
            )}
          </label>
        </div>
      </section>

      <section className="ds-card ds-stack">
        <h3 className="ds-heading-xs">Narrativ kontekst</h3>
        <p className="ds-text-subtle">
          Brug feltet til at beskrive ændringer i arbejdsstyrken, fx vækst, outsourcing eller samarbejde med faglige organisationer.
        </p>
        <textarea
          value={current.workforceNarrative ?? ''}
          onChange={handleNarrativeChange}
          maxLength={MAX_NARRATIVE}
          className="ds-textarea"
          rows={4}
          placeholder="Beskriv fokus på rekruttering, fastholdelse og samarbejde med medarbejderrepræsentanter."
        />
      </section>

      {hasInput && (
        <aside className="ds-card ds-stack-sm" aria-live="polite">
          <h3 className="ds-heading-xs">Forhåndsresultat</h3>
          <p className="ds-text-strong">
            {preview.value} {preview.unit}
          </p>
          <ul className="ds-stack-xs">
            {preview.warnings.length === 0 ? (
              <li className="ds-text-subtle">Ingen advarsler registreret.</li>
            ) : (
              preview.warnings.map((warning, index) => <li key={index}>{warning}</li>)
            )}
          </ul>
        </aside>
      )}
    </form>
  )
}
