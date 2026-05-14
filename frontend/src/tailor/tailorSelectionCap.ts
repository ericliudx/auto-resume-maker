/** Max experiences and projects on the tailored resume (LLM output, validation, deterministic selection). */
export const MAX_TAILOR_EXPERIENCES = 3
export const MAX_TAILOR_PROJECTS = 3

/** First N roles in `experienceIds` order get this many LLM bullets (truncated on validate). */
export const TAILOR_LLM_EXPERIENCE_BULLETS_LEAD = 3

/** Remaining selected experiences after the lead slots (third role when three are selected). */
export const TAILOR_LLM_EXPERIENCE_BULLETS_REST = 2

/** How many leading `experienceIds` use `TAILOR_LLM_EXPERIENCE_BULLETS_LEAD`. */
export const TAILOR_LLM_EXPERIENCE_LEAD_ROLE_COUNT = 2

/** LLM tailor patches: target bullets per project (three projects → 2+2+2). Extra bullets are truncated on validate. */
export const TAILOR_LLM_PROJECT_BULLETS = 2
