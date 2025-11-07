
/**
 * Wizardtrin for modul D1 – metode og governance.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { D1Input, ModuleInput, ModuleResult } from '@org/shared'
import { runD1 } from '@org/shared'
import type { WizardStepProps } from './StepTemplate'

const TEXT_LIMIT = 2000

type StrategySection = NonNullable<D1Input['strategy']>
type GovernanceSection = NonNullable<D1Input['governance']>
type ImpactsSection = NonNullable<D1Input['impactsRisksOpportunities']>
type TargetsSection = NonNullable<D1Input['targetsAndKpis']>
type TimeHorizon = NonNullable<ImpactsSection['timeHorizons']>[number]
type ValueChainCoverage = NonNullable<ImpactsSection['valueChainCoverage']>
type TargetsKpiArray = NonNullable<TargetsSection['kpis']>
type TargetLine = TargetsKpiArray[number]

const createEmptyTargetLine = (): TargetLine => ({
  name: null,
  kpi: null,
  unit: null,
  baselineYear: null,
  baselineValue: null,
  targetYear: null,
  targetValue: null,
  comments: null
})

const createEmptyStrategy = (): StrategySection => ({
  businessModelSummary: null,
  sustainabilityIntegration: null,
  resilienceDescription: null,
  stakeholderEngagement: null
})

const createEmptyGovernance = (): GovernanceSection => ({
  oversight: null,
  managementRoles: null,
  esgExpertise: null,
  incentives: null,
  policies: null,
  hasEsgCommittee: null
})

const createEmptyImpacts = (): ImpactsSection => ({
  processDescription: null,
  prioritisationCriteria: null,
  integrationIntoManagement: null,
  mitigationActions: null,
  valueChainCoverage: null,
  timeHorizons: [] as TimeHorizon[]
})

const createEmptyTargets = (): TargetsSection => ({
  hasQuantitativeTargets: null,
  governanceIntegration: null,
  progressDescription: null,
  kpis: [] as TargetLine[]
})

const createEmptyD1 = (): D1Input => ({
  organizationalBoundary: null,
  scope2Method: null,
  scope3ScreeningCompleted: null,
  dataQuality: null,
  materialityAssessmentDescription: null,
  strategyDescription: null,
  strategy: createEmptyStrategy(),
  governance: createEmptyGovernance(),
  impactsRisksOpportunities: createEmptyImpacts(),
  targetsAndKpis: createEmptyTargets()
})

const boundaryOptions: Array<{
  value: NonNullable<D1Input['organizationalBoundary']>
  label: string
  description: string
}> = [
  {
    value: 'equityShare',
    label: 'Equity share',
    description: 'Rapporterer efter ejerandel – relevant når joint ventures udgør hovedparten.'
  },
  {
    value: 'financialControl',
    label: 'Financial control',
    description: 'Medtager enheder med bestemmende økonomisk kontrol.'
  },
  {
    value: 'operationalControl',
    label: 'Operational control',
    description: 'Anbefalet for ESG – organisationen styrer daglig drift og kan implementere politikker.'
  }
]

const scope2MethodOptions: Array<{
  value: NonNullable<D1Input['scope2Method']>
  label: string
  description: string
}> = [
  {
    value: 'locationBased',
    label: 'Location-based',
    description: 'Nettoemission baseret på netleverandørens gennemsnitsfaktorer.'
  },
  {
    value: 'marketBased',
    label: 'Market-based',
    description: 'Nettoemission baseret på kontrakter, certifikater og residualfaktorer.'
  }
]

const dataQualityOptions: Array<{
  value: NonNullable<D1Input['dataQuality']>
  label: string
  description: string
}> = [
  {
    value: 'primary',
    label: 'Primær',
    description: 'Direkte målinger eller systemudtræk med revisionsspor.'
  },
  {
    value: 'secondary',
    label: 'Sekundær',
    description: 'Leverandørdata eller branchefaktorer med dokumentation.'
  },
  {
    value: 'proxy',
    label: 'Proxy',
    description: 'Skøn eller estimater uden fuld dokumentation.'
  }
]

const valueChainCoverageOptions: Array<{
  value: ValueChainCoverage
  label: string
  description: string
}> = [
  {
    value: 'ownOperations',
    label: 'Kun egne aktiviteter',
    description: 'Screeningen dækker udelukkende egne anlæg og juridiske enheder.'
  },
  {
    value: 'upstreamOnly',
    label: 'Egne + upstream',
    description: 'Væsentlige upstream-led dækker leverandører, råvarer eller partnere.'
  },
  {
    value: 'downstreamOnly',
    label: 'Egne + downstream',
    description: 'Fokus på brugere, distribution og slutproduktets effekter.'
  },
  {
    value: 'upstreamAndDownstream',
    label: 'Egne + hele værdikæden',
    description: 'Både upstream- og downstream-led vurderes systematisk.'
  },
  {
    value: 'fullValueChain',
    label: 'Fuldt dækkende værdikæde',
    description: 'Alle væsentlige upstream- og downstream-led er dækket og dokumenteret.'
  }
]

const timeHorizonOptions: Array<{
  value: TimeHorizon
  label: string
  description: string
}> = [
  {
    value: 'shortTerm',
    label: 'Kort sigt (0-3 år)',
    description: 'Operationelle risici, compliance-krav og nuværende stakeholderkrav.'
  },
  {
    value: 'mediumTerm',
    label: 'Mellemsigt (3-10 år)',
    description: 'Forventede ændringer i marked, lovgivning og teknologi.'
  },
  {
    value: 'longTerm',
    label: 'Lang sigt (10+ år)',
    description: 'Strategisk robusthed, klima- og natur-scenarier.'
  }
]

type SelectFieldKey = 'organizationalBoundary' | 'scope2Method' | 'dataQuality'
type TextFieldKey = 'materialityAssessmentDescription' | 'strategyDescription'

type SelectOption = {
  value: NonNullable<D1Input[SelectFieldKey]>
  label: string
  description: string
}

type GovernanceSectionConfig = {
  title: string
  description: string
  options: SelectOption[]
  field: SelectFieldKey
}

const governanceSections: GovernanceSectionConfig[] = [
  {
    title: 'Organisatorisk afgrænsning',
    description: 'Vælg konsolideringsprincip for rapporteringen.',
    options: boundaryOptions,
    field: 'organizationalBoundary'
  },
  {
    title: 'Scope 2 metode',
    description: 'Definér primær metode til Scope 2-rapportering.',
    options: scope2MethodOptions,
    field: 'scope2Method'
  },
  {
    title: 'Datakvalitet',
    description: 'Angiv den dominerende kvalitet for ESG-data.',
    options: dataQualityOptions,
    field: 'dataQuality'
  }
]


const strategyFieldConfigs: Array<{
  field: keyof StrategySection
  label: string
  description: string
}> = [
  {
    field: 'businessModelSummary',
    label: 'Forretningsmodel og værdikæde',
    description: 'Opsummer hvordan forretningsmodellen skaber værdi og hvor bæredygtighed påvirker den.'
  },
  {
    field: 'sustainabilityIntegration',
    label: 'Integration i strategi',
    description: 'Beskriv hvordan bæredygtighedsforhold indgår i strategier og beslutninger.'
  },
  {
    field: 'resilienceDescription',
    label: 'Robusthed og scenariearbejde',
    description: 'Dokumentér scenarieanalyser, stress-tests eller planer for at sikre robusthed.'
  },
  {
    field: 'stakeholderEngagement',
    label: 'Stakeholder- og dialogproces',
    description: 'Hvordan involveres medarbejdere, kunder, investorer og andre interessenter?'
  }
]

const governanceFieldConfigs: Array<{
  field: Exclude<keyof GovernanceSection, 'hasEsgCommittee'>
  label: string
  description: string
}> = [
  {
    field: 'oversight',
    label: 'Bestyrelsens tilsyn',
    description: 'Hvordan rapporteres ESG til bestyrelsen, og hvilke beslutninger træffes?'
  },
  {
    field: 'managementRoles',
    label: 'Direktionens ansvar',
    description: 'Kortlæg roller, KPI’er og fora hvor ESG behandles i direktionen.'
  },
  {
    field: 'esgExpertise',
    label: 'Kompetencer og træning',
    description: 'Uddannelse, certificeringer eller eksterne rådgivere der styrker governance.'
  },
  {
    field: 'incentives',
    label: 'Incitamenter',
    description: 'Bonusordninger eller andre incitamenter koblet til bæredygtighedsmål.'
  },
  {
    field: 'policies',
    label: 'Politikker og kontroller',
    description: 'Væsentlige politikker, interne kontroller og rapporteringsprocesser.'
  }
]

const impactsFieldConfigs: Array<{
  field: Exclude<keyof ImpactsSection, 'valueChainCoverage' | 'timeHorizons'>
  label: string
  description: string
}> = [
  {
    field: 'processDescription',
    label: 'Proces for impacts/risici/muligheder',
    description: 'Metoder, frekvens og ansvar for analyse af impacts, risici og muligheder.'
  },
  {
    field: 'prioritisationCriteria',
    label: 'Prioriteringskriterier',
    description: 'Kriterier for væsentlighed, vægtning af påvirkning, sandsynlighed og finansielle effekter.'
  },
  {
    field: 'integrationIntoManagement',
    label: 'Integration i styring',
    description: 'Hvordan bruges resultaterne i strategi, risikostyring og investeringsbeslutninger?'
  },
  {
    field: 'mitigationActions',
    label: 'Tiltag og handlingsplaner',
    description: 'Nuværende og planlagte aktiviteter for at adressere væsentlige impacts.'
  }
]

const targetFieldConfigs: Array<{
  field: Exclude<keyof TargetsSection, 'hasQuantitativeTargets' | 'kpis'>
  label: string
  description: string
}> = [
  {
    field: 'governanceIntegration',
    label: 'Forankring af mål og KPI’er',
    description: 'Hvordan følger bestyrelse og ledelse op på mål og KPI’er?'
  },
  {
    field: 'progressDescription',
    label: 'Status og fremdrift',
    description: 'Opsummer resultater, delmål og eventuelle afvigelser fra planerne.'
  }
]

const createPreviewInput = (input: D1Input): ModuleInput => ({
  D1: input
} as ModuleInput)


export function D1Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = useMemo<D1Input>(() => {
    const empty = createEmptyD1()
    const existing = (state.D1 as D1Input | undefined) ?? null

    if (!existing) {
      return empty
    }

    return {
      ...empty,
      ...existing,
      strategy: {
        ...createEmptyStrategy(),
        ...(existing.strategy ?? {})
      },
      governance: {
        ...createEmptyGovernance(),
        ...(existing.governance ?? {})
      },
      impactsRisksOpportunities: {
        ...createEmptyImpacts(),
        ...(existing.impactsRisksOpportunities ?? {}),
        timeHorizons: [...(existing.impactsRisksOpportunities?.timeHorizons ?? [])]
      },
      targetsAndKpis: {
        ...createEmptyTargets(),
        ...(existing.targetsAndKpis ?? {}),
        kpis: existing.targetsAndKpis?.kpis
          ? existing.targetsAndKpis.kpis.map((line) => ({
              ...createEmptyTargetLine(),
              ...line
            }))
          : []
      }
    }
  }, [state.D1])

  const preview = useMemo<ModuleResult>(() => {
    return runD1(createPreviewInput(current))
  }, [current])
  const totalRequirements = preview.metrics?.length ?? 0

  const handleSelectChange = (field: SelectFieldKey) => (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value === '' ? null : (event.target.value as D1Input[SelectFieldKey])
    onChange('D1', {
      ...current,
      [field]: value
    })
  }

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.checked
    onChange('D1', {
      ...current,
      scope3ScreeningCompleted: value
    })
  }

  const handleTopLevelTextChange = (field: TextFieldKey) => (event: ChangeEvent<HTMLTextAreaElement>) => {
    const limited = event.target.value.slice(0, TEXT_LIMIT)
    onChange('D1', {
      ...current,
      [field]: limited.trim() === '' ? null : limited
    })
  }

  const handleStrategyTextChange = (field: keyof StrategySection) => (event: ChangeEvent<HTMLTextAreaElement>) => {
    const limited = event.target.value.slice(0, TEXT_LIMIT)
    const previous = current.strategy ?? createEmptyStrategy()
    onChange('D1', {
      ...current,
      strategy: {
        ...previous,
        [field]: limited.trim() === '' ? null : limited
      }
    })
  }

  const handleGovernanceTextChange = (
    field: Exclude<keyof GovernanceSection, 'hasEsgCommittee'>
  ) =>
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const limited = event.target.value.slice(0, TEXT_LIMIT)
      const previous = current.governance ?? createEmptyGovernance()
      onChange('D1', {
        ...current,
        governance: {
          ...previous,
          [field]: limited.trim() === '' ? null : limited
        }
      })
    }

  const handleGovernanceCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const previous = current.governance ?? createEmptyGovernance()
    onChange('D1', {
      ...current,
      governance: {
        ...previous,
        hasEsgCommittee: event.target.checked
      }
    })
  }

  const handleImpactsTextChange = (
    field: Exclude<keyof ImpactsSection, 'valueChainCoverage' | 'timeHorizons'>
  ) =>
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const limited = event.target.value.slice(0, TEXT_LIMIT)
      const previous = current.impactsRisksOpportunities ?? createEmptyImpacts()
      onChange('D1', {
        ...current,
        impactsRisksOpportunities: {
          ...previous,
          [field]: limited.trim() === '' ? null : limited
        }
      })
    }

  const handleValueChainChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const previous = current.impactsRisksOpportunities ?? createEmptyImpacts()
    const value = event.target.value === '' ? null : (event.target.value as ValueChainCoverage)
    onChange('D1', {
      ...current,
      impactsRisksOpportunities: {
        ...previous,
        valueChainCoverage: value
      }
    })
  }

  const handleTimeHorizonToggle = (horizon: TimeHorizon) => (event: ChangeEvent<HTMLInputElement>) => {
    const previous = current.impactsRisksOpportunities ?? createEmptyImpacts()
    const existing = previous.timeHorizons ?? []
    const next = event.target.checked
      ? Array.from(new Set([...existing, horizon]))
      : existing.filter((value) => value !== horizon)
    onChange('D1', {
      ...current,
      impactsRisksOpportunities: {
        ...previous,
        timeHorizons: next
      }
    })
  }

  const handleTargetsTextChange = (
    field: Exclude<keyof TargetsSection, 'hasQuantitativeTargets' | 'kpis'>
  ) =>
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const limited = event.target.value.slice(0, TEXT_LIMIT)
      const previous = current.targetsAndKpis ?? createEmptyTargets()
      onChange('D1', {
        ...current,
        targetsAndKpis: {
          ...previous,
          [field]: limited.trim() === '' ? null : limited
        }
      })
    }

  const handleTargetsCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const previous = current.targetsAndKpis ?? createEmptyTargets()
    onChange('D1', {
      ...current,
      targetsAndKpis: {
        ...previous,
        hasQuantitativeTargets: event.target.checked
      }
    })
  }

  const handleAddKpi = () => {
    const previous = current.targetsAndKpis ?? createEmptyTargets()
    const kpis = previous.kpis ?? []
    if (kpis.length >= 20) {
      return
    }
    onChange('D1', {
      ...current,
      targetsAndKpis: {
        ...previous,
        kpis: [...kpis, createEmptyTargetLine()]
      }
    })
  }

  const handleRemoveKpi = (index: number) => () => {
    const previous = current.targetsAndKpis ?? createEmptyTargets()
    const kpis = previous.kpis ?? []
    onChange('D1', {
      ...current,
      targetsAndKpis: {
        ...previous,
        kpis: kpis.filter((_, idx) => idx !== index)
      }
    })
  }

  const handleKpiTextChange = (index: number, field: 'name' | 'kpi' | 'unit' | 'comments') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const limit = field === 'comments' ? 500 : field === 'unit' ? 40 : 120
      const limited = event.target.value.slice(0, limit)
      const previous = current.targetsAndKpis ?? createEmptyTargets()
      const kpis = previous.kpis ?? []
      onChange('D1', {
        ...current,
        targetsAndKpis: {
          ...previous,
          kpis: kpis.map((line, idx) =>
            idx === index
              ? {
                  ...line,
                  [field]: limited.trim() === '' ? null : limited
                }
              : line
          )
        }
      })
    }

  const handleKpiNumberChange = (
    index: number,
    field: 'baselineYear' | 'baselineValue' | 'targetYear' | 'targetValue'
  ) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value
      const value = raw.trim() === '' ? null : Number(raw)
      const safeValue = value !== null && Number.isFinite(value) ? value : null
      const previous = current.targetsAndKpis ?? createEmptyTargets()
      const kpis = previous.kpis ?? []
      onChange('D1', {
        ...current,
        targetsAndKpis: {
          ...previous,
          kpis: kpis.map((line, idx) =>
            idx === index
              ? {
                  ...line,
                  [field]: safeValue
                }
              : line
          )
        }
      })
    }

  const scope3Checked = current.scope3ScreeningCompleted ?? false
  const materialityValue = current.materialityAssessmentDescription ?? ''
  const governanceSummaryValue = current.strategyDescription ?? ''
  const strategySection = current.strategy ?? createEmptyStrategy()
  const governanceSection = current.governance ?? createEmptyGovernance()
  const impactsSection = current.impactsRisksOpportunities ?? createEmptyImpacts()
  const targetsSection = current.targetsAndKpis ?? createEmptyTargets()


  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '68rem' }}>
      <header style={{ display: 'grid', gap: '0.75rem' }}>
        <h2>D1 – Metode &amp; governance</h2>
        <p style={{ margin: 0 }}>
          Dokumentér governance-opsætningen for CSRD/ESRS: konsolideringsprincip, Scope 2 metode, Scope 3 screening,
          datakvalitet og de centrale analyser, politikker, mål og KPI’er.
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gap: '1rem',
          background: '#f1f5f4',
          padding: '1.25rem',
          borderRadius: '0.75rem'
        }}
      >
        <h3 style={{ margin: 0 }}>Metodevalg</h3>
        <p style={{ margin: 0, color: '#445048' }}>
          Disse valg vægtes direkte i governance-scoren. Operational control, market-based Scope 2 og fuldført Scope 3
          screening giver højeste score.
        </p>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {governanceSections.map((section) => {
            const value = current[section.field] ?? ''
            const selected =
              value === ''
                ? undefined
                : section.options.find((option) => option.value === value)
            return (
              <label key={section.field} style={{ display: 'grid', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>{section.title}</span>
                <span style={{ color: '#4d5c56', fontSize: '0.9rem' }}>{section.description}</span>
                <select
                  value={value}
                  onChange={handleSelectChange(section.field)}
                  style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                >
                  <option value="">Vælg...</option>
                  {section.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span style={{ color: '#5f6c66', fontSize: '0.85rem' }}>
                  {selected ? `${selected.label}: ${selected.description}` : 'Vælg en mulighed for at se beskrivelse.'}
                </span>
              </label>
            )
          })}

          <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input type="checkbox" checked={scope3Checked} onChange={handleCheckboxChange} />
            <span>
              <span style={{ display: 'block', fontWeight: 600 }}>Scope 3 screening udført</span>
              <span style={{ display: 'block', color: '#4d5c56', fontSize: '0.9rem' }}>
                Markér når alle 15 kategorier er vurderet for væsentlighed.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section style={{ display: 'grid', gap: '1rem' }}>
        <label style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600 }}>Beskrivelse af væsentlighedsanalyse</span>
          <span style={{ color: '#4d5c56', fontSize: '0.9rem' }}>
            Opsummer risici, muligheder og stakeholderinput. Indholdet indgår i governance-scoren.
          </span>
          <textarea
            rows={6}
            value={materialityValue}
            onChange={handleTopLevelTextChange('materialityAssessmentDescription')}
            maxLength={TEXT_LIMIT}
            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0', fontFamily: 'inherit' }}
          />
          <span style={{ fontSize: '0.8rem', color: '#5f6c66' }}>{materialityValue.length}/{TEXT_LIMIT} tegn</span>
        </label>
      </section>

      <section style={{ display: 'grid', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>Strategi og forankring</h3>
        {strategyFieldConfigs.map((config) => {
          const value = strategySection[config.field] ?? ''
          return (
            <label key={config.field} style={{ display: 'grid', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>{config.label}</span>
              <span style={{ color: '#4d5c56', fontSize: '0.9rem' }}>{config.description}</span>
              <textarea
                rows={5}
                value={value}
                onChange={handleStrategyTextChange(config.field)}
                maxLength={TEXT_LIMIT}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5d0',
                  fontFamily: 'inherit'
                }}
              />
              <span style={{ fontSize: '0.8rem', color: '#5f6c66' }}>{value.length}/{TEXT_LIMIT} tegn</span>
            </label>
          )
        })}
        <label style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600 }}>Overordnet governance-sammendrag</span>
          <span style={{ color: '#4d5c56', fontSize: '0.9rem' }}>
            Brug dette felt til at beskrive governance-strukturen samlet eller fremhæve centrale beslutninger.
          </span>
          <textarea
            rows={5}
            value={governanceSummaryValue}
            onChange={handleTopLevelTextChange('strategyDescription')}
            maxLength={TEXT_LIMIT}
            style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5d0',
              fontFamily: 'inherit'
            }}
          />
          <span style={{ fontSize: '0.8rem', color: '#5f6c66' }}>{governanceSummaryValue.length}/{TEXT_LIMIT} tegn</span>
        </label>
      </section>

      <section
        style={{
          display: 'grid',
          gap: '1rem',
          background: '#f8fdfa',
          border: '1px solid #d5e1dc',
          borderRadius: '0.75rem',
          padding: '1.25rem'
        }}
      >
        <h3 style={{ margin: 0 }}>Governance og roller</h3>
        <p style={{ margin: 0, color: '#4d5c56' }}>
          Beskriv roller, kompetencer og kontroller der sikrer kvaliteten af CSRD/ESRS-rapporteringen.
        </p>
        {governanceFieldConfigs.map((config) => {
          const value = governanceSection[config.field] ?? ''
          return (
            <label key={config.field} style={{ display: 'grid', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>{config.label}</span>
              <span style={{ color: '#4d5c56', fontSize: '0.9rem' }}>{config.description}</span>
              <textarea
                rows={4}
                value={value}
                onChange={handleGovernanceTextChange(config.field)}
                maxLength={TEXT_LIMIT}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5d0',
                  fontFamily: 'inherit'
                }}
              />
              <span style={{ fontSize: '0.8rem', color: '#5f6c66' }}>{value.length}/{TEXT_LIMIT} tegn</span>
            </label>
          )
        })}
        <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input type="checkbox" checked={governanceSection.hasEsgCommittee ?? false} onChange={handleGovernanceCheckboxChange} />
          <span>
            <span style={{ display: 'block', fontWeight: 600 }}>Dedikeret ESG-/bæredygtighedsudvalg</span>
            <span style={{ display: 'block', color: '#4d5c56', fontSize: '0.9rem' }}>
              Marker hvis bestyrelsen har et udvalg eller advisory board med fokus på bæredygtighed.
            </span>
          </span>
        </label>
      </section>

      <section
        style={{
          display: 'grid',
          gap: '1rem',
          background: '#fdf9f6',
          border: '1px solid #ecd8c8',
          borderRadius: '0.75rem',
          padding: '1.25rem'
        }}
      >
        <h3 style={{ margin: 0 }}>Impacts, risici og muligheder</h3>
        {impactsFieldConfigs.map((config) => {
          const value = impactsSection[config.field] ?? ''
          return (
            <label key={config.field} style={{ display: 'grid', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>{config.label}</span>
              <span style={{ color: '#4d5c56', fontSize: '0.9rem' }}>{config.description}</span>
              <textarea
                rows={4}
                value={value}
                onChange={handleImpactsTextChange(config.field)}
                maxLength={TEXT_LIMIT}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5d0',
                  fontFamily: 'inherit'
                }}
              />
              <span style={{ fontSize: '0.8rem', color: '#5f6c66' }}>{value.length}/{TEXT_LIMIT} tegn</span>
            </label>
          )
        })}
        <label style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600 }}>Værdikædedækning</span>
          <span style={{ color: '#4d5c56', fontSize: '0.9rem' }}>
            Angiv hvor stor en del af værdikæden der indgår i analysen af impacts, risici og muligheder.
          </span>
          <select
            value={impactsSection.valueChainCoverage ?? ''}
            onChange={handleValueChainChange}
            style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
          >
            <option value="">Vælg...</option>
            {valueChainCoverageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span style={{ color: '#5f6c66', fontSize: '0.85rem' }}>
            {impactsSection.valueChainCoverage
              ? valueChainCoverageOptions.find((option) => option.value === impactsSection.valueChainCoverage)?.description
              : 'Vælg en mulighed for at se beskrivelse.'}
          </span>
        </label>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600 }}>Analyserede tidshorisonter</span>
          <span style={{ color: '#4d5c56', fontSize: '0.9rem' }}>
            Markér de tidshorisonter der er vurderet i impact-/risikoanalysen.
          </span>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {timeHorizonOptions.map((option) => {
              const checked = (impactsSection.timeHorizons ?? []).includes(option.value)
              return (
                <label key={option.value} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="checkbox" checked={checked} onChange={handleTimeHorizonToggle(option.value)} />
                  <span>
                    <span style={{ fontWeight: 600 }}>{option.label}</span>
                    <span style={{ display: 'block', color: '#4d5c56', fontSize: '0.85rem' }}>{option.description}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gap: '1rem',
          background: '#f5f8ff',
          border: '1px solid #d3ddf5',
          borderRadius: '0.75rem',
          padding: '1.25rem'
        }}
      >
        <h3 style={{ margin: 0 }}>Mål og KPI’er</h3>
        <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input type="checkbox" checked={targetsSection.hasQuantitativeTargets ?? false} onChange={handleTargetsCheckboxChange} />
          <span>
            <span style={{ display: 'block', fontWeight: 600 }}>Organisationen har kvantitative mål</span>
            <span style={{ display: 'block', color: '#4d5c56', fontSize: '0.9rem' }}>
              Markér når væsentlige impacts eller risici har konkrete mål med tilhørende KPI’er.
            </span>
          </span>
        </label>
        {targetFieldConfigs.map((config) => {
          const value = targetsSection[config.field] ?? ''
          return (
            <label key={config.field} style={{ display: 'grid', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>{config.label}</span>
              <span style={{ color: '#4d5c56', fontSize: '0.9rem' }}>{config.description}</span>
              <textarea
                rows={4}
                value={value}
                onChange={handleTargetsTextChange(config.field)}
                maxLength={TEXT_LIMIT}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5d0',
                  fontFamily: 'inherit'
                }}
              />
              <span style={{ fontSize: '0.8rem', color: '#5f6c66' }}>{value.length}/{TEXT_LIMIT} tegn</span>
            </label>
          )
        })}
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Registrerede KPI’er</strong>
            <button
              type="button"
              onClick={handleAddKpi}
              disabled={(targetsSection.kpis ?? []).length >= 20}
              style={{
                background: '#0b5fff',
                color: 'white',
                border: 'none',
                padding: '0.6rem 1rem',
                borderRadius: '0.5rem',
                cursor: (targetsSection.kpis ?? []).length >= 20 ? 'not-allowed' : 'pointer'
              }}
            >
              Tilføj KPI
            </button>
          </div>
          {(targetsSection.kpis ?? []).length === 0 ? (
            <p style={{ margin: 0, color: '#4d5c56' }}>Ingen KPI’er tilføjet endnu.</p>
          ) : (
            (targetsSection.kpis ?? []).map((line, index) => {
              const nameValue = line.name ?? ''
              const kpiValue = line.kpi ?? ''
              const unitValue = line.unit ?? ''
              const commentsValue = line.comments ?? ''
              const baselineYearValue = line.baselineYear ?? ''
              const targetYearValue = line.targetYear ?? ''
              const baselineValue = line.baselineValue ?? ''
              const targetValue = line.targetValue ?? ''
              return (
                <fieldset
                  key={`kpi-${index}`}
                  style={{
                    border: '1px solid #cbd5d0',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    display: 'grid',
                    gap: '0.75rem'
                  }}
                >
                  <legend style={{ fontWeight: 600 }}>KPI {index + 1}</legend>
                  <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>Navn på mål</span>
                      <input
                        type="text"
                        value={nameValue}
                        onChange={handleKpiTextChange(index, 'name')}
                        maxLength={120}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>KPI</span>
                      <input
                        type="text"
                        value={kpiValue}
                        onChange={handleKpiTextChange(index, 'kpi')}
                        maxLength={120}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>Enhed</span>
                      <input
                        type="text"
                        value={unitValue}
                        onChange={handleKpiTextChange(index, 'unit')}
                        maxLength={40}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>Baseline-år</span>
                      <input
                        type="number"
                        value={baselineYearValue}
                        onChange={handleKpiNumberChange(index, 'baselineYear')}
                        min={1900}
                        max={2100}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>Baseline-værdi</span>
                      <input
                        type="number"
                        value={baselineValue}
                        onChange={handleKpiNumberChange(index, 'baselineValue')}
                        step="any"
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>Måleår</span>
                      <input
                        type="number"
                        value={targetYearValue}
                        onChange={handleKpiNumberChange(index, 'targetYear')}
                        min={1900}
                        max={2100}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>Måltal</span>
                      <input
                        type="number"
                        value={targetValue}
                        onChange={handleKpiNumberChange(index, 'targetValue')}
                        step="any"
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                      />
                    </label>
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>Kommentarer</span>
                      <textarea
                        rows={3}
                        value={commentsValue}
                        onChange={handleKpiTextChange(index, 'comments')}
                        maxLength={500}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0', fontFamily: 'inherit' }}
                      />
                    </label>
                    <div>
                      <button
                        type="button"
                        onClick={handleRemoveKpi(index)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #cbd5d0',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '0.5rem',
                          color: '#22302c',
                          cursor: 'pointer'
                        }}
                      >
                        Fjern KPI
                      </button>
                    </div>
                  </div>
                </fieldset>
              )
            })
          )}
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gap: '0.75rem',
          background: '#f9fbfa',
          border: '1px solid #d5e1dc',
          borderRadius: '0.75rem',
          padding: '1.25rem'
        }}
      >
        <h3 style={{ margin: 0 }}>ESRS 2 D1 kravvurdering</h3>
        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
          Opfyldte krav: {preview.value} / {totalRequirements}
        </p>
        {preview.metrics && preview.metrics.length > 0 && (
          <div>
            <strong>Kravstatus</strong>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: '0.5rem' }}>
              {preview.metrics.map((metric, index) => (
                <li key={`metric-${index}`}>
                  <span style={{ fontWeight: 600 }}>{metric.label}:</span>{' '}
                  <span>{metric.value}</span>
                  {metric.context ? <span style={{ display: 'block', color: '#4a5c58' }}>{metric.context}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <strong>Antagelser</strong>
          <ul>
            {preview.assumptions.map((assumption, index) => (
              <li key={`assumption-${index}`}>{assumption}</li>
            ))}
          </ul>
        </div>
        <div>
          <strong>Forslag til opfølgning</strong>
          {preview.warnings.length === 0 ? (
            <p style={{ margin: 0 }}>Ingen advarsler registreret.</p>
          ) : (
            <ul>
              {preview.warnings.map((warning, index) => (
                <li key={`warning-${index}`}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
        <details>
          <summary>Teknisk trace</summary>
          <ul>
            {preview.trace.map((traceEntry, index) => (
              <li key={`trace-${index}`} style={{ fontFamily: 'monospace' }}>
                {traceEntry}
              </li>
            ))}
          </ul>
        </details>
      </section>
    </form>
  )
}
