export type ResumeContact = {
  name: string
  location: string
  phone: string
  email: string
  linkedin: string
}

const STORAGE_KEY = 'auto-resume.contact.v1'

export function hasStoredContact(): boolean {
  return localStorage.getItem(STORAGE_KEY) != null
}

export function loadContact(): ResumeContact {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        name: 'YOUR NAME',
        location: 'City, ST',
        phone: 'phone',
        email: 'email@example.com',
        linkedin: 'linkedin.com/in/you',
      }
    }
    const parsed = JSON.parse(raw) as Partial<ResumeContact>
    return {
      name: typeof parsed.name === 'string' ? parsed.name : 'YOUR NAME',
      location: typeof parsed.location === 'string' ? parsed.location : 'City, ST',
      phone: typeof parsed.phone === 'string' ? parsed.phone : 'phone',
      email: typeof parsed.email === 'string' ? parsed.email : 'email@example.com',
      linkedin: typeof parsed.linkedin === 'string' ? parsed.linkedin : 'linkedin.com/in/you',
    }
  } catch {
    return {
      name: 'YOUR NAME',
      location: 'City, ST',
      phone: 'phone',
      email: 'email@example.com',
      linkedin: 'linkedin.com/in/you',
    }
  }
}

export function saveContact(contact: ResumeContact): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contact))
}

