import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { imageFileToDataUrl } from "../lib/media";
import type { PhotoEvidence } from "../types";
import { Button } from "./ui";

export function PhotoEvidenceField({
  photos,
  onChange,
  max = 8,
}: {
  photos: PhotoEvidence[];
  onChange: (photos: PhotoEvidence[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setLoading(true);
    try {
      const available = Math.max(0, max - photos.length);
      const selected = Array.from(files).slice(0, available);
      const next = await Promise.all(
        selected.map(async (file) => ({
          id: crypto.randomUUID(),
          dataUrl: await imageFileToDataUrl(file),
          caption: "",
          createdAt: new Date().toISOString(),
        })),
      );
      onChange([...photos, ...next]);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="photo-field">
      <div className="photo-field__toolbar">
        <div>
          <b>Evidências fotográficas</b>
          <small>
            {photos.length}/{max} fotografias — imagens comprimidas no próprio
            aparelho.
          </small>
        </div>
        <Button
          type="button"
          variant="secondary"
          loading={loading}
          disabled={photos.length >= max}
          onClick={() => inputRef.current?.click()}
        >
          <Camera size={18} /> Adicionar foto
        </Button>
        <input
          ref={inputRef}
          hidden
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(event) => void addFiles(event.target.files)}
        />
      </div>
      {photos.length === 0 ? (
        <div className="photo-field__empty">
          <ImagePlus size={32} />
          <span>Nenhuma evidência adicionada.</span>
        </div>
      ) : (
        <div className="photo-grid">
          {photos.map((photo) => (
            <article className="photo-card" key={photo.id}>
              <img
                src={photo.dataUrl}
                alt={photo.caption || "Evidência do serviço"}
              />
              <input
                value={photo.caption}
                placeholder="Descreva a evidência"
                onChange={(event) =>
                  onChange(
                    photos.map((item) =>
                      item.id === photo.id
                        ? { ...item, caption: event.target.value }
                        : item,
                    ),
                  )
                }
              />
              <button
                type="button"
                aria-label="Excluir fotografia"
                onClick={() =>
                  onChange(photos.filter((item) => item.id !== photo.id))
                }
              >
                <Trash2 size={17} />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
