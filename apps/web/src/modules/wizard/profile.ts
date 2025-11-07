'use client'

import type { ModuleId } from '@org/shared'

export type WizardProfileKey =
  | 'hasVehicles'
  | 'hasHeating'
  | 'hasIndustrialProcesses'
  | 'usesRefrigerants'
  | 'hasBackupPower'
  | 'hasOpenFlames'
  | 'hasLabGas'
  | 'usesElectricity'
  | 'usesDistrictHeating'
  | 'hasPpaContracts'
  | 'hasGuaranteesOfOrigin'
  | 'leasesWithOwnMeter'
  | 'exportsEnergy'
  | 'purchasesMaterials'
  | 'hasTransportSuppliers'
  | 'generatesWaste'
  | 'leasesEquipment'
  | 'shipsGoodsUpstream'
  | 'usesGlobalFreight'
  | 'hasConsultantsTravel'
  | 'purchasesElectronics'
  | 'producesProducts'
  | 'leasesProducts'
  | 'hasFranchisePartners'
  | 'providesCustomerServices'
  | 'hasProductRecycling'
  | 'shipsFinishedGoods'
  | 'usesLargeWaterVolumes'
  | 'hasIndustrialEmissions'
  | 'impactsNatureAreas'
  | 'managesCriticalMaterials'
  | 'hasInvestments'
  | 'ownsSubsidiaries'
  | 'operatesInternationalOffices'
  | 'hasEsgPolicy'
  | 'hasSupplierCode'
  | 'doesEsgReporting'
  | 'hasBoardOversight'
  | 'isIso14001Certified'
  | 'hasNetZeroTarget'
  | 'hasDataInfrastructure'
  | 'hasMaterialTopics'
  | 'hasMaterialRisks'
  | 'hasMaterialOpportunities'
  | 'hasCsrdGapAssessment'
  | 'hasTransitionPlan'
  | 'assessesClimateResilience'
  | 'tracksFinancialEffects'
  | 'hasRemovalProjects'

export type WizardProfile = Record<WizardProfileKey, boolean | null>

export const ALL_PROFILE_KEYS: WizardProfileKey[] = [
  'hasVehicles',
  'hasHeating',
  'hasIndustrialProcesses',
  'usesRefrigerants',
  'hasBackupPower',
  'hasOpenFlames',
  'hasLabGas',
  'usesElectricity',
  'usesDistrictHeating',
  'hasPpaContracts',
  'hasGuaranteesOfOrigin',
  'leasesWithOwnMeter',
  'exportsEnergy',
  'purchasesMaterials',
  'hasTransportSuppliers',
  'generatesWaste',
  'leasesEquipment',
  'shipsGoodsUpstream',
  'usesGlobalFreight',
  'hasConsultantsTravel',
  'purchasesElectronics',
  'producesProducts',
  'leasesProducts',
  'hasFranchisePartners',
  'providesCustomerServices',
  'hasProductRecycling',
  'shipsFinishedGoods',
  'usesLargeWaterVolumes',
  'hasIndustrialEmissions',
  'impactsNatureAreas',
  'managesCriticalMaterials',
  'hasInvestments',
  'ownsSubsidiaries',
  'operatesInternationalOffices',
  'hasEsgPolicy',
  'hasSupplierCode',
  'doesEsgReporting',
  'hasBoardOversight',
  'isIso14001Certified',
  'hasNetZeroTarget',
  'hasDataInfrastructure',
  'hasMaterialTopics',
  'hasMaterialRisks',
  'hasMaterialOpportunities',
  'hasCsrdGapAssessment',
  'hasTransitionPlan',
  'assessesClimateResilience',
  'tracksFinancialEffects',
  'hasRemovalProjects',
]

export function createInitialWizardProfile(): WizardProfile {
  return ALL_PROFILE_KEYS.reduce<WizardProfile>((profile, key) => {
    profile[key] = null
    return profile
  }, {} as WizardProfile)
}

export type WizardProfileQuestion = {
  id: WizardProfileKey
  label: string
  helpText: string
}

export const WIZARD_PROFILE_FLOW_TYPES = {
  contentPage: 'content-page',
  statusSidebar: 'status-sidebar',
} as const

export type WizardProfileFlowType = (typeof WIZARD_PROFILE_FLOW_TYPES)[keyof typeof WIZARD_PROFILE_FLOW_TYPES]

export type WizardProfileSection = {
  id: string
  heading: string
  description: string
  summaryHint: string
  flow: WizardProfileFlowType
  questions: WizardProfileQuestion[]
}

export type WizardProfileFlowDefinition = {
  id: WizardProfileFlowType
  label: string
  description: string
}

export const wizardProfileFlows: WizardProfileFlowDefinition[] = [
  {
    id: WIZARD_PROFILE_FLOW_TYPES.contentPage,
    label: 'Hovedflow',
    description: 'Viser ét emne ad gangen i stepperen med fuldt fokus på spørgsmålene.',
  },
  {
    id: WIZARD_PROFILE_FLOW_TYPES.statusSidebar,
    label: 'Statuspanel',
    description: 'Opsummerer fremskridt og ubesvarede spørgsmål i sidepanelet.',
  },
]

export const wizardProfileSections: WizardProfileSection[] = [
  {
    id: 'scope-1',
    heading: 'Scope 1 · Direkte udledninger',
    description:
      'Marker alle aktiviteter hvor I selv forbrænder brændsler eller slipper kølemidler og procesgasser ud.',
    summaryHint: 'Egne køretøjer, brændselskedler, kølemidler og procesudledninger.',
    flow: WIZARD_PROFILE_FLOW_TYPES.contentPage,
    questions: [
      {
        id: 'hasVehicles',
        label: 'Driver I egne køretøjer eller mobile maskiner?',
        helpText:
          'Firmabiler, varebiler, lastbiler, entreprenørmaskiner og andet motordrevet udstyr I ejer eller langtidslejer.',
      },
      {
        id: 'hasHeating',
        label: 'Har I kedler, ovne eller andre anlæg der bruger brændsler?',
        helpText:
          'Naturgas-, olie-, biobrændsels- eller andre stationære forbrændingsanlæg til varme og produktion.',
      },
      {
        id: 'hasIndustrialProcesses',
        label: 'Har I industrielle processer der udleder gasser direkte?',
        helpText: 'Cement, metal, kemi, fødevarer eller andre højtemperaturprocesser med procesemissioner.',
      },
      {
        id: 'usesRefrigerants',
        label: 'Bruger I køleanlæg, aircondition eller varmepumper med kølemidler?',
        helpText: 'Alt udstyr hvor lækager kan forekomme – fra butikskølere til centrale anlæg og serverrum.',
      },
      {
        id: 'hasBackupPower',
        label: 'Har I nødgeneratorer eller andet backup-udstyr på brændstof?',
        helpText: 'Diesel- og benzingeneratorer, nødstrømsmotorer og testkørsler af backup-anlæg.',
      },
      {
        id: 'hasOpenFlames',
        label: 'Arbejder I med faste åbne flammer eller svejseprocesser?',
        helpText: 'Glas- og metalbearbejdning, svejseværksteder eller andre permanente flammeprocesser.',
      },
      {
        id: 'hasLabGas',
        label: 'Anvender laboratorierne gasbrændere eller specialgas?',
        helpText: 'Forsknings-, test- og kvalitetslaboratorier med gasforbrug eller specialgasudslip.',
      },
    ],
  },
  {
    id: 'scope-2',
    heading: 'Scope 2 · Indirekte energiforbrug',
    description: 'Angiv hvordan I køber og dokumenterer elektricitet, varme og køling til jeres lokationer.',
    summaryHint: 'Indkøbt strøm og varme, aftaler om grøn energi og egne målere.',
    flow: WIZARD_PROFILE_FLOW_TYPES.statusSidebar,
    questions: [
      {
        id: 'usesElectricity',
        label: 'Forbruger I elektricitet i egne eller lejede lokaler?',
        helpText: 'Kontorer, butikker, produktion, lagre eller datacentre med eget elforbrug.',
      },
      {
        id: 'usesDistrictHeating',
        label: 'Forbruger I fjernvarme, damp eller fjernkøling?',
        helpText: 'Indkøbte varme- og køleleverancer fra energiselskab eller udlejer.',
      },
      {
        id: 'hasPpaContracts',
        label: 'Har I PPA-aftaler for vedvarende energi?',
        helpText: 'Fysiske, virtuelle eller time-matchede Power Purchase Agreements.',
      },
      {
        id: 'hasGuaranteesOfOrigin',
        label: 'Køber I oprindelsesgarantier for at dokumentere grøn strøm?',
        helpText: 'Certifikater eller tilsvarende dokumentation for vedvarende elektricitet.',
      },
      {
        id: 'leasesWithOwnMeter',
        label: 'Lejer I lokaler med egen elmåler og selvstændig afregning?',
        helpText: 'Lejemål hvor I aflæser og betaler for eget elforbrug.',
      },
      {
        id: 'exportsEnergy',
        label: 'Eksporterer eller sælger I egenproduceret energi?',
        helpText: 'Solceller, vind, kraftvarme eller andre anlæg hvor overskud sælges til nettet.',
      },
    ],
  },
  {
    id: 'scope-3-upstream',
    heading: 'Scope 3 · Upstream aktiviteter',
    description: 'Afdæk udledninger fra indkøb, transport og andre aktiviteter før varen når kunden.',
    summaryHint: 'Indkøb, leverandørtransport, affald og leasede aktiver.',
    flow: WIZARD_PROFILE_FLOW_TYPES.statusSidebar,
    questions: [
      {
        id: 'purchasesMaterials',
        label: 'Køber I råvarer, materialer eller halvfabrikata til drift eller produktion?',
        helpText: 'Materialeindkøb til projekter, produktion, byggeri eller videresalg.',
      },
      {
        id: 'hasTransportSuppliers',
        label: 'Bruger I eksterne leverandører til transport eller logistik?',
        helpText: 'Speditører, fragtfirmaer, kurertjenester og andre transportpartnere.',
      },
      {
        id: 'generatesWaste',
        label: 'Genererer I affald fra drift, produktion eller byggeprojekter?',
        helpText: 'Sorterede og usorterede fraktioner, inkl. farligt affald og restprodukter.',
      },
      {
        id: 'leasesEquipment',
        label: 'Lejer I maskiner, køretøjer eller andet udstyr?',
        helpText: 'Kort- og langtidsleje af produktionsudstyr, kontormaskiner eller værktøj.',
      },
      {
        id: 'shipsGoodsUpstream',
        label: 'Sender I varer eller materialer afsted før de når slutkunden?',
        helpText: 'Forsendelser til lagre, distributionscentre eller underleverandører.',
      },
      {
        id: 'usesGlobalFreight',
        label: 'Bruger I international fragt med fly, skib eller langdistance transport?',
        helpText: 'Globale leverandørkæder med containertransport, luftfragt eller langdistancetransport.',
      },
      {
        id: 'hasConsultantsTravel',
        label: 'Har jeres konsulenter eller underleverandører arbejdsrejser på jeres vegne?',
        helpText: 'Partneres eller freelancernes rejser, der faktureres eller bestilles af jer.',
      },
      {
        id: 'purchasesElectronics',
        label: 'Indkøber I regelmæssigt IT-udstyr og elektronik?',
        helpText: 'Computere, telefoner, servere, netværk eller andet elektronik til driften.',
      },
    ],
  },
  {
    id: 'scope-3-downstream',
    heading: 'Scope 3 · Downstream aktiviteter',
    description: 'Vurder klimaaftryk efter produktet forlader jer – fra kundernes brug til investeringer.',
    summaryHint: 'Produktsalg, service, investeringer og internationale aktiviteter.',
    flow: WIZARD_PROFILE_FLOW_TYPES.statusSidebar,
    questions: [
      {
        id: 'producesProducts',
        label: 'Producerer eller sælger I fysiske produkter?',
        helpText: 'Varer, komponenter eller anlæg som kunderne bruger efter salg.',
      },
      {
        id: 'leasesProducts',
        label: 'Leaser eller udlejer I produkter, udstyr eller anlæg?',
        helpText: 'Leasing, udlejningsløsninger eller deleordninger hvor I bevarer ejerskab.',
      },
      {
        id: 'hasFranchisePartners',
        label: 'Har I franchise- eller partnernetværk under jeres brand?',
        helpText: 'Franchisetagere eller partnere med egen drift baseret på jeres koncept.',
      },
      {
        id: 'providesCustomerServices',
        label: 'Tilbyder I service, drift eller support til kundernes brug af jeres løsninger?',
        helpText: 'Serviceaftaler, vedligehold, konsultation eller drift på kundens site.',
      },
      {
        id: 'hasProductRecycling',
        label: 'Har I take-back, genbrug eller genanvendelse af produkter?',
        helpText: 'Retursystemer, genbrugsprogrammer eller håndtering af udtjente produkter.',
      },
      {
        id: 'shipsFinishedGoods',
        label: 'Sender I færdige produkter direkte til kunder eller distributører?',
        helpText: 'Distribution, levering og logistik efter at varen forlader jeres facilitet.',
      },
      {
        id: 'hasInvestments',
        label: 'Har I væsentlige finansielle investeringer eller fonde?',
        helpText: 'Aktieposter, fonde eller investeringer med mulige klimarelaterede effekter.',
      },
      {
        id: 'ownsSubsidiaries',
        label: 'Ejer eller medstyrer I datterselskaber eller joint ventures?',
        helpText: 'Delvist ejede selskaber hvor I har indflydelse på aktiviteter og udledninger.',
      },
      {
        id: 'operatesInternationalOffices',
        label: 'Driver I kontorer eller aktiviteter i andre lande?',
        helpText: 'Internationale kontorer, salgsled, supportfunktioner eller rejseaktiviteter.',
      },
    ],
  },
  {
    id: 'environment',
    heading: 'Miljø · Ressourcer og påvirkninger',
    description: 'Angiv om vandforbrug, udledninger eller naturpåvirkning skal indgå i ESG-arbejdet.',
    summaryHint: 'Vandintensive processer, emissioner, naturhensyn og kritiske materialer.',
    flow: WIZARD_PROFILE_FLOW_TYPES.statusSidebar,
    questions: [
      {
        id: 'usesLargeWaterVolumes',
        label: 'Har I processer der bruger store mængder vand eller ligger i vandstressede områder?',
        helpText: 'Fødevareproduktion, kemi, elektronik eller drift i regioner med høj vandstress.',
      },
      {
        id: 'hasIndustrialEmissions',
        label: 'Har I væsentlige udledninger til luft, vand eller jord med myndighedskrav?',
        helpText: 'Anlæg med miljøtilladelser, renseanlæg eller procesudledninger.',
      },
      {
        id: 'impactsNatureAreas',
        label: 'Påvirker aktiviteterne naturbeskyttede områder eller kræver biodiversitetstiltag?',
        helpText: 'Infrastruktur, råstofudvinding eller landbrug nær Natura 2000 og andre beskyttede zoner.',
      },
      {
        id: 'managesCriticalMaterials',
        label: 'Anvender I kritiske materialer eller metaller i større mængder?',
        helpText: 'Elektronik, batterier, magneter eller materialer på EU’s liste over kritiske råstoffer.',
      },
    ],
  },
  {
    id: 'double-materiality',
    heading: 'Dobbelt væsentlighed og CSRD',
    description: 'Tjek om I allerede har afdækket væsentlige emner, risici, muligheder og jeres CSRD-gap.',
    summaryHint: 'Materialitet, risici, muligheder og gap-analyser.',
    flow: WIZARD_PROFILE_FLOW_TYPES.statusSidebar,
    questions: [
      {
        id: 'hasMaterialTopics',
        label: 'Har I en dokumenteret liste over væsentlige ESG-emner?',
        helpText: 'Resultater fra dobbelt væsentlighedsvurdering eller tilsvarende prioriteringer.',
      },
      {
        id: 'hasMaterialRisks',
        label: 'Har I kortlagt de vigtigste risici – både impact og finansielle?',
        helpText: 'Risikolister med scoringer, sandsynlighed/påvirkning eller kvalitative vurderinger.',
      },
      {
        id: 'hasMaterialOpportunities',
        label: 'Har I identificeret væsentlige muligheder og forretningspotentialer?',
        helpText: 'Innovationsspor og investeringer i bæredygtighed, der kræver prioritering.',
      },
      {
        id: 'hasCsrdGapAssessment',
        label: 'Har I gennemført en CSRD gap-analyse og status på efterlevelse?',
        helpText: 'Oversigt over krav, nuværende status (align/partial/gap) og planlagte opfølgninger.',
      },
    ],
  },
  {
    id: 'governance',
    heading: 'Governance og rapportering',
    description: 'Beskriv hvordan ESG-arbejdet er forankret, målsat og rapporteret i organisationen.',
    summaryHint: 'Politikker, rapportering, mål, data og klimastyring.',
    flow: WIZARD_PROFILE_FLOW_TYPES.statusSidebar,
    questions: [
      {
        id: 'hasEsgPolicy',
        label: 'Har I en skriftlig ESG- eller bæredygtighedspolitik?',
        helpText: 'Overordnede politikker eller strategier for virksomhedens ESG-indsats.',
      },
      {
        id: 'hasSupplierCode',
        label: 'Har I retningslinjer eller Code of Conduct for leverandører?',
        helpText: 'Krav eller aftaler der beskriver ansvarlig drift for leverandører.',
      },
      {
        id: 'doesEsgReporting',
        label: 'Udgiver I allerede ESG- eller klimaregnskaber?',
        helpText: 'CSRD, GHG eller andre formelle rapporter og offentliggørelser.',
      },
      {
        id: 'hasBoardOversight',
        label: 'Er ESG-ansvaret forankret i bestyrelse eller ledelsesfora?',
        helpText: 'Bestyrelsesudvalg, ESG-komité eller dedikerede roller med mandat.',
      },
      {
        id: 'isIso14001Certified',
        label: 'Er I certificeret efter ISO 14001, EMAS eller lignende?',
        helpText: 'Dokumenterede miljøledelsessystemer med ekstern audit.',
      },
      {
        id: 'hasNetZeroTarget',
        label: 'Har I mål for CO₂, energi eller nettonul?',
        helpText: 'Officielle reduktionsmål, SBTi-forpligtelser eller nettonul-planer.',
      },
      {
        id: 'hasDataInfrastructure',
        label: 'Har I systemer og processer til at indsamle ESG-data?',
        helpText: 'IT-platforme, integrationer eller manuelle processer til dataindsamling.',
      },
      {
        id: 'hasTransitionPlan',
        label: 'Har I en formaliseret plan for klimatransitionen?',
        helpText: 'Planer med milepæle, investeringer og ansvarlige for at nå målene.',
      },
      {
        id: 'assessesClimateResilience',
        label: 'Arbejder I med scenarieanalyser eller klimarisikovurderinger?',
        helpText: 'Stresstest, klimatilpasningsplaner eller scenarieanalyser for virksomheden.',
      },
      {
        id: 'tracksFinancialEffects',
        label: 'Sporer I finansielle effekter af klimaindsatsen?',
        helpText: 'Opfølgning på CapEx, OpEx eller finansielle KPI’er knyttet til klima.',
      },
      {
        id: 'hasRemovalProjects',
        label: 'Investerer I i removal-projekter eller klimakreditter?',
        helpText: 'Egne projekter, partnerskaber eller køb af credits til udligning.',
      },
    ],
  },
]

const moduleDependencies: Partial<Record<ModuleId, WizardProfileKey[]>> = {
  A1: ['hasHeating', 'hasIndustrialProcesses', 'hasBackupPower', 'hasOpenFlames', 'hasLabGas'],
  A2: ['hasVehicles'],
  A3: ['hasIndustrialProcesses'],
  A4: ['usesRefrigerants'],
  B1: ['usesElectricity', 'leasesWithOwnMeter'],
  B2: ['hasHeating', 'usesDistrictHeating'],
  B3: ['usesDistrictHeating'],
  B4: ['usesDistrictHeating'],
  B5: ['usesElectricity', 'usesDistrictHeating', 'exportsEnergy'],
  B6: ['usesElectricity'],
  B7: ['hasGuaranteesOfOrigin'],
  B8: ['exportsEnergy'],
  B9: ['hasPpaContracts'],
  B10: ['hasPpaContracts'],
  B11: ['hasPpaContracts', 'hasGuaranteesOfOrigin'],
  C1: ['operatesInternationalOffices'],
  C2: ['hasConsultantsTravel', 'operatesInternationalOffices'],
  C3: ['usesElectricity', 'usesDistrictHeating', 'hasBackupPower'],
  C4: ['hasTransportSuppliers', 'shipsGoodsUpstream'],
  C5: ['generatesWaste'],
  C6: ['leasesEquipment'],
  C7: ['shipsFinishedGoods'],
  C8: ['leasesProducts'],
  C9: ['producesProducts'],
  C10: ['leasesEquipment', 'leasesProducts'],
  C11: ['leasesProducts'],
  C12: ['hasFranchisePartners', 'providesCustomerServices'],
  C13: ['hasInvestments'],
  C14: ['hasProductRecycling'],
  C15: ['producesProducts', 'hasInvestments'],
  E1Targets: ['hasNetZeroTarget'],
  E2Water: ['usesLargeWaterVolumes'],
  E3Pollution: ['hasIndustrialEmissions'],
  E4Biodiversity: ['impactsNatureAreas'],
  E5Resources: ['managesCriticalMaterials', 'purchasesMaterials'],
  SBM: ['doesEsgReporting', 'hasTransitionPlan', 'assessesClimateResilience'],
  GOV: ['hasBoardOversight', 'hasEsgPolicy', 'doesEsgReporting'],
  IRO: ['hasMaterialTopics', 'hasMaterialRisks', 'hasMaterialOpportunities'],
  MR: ['hasTransitionPlan', 'tracksFinancialEffects', 'hasNetZeroTarget', 'hasRemovalProjects'],
  D1: ['hasEsgPolicy', 'doesEsgReporting', 'hasBoardOversight', 'hasNetZeroTarget'],
  D2: ['hasMaterialTopics', 'hasMaterialRisks', 'hasMaterialOpportunities', 'hasCsrdGapAssessment'],
}

export function isModuleRelevant(profile: WizardProfile, moduleId: ModuleId): boolean {
  const dependencies = moduleDependencies[moduleId]
  if (!dependencies || dependencies.length === 0) {
    return true
  }
  return dependencies.some((key) => profile[key] === true)
}

export function countPositiveAnswers(profile: WizardProfile): number {
  return ALL_PROFILE_KEYS.reduce((count, key) => (profile[key] ? count + 1 : count), 0)
}

export function countAnsweredQuestions(profile: WizardProfile): number {
  return ALL_PROFILE_KEYS.reduce((count, key) => (profile[key] !== null ? count + 1 : count), 0)
}

export function isProfileComplete(profile: WizardProfile): boolean {
  return countAnsweredQuestions(profile) === ALL_PROFILE_KEYS.length
}

export function hasAnyAnswer(profile: WizardProfile): boolean {
  return ALL_PROFILE_KEYS.some((key) => profile[key] !== null)
}

export function findFirstRelevantStepIndex(steps: { id: ModuleId }[], profile: WizardProfile): number {
  const index = steps.findIndex((step) => isModuleRelevant(profile, step.id))
  return index === -1 ? 0 : index
}
