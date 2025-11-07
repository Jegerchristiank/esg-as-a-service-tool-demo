import type { ModuleInput } from '../../../types'

export const e1NewModulesFixture: ModuleInput = {
  E1Scenarios: {
    scenarios: [
      {
        name: 'IEA NZE',
        provider: 'IEA',
        scenarioType: 'netZero15',
        timeHorizon: 'longTerm',
        coveragePercent: 85,
        description: 'Globalt 1,5°C scenarie anvendt til stress-test.',
      },
      {
        name: 'Regional transition',
        provider: 'Internt analyse-team',
        scenarioType: 'stressTest',
        timeHorizon: 'mediumTerm',
        coveragePercent: 40,
        description: 'Regional transition med høje CO₂-priser.',
      },
    ],
    scenarioNarrative: 'Scenarierne informerer klimarisiko og valideres årligt af bestyrelsen.',
  },
  E1CarbonPrice: {
    carbonPrices: [
      {
        scheme: 'Investeringsscreening',
        scope: 'combined',
        priceDkkPerTonne: 900,
        coveragePercent: 60,
        appliesToCapex: true,
        appliesToOpex: false,
        appliesToInvestmentDecisions: true,
        alignedWithFinancialStatements: true,
        description: 'Bruges i alle større investeringscases.',
      },
      {
        scheme: 'Produktprissætning',
        scope: 'scope3',
        priceDkkPerTonne: 450,
        coveragePercent: 35,
        appliesToCapex: false,
        appliesToOpex: true,
        appliesToInvestmentDecisions: false,
        alignedWithFinancialStatements: false,
        description: 'Anvendes til intern kalkulation for nye produkter.',
      },
    ],
    methodologyNarrative: 'CO₂-priserne valideres mod EU ETS og NGFS scenarier.',
  },
  E1RiskGeography: {
    riskRegions: [
      {
        geography: 'Sydøstasien',
        riskType: 'acutePhysical',
        timeHorizon: 'shortTerm',
        assetsAtRiskDkk: 120_000_000,
        revenueAtRiskDkk: 45_000_000,
        exposureNarrative: 'Oversvømmelsesrisiko for to produktionsfaciliteter.',
      },
      {
        geography: 'Europa',
        riskType: 'transition',
        timeHorizon: 'mediumTerm',
        assetsAtRiskDkk: 80_000_000,
        revenueAtRiskDkk: 65_000_000,
        exposureNarrative: 'Potentiel carbon-border justerings effekt.',
      },
    ],
    assessmentNarrative: 'Risikokortet opdateres årligt og dækker 80 % af omsætningen.',
  },
  E1DecarbonisationDrivers: {
    drivers: [
      {
        lever: 'energyEfficiency',
        name: 'LED og varmegenvinding',
        expectedReductionTonnes: 1200,
        investmentNeedDkk: 5_500_000,
        startYear: 2025,
        description: 'Energieffektivisering i egne fabrikker.',
      },
      {
        lever: 'renewableEnergy',
        name: 'PPA 25 MW',
        expectedReductionTonnes: 3400,
        investmentNeedDkk: 12_000_000,
        startYear: 2026,
        description: 'Langsigtet PPA for vindenergi.',
      },
    ],
    summaryNarrative: 'Drivere reducerer samlet footprint med 15 % frem mod 2030.',
  },
}
