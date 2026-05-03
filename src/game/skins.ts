export type SkinId = 'palantir' | 'stealth' | 'doom' | 'masterchief' | 'unreal'

export interface SkinConfig {
  name: string
  desc: string
  accent: string        // UI highlight color
  uniform: string
  uniformEmissive: string
  uniformEmissiveIntensity: number
  helmet: string
  helmetEmissive: string
  helmetEmissiveIntensity: number
  pants: string
  skin: string          // face skin tone
  metalness: number
}

export const SKIN_CONFIGS: Record<SkinId, SkinConfig> = {
  palantir: {
    name: 'Palantir Suit',
    desc: 'Standard-Kampfanzug · Orange/Silber',
    accent: '#ff8800',
    uniform:                  '#aa4400',
    uniformEmissive:          '#441100',
    uniformEmissiveIntensity: 0.3,
    helmet:                   '#c0c0c0',
    helmetEmissive:           '#888888',
    helmetEmissiveIntensity:  0.55,
    pants:                    '#332200',
    skin:                     '#d4956a',
    metalness:                0.45,
  },
  stealth: {
    name: 'Palantir Stealth',
    desc: 'Tarnanzug · Grau mit orangenen Akzenten',
    accent: '#ff6600',
    uniform:                  '#2a2a2a',
    uniformEmissive:          '#111111',
    uniformEmissiveIntensity: 0.2,
    helmet:                   '#1e1e1e',
    helmetEmissive:           '#cc4400',
    helmetEmissiveIntensity:  0.7,
    pants:                    '#1a1a1a',
    skin:                     '#c07848',
    metalness:                0.6,
  },
  doom: {
    name: 'Doom Guy',
    desc: 'Marine-Rüstung · UAC-Grün',
    accent: '#44aa22',
    uniform:                  '#3a6a1a',
    uniformEmissive:          '#1a3008',
    uniformEmissiveIntensity: 0.15,
    helmet:                   '#2a5010',
    helmetEmissive:           '#1a3008',
    helmetEmissiveIntensity:  0.2,
    pants:                    '#5a4a1a',
    skin:                     '#c8825a',
    metalness:                0.25,
  },
  masterchief: {
    name: 'Master Chief',
    desc: 'MJOLNIR Mk.VI · Spartan-117',
    accent: '#88cc44',
    uniform:                  '#2e4a1a',
    uniformEmissive:          '#0a1a06',
    uniformEmissiveIntensity: 0.2,
    helmet:                   '#8a7a1a',
    helmetEmissive:           '#6a5a08',
    helmetEmissiveIntensity:  0.65,
    pants:                    '#1e3010',
    skin:                     '#d4956a',
    metalness:                0.55,
  },
  unreal: {
    name: 'Unreal Tournament',
    desc: 'Liandri Armor · Rot/Chrome',
    accent: '#cc2200',
    uniform:                  '#888888',
    uniformEmissive:          '#222222',
    uniformEmissiveIntensity: 0.15,
    helmet:                   '#cc2200',
    helmetEmissive:           '#880000',
    helmetEmissiveIntensity:  0.8,
    pants:                    '#555555',
    skin:                     '#d4956a',
    metalness:                0.75,
  },
}

export const SKIN_ORDER: SkinId[] = ['palantir', 'stealth', 'doom', 'masterchief', 'unreal']
