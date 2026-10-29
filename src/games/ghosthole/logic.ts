export const W = 640
export const H = 400
export const PLAYER_R = 14
export const GHOST_R = 15
export const ORB_R = 10

const PLAYER_SPEED = 150
const PULL_RANGE = 170
const START = { x: 60, y: H - 60 }

export interface Vec {
  x: number
  y: number
}
export interface Ghost extends Vec {
  away: number // seconds left before it comes back (0 = active)
}
export interface Orb extends Vec {
  shy: boolean
  dodged: boolean
}

export interface GameState {
  player: Vec
  ghosts: Ghost[]
  orbs: Orb[]
  hole: Vec & { r: number }
  pull: number
  ghostSpeed: number
  shyChance: number
  reverseTime: number
  nextReverse: number
  reversed: number
  invincible: number
  grace: number
  collected: number
  spawned: number
  target: number
  lives: number
  timeLeft: number
  status: 'playing' | 'won' | 'lost'
  reason: 'win' | 'time' | 'lives'
}

function clampToArena(p: Vec) {
  p.x = Math.min(W - PLAYER_R, Math.max(PLAYER_R, p.x))
  p.y = Math.min(H - PLAYER_R, Math.max(PLAYER_R, p.y))
}

function pullToward(e: Vec, hole: Vec, strength: number, dt: number) {
  const dx = hole.x - e.x
  const dy = hole.y - e.y
  const d = Math.hypot(dx, dy) || 1
  if (d < PULL_RANGE) {
    const f = strength * (1 - d / PULL_RANGE)
    e.x += (dx / d) * f * dt
    e.y += (dy / d) * f * dt
  }
}

function randomSpot(g: GameState, minFromPlayer: number): Vec {
  for (let i = 0; i < 40; i++) {
    const x = 30 + Math.random() * (W - 60)
    const y = 30 + Math.random() * (H - 60)
    const farFromHole = Math.hypot(x - g.hole.x, y - g.hole.y) > g.hole.r + 60
    const farFromPlayer =
      Math.hypot(x - g.player.x, y - g.player.y) > minFromPlayer
    if (farFromHole && farFromPlayer) return { x, y }
  }
  return { x: 60, y: 60 }
}

function spawnOrb(g: GameState) {
  const p = randomSpot(g, 90)
  g.orbs.push({ x: p.x, y: p.y, shy: Math.random() < g.shyChance, dodged: false })
  g.spawned++
}

function respawnGhost(g: GameState, gh: Ghost) {
  const corners = [
    { x: 40, y: 40 },
    { x: W - 40, y: 40 },
    { x: 40, y: H - 40 },
    { x: W - 40, y: H - 40 },
  ]
  let best = corners[0]
  let bestD = -1
  for (const c of corners) {
    const d = Math.hypot(c.x - g.player.x, c.y - g.player.y)
    if (d > bestD) {
      bestD = d
      best = c
    }
  }
  gh.x = best.x
  gh.y = best.y
  gh.away = 0
}

// attempts = how many times the player already lost (pity: easier each time)
export function createGame(attempts: number): GameState {
  const pity = Math.max(0, Math.min(attempts, 5))
  const target = pity >= 3 ? 7 : 8
  const g: GameState = {
    player: { x: START.x, y: START.y },
    ghosts: [
      { x: W - 50, y: 50, away: 0 },
      { x: W - 50, y: H - 50, away: 0 },
      { x: 50, y: 50, away: 0 },
    ].slice(0, pity >= 4 ? 2 : 3),
    orbs: [],
    hole: { x: W / 2, y: H / 2, r: 22 },
    pull: 90 * (1 - 0.1 * pity),
    ghostSpeed: 95 * (1 - 0.08 * pity),
    shyChance: pity >= 3 ? 0 : 0.35,
    reverseTime: Math.max(0.8, 2.5 - 0.3 * pity),
    nextReverse: 8,
    reversed: 0,
    invincible: 2,
    grace: 1.5,
    collected: 0,
    spawned: 0,
    target,
    lives: pity >= 3 ? 4 : 3,
    timeLeft: 40 + pity * 4,
    status: 'playing',
    reason: 'win',
  }
  while (g.spawned < Math.min(3, target)) spawnOrb(g)
  return g
}

// Moves the game forward. Returns a list of things that happened.
export function step(g: GameState, rawDt: number, input: Vec): string[] {
  const ev: string[] = []
  if (g.status !== 'playing') return ev
  const dt = Math.min(rawDt, 0.05)

  g.timeLeft -= dt
  if (g.invincible > 0) g.invincible -= dt
  if (g.grace > 0) g.grace -= dt

  // controls flip (warned about 1 second before)
  if (g.reversed > 0) {
    g.reversed -= dt
  } else {
    g.nextReverse -= dt
    if (g.nextReverse <= 0) {
      g.reversed = g.reverseTime
      g.nextReverse = 9 + Math.random() * 4
      ev.push('flip')
    }
  }

  // player movement
  let dx = input.x
  let dy = input.y
  if (g.reversed > 0) {
    dx = -dx
    dy = -dy
  }
  const len = Math.hypot(dx, dy)
  if (len > 0) {
    g.player.x += (dx / len) * PLAYER_SPEED * dt
    g.player.y += (dy / len) * PLAYER_SPEED * dt
  }
  pullToward(g.player, g.hole, g.pull, dt) // pull is weaker than player speed
  clampToArena(g.player)

  // player touches the black hole
  const dHole = Math.hypot(g.player.x - g.hole.x, g.player.y - g.hole.y)
  if (dHole < g.hole.r && g.invincible <= 0) {
    g.lives--
    g.invincible = 1.5
    g.player = { x: START.x, y: START.y }
    ev.push('hole')
  }

  // ghosts
  for (const gh of g.ghosts) {
    if (gh.away > 0) {
      gh.away -= dt
      if (gh.away <= 0) respawnGhost(g, gh)
      continue
    }
    if (g.grace <= 0) {
      const gx = g.player.x - gh.x
      const gy = g.player.y - gh.y
      const d = Math.hypot(gx, gy) || 1
      gh.x += (gx / d) * g.ghostSpeed * dt
      gh.y += (gy / d) * g.ghostSpeed * dt
    }
    pullToward(gh, g.hole, g.pull * 0.9, dt)
    // the secret: the hole eats ghosts
    if (Math.hypot(gh.x - g.hole.x, gh.y - g.hole.y) < g.hole.r) {
      gh.away = 6
      ev.push('swallow')
      continue
    }
    if (
      g.invincible <= 0 &&
      Math.hypot(gh.x - g.player.x, gh.y - g.player.y) < PLAYER_R + GHOST_R - 4
    ) {
      g.lives--
      g.invincible = 1.5
      ev.push('hit')
    }
  }

  // orbs (shy ones jump away once)
  for (let i = g.orbs.length - 1; i >= 0; i--) {
    const o = g.orbs[i]
    const d = Math.hypot(o.x - g.player.x, o.y - g.player.y)
    if (o.shy && !o.dodged && d < 55) {
      const p = randomSpot(g, 160)
      o.x = p.x
      o.y = p.y
      o.dodged = true
      ev.push('dodge')
      continue
    }
    if (d < PLAYER_R + ORB_R) {
      g.orbs.splice(i, 1)
      g.collected++
      ev.push('orb')
      if (g.spawned < g.target) spawnOrb(g)
    }
  }

  // win or lose
  if (g.collected >= g.target) {
    g.status = 'won'
    g.reason = 'win'
  } else if (g.lives <= 0) {
    g.status = 'lost'
    g.reason = 'lives'
  } else if (g.timeLeft <= 0) {
    g.timeLeft = 0
    g.status = 'lost'
    g.reason = 'time'
  }
  return ev
}