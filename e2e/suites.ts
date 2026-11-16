/** Every spec belongs to one primary suite; compatibility review configs may select subsets. */
export const regressionSpecs = [
  'airlock.spec.ts',
  'bridge-layout.spec.ts',
  'bridge-transition.spec.ts',
  'bulkhead.spec.ts',
  'contact.spec.ts',
  'crew-presence.spec.ts',
  'dialogue.spec.ts',
  'extras.spec.ts',
  'identity.spec.ts',
  'journey.spec.ts',
  'next-phase.spec.ts',
  'physical-monitor.spec.ts',
  'portfolio.spec.ts',
  'recreation.spec.ts',
  'resume.spec.ts',
  'session-reset.spec.ts',
  'station.spec.ts',
  'unified-interior.spec.ts',
  'workstation.spec.ts',
]

/** Historical visual/asset reviews, timing captures and profiling, not gameplay regression. */
export const auditSpecs = [
  'architecture-v2.spec.ts',
  'arrival-performance.spec.ts',
  'fps-scenery.spec.ts',
  'interior-orbit-polish.spec.ts',
  'interior-performance.spec.ts',
  'panoramic-passage-review.spec.ts',
  'refined-interior.spec.ts',
  'roof-performance.spec.ts',
  'stable-fps.spec.ts',
  'warm-interior-review.spec.ts',
]

export const productionSpecs = ['production.spec.ts']
