import type { D2Input } from '../../../types'

type MaterialityTopic = NonNullable<D2Input['materialTopics']>[number]

export const d2TopicWithFinancial: MaterialityTopic = {
  title: 'Klimarisiko i forsyningskæden',
  description: 'Leverandører i højrisikoområder',
  riskType: 'risk',
  impactType: 'actual',
  severity: 'severe',
  likelihood: 'likely',
  valueChainSegment: 'upstream',
  remediationStatus: 'planned',
  impactScore: null,
  financialScore: 4,
  financialExceptionApproved: false,
  financialExceptionJustification: null,
  timeline: 'shortTerm',
  responsible: 'CFO',
  csrdGapStatus: 'missing'
}

export const d2TopicWithLowerFinancial: MaterialityTopic = {
  title: 'Cirkulære services',
  description: 'Nye take-back modeller',
  riskType: 'opportunity',
  impactType: 'potential',
  severity: 'major',
  likelihood: 'possible',
  valueChainSegment: 'downstream',
  remediationStatus: 'none',
  impactScore: null,
  financialScore: 2,
  financialExceptionApproved: false,
  financialExceptionJustification: null,
  timeline: 'longTerm',
  responsible: null,
  csrdGapStatus: 'partial'
}

export const d2TopicMissingFinancial: MaterialityTopic = {
  title: 'Datastyring',
  description: 'Mangler moden data governance',
  riskType: 'risk',
  impactType: 'actual',
  severity: 'major',
  likelihood: 'likely',
  valueChainSegment: 'ownOperations',
  remediationStatus: 'inPlace',
  impactScore: null,
  financialScore: null,
  financialExceptionApproved: false,
  financialExceptionJustification: null,
  timeline: 'mediumTerm',
  responsible: null,
  csrdGapStatus: 'missing'
}

export const d2TopicMissingFinancialWithOverride: MaterialityTopic = {
  title: 'Lovpligtig compliance',
  description: 'Myndighedskrav uden kvantificerbar finansiel effekt',
  riskType: 'risk',
  impactType: 'actual',
  severity: 'severe',
  likelihood: 'veryLikely',
  valueChainSegment: 'ownOperations',
  remediationStatus: 'none',
  impactScore: null,
  financialScore: null,
  financialExceptionApproved: true,
  financialExceptionJustification:
    'Finansiel effekt kan ikke kvantificeres, men konsekvenserne er dokumenteret i revisionsnotat af 12/03.',
  timeline: 'shortTerm',
  responsible: 'Head of Compliance',
  csrdGapStatus: 'aligned'
}
