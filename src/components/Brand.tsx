export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`brand ${compact ? "brand--compact" : ""}`}
      aria-label="GeradorCheck Pro"
    >
      <span className="brand__mark" aria-hidden="true">
        G
      </span>
      <span className="brand__text">
        <span>GERADORCHECK</span>
        <em>PRO</em>
      </span>
    </span>
  );
}
