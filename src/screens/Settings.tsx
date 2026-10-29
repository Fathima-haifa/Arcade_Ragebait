import { useState } from 'react'
import { useProgress } from '../state/ProgressContext'
import ArcadeButton from '../components/ArcadeButton'
import ConfirmDialog from '../components/ConfirmDialog'

export function Settings({
  onBack,
  onReset,
}: {
  onBack: () => void
  onReset: () => void
}) {
  const { progress, updateSettings, newGame } = useProgress()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const motionOn = progress.settings.motion

  return (
    <section className="set-wrap">
      <h2 className="screen-title">SETTINGS</h2>

      <div className="set-row">
        <div>
          <div className="set-label">Motion effects</div>
          <div className="set-hint">Shaking, pulsing and animations. Turn off if it makes you dizzy.</div>
        </div>
        <button
          role="switch"
          aria-checked={motionOn}
          className={motionOn ? 'set-switch set-on' : 'set-switch'}
          onClick={() => updateSettings({ motion: !motionOn })}
        >
          {motionOn ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="set-row">
        <div>
          <div className="set-label">Start over</div>
          <div className="set-hint">Deletes your Rage Points, progress and achievements.</div>
        </div>
        <ArcadeButton variant="danger" onClick={() => setConfirmOpen(true)}>
          New Game
        </ArcadeButton>
      </div>

      <ArcadeButton onClick={onBack}>Back</ArcadeButton>

      <ConfirmDialog
        open={confirmOpen}
        title="Start a new game?"
        message="This erases everything. There is no undo."
        confirmLabel="Yes, erase it"
        onConfirm={() => {
          newGame()
          setConfirmOpen(false)
          onReset()
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  )
}

export default Settings