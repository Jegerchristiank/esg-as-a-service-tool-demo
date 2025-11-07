/**
 * Snapshot-test og enhedstests for modulberegninger.
 */
import { describe, expect, it } from 'vitest'
import type { ModuleInput } from '../../types'
import { createDefaultResult } from '../runModule'
import { runA2 } from '../modules/runA2'
import { runA3 } from '../modules/runA3'
import { runA4 } from '../modules/runA4'
import { runB1 } from '../modules/runB1'
import { runB2 } from '../modules/runB2'
import { runB3 } from '../modules/runB3'
import { runB4 } from '../modules/runB4'
import { runB5 } from '../modules/runB5'
import { runB6 } from '../modules/runB6'
import { runB7 } from '../modules/runB7'
import { runB8 } from '../modules/runB8'
import { runB9 } from '../modules/runB9'
import { runB10 } from '../modules/runB10'
import { factors } from '../factors'
import { runB11 } from '../modules/runB11'
import { runC1 } from '../modules/runC1'
import { runC2 } from '../modules/runC2'
import { runC3 } from '../modules/runC3'
import { runC4 } from '../modules/runC4'
import { runC5 } from '../modules/runC5'
import { runC6 } from '../modules/runC6'
import { runC7 } from '../modules/runC7'
import { runC8 } from '../modules/runC8'
import { runC9 } from '../modules/runC9'
import { runC10 } from '../modules/runC10'
import { runC11 } from '../modules/runC11'
import { runC12 } from '../modules/runC12'
import { runC13 } from '../modules/runC13'
import { runC14 } from '../modules/runC14'
import { runC15 } from '../modules/runC15'
import { runA1 } from '../modules/runA1'
import { runD1 } from '../modules/runD1'
import { runD2 } from '../modules/runD2'
import { runE1Targets } from '../modules/runE1Targets'
import { runE1Scenarios } from '../modules/runE1Scenarios'
import { runE1CarbonPrice } from '../modules/runE1CarbonPrice'
import { runE1RiskGeography } from '../modules/runE1RiskGeography'
import { runE1DecarbonisationDrivers } from '../modules/runE1DecarbonisationDrivers'
import { runE2Water } from '../modules/runE2Water'
import { runE3Pollution } from '../modules/runE3Pollution'
import { runE4Biodiversity } from '../modules/runE4Biodiversity'
import { runE5Resources } from '../modules/runE5Resources'
import { runSBM } from '../modules/runSBM'
import { runGOV } from '../modules/runGOV'
import { runIRO } from '../modules/runIRO'
import { runMR } from '../modules/runMR'
import { runS1 } from '../modules/runS1'
import { runS2 } from '../modules/runS2'
import { runS3 } from '../modules/runS3'
import { runS4 } from '../modules/runS4'
import { runG1 } from '../modules/runG1'
import { e1TargetsFixture } from './fixtures/e1Targets'
import { e1NewModulesFixture } from './fixtures/e1NewModules'
import {
  createD1ApprovedFixture,
  createD1RejectedFixture,
  createMRApprovedFixture,
  createMRRejectedFixture
} from './fixtures/esrs2Governance'
import {
  d2TopicMissingFinancial,
  d2TopicMissingFinancialWithOverride,
  d2TopicWithFinancial,
  d2TopicWithLowerFinancial
} from './fixtures/d2Topics'

describe('createDefaultResult', () => {
  it('returnerer forventet basisstruktur for andre moduler', () => {
    const result = createDefaultResult('B2', { B2: 42 } as ModuleInput)
    expect(result).toMatchSnapshot()
  })
})

describe('runA2', () => {
  it('summerer mobile kilder og beregner intensitet', () => {
    const input: ModuleInput = {
      A2: {
        vehicleConsumptions: [
          {
            fuelType: 'diesel',
            unit: 'liter',
            quantity: 1_500,
            emissionFactorKgPerUnit: null,
            distanceKm: 42_000,
            documentationQualityPercent: 58
          },
          {
            fuelType: 'biodiesel',
            unit: 'liter',
            quantity: 600,
            emissionFactorKgPerUnit: 1.2,
            distanceKm: null,
            documentationQualityPercent: 90
          }
        ]
      }
    }

    const result = runA2(input)

    expect(result.value).toBe(4.74)
    expect(result.unit).toBe(factors.a2.unit)
    expect(result.trace).toContain('totalEmissionsKg=4740')
    expect(result.trace).toContain('fleetEmissionsKgPerKm=0.11285714285714285')
    expect(result.assumptions).toContain(
      'Standardfaktor for Diesel: 2.68 kg CO2e/liter.'
    )
    expect(result.warnings).toContain(
      'Emissionsfaktor mangler på linje 1. Standardfaktor for Diesel anvendes.'
    )
    expect(result.warnings).toContain(
      'Dokumentationskvalitet for Diesel er kun 58%. Overvej at forbedre dokumentation eller anvende konservative antagelser.'
    )
  })

  it('filtrerer ugyldige rækker og informerer brugeren', () => {
    const input: ModuleInput = {
      A2: {
        vehicleConsumptions: [
          {
            fuelType: 'ukendt' as never,
            unit: 'gallon' as never,
            quantity: -10,
            emissionFactorKgPerUnit: -1,
            distanceKm: -500,
            documentationQualityPercent: 150
          }
        ]
      }
    }

    const result = runA2(input)

    expect(result.value).toBe(0)
    expect(result.trace).toEqual([
      'totalEmissionsKg=0',
      'totalEmissionsTonnes=0',
      'totalDistanceKm=0'
    ])
    expect(result.warnings).toEqual([
      'Ukendt brændstoftype på linje 1. Standard (Diesel) anvendes.',
      'Ugyldig enhed på linje 1. liter anvendes i stedet.',
      'Mængden på linje 1 kan ikke være negativ. 0 anvendes i stedet.',
      'Emissionsfaktoren på linje 1 kan ikke være negativ. 0 anvendes i stedet.',
      'Distance kan ikke være negativ på linje 1. 0 km anvendes i stedet.',
      'Dokumentationskvalitet på linje 1 er begrænset til 100%.',
      'Ingen gyldige mobile linjer kunne beregnes. Kontrollér indtastningerne.'
    ])
  })
})

describe('runA3', () => {
  it('beregner procesemissioner og markerer lav dokumentation', () => {
    const input: ModuleInput = {
      A3: {
        processLines: [
          {
            processType: 'cementClinker',
            outputQuantityTon: 1_000,
            emissionFactorKgPerTon: null,
            documentationQualityPercent: 78
          },
          {
            processType: 'aluminiumSmelting',
            outputQuantityTon: 200,
            emissionFactorKgPerTon: 1_700,
            documentationQualityPercent: 55
          }
        ]
      }
    }

    const result = runA3(input)

    expect(result.value).toBe(850)
    expect(result.unit).toBe(factors.a3.unit)
    expect(result.trace).toContain('totalEmissionsKg=850000')
    expect(result.assumptions).toContain(
      'Standardfaktor for Cementklinker (CaCO₃ → CaO): 510 kg CO2e/ton.'
    )
    expect(result.warnings).toContain(
      'Emissionsfaktor mangler på linje 1. Standardfaktor for Cementklinker (CaCO₃ → CaO) anvendes.'
    )
    expect(result.warnings).toContain(
      'Dokumentationskvalitet for Primær aluminiumselektrolyse er kun 55%. Overvej at forbedre dokumentation eller anvende konservative antagelser.'
    )
  })

  it('filtrerer ugyldige proceslinjer', () => {
    const input: ModuleInput = {
      A3: {
        processLines: [
          {
            processType: 'ukendt' as never,
            outputQuantityTon: -4,
            emissionFactorKgPerTon: -10,
            documentationQualityPercent: 140
          }
        ]
      }
    }

    const result = runA3(input)

    expect(result.value).toBe(0)
    expect(result.trace).toEqual(['totalEmissionsKg=0', 'totalEmissionsTonnes=0'])
    expect(result.warnings).toEqual([
      'Ukendt proces på linje 1. Standard (Cementklinker (CaCO₃ → CaO)) anvendes.',
      'Outputmængden på linje 1 kan ikke være negativ. 0 anvendes i stedet.',
      'Emissionsfaktoren på linje 1 kan ikke være negativ. 0 anvendes i stedet.',
      'Dokumentationskvalitet på linje 1 er begrænset til 100%.',
      'Ingen gyldige proceslinjer kunne beregnes. Kontrollér indtastningerne.'
    ])
  })
})

describe('runA4', () => {
  it('beregner lækageemissioner med standardværdier og advarsler', () => {
    const input: ModuleInput = {
      A4: {
        refrigerantLines: [
          {
            refrigerantType: 'hfc134a',
            systemChargeKg: 200,
            leakagePercent: null,
            gwp100: null,
            documentationQualityPercent: 82
          },
          {
            refrigerantType: 'sf6',
            systemChargeKg: 50,
            leakagePercent: 5,
            gwp100: 23_000,
            documentationQualityPercent: 40
          }
        ]
      }
    }

    const result = runA4(input)

    expect(result.value).toBe(86.1)
    expect(result.unit).toBe(factors.a4.unit)
    expect(result.trace).toContain('totalEmissionsKg=86100')
    expect(result.assumptions).toContain(
      'Standard lækageandel for HFC-134a (R-134a): 10%.'
    )
    expect(result.assumptions).toContain(
      'Standard GWP100 for HFC-134a (R-134a): 1430.'
    )
    expect(result.warnings).toContain(
      'Lækageandel mangler på linje 1. Standard på 10% anvendes.'
    )
    expect(result.warnings).toContain(
      'GWP100 mangler på linje 1. Standardværdi for HFC-134a (R-134a) anvendes.'
    )
    expect(result.warnings).toContain(
      'Dokumentationskvalitet for SF₆ (svovlhexafluorid) er kun 40%. Overvej at forbedre lækagekontrol, logning eller anvende konservative antagelser.'
    )
  })

  it('filtrerer ugyldige kølemiddellinjer', () => {
    const input: ModuleInput = {
      A4: {
        refrigerantLines: [
          {
            refrigerantType: 'ukendt' as never,
            systemChargeKg: -25,
            leakagePercent: 140,
            gwp100: -5,
            documentationQualityPercent: 150
          }
        ]
      }
    }

    const result = runA4(input)

    expect(result.value).toBe(0)
    expect(result.trace).toEqual(['totalEmissionsKg=0', 'totalEmissionsTonnes=0'])
    expect(result.warnings).toEqual([
      'Ukendt kølemiddel på linje 1. Standard (HFC-134a (R-134a)) anvendes.',
      'Fyldningen på linje 1 kan ikke være negativ. 0 kg anvendes i stedet.',
      'Lækageandelen på linje 1 er begrænset til 100%.',
      'GWP100 på linje 1 kan ikke være negativ. 0 anvendes i stedet.',
      'Dokumentationskvalitet på linje 1 er begrænset til 100%.',
      'Ingen gyldige kølemiddellinjer kunne beregnes. Kontrollér indtastningerne.'
    ])
  })
})

describe('runS1', () => {
  it('beregner social score ud fra headcount og dækning', () => {
    const input: ModuleInput = {
      S1: {
        reportingYear: 2024,
        totalHeadcount: 520,
        totalFte: 483,
        dataCoveragePercent: 90,
        fteCoveragePercent: 95,
        averageWeeklyHours: 37,
        headcountBreakdown: [
          { segment: 'Danmark', headcount: 200, femalePercent: 48, collectiveAgreementCoveragePercent: 85 },
          { segment: 'Sverige', headcount: 120, femalePercent: 52, collectiveAgreementCoveragePercent: 80 },
          { segment: 'Produktion', headcount: 150, femalePercent: 18, collectiveAgreementCoveragePercent: 70 },
          { segment: 'HQ', headcount: 50, femalePercent: 60, collectiveAgreementCoveragePercent: 90 }
        ],
        employmentContractBreakdown: [
          { contractType: 'permanentEmployees', headcount: 420, fte: 400, femalePercent: 45 },
          { contractType: 'temporaryEmployees', headcount: 70, fte: 60, femalePercent: 55 },
          { contractType: 'nonEmployeeWorkers', headcount: 20, fte: 15, femalePercent: 40 },
          { contractType: 'apprentices', headcount: 10, fte: 8, femalePercent: 35 }
        ],
        employmentStatusBreakdown: [
          { status: 'fullTime', headcount: 430, fte: 410 },
          { status: 'partTime', headcount: 70, fte: 60 },
          { status: 'seasonal', headcount: 20, fte: 13 }
        ],
        hasCollectiveBargainingAgreements: true,
        genderPayGapPercent: 4,
        genderPayGapPercentManagement: 7,
        genderPayGapPercentOperations: -1,
        absenteeismRatePercent: 4,
        lostTimeInjuryFrequencyRate: 1.2,
        workRelatedAccidentsCount: 2,
        workRelatedFatalitiesCount: 0,
        averageTrainingHoursPerEmployee: 10,
        trainingCoveragePercent: 85,
        socialProtectionCoveragePercent: 90,
        healthCareCoveragePercent: 80,
        pensionPlanCoveragePercent: 88,
        workforceNarrative: 'Stabil bemanding med fokus på kollektiv repræsentation.'
      }
    }

    const result = runS1(input)

    expect(result.value).toBeCloseTo(96.1)
    expect(result.assumptions).toContain(
      'Scoren vægter total headcount (35 %), segmentfordeling (35 %), datadækning (20 %) og faglig repræsentation (10 %).'
    )
    expect(result.warnings).toContain(
      'Segmentet "Produktion" har en kønsfordeling på 18% kvinder – markér indsats i S2 for at adressere ubalancer.'
    )
    expect(result.warnings).toContain('Registrerede arbejdsulykker: 2. Dokumentér forebyggelse.')
    expect(result.esrsFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ conceptKey: 'S1TotalHeadcount', value: 520 }),
        expect.objectContaining({ conceptKey: 'S1TotalFte', value: 483 }),
        expect.objectContaining({ conceptKey: 'S1DataCoveragePercent', value: 90 }),
        expect.objectContaining({ conceptKey: 'S1FteCoveragePercent', value: 95 }),
        expect.objectContaining({ conceptKey: 'S1GenderPayGapPercentTotal', value: 4 }),
        expect.objectContaining({ conceptKey: 'S1AbsenteeismRatePercent', value: 4 }),
        expect.objectContaining({ conceptKey: 'S1AverageTrainingHoursPerEmployee', value: 10 }),
        expect.objectContaining({ conceptKey: 'S1AverageWeeklyHours', value: 37 }),
        expect.objectContaining({ conceptKey: 'S1SegmentHeadcountTotal', value: 520 }),
        expect.objectContaining({ conceptKey: 'S1SegmentFemaleHeadcountEstimate', value: 215.4 }),
        expect.objectContaining({ conceptKey: 'S1EmploymentContractHeadcountTotal', value: 520 }),
        expect.objectContaining({ conceptKey: 'S1EmploymentContractFteTotal', value: 483 }),
        expect.objectContaining({ conceptKey: 'S1EmploymentStatusHeadcountTotal', value: 520 }),
        expect.objectContaining({ conceptKey: 'S1EmploymentStatusFteTotal', value: 483 })
      ])
    )
    expect(result.esrsTables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          conceptKey: 'S1HeadcountBreakdownTable',
          rows: expect.arrayContaining([
            expect.objectContaining({ segment: 'Danmark', headcount: 200 })
          ])
        }),
        expect.objectContaining({ conceptKey: 'S1EmploymentContractBreakdownTable' }),
        expect.objectContaining({ conceptKey: 'S1EmploymentStatusBreakdownTable' })
      ])
    )
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Total headcount', value: 520 }),
        expect.objectContaining({ label: 'Total FTE', value: 483 }),
        expect.objectContaining({ label: 'Gns. ugentlige arbejdstimer', value: 37 }),
        expect.objectContaining({ label: 'Træningstimer pr. medarbejder', value: 10 })
      ])
    )
    expect(result.tables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 's1-headcount-breakdown', rows: expect.any(Array) })
      ])
    )
    expect(result.narratives).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'Arbejdsstyrkens udvikling' })])
    )
  })

  it('giver datakvalitetsadvarsler når centrale S1-data mangler', () => {
    const input: ModuleInput = {
      S1: {
        reportingYear: null,
        totalHeadcount: 100,
        totalFte: 60,
        dataCoveragePercent: 100,
        fteCoveragePercent: null,
        averageWeeklyHours: null,
        headcountBreakdown: [
          { segment: 'HQ', headcount: 100, femalePercent: 55, collectiveAgreementCoveragePercent: 40 }
        ],
        employmentContractBreakdown: [
          { contractType: 'permanentEmployees', headcount: 80, fte: 50, femalePercent: 50 }
        ],
        employmentStatusBreakdown: [{ status: 'fullTime', headcount: 100, fte: 55 }],
        hasCollectiveBargainingAgreements: false,
        genderPayGapPercent: null,
        genderPayGapPercentManagement: null,
        genderPayGapPercentOperations: null,
        absenteeismRatePercent: 10,
        lostTimeInjuryFrequencyRate: 3,
        workRelatedAccidentsCount: null,
        workRelatedFatalitiesCount: null,
        averageTrainingHoursPerEmployee: 2,
        trainingCoveragePercent: 40,
        socialProtectionCoveragePercent: 40,
        healthCareCoveragePercent: 30,
        pensionPlanCoveragePercent: 35,
        workforceNarrative: null
      }
    }

    const result = runS1(input)

    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'Datadækning for FTE er ikke angivet. Feltet dokumenterer ESRS S1-6 krav om fuldt overblik.',
        'Faglig repræsentation/dækningsgrad er kun 40% – vurder behov for kollektive aftaler og arbejdsmiljøudvalg.',
        'Der er angivet at ingen kollektive overenskomster dækker medarbejderne – forvent opfølgning i handlingsplaner.',
        'Løngab (samlet) er ikke angivet. ESRS S1 kræver kønsopdelt aflønning.',
        'Løngab for ledelse er ikke angivet.',
        'Løngab for øvrige medarbejdere er ikke angivet.',
        'Fraværsraten er 10% – undersøg årsager og forbedringstiltag.',
        'LTIFR er 3 – styrk sikkerhedstræning og rapportering.',
        'Angiv antal arbejdsrelaterede ulykker for at opfylde ESRS S1-8.',
        'Angiv antal arbejdsrelaterede dødsfald (0 hvis ingen).',
        'Træningstimer pr. medarbejder er 2 – vurder behov for flere efteruddannelsesinitiativer.',
        'Kun 40% af medarbejderne modtog træning – udvid programmerne.',
        'Social beskyttelse dækker kun 40% – vurder forbedringer af ydelserne.',
        'Sundhedsordninger dækker 30% – vurder forbedringer.',
        'Pensionsordninger dækker 35% – dokumentér plan for udvidelse.',
        'Ansættelsesformernes headcount (80) stemmer ikke overens med total headcount (100). Kontrollér opgørelsen.',
        'Ansættelsesformernes FTE (50.00) stemmer ikke overens med total FTE (60). Juster fordeling eller total.',
        'Statusfordelingens FTE (55.00) matcher ikke total FTE (60).'
      ])
    )
  })
})

describe('runS2', () => {
  it('beregner social score for værdikædearbejdere og giver relevante warnings', () => {
    const input: ModuleInput = {
      S2: {
        valueChainWorkersCount: 2400,
        workersAtRiskCount: 180,
        valueChainCoveragePercent: 85,
        highRiskSupplierSharePercent: 22,
        livingWageCoveragePercent: 88,
        collectiveBargainingCoveragePercent: 60,
        socialAuditsCompletedPercent: 92,
        grievancesOpenCount: 1,
        grievanceMechanismForWorkers: true,
        incidents: [
          {
            supplier: 'Alpha Textiles',
            country: 'Bangladesh',
            issueType: 'wagesAndBenefits',
            workersAffected: 60,
            severityLevel: 'medium',
            remediationStatus: 'inProgress',
            description: 'Løn ligger under aftalt minimum – forbedringsplan igangsat.'
          },
          {
            supplier: 'Omega Plast',
            country: 'Malaysia',
            issueType: 'healthAndSafety',
            workersAffected: 20,
            severityLevel: 'low',
            remediationStatus: 'completed',
            description: null
          }
        ],
        socialDialogueNarrative:
          'Leverandørprogram med kvartalsvise dialogmøder, træning i arbejdsmiljø og co-funding af fagforeningsarbejde.',
        remediationNarrative:
          'Kompensation til påvirkede syersker samt auditopfølgning med fokus på lønjusteringer og forbedret tilsyn.'
      }
    }

    const result = runS2(input)

    expect(result.value).toBeGreaterThan(70)
    expect(result.trace).toContain('valueChainCoveragePercent=85')
    expect(result.warnings).toContain('1 klager fra leverandørarbejdere er åbne. Følg op og luk dem for at undgå ESRS S2 advarsler.')
    expect(result.esrsFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ conceptKey: 'S2ValueChainWorkersCount', value: 2400 }),
        expect.objectContaining({ conceptKey: 'S2IncidentsCount', value: 2 }),
        expect.objectContaining({ conceptKey: 'S2SocialDialogueNarrative', value: expect.stringContaining('dialog') }),
        expect.objectContaining({ conceptKey: 'S2RemediationNarrative', value: expect.stringContaining('Kompensation') })
      ])
    )
    expect(result.esrsTables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          conceptKey: 'S2IncidentsTable',
          rows: expect.arrayContaining([
            expect.objectContaining({ supplier: 'Alpha Textiles', workersAffected: 60 })
          ])
        })
      ])
    )
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Arbejdstagere i værdikæden', value: 2400 }),
        expect.objectContaining({ label: 'Registrerede hændelser', value: 2 }),
        expect.objectContaining({ label: 'Berørte arbejdstagere', value: 80 })
      ])
    )
    expect(result.tables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 's2-incident-list', rows: expect.any(Array) })
      ])
    )
    expect(result.narratives).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Social dialog og træning' }),
        expect.objectContaining({ label: 'Afhjælpning og kompensation' })
      ])
    )
  })
})

describe('runS3', () => {
  it('prioriterer konsekvensanalyser og håndtering af lokalsamfundsimpacts', () => {
    const input: ModuleInput = {
      S3: {
        communitiesIdentifiedCount: 5,
        impactAssessmentsCoveragePercent: 80,
        highRiskCommunitySharePercent: 25,
        grievancesOpenCount: 0,
        incidents: [
          {
            community: 'Fjordbyen',
            geography: 'Norge',
            impactType: 'environmentalDamage',
            householdsAffected: 40,
            severityLevel: 'medium',
            remediationStatus: 'inProgress',
            description: 'Udslip fra byggeplads påvirker fiskeri – midlertidig kompensation igangsat.'
          },
          {
            community: 'Skovlandsbyen',
            geography: 'Sverige',
            impactType: 'landRights',
            householdsAffected: 12,
            severityLevel: 'low',
            remediationStatus: 'completed',
            description: 'Aftale om adgangsveje indgået med lokalsamfundet.'
          }
        ],
        engagementNarrative:
          'Årlige FPIC-dialoger, borgerpaneler og samarbejde med lokale NGO’er for at sikre inklusion.',
        remedyNarrative:
          'Kompensationsfonde samt investering i infrastruktur projekter for de mest påvirkede områder.'
      }
    }

    const result = runS3(input)

    expect(result.value).toBeGreaterThan(60)
    expect(result.trace).toContain('impactAssessmentsCoveragePercent=80')
    expect(result.warnings).not.toContain('Ingen påvirkninger registreret endnu.')
    expect(result.esrsFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ conceptKey: 'S3CommunitiesIdentifiedCount', value: 5 }),
        expect.objectContaining({ conceptKey: 'S3ImpactsCount', value: 2 }),
        expect.objectContaining({ conceptKey: 'S3HouseholdsAffectedTotal', value: 52 }),
        expect.objectContaining({ conceptKey: 'S3EngagementNarrative', value: expect.stringContaining('FPIC') }),
        expect.objectContaining({ conceptKey: 'S3RemedyNarrative', value: expect.stringContaining('Kompensationsfonde') })
      ])
    )
    expect(result.esrsTables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          conceptKey: 'S3CommunityImpactsTable',
          rows: expect.arrayContaining([
            expect.objectContaining({ community: 'Fjordbyen', householdsAffected: 40 })
          ])
        })
      ])
    )
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Identificerede lokalsamfund', value: 5 }),
        expect.objectContaining({ label: 'Registrerede impacts', value: 2 }),
        expect.objectContaining({ label: 'Berørte husholdninger', value: 52 })
      ])
    )
    expect(result.tables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 's3-community-impacts', rows: expect.any(Array) })
      ])
    )
    expect(result.narratives).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Engagement og samarbejde' }),
        expect.objectContaining({ label: 'Afhjælpning og kompensation' })
      ])
    )
  })
})

describe('runS4', () => {
  it('kombinerer risikovurdering, klagehåndtering og hændelsesstyring', () => {
    const input: ModuleInput = {
      S4: {
        productsAssessedPercent: 70,
        complaintsResolvedPercent: 85,
        dataBreachesCount: 1,
        severeIncidentsCount: 1,
        recallsCount: 0,
        grievanceMechanismInPlace: true,
        escalationTimeframeDays: 20,
        issues: [
          {
            productOrService: 'SmartHome Hub',
            market: 'EU',
            issueType: 'productSafety',
            usersAffected: 120,
            severityLevel: 'medium',
            remediationStatus: 'completed',
            description: 'Firmwareopdatering reducerer risiko for overophedning.'
          },
          {
            productOrService: 'Cloud Backup',
            market: 'Global',
            issueType: 'dataPrivacy',
            usersAffected: 50,
            severityLevel: 'high',
            remediationStatus: 'inProgress',
            description: 'Dataeksponering under undersøgelse, midlertidige kontroller implementeret.'
          }
        ],
        vulnerableUsersNarrative:
          'Udvikler forenklet supportlinje og subsidier til seniorer samt handicapvenlige grænseflader.',
        consumerEngagementNarrative:
          'Kvartalsvise webinarer og samarbejde med forbrugerorganisationer om klare sikkerhedsanbefalinger.'
      }
    }

    const result = runS4(input)

    expect(result.value).toBeGreaterThan(50)
    expect(result.trace).toContain('productsAssessedPercent=70')
    expect(result.warnings).toContain('1 alvorlige hændelser rapporteret – offentliggør detaljer og kompensation.')
    expect(result.esrsFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ conceptKey: 'S4ProductsAssessedPercent', value: 70 }),
        expect.objectContaining({ conceptKey: 'S4IssuesCount', value: 2 }),
        expect.objectContaining({ conceptKey: 'S4VulnerableUsersNarrative', value: expect.stringContaining('supportlinje') }),
        expect.objectContaining({
          conceptKey: 'S4ConsumerEngagementNarrative',
          value: expect.stringContaining('forbrugerorganisationer')
        })
      ])
    )
    expect(result.esrsTables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          conceptKey: 'S4ConsumerIssuesTable',
          rows: expect.arrayContaining([
            expect.objectContaining({ productOrService: 'SmartHome Hub', usersAffected: 120 })
          ])
        })
      ])
    )
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Risikovurderede produkter', value: 70 }),
        expect.objectContaining({ label: 'Registrerede issues', value: 2 }),
        expect.objectContaining({ label: 'Berørte brugere', value: 170 })
      ])
    )
    expect(result.tables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 's4-issues', rows: expect.any(Array) })
      ])
    )
    expect(result.narratives).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Indsatser for udsatte brugere' }),
        expect.objectContaining({ label: 'Forbrugerengagement' })
      ])
    )
  })
})

describe('runG1', () => {
  it('aggregerer politikker, targets og bestyrelsestilsyn', () => {
    const input: ModuleInput = {
      G1: {
        boardOversight: true,
        governanceNarrative:
          'Bestyrelsen vurderer ESG-risici kvartalsvis og har etableret incitamenter til ledelsen.',
        policies: [
          { topic: 'ESG-politik', status: 'approved', owner: 'Legal', lastReviewed: '2024-02' },
          { topic: 'Whistleblower', status: 'draft', owner: null, lastReviewed: null }
        ],
        targets: [
          {
            topic: 'CSRD readiness',
            status: 'lagging',
            baselineYear: 2023,
            targetYear: 2025,
            targetValue: null,
            unit: null,
            narrative: null
          },
          {
            topic: 'Bestyrelsesuddannelse',
            status: 'onTrack',
            baselineYear: 2022,
            targetYear: 2024,
            targetValue: null,
            unit: null,
            narrative: null
          }
        ]
      }
    }

    const result = runG1(input)

    expect(result.value).toBeCloseTo(44)
    expect(result.warnings).toContain('Angiv ejer/ansvarlig for politikken "Whistleblower".')
    expect(result.trace).toContain('policy[0]=ESG-politik|status=approved|owner=Legal')
    expect(result.esrsFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ conceptKey: 'G1PolicyCount', value: 2 }),
        expect.objectContaining({ conceptKey: 'G1BoardOversight', value: true }),
        expect.objectContaining({
          conceptKey: 'G1GovernanceNarrative',
          value: expect.stringContaining('Bestyrelsen vurderer ESG-risici')
        })
      ])
    )
    expect(result.esrsTables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          conceptKey: 'G1PoliciesTable',
          rows: expect.arrayContaining([expect.objectContaining({ topic: 'ESG-politik' })])
        }),
        expect.objectContaining({
          conceptKey: 'G1TargetsTable',
          rows: expect.arrayContaining([expect.objectContaining({ topic: 'CSRD readiness' })])
        })
      ])
    )
  })
})

describe('runD2', () => {
  it('aggregerer scorer og fremhæver prioriterede emner', () => {
    const input: ModuleInput = {
      D2: {
        materialTopics: [
          { ...d2TopicWithFinancial },
          { ...d2TopicWithLowerFinancial },
          { ...d2TopicMissingFinancial }
        ]
      }
    }

    const result = runD2(input)

    expect(result.value).toBeCloseTo(58.1, 1)
    expect(result.unit).toBe(factors.d2.unit)
    expect(result.assumptions.some((entry) => entry.includes('Top prioriterede emner'))).toBe(true)
    expect(result.trace).toContain('inputTopics=3')
    expect(result.trace).toContain('validTopics=3')
    expect(result.trace.some((entry) => entry.includes('averageCompositeScore'))).toBe(true)
    expect(result.warnings.some((warning) => warning.includes('Prioriteret emne: Klimarisiko'))).toBe(true)
    expect(result.warnings.some((warning) => warning.includes('CSRD-gap mangler for Klimarisiko'))).toBe(true)
    expect(
      result.warnings.some((warning) => warning.includes('Finansiel score mangler for "Datastyring"'))
    ).toBe(true)
    expect(result.esrsFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ conceptKey: 'D2ValidTopicsCount', value: 3 }),
        expect.objectContaining({ conceptKey: 'D2PrioritisedTopicsCount', value: 1 })
      ])
    )
    expect(result.esrsTables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          conceptKey: 'D2MaterialTopicsTable',
          rows: expect.arrayContaining([
            expect.objectContaining({
              name: 'Klimarisiko i forsyningskæden',
              impactType: 'actual',
              severity: 'severe',
              likelihood: 'likely',
              priorityBand: 'priority'
            }),
            expect.objectContaining({
              name: 'Datastyring',
              missingFinancial: true,
              eligibleForPrioritisation: false,
              priorityBand: 'monitor'
            })
          ])
        })
      ])
    )

    expect(result.doubleMateriality).toEqual(
      expect.objectContaining({
        overview: expect.objectContaining({
          totalTopics: 3,
          prioritisedTopics: 1,
          attentionTopics: 1,
          gapAlerts: 2,
          averageScore: expect.any(Number)
        }),
        tables: expect.objectContaining({
          topics: expect.arrayContaining([
            expect.objectContaining({ name: 'Klimarisiko i forsyningskæden', priorityBand: 'priority' })
          ]),
          impactMatrix: expect.arrayContaining([
            expect.objectContaining({ severity: 'severe', likelihood: 'likely', topics: expect.any(Number) })
          ]),
          gapAlerts: expect.arrayContaining(['Klimarisiko i forsyningskæden'])
        }),
        dueDiligence: expect.objectContaining({
          impactTypes: expect.arrayContaining([
            expect.objectContaining({ key: 'actual', topics: expect.any(Number) })
          ])
        })
      })
    )
  })

  it('tillader prioritering når finansiel undtagelse er begrundet og bekræftet', () => {
    const input: ModuleInput = {
      D2: {
        materialTopics: [{ ...d2TopicMissingFinancialWithOverride }]
      }
    }

    const result = runD2(input)

    expect(result.value).toBeCloseTo(100, 1)
    expect(result.trace.some((entry) => entry.includes('financialOverride=approved'))).toBe(true)
    expect(
      result.warnings.some((warning) =>
        warning.includes('Finansiel undtagelse er bekræftet for "Lovpligtig compliance"')
      )
    ).toBe(true)
    expect(result.doubleMateriality?.overview?.prioritisedTopics).toBe(1)
    expect(result.esrsTables?.[0]?.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Lovpligtig compliance',
          missingFinancial: true,
          financialOverrideApproved: true,
          eligibleForPrioritisation: true
        })
      ])
    )
  })

  it('returnerer 0 ved manglende emner', () => {
    const result = runD2({ D2: { materialTopics: [] } })

    expect(result.value).toBe(0)
    expect(result.warnings).toContain(
      'Ingen væsentlige emner registreret. Tilføj materialitetsemner for at beregne prioritet.'
    )
  })
})

describe('runC10', () => {
  it('beregner upstream leasede aktiver med arealestimat og dokumentationsadvarsler', () => {
    const input: ModuleInput = {
      C10: {
        leasedAssetLines: [
          {
            energyType: 'electricity',
            floorAreaSqm: 1_500,
            energyConsumptionKwh: null,
            emissionFactorKgPerKwh: null,
            documentationQualityPercent: 55
          },
          {
            energyType: 'heat',
            floorAreaSqm: null,
            energyConsumptionKwh: 42_000,
            emissionFactorKgPerKwh: 0.09,
            documentationQualityPercent: 90
          }
        ]
      }
    }

    const result = runC10(input)

    expect(result.value).toBe(29.43)
    expect(result.unit).toBe(factors.c10.unit)
    expect(result.trace).toContain('line[0].energyBasis=areaDerived')
    expect(result.trace).toContain('line[1].energyBasis=reported')
    expect(result.warnings).toContain(
      'Feltet energyConsumptionKwh mangler på linje 1 og behandles som 0.'
    )
    expect(result.warnings).toContain(
      'Emissionsfaktor mangler på linje 1. Standardfaktor for Elektricitet anvendes.'
    )
    expect(result.warnings).toContain(
      'Dokumentationskvalitet for Elektricitet på linje 1 er kun 55%. Overvej at forbedre grundlaget.'
    )
  })

  it('filtrerer linjer uden gyldigt input og informerer brugeren', () => {
    const input: ModuleInput = {
      C10: {
        leasedAssetLines: [
          {
            energyType: 'heat',
            floorAreaSqm: -10,
            energyConsumptionKwh: -5,
            emissionFactorKgPerKwh: -0.2,
            documentationQualityPercent: 150
          }
        ]
      }
    }

    const result = runC10(input)

    expect(result.value).toBe(0)
    expect(result.warnings).toContain(
      'Feltet floorAreaSqm kan ikke være negativt på linje 1. 0 anvendes i stedet.'
    )
    expect(result.warnings).toContain(
      'Feltet energyConsumptionKwh kan ikke være negativt på linje 1. 0 anvendes i stedet.'
    )
    expect(result.warnings).toContain(
      'Emissionsfaktoren kan ikke være negativ på linje 1. 0 anvendes i stedet.'
    )
    expect(result.warnings).toContain(
      'Dokumentationskvalitet er begrænset til 100% på linje 1.'
    )
    expect(result.warnings).toContain(
      'Linje 1 mangler både areal og energiforbrug og udelades fra beregningen.'
    )
    expect(result.warnings).toContain(
      'Ingen gyldige leasede aktiver kunne beregnes. Kontrollér indtastningerne.'
    )
  })
})

describe('runC11', () => {
  it('beregner downstream leasede aktiver med blandet input og warns ved lav dokumentation', () => {
    const input: ModuleInput = {
      C11: {
        leasedAssetLines: [
          {
            energyType: 'heat',
            floorAreaSqm: 900,
            energyConsumptionKwh: null,
            emissionFactorKgPerKwh: null,
            documentationQualityPercent: 45
          },
          {
            energyType: 'electricity',
            floorAreaSqm: null,
            energyConsumptionKwh: 12_500,
            emissionFactorKgPerKwh: 0.2,
            documentationQualityPercent: 100
          }
        ]
      }
    }

    const result = runC11(input)

    expect(result.value).toBe(7.54)
    expect(result.unit).toBe(factors.c11.unit)
    expect(result.trace).toContain('line[0].energyBasis=areaDerived')
    expect(result.trace).toContain('line[1].energyBasis=reported')
    expect(result.warnings).toContain(
      'Feltet energyConsumptionKwh mangler på linje 1 og behandles som 0.'
    )
    expect(result.warnings).toContain(
      'Emissionsfaktor mangler på linje 1. Standardfaktor for Varme anvendes.'
    )
    expect(result.warnings).toContain(
      'Dokumentationskvalitet for Varme på linje 1 er kun 45%. Overvej at forbedre grundlaget.'
    )
  })

  it('udelader ugyldige linjer og informerer brugeren', () => {
    const input: ModuleInput = {
      C11: {
        leasedAssetLines: [
          {
            energyType: 'ukendt' as never,
            floorAreaSqm: -120,
            energyConsumptionKwh: -2_000,
            emissionFactorKgPerKwh: -0.5,
            documentationQualityPercent: 120
          }
        ]
      }
    }

    const result = runC11(input)

    expect(result.value).toBe(0)
    expect(result.warnings).toContain(
      'Ukendt energitype på linje 1. Standard (Elektricitet) anvendes.'
    )
    expect(result.warnings).toContain(
      'Feltet floorAreaSqm kan ikke være negativt på linje 1. 0 anvendes i stedet.'
    )
    expect(result.warnings).toContain(
      'Feltet energyConsumptionKwh kan ikke være negativt på linje 1. 0 anvendes i stedet.'
    )
    expect(result.warnings).toContain(
      'Emissionsfaktoren kan ikke være negativ på linje 1. 0 anvendes i stedet.'
    )
    expect(result.warnings).toContain(
      'Dokumentationskvalitet er begrænset til 100% på linje 1.'
    )
    expect(result.warnings).toContain(
      'Linje 1 mangler både areal og energiforbrug og udelades fra beregningen.'
    )
    expect(result.warnings).toContain(
      'Ingen gyldige leasede aktiver kunne beregnes. Kontrollér indtastningerne.'
    )
  })
})

describe('runC12', () => {
  it('beregner franchiselinjer for omsætning og energi og markerer lav dokumentation', () => {
    const input: ModuleInput = {
      C12: {
        franchiseLines: [
          {
            activityBasis: 'revenue',
            revenueDkk: 12_000_000,
            energyConsumptionKwh: null,
            emissionFactorKey: 'foodServiceRevenue',
            documentationQualityPercent: 55
          },
          {
            activityBasis: 'energy',
            revenueDkk: null,
            energyConsumptionKwh: 80_000,
            emissionFactorKey: 'districtHeatEnergy',
            documentationQualityPercent: 85
          }
        ]
      }
    }

    const result = runC12(input)

    expect(result.value).toBe(11.84)
    expect(result.unit).toBe(factors.c12.unit)
    expect(result.trace).toContain('line[0].activityBasis=revenue')
    expect(result.trace).toContain('line[1].activityBasis=energy')
    expect(result.warnings).toContain(
      'Dokumentationskvalitet for Fødevare- og servicefranchises – omsætning på linje 1 er kun 55%. Overvej at forbedre grundlaget.'
    )
  })

  it('håndterer ugyldig basis, manglende emissionsfaktor og capper dokumentationskvalitet', () => {
    const input: ModuleInput = {
      C12: {
        franchiseLines: [
          {
            activityBasis: 'ukendt' as never,
            revenueDkk: 2_000,
            energyConsumptionKwh: 4_000,
            emissionFactorKey: 'electricityEnergy' as never,
            documentationQualityPercent: 130
          },
          {
            activityBasis: 'energy',
            revenueDkk: null,
            energyConsumptionKwh: 5_000,
            emissionFactorKey: null,
            documentationQualityPercent: null
          }
        ]
      }
    }

    const result = runC12(input)

    expect(result.value).toBe(0.901)
    expect(result.trace).toContain('line[0].emissionFactorKey=retailRevenue')
    expect(result.trace).toContain('line[1].emissionFactorKey=electricityEnergy')
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'Ukendt aktivitetsbasis på linje 1. Omsætning anvendes som standard.',
        'Emissionsfaktor på linje 1 passer ikke til omsætning. Standard (Detailhandel – omsætning) anvendes.',
        'Dokumentationskvalitet er begrænset til 100% på linje 1.',
        'Feltet revenueDkk mangler på linje 2 og behandles som 0.',
        'Emissionsfaktor mangler på linje 2. Standardfaktor for Elektricitet – energiforbrug anvendes.',
        'Dokumentationskvalitet mangler på linje 2. Standard (100%) anvendes.'
      ])
    )
  })
})

describe('runC13', () => {
  it('beregner investeringslinjer og markerer lav dokumentation', () => {
    const input: ModuleInput = {
      C13: {
        investmentLines: [
          {
            investedAmountDkk: 25_000_000,
            emissionFactorKey: 'listedEquity',
            documentationQualityPercent: 55
          },
          {
            investedAmountDkk: 5_000_000,
            emissionFactorKey: 'privateEquity',
            documentationQualityPercent: 85
          }
        ]
      }
    }

    const result = runC13(input)

    expect(result.value).toBe(9.25)
    expect(result.unit).toBe(factors.c13.unit)
    expect(result.trace).toContain('line[0].investedAmountDkk=25000000')
    expect(result.trace).toContain('line[1].emissionFactorKey=privateEquity')
    expect(result.warnings).toContain(
      'Dokumentationskvalitet for Børsnoterede aktier på linje 1 er kun 55%. Overvej at forbedre grundlaget.'
    )
  })

  it('håndterer negative beløb, manglende faktorer og begrænser dokumentationskvalitet', () => {
    const input: ModuleInput = {
      C13: {
        investmentLines: [
          {
            investedAmountDkk: -5_000,
            emissionFactorKey: 'corporateBonds',
            documentationQualityPercent: 40
          },
          {
            investedAmountDkk: 200_000,
            emissionFactorKey: 'ukendt' as never,
            documentationQualityPercent: 150
          },
          {
            investedAmountDkk: 100_000,
            emissionFactorKey: null,
            documentationQualityPercent: null
          }
        ]
      }
    }

    const result = runC13(input)

    expect(result.value).toBe(0.084)
    expect(result.trace).toContain('line[0].emissionFactorKey=listedEquity')
    expect(result.trace).toContain('line[1].emissionFactorKey=listedEquity')
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'Feltet investedAmountDkk kan ikke være negativt på linje 1. 0 anvendes i stedet.',
        'Linje 1 mangler investeret beløb og udelades fra beregningen.',
        'Ukendt emissionsfaktor på linje 2. Standard (Børsnoterede aktier) anvendes.',
        'Dokumentationskvalitet er begrænset til 100% på linje 2.',
        'Emissionsfaktor mangler på linje 3. Standard (Børsnoterede aktier) anvendes.',
        'Dokumentationskvalitet mangler på linje 3. Standard (100%) anvendes.'
      ])
    )
  })
})

describe('runC14', () => {
  it('beregner behandling af solgte produkter og markerer lav dokumentation', () => {
    const input: ModuleInput = {
      C14: {
        treatmentLines: [
          {
            treatmentType: 'recycling',
            tonnesTreated: 120,
            emissionFactorKey: 'recyclingOptimised',
            documentationQualityPercent: 65
          },
          {
            treatmentType: 'incineration',
            tonnesTreated: 75,
            emissionFactorKey: 'incinerationNoRecovery',
            documentationQualityPercent: 55
          }
        ]
      }
    }

    const result = runC14(input)

    expect(result.value).toBe(81.9)
    expect(result.unit).toBe(factors.c14.unit)
    expect(result.trace).toContain('line[0].treatedTonnage=120')
    expect(result.trace).toContain('line[1].emissionFactorKey=incinerationNoRecovery')
    expect(result.warnings).toContain(
      'Dokumentationskvalitet for Forbrænding uden energiudnyttelse på linje 2 er kun 55%. Overvej at forbedre grundlaget.'
    )
  })

  it('håndterer negative værdier, ukendte typer og manglende faktorer', () => {
    const input: ModuleInput = {
      C14: {
        treatmentLines: [
          {
            treatmentType: 'recycling',
            tonnesTreated: -10,
            emissionFactorKey: 'recyclingConservative',
            documentationQualityPercent: 50
          },
          {
            treatmentType: 'ukendt' as never,
            tonnesTreated: 40,
            emissionFactorKey: 'incinerationEnergyRecovery',
            documentationQualityPercent: 120
          },
          {
            treatmentType: 'landfill',
            tonnesTreated: 20,
            emissionFactorKey: null,
            documentationQualityPercent: null
          }
        ]
      }
    }

    const result = runC14(input)

    expect(result.value).toBe(28)
    expect(result.trace).toContain('line[0].treatmentType=recycling')
    expect(result.trace).toContain('line[1].emissionFactorKey=landfillManaged')
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'Feltet tonnesTreated kan ikke være negativt på linje 1. 0 anvendes i stedet.',
        'Linje 1 mangler tonnage og udelades fra beregningen.',
        'Ukendt behandlingstype på linje 2. Genanvendelse anvendes som standard.',
        'Valgt emissionsfaktor passer ikke til behandlingen på linje 2. Standard (Genanvendelse – blandet fraktion) anvendes.',
        'Dokumentationskvalitet er begrænset til 100% på linje 2.',
        'Emissionsfaktor mangler på linje 3. Standard (Deponi – kontrolleret anlæg) anvendes.',
        'Dokumentationskvalitet mangler på linje 3. Standard (100%) anvendes.'
      ])
    )
  })
})

describe('runC15', () => {
  it('beregner screening for øvrige kategorier og markerer lav dokumentation', () => {
    const input: ModuleInput = {
      C15: {
        screeningLines: [
          {
            category: '14',
            description: 'Franchisefilialer',
            quantityUnit: 'DKK',
            estimatedQuantity: 1_200_000,
            emissionFactorKey: 'category14Franchises',
            documentationQualityPercent: 55
          },
          {
            category: '5',
            description: 'Restaffald',
            quantityUnit: 'ton',
            estimatedQuantity: 18,
            emissionFactorKey: 'category5Waste',
            documentationQualityPercent: 92
          }
        ]
      }
    }

    const result = runC15(input)

    expect(result.value).toBe(293.76)
    expect(result.unit).toBe(factors.c15.unit)
    expect(result.trace).toContain('line[0].category=14')
    expect(result.trace).toContain('line[1].quantityUnit=ton')
    expect(result.warnings).toContain(
      'Dokumentationskvalitet for Kategori 14 – Franchises på linje 1 er kun 55%. Overvej at forbedre datagrundlaget.'
    )
  })

  it('håndterer ugyldige kategorier, negative mængder og manglende faktorer', () => {
    const input: ModuleInput = {
      C15: {
        screeningLines: [
          {
            category: '99' as never,
            description: 'Ugyldig kategori',
            quantityUnit: 'km',
            estimatedQuantity: -10,
            emissionFactorKey: 'ukendt' as never,
            documentationQualityPercent: 150
          },
          {
            category: '3',
            description: null,
            quantityUnit: null,
            estimatedQuantity: null,
            emissionFactorKey: null,
            documentationQualityPercent: null
          }
        ]
      }
    }

    const result = runC15(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('line[0].category=1')
    expect(result.trace).toContain('line[1].emissionFactorKey=category3Energy')
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'Ukendt kategori på linje 1. Kategori 1 – Indkøbte varer og services anvendes som standard.',
        'Estimeret mængde kan ikke være negativ på linje 1. 0 anvendes i stedet.',
        'Ugyldig emissionsfaktor valgt på linje 1. Standard for Kategori 1 – Indkøbte varer og services anvendes.',
        'Dokumentationskvalitet er begrænset til 100% på linje 1.',
        'Emissionsfaktor mangler på linje 2. Standardfaktor for Kategori 3 – Brændstof- og energirelaterede emissioner (upstream) anvendes.',
        'Dokumentationskvalitet mangler på linje 2. Standard (100%) anvendes.'
      ])
    )
  })
})

describe('runA1', () => {
  it('summerer brændsler med standardfaktorer og markerer lav dokumentation', () => {
    const input: ModuleInput = {
      A1: {
        fuelConsumptions: [
          {
            fuelType: 'naturgas',
            unit: 'Nm³',
            quantity: 1_200,
            emissionFactorKgPerUnit: null,
            documentationQualityPercent: 85
          },
          {
            fuelType: 'diesel',
            unit: 'liter',
            quantity: 500,
            emissionFactorKgPerUnit: 2.68,
            documentationQualityPercent: 55
          }
        ]
      }
    }

    const result = runA1(input)

    expect(result.value).toBe(3.8)
    expect(result.unit).toBe(factors.a1.unit)
    expect(result.trace).toContain('totalEmissionsKg=3800')
    expect(result.assumptions).toContain(
      'Standardfaktor for Naturgas: 2.05 kg CO2e/Nm³.'
    )
    expect(result.warnings).toContain(
      'Emissionsfaktor mangler på linje 1. Standardfaktor for Naturgas anvendes.'
    )
    expect(result.warnings).toContain(
      'Dokumentationskvalitet for Diesel er kun 55%. Overvej at forbedre dokumentation eller anvende konservative antagelser.'
    )
  })
})

describe('runB1', () => {
  it('beregner nettoemission med vedvarende reduktion', () => {
    const input: ModuleInput = {
      B1: {
        electricityConsumptionKwh: 120_000,
        emissionFactorKgPerKwh: 0.233,
        renewableSharePercent: 40
      }
    }

    const result = runB1(input)

    expect(result.value).toBe(17.894)
    expect(result.unit).toBe(factors.b1.unit)
    expect(result.warnings).toEqual([])
    expect(result.trace).toContain('renewableReductionKg=10065.6')
  })

  it('håndterer negative og manglende værdier med advarsler', () => {
    const input: ModuleInput = {
      B1: {
        electricityConsumptionKwh: -10,
        emissionFactorKgPerKwh: null,
        renewableSharePercent: 140
      }
    }

    const result = runB1(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('renewableSharePercent=100')
    expect(result.warnings).toEqual([
      'Feltet electricityConsumptionKwh kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet emissionFactorKgPerKwh mangler og behandles som 0.',
      'Andelen af vedvarende energi er begrænset til 100%.'
    ])
  })
})

describe('runB2', () => {
  it('beregner nettoemission med fradrag for genindvinding og vedvarende andel', () => {
    const input: ModuleInput = {
      B2: {
        heatConsumptionKwh: 80_000,
        recoveredHeatKwh: 5_000,
        emissionFactorKgPerKwh: 0.12,
        renewableSharePercent: 30
      }
    }

    const result = runB2(input)

    expect(result.value).toBe(6.705)
    expect(result.unit).toBe(factors.b2.unit)
    expect(result.warnings).toEqual([])
    expect(result.trace).toContain('netHeatConsumptionKwh=75000')
  })

  it('håndterer ugyldige værdier og advarer om for højt fradrag', () => {
    const input: ModuleInput = {
      B2: {
        heatConsumptionKwh: 10_000,
        recoveredHeatKwh: 12_500,
        emissionFactorKgPerKwh: -0.1,
        renewableSharePercent: 150
      }
    }

    const result = runB2(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('emissionFactorKgPerKwh=0')
    expect(result.warnings).toEqual([
      'Feltet emissionFactorKgPerKwh kan ikke være negativt. 0 anvendes i stedet.',
      'Andelen af vedvarende energi er begrænset til 100%.',
      'Genindvundet varme overstiger det registrerede forbrug. Nettoforbruget sættes til 0.'
    ])
  })
})

describe('runB3', () => {
  it('beregner nettoemission med fradrag for frikøling og vedvarende andel', () => {
    const input: ModuleInput = {
      B3: {
        coolingConsumptionKwh: 50_000,
        recoveredCoolingKwh: 4_000,
        emissionFactorKgPerKwh: 0.05,
        renewableSharePercent: 20
      }
    }

    const result = runB3(input)

    expect(result.value).toBe(1.886)
    expect(result.unit).toBe(factors.b3.unit)
    expect(result.warnings).toEqual([])
    expect(result.trace).toContain('netCoolingConsumptionKwh=46000')
  })

  it('håndterer ugyldige værdier og advarer om for højt fradrag', () => {
    const input: ModuleInput = {
      B3: {
        coolingConsumptionKwh: 5_000,
        recoveredCoolingKwh: 7_500,
        emissionFactorKgPerKwh: -0.03,
        renewableSharePercent: 130
      }
    }

    const result = runB3(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('emissionFactorKgPerKwh=0')
    expect(result.warnings).toEqual([
      'Feltet emissionFactorKgPerKwh kan ikke være negativt. 0 anvendes i stedet.',
      'Andelen af vedvarende energi er begrænset til 100%.',
      'Genindvundet køling overstiger det registrerede forbrug. Nettoforbruget sættes til 0.'
    ])
  })
})

describe('runB4', () => {
  it('beregner nettoemission med fradrag for genanvendt damp og vedvarende andel', () => {
    const input: ModuleInput = {
      B4: {
        steamConsumptionKwh: 40_000,
        recoveredSteamKwh: 3_000,
        emissionFactorKgPerKwh: 0.09,
        renewableSharePercent: 25
      }
    }

    const result = runB4(input)

    expect(result.value).toBe(2.622)
    expect(result.unit).toBe(factors.b4.unit)
    expect(result.warnings).toEqual([])
    expect(result.trace).toContain('netSteamConsumptionKwh=37000')
  })

  it('håndterer ugyldige værdier og advarer om for højt fradrag', () => {
    const input: ModuleInput = {
      B4: {
        steamConsumptionKwh: 1_000,
        recoveredSteamKwh: 1_500,
        emissionFactorKgPerKwh: -0.1,
        renewableSharePercent: 120
      }
    }

    const result = runB4(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('emissionFactorKgPerKwh=0')
    expect(result.warnings).toEqual([
      'Feltet emissionFactorKgPerKwh kan ikke være negativt. 0 anvendes i stedet.',
      'Andelen af vedvarende energi er begrænset til 100%.',
      'Genindvundet damp overstiger det registrerede forbrug. Nettoforbruget sættes til 0.'
    ])
  })
})

describe('runB5', () => {
  it('beregner nettoemission for øvrige energileverancer', () => {
    const input: ModuleInput = {
      B5: {
        otherEnergyConsumptionKwh: 25_000,
        recoveredEnergyKwh: 2_000,
        emissionFactorKgPerKwh: 0.07,
        renewableSharePercent: 35
      }
    }

    const result = runB5(input)

    expect(result.value).toBe(1.159)
    expect(result.unit).toBe(factors.b5.unit)
    expect(result.warnings).toEqual([])
    expect(result.trace).toContain('netOtherEnergyConsumptionKwh=23000')
  })

  it('håndterer ugyldige værdier og capper vedvarende andel', () => {
    const input: ModuleInput = {
      B5: {
        otherEnergyConsumptionKwh: 1_000,
        recoveredEnergyKwh: 1_500,
        emissionFactorKgPerKwh: -0.2,
        renewableSharePercent: 140
      }
    }

    const result = runB5(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('emissionFactorKgPerKwh=0')
    expect(result.warnings).toEqual([
      'Feltet emissionFactorKgPerKwh kan ikke være negativt. 0 anvendes i stedet.',
      'Andelen af vedvarende energi er begrænset til 100%.',
      'Genindvundet energi overstiger det registrerede forbrug. Nettoforbruget sættes til 0.'
    ])
  })
})

describe('runB6', () => {
  it('beregner emission fra nettab med vedvarende reduktion', () => {
    const input: ModuleInput = {
      B6: {
        electricitySuppliedKwh: 120_000,
        gridLossPercent: 6,
        emissionFactorKgPerKwh: 0.233,
        renewableSharePercent: 30
      }
    }

    const result = runB6(input)

    expect(result.value).toBe(1.225)
    expect(result.unit).toBe(factors.b6.unit)
    expect(result.warnings).toEqual([])
    expect(result.trace).toContain('lossEnergyKwh=7200')
  })

  it('cappper nettab og vedvarende andel samt håndterer manglende værdier', () => {
    const input: ModuleInput = {
      B6: {
        electricitySuppliedKwh: -100,
        gridLossPercent: 45,
        emissionFactorKgPerKwh: null,
        renewableSharePercent: 130
      }
    }

    const result = runB6(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain(`gridLossPercent=${factors.b6.maximumGridLossPercent}`)
    expect(result.trace).toContain('emissionFactorKgPerKwh=0')
    expect(result.warnings).toEqual([
      'Feltet electricitySuppliedKwh kan ikke være negativt. 0 anvendes i stedet.',
      `Nettab i elnettet er begrænset til ${factors.b6.maximumGridLossPercent}%.`,
      'Feltet emissionFactorKgPerKwh mangler og behandles som 0.',
      'Andelen af vedvarende energi er begrænset til 100%.'
    ])
  })
})

describe('runB7', () => {
  it('beregner revisionsrobust reduktion baseret på dokumenteret vedvarende el', () => {
    const input: ModuleInput = {
      B7: {
        documentedRenewableKwh: 12_000,
        residualEmissionFactorKgPerKwh: 0.233,
        documentationQualityPercent: 90
      }
    }

    const result = runB7(input)

    expect(result.value).toBe(-2.391)
    expect(result.unit).toBe(factors.b7.unit)
    expect(result.trace).toContain('qualityAdjustedKwh=10260')
    expect(result.warnings).toEqual([])
  })

  it('håndterer ugyldig dokumentation og emissionfaktor med passende advarsler', () => {
    const input: ModuleInput = {
      B7: {
        documentedRenewableKwh: -100,
        residualEmissionFactorKgPerKwh: null,
        documentationQualityPercent: 150
      }
    }

    const result = runB7(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('documentationQualityPercent=100')
    expect(result.warnings).toEqual([
      'Feltet documentedRenewableKwh kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet residualEmissionFactorKgPerKwh mangler og behandles som 0.',
      'Dokumentationskvalitet er begrænset til 100%.'
    ])
  })

  it('advarer når dokumentationskvalitet er lav eller nul', () => {
    const input: ModuleInput = {
      B7: {
        documentedRenewableKwh: 5_000,
        residualEmissionFactorKgPerKwh: 0.2,
        documentationQualityPercent: 5
      }
    }

    const result = runB7(input)

    expect(result.value).toBe(-0.048)
    expect(result.trace).toContain('documentationQualityPercent=5')
    expect(result.warnings).toEqual([
      'Dokumentationskvalitet under 10% kan blive udfordret i revision.'
    ])
  })
})

describe('runB8', () => {
  it('beregner reduktion baseret på egenproduceret og selvforbrugt vedvarende el', () => {
    const input: ModuleInput = {
      B8: {
        onSiteRenewableKwh: 15_000,
        exportedRenewableKwh: 2_000,
        residualEmissionFactorKgPerKwh: 0.233,
        documentationQualityPercent: 95
      }
    }

    const result = runB8(input)

    expect(result.value).toBe(-2.59)
    expect(result.unit).toBe(factors.b8.unit)
    expect(result.trace).toContain('netSelfConsumptionKwh=13000')
    expect(result.warnings).toEqual([])
  })

  it('håndterer negative værdier og høj eksport med advarsler', () => {
    const input: ModuleInput = {
      B8: {
        onSiteRenewableKwh: -100,
        exportedRenewableKwh: 500,
        residualEmissionFactorKgPerKwh: null,
        documentationQualityPercent: 5
      }
    }

    const result = runB8(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('exportedRenewableKwh=500')
    expect(result.warnings).toEqual([
      'Feltet onSiteRenewableKwh kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet residualEmissionFactorKgPerKwh mangler og behandles som 0.',
      'Eksporteret vedvarende el overstiger produktionen. Nettoreduktionen sættes til 0.',
      'Dokumentationskvalitet under 15% kan blive udfordret i revision.'
    ])
  })
})

describe('runB9', () => {
  it('beregner reduktion for en PPA-leverance efter nettab og kvalitet', () => {
    const input: ModuleInput = {
      B9: {
        ppaDeliveredKwh: 12_000,
        matchedConsumptionKwh: 11_000,
        gridLossPercent: 3,
        residualEmissionFactorKgPerKwh: 0.233,
        documentationQualityPercent: 90
      }
    }

    const result = runB9(input)

    expect(result.value).toBe(-2.058)
    expect(result.unit).toBe(factors.b9.unit)
    expect(result.trace).toContain('netMatchedKwh=10670')
    expect(result.warnings).toEqual([])
  })

  it('håndterer ugyldige værdier og matcher forbrug med leverance', () => {
    const input: ModuleInput = {
      B9: {
        ppaDeliveredKwh: -500,
        matchedConsumptionKwh: 800,
        gridLossPercent: 40,
        residualEmissionFactorKgPerKwh: null,
        documentationQualityPercent: 10
      }
    }

    const result = runB9(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('gridLossPercent=15')
    expect(result.warnings).toEqual([
      'Feltet ppaDeliveredKwh kan ikke være negativt. 0 anvendes i stedet.',
      'Nettab er begrænset til 15%.',
      'Feltet residualEmissionFactorKgPerKwh mangler og behandles som 0.',
      'Dokumentationskvalitet under 20% kan blive udfordret i revision.',
      'Forbrugsdata overstiger PPA-leverancen. Overskydende mængde ignoreres.'
    ])
  })
})

describe('runB10', () => {
  it('beregner reduktion for en virtuel PPA efter settlement og kvalitet', () => {
    const input: ModuleInput = {
      B10: {
        ppaSettledKwh: 12_000,
        matchedConsumptionKwh: 11_000,
        marketSettlementPercent: 85,
        residualEmissionFactorKgPerKwh: 0.233,
        documentationQualityPercent: 80
      }
    }

    const result = runB10(input)

    expect(result.value).toBe(-1.534)
    expect(result.unit).toBe(factors.b10.unit)
    expect(result.trace).toContain('settlementAdjustedKwh=9350')
    expect(result.warnings).toEqual([])
  })

  it('håndterer ugyldige værdier og settlement med advarsler', () => {
    const input: ModuleInput = {
      B10: {
        ppaSettledKwh: 500,
        matchedConsumptionKwh: 800,
        marketSettlementPercent: -5,
        residualEmissionFactorKgPerKwh: null,
        documentationQualityPercent: 150
      }
    }

    const result = runB10(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('marketSettlementPercent=0')
    expect(result.warnings).toEqual([
      'Finansiel dækning kan ikke være negativ. 0% anvendes.',
      'Feltet residualEmissionFactorKgPerKwh mangler og behandles som 0.',
      'Dokumentationskvalitet er begrænset til 100%.',
      'Forbrugsdata overstiger PPA-leverancen. Overskydende mængde ignoreres.',
      'Finansiel dækning på 0% betyder, at ingen reduktion kan bogføres.'
    ])
  })
})

describe('runB11', () => {
  it('beregner reduktion med timekorrelation og dokumentationsjustering', () => {
    const input: ModuleInput = {
      B11: {
        certificatesRetiredKwh: 12_000,
        matchedConsumptionKwh: 11_000,
        timeCorrelationPercent: 85,
        residualEmissionFactorKgPerKwh: 0.233,
        documentationQualityPercent: 90
      }
    }

    const result = runB11(input)

    expect(result.value).toBe(-1.5)
    expect(result.unit).toBe(factors.b11.unit)
    expect(result.warnings).toEqual([])
    expect(result.trace).toContain('timeAdjustedKwh=8415')
  })

  it('håndterer ugyldige værdier og giver relevante advarsler', () => {
    const input: ModuleInput = {
      B11: {
        certificatesRetiredKwh: -100,
        matchedConsumptionKwh: 500,
        timeCorrelationPercent: 20,
        residualEmissionFactorKgPerKwh: -0.1,
        documentationQualityPercent: null
      }
    }

    const result = runB11(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('timeCorrelationPercent=20')
    expect(result.warnings).toHaveLength(5)
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'Feltet certificatesRetiredKwh kan ikke være negativt. 0 anvendes i stedet.',
        'Forbrugsdata overstiger certificeret mængde. Overskydende energi ignoreres.',
        'Timekorrelation under 50% kan blive udfordret i revision.',
        'Feltet residualEmissionFactorKgPerKwh kan ikke være negativt. 0 anvendes i stedet.',
        'Dokumentationskvalitet mangler og behandles som 0%.'
      ])
    )
  })

  it('tilføjer E1-intensiteter, trend og målstatus når kontekst er udfyldt', () => {
    const input: ModuleInput = {
      E1Context: {
        netRevenueDkk: 50_000_000,
        productionVolume: 10_000,
        productionUnit: 'stk.',
        employeesFte: 200,
        totalEnergyConsumptionKwh: 180_000,
        energyProductionKwh: 12_000,
        renewableEnergyProductionKwh: 12_000,
        energyMixLines: [
          {
            energyType: 'electricity',
            consumptionKwh: 120_000,
            sharePercent: 66,
            documentationQualityPercent: 95,
          },
          {
            energyType: 'districtHeat',
            consumptionKwh: 60_000,
            sharePercent: 34,
            documentationQualityPercent: 80,
          }
        ],
        previousYearScope1Tonnes: null,
        previousYearScope2Tonnes: 35,
        previousYearScope3Tonnes: null
      },
      E1Targets: {
        targets: [
          {
            id: 'scope2-main',
            name: 'Scope 2 reduktion',
            scope: 'scope2',
            targetYear: 2026,
            targetValueTonnes: 20,
            baselineYear: 2023,
            baselineValueTonnes: 40,
            owner: 'Energiansvarlig',
            status: 'lagging',
            description: null
          }
        ]
      },
      B1: {
        electricityConsumptionKwh: 80_000,
        emissionFactorKgPerKwh: 0.233,
        renewableSharePercent: 20
      }
    }

    const result = runB1(input)

    expect(result.intensities?.map((entry) => entry.basis)).toEqual(
      expect.arrayContaining(['netRevenue', 'production', 'energy'])
    )
    expect(
      result.esrsFacts?.some(
        (fact) => fact.conceptKey === 'E1IntensityLocationBasedPerNetRevenue',
      ),
    ).not.toBe(true)
    expect(result.trend).toMatchObject({ previousValue: 35, unit: result.unit })
    expect(result.targetProgress).toMatchObject({ scope: 'scope2', owner: 'Energiansvarlig' })
    expect(result.energyMix).toBeDefined()
    expect(result.trace).toEqual(expect.arrayContaining([expect.stringContaining('targetProgress.status=')]))
  })
})

describe('runC1', () => {
  it('beregner pendlingsemissioner med reduktion for fjernarbejde', () => {
    const input: ModuleInput = {
      C1: {
        employeesCovered: 120,
        averageCommuteDistanceKm: 18,
        commutingDaysPerWeek: 3,
        weeksPerYear: 44,
        remoteWorkSharePercent: 25,
        emissionFactorKgPerKm: 0.142
      }
    }

    const result = runC1(input)

    expect(result.value).toBe(30.365)
    expect(result.unit).toBe(factors.c1.unit)
    expect(result.warnings).toEqual([])
    expect(result.trace).toContain('totalDistanceKm=213840')
  })

  it('håndterer manglende og ugyldige værdier med advarsler', () => {
    const input: ModuleInput = {
      C1: {
        employeesCovered: -5,
        averageCommuteDistanceKm: null,
        commutingDaysPerWeek: 12,
        weeksPerYear: 70,
        remoteWorkSharePercent: 180,
        emissionFactorKgPerKm: -0.3
      }
    }

    const result = runC1(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('weeksPerYear=52')
    expect(result.warnings).toEqual([
      'Feltet employeesCovered kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet averageCommuteDistanceKm mangler og behandles som 0.',
      'Feltet commutingDaysPerWeek er begrænset til 7.',
      'Feltet weeksPerYear er begrænset til 52 uger.',
      'Feltet remoteWorkSharePercent er begrænset til 100%.',
      'Feltet emissionFactorKgPerKm kan ikke være negativt. 0 anvendes i stedet.'
    ])
  })
})

describe('runE1Targets', () => {
  it('opsummerer mål og planlagte handlinger', () => {
    const result = runE1Targets(e1TargetsFixture)

    expect(result.value).toBe(2)
    expect(result.unit).toBe('mål')
    expect(result.targetsOverview).toBeDefined()
    expect(result.targetsOverview?.[0]).toMatchObject({ id: 'scope1-1', scope: 'scope1' })
    expect(result.plannedActions?.length).toBe(2)
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Samlet energiforbrug', value: 1_950_000 }),
        expect.objectContaining({ label: 'Vedvarende energiandel', value: 9.2 }),
        expect.objectContaining({ label: 'Ikke-vedvarende energiandel', value: 90.8 }),
        expect.objectContaining({ label: 'Dokumentationskvalitet', value: 80 }),
      ]),
    )
    expect(result.energyMix?.length).toBe(3)
    expect(result.tables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'e1-energy-mix',
          rows: expect.arrayContaining([
            expect.objectContaining({ energyType: 'Elektricitet', sharePercent: 70 }),
          ]),
        }),
      ]),
    )
    expect(result.trace).toEqual(expect.arrayContaining(['targets.onTrack=1', 'targets.lagging=1']))
    expect(result.warnings).toEqual([])
    expect(result.esrsFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ conceptKey: 'E1TargetsPresent', value: true }),
        expect.objectContaining({ conceptKey: 'E1TargetsNarrative', value: expect.stringContaining('Scope 1 reduktion') }),
        expect.objectContaining({ conceptKey: 'E1EnergyConsumptionTotalKwh', value: 1_950_000 }),
        expect.objectContaining({ conceptKey: 'E1EnergyConsumptionRenewableKwh', value: 180_000 }),
        expect.objectContaining({ conceptKey: 'E1EnergyConsumptionNonRenewableKwh', value: 1_770_000 }),
        expect.objectContaining({ conceptKey: 'E1EnergyRenewableSharePercent', value: 9.2 }),
        expect.objectContaining({ conceptKey: 'E1EnergyNonRenewableSharePercent', value: 90.8 }),
        expect.objectContaining({ conceptKey: 'E1EnergyRenewableProductionKwh', value: 180_000 }),
        expect.objectContaining({ conceptKey: 'E1EnergyNonRenewableProductionKwh', value: 70_000 }),
      ]),
    )
    expect(result.esrsTables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          conceptKey: 'E1TargetsTable',
          rows: expect.arrayContaining([
            expect.objectContaining({ scope: 'scope1', targetYear: 2027, status: 'lagging' }),
          ]),
        }),
        expect.objectContaining({
          conceptKey: 'E1EnergyMixTable',
          rows: expect.arrayContaining([
            expect.objectContaining({ energyType: 'electricity', consumptionKwh: 1_500_000 }),
          ]),
        }),
      ]),
    )
  })
})

describe('runE1Scenarios', () => {
  it('normaliserer scenarier og udsender ESRS-facts', () => {
    const result = runE1Scenarios(e1NewModulesFixture)

    expect(result.value).toBe(2)
    expect(result.unit).toBe('scenarier')
    expect(result.scenarios?.length).toBe(2)
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Gennemsnitlig dækningsgrad', value: 62.5 }),
      ]),
    )
    expect(result.esrsFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ conceptKey: 'E1ScenariosDiverseRange', value: true }),
        expect.objectContaining({ conceptKey: 'E1ScenariosNarrative' }),
      ]),
    )
  })
})

describe('runE1CarbonPrice', () => {
  it('beregner gennemsnitspris og dækning for CO₂-ordninger', () => {
    const result = runE1CarbonPrice(e1NewModulesFixture)

    expect(result.value).toBe(2)
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Gennemsnitlig CO₂-pris', value: 675 }),
        expect.objectContaining({ label: 'Gennemsnitlig dækningsgrad', value: 47.5 }),
      ]),
    )
    expect(result.esrsFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ conceptKey: 'E1CarbonPriceAmount', value: 675 }),
        expect.objectContaining({ conceptKey: 'E1CarbonPriceAlignment', value: true }),
      ]),
    )
    expect(result.carbonPriceSchemes?.[0]).toMatchObject({ scheme: 'Investeringsscreening', scope: 'combined' })
  })
})

describe('runE1RiskGeography', () => {
  it('summerer aktiver og omsætning på tværs af risikokategorier', () => {
    const result = runE1RiskGeography(e1NewModulesFixture)

    expect(result.value).toBe(2)
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Aktiver eksponeret for fysisk risiko', value: 120000000 }),
        expect.objectContaining({ label: 'Aktiver eksponeret for transitionrisiko', value: 80000000 }),
      ]),
    )
    expect(result.esrsFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ conceptKey: 'E1RiskPhysicalAssets', value: 120000000 }),
        expect.objectContaining({ conceptKey: 'E1RiskTransitionRevenue', value: 65000000 }),
      ]),
    )
  })
})

describe('runE1DecarbonisationDrivers', () => {
  it('opsummerer reduktioner og investeringer', () => {
    const result = runE1DecarbonisationDrivers(e1NewModulesFixture)

    expect(result.value).toBe(4600)
    expect(result.unit).toBe('tCO₂e')
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Antal drivere', value: 2 }),
        expect.objectContaining({ label: 'Forventet reduktion', value: 4600 }),
        expect.objectContaining({ label: 'Estimeret investering', value: 17500000 }),
      ]),
    )
    expect(result.decarbonisationDrivers?.[0]).toMatchObject({ lever: 'energyEfficiency', name: 'LED og varmegenvinding' })
    expect(result.esrsFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ conceptKey: 'E1DecarbonisationLeverTypes', value: expect.stringContaining('energyEfficiency') }),
      ]),
    )
    expect(result.esrsTables?.[0]?.conceptKey).toBe('E1DecarbonisationTable')
  })
})

describe('runC2', () => {
  it('beregner emissioner for forretningsrejser med virtuelle reduktioner', () => {
    const input: ModuleInput = {
      C2: {
        airTravelDistanceKm: 12_000,
        airEmissionFactorKgPerKm: 0.158,
        railTravelDistanceKm: 3_000,
        railEmissionFactorKgPerKm: 0.014,
        roadTravelDistanceKm: 8_000,
        roadEmissionFactorKgPerKm: 0.192,
        hotelNights: 220,
        hotelEmissionFactorKgPerNight: 12,
        virtualMeetingSharePercent: 20
      }
    }

    const result = runC2(input)

    expect(result.value).toBe(5.419)
    expect(result.unit).toBe(factors.c2.unit)
    expect(result.warnings).toEqual([])
    const adjustedLine = result.trace.find((line) =>
      line.startsWith('adjustedTravelEmissionsKg=')
    )
    expect(adjustedLine).toBeDefined()
    expect(Number(adjustedLine?.split('=')[1])).toBeCloseTo(2779.2, 6)
  })

  it('håndterer manglende og ugyldige værdier med standardfaktor for hotel', () => {
    const input: ModuleInput = {
      C2: {
        airTravelDistanceKm: -100,
        airEmissionFactorKgPerKm: -0.3,
        railTravelDistanceKm: null,
        railEmissionFactorKgPerKm: null,
        roadTravelDistanceKm: 5_000,
        roadEmissionFactorKgPerKm: 0.2,
        hotelNights: 10,
        hotelEmissionFactorKgPerNight: null,
        virtualMeetingSharePercent: 160
      }
    }

    const result = runC2(input)

    expect(result.value).toBe(0.15)
    expect(result.trace).toContain('virtualReductionRatio=1')
    expect(result.warnings).toEqual([
      'Feltet airTravelDistanceKm kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet airEmissionFactorKgPerKm kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet railTravelDistanceKm mangler og behandles som 0.',
      'Feltet railEmissionFactorKgPerKm mangler og behandles som 0.',
      'Feltet hotelEmissionFactorKgPerNight mangler. Standardfaktoren 15 anvendes.',
      'Feltet virtualMeetingSharePercent er begrænset til 100%.'
    ])
  })
})

describe('runC3', () => {
  it('beregner upstream emissioner med nettab og vedvarende reduktion', () => {
    const input: ModuleInput = {
      C3: {
        purchasedElectricityKwh: 120_000,
        electricityUpstreamEmissionFactorKgPerKwh: 0.05,
        transmissionLossPercent: 8,
        renewableSharePercent: 35,
        fuelConsumptionKwh: 40_000,
        fuelUpstreamEmissionFactorKgPerKwh: 0.07
      }
    }

    const result = runC3(input)

    expect(result.value).toBe(7.466)
    expect(result.unit).toBe(factors.c3.unit)
    expect(result.warnings).toEqual([])
    expect(result.trace).toContain('lossMultiplier=1.08')
    expect(result.trace).toContain('renewableMitigationMultiplier=0.72')
  })

  it('håndterer ugyldige værdier og begrænser procenter', () => {
    const input: ModuleInput = {
      C3: {
        purchasedElectricityKwh: -20_000,
        electricityUpstreamEmissionFactorKgPerKwh: null,
        transmissionLossPercent: 50,
        renewableSharePercent: 180,
        fuelConsumptionKwh: -1_500,
        fuelUpstreamEmissionFactorKgPerKwh: -0.2
      }
    }

    const result = runC3(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('transmissionLossPercent=20')
    expect(result.warnings).toEqual([
      'Feltet purchasedElectricityKwh kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet electricityUpstreamEmissionFactorKgPerKwh mangler og behandles som 0.',
      'Feltet transmissionLossPercent er begrænset til 20%.',
      'Feltet renewableSharePercent er begrænset til 100%.',
      'Feltet fuelConsumptionKwh kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet fuelUpstreamEmissionFactorKgPerKwh kan ikke være negativt. 0 anvendes i stedet.'
    ])
  })
})

describe('runC4', () => {
  it('beregner transportemissioner med dokumenterede afbødninger', () => {
    const input: ModuleInput = {
      C4: {
        roadTonnesKm: 5_000,
        roadEmissionFactorKgPerTonneKm: 0.12,
        railTonnesKm: 2_000,
        railEmissionFactorKgPerTonneKm: 0.03,
        seaTonnesKm: 8_000,
        seaEmissionFactorKgPerTonneKm: 0.015,
        airTonnesKm: 500,
        airEmissionFactorKgPerTonneKm: 0.55,
        consolidationEfficiencyPercent: 20,
        lowCarbonSharePercent: 15
      }
    }

    const result = runC4(input)

    expect(result.value).toBe(0.81)
    expect(result.unit).toBe(factors.c4.unit)
    expect(result.warnings).toEqual([])
    expect(result.trace).toContain('totalModalEmissionsKg=1055')
    expect(result.trace).toContain('mitigationMultiplier=0.767500')
  })

  it('håndterer ugyldige værdier og begrænser procenter', () => {
    const input: ModuleInput = {
      C4: {
        roadTonnesKm: -100,
        roadEmissionFactorKgPerTonneKm: null,
        railTonnesKm: null,
        railEmissionFactorKgPerTonneKm: -0.02,
        seaTonnesKm: -50,
        seaEmissionFactorKgPerTonneKm: null,
        airTonnesKm: null,
        airEmissionFactorKgPerTonneKm: -0.5,
        consolidationEfficiencyPercent: 80,
        lowCarbonSharePercent: 140
      }
    }

    const result = runC4(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('consolidationMitigationRatio=0.300000')
    expect(result.warnings).toEqual([
      'Feltet roadTonnesKm kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet roadEmissionFactorKgPerTonneKm mangler og behandles som 0.',
      'Feltet railTonnesKm mangler og behandles som 0.',
      'Feltet railEmissionFactorKgPerTonneKm kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet seaTonnesKm kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet seaEmissionFactorKgPerTonneKm mangler og behandles som 0.',
      'Feltet airTonnesKm mangler og behandles som 0.',
      'Feltet airEmissionFactorKgPerTonneKm kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet consolidationEfficiencyPercent er begrænset til 50%.',
      'Feltet lowCarbonSharePercent er begrænset til 100%.'
    ])
  })
})

describe('runC5', () => {
  it('beregner emissioner for affaldshåndtering med genanvendelses- og genbrugskreditter', () => {
    const input: ModuleInput = {
      C5: {
        landfillWasteTonnes: 120,
        landfillEmissionFactorKgPerTonne: 480,
        incinerationWasteTonnes: 80,
        incinerationEmissionFactorKgPerTonne: 320,
        recyclingWasteTonnes: 60,
        recyclingEmissionFactorKgPerTonne: 50,
        compostingWasteTonnes: 40,
        compostingEmissionFactorKgPerTonne: 100,
        recyclingRecoveryPercent: 70,
        reuseSharePercent: 30
      }
    }

    const result = runC5(input)

    expect(result.value).toBe(24.354)
    expect(result.unit).toBe(factors.c5.unit)
    expect(result.warnings).toEqual([])
    expect(result.trace).toContain('grossEmissionsKg=90200')
    expect(result.trace).toContain('mitigationMultiplier=0.270000')
  })

  it('normaliserer negative og manglende værdier og begrænser procenter', () => {
    const input: ModuleInput = {
      C5: {
        landfillWasteTonnes: -5,
        landfillEmissionFactorKgPerTonne: null,
        incinerationWasteTonnes: 10,
        incinerationEmissionFactorKgPerTonne: -25,
        recyclingWasteTonnes: null,
        recyclingEmissionFactorKgPerTonne: 40,
        compostingWasteTonnes: 2,
        compostingEmissionFactorKgPerTonne: -15,
        recyclingRecoveryPercent: 120,
        reuseSharePercent: -10
      }
    }

    const result = runC5(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('landfillEmissionFactorKgPerTonne=0')
    expect(result.trace).toContain('recyclingRecoveryPercent=90')
    expect(result.warnings).toEqual([
      'Feltet landfillWasteTonnes kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet landfillEmissionFactorKgPerTonne mangler og behandles som 0.',
      'Feltet incinerationEmissionFactorKgPerTonne kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet compostingEmissionFactorKgPerTonne kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet recyclingWasteTonnes mangler og behandles som 0.',
      'Feltet recyclingRecoveryPercent er begrænset til 90%.',
      'Feltet reuseSharePercent kan ikke være negativt. 0% anvendes i stedet.'
    ])
  })
})

describe('runC6', () => {
  it('beregner emissioner for udlejede aktiver med fordeling og vedvarende reduktioner', () => {
    const input: ModuleInput = {
      C6: {
        leasedFloorAreaSqm: 3200,
        electricityIntensityKwhPerSqm: 90,
        heatIntensityKwhPerSqm: 70,
        occupancySharePercent: 75,
        sharedServicesAllocationPercent: 10,
        electricityEmissionFactorKgPerKwh: 0.25,
        heatEmissionFactorKgPerKwh: 0.18,
        renewableElectricitySharePercent: 40,
        renewableHeatSharePercent: 20
      }
    }

    const result = runC6(input)

    expect(result.value).toBe(55.823)
    expect(result.unit).toBe(factors.c6.unit)
    expect(result.warnings).toEqual([])
    expect(result.trace).toContain('effectiveAllocationRatio=0.650000')

    const electricityEmissionsEntry = result.trace.find((entry) =>
      entry.startsWith('electricityEmissionsKg=')
    )

    expect(electricityEmissionsEntry).toBeDefined()
    expect(Number(electricityEmissionsEntry?.split('=')[1])).toBeCloseTo(32760, 6)
  })

  it('normaliserer negative og manglende værdier og begrænser procenter', () => {
    const input: ModuleInput = {
      C6: {
        leasedFloorAreaSqm: -100,
        electricityIntensityKwhPerSqm: 80,
        heatIntensityKwhPerSqm: null,
        occupancySharePercent: 140,
        sharedServicesAllocationPercent: -5,
        electricityEmissionFactorKgPerKwh: null,
        heatEmissionFactorKgPerKwh: -0.2,
        renewableElectricitySharePercent: 250,
        renewableHeatSharePercent: -10
      }
    }

    const result = runC6(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('leasedFloorAreaSqm=0')
    expect(result.trace).toContain('renewableElectricitySharePercent=100')
    expect(result.warnings).toEqual([
      'Feltet leasedFloorAreaSqm kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet heatIntensityKwhPerSqm mangler og behandles som 0.',
      'Feltet occupancySharePercent er begrænset til 100%.',
      'Feltet sharedServicesAllocationPercent kan ikke være negativt. 0% anvendes i stedet.',
      'Feltet electricityEmissionFactorKgPerKwh mangler og behandles som 0.',
      'Feltet heatEmissionFactorKgPerKwh kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet renewableElectricitySharePercent er begrænset til 100%.',
      'Feltet renewableHeatSharePercent kan ikke være negativt. 0% anvendes i stedet.'
    ])
  })
})

describe('runC7', () => {
  it('beregner emissioner for downstream transport og lagre med reduktioner', () => {
    const input: ModuleInput = {
      C7: {
        roadTonnesKm: 15000,
        roadEmissionFactorKgPerTonneKm: 0.12,
        railTonnesKm: 5000,
        railEmissionFactorKgPerTonneKm: 0.03,
        seaTonnesKm: 0,
        seaEmissionFactorKgPerTonneKm: 0.015,
        airTonnesKm: 300,
        airEmissionFactorKgPerTonneKm: 0.45,
        warehousingEnergyKwh: 200000,
        warehousingEmissionFactorKgPerKwh: 0.07,
        lowEmissionVehicleSharePercent: 40,
        renewableWarehousingSharePercent: 60
      }
    }

    const result = runC7(input)

    expect(result.value).toBe(8.441)
    expect(result.unit).toBe(factors.c7.unit)
    expect(result.warnings).toEqual([])
    expect(result.trace).toContain('roadMitigationRatio=0.280000')
    expect(result.trace).toContain('renewableWarehousingMitigationRatio=0.510000')
  })

  it('normaliserer negative og manglende værdier og begrænser procenter', () => {
    const input: ModuleInput = {
      C7: {
        roadTonnesKm: -10,
        roadEmissionFactorKgPerTonneKm: null,
        railTonnesKm: null,
        railEmissionFactorKgPerTonneKm: -0.05,
        seaTonnesKm: 200,
        seaEmissionFactorKgPerTonneKm: null,
        airTonnesKm: null,
        airEmissionFactorKgPerTonneKm: 0.6,
        warehousingEnergyKwh: null,
        warehousingEmissionFactorKgPerKwh: -0.1,
        lowEmissionVehicleSharePercent: 180,
        renewableWarehousingSharePercent: -5
      }
    }

    const result = runC7(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('roadTonnesKm=0')
    expect(result.trace).toContain('lowEmissionVehicleSharePercent=100')
    expect(result.trace).toContain('renewableWarehousingSharePercent=0')
    expect(result.warnings).toEqual([
      'Feltet roadTonnesKm kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet roadEmissionFactorKgPerTonneKm mangler og behandles som 0.',
      'Feltet railTonnesKm mangler og behandles som 0.',
      'Feltet railEmissionFactorKgPerTonneKm kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet seaEmissionFactorKgPerTonneKm mangler og behandles som 0.',
      'Feltet airTonnesKm mangler og behandles som 0.',
      'Feltet warehousingEnergyKwh mangler og behandles som 0.',
      'Feltet warehousingEmissionFactorKgPerKwh kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet lowEmissionVehicleSharePercent er begrænset til 100%.',
      'Feltet renewableWarehousingSharePercent kan ikke være negativt. 0% anvendes i stedet.'
    ])
  })
})

describe('runC8', () => {
  it('beregner emissioner for downstream udlejede aktiver med effektivisering og vedvarende energi', () => {
    const input: ModuleInput = {
      C8: {
        leasedFloorAreaSqm: 5000,
        electricityIntensityKwhPerSqm: 85,
        heatIntensityKwhPerSqm: 40,
        occupancySharePercent: 90,
        landlordEnergySharePercent: 75,
        energyEfficiencyImprovementPercent: 15,
        electricityEmissionFactorKgPerKwh: 0.18,
        heatEmissionFactorKgPerKwh: 0.075,
        renewableElectricitySharePercent: 60,
        renewableHeatSharePercent: 30
      }
    }

    const result = runC8(input)

    expect(result.value).toBe(28.411)
    expect(result.unit).toBe(factors.c8.unit)
    expect(result.warnings).toEqual([])
    expect(result.trace).toContain('efficiencyMitigation=0.135000')
    expect(result.trace).toContain('renewableElectricityMitigation=0.510000')
  })

  it('normaliserer negative, manglende og overdrevne værdier', () => {
    const input: ModuleInput = {
      C8: {
        leasedFloorAreaSqm: -100,
        electricityIntensityKwhPerSqm: null,
        heatIntensityKwhPerSqm: -10,
        occupancySharePercent: null,
        landlordEnergySharePercent: 140,
        energyEfficiencyImprovementPercent: 120,
        electricityEmissionFactorKgPerKwh: -0.1,
        heatEmissionFactorKgPerKwh: null,
        renewableElectricitySharePercent: -5,
        renewableHeatSharePercent: 250
      }
    }

    const result = runC8(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('leasedFloorAreaSqm=0')
    expect(result.trace).toContain('occupancySharePercent=100')
    expect(result.trace).toContain('landlordEnergySharePercent=100')
    expect(result.trace).toContain('energyEfficiencyImprovementPercent=70')
    expect(result.trace).toContain('renewableElectricitySharePercent=0')
    expect(result.trace).toContain('renewableHeatSharePercent=100')
    expect(result.warnings).toEqual([
      'Feltet leasedFloorAreaSqm kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet electricityIntensityKwhPerSqm mangler og behandles som 0.',
      'Feltet heatIntensityKwhPerSqm kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet occupancySharePercent mangler. Antager 100%.',
      'Feltet landlordEnergySharePercent er begrænset til 100%.',
      'Feltet energyEfficiencyImprovementPercent er begrænset til 70%.',
      'Feltet electricityEmissionFactorKgPerKwh kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet heatEmissionFactorKgPerKwh mangler og behandles som 0.',
      'Feltet renewableElectricitySharePercent kan ikke være negativt. 0% anvendes i stedet.',
      'Feltet renewableHeatSharePercent er begrænset til 100%.'
    ])
  })
})

describe('runC9', () => {
  it('beregner emissioner med effektivisering, sekundært materiale og vedvarende energi', () => {
    const input: ModuleInput = {
      C9: {
        processedOutputTonnes: 1_200,
        processingEnergyIntensityKwhPerTonne: 500,
        processingEmissionFactorKgPerKwh: 0.2,
        processEfficiencyImprovementPercent: 30,
        secondaryMaterialSharePercent: 50,
        renewableEnergySharePercent: 40
      }
    }

    const result = runC9(input)

    expect(result.value).toBe(40.051)
    expect(result.unit).toBe(factors.c9.unit)
    expect(result.warnings).toEqual([])
    expect(result.trace).toContain('energyAfterSecondary=312900')
  })

  it('normaliserer ugyldige værdier og udsender advarsler', () => {
    const input: ModuleInput = {
      C9: {
        processedOutputTonnes: -5,
        processingEnergyIntensityKwhPerTonne: null,
        processingEmissionFactorKgPerKwh: -0.4,
        processEfficiencyImprovementPercent: 90,
        secondaryMaterialSharePercent: 120,
        renewableEnergySharePercent: null
      }
    }

    const result = runC9(input)

    expect(result.value).toBe(0)
    expect(result.trace).toContain('processedOutputTonnes=0')
    expect(result.warnings).toEqual([
      'Feltet processedOutputTonnes kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet processingEnergyIntensityKwhPerTonne mangler og behandles som 0.',
      'Feltet processingEmissionFactorKgPerKwh kan ikke være negativt. 0 anvendes i stedet.',
      'Feltet processEfficiencyImprovementPercent er begrænset til 60%.',
      'Feltet secondaryMaterialSharePercent er begrænset til 80%.',
      'Feltet renewableEnergySharePercent mangler og behandles som 0%.'
    ])
  })
})

describe('runSBM', () => {
  const longNarrative = 'Detaljeret beskrivelse af strategi og forretningsmodel '.repeat(6)

  it('beregner score og samler overgangstiltag, noter og ansvarlige', () => {
    const input: ModuleInput = {
      SBM: {
        businessModelNarrative: longNarrative,
        valueChainNarrative: longNarrative,
        sustainabilityStrategyNarrative: longNarrative,
        resilienceNarrative: longNarrative,
        transitionPlanNarrative: longNarrative,
        stakeholderNarrative: longNarrative,
        dependencies: [
          {
            dependency: 'Grøn strøm',
            impact: 'Manglende adgang kan stoppe produktion.',
            mitigation: 'Diversificering af leverandører.',
            responsible: 'COO'
          },
          {
            dependency: 'Logistikpartnere',
            impact: 'Udsving i fragtpriser påvirker marginer.',
            mitigation: 'Langsigtede kontrakter og effektiviseringsprogram.',
            responsible: 'Supply Chain Lead'
          }
        ],
        opportunities: [
          {
            title: 'Digital service',
            description: 'Serviceforretning med lavere CO₂-intensitet end fysiske produkter.',
            timeframe: '2025',
            owner: 'CSO'
          },
          {
            title: 'Partnerskaber',
            description: 'Partnerskab med cirkulær platform reducerer materialeforbrug.',
            timeframe: '2026',
            owner: 'Sustainability Manager'
          }
        ],
        transitionPlanMeasures: [
          {
            initiative: 'Energieffektivisering',
            description: 'Opgradering af produktionslinjer med lavere energiforbrug.',
            status: 'inProgress',
            milestoneYear: 2026,
            investmentNeedDkk: 1_500_000,
            responsible: 'Energi Lead'
          },
          {
            initiative: 'Leverandørsamarbejde',
            description: 'Code of conduct for transportpartnere og CO₂-krav.',
            status: 'planned',
            milestoneYear: 2027,
            investmentNeedDkk: 750_000,
            responsible: 'Indkøbschef'
          }
        ]
      }
    }

    const result = runSBM(input)

    expect(result.value).toBe(100)
    expect(result.warnings).toEqual([])
    expect(result.transitionMeasures).toHaveLength(2)
    expect(result.responsibilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ subject: 'Grøn strøm', owner: 'COO', role: 'Ansvarlig for opfølgning' }),
        expect.objectContaining({ subject: 'Digital service', owner: 'CSO', role: 'Mulighedsansvarlig' }),
        expect.objectContaining({ subject: 'Energieffektivisering', owner: 'Energi Lead', role: 'Overgangstiltag' })
      ])
    )
    expect(result.trace).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^businessModelNarrativeLength=\d+$/),
        'dependency[0]=Grøn strøm',
        'transition[0]=Energieffektivisering'
      ])
    )
  })

  it('udsteder advarsler og returnerer nulscore ved manglende dokumentation', () => {
    const input: ModuleInput = {
      SBM: {
        businessModelNarrative: '  ',
        valueChainNarrative: null,
        sustainabilityStrategyNarrative: null,
        resilienceNarrative: null,
        dependencies: [
          {
            dependency: 'Kritisk leverandør',
            impact: null,
            mitigation: null,
            responsible: null,
          }
        ],
        transitionPlanNarrative: '',
        stakeholderNarrative: null,
        transitionPlanMeasures: [
          {
            initiative: 'Scope 3 roadmap',
            description: null,
            status: null,
            milestoneYear: null,
            investmentNeedDkk: null,
            responsible: null,
          }
        ]
      }
    }

    const result = runSBM(input)

    expect(result.value).toBe(13)
    expect(result.transitionMeasures).toEqual([
      {
        initiative: 'Scope 3 roadmap',
        description: null,
        status: null,
        milestoneYear: null,
        investmentNeedDkk: null,
        responsible: null
      }
    ])
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'Beskriv forretningsmodellen og centrale aktiviteter for ESRS 2 SBM.',
        'Angiv hvordan væsentlige ressourcer og partnere påvirker bæredygtighedsprofilen.',
        'Forklar hvordan bæredygtighed indgår i strategi og governance.',
        'Uddyb analyser af modstandsdygtighed over for klima- og overgangsrisici.',
        'Angiv hvordan virksomheden planlægger at nå klimamål og overholde ESRS E1.',
        'Beskriv hvordan væsentlige interessenter inddrages i strategien.',
        'Uddyb påvirkning eller afbødning for afhængighed 1.'
      ])
    )
  })
})

describe('runGOV', () => {
  const longNarrative = 'Detaljeret governancebeskrivelse '.repeat(5)

  it('beregner score og samler governance-noter uden advarsler', () => {
    const input: ModuleInput = {
      GOV: {
        oversightNarrative: longNarrative,
        managementNarrative: longNarrative,
        competenceNarrative: longNarrative,
        reportingNarrative: longNarrative,
        assuranceNarrative: longNarrative,
        incentiveNarrative: longNarrative,
        oversightBodies: [
          {
            body: 'Revisionsudvalg',
            mandate: 'Overvåger ESG-rapportering og interne kontroller.',
            chair: 'Bestyrelsesformand',
            meetingFrequency: 'Kvartalsvis'
          }
        ],
        controlProcesses: [
          {
            process: 'ESG-kontroller',
            description: 'Månedlig validering af emissionsdata.',
            owner: 'Risk Manager'
          }
        ],
        incentiveStructures: [
          {
            role: 'Direktør',
            incentive: '10 % bonus koblet til scope 1-reduktion.',
            metric: 'Scope 1 ton CO₂e'
          }
        ]
      }
    }

    const result = runGOV(input)

    expect(result.value).toBe(100)
    expect(result.warnings).toEqual([])
    expect(result.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Revisionsudvalg', detail: expect.stringContaining('Kvartalsvis') }),
        expect.objectContaining({ label: 'ESG-kontroller', detail: 'Månedlig validering af emissionsdata.' }),
        expect.objectContaining({ label: 'Direktør', detail: expect.stringContaining('Scope 1 ton CO₂e') })
      ])
    )
    expect(result.responsibilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ subject: 'Revisionsudvalg', owner: 'Bestyrelsesformand', role: 'Formand' }),
        expect.objectContaining({ subject: 'ESG-kontroller', owner: 'Risk Manager', role: 'Procesansvarlig' }),
        expect.objectContaining({ subject: 'Direktør', owner: 'Direktør', role: 'Incitament' })
      ])
    )
    expect(result.trace).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^oversightNarrativeLength=\d+$/),
        'incentive[0]=Direktør'
      ])
    )
  })

  it('returnerer nulscore og advarsler når governance-felter mangler', () => {
    const input: ModuleInput = {
      GOV: {
        oversightNarrative: '  ',
        managementNarrative: '',
        competenceNarrative: null,
        reportingNarrative: null,
        assuranceNarrative: null,
        incentiveNarrative: null,
        oversightBodies: [
          {
            body: 'Audit komité',
            mandate: null,
            chair: null,
            meetingFrequency: null,
          }
        ],
        controlProcesses: [
          {
            process: 'Intern kontrol',
            description: null,
            owner: null,
          }
        ],
        incentiveStructures: [
          {
            role: 'CEO',
            incentive: null,
            metric: null,
          }
        ]
      }
    }

    const result = runGOV(input)

    expect(result.value).toBe(0)
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'Beskriv bestyrelsens rolle i ESG-styring for ESRS 2 GOV.',
        'Forklar hvordan direktionen driver ESG-dagsordenen.',
        'Dokumentér træning og kompetenceopbygning for ledelsen.',
        'Beskriv kontrolmiljø og rapporteringscyklus for ESG-data.',
        'Angiv omfang af intern/ekstern assurance på ESG-rapporteringen.',
        'Forklar hvordan incitamentsstruktur knyttes til ESG-mål.',
        'Tilføj mandat eller mødefrekvens for governance-organ 1.',
        'Kontrolproces 1 mangler beskrivelse.',
        'Incitament 1 mangler beskrivelse af kobling til ESG.'
      ])
    )
  })
})

describe('runIRO', () => {
  const longNarrative = 'Detaljeret beskrivelse af risikoproces '.repeat(5)

  it('aggregerer processer, impacts og ansvarlige', () => {
    const input: ModuleInput = {
      IRO: {
        processNarrative: longNarrative,
        integrationNarrative: longNarrative,
        stakeholderNarrative: longNarrative,
        dueDiligenceNarrative: longNarrative,
        escalationNarrative: longNarrative,
        monitoringNarrative: longNarrative,
        riskProcesses: [
          {
            step: 'Identifikation',
            description: 'Halvårlig vurdering af leverandørkædens risici.',
            frequency: 'Halvårlig',
            owner: 'Procurement Lead'
          }
        ],
        impactResponses: [
          {
            topic: 'CO₂e i leverandørkæden',
            severity: 'Høj',
            response: 'Implementerer auditprogram og datapartnerskab.',
            status: 'inProgress',
            responsible: 'CSO'
          }
        ]
      }
    }

    const result = runIRO(input)

    expect(result.value).toBe(100)
    expect(result.warnings).toEqual([])
    expect(result.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Identifikation', detail: expect.stringContaining('Halvårlig') }),
        expect.objectContaining({ label: 'CO₂e i leverandørkæden', detail: expect.stringContaining('Status: inProgress') })
      ])
    )
    expect(result.responsibilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ subject: 'Identifikation', owner: 'Procurement Lead', role: 'Procesansvarlig' }),
        expect.objectContaining({ subject: 'CO₂e i leverandørkæden', owner: 'CSO', role: 'Ansvarlig' })
      ])
    )
    expect(result.trace).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^processNarrativeLength=\d+$/),
        'riskProcess[0]=Identifikation'
      ])
    )
  })

  it('returnerer nulscore og relevante advarsler ved manglende oplysninger', () => {
    const input: ModuleInput = {
      IRO: {
        processNarrative: ' ',
        integrationNarrative: null,
        stakeholderNarrative: null,
        dueDiligenceNarrative: null,
        escalationNarrative: null,
        monitoringNarrative: null,
        riskProcesses: [
          {
            step: 'Screening',
            description: null,
            frequency: null,
            owner: null,
          }
        ],
        impactResponses: [
          {
            topic: 'Biodiversitet',
            severity: null,
            response: null,
            status: null,
            responsible: null,
          }
        ]
      }
    }

    const result = runIRO(input)

    expect(result.value).toBe(0)
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'Beskriv processen for at identificere væsentlige impacts, risici og muligheder.',
        'Forklar hvordan resultater integreres i beslutninger og styring.',
        'Dokumentér hvordan interessenter bidrager til analyserne.',
        'Beskriv due diligence-processer for værdikæden.',
        'Forklar hvordan alvorlige impacts eskaleres til ledelsen.',
        'Dokumentér opfølgning og KPI’er for risici og muligheder.',
        'Proces 1 mangler beskrivelse af fremgangsmåde.',
        'Angiv afværge- eller handlingsplan for impact 1.'
      ])
    )
  })
})

describe('runMR', () => {
  it('klassificerer krav, overgangsplaner, finansielle effekter og removals', () => {
    const input = createMRApprovedFixture()

    const result = runMR(input)

    expect(result.value).toBe(8)
    expect(result.unit).toBe('opfyldte krav')
    expect(result.assumptions[0]).toBe('Evalueringen tester 8 krav fra ESRS 2 MR med binære resultater (opfyldt/ikke opfyldt).')
    expect(result.transitionMeasures).toHaveLength(2)
    expect(result.financialEffects).toHaveLength(2)
    expect(result.removalProjects).toHaveLength(1)
    expect(result.warnings).toEqual([])
    expect(result.metrics).toHaveLength(8)
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Intensiteter og udvikling er beskrevet', value: 'Opfyldt' }),
        expect.objectContaining({ label: 'Finansielle effekter er dokumenteret', value: 'Opfyldt' }),
        expect.objectContaining({ label: 'GHG-removal projekter er dokumenteret', value: 'Opfyldt' })
      ])
    )
    expect(result.trace).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^intensityNarrativeLength=\d+$/),
        expect.stringMatching(/^requirement:intensityNarrative=pass$/),
        expect.stringMatching(/^requirement:metrics=pass$/),
        'transitionPlan[0]=Solcellepark',
        'financialEffect[1]=Intern opex',
        'removalProject[0]=Skovrejsning'
      ])
    )
    expect(result.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Scope 1 intensitet', detail: expect.stringContaining('Mål 2026: 7') }),
        expect.objectContaining({ label: 'Vedvarende andel', detail: expect.stringContaining('Seneste 2023: 55') })
      ])
    )
  })

  it('udsteder advarsler og nulscore når data mangler', () => {
    const input = createMRRejectedFixture()

    const result = runMR(input)

    expect(result.value).toBe(0)
    expect(result.unit).toBe('opfyldte krav')
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'Beskriv udviklingen i intensiteter for ESRS 2 MR.',
        'Forklar fremdrift på klimamål og væsentlige KPI’er.',
        'Dokumentér kvalitet og kontroller for nøgletal.',
        'Angiv scope for intern og ekstern assurance.',
        'Uddyb registrerede overgangstiltag med status, milepæl eller investering.',
        'Angiv beløb eller uddybelse for de registrerede finansielle effekter.',
        'Tilføj mindst én klimarelateret metric med baseline og mål eller aktuel status.',
        'Tilføj kvantificerede data for removal-projekterne.',
        'Tilføj aktuelle værdier eller mål for Scope 1 intensitet.',
        'Angiv beløb eller beskrivelse for Capex solceller.',
        'Angiv beløb eller beskrivelse for Intern opex.',
        'Uddyb overgangstiltag 1 med status eller milepæl.',
        'Tilføj kvantificerede data for removal-projekt 1.'
      ])
    )
    expect(result.metrics).toHaveLength(8)
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Intensiteter og udvikling er beskrevet', value: 'Mangler' }),
        expect.objectContaining({ label: 'Klimametrics er dokumenteret', value: 'Mangler' }),
        expect.objectContaining({ label: 'GHG-removal projekter er dokumenteret', value: 'Mangler' })
      ])
    )
    expect(result.transitionMeasures).toHaveLength(1)
    expect(result.financialEffects).toHaveLength(2)
    expect(result.removalProjects).toHaveLength(1)
  })
})

describe('runD1', () => {
  it('returnerer 0 og neutral antagelse uden input', () => {
    const result = runD1({} as ModuleInput)

    expect(result.value).toBe(0)
    expect(result.unit).toBe('opfyldte krav')
    expect(result.assumptions).toContain('Udfyld D1-felterne for at validere governance-oplysningerne mod ESRS-krav.')
    expect(result.warnings).toHaveLength(0)
    expect(result.trace).toContain('organizationalBoundary=null')
    expect(result.metrics).toBeUndefined()
  })

  it('klassificerer krav og fremhæver mangler', () => {
    const input = createD1RejectedFixture()

    const result = runD1(input)

    expect(result.unit).toBe('opfyldte krav')
    expect(result.assumptions[0]).toBe('Evalueringen tester 7 krav fra ESRS 2 D1 (opfyldt/ikke opfyldt).')
    expect(result.value).toBe(1)
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'Proxy-data er svag dokumentation – planlæg overgang til primære eller sekundære kilder.',
        'Markér at Scope 3 screeningen er gennemført.',
        'Uddyb væsentlighedsvurderingen (mindst 200 tegn).',
        'Beskriv strategi og politikker (mindst 200 tegn).',
        'Uddyb bestyrelsens tilsyn, ledelsesroller, incitamenter og politikker.',
        'Uddyb processen for identificering, prioritering og håndtering af impacts/risici/muligheder.',
        'Bekræft kvantitative mål for væsentlige impacts og risici.',
        'Uddyb governance-forankring og fremdrift for målene.'
      ])
    )
    expect(result.metrics).toHaveLength(7)
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Metodegrundlag er dokumenteret', value: 'Opfyldt' }),
        expect.objectContaining({ label: 'Scope 3 screening dækker værdikæden og tidshorisonter', value: 'Mangler' }),
        expect.objectContaining({ label: 'Mål, opfølgning og KPI’er er dokumenteret', value: 'Mangler' })
      ])
    )
    expect(result.trace).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^requirement:methodology=pass$/),
        expect.stringMatching(/^requirement:scope3Coverage=fail$/),
        expect.stringMatching(/^requirement:targets=fail$/)
      ])
    )
    expect(result.esrsFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ conceptKey: 'D1OrganizationalBoundary', value: 'financialControl' }),
        expect.objectContaining({ conceptKey: 'D1Scope3ScreeningCompleted', value: false }),
        expect.objectContaining({ conceptKey: 'D1KpiCount', value: 1 })
      ])
    )
    expect(result.esrsTables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          conceptKey: 'D1StrategyNarrativesTable',
          rows: expect.arrayContaining([expect.objectContaining({ key: 'businessModelSummary' })])
        }),
        expect.objectContaining({
          conceptKey: 'D1KpiOverviewTable',
          rows: expect.arrayContaining([expect.objectContaining({ name: 'CO₂-reduktion' })])
        })
      ])
    )
  })

  it('markerer alle krav som opfyldt ved best practice governance', () => {
    const input = createD1ApprovedFixture()

    const result = runD1(input)

    expect(result.value).toBe(7)
    expect(result.unit).toBe('opfyldte krav')
    expect(result.warnings).toHaveLength(0)
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Metodegrundlag er dokumenteret', value: 'Opfyldt' }),
        expect.objectContaining({ label: 'Mål, opfølgning og KPI’er er dokumenteret', value: 'Opfyldt' })
      ])
    )
    expect(result.trace).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^requirement:methodology=pass$/),
        expect.stringMatching(/^requirement:scope3Coverage=pass$/),
        expect.stringMatching(/^requirement:targets=pass$/)
      ])
    )
  })
})

describe('runE2Water', () => {
  it('beregner vandstressindeks og advarer ved høj andel i stressede områder', () => {
    const input: ModuleInput = {
      E2Water: {
        totalWithdrawalM3: 5_000,
        withdrawalInStressRegionsM3: 2_500,
        dischargeM3: 3_000,
        reusePercent: 10,
        dataQualityPercent: 80,
      },
    }

    const result = runE2Water(input)

    expect(result.value).toBe(60)
    expect(result.unit).toBe(factors.e2Water.unit)
    expect(result.trace).toContain('weightedRisk=0.6000')
    expect(result.warnings).toContain(
      'Mere end 40 % af vandudtaget (50.0 %) foregår i vandstressede områder – prioriter risikoplaner.',
    )
    expect(result.warnings).not.toContain('Ingen dokumenteret genbrug af vand. Overvej recirkulation eller sekundære kilder.')
    expect(result.esrsFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ conceptKey: 'E2TotalWaterWithdrawalM3', value: 5000 }),
        expect.objectContaining({ conceptKey: 'E2WaterStressSharePercent', value: 50 })
      ])
    )
  })

  it('returnerer nul og advarsel ved manglende vandforbrug', () => {
    const result = runE2Water({} as ModuleInput)

    expect(result.value).toBe(0)
    expect(result.warnings).toContain('Intet vandforbrug registreret. Indtast forbrug for at beregne vandstress.')
  })
})

describe('runE3Pollution', () => {
  it('reducerer score ved overskridelse og hændelser', () => {
    const input: ModuleInput = {
      E3Pollution: {
        airEmissionsTonnes: 80,
        airEmissionLimitTonnes: 50,
        waterDischargesTonnes: 10,
        waterDischargeLimitTonnes: null,
        soilEmissionsTonnes: 2,
        soilEmissionLimitTonnes: 5,
        reportableIncidents: 2,
        documentationQualityPercent: 60,
      },
    }

    const result = runE3Pollution(input)

    expect(result.value).toBe(32)
    expect(result.unit).toBe(factors.e3Pollution.unit)
    expect(result.trace).toContain('totalExceedPercent=60.00')
    expect(result.warnings).toContain('Luft: Udledningen på 80.00 t overstiger grænsen på 50.00 t med 60.00 %.')
    expect(result.warnings).toContain('Vand: Ingen gyldig grænse angivet. Standardgrænsen på 20 t anvendes i beregningen.')
    expect(result.warnings).toContain(
      'Dokumentationskvalitet på 60 % er under anbefalingen på 70 %. Opdater emissionstal med mere robuste kilder.',
    )
    expect(result.warnings).toContain(
      'Der er registreret 2 hændelse(r) med rapporteringspligt. Sikr opfølgning og root-cause analyse.',
    )
    expect(result.esrsFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ conceptKey: 'E3AirEmissionsTonnes', value: 80 }),
        expect.objectContaining({ conceptKey: 'E3ReportableIncidentsCount', value: 2 })
      ])
    )
    expect(result.esrsTables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          conceptKey: 'E3MediumsTable',
          rows: expect.arrayContaining([expect.objectContaining({ medium: 'air', exceedPercent: 60 })])
        })
      ])
    )
  })
})

describe('runE4Biodiversity', () => {
  it('beregner risiko med restaureringsmitigering', () => {
    const input: ModuleInput = {
      E4Biodiversity: {
        sitesInOrNearProtectedAreas: 3,
        protectedAreaHectares: 40,
        restorationHectares: 10,
        significantIncidents: 1,
        documentationQualityPercent: 65,
      },
    }

    const result = runE4Biodiversity(input)

    expect(result.value).toBe(41)
    expect(result.trace).toContain('restorationRatio=0.2500')
    expect(result.warnings).toContain(
      '3 lokalitet(er) ligger i eller tæt på beskyttede områder. Iværksæt biodiversitetsplaner.',
    )
    expect(result.warnings).toContain(
      '1 væsentlig(e) biodiversitetshændelse(r) registreret. Gennemfør årsagsanalyse og forebyggelse.',
    )
    expect(result.warnings).toContain(
      'Dokumentationskvalitet på 65 % er under anbefalet niveau på 70 %. Suppler feltdata eller tredjepartsverifikation.',
    )
    expect(result.esrsFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ conceptKey: 'E4SitesInProtectedAreasCount', value: 3 }),
        expect.objectContaining({ conceptKey: 'E4RestorationHectares', value: 10 })
      ])
    )
  })
})

describe('runE5Resources', () => {
  it('opgør ressourceindeks og fremhæver kritiske materialer', () => {
    const input: ModuleInput = {
      E5Resources: {
        primaryMaterialConsumptionTonnes: 800,
        secondaryMaterialConsumptionTonnes: 300,
        recycledContentPercent: 35,
        renewableMaterialSharePercent: 20,
        criticalMaterialsSharePercent: 45,
        circularityTargetPercent: 50,
        documentationQualityPercent: 60,
      },
    }

    const result = runE5Resources(input)

    expect(result.value).toBe(63.5)
    expect(result.trace).toContain('riskIndex=0.6350')
    expect(result.warnings).toContain(
      'Høj andel kritiske materialer (>30 %). Overvej substitution eller leverandørdiversificering.',
    )
    expect(result.warnings).toContain(
      'Genanvendt andel er 15.0 procentpoint under målsætningen. Planlæg nye cirkulære initiativer.',
    )
    expect(result.warnings).toContain('Ressourceindekset overstiger 55 point – prioriter cirkularitet i handlingsplanen.')
    expect(result.warnings).toContain(
      'Dokumentationskvalitet på 60 % er under anbefalingen på 70 %. Indhent leverandørdata eller tredjepartsattester.',
    )
    expect(result.esrsFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ conceptKey: 'E5PrimaryMaterialConsumptionTonnes', value: 800 }),
        expect.objectContaining({ conceptKey: 'E5CriticalMaterialsSharePercent', value: 45 })
      ])
    )
  })
})
