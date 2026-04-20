import { createPortal } from "react-dom";

export default function ModalPortal({ children }) {
  const el = document.getElementById("modal-root");
  if (!el) return null;

  return createPortal(children, el);
}