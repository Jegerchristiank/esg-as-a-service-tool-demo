import type { ModuleInput } from '../../../types'

export const e1TargetsFixture: ModuleInput = {
  E1Context: {
    netRevenueDkk: null,
    productionVolume: null,
    productionUnit: null,
    employeesFte: null,
    totalEnergyConsumptionKwh: 1_950_000,
    energyProductionKwh: 250_000,
    renewableEnergyProductionKwh: 180_000,
    energyMixLines: [
      {
        energyType: 'electricity',
        consumptionKwh: 1_500_000,
        documentationQualityPercent: 80,
        sharePercent: 70,
      },
      {
        energyType: 'biogas',
        consumptionKwh: 300_000,
        documentationQualityPercent: 90,
        sharePercent: 15,
      },
      {
        energyType: 'diesel',
        consumptionKwh: 150_000,
        documentationQualityPercent: 60,
        sharePercent: 15,
      },
    ],
    previousYearScope1Tonnes: null,
    previousYearScope2Tonnes: null,
    previousYearScope3Tonnes: null,
    ghgRemovalProjects: [],
    financialEffects: [],
    transitionPlanMeasures: [],
  },
  E1Targets: {
    targets: [
      {
        id: 'scope1-main',
        name: 'Scope 1 reduktion',
        scope: 'scope1',
        targetYear: 2027,
        targetValueTonnes: 45,
        baselineYear: 2022,
        baselineValueTonnes: 70,
        owner: 'Operations',
        status: 'lagging',
        description: 'Effektivisering af procesvarme og udskiftning af kedler.',
        milestones: [
          { label: 'Energikortlægning', dueYear: 2024 },
          { label: 'Nye brændere', dueYear: 2025 }
        ]
      },
      {
        id: null,
        name: null,
        scope: 'scope3',
        targetYear: 2030,
        targetValueTonnes: 120,
        baselineYear: 2023,
        baselineValueTonnes: 200,
        owner: 'Supply Chain',
        status: 'onTrack',
        description: 'Inddragelse af leverandører i reduktionsprogram.',
        milestones: [{ label: 'Supplier engagement', dueYear: 2026 }]
      }
    ],
    actions: [
      {
        title: 'Udskifte gaskedler',
        description: 'Konvertering til varmepumpe i hovedfabrikken.',
        owner: 'Teknisk chef',
        dueQuarter: '2025-Q4',
        status: 'inProgress'
      },
      {
        title: 'CO₂-krav til leverandører',
        description: 'Indarbejd klimakrav i leverandørkontrakter.',
        owner: 'Indkøb',
        dueQuarter: '2024-Q3',
        status: 'planned'
      }
    ]
  }
}
