/**
 * ImageUpload — drag & drop + click, compressão automática via canvas.
 * Retorna base64 JPEG. Quando o backend tiver POST /uploads, substituir
 * a função `compressImage` por uma chamada de API que retorne a URL.
 *
 * Props (single image):
 *   value:       string (base64 ou URL) | ""
 *   onChange:    (value: string) => void
 *   label?:      string
 *   hint?:       string
 *   aspect?:     "square" | "wide" | "free"  (default: "free")
 *   crop?:       boolean — abre modal de recorte antes de salvar (default: false)
 *   cropAspect?: number  — proporção do crop (default: 4/3)
 *   maxWidth?:   number  (default 1200)
 *   quality?:    number 0–1 (default 0.82)
 *
 * Props (multiple images):
 *   <MultiImageUpload values={string[]} onChange={fn} max={5} label=""
 *                     crop={true} cropAspect={4/3} />
 */

import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Plus } from "lucide-react";
import C from "../../constants/colors";
import ImageCropper from "./ImageCropper";

// ─── Helpers ───────────────────────────────────────────────────────────────

async function compressImage(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isValidImageFile(file) {
  return file && file.type.startsWith("image/");
}

// ─── Drop zone ─────────────────────────────────────────────────────────────

function DropZone({ onFile, processing, small = false }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (isValidImageFile(file)) onFile(file);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !processing && inputRef.current?.click()}
      style={{
        border: `1.5px dashed ${dragging ? C.green : C.border}`,
        borderRadius: 10,
        padding: small ? "12px 10px" : "28px 16px",
        textAlign: "center",
        cursor: processing ? "wait" : "pointer",
        background: dragging ? `${C.green}08` : C.cardSoft,
        transition: "border-color 0.15s, background 0.15s",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (isValidImageFile(file)) onFile(file);
          e.target.value = "";
        }}
      />
      {processing ? (
        <>
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            border: `2px solid ${C.border}`,
            borderTopColor: C.green,
            animation: "imgup-spin 0.7s linear infinite",
          }} />
          <style>{`@keyframes imgup-spin{to{transform:rotate(360deg)}}`}</style>
          <span style={{ fontSize: 12, color: C.muted }}>Processando...</span>
        </>
      ) : (
        <>
          <Upload size={small ? 16 : 22} color={C.muted} />
          <span style={{ fontSize: small ? 11 : 13, color: C.muted, fontWeight: 600 }}>
            {small ? "Clique ou arraste" : "Clique ou arraste uma imagem"}
          </span>
          {!small && (
            <span style={{ fontSize: 11, color: C.dim }}>PNG, JPG, WEBP — máx. 10MB</span>
          )}
        </>
      )}
    </div>
  );
}

// ─── Single image upload ───────────────────────────────────────────────────

export default function ImageUpload({
  value,
  onChange,
  label,
  hint,
  aspect = "free",
  crop = false,
  cropAspect = 4 / 3,
  maxWidth = 1200,
  quality = 0.82,
}) {
  const [processing, setProcessing] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);

  async function handleFile(file) {
    if (crop) {
      const src = await readAsDataURL(file);
      setCropSrc(src);
      return;
    }
    setProcessing(true);
    try {
      const compressed = await compressImage(file, maxWidth, quality);
      onChange(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => onChange(e.target.result);
      reader.readAsDataURL(file);
    } finally {
      setProcessing(false);
    }
  }

  function handleCropConfirm(croppedBase64) {
    setCropSrc(null);
    onChange(croppedBase64);
  }

  function handleCropCancel() {
    setCropSrc(null);
  }

  const aspectStyle =
    aspect === "square" ? { aspectRatio: "1/1", objectFit: "cover" } :
    aspect === "wide"   ? { aspectRatio: "16/9", objectFit: "cover" } :
    { maxHeight: 200, objectFit: "contain" };

  return (
    <div>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 7, letterSpacing: "0.03em" }}>
          {label}
        </div>
      )}

      {value ? (
        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, background: C.cardSoft }}>
          <img
            src={value}
            alt=""
            style={{ width: "100%", display: "block", ...aspectStyle }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            title="Remover imagem"
            style={{
              position: "absolute", top: 8, right: 8,
              width: 26, height: 26, borderRadius: "50%",
              background: "rgba(0,0,0,0.65)", border: "none",
              color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={13} />
          </button>
          <button
            type="button"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e) => {
                const f = e.target.files?.[0];
                if (isValidImageFile(f)) handleFile(f);
              };
              input.click();
            }}
            style={{
              position: "absolute", bottom: 8, right: 8,
              padding: "4px 10px", borderRadius: 6,
              background: "rgba(0,0,0,0.65)", border: "none",
              color: "#fff", cursor: "pointer",
              fontSize: 11, fontWeight: 600, fontFamily: "inherit",
            }}
          >
            Trocar
          </button>
        </div>
      ) : (
        <DropZone onFile={handleFile} processing={processing} />
      )}

      {hint && <div style={{ fontSize: 11, color: C.dim, marginTop: 5, lineHeight: 1.4 }}>{hint}</div>}

      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          aspect={cropAspect}
          title="Ajustar imagem"
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}

// ─── Multiple images upload ────────────────────────────────────────────────

export function MultiImageUpload({
  values = [],
  onChange,
  max = 5,
  label,
  crop = false,
  cropAspect = 4 / 3,
}) {
  const [processingIdx, setProcessingIdx] = useState(null);
  // { src: string, idx: number } | null
  const [pendingCrop, setPendingCrop] = useState(null);

  async function handleFile(file, idx) {
    if (crop) {
      const src = await readAsDataURL(file);
      setPendingCrop({ src, idx });
      return;
    }
    await applyImage(await compressImage(file), idx);
  }

  async function applyImage(base64, idx) {
    setProcessingIdx(idx);
    try {
      const next = [...values];
      if (idx === values.length) next.push(base64);
      else next[idx] = base64;
      onChange(next);
    } finally {
      setProcessingIdx(null);
    }
  }

  function handleCropConfirm(croppedBase64) {
    if (pendingCrop === null) return;
    const { idx } = pendingCrop;
    setPendingCrop(null);
    applyImage(croppedBase64, idx);
  }

  function handleCropCancel() {
    setPendingCrop(null);
  }

  function remove(idx) {
    const next = values.filter((_, i) => i !== idx);
    onChange(next.length ? next : []);
  }

  return (
    <div>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 10, letterSpacing: "0.03em" }}>
          {label}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
        gap: 8,
      }}>
        {values.map((src, idx) => (
          <div key={idx} style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, aspectRatio: "1/1", background: C.cardSoft }}>
            <img
              src={src}
              alt={`Imagem ${idx + 1}`}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {idx === 0 && (
              <div style={{ position: "absolute", top: 4, left: 4, background: C.green, color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, letterSpacing: "0.04em" }}>
                CAPA
              </div>
            )}
            {/* Re-crop button for existing images */}
            {crop && (
              <button
                type="button"
                title="Recortar"
                onClick={async () => {
                  setPendingCrop({ src, idx });
                }}
                style={{
                  position: "absolute", bottom: 4, left: 4,
                  padding: "2px 7px", borderRadius: 4,
                  background: "rgba(0,0,0,0.7)", border: "none",
                  color: "#fff", cursor: "pointer",
                  fontSize: 9, fontWeight: 800, fontFamily: "inherit",
                  letterSpacing: "0.03em",
                }}
              >
                Recortar
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(idx)}
              style={{
                position: "absolute", top: 4, right: 4,
                width: 20, height: 20, borderRadius: "50%",
                background: "rgba(0,0,0,0.7)", border: "none",
                color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {values.length < max && (
          <div style={{ aspectRatio: "1/1" }}>
            <DropZone
              onFile={(f) => handleFile(f, values.length)}
              processing={processingIdx === values.length}
              small
            />
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: C.dim, marginTop: 7 }}>
        {values.length}/{max} imagens · A primeira será a capa
      </div>

      {pendingCrop && (
        <ImageCropper
          src={pendingCrop.src}
          aspect={cropAspect}
          title={pendingCrop.idx === 0 ? "Ajustar capa do produto" : "Ajustar imagem"}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
