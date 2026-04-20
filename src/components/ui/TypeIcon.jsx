import { CreditCard, Zap } from "lucide-react";
import C from "../../constants/colors";

export default function TypeIcon({ type }) {
  const isCard = type === "CARD";
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 11, flexShrink: 0,
      background: isCard ? "rgba(212,175,55,0.12)" : "rgba(0,196,106,0.12)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {isCard
        ? <CreditCard size={16} color={C.gold} />
        : <Zap size={16} color={C.green} />
      }
    </div>
  );
}
