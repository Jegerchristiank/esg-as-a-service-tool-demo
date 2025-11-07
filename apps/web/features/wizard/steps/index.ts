/**
 * Samling af wizardtrinene og metadata til navigation.
 */
'use client'

import dynamic from 'next/dynamic'
import { createElement } from 'react'

import type { ModuleId } from '@org/shared'
import type { WizardStepComponent, WizardStepProps } from './StepTemplate'
import { WizardStepSkeleton } from './WizardStepSkeleton'

const StepLoading = (): JSX.Element => createElement(WizardStepSkeleton)

function createLazyStep<TModule extends Record<string, unknown>, TExport extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TExport
): WizardStepComponent {
  const LazyComponent = dynamic<WizardStepProps>(
    async () => {
      const module = await loader()
      const Component = module[exportName]
      if (typeof Component !== 'function') {
        throw new Error(`Wizard-trin "${String(exportName)}" kunne ikke indlæses`)
      }
      return Component as WizardStepComponent
    },
    { ssr: false, loading: StepLoading }
  )

  return (props) => createElement(LazyComponent, props)
}

const A1Step = createLazyStep(() => import('./A1'), 'A1Step')
const A2Step = createLazyStep(() => import('./A2'), 'A2Step')
const A3Step = createLazyStep(() => import('./A3'), 'A3Step')
const A4Step = createLazyStep(() => import('./A4'), 'A4Step')
const B1Step = createLazyStep(() => import('./B1'), 'B1Step')
const B2Step = createLazyStep(() => import('./B2'), 'B2Step')
const B3Step = createLazyStep(() => import('./B3'), 'B3Step')
const B4Step = createLazyStep(() => import('./B4'), 'B4Step')
const B5Step = createLazyStep(() => import('./B5'), 'B5Step')
const B6Step = createLazyStep(() => import('./B6'), 'B6Step')
const B7Step = createLazyStep(() => import('./B7'), 'B7Step')
const B8Step = createLazyStep(() => import('./B8'), 'B8Step')
const B9Step = createLazyStep(() => import('./B9'), 'B9Step')
const B10Step = createLazyStep(() => import('./B10'), 'B10Step')
const B11Step = createLazyStep(() => import('./B11'), 'B11Step')
const C1Step = createLazyStep(() => import('./C1'), 'C1Step')
const C2Step = createLazyStep(() => import('./C2'), 'C2Step')
const C3Step = createLazyStep(() => import('./C3'), 'C3Step')
const C4Step = createLazyStep(() => import('./C4'), 'C4Step')
const C5Step = createLazyStep(() => import('./C5'), 'C5Step')
const C6Step = createLazyStep(() => import('./C6'), 'C6Step')
const C7Step = createLazyStep(() => import('./C7'), 'C7Step')
const C8Step = createLazyStep(() => import('./C8'), 'C8Step')
const C9Step = createLazyStep(() => import('./C9'), 'C9Step')
const C10Step = createLazyStep(() => import('./C10'), 'C10Step')
const C11Step = createLazyStep(() => import('./C11'), 'C11Step')
const C12Step = createLazyStep(() => import('./C12'), 'C12Step')
const C13Step = createLazyStep(() => import('./C13'), 'C13Step')
const C14Step = createLazyStep(() => import('./C14'), 'C14Step')
const C15Step = createLazyStep(() => import('./C15'), 'C15Step')
const E1ScenariosStep = createLazyStep(() => import('./E1Scenarios'), 'E1ScenariosStep')
const E1CarbonPriceStep = createLazyStep(() => import('./E1CarbonPrice'), 'E1CarbonPriceStep')
const E1RiskGeographyStep = createLazyStep(() => import('./E1RiskGeography'), 'E1RiskGeographyStep')
const E1DecarbonisationDriversStep = createLazyStep(
  () => import('./E1DecarbonisationDrivers'),
  'E1DecarbonisationDriversStep',
)
const E1TargetsStep = createLazyStep(() => import('./E1Targets'), 'E1TargetsStep')
const E2WaterStep = createLazyStep(() => import('./E2Water'), 'E2WaterStep')
const E3PollutionStep = createLazyStep(() => import('./E3Pollution'), 'E3PollutionStep')
const E4BiodiversityStep = createLazyStep(() => import('./E4Biodiversity'), 'E4BiodiversityStep')
const E5ResourcesStep = createLazyStep(() => import('./E5Resources'), 'E5ResourcesStep')
const SBMStep = createLazyStep(() => import('./SBM'), 'SBMStep')
const GOVStep = createLazyStep(() => import('./GOV'), 'GOVStep')
const IROStep = createLazyStep(() => import('./IRO'), 'IROStep')
const MRStep = createLazyStep(() => import('./MR'), 'MRStep')
const S1Step = createLazyStep(() => import('./S1'), 'S1Step')
const S2Step = createLazyStep(() => import('./S2'), 'S2Step')
const S3Step = createLazyStep(() => import('./S3'), 'S3Step')
const S4Step = createLazyStep(() => import('./S4'), 'S4Step')
const G1Step = createLazyStep(() => import('./G1'), 'G1Step')
const D1Step = createLazyStep(() => import('./D1'), 'D1Step')
const D2Step = createLazyStep(() => import('./D2'), 'D2Step')

export type WizardStep = {
  id: ModuleId
  label: string
  component: WizardStepComponent
  scope: WizardScope
  status: WizardStepStatus
}

export type WizardScope = 'Scope 1' | 'Scope 2' | 'Scope 3' | 'Environment' | 'Social' | 'Governance'

export type WizardStepStatus = 'ready' | 'planned'

export const wizardSteps: WizardStep[] = [
  { id: 'B1', label: 'B1 – Scope 2 elforbrug', component: B1Step, scope: 'Scope 2', status: 'ready' },
  { id: 'B2', label: 'B2 – Scope 2 varmeforbrug', component: B2Step, scope: 'Scope 2', status: 'ready' },
  { id: 'B3', label: 'B3 – Scope 2 køleforbrug', component: B3Step, scope: 'Scope 2', status: 'ready' },
  { id: 'B4', label: 'B4 – Scope 2 dampforbrug', component: B4Step, scope: 'Scope 2', status: 'ready' },
  { id: 'B5', label: 'B5 – Scope 2 øvrige energileverancer', component: B5Step, scope: 'Scope 2', status: 'ready' },
  { id: 'B6', label: 'B6 – Scope 2 nettab i elnettet', component: B6Step, scope: 'Scope 2', status: 'ready' },
  { id: 'B7', label: 'B7 – Dokumenteret vedvarende el', component: B7Step, scope: 'Scope 2', status: 'ready' },
  { id: 'B8', label: 'B8 – Egenproduceret vedvarende el', component: B8Step, scope: 'Scope 2', status: 'ready' },
  { id: 'B9', label: 'B9 – Fysisk PPA for vedvarende el', component: B9Step, scope: 'Scope 2', status: 'ready' },
  { id: 'B10', label: 'B10 – Virtuel PPA for vedvarende el', component: B10Step, scope: 'Scope 2', status: 'ready' },
  { id: 'B11', label: 'B11 – Time-matchede certifikater for vedvarende el', component: B11Step, scope: 'Scope 2', status: 'ready' },
  { id: 'A1', label: 'A1 – Scope 1 stationære forbrændingskilder', component: A1Step, scope: 'Scope 1', status: 'ready' },
  { id: 'A2', label: 'A2 – Scope 1 mobile forbrændingskilder', component: A2Step, scope: 'Scope 1', status: 'ready' },
  { id: 'A3', label: 'A3 – Scope 1 procesemissioner', component: A3Step, scope: 'Scope 1', status: 'ready' },
  { id: 'A4', label: 'A4 – Scope 1 flugtige emissioner', component: A4Step, scope: 'Scope 1', status: 'ready' },
  { id: 'C1', label: 'C1 – Medarbejderpendling', component: C1Step, scope: 'Scope 3', status: 'ready' },
  { id: 'C2', label: 'C2 – Forretningsrejser', component: C2Step, scope: 'Scope 3', status: 'ready' },
  { id: 'C3', label: 'C3 – Brændstof- og energirelaterede aktiviteter', component: C3Step, scope: 'Scope 3', status: 'ready' },
  { id: 'C4', label: 'C4 – Transport og distribution (upstream)', component: C4Step, scope: 'Scope 3', status: 'ready' },
  { id: 'C5', label: 'C5 – Affald fra drift (upstream)', component: C5Step, scope: 'Scope 3', status: 'ready' },
  { id: 'C6', label: 'C6 – Udlejede aktiver (upstream)', component: C6Step, scope: 'Scope 3', status: 'ready' },
  { id: 'C7', label: 'C7 – Transport og distribution (downstream)', component: C7Step, scope: 'Scope 3', status: 'ready' },
  { id: 'C8', label: 'C8 – Udlejede aktiver (downstream)', component: C8Step, scope: 'Scope 3', status: 'ready' },
  { id: 'C9', label: 'C9 – Forarbejdning af solgte produkter', component: C9Step, scope: 'Scope 3', status: 'ready' },
  { id: 'C10', label: 'C10 – Upstream leasede aktiver', component: C10Step, scope: 'Scope 3', status: 'ready' },
  { id: 'C11', label: 'C11 – Downstream leasede aktiver', component: C11Step, scope: 'Scope 3', status: 'ready' },
  { id: 'C12', label: 'C12 – Franchising og downstream services', component: C12Step, scope: 'Scope 3', status: 'ready' },
  { id: 'C13', label: 'C13 – Investeringer og finansielle aktiviteter', component: C13Step, scope: 'Scope 3', status: 'ready' },
  { id: 'C14', label: 'C14 – Behandling af solgte produkter', component: C14Step, scope: 'Scope 3', status: 'ready' },
  { id: 'C15', label: 'C15 – Øvrige kategorioplysninger', component: C15Step, scope: 'Scope 3', status: 'ready' },
  {
    id: 'E1Scenarios',
    label: 'E1 – Klimascenarier',
    component: E1ScenariosStep,
    scope: 'Environment',
    status: 'ready',
  },
  {
    id: 'E1CarbonPrice',
    label: 'E1 – Interne CO₂-priser',
    component: E1CarbonPriceStep,
    scope: 'Environment',
    status: 'ready',
  },
  {
    id: 'E1RiskGeography',
    label: 'E1 – Risikogeografi',
    component: E1RiskGeographyStep,
    scope: 'Environment',
    status: 'ready',
  },
  {
    id: 'E1DecarbonisationDrivers',
    label: 'E1 – Decarboniseringsdrivere',
    component: E1DecarbonisationDriversStep,
    scope: 'Environment',
    status: 'ready',
  },
  {
    id: 'E1Targets',
    label: 'E1 – Klimamål og handlinger',
    component: E1TargetsStep,
    scope: 'Governance',
    status: 'ready'
  },
  {
    id: 'E2Water',
    label: 'E2 – Vandforbrug og vandstress',
    component: E2WaterStep,
    scope: 'Environment',
    status: 'ready'
  },
  {
    id: 'E3Pollution',
    label: 'E3 – Emissioner til luft, vand og jord',
    component: E3PollutionStep,
    scope: 'Environment',
    status: 'ready'
  },
  {
    id: 'E4Biodiversity',
    label: 'E4 – Påvirkning af biodiversitet',
    component: E4BiodiversityStep,
    scope: 'Environment',
    status: 'ready'
  },
  {
    id: 'E5Resources',
    label: 'E5 – Ressourcer og materialeforbrug',
    component: E5ResourcesStep,
    scope: 'Environment',
    status: 'ready'
  },
  {
    id: 'SBM',
    label: 'ESRS 2 – Strategi og forretningsmodel',
    component: SBMStep,
    scope: 'Governance',
    status: 'ready'
  },
  {
    id: 'GOV',
    label: 'ESRS 2 – Governance',
    component: GOVStep,
    scope: 'Governance',
    status: 'ready'
  },
  {
    id: 'IRO',
    label: 'ESRS 2 – Impacts, risici og muligheder',
    component: IROStep,
    scope: 'Governance',
    status: 'ready'
  },
  {
    id: 'MR',
    label: 'ESRS 2 – Metrics og targets',
    component: MRStep,
    scope: 'Governance',
    status: 'ready'
  },
  { id: 'S1', label: 'S1 – Arbejdsstyrke & headcount', component: S1Step, scope: 'Social', status: 'ready' },
  { id: 'S2', label: 'S2 – Værdikædearbejdere', component: S2Step, scope: 'Social', status: 'ready' },
  { id: 'S3', label: 'S3 – Lokalsamfund og påvirkninger', component: S3Step, scope: 'Social', status: 'ready' },
  { id: 'S4', label: 'S4 – Forbrugere og slutbrugere', component: S4Step, scope: 'Social', status: 'ready' },
  {
    id: 'G1',
    label: 'G1 – Governance-politikker & targets',
    component: G1Step,
    scope: 'Governance',
    status: 'ready'
  },
  { id: 'D1', label: 'D1 – Metode & governance', component: D1Step, scope: 'Governance', status: 'ready' },
  {
    id: 'D2',
    label: 'D2 – Dobbelt væsentlighed & CSRD-gaps',
    component: D2Step,
    scope: 'Governance',
    status: 'ready'
  }
]
