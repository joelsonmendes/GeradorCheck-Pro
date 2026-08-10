import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { Button } from "./ui";

export function SignaturePad({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#061322";
      if (value) {
        const image = new Image();
        image.onload = () =>
          ctx.drawImage(image, 0, 0, rect.width, rect.height);
        image.src = value;
      }
      setReady(true);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []); // O valor inicial é aplicado uma única vez para não interromper o desenho.

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!ready) return;
    drawing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const ctx = event.currentTarget.getContext("2d");
    const p = point(event);
    ctx?.beginPath();
    ctx?.moveTo(p.x, p.y);
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = event.currentTarget.getContext("2d");
    const p = point(event);
    ctx?.lineTo(p.x, p.y);
    ctx?.stroke();
  }

  function end(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(event.currentTarget.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  }

  return (
    <div className="signature-pad">
      <div className="signature-pad__header">
        <b>{label}</b>
        <Button type="button" variant="ghost" onClick={clear}>
          <Eraser size={16} /> Limpar
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        aria-label={label}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      <small>Assine com o dedo ou com uma caneta touch.</small>
    </div>
  );
}
