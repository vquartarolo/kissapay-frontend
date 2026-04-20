import {
  Home,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Key,
  Settings,
  QrCode,
  Coins,
  Wallet,
  Package,
  ShoppingBag,
  LayoutTemplate,
  Plug2,
  Globe,
} from "lucide-react";

export const NAV = [
  {
    id: "dashboard",
    label: "Inicio",
    icon: Home,
  },
  {
    id: "recebimentos",
    label: "Recebimentos",
    icon: ArrowDownLeft,
  },
  {
    id: "wallet",
    label: "Carteira",
    icon: Wallet,
  },
  {
    id: "loja",
    label: "Loja",
    icon: ShoppingBag,
    children: [
      {
        id: "produtos",
        label: "Produtos",
        icon: Package,
      },
      {
        id: "checkouts",
        label: "Checkouts",
        icon: LayoutTemplate,
      },
    ],
  },

  // 🔥 GRUPO: CRIAR COBRANÇA
  {
    id: "criarCobranca",
    label: "Criar Cobranca",
    icon: QrCode,
    children: [
      {
        id: "criarPix",
        label: "PIX",
        icon: QrCode,
      },
      {
        id: "criarCripto",
        label: "Cripto",
        icon: Coins,
      },
    ],
  },

  // 🔥 GRUPO: SAQUE
  {
    id: "saque",
    label: "Saque",
    icon: ArrowUpRight,
    children: [
      {
        id: "sacar", // mantém compatível
        label: "Cripto",
        icon: Coins,
      },
      {
        id: "sacarPix",
        label: "PIX",
        icon: QrCode,
      },
    ],
  },

  {
    id: "historico",
    label: "Historico de Saques",
    icon: History,
  },
  {
    id: "apikeys",
    label: "API Keys",
    icon: Key,
  },
  {
    id: "integracoes",
    label: "Integrações",
    icon: Plug2,
  },
  {
    id: "dominios",
    label: "Domínios",
    icon: Globe,
  },
  {
    id: "configuracoes",
    label: "Configuracoes",
    icon: Settings,
  },
];

export const BOTTOM = [
  { id: "dashboard", label: "Inicio", icon: Home },
  { id: "recebimentos", label: "Receber", icon: ArrowDownLeft },
  { id: "criarCripto", label: "Cripto", icon: Coins },
  { id: "sacar", label: "Sacar", icon: ArrowUpRight },
  { id: "configuracoes", label: "Config", icon: Settings },
];