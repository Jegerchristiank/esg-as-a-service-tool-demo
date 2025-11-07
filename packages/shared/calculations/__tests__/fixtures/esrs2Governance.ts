import type { ModuleInput } from '../../../types'

const LONG_TEXT = 'Lang beskrivelse af robust governance-setup og processer. '.repeat(8)
const STRATEGY_TEXT = 'Strategi og politikker for hele organisationen med klare mål. '.repeat(8)

export function createD1ApprovedFixture(): ModuleInput {
  return {
    D1: {
      organizationalBoundary: 'operationalControl',
      scope2Method: 'marketBased',
      scope3ScreeningCompleted: true,
      dataQuality: 'primary',
      materialityAssessmentDescription: LONG_TEXT,
      strategyDescription: STRATEGY_TEXT,
      strategy: {
        businessModelSummary: LONG_TEXT,
        sustainabilityIntegration: LONG_TEXT,
        resilienceDescription: LONG_TEXT,
        stakeholderEngagement: LONG_TEXT
      },
      governance: {
        oversight: LONG_TEXT,
        managementRoles: LONG_TEXT,
        esgExpertise: LONG_TEXT,
        incentives: LONG_TEXT,
        policies: LONG_TEXT,
        hasEsgCommittee: true
      },
      impactsRisksOpportunities: {
        processDescription: LONG_TEXT,
        prioritisationCriteria: LONG_TEXT,
        integrationIntoManagement: LONG_TEXT,
        mitigationActions: LONG_TEXT,
        valueChainCoverage: 'fullValueChain',
        timeHorizons: ['shortTerm', 'mediumTerm', 'longTerm']
      },
      targetsAndKpis: {
        hasQuantitativeTargets: true,
        governanceIntegration: LONG_TEXT,
        progressDescription: LONG_TEXT,
        kpis: [
          {
            name: 'CO₂-intensitet',
            kpi: 'kg CO₂e/omsætning',
            unit: 'kg/kr',
            baselineYear: 2020,
            baselineValue: 10,
            targetYear: 2025,
            targetValue: 5,
            comments: 'Reduceret via energiprojekter'
          },
          {
            name: 'Andel vedvarende energi',
            kpi: 'Procent',
            unit: '%',
            baselineYear: 2020,
            baselineValue: 30,
            targetYear: 2027,
            targetValue: 80,
            comments: 'Indkøb af grøn strøm og PPAs'
          }
        ]
      }
    }
  }
}

export function createD1RejectedFixture(): ModuleInput {
  return {
    D1: {
      organizationalBoundary: 'financialControl',
      scope2Method: 'locationBased',
      scope3ScreeningCompleted: false,
      dataQuality: 'proxy',
      materialityAssessmentDescription: 'Kort note om væsentlighed',
      strategyDescription: null,
      strategy: {
        businessModelSummary: 'Kort beskrivelse',
        sustainabilityIntegration: null,
        resilienceDescription: null,
        stakeholderEngagement: null
      },
      governance: {
        oversight: 'Kort note',
        managementRoles: null,
        esgExpertise: null,
        incentives: null,
        policies: null,
        hasEsgCommittee: false
      },
      impactsRisksOpportunities: {
        processDescription: null,
        prioritisationCriteria: null,
        integrationIntoManagement: null,
        mitigationActions: null,
        valueChainCoverage: 'ownOperations',
        timeHorizons: ['shortTerm']
      },
      targetsAndKpis: {
        hasQuantitativeTargets: false,
        governanceIntegration: null,
        progressDescription: null,
        kpis: [
          {
            name: 'CO₂-reduktion',
            kpi: 'Ton CO₂e',
            unit: 't',
            baselineYear: 2020,
            baselineValue: 100,
            targetYear: 2030,
            targetValue: 50,
            comments: null
          }
        ]
      }
    }
  }
}

const LONG_MR_NARRATIVE = 'Detaljeret narrativ om metrics og mål '.repeat(8)

export function createMRApprovedFixture(): ModuleInput {
  return {
    MR: {
      intensityNarrative: LONG_MR_NARRATIVE,
      targetNarrative: LONG_MR_NARRATIVE,
      dataQualityNarrative: LONG_MR_NARRATIVE,
      assuranceNarrative: LONG_MR_NARRATIVE,
      transitionPlanNarrative: LONG_MR_NARRATIVE,
      financialEffectNarrative: LONG_MR_NARRATIVE,
      keyNarratives: [{ title: 'Supplerende narrativ', content: 'Detaljeret status for klimatilpasning.' }],
      metrics: [
        {
          name: 'Scope 1 intensitet',
          unit: 'tCO₂e/mio. DKK',
          baselineYear: 2022,
          baselineValue: 12,
          currentYear: 2023,
          currentValue: 10,
          targetYear: 2026,
          targetValue: 7,
          status: 'lagging',
          owner: 'COO',
          description: 'Reduktion via energioptimering.'
        },
        {
          name: 'Vedvarende andel',
          unit: '%',
          baselineYear: null,
          baselineValue: null,
          currentYear: 2023,
          currentValue: 55,
          targetYear: 2025,
          targetValue: 80,
          status: 'onTrack',
          owner: 'Energi Lead',
          description: 'Forbedres via PPA og solceller.'
        }
      ],
      financialEffects: [
        {
          label: 'Intern opex',
          type: 'opex',
          amountDkk: 400_000,
          timeframe: '2024',
          description: 'Energioptimering af produktionslinje.'
        }
      ]
    },
    E1Context: {
      netRevenueDkk: null,
      productionVolume: null,
      productionUnit: null,
      employeesFte: null,
      totalEnergyConsumptionKwh: null,
      energyProductionKwh: null,
      renewableEnergyProductionKwh: null,
      previousYearScope1Tonnes: null,
      previousYearScope2Tonnes: null,
      previousYearScope3Tonnes: null,
      transitionPlanMeasures: [
        {
          initiative: 'Solcellepark',
          description: '50 % af elforbrug dækkes af ny park.',
          status: 'inProgress',
          milestoneYear: 2025,
          investmentNeedDkk: 8_000_000,
          responsible: 'CTO'
        },
        {
          initiative: 'Elektriske køretøjer',
          description: 'Skifter 80 % af flåden til el.',
          status: 'planned',
          milestoneYear: 2027,
          investmentNeedDkk: 5_500_000,
          responsible: 'Fleet Manager'
        }
      ],
      financialEffects: [
        {
          label: 'Capex solceller',
          type: 'capex',
          amountDkk: 8_000_000,
          timeframe: '2024-2025',
          description: 'Investering i solcellepark.'
        }
      ],
      ghgRemovalProjects: [
        {
          projectName: 'Skovrejsning',
          removalType: 'valueChain',
          annualRemovalTonnes: 120,
          storageDescription: 'Langsigtet binding i certificeret skov.',
          qualityStandard: 'Verra',
          permanenceYears: 40,
          financedThroughCredits: false,
          responsible: 'Sustainability Manager'
        }
      ]
    }
  }
}

export function createMRRejectedFixture(): ModuleInput {
  return {
    MR: {
      intensityNarrative: ' ',
      targetNarrative: '',
      dataQualityNarrative: '',
      assuranceNarrative: '',
      transitionPlanNarrative: '',
      financialEffectNarrative: '',
      keyNarratives: [{ title: 'Tom narrativ', content: '' }],
      metrics: [
        {
          name: 'Scope 1 intensitet',
          unit: null,
          baselineYear: null,
          baselineValue: null,
          currentYear: null,
          currentValue: null,
          targetYear: null,
          targetValue: null,
          status: null,
          owner: null,
          description: null
        }
      ],
      financialEffects: [
        {
          label: 'Intern opex',
          type: null,
          amountDkk: null,
          timeframe: null,
          description: null
        }
      ]
    },
    E1Context: {
      netRevenueDkk: null,
      productionVolume: null,
      productionUnit: null,
      employeesFte: null,
      totalEnergyConsumptionKwh: null,
      energyProductionKwh: null,
      renewableEnergyProductionKwh: null,
      previousYearScope1Tonnes: null,
      previousYearScope2Tonnes: null,
      previousYearScope3Tonnes: null,
      transitionPlanMeasures: [
        {
          initiative: 'Grønnere transporter',
          description: null,
          status: null,
          milestoneYear: null,
          investmentNeedDkk: null,
          responsible: null
        }
      ],
      financialEffects: [
        {
          label: 'Capex solceller',
          type: 'capex',
          amountDkk: null,
          timeframe: null,
          description: null
        }
      ],
      ghgRemovalProjects: [
        {
          projectName: 'Skovrejsning',
          removalType: 'valueChain',
          annualRemovalTonnes: null,
          storageDescription: null,
          qualityStandard: null,
          permanenceYears: null,
          financedThroughCredits: null,
          responsible: null
        }
      ]
    }
  }
}
