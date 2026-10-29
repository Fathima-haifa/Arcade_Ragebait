import { useProgress } from '../state/ProgressContext'
import ArcadeButton from '../components/ArcadeButton'

const BADGES = [
  { id: 'first-rage', icon: '😤', name: 'First Rage', how: 'Play any game.' },
  { id: 'certified-victim', icon: '🤡', name: 'Certified Victim', how: 'Lose 3 times.' },
  { id: 'rule-breaker', icon: '🕵️', name: 'Rule Breaker', how: 'Discover a game\u2019s secret trick.' },
  { id: 'survivor', icon: '🛡️', name: 'Survivor', how: 'Complete any 3 core games.' },
  { id: 'boss-challenger', icon: '😈', name: 'Boss Challenger', how: 'Step into the Mad Master\u2019s arena.' },
  { id: 'arcade-legend', icon: '👑', name: 'Arcade Legend', how: 'Beat all 4 games and the Mad Master.' },
]

export function Achievements({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress()
  const raw: unknown = progress.achievements
  const unlocked = new Set<string>(Array.isArray(raw) ? (raw as string[]) : [])

  return (
    <section className="ach-wrap">
      <h2 className="screen-title">ACHIEVEMENTS</h2>
      <p className="ach-count">
        {BADGES.filter((b) => unlocked.has(b.id)).length} / {BADGES.length} unlocked
      </p>

      <div className="ach-grid">
        {BADGES.map((b) => {
          const got = unlocked.has(b.id)
          return (
            <div key={b.id} className={got ? 'ach-card ach-got' : 'ach-card'}>
              <div className="ach-icon" aria-hidden="true">
                {got ? b.icon : '🔒'}
              </div>
              <div className="ach-name">{got ? b.name : '???'}</div>
              <div className="ach-how">{b.how}</div>
            </div>
          )
        })}
      </div>

      <ArcadeButton onClick={onBack}>Back</ArcadeButton>
    </section>
  )
}

export default Achievements