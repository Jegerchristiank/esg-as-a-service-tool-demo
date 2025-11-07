/**
 * Konverterer modul-CSV til JSON Schema objekt.
 */
import { readFile } from 'node:fs/promises'

export type CsvSchemaRow = {
  module: string
  value_type: string
}

const b1Override = {
  type: 'object',
  title: 'B1Input',
  description: 'Scope 2 elforbrug',
  properties: {
    electricityConsumptionKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Årligt elforbrug (kWh)'
    },
    emissionFactorKgPerKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Emissionsfaktor (kg CO2e pr. kWh)'
    },
    renewableSharePercent: {
      type: ['number', 'null'],
      minimum: 0,
      maximum: 100,
      description: 'Andel af strøm indkøbt som vedvarende energi (%)'
    }
  },
  additionalProperties: false
} as const

const typeMap: Record<string, unknown> = {
  string: { type: 'string' },
  number: { type: 'number' },
  object: { type: 'object' },
  array: { type: 'array' },
  boolean: { type: 'boolean' }
}

const d1Override = {
  type: 'object',
  title: 'D1Input',
  description: 'Metode & governance',
  properties: {
    organizationalBoundary: {
      type: ['string', 'null'],
      enum: ['equityShare', 'financialControl', 'operationalControl', null],
      description: 'Valgt konsolideringsprincip for rapportering.'
    },
    scope2Method: {
      type: ['string', 'null'],
      enum: ['locationBased', 'marketBased', null],
      description: 'Primær metode til Scope 2-rapportering.'
    },
    scope3ScreeningCompleted: {
      type: ['boolean', 'null'],
      description: 'Angiver om Scope 3 screening er gennemført.'
    },
    dataQuality: {
      type: ['string', 'null'],
      enum: ['primary', 'secondary', 'proxy', null],
      description: 'Dominerende datakvalitet for ESG-rapporteringen.'
    },
    materialityAssessmentDescription: {
      type: ['string', 'null'],
      maxLength: 2000,
      description: 'Opsummering af væsentlighedsvurderingen og konklusioner.'
    },
    strategyDescription: {
      type: ['string', 'null'],
      maxLength: 2000,
      description: 'Strategi, målsætninger og politikker for ESG-governance.'
    }
  },
  additionalProperties: false
} as const

const a1Override = {
  type: 'object',
  title: 'A1Input',
  description: 'Scope 1 stationære forbrændingskilder',
  properties: {
    fuelConsumptions: {
      type: 'array',
      description: 'Brændselslinjer for kedler, ovne og generatorer.',
      maxItems: 12,
      items: {
        type: 'object',
        properties: {
          fuelType: {
            type: 'string',
            enum: ['naturgas', 'diesel', 'fyringsolie', 'biogas'],
            description: 'Brændstoftype for linjen.'
          },
          unit: {
            type: 'string',
            enum: ['liter', 'Nm³', 'kg'],
            description: 'Måleenhed for brændselsmængden.'
          },
          quantity: {
            type: ['number', 'null'],
            minimum: 0,
            description: 'Mængde brændsel i valgt enhed.'
          },
          emissionFactorKgPerUnit: {
            type: ['number', 'null'],
            minimum: 0,
            description: 'Emissionsfaktor i kg CO2e pr. enhed.'
          },
          documentationQualityPercent: {
            type: ['number', 'null'],
            minimum: 0,
            maximum: 100,
            description: 'Dokumentationskvalitet i procent.'
          }
        },
        required: ['fuelType', 'unit'],
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
} as const

const a2Override = {
  type: 'object',
  title: 'A2Input',
  description: 'Scope 1 mobile forbrændingskilder',
  properties: {
    vehicleConsumptions: {
      type: 'array',
      description: 'Brændselslinjer for bilpark, trucks og entreprenørmaskiner.',
      maxItems: 20,
      items: {
        type: 'object',
        properties: {
          fuelType: {
            type: 'string',
            enum: ['benzin', 'diesel', 'biodiesel', 'cng'],
            description: 'Brændstoftype for køretøjet eller maskinen.'
          },
          unit: {
            type: 'string',
            enum: ['liter', 'kg'],
            description: 'Måleenhed for brændselsforbruget.'
          },
          quantity: {
            type: ['number', 'null'],
            minimum: 0,
            description: 'Mængde brændsel i valgt enhed.'
          },
          emissionFactorKgPerUnit: {
            type: ['number', 'null'],
            minimum: 0,
            description: 'Emissionsfaktor i kg CO2e pr. enhed.'
          },
          distanceKm: {
            type: ['number', 'null'],
            minimum: 0,
            description: 'Evt. kørt distance i kilometer for linjen.'
          },
          documentationQualityPercent: {
            type: ['number', 'null'],
            minimum: 0,
            maximum: 100,
            description: 'Dokumentationskvalitet i procent.'
          }
        },
        required: ['fuelType', 'unit'],
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
} as const

const a3Override = {
  type: 'object',
  title: 'A3Input',
  description: 'Scope 1 procesemissioner',
  properties: {
    processLines: {
      type: 'array',
      description: 'Proceslinjer for industrielle emissioner (cement, kemikalier, metaller).',
      maxItems: 20,
      items: {
        type: 'object',
        properties: {
          processType: {
            type: 'string',
            enum: ['cementClinker', 'limeCalcination', 'ammoniaProduction', 'aluminiumSmelting'],
            description: 'Proces- eller kemisk aktivitet.'
          },
          outputQuantityTon: {
            type: ['number', 'null'],
            minimum: 0,
            description: 'Produceret mængde i ton for processen.'
          },
          emissionFactorKgPerTon: {
            type: ['number', 'null'],
            minimum: 0,
            description: 'Emissionsfaktor i kg CO2e pr. ton output.'
          },
          documentationQualityPercent: {
            type: ['number', 'null'],
            minimum: 0,
            maximum: 100,
            description: 'Dokumentationskvalitet i procent.'
          }
        },
        required: ['processType'],
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
} as const

const a4Override = {
  type: 'object',
  title: 'A4Input',
  description: 'Scope 1 flugtige emissioner',
  properties: {
    refrigerantLines: {
      type: 'array',
      description: 'Kølemidler og andre gasser med årlig lækage og GWP100.',
      maxItems: 20,
      items: {
        type: 'object',
        properties: {
          refrigerantType: {
            type: 'string',
            enum: ['hfc134a', 'hfc125', 'hfc32', 'r410a', 'r407c', 'sf6'],
            description: 'Valgt kølemiddel eller gas.'
          },
          systemChargeKg: {
            type: ['number', 'null'],
            minimum: 0,
            description: 'Fyldning eller beholdning (kg).'
          },
          leakagePercent: {
            type: ['number', 'null'],
            minimum: 0,
            maximum: 100,
            description: 'Årlig lækageandel (%)'
          },
          gwp100: {
            type: ['number', 'null'],
            minimum: 0,
            description: 'GWP100-værdi for kølemidlet.'
          },
          documentationQualityPercent: {
            type: ['number', 'null'],
            minimum: 0,
            maximum: 100,
            description: 'Dokumentationskvalitet i procent.'
          }
        },
        required: ['refrigerantType'],
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
} as const

const b2Override = {
  type: 'object',
  title: 'B2Input',
  description: 'Scope 2 varmeforbrug',
  properties: {
    heatConsumptionKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Årligt varmeforbrug fra leverandør (kWh)'
    },
    recoveredHeatKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Genindvundet eller egenproduceret varme trukket fra (kWh)'
    },
    emissionFactorKgPerKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Emissionsfaktor for varmeleverancen (kg CO2e pr. kWh)'
    },
    renewableSharePercent: {
      type: ['number', 'null'],
      minimum: 0,
      maximum: 100,
      description: 'Andel af certificeret vedvarende varme (%)'
    }
  },
  additionalProperties: false
} as const

const b3Override = {
  type: 'object',
  title: 'B3Input',
  description: 'Scope 2 køleforbrug',
  properties: {
    coolingConsumptionKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Årligt køleforbrug fra leverandør (kWh)'
    },
    recoveredCoolingKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Genindvundet eller frikøling trukket fra (kWh)'
    },
    emissionFactorKgPerKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Emissionsfaktor for køleleverancen (kg CO2e pr. kWh)'
    },
    renewableSharePercent: {
      type: ['number', 'null'],
      minimum: 0,
      maximum: 100,
      description: 'Andel af certificeret vedvarende køling (%)'
    }
  },
  additionalProperties: false
} as const

const b4Override = {
  type: 'object',
  title: 'B4Input',
  description: 'Scope 2 dampforbrug',
  properties: {
    steamConsumptionKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Årligt dampforbrug fra leverandør (kWh)'
    },
    recoveredSteamKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Genindvundet kondensat eller procesdamp trukket fra (kWh)'
    },
    emissionFactorKgPerKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Emissionsfaktor for dampforsyningen (kg CO2e pr. kWh)'
    },
    renewableSharePercent: {
      type: ['number', 'null'],
      minimum: 0,
      maximum: 100,
      description: 'Andel af certificeret vedvarende damp (%)'
    }
  },
  additionalProperties: false
} as const

const b5Override = {
  type: 'object',
  title: 'B5Input',
  description: 'Scope 2 øvrige energileverancer',
  properties: {
    otherEnergyConsumptionKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Årligt forbrug af den indkøbte energitype (kWh)'
    },
    recoveredEnergyKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Genindvundet energi eller procesudnyttelse der reducerer behovet (kWh)'
    },
    emissionFactorKgPerKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Emissionsfaktor for energileverancen (kg CO2e pr. kWh)'
    },
    renewableSharePercent: {
      type: ['number', 'null'],
      minimum: 0,
      maximum: 100,
      description: 'Andel dokumenteret som vedvarende energi (%)'
    }
  },
  additionalProperties: false
} as const

const b6Override = {
  type: 'object',
  title: 'B6Input',
  description: 'Scope 2 nettab i elnettet',
  properties: {
    electricitySuppliedKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Årligt elforbrug der danner grundlag for nettab (kWh)'
    },
    gridLossPercent: {
      type: ['number', 'null'],
      minimum: 0,
      maximum: 100,
      description: 'Forventet transmissions- og distributionstab (%)'
    },
    emissionFactorKgPerKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Emissionsfaktor for tabt elektricitet (kg CO2e pr. kWh)'
    },
    renewableSharePercent: {
      type: ['number', 'null'],
      minimum: 0,
      maximum: 100,
      description: 'Andel af tabet der dækkes af vedvarende energi (%)'
    }
  },
  additionalProperties: false
} as const


const leasedEnergyLineOverride = {
  type: 'object',
  title: 'LeasedAssetLine',
  properties: {
    floorAreaSqm: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Lejet areal (m²) der bruges til at estimere energiforbruget ved manglende data.'
    },
    energyConsumptionKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Årligt energiforbrug for linjen (kWh). Har forrang frem for arealberegnet energi.'
    },
    energyType: {
      type: 'string',
      enum: ['electricity', 'heat'],
      description: 'Energitype for linjen, der afgør standardintensitet og emissionsfaktor.'
    },
    emissionFactorKgPerKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Emissionsfaktor (kg CO2e/kWh). Hvis tom anvendes standardværdien for energitypen.'
    },
    documentationQualityPercent: {
      type: ['number', 'null'],
      minimum: 0,
      maximum: 100,
      description: 'Dokumentationskvalitet for linjen (%). Værdier under tærsklen flagges i UI.'
    }
  },
  required: ['energyType'],
  additionalProperties: false
} as const

const franchiseLineOverride = {
  type: 'object',
  title: 'FranchiseLine',
  properties: {
    activityBasis: {
      type: 'string',
      enum: ['revenue', 'energy'],
      description: 'Angiver om linjen baseres på omsætning eller energiforbrug.'
    },
    revenueDkk: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Årlig franchiseomsætning (DKK) hvis basis er omsætning.'
    },
    energyConsumptionKwh: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Årligt energiforbrug (kWh) hvis basis er energi.'
    },
    emissionFactorKey: {
      type: ['string', 'null'],
      enum: [
        'retailRevenue',
        'foodServiceRevenue',
        'hospitalityRevenue',
        'genericRevenue',
        'electricityEnergy',
        'districtHeatEnergy',
        'mixedEnergy'
      ],
      description: 'Valgt branchespecifik emissionsfaktor (kg CO2e/DKK eller kg CO2e/kWh).'
    },
    documentationQualityPercent: {
      type: ['number', 'null'],
      minimum: 0,
      maximum: 100,
      description: 'Dokumentationskvalitet i procent for linjen.'
    }
  },
  required: ['activityBasis'],
  additionalProperties: false
} as const

const treatmentLineOverride = {
  type: 'object',
  title: 'TreatmentLine',
  properties: {
    treatmentType: {
      type: ['string', 'null'],
      enum: ['recycling', 'incineration', 'landfill'],
      description: 'Behandlingstype for den solgte vare (genanvendelse, forbrænding eller deponi).'
    },
    tonnesTreated: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Tonnage (ton) der behandles via den valgte metode.'
    },
    emissionFactorKey: {
      type: ['string', 'null'],
      enum: [
        'recyclingConservative',
        'recyclingOptimised',
        'incinerationEnergyRecovery',
        'incinerationNoRecovery',
        'landfillManaged',
        'landfillUnmanaged'
      ],
      description: 'Valgt emissionsfaktor (kg CO2e/ton) for den konkrete behandling.'
    },
    documentationQualityPercent: {
      type: ['number', 'null'],
      minimum: 0,
      maximum: 100,
      description: 'Dokumentationskvalitet i procent for behandlingslinjen.'
    }
  },
  additionalProperties: false
} as const

const investmentLineOverride = {
  type: 'object',
  title: 'InvestmentLine',
  properties: {
    investedAmountDkk: {
      type: ['number', 'null'],
      minimum: 0,
      description: 'Beløb investeret i porteføljen (DKK).'
    },
    emissionFactorKey: {
      type: ['string', 'null'],
      enum: [
        'listedEquity',
        'corporateBonds',
        'sovereignBonds',
        'privateEquity',
        'realEstate',
        'infrastructure',
        'diversifiedPortfolio'
      ],
      description: 'Valgt emissionsintensitet (kg CO2e/DKK) for investeringen.'
    },
    documentationQualityPercent: {
      type: ['number', 'null'],
      minimum: 0,
      maximum: 100,
      description: 'Dokumentationskvalitet for linjen (%).'
    }
  },
  additionalProperties: false
} as const

const c10Override = {
  type: 'object',
  title: 'C10Input',
  description: 'Scope 3 upstream leasede aktiver',
  properties: {
    leasedAssetLines: {
      type: 'array',
      maxItems: 20,
      description:
        'Linjer for upstream-leasede aktiver med enten målt energiforbrug eller arealbaseret estimat.',
      items: leasedEnergyLineOverride
    }
  },
  additionalProperties: false
} as const

const c11Override = {
  type: 'object',
  title: 'C11Input',
  description: 'Scope 3 downstream leasede aktiver',
  properties: {
    leasedAssetLines: {
      type: 'array',
      maxItems: 20,
      description:
        'Linjer for leasede aktiver udlejet til kunder downstream med målt energi eller arealbaseret estimat.',
      items: leasedEnergyLineOverride
    }
  },
  additionalProperties: false
} as const

const c12Override = {
  type: 'object',
  title: 'C12Input',
  description: 'Scope 3 franchising og downstream services',
  properties: {
    franchiseLines: {
      type: 'array',
      maxItems: 20,
      description:
        'Linjer for franchiser eller downstream services baseret på omsætning eller energiforbrug.',
      items: franchiseLineOverride
    }
  },
  additionalProperties: false
} as const

const c13Override = {
  type: 'object',
  title: 'C13Input',
  description: 'Scope 3 investeringer og finansielle aktiviteter',
  properties: {
    investmentLines: {
      type: 'array',
      maxItems: 30,
      description: 'Investeringer med beløb og emissionsintensitet (kg CO2e/DKK).',
      items: investmentLineOverride
    }
  },
  additionalProperties: false
} as const

const c14Override = {
  type: 'object',
  title: 'C14Input',
  description: 'Scope 3 behandling af solgte produkter',
  properties: {
    treatmentLines: {
      type: 'array',
      maxItems: 30,
      description: 'Linjer for solgte produkter og deres efterfølgende behandling.',
      items: treatmentLineOverride
    }
  },
  additionalProperties: false
} as const

const c15Override = {
  type: 'object',
  title: 'C15Input',
  description: 'Scope 3 screening af øvrige kategorioplysninger',
  properties: {
    screeningLines: {
      type: 'array',
      maxItems: 40,
      description: 'Linjer for screening af resterende Scope 3-kategorier.',
      items: {
        type: 'object',
        title: 'ScreeningLine',
        properties: {
          category: {
            type: ['string', 'null'],
            enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'],
            description: 'Scope 3-kategorien (1-15) der screenes.'
          },
          description: {
            type: ['string', 'null'],
            maxLength: 240,
            description: 'Kort beskrivelse af aktivitet eller metode.'
          },
          quantityUnit: {
            type: ['string', 'null'],
            maxLength: 32,
            description: 'Enhed for den estimerede mængde (fx DKK, ton, km).'
          },
          estimatedQuantity: {
            type: ['number', 'null'],
            minimum: 0,
            description: 'Estimeret mængde i den valgte enhed.'
          },
          emissionFactorKey: {
            type: ['string', 'null'],
            enum: [
              'category1Spend',
              'category2Spend',
              'category3Energy',
              'category4Logistics',
              'category5Waste',
              'category6Travel',
              'category7Commuting',
              'category8LeasedAssets',
              'category9DownstreamTransport',
              'category10Processing',
              'category11UsePhase',
              'category12EndOfLife',
              'category13LeasedAssetsDownstream',
              'category14Franchises',
              'category15Investments'
            ],
            description: 'Valgt emissionsfaktor for screeningen.'
          },
          documentationQualityPercent: {
            type: ['number', 'null'],
            minimum: 0,
            maximum: 100,
            description: 'Dokumentationskvalitet i procent for screeningen.'
          }
        },
        required: [],
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
} as const

const moduleOverrides: Record<string, unknown> = {
  A1: a1Override,
  A2: a2Override,
  A3: a3Override,
  A4: a4Override,
  B1: b1Override,
  B2: b2Override,
  B3: b3Override,
  B4: b4Override,
  B5: b5Override,
  B6: b6Override,
  C10: c10Override,
  C11: c11Override,
  C12: c12Override,
  C13: c13Override,
  C14: c14Override,
  C15: c15Override,
  D1: d1Override
}

export async function convertCsvToSchema(csvPath: string): Promise<Record<string, unknown>> {
  const raw = await readFile(csvPath, 'utf-8')
  const lines = raw.trim().split(/\r?\n/)
  const [, ...rows] = lines

  const properties = rows.reduce<Record<string, unknown>>((acc, line) => {
    const [module, valueType] = line.split(',').map((cell) => cell.trim())
    if (!module) {
      return acc
    }
    const override = moduleOverrides[module]
    if (override) {
      acc[module] = override
      return acc
    }
    const mappedType = typeMap[valueType ?? '']
    acc[module] = mappedType ?? { type: 'string' }
    return acc
  }, {})

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'ESGInput',
    type: 'object',
    properties,
    additionalProperties: true
  }
}
