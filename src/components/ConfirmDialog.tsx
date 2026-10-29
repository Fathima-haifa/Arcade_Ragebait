import ArcadeButton from './ArcadeButton';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, message, confirmLabel, onConfirm, onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div className="overlay">
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <ArcadeButton variant="ghost" onClick={onCancel}>Cancel</ArcadeButton>
          <ArcadeButton variant="danger" onClick={onConfirm}>{confirmLabel}</ArcadeButton>
        </div>
      </div>
    </div>
  );
}