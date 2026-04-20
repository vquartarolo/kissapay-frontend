// ─── ORIONPAY — Integration Hub Data ─────────────────────────────────────────
// Cada integração define: id, nome, categoria, cor de marca, campos,
// passos de configuração e link para documentação oficial.
// O backend deve persistir os dados via PATCH /users/me/integrations
// (ver BACKEND_API_DOCS.md para o contrato completo)

export const CATEGORIES = [
  { id: "all",        label: "Todas"        },
  { id: "analytics",  label: "Analytics"    },
  { id: "ads",        label: "Anúncios"     },
  { id: "google",     label: "Google Suite" },
  { id: "automation", label: "Automação"    },
  { id: "advanced",   label: "Avançado"     },
];

export const INTEGRATIONS = [
  // ─── ANALYTICS ───────────────────────────────────────────────────────────
  {
    id:          "gtm",
    name:        "Google Tag Manager",
    category:    "analytics",
    color:       "#4285F4",
    description: "Centralize todos os seus scripts de rastreamento sem alterar código. Compatível com GA4, Meta Pixel, TikTok Ads e muito mais.",
    fields: [
      {
        key:         "containerId",
        label:       "Container ID",
        placeholder: "GTM-XXXXXXX",
        hint:        "Encontrado em Admin → Container Settings no GTM.",
        pattern:     /^GTM-[A-Z0-9]+$/,
        patternHint: "Formato: GTM-ABC1234",
      },
    ],
    steps: [
      "Acesse tagmanager.google.com e crie ou selecione um container existente.",
      "Em Admin → Container Settings, copie o Container ID (começa com GTM-).",
      "Cole o ID no campo acima e salve.",
      "O snippet GTM será automaticamente injetado em todas as páginas de checkout.",
    ],
    docs:      "https://tagmanager.google.com",
    docsLabel: "Abrir Google Tag Manager",
  },

  {
    id:          "ga4",
    name:        "Google Analytics 4",
    category:    "analytics",
    color:       "#E37400",
    description: "Rastreie sessões, eventos de pagamento e conversões no checkout com a mais recente versão do Google Analytics.",
    fields: [
      {
        key:         "measurementId",
        label:       "Measurement ID",
        placeholder: "G-XXXXXXXXXX",
        hint:        "Encontrado em Admin → Fluxo de dados → detalhes do fluxo web.",
        pattern:     /^G-[A-Z0-9]+$/,
        patternHint: "Formato: G-ABC123XYZ4",
      },
      {
        key:         "apiSecret",
        label:       "API Secret (Measurement Protocol)",
        placeholder: "xxxxxxxxxxxxxxxxxxxxxxxx",
        hint:        "Opcional — necessário apenas para envio de eventos server-side. Criado em Admin → Fluxo de dados → Segredos de API do Measurement Protocol.",
        required:    false,
      },
    ],
    steps: [
      "Acesse analytics.google.com e crie (ou acesse) uma propriedade GA4.",
      "Em Admin → Fluxo de dados, crie um fluxo Web e copie o Measurement ID.",
      "Para envio de eventos server-side, gere um API Secret na mesma seção.",
      "Cole os valores acima e salve.",
    ],
    docs:      "https://analytics.google.com",
    docsLabel: "Abrir Google Analytics",
  },

  {
    id:          "clarity",
    name:        "Microsoft Clarity",
    category:    "analytics",
    color:       "#0078D4",
    description: "Mapas de calor, gravação de sessões e insights de comportamento do usuário. Gratuito e sem limites de tráfego.",
    fields: [
      {
        key:         "projectId",
        label:       "Project ID",
        placeholder: "xxxxxxxxxx",
        hint:        "Encontrado em clarity.microsoft.com → Settings → Overview do projeto.",
      },
    ],
    steps: [
      "Acesse clarity.microsoft.com e crie um novo projeto.",
      "Em Settings → Overview, copie o Project ID.",
      "Cole o ID acima e salve.",
    ],
    docs:      "https://clarity.microsoft.com",
    docsLabel: "Abrir Microsoft Clarity",
  },

  {
    id:          "hotjar",
    name:        "Hotjar",
    category:    "analytics",
    color:       "#FD3A5C",
    description: "Mapas de calor, funis de conversão e gravações de sessão para entender onde os usuários abandonam o checkout.",
    fields: [
      {
        key:         "siteId",
        label:       "Site ID",
        placeholder: "0000000",
        hint:        "Encontrado em Settings → Sites & Organizations no Hotjar.",
        pattern:     /^[0-9]+$/,
        patternHint: "Apenas números",
      },
    ],
    steps: [
      "Acesse hotjar.com e crie um site ou selecione o existente.",
      "Em Settings → Sites & Organizations, copie o Site ID.",
      "Cole o ID acima e salve.",
    ],
    docs:      "https://hotjar.com",
    docsLabel: "Abrir Hotjar",
  },

  // ─── ANÚNCIOS ─────────────────────────────────────────────────────────────
  {
    id:          "meta",
    name:        "Meta (Facebook & Instagram)",
    category:    "ads",
    color:       "#0082FB",
    description: "Pixel de rastreamento + Conversions API (CAPI) para atribuição precisa de vendas mesmo com bloqueadores de anúncio e iOS 14+.",
    fields: [
      {
        key:         "pixelId",
        label:       "Pixel ID",
        placeholder: "000000000000000",
        hint:        "Encontrado em Events Manager → seu pixel → Configurações.",
        pattern:     /^[0-9]+$/,
        patternHint: "Apenas números",
      },
      {
        key:         "accessToken",
        label:       "Access Token (Conversions API)",
        placeholder: "EAAxxxxxxxxxxxxxxxx...",
        hint:        "Opcional mas altamente recomendado. Gerado em Events Manager → pixel → Configurações → Conversions API → Gerar token de acesso.",
        required:    false,
      },
      {
        key:         "testEventCode",
        label:       "Test Event Code",
        placeholder: "TEST00000",
        hint:        "Opcional. Use apenas durante testes para validar eventos no Events Manager.",
        required:    false,
      },
    ],
    steps: [
      "Acesse business.facebook.com → Events Manager e selecione ou crie um pixel.",
      "Em Configurações, copie o Pixel ID.",
      "Para a Conversions API, clique em 'Configurar' → 'Gerar token de acesso' e copie o token.",
      "O Test Event Code é opcional — use apenas para validar eventos antes de ir ao ar.",
    ],
    docs:      "https://business.facebook.com/events_manager",
    docsLabel: "Abrir Events Manager",
  },

  {
    id:          "google_ads",
    name:        "Google Ads",
    category:    "ads",
    color:       "#34A853",
    description: "Rastreamento de conversões para campanhas de pesquisa, display e Performance Max. Calcule o ROAS real das suas campanhas.",
    fields: [
      {
        key:         "conversionId",
        label:       "Conversion ID",
        placeholder: "AW-0000000000",
        hint:        "Encontrado em Ferramentas → Medição → Conversões → sua conversão → Configuração da tag.",
        pattern:     /^AW-[0-9]+$/,
        patternHint: "Formato: AW-1234567890",
      },
      {
        key:         "conversionLabel",
        label:       "Conversion Label",
        placeholder: "xxxxxxxxxxxxxxxxxxxx",
        hint:        "Encontrado na mesma tela do Conversion ID, logo abaixo.",
      },
    ],
    steps: [
      "Acesse ads.google.com → Ferramentas → Medição → Conversões.",
      "Crie uma nova conversão do tipo 'Site' e finalize a configuração.",
      "Na tela de configuração da tag, copie o Conversion ID (AW-XXXXXXXXX) e o Conversion Label.",
      "Cole ambos os valores acima e salve.",
    ],
    docs:      "https://ads.google.com",
    docsLabel: "Abrir Google Ads",
  },

  {
    id:          "tiktok",
    name:        "TikTok Ads",
    category:    "ads",
    color:       "#FE2C55",
    description: "Pixel do TikTok + Events API para rastreamento de conversões em campanhas de vídeo e anúncios In-Feed.",
    fields: [
      {
        key:         "pixelId",
        label:       "Pixel ID",
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXX",
        hint:        "Encontrado em TikTok Ads Manager → Ativos → Eventos → seu pixel → Configurações.",
      },
      {
        key:         "accessToken",
        label:       "Access Token (Events API)",
        placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        hint:        "Opcional. Para envio server-side via Events API. Gerado nas configurações do pixel.",
        required:    false,
      },
    ],
    steps: [
      "Acesse ads.tiktok.com → Ativos → Eventos e crie ou selecione um pixel web.",
      "Em Configurações do pixel, copie o Pixel ID.",
      "Para a Events API, gere um Access Token na mesma tela.",
      "Cole os valores acima e salve.",
    ],
    docs:      "https://ads.tiktok.com",
    docsLabel: "Abrir TikTok Ads Manager",
  },

  {
    id:          "pinterest",
    name:        "Pinterest Tag",
    category:    "ads",
    color:       "#E60023",
    description: "Rastreie conversões e crie audiências personalizadas para campanhas no Pinterest.",
    fields: [
      {
        key:         "tagId",
        label:       "Tag ID",
        placeholder: "0000000000000",
        hint:        "Encontrado em Pinterest Ads → Conversions → Pinterest Tag → Tag ID.",
        pattern:     /^[0-9]+$/,
        patternHint: "Apenas números",
      },
    ],
    steps: [
      "Acesse ads.pinterest.com → Conversions → Pinterest Tag.",
      "Crie uma nova tag ou selecione a existente.",
      "Copie o Tag ID e cole acima.",
    ],
    docs:      "https://ads.pinterest.com",
    docsLabel: "Abrir Pinterest Ads",
  },

  // ─── GOOGLE SUITE ─────────────────────────────────────────────────────────
  {
    id:          "merchant",
    name:        "Google Merchant Center",
    category:    "google",
    color:       "#1A73E8",
    description: "Sincronize seus produtos com o Google Shopping e apareça nas listagens gratuitas de produtos e em campanhas Shopping.",
    fields: [
      {
        key:         "merchantId",
        label:       "Merchant ID",
        placeholder: "000000000",
        hint:        "Encontrado em Merchant Center → Configurações da conta → ID da conta.",
        pattern:     /^[0-9]+$/,
        patternHint: "Apenas números",
      },
    ],
    steps: [
      "Acesse merchants.google.com e crie ou acesse sua conta.",
      "Em Configurações da conta, copie o ID da conta (Merchant ID).",
      "Cole o ID acima e salve.",
      "Os produtos serão automaticamente sincronizados via feed.",
    ],
    docs:      "https://merchants.google.com",
    docsLabel: "Abrir Merchant Center",
  },

  {
    id:          "search_console",
    name:        "Google Search Console",
    category:    "google",
    color:       "#458CF5",
    description: "Monitore o desempenho orgânico dos seus checkouts e páginas de produto no Google Search.",
    fields: [
      {
        key:         "siteUrl",
        label:       "URL da Propriedade",
        placeholder: "https://seudominio.com",
        hint:        "URL exata da propriedade cadastrada no Search Console. Pode ser um domínio completo.",
      },
      {
        key:         "verificationToken",
        label:       "Token de Verificação (HTML Tag)",
        placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        hint:        "Encontrado em Configurações → Métodos de verificação de propriedade → Tag HTML. Copie apenas o valor do atributo 'content'.",
      },
    ],
    steps: [
      "Acesse search.google.com/search-console e adicione uma propriedade.",
      "Escolha o método de verificação 'Tag HTML'.",
      "Copie o valor do atributo content da meta tag fornecida.",
      "Cole a URL da propriedade e o token acima, depois salve.",
      "O token será automaticamente inserido no head das páginas públicas.",
    ],
    docs:      "https://search.google.com/search-console",
    docsLabel: "Abrir Search Console",
  },

  // ─── AUTOMAÇÃO ───────────────────────────────────────────────────────────
  {
    id:          "n8n",
    name:        "N8N",
    category:    "automation",
    color:       "#EA4B71",
    description: "Automatize fluxos de pós-venda: notificações, CRM, e-mail marketing e integrações com qualquer sistema via webhooks.",
    fields: [
      {
        key:         "webhookUrl",
        label:       "Webhook URL",
        placeholder: "https://seu-n8n.com/webhook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        hint:        "URL do nó 'Webhook' no seu workflow N8N. Disponível em Execuções → seu workflow → Webhook node → URL de produção.",
      },
      {
        key:         "authToken",
        label:       "Token de Autenticação",
        placeholder: "Bearer xxxxxxxxxx",
        hint:        "Opcional. Header Authorization enviado em cada requisição para proteger o webhook.",
        required:    false,
      },
    ],
    steps: [
      "No N8N, crie um workflow e adicione um nó 'Webhook'.",
      "Configure o método como POST e copie a URL de produção.",
      "Opcionalmente, adicione um nó de autenticação e copie o token.",
      "Cole a URL (e token, se aplicável) acima e salve.",
      "A plataforma enviará eventos de venda, aprovação e estorno para este webhook.",
    ],
    docs:      "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/",
    docsLabel: "Docs N8N Webhook",
  },

  {
    id:          "zapier",
    name:        "Zapier",
    category:    "automation",
    color:       "#FF4A00",
    description: "Conecte sua conta a mais de 6.000 aplicativos via Zapier: Google Sheets, HubSpot, Slack, ActiveCampaign e muito mais.",
    fields: [
      {
        key:         "webhookUrl",
        label:       "Webhook URL (Catch Hook)",
        placeholder: "https://hooks.zapier.com/hooks/catch/0000000/xxxxxxx/",
        hint:        "Criada ao adicionar um 'Webhooks by Zapier' → 'Catch Hook' como trigger do seu Zap.",
      },
    ],
    steps: [
      "No Zapier, crie um novo Zap e escolha 'Webhooks by Zapier' como trigger.",
      "Selecione 'Catch Hook' e copie a URL gerada.",
      "Configure as ações do Zap (ex: adicionar linha no Google Sheets).",
      "Cole a URL acima, salve e ative o Zap.",
    ],
    docs:      "https://zapier.com/apps/webhook/integrations",
    docsLabel: "Docs Zapier Webhooks",
  },

  {
    id:          "make",
    name:        "Make (ex-Integromat)",
    category:    "automation",
    color:       "#6D00CC",
    description: "Automatize fluxos complexos com lógica avançada, iteradores e processamento de dados. Alternativa poderosa ao Zapier.",
    fields: [
      {
        key:         "webhookUrl",
        label:       "Webhook URL",
        placeholder: "https://hook.eu2.make.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        hint:        "Criada ao adicionar um módulo 'Webhooks → Custom Webhook' como trigger do seu cenário no Make.",
      },
    ],
    steps: [
      "No Make, crie um cenário e adicione o módulo 'Webhooks → Custom Webhook' como primeiro módulo.",
      "Clique em 'Add' para criar um novo webhook e copie a URL gerada.",
      "Configure os módulos seguintes (ex: enviar e-mail, atualizar CRM).",
      "Cole a URL acima, salve e ative o cenário.",
    ],
    docs:      "https://www.make.com/en/help/tools/webhooks",
    docsLabel: "Docs Make Webhooks",
  },

  // ─── AVANÇADO ─────────────────────────────────────────────────────────────
  {
    id:          "stape",
    name:        "Stape (Server GTM)",
    category:    "advanced",
    color:       "#7B61FF",
    description: "Server-side tagging via Stape. Envie eventos diretamente do servidor para Meta CAPI, GA4, TikTok Events API e outros — bypass total de ad blockers.",
    fields: [
      {
        key:         "serverUrl",
        label:       "Server Container URL",
        placeholder: "https://xxxxxxxxxx.stape.net",
        hint:        "URL do seu server container no Stape. Encontrada em Stape.io → seu container → Settings.",
      },
      {
        key:         "containerId",
        label:       "Server Container ID (GTM)",
        placeholder: "GTM-XXXXXXX",
        hint:        "ID do container server-side criado no Google Tag Manager para uso com o Stape.",
        pattern:     /^GTM-[A-Z0-9]+$/,
        patternHint: "Formato: GTM-ABC1234",
      },
    ],
    steps: [
      "Acesse stape.io e crie um servidor (ou use um existente).",
      "Copie a URL do server container (ex: https://abc123.stape.net).",
      "No Google Tag Manager, crie um container do tipo 'Server' e copie o Container ID.",
      "Cole ambos os valores acima e salve.",
      "Configure os client e server tags no GTM para enviar eventos via Stape.",
    ],
    docs:      "https://stape.io/docs",
    docsLabel: "Docs Stape",
  },

  {
    id:          "utmfy",
    name:        "UTMfy",
    category:    "advanced",
    color:       "#00B4D8",
    description: "Gerencie e rastreie UTMs de forma centralizada. Identifique exatamente quais campanhas, canais e criativos geram mais vendas.",
    fields: [
      {
        key:         "apiKey",
        label:       "API Key",
        placeholder: "utmfy_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        hint:        "Encontrada em UTMfy → Configurações → API → sua chave de API.",
      },
      {
        key:         "accountId",
        label:       "Account ID",
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        hint:        "Encontrado em UTMfy → Configurações → conta → ID da conta.",
        required:    false,
      },
    ],
    steps: [
      "Acesse utmfy.com e faça login na sua conta.",
      "Em Configurações → API, copie sua chave de API.",
      "Opcionalmente, copie também o Account ID em Configurações → conta.",
      "Cole os valores acima e salve.",
    ],
    docs:      "https://utmfy.com",
    docsLabel: "Abrir UTMfy",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Retorna as integrações filtradas por categoria e termo de busca */
export function filterIntegrations(integrations, { category = "all", search = "" }) {
  return integrations.filter((i) => {
    const matchCat = category === "all" || i.category === category;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });
}

/** Retorna label legível da categoria */
export function getCategoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
