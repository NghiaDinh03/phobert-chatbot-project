/**
 * Manifest of synthetic sample-evidence assets bundled under
 * `frontend-next/public/sampleEvidence/`. Consumed by later UI steps
 * (e.g. a "Load sample evidence" affordance in the assessment drawer).
 *
 * All files are placeholder/demo only — see `public/sampleEvidence/README.md`.
 */
export const SAMPLE_EVIDENCE_BASE = '/sampleEvidence'

export const SAMPLE_EVIDENCE = [
    {
        id: 'lorem-policy',
        filename: 'lorem-policy.pdf',
        path: `${SAMPLE_EVIDENCE_BASE}/lorem-policy.pdf`,
        mime: 'application/pdf',
        kind: 'document',
        labelKey: 'sampleEvidence.loremPolicy',
        fallbackLabel: 'Lorem-ipsum policy (sample PDF)',
    },
    {
        id: 'screenshot-generic-1',
        filename: 'screenshot-generic-1.png',
        path: `${SAMPLE_EVIDENCE_BASE}/screenshot-generic-1.png`,
        mime: 'image/png',
        kind: 'image',
        labelKey: 'sampleEvidence.screenshot1',
        fallbackLabel: 'Generic screenshot #1 (sample PNG)',
    },
    {
        id: 'screenshot-generic-2',
        filename: 'screenshot-generic-2.png',
        path: `${SAMPLE_EVIDENCE_BASE}/screenshot-generic-2.png`,
        mime: 'image/png',
        kind: 'image',
        labelKey: 'sampleEvidence.screenshot2',
        fallbackLabel: 'Generic screenshot #2 (sample PNG)',
    },
]

export function getSampleEvidence() {
    return SAMPLE_EVIDENCE
}
