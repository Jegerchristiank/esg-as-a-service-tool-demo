import { XMLParser } from 'fast-xml-parser'
import { describe, expect, it } from 'vitest'

import { buildCsrdReportPackage, buildSubmissionPayload, buildXbrlInstance } from '../csrd'
import { esrsEmissionConceptList } from '../esrsTaxonomy'
import { runSBM } from '../../calculations/modules/runSBM'
import { runGOV } from '../../calculations/modules/runGOV'
import { runIRO } from '../../calculations/modules/runIRO'
import { runMR } from '../../calculations/modules/runMR'
import type { CalculatedModuleResult, ModuleId, ModuleResult, ModuleInput } from '../../types'

function makeResult(moduleId: ModuleId, overrides: Partial<ModuleResult> = {}): CalculatedModuleResult {
  const baseResult: ModuleResult = {
    value: 42,
    unit: 'point',
    assumptions: [],
    trace: [],
    warnings: [],
    ...overrides,
  }

  return {
    moduleId,
    title: `${moduleId} metric`,
    result: baseResult,
  }
}

const baseOptions = {
  profileId: 'test-profile',
  organisation: 'Example Industries',
  reportingPeriod: {
    start: '2023-01-01',
    end: '2023-12-31',
  },
  entityIdentifier: {
    scheme: 'urn:lei',
    value: '5493001KJTIIGC8Y1R12',
  },
} as const

describe('buildXbrlInstance', () => {
  it('serialises module results as ESRS facts with taxonomy validation', () => {
    const results: CalculatedModuleResult[] = [
      makeResult('A1', { value: 1200, unit: 't CO2e' }),
      makeResult('B1', {
        value: 480,
        unit: 't CO2e',
        intensities: [
          {
            basis: 'netRevenue',
            label: 'tCO2e pr. mio. DKK nettoomsætning',
            value: 4.8,
            unit: 'tCO2e/mio. DKK',
            denominatorValue: 100_000_000,
            denominatorUnit: 'DKK',
          },
        ],
      }),
      makeResult('C1', { value: 87.5, unit: 't CO2e' }),
      makeResult('S1', { value: 42, unit: 'social score' }),
      makeResult('E1Targets', {
        esrsFacts: [
          { conceptKey: 'E1TargetsPresent', value: true },
          {
            conceptKey: 'E1TargetsNarrative',
            value: 'Scope 1 target – mål 45 t i 2027',
          },
          { conceptKey: 'E1EnergyConsumptionTotalKwh', value: 1_950_000, unitId: 'kWh', decimals: 0 },
          { conceptKey: 'E1EnergyConsumptionRenewableKwh', value: 180_000, unitId: 'kWh', decimals: 0 },
          { conceptKey: 'E1EnergyConsumptionNonRenewableKwh', value: 1_770_000, unitId: 'kWh', decimals: 0 },
          { conceptKey: 'E1EnergyRenewableSharePercent', value: 9.2, unitId: 'percent', decimals: 1 },
          { conceptKey: 'E1EnergyNonRenewableSharePercent', value: 90.8, unitId: 'percent', decimals: 1 },
          { conceptKey: 'E1EnergyRenewableProductionKwh', value: 180_000, unitId: 'kWh', decimals: 0 },
          { conceptKey: 'E1EnergyNonRenewableProductionKwh', value: 70_000, unitId: 'kWh', decimals: 0 },
        ],
        esrsTables: [
          {
            conceptKey: 'E1TargetsTable',
            rows: [
              {
                scope: 'scope1',
                name: 'Scope 1 target',
                targetYear: 2027,
                targetValueTonnes: 45,
              },
            ],
          },
          {
            conceptKey: 'E1EnergyMixTable',
            rows: [
              {
                energyType: 'electricity',
                consumptionKwh: 1_500_000,
                sharePercent: 70,
                documentationQualityPercent: 80,
              },
            ],
          },
        ],
      }),
    ]

    const instance = buildXbrlInstance(results, baseOptions)
    const parser = new XMLParser({ ignoreAttributes: false })
    const parsed = parser.parse(instance)

    const xbrl = parsed['xbrli:xbrl']
    expect(xbrl).toBeDefined()

    const contexts = ensureArray(xbrl['xbrli:context'])
    expect(contexts.length).toBeGreaterThanOrEqual(1)

    const units = ensureArray(xbrl['xbrli:unit'])
    expect(units.length).toBeGreaterThanOrEqual(1)

    const csrdPackage = buildCsrdReportPackage(results, baseOptions)
    expect(csrdPackage.facts.length).toBeGreaterThanOrEqual(esrsEmissionConceptList.length)

    const emissionConceptQnames = new Set<string>(
      esrsEmissionConceptList.map(({ definition }) => definition.qname),
    )

    for (const fact of csrdPackage.facts) {
      const factNode = xbrl[fact.concept]
      expect(factNode).toBeDefined()
      const nodes = ensureArray(factNode)
      const firstNode = nodes[0]
      expect(firstNode['@_contextRef']).toMatch(/^ctx_reporting_period/)

      if (emissionConceptQnames.has(fact.concept)) {
        expect(fact.decimals).toBe('3')
        expect(firstNode['@_decimals']).toBe('3')
        const numericValue = Number.parseFloat(String(firstNode['#text']))
        expect(Number.isNaN(numericValue)).toBe(false)
      }
    }

    expect(csrdPackage.instance).toBe(instance)

    const scope1Fact = ensureArray(xbrl['esrs:GrossScope1GreenhouseGasEmissions'])
    expect(String(scope1Fact[0]['#text'])).toBe('1200')
    expect(scope1Fact[0]['@_contextRef']).toBe('ctx_reporting_period')

    const scope3Fact = ensureArray(xbrl['esrs:GrossScope3GreenhouseGasEmissions'])
    expect(String(scope3Fact[0]['#text'])).toBe('87.5')

    const targetsFlag = ensureArray(
      xbrl[
        'esrs:GHGEmissionsReductionTargetsAndOrAnyOtherTargetsHaveBeenSetToManageMaterialClimaterelatedImpactsRisksAndOpportunities'
      ],
    )
    expect(String(targetsFlag[0]['#text'])).toBe('true')
    expect(targetsFlag[0]['@_contextRef']).toBe('ctx_reporting_period')

    const targetsNarrative = ensureArray(
      xbrl[
        'esrs:DisclosureOfHowGHGEmissionsReductionTargetsAndOrAnyOtherTargetsHaveBeenSetToManageMaterialClimaterelatedImpactsRisksAndOpportunitiesExplanatory'
      ],
    )
    expect(String(targetsNarrative[0]['#text'])).toContain('Scope 1 target')

    const energyTotal = ensureArray(xbrl['esrs:EnergyConsumptionRelatedToOwnOperations'])
    expect(String(energyTotal[0]['#text'])).toBe('1950000')

    const renewableShareFact = ensureArray(
      xbrl['esrs:PercentageOfRenewableSourcesInTotalEnergyConsumption'],
    )
    expect(String(renewableShareFact[0]['#text'])).toBe('9.2')

    const energyMixTable = ensureArray(xbrl['esrs:DisclosureOfEnergyConsumptionAndMixTable'])
    expect(String(energyMixTable[0]['#text'])).toContain('"energyType":"electricity"')

    const targetsTable = ensureArray(
      xbrl['esrs:TargetsRelatedToClimateChangeMitigationAndAdaptationGHGEmissionsReductionTargetsTable'],
    )
    expect(String(targetsTable[0]['#text'])).toContain('"scope":"scope1"')

    const expectedIntensity = (1200 + 480 + 87.5) / 100_000_000

    const locationIntensityFacts = ensureArray(
      xbrl['esrs:GHGEmissionsIntensityLocationbasedTotalGHGEmissionsPerNetRevenue']
    )
    expect(locationIntensityFacts[0]['@_unitRef']).toBe('unit_Emissions_per_Monetary')
    expect(locationIntensityFacts[0]['@_decimals']).toBe('9')
    expect(String(locationIntensityFacts[0]['#text'])).toBe(
      expectedIntensity.toFixed(9).replace(/0+$/, '').replace(/\.$/, ''),
    )

    const marketIntensityFacts = ensureArray(
      xbrl['esrs:GHGEmissionsIntensityMarketbasedTotalGHGEmissionsPerNetRevenue']
    )
    expect(marketIntensityFacts[0]['@_unitRef']).toBe('unit_Emissions_per_Monetary')
    expect(marketIntensityFacts[0]['@_decimals']).toBe('9')
    expect(String(marketIntensityFacts[0]['#text'])).toBe(
      expectedIntensity.toFixed(9).replace(/0+$/, '').replace(/\.$/, ''),
    )
  })

  it('inkluderer narrativer og tabeller fra ESRS 2-moduler med gyldige contexts', () => {
    const repeatText = (text: string, repeat = 30) => Array(repeat).fill(text).join(' ')

    const moduleInput: ModuleInput = {
      SBM: {
        businessModelNarrative: repeatText('Forretningsmodellen beskriver nøgleaktiviteter og værdiskabelse for kunder.'),
        valueChainNarrative: repeatText('Værdikæden omfatter leverandører, distribution og eftermarkedstjenester.'),
        sustainabilityStrategyNarrative: repeatText('Strategien integrerer bæredygtighed i produktudvikling og investeringer.'),
        resilienceNarrative: repeatText('Robustheden testes via scenarier, stress-tests og løbende læring.'),
        transitionPlanNarrative: repeatText('Overgangsplanen beskriver investeringer i energieffektivisering og partnerskaber.'),
        stakeholderNarrative: repeatText('Interessentdialogen involverer kunder, leverandører og civilsamfund i prioriteringer.'),
        dependencies: [
          {
            dependency: 'Strategisk afhængighed',
            impact: 'Begrænset adgang til biobaserede materialer påvirker produktionen.',
            mitigation: 'Indgår langtidskontrakter og udvikler alternative materialer.',
            responsible: 'Eva Jensen'
          }
        ],
        opportunities: [
          {
            title: 'Ny grøn service',
            description: 'Udvider porteføljen med cirkulære serviceløsninger til nøglekunder.',
            timeframe: '2026',
            owner: 'Lars Holm'
          }
        ],
        transitionPlanMeasures: [
          {
            initiative: 'Energieffektivisering af fabrikker',
            description: 'Opgraderer anlæg med varmegenvinding og styringssystemer.',
            status: 'inProgress',
            milestoneYear: 2027,
            investmentNeedDkk: 5000000,
            responsible: 'Ida Madsen'
          }
        ]
      },
      GOV: {
        oversightNarrative: repeatText('Bestyrelsen fører tilsyn med ESG-mål og indarbejder dem i risikostyring.', 25),
        managementNarrative: repeatText('Direktionen sikrer, at bæredygtighed prioriteres i forretningsplaner og budgetter.', 25),
        competenceNarrative: repeatText('Ledelsen deltager i kurser om klimarisici, menneskerettigheder og rapportering.', 25),
        reportingNarrative: repeatText('Rapporteringsprocessen omfatter kvartalsvise reviews og interne kontroller.', 25),
        assuranceNarrative: repeatText('Ekstern assurance dækker både CO2-data og sociale nøgletal med ISAE 3000.', 25),
        incentiveNarrative: repeatText('Incitamentsprogrammet kobler bonus til reduktion af udledning og kundetilfredshed.', 25),
        oversightBodies: [
          { body: 'Bestyrelse', mandate: 'Strategisk ESG-tilsyn', chair: 'Anders Sørensen', meetingFrequency: 'Kvartalsvis' }
        ],
        controlProcesses: [
          { process: 'ESG-kontrol', description: 'Gennemgang af data og kontroller inden offentliggørelse.', owner: 'Birgitte Lund' }
        ],
        incentiveStructures: [
          { role: 'Direktør', incentive: 'CO2-reduktion og kundemålinger', metric: 'tCO2e pr. omsætning' }
        ]
      },
      IRO: {
        processNarrative: repeatText('Processen kortlægger impacts gennem due diligence, screening og workshops.', 40),
        integrationNarrative: repeatText('Resultater integreres i strategi, produktstyring og investeringsbeslutninger.', 40),
        stakeholderNarrative: repeatText('Interessenter bidrager med input gennem paneler, undersøgelser og dialog.', 40),
        dueDiligenceNarrative: repeatText('Due diligence dækker både egen drift og værdikæden med prioriterede risici.', 40),
        escalationNarrative: repeatText('Eskalering sker til direktion og bestyrelse via formelle beslutningsspor.', 40),
        monitoringNarrative: repeatText('KPI’er og dashboards overvåger fremdrift og remediering af impacts.', 40),
        riskProcesses: [
          { step: 'Screening', description: 'Årlig risikovurdering af leverandører og aktiviteter.', frequency: 'Årlig', owner: 'Nina Vang' }
        ],
        impactResponses: [
          {
            topic: 'Leverandørpåvirkning',
            severity: 'Høj',
            response: 'Implementerer forbedringsplaner og audits.',
            status: 'I gang',
            responsible: 'Oskar Friis'
          }
        ]
      },
      MR: {
        intensityNarrative: repeatText('Intensitet beskrives for scope 1-3 med forbedringer og forklaringer.', 50),
        targetNarrative: repeatText('Målsætninger angiver milepæle for reduktion og energieffektivisering.', 50),
        dataQualityNarrative: repeatText('Datakvaliteten vurderes via kontroller, plausibilitetstjek og systemer.', 50),
        assuranceNarrative: repeatText('Validering udføres af ekstern partner samt intern auditfunktion.', 50),
        transitionPlanNarrative: repeatText('Planen beskriver teknologiinvesteringer, partnerskaber og finansiering.', 50),
        financialEffectNarrative: repeatText('Finansielle effekter omfatter capex, opex og forventede besparelser.', 50),
        metrics: [
          {
            name: 'Scope 1 intensitet',
            unit: 't/oms',
            baselineYear: 2020,
            baselineValue: 12,
            currentYear: 2023,
            currentValue: 8,
            targetYear: 2030,
            targetValue: 5,
            status: 'onTrack',
            owner: 'Pia Møller',
            description: 'Reduktion i scope 1 intensitet gennem energieffektivisering.'
          }
        ],
        financialEffects: [
          { label: 'Tilpasning af anlæg', type: 'capex', amountDkk: 750000, timeframe: '2024-2026', description: 'Opgradering til elektrificerede processer.' }
        ],
        keyNarratives: [{ title: 'Ekstra narrativ', content: 'Supplerende kvalitativ beskrivelse.' }]
      },
      E1Context: {
        netRevenueDkk: 120_000_000,
        productionVolume: 12_500,
        productionUnit: 'MWh',
        employeesFte: 640,
        totalEnergyConsumptionKwh: 1_950_000,
        energyProductionKwh: 320_000,
        renewableEnergyProductionKwh: 180_000,
        previousYearScope1Tonnes: 2_400,
        previousYearScope2Tonnes: 1_200,
        previousYearScope3Tonnes: 5_600,
        transitionPlanMeasures: [
          {
            initiative: 'Klimaaftaler',
            description: 'Langsigtede PPA-aftaler med vedvarende energi.',
            status: 'planned',
            milestoneYear: 2026,
            investmentNeedDkk: 4200000,
            responsible: 'Sofie Kragh'
          }
        ],
        financialEffects: [
          { label: 'OPEX besparelse', type: 'revenues', amountDkk: 320000, timeframe: '2025', description: 'Reduceret energiforbrug.' }
        ],
        ghgRemovalProjects: [
          {
            projectName: 'Skovrejsning',
            removalType: 'inHouse',
            annualRemovalTonnes: 150,
            storageDescription: 'Langsigtet skovrejsningsprojekt på egne arealer.',
            qualityStandard: 'Gold Standard',
            permanenceYears: 60,
            financedThroughCredits: false,
            responsible: 'Henrik Dahl'
          }
        ]
      }
    }

    const sbmResult = runSBM(moduleInput)
    const govResult = runGOV(moduleInput)
    const iroResult = runIRO(moduleInput)
    const mrResult = runMR(moduleInput)

    const qualitativeResults: CalculatedModuleResult[] = [
      { moduleId: 'SBM', title: 'SBM', result: sbmResult },
      { moduleId: 'GOV', title: 'GOV', result: govResult },
      { moduleId: 'IRO', title: 'IRO', result: iroResult },
      { moduleId: 'MR', title: 'MR', result: mrResult }
    ]

    const pkg = buildCsrdReportPackage(qualitativeResults, baseOptions)
    const factsByConcept = new Map(pkg.facts.map((fact) => [fact.concept, fact]))

    expect(factsByConcept.get('esrs:DescriptionOfBusinessModelAndValueChainExplanatory')?.contextRef).toBe(
      'ctx_reporting_period',
    )
    expect(factsByConcept.get('esrs:DescriptionOfBusinessModelAndValueChainExplanatory')?.unitRef).toBeUndefined()
    expect(
      factsByConcept.get('esrs:InformationAboutRolesAndResponsibilitiesOfAdministrativeManagementAndSupervisoryBodiesExplanatory')
        ?.contextRef,
    ).toBe('ctx_reporting_period')
    expect(
      factsByConcept.get(
        'esrs:DescriptionOfProcessToIdentifyAssessPrioritiseAndMonitorPotentialAndActualImpactsOnPeopleAndEnvironmentInformedByDueDiligenceProcessExplanatory',
      )?.contextRef,
    ).toBe('ctx_reporting_period')
    expect(
      factsByConcept.get('esrs:DisclosureOfTransitionPlanForClimateChangeMitigationExplanatory')?.contextRef,
    ).toBe('ctx_reporting_period')

    const sbmTable = factsByConcept.get('esrs:StrategyBusinessModelAndValueChainTable')
    expect(sbmTable?.contextRef).toBe('ctx_reporting_period')
    expect(sbmTable?.value).toContain('Strategisk afhængighed')

    const govTable = factsByConcept.get('esrs:RolesAndResponsibilitiesOfAdministrativeManagementAndSupervisoryBodiesTable')
    expect(govTable?.value).toContain('Bestyrelse')

    const iroTable = factsByConcept.get('esrs:ProcessToIdentifyAndAssessMaterialImpactsRisksAndOpportunitiesESRS2Table')
    expect(iroTable?.value).toContain('Screening')

    const mrRequirementsTable = factsByConcept.get('esrs:MinimumDisclosureRequirementMetricsListOfESRSMetricsTable')
    expect(mrRequirementsTable?.value).toContain('transitionPlan')

    const parser = new XMLParser({ ignoreAttributes: false })
    const parsed = parser.parse(pkg.instance)
    const xbrl = parsed['xbrli:xbrl']

    const sbmNarrativeNode = ensureArray(
      xbrl['esrs:DescriptionOfBusinessModelAndValueChainExplanatory'],
    )[0]
    expect(sbmNarrativeNode['@_contextRef']).toBe('ctx_reporting_period')

    const mrTableNode = ensureArray(
      xbrl['esrs:MinimumDisclosureRequirementMetricsListOfESRSMetricsTable'],
    )[0]
    expect(mrTableNode['@_contextRef']).toBe('ctx_reporting_period')
  })

  it('generates instant contexts for stock metrics', () => {
    const results: CalculatedModuleResult[] = [
      makeResult('S1', {
        unit: 'social score',
        esrsFacts: [{ conceptKey: 'S1TotalHeadcount', value: 180, unitId: 'pure', decimals: 0 }],
        esrsTables: [
          {
            conceptKey: 'S1HeadcountBreakdownTable',
            rows: [{ segment: 'HQ', headcount: 180 }],
          },
        ],
      }),
    ]

    const pkg = buildCsrdReportPackage(results, baseOptions)
    const instantContext = pkg.contexts.find((ctx) => ctx.id === 'ctx_reporting_period_instant')
    expect(instantContext).toEqual({
      id: 'ctx_reporting_period_instant',
      entity: baseOptions.entityIdentifier,
      period: { type: 'instant', instant: '2023-12-31' },
    })

    const headcountFact = pkg.facts.find((fact) => fact.concept === 'esrs:S1TotalEmployees')
    expect(headcountFact?.contextRef).toBe('ctx_reporting_period_instant')

    const parser = new XMLParser({ ignoreAttributes: false })
    const parsed = parser.parse(pkg.instance)
    const contexts = ensureArray(parsed['xbrli:xbrl']['xbrli:context'])
    const instantNode = contexts.find((node) => node['@_id'] === 'ctx_reporting_period_instant')
    expect(instantNode?.['xbrli:period']['xbrli:instant']).toBe('2023-12-31')
  })

  it('is included in submission payloads when requested', () => {
    const payload = buildSubmissionPayload(
      [makeResult('A1', { value: 15, unit: 't CO2e' })],
      { ...baseOptions, includeXbrl: true },
    )

    expect(payload.xbrl).toBeDefined()
    expect(payload.xbrl).toContain('<xbrli:xbrl')
    expect(payload.csrd.instance).toBe(payload.xbrl)
    expect(payload.generatedAt).toMatch(/\d{4}-\d{2}-\d{2}T/)
  })
})

function ensureArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

