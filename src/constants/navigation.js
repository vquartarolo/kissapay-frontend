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
  ShieldCheck,
  Users,
  ScrollText,
  Menu,
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

  {
    id: "saque",
    label: "Saque",
    icon: ArrowUpRight,
    children: [
      {
        id: "sacar",
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
  { id: "dashboard",    label: "Início",  icon: Home },
  { id: "recebimentos", label: "Receber", icon: ArrowDownLeft },
  { id: "sacar",        label: "Sacar",   icon: ArrowUpRight },
  { id: "menu",         label: "Menu",    icon: Menu },
];

export const DRAWER_SECTIONS = [
  {
    title: "Negócio",
    items: [
      { id: "recebimentos", label: "Recebimentos",           icon: ArrowDownLeft },
      {
        id: "loja",
        label: "Loja",
        icon: ShoppingBag,
        children: [
          { id: "produtos",  label: "Produtos",  icon: Package },
          { id: "checkouts", label: "Checkouts", icon: LayoutTemplate },
        ],
      },
      {
        id: "criarCobranca",
        label: "Criar Cobrança",
        icon: QrCode,
        children: [
          { id: "criarPix",    label: "Via PIX",    icon: QrCode },
          { id: "criarCripto", label: "Via Cripto",  icon: Coins },
        ],
      },
      { id: "historico", label: "Histórico de Cobranças", icon: History },
      { id: "wallet",    label: "Carteira",               icon: Wallet },
    ],
  },
  {
    title: "Saques",
    items: [
      {
        id: "saqueHub",
        label: "Solicitar Saque",
        icon: ArrowUpRight,
        children: [
          { id: "sacar",    label: "Via Cripto", icon: Coins },
          { id: "sacarPix", label: "Via PIX",    icon: QrCode },
        ],
      },
      { id: "historico", label: "Histórico de Saques", icon: History },
    ],
  },
  {
    title: "Conta",
    items: [
      { id: "apikeys",       label: "API Keys",      icon: Key },
      { id: "integracoes",   label: "Integrações",   icon: Plug2 },
      { id: "dominios",      label: "Domínios",      icon: Globe },
      { id: "configuracoes", label: "Configurações", icon: Settings },
    ],
  },
  {
    title: "Área Administrativa",
    adminOnly: true,
    items: [
      { id: "adminKyc",         label: "KYC",                 icon: ShieldCheck },
      { id: "adminWithdrawals", label: "Saques / Aprovações", icon: Wallet },
      { id: "adminManage",      label: "Gerenciar",           icon: Users },
      { id: "adminAudit",       label: "Auditoria",           icon: ScrollText },
      { id: "adminConfig",      label: "Config. padrão",      icon: Settings },
    ],
  },
];
