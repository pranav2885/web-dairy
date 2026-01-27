export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Subtle warm gradient background */}
      <div 
        className="absolute inset-0" 
        style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(251, 146, 60, 0.06) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(252, 165, 165, 0.05) 0%, transparent 50%)',
        }}
      />
    </div>
  );
}
