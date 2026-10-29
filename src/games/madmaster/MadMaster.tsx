import ArcadeButton from '../../components/ArcadeButton';

export default function MadMaster({ onBack }: { onBack: () => void }) {
  return (
    <section className="landing">
      <h2 className="screen-title">The Mad Master</h2>
      <p className="intro">The boss is still warming up. Come back soon.</p>
      <ArcadeButton onClick={onBack}>Back</ArcadeButton>
    </section>
  );
}