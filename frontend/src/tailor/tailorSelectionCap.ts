/** Max experiences and projects on the tailored resume (LLM output, validation, deterministic selection). */
export const MAX_TAILOR_EXPERIENCES = 3
export const MAX_TAILOR_PROJECTS = 3

/** LLM tailor patches: target bullets per experience (e.g. three roles → 2+2+2). Extra bullets are truncated on validate. */
export const TAILOR_LLM_EXPERIENCE_BULLETS = 2

/** LLM tailor patches: target bullets per project (three projects → 2+2+2). Extra bullets are truncated on validate. */
export const TAILOR_LLM_PROJECT_BULLETS = 2
