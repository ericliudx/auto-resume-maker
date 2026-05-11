export const MAX_RELEVANT_COURSES = 4

export function capRelevantCoursesList(courses: string[] | undefined): string[] | undefined {
  if (!courses?.length) return undefined
  const capped = courses.slice(0, MAX_RELEVANT_COURSES)
  return capped.length ? capped : undefined
}
