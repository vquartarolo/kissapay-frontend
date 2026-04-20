/**
 * ImageCropper — modal premium de recorte de imagem.
 * Usa react-easy-crop para interação e canvas para gerar a saída final.
 *
 * Props:
 *   src        string        — data URL da imagem original
 *   aspect     number        — proporção (ex: 4/3, 1, 16/9). Default: 4/3
 *   title      string        — título do modal
 *   onConfirm  (base64) => void  — chamado com a imagem recortada em JPEG base64
 *   onCancel   () => void    — chamado ao cancelar sem alterar nada
 */

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import C from "../../constants/colors";

// ─── Canvas crop ────────────────────────────────────────────────────────────

async function getCroppedImg(imageSrc, pixelCrop, outputWidth = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const OUTPUT_W = outputWidth;
      const aspect = pixelCrop.width / pixelCrop.height;
      const OUTPUT_H = Math.round(OUTPUT_W / aspect);

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_W;
      canvas.height = OUTPUT_H;

      canvas
        .getContext("2d")
        .drawImage(
          img,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          OUTPUT_W,
          OUTPUT_H
        );

      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ImageCropper({
  src,
  aspect = 4 / 3,
  outputWidth = 1200,
  title = "Ajustar imagem",
  onConfirm,
  onCancel,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [applying, setApplying] = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setApplying(true);
    try {
      const result = await getCroppedImg(src, croppedAreaPixels, outputWidth);
      onConfirm(result);
    } catch {
      setApplying(false);
    }
  }

  function handleReset() {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }

  const zoomPct = ((zoom - 1) / 2) * 100;

  const el = document.getElementById("modal-root");
  if (!el) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Modal card */}
      <div
        style={{
          width: "100%",
          maxWidth: 540,
          background: C.card,
          border: `1px solid ${C.borderStrong}`,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "calc(100svh - 32px)",
        }}
      >
        {/* ── Header ─────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 22px",
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: C.white,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              Arraste · Scroll para zoom · Confirme o enquadramento
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.borderStrong;
              e.currentTarget.style.color = C.white;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.muted;
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Crop canvas ─────────────────────────────── */}
        <div
          style={{
            position: "relative",
            height: 300,
            background: "#0a0a0a",
            flexShrink: 0,
          }}
        >
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid={false}
            style={{
              containerStyle: { background: "#0a0a0a" },
              cropAreaStyle: {
                border: `2px solid ${C.green}`,
                boxShadow: `0 0 0 9999px rgba(0,0,0,0.52)`,
                borderRadius: 6,
              },
              mediaStyle: { transition: "transform 0.08s" },
            }}
          />
        </div>

        {/* ── Zoom slider ─────────────────────────────── */}
        <div
          style={{
            padding: "13px 22px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <ZoomOut size={14} color={C.muted} style={{ flexShrink: 0 }} />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="orion-crop-slider"
            style={{
              flex: 1,
              WebkitAppearance: "none",
              appearance: "none",
              height: 4,
              borderRadius: 2,
              border: "none",
              outline: "none",
              padding: 0,
              cursor: "pointer",
              background: `linear-gradient(to right, ${C.green} ${zoomPct}%, var(--c-border-strong) ${zoomPct}%)`,
            }}
          />
          <ZoomIn size={14} color={C.muted} style={{ flexShrink: 0 }} />
          <button
            type="button"
            onClick={handleReset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.muted,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              flexShrink: 0,
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = C.borderStrong)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = C.border)
            }
          >
            <RotateCcw size={10} />
            Resetar
          </button>
        </div>

        {/* ── Footer ──────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "14px 22px",
            borderTop: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.muted,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = C.borderStrong)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = C.border)
            }
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={applying}
            style={{
              flex: 2,
              padding: "12px",
              borderRadius: 10,
              border: "none",
              background: applying ? `${C.green}70` : C.green,
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              cursor: applying ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.01em",
              boxShadow: applying ? "none" : `0 4px 20px ${C.green}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              transition: "background 0.15s, box-shadow 0.15s",
            }}
          >
            {applying ? (
              <>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    animation: "orion-crop-spin 0.7s linear infinite",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                Aplicando...
              </>
            ) : (
              "Aplicar recorte"
            )}
          </button>
        </div>
      </div>

      {/* Slider thumb + spin keyframes */}
      <style>{`
        @keyframes orion-crop-spin { to { transform: rotate(360deg); } }
        .orion-crop-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: ${C.green};
          border: 2.5px solid #fff;
          box-shadow: 0 1px 8px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: transform 0.12s;
        }
        .orion-crop-slider::-webkit-slider-thumb:hover { transform: scale(1.18); }
        .orion-crop-slider::-moz-range-thumb {
          width: 18px; height: 18px;
          border-radius: 50%;
          background: ${C.green};
          border: 2.5px solid #fff;
          box-shadow: 0 1px 8px rgba(0,0,0,0.4);
          cursor: pointer;
        }
        .orion-crop-slider::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; }
        .orion-crop-slider::-moz-range-track { height: 4px; border-radius: 2px; background: transparent; }
      `}</style>
    </div>,
    el
  );
}
