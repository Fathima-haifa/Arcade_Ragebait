import { useEffect, useRef, useState } from 'react'
import { useProgress } from '../../state/ProgressContext'
import ArcadeButton from '../../components/ArcadeButton'
import ResultModal from '../../components/ResultModal'
import { createGame, step, W, H, type GameState } from './logic'
import './ghosthole.css'

type Phase = 'intro' | 'playing' | 'over'
type Dir = 'up' | 'down' | 'left' | 'right'

function toHud(g: GameState) {
  return {
    collected: g.collected,
    target: g.target,
    lives: g.lives,
    time: Math.ceil(g.timeLeft),
    flipped: g.reversed > 0,
    warn: g.reversed <= 0 && g.nextReverse < 1.2,
  }
}

export function GhostHole({ onBack }: { onBack: () => void }) {
  const { progress, award, completeGame, recordLoss, unlock } = useProgress()

  const [phase, setPhase] = useState<Phase>('intro')
  const [attempts, setAttempts] = useState(0)
  const [result, setResult] = useState<{
    won: boolean
    points: number
    reason: string
  } | null>(null)
  const [hud, setHud] = useState(toHud(createGame(0)))

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameState | null>(null)
  const finished = useRef(false)
  const hudKey = useRef('')
  const keys = useRef<Set<string>>(new Set())
  const pad = useRef({ up: false, down: false, left: false, right: false })

  const finish = (won: boolean, reason: string) => {
    if (finished.current) return
    finished.current = true
    unlock('first-rage')
    let points = 0
    if (won) {
      if (award('ghosthole-win', 100)) points = 100
      completeGame('ghosthole')
    } else {
      if (award('ghosthole-try', 10)) points = 10
      recordLoss()
      if (progress.losses + 1 >= 3) unlock('certified-victim')
      setAttempts((a) => a + 1)
    }
    setResult({ won, points, reason })
    setPhase('over')
  }

  const onEvent = (e: string) => {
    if (e === 'swallow') unlock('rule-breaker')
  }

  // always keep the newest functions available to the game loop
  const latest = useRef({ finish, onEvent })
  useEffect(() => {
    latest.current = { finish, onEvent }
  })

  const start = () => {
    const g = createGame(attempts)
    gameRef.current = g
    finished.current = false
    hudKey.current = ''
    pad.current = { up: false, down: false, left: false, right: false }
    setResult(null)
    setHud(toHud(g))
    setPhase('playing')
  }

  // keyboard
  useEffect(() => {
    const names = [
      'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd',
    ]
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (names.includes(k)) {
        keys.current.add(k)
        e.preventDefault()
      }
    }
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase())
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    const pressed = keys.current
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      pressed.clear()
    }
  }, [])

  const readInput = () => {
    const k = keys.current
    const p = pad.current
    const left = k.has('arrowleft') || k.has('a') || p.left
    const right = k.has('arrowright') || k.has('d') || p.right
    const up = k.has('arrowup') || k.has('w') || p.up
    const down = k.has('arrowdown') || k.has('s') || p.down
    return { x: (right ? 1 : 0) - (left ? 1 : 0), y: (down ? 1 : 0) - (up ? 1 : 0) }
  }

  const draw = (g: GameState, t: number) => {
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return

    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#1a0b2e')
    bg.addColorStop(1, '#0b0414')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // black hole
    const h = g.hole
    const glow = ctx.createRadialGradient(h.x, h.y, 2, h.x, h.y, h.r * 3)
    glow.addColorStop(0, '#000')
    glow.addColorStop(0.35, '#2b0a4d')
    glow.addColorStop(1, 'rgba(168,85,247,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(h.x, h.y, h.r * 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ec4899'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(h.x, h.y, h.r - 2, 0, Math.PI * 2)
    ctx.fill()

    // orbs
    for (const o of g.orbs) {
      ctx.shadowColor = '#f0abfc'
      ctx.shadowBlur = 18
      ctx.fillStyle = '#f9a8d4'
      ctx.beginPath()
      ctx.arc(o.x, o.y, 10 + Math.sin(t / 200) * 2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.shadowBlur = 0

    // ghosts and player
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '30px "Segoe UI Emoji", serif'
    for (const gh of g.ghosts) {
      if (gh.away > 0) continue
      ctx.fillText('👻', gh.x, gh.y)
    }
    const blink = g.invincible > 0 && Math.floor(t / 100) % 2 === 0
    if (!blink) {
      ctx.font = '28px "Segoe UI Emoji", serif'
      ctx.fillText('🧠', g.player.x, g.player.y)
    }

    if (g.reversed > 0) {
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 8
      ctx.strokeRect(4, 4, W - 8, H - 8)
      ctx.fillStyle = '#fecaca'
      ctx.font = 'bold 18px monospace'
      ctx.fillText('CONTROLS FLIPPED!', W / 2, 26)
    }
  }

  // the game loop
  useEffect(() => {
    if (phase !== 'playing') return
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const g = gameRef.current
      if (!g) return
      const dt = (now - last) / 1000
      last = now
      const events = step(g, dt, readInput())
      for (const e of events) latest.current.onEvent(e)
      draw(g, now)

      const nextHud = toHud(g)
      const key = JSON.stringify(nextHud)
      if (key !== hudKey.current) {
        hudKey.current = key
        setHud(nextHud)
      }

      if (g.status !== 'playing') {
        latest.current.finish(g.status === 'won', g.reason)
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const padBtn = (dir: Dir, label: string) => (
    <button
      className={`gh-pad-btn gh-${dir}`}
      aria-label={`Move ${dir}`}
      onPointerDown={(e) => {
        e.preventDefault()
        pad.current[dir] = true
      }}
      onPointerUp={() => {
        pad.current[dir] = false
      }}
      onPointerLeave={() => {
        pad.current[dir] = false
      }}
      onPointerCancel={() => {
        pad.current[dir] = false
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  )

  const reasonText =
    result?.reason === 'time'
      ? 'Time ran out. The ghosts kept your thoughts.'
      : result?.reason === 'lives'
        ? 'Out of lives. The ghosts moved in.'
        : 'You collected enough thoughts.'

  return (
    <div className="gh-wrap">
      <h2 className="screen-title gh-title">GHOST HOLE MY BRAIN</h2>

      {phase === 'intro' && (
        <div className="card gh-intro">
          <p>Your brain is haunted. Grab the glowing thoughts before time runs out.</p>
          <ul>
            <li>Move: arrow keys / WASD, or the buttons on a phone.</li>
            <li>Collect {hud.target} glowing thoughts. Some are shy.</li>
            <li>Ghosts chase you. Each touch costs a life.</li>
            <li>The black hole pulls everything in. Stay out of its center.</li>
            <li>Sometimes the ghosts flip your controls. You get a warning.</li>
            <li>Rumor: the hole is hungry.</li>
          </ul>
          <div className="gh-row">
            <ArcadeButton variant="primary" onClick={start}>
              START HAUNTING
            </ArcadeButton>
            <ArcadeButton variant="ghost" onClick={onBack}>
              BACK
            </ArcadeButton>
          </div>
        </div>
      )}

      {phase !== 'intro' && (
        <>
          <div className="gh-hud">
            <span>❤️ {hud.lives}</span>
            <span>
              🔮 {hud.collected}/{hud.target}
            </span>
            <span className={hud.time <= 10 ? 'gh-low' : ''}>⏱ {hud.time}s</span>
          </div>
          <div className="gh-warn">
            {hud.warn ? '👻 WHISPERS... CONTROLS ABOUT TO FLIP!' : '\u00A0'}
          </div>
          <canvas ref={canvasRef} width={W} height={H} className="gh-canvas" />
          <div className="gh-pad">
            {padBtn('up', '▲')}
            {padBtn('left', '◀')}
            {padBtn('down', '▼')}
            {padBtn('right', '▶')}
          </div>
        </>
      )}

      <ResultModal
        open={phase === 'over' && result !== null}
        won={result?.won ?? false}
        message={
          result?.won
            ? 'You kept your brain. The ghosts are furious.'
            : 'The ghosts win this round. Try again.'
        }
        points={result?.points ?? 0}
        reason={reasonText}
        onReplay={start}
        onBack={onBack}
      />
    </div>
  )
}

export default GhostHole