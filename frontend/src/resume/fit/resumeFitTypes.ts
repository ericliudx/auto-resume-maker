export type FitConfig = {
  expLimit: number;
  projLimit: number;
  /** Bullet caps per `bank.experiences` index; only indices `< expLimit` are shown. */
  experienceBulletCounts: number[];
  /** Bullet caps per `bank.projects` index; only indices `< projLimit` are shown. */
  projectBulletCounts: number[];
  /**
   * Round-robin phase for experience bullet trims (bottom → … → top, repeat).
   * Cycle position `p` maps to experience index `expLimit - 1 - p`.
   */
  experienceTrimCursor: number;
  /**
   * Round-robin phase for project bullet trims (bottom → … → top, repeat).
   * Cycle position `p` maps to project index `projLimit - 1 - p`.
   */
  projectTrimCursor: number;
};
