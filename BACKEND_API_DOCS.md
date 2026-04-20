# OrionPay — Documentação de API para o Backend Dev

> **Atualizado em:** 2026-04-13  
> **Contexto:** Este documento descreve todos os contratos de API que o frontend consome ou espera consumir. As seções marcadas com `[PENDENTE]` ainda não existem no backend e precisam ser implementadas.

---

## Convenções gerais

| Item | Valor |
|---|---|
| Base URL | `{VITE_API_URL}/api` |
| Auth | `Authorization: Bearer {JWT}` em todos os endpoints autenticados |
| Formato | `Content-Type: application/json` |
| Paginação | `{ items: T[], total: number, page: number, limit: number }` |
| Erros | `{ message: string, code?: string }` com HTTP 4xx/5xx |

---

## 1. Autenticação

### `POST /auth/login`
```json
// Request
{ "email": "string", "password": "string" }

// Response 200
{ "token": "string", "user": User }

// Response 401
{ "message": "Credenciais inválidas" }
```

### `POST /auth/register`
```json
// Request
{ "name": "string", "email": "string", "password": "string" }

// Response 201
{ "token": "string", "user": User }
```

### `POST /auth/verify-email`
```json
// Request
{ "token": "string" }
// Response 200 — { "ok": true }
```

### `POST /auth/resend-verification`
```json
// Request
{ "email": "string" }
// Response 200 — { "ok": true }
```

### `POST /auth/forgot-password`
```json
// Request
{ "email": "string" }
// Response 200 — { "ok": true }
```

### `POST /auth/reset-password`
```json
// Request
{ "token": "string", "newPassword": "string" }
// Response 200 — { "ok": true }
```

### `GET /auth/me`
```json
// Response 200 — User
```

### Tipo `User`
```typescript
{
  _id: string
  name: string
  email: string
  emailVerified: boolean
  role: "user" | "moderator" | "super_moderator" | "admin" | "master"
  accountStatus: "basic" | "pending" | "under_review" | "kyc_approved" | "kyc_rejected" | "kyc_under_review" | "seller_active"
  twofaEnabled: boolean
  createdAt: string // ISO
}
```

---

## 2. Two-Factor Authentication (2FA)

### `POST /2fa/setup`
Gera o QR Code para configuração do 2FA.
```json
// Response 200
{ "qrCodeUrl": "string", "secret": "string" }
```

### `POST /2fa/enable`
```json
// Request
{ "code": "string" } // código TOTP de 6 dígitos
// Response 200 — { "ok": true }
```

### `POST /2fa/disable`
```json
// Request
{ "code": "string" }
// Response 200 — { "ok": true }
```

### `POST /2fa/verify-login`
Chamado após login quando 2FA está ativo.
```json
// Request
{ "token": "string", "code": "string" } // token temporário do /auth/login
// Response 200 — { "token": string, "user": User }
```

---

## 3. Sessões

### `GET /sessions`
```json
// Response 200
[
  {
    "_id": "string",
    "device": "string",
    "ip": "string",
    "lastActive": "ISO string",
    "current": true
  }
]
```

### `POST /sessions/logout-others`
```json
// Response 200 — { "ok": true }
```

---

## 4. Usuário / Wallet

### `GET /wallet/me`
```json
// Response 200
{
  "balance": number,       // centavos
  "pending": number,
  "withdrawn": number,
  "currency": "BRL"
}
```

### `PATCH /users/me/settings`
```json
// Request — campos opcionais, envia apenas o que mudou
{
  "name": "string",
  "document": "string",    // CPF/CNPJ sem máscara
  "phone": "string",
  "pixKey": "string",
  "pixKeyType": "cpf" | "cnpj" | "email" | "phone" | "random",
  "companyName": "string",
  "companyDocument": "string"
}
// Response 200 — User atualizado
```

### `PATCH /users/me/password`
```json
// Request
{ "oldPassword": "string", "newPassword": "string" }
// Response 200 — { "ok": true }
```

---

## 5. KYC / Verificação de conta

### `GET /kyc/me`
```json
// Response 200
{
  "_id": "string",
  "status": "pending" | "under_review" | "approved" | "rejected",
  "submittedAt": "ISO string",
  "reviewedAt": "ISO string",
  "rejectionReason": "string"
}
```

### `POST /kyc/submit`
Envio de documentos (multipart/form-data).
```
// Fields
documentType: "rg" | "cnh" | "passport"
documentFront: File
documentBack: File (opcional para passport)
selfie: File
```
```json
// Response 201
{ "_id": "string", "status": "pending" }
```

---

## 6. Transações / Histórico

### `GET /transactions/history`
```json
// Query params
{
  "page": 1,
  "limit": 20,
  "status": "paid" | "pending" | "refunded" | "expired",
  "method": "pix" | "crypto",
  "search": "string",
  "dateFrom": "YYYY-MM-DD",
  "dateTo": "YYYY-MM-DD"
}

// Response 200
{
  "items": Transaction[],
  "total": number,
  "page": number,
  "limit": number
}
```

### Tipo `Transaction`
```typescript
{
  _id: string
  orderId: string
  productName: string
  amount: number          // centavos
  method: "pix" | "crypto"
  status: "paid" | "pending" | "refunded" | "expired"
  customer: { name: string, email: string }
  paidAt?: string
  createdAt: string
}
```

---

## 7. Cobranças — PIX

### `POST /charges/pix`
```json
// Request
{
  "amount": number,        // centavos
  "description": "string",
  "expiresIn": number      // segundos, ex: 3600
}

// Response 201
{
  "orderId": "string",
  "pixKey": "string",
  "pixQrCodeImage": "string",  // base64 PNG
  "expiresAt": "ISO string"
}
```

---

## 8. Cobranças — Cripto

### `POST /crypto/create`
```json
// Request
{
  "amountBRL": number,
  "amountCrypto": number,
  "coin": "USDT" | "BTC" | "ETH",
  "network": "string",
  "quote": "string",       // identificador da cotação
  "description": "string"
}

// Response 201
{
  "orderId": "string",
  "address": "string",
  "coin": "string",
  "network": "string",
  "amountCrypto": number,
  "expiresAt": "ISO string"
}
```

---

## 9. Saques

### `POST /cashout/pix`
```json
// Request
{
  "amount": number,        // centavos
  "pixKey": "string",
  "pixKeyType": "cpf" | "cnpj" | "email" | "phone" | "random"
}
// Response 201 — { "id": string, "status": "pending" }
```

### `POST /cashout/crypto`
```json
// Request
{
  "amount": number,        // centavos
  "currency": "USDT",
  "network": "string",
  "address": "string",
  "reference": "string"
}
// Response 201 — { "id": string, "status": "pending" }
```

### `GET /cashout/history`
```json
// Response 200
{
  "items": CashoutItem[],
  "total": number
}
```

---

## 10. [PENDENTE] Upload de Imagens

> **Status:** O frontend comprime imagens via canvas e as armazena como base64 no payload. Isso funciona, mas não é escalável para produção. O backend precisa implementar a rota abaixo para que o frontend passe a enviar URLs em vez de base64.

### `POST /uploads`
Upload de arquivo de imagem. Retorna a URL pública.

```
// Content-Type: multipart/form-data
// Field: file (File)
// Field: context: "product" | "logo" | "testimonial" | "orderbump" | "bonus" (opcional)
```

```json
// Response 201
{
  "url": "https://cdn.orionpay.com/uploads/abc123.jpg",
  "key": "uploads/abc123.jpg"
}
```

**Migração no frontend:** Quando a rota existir, substituir a função `compressImage` em `src/components/ui/ImageUpload.jsx`:

```javascript
// Trocar o return de compressImage() por:
const formData = new FormData();
formData.append("file", file);
const { data } = await api.post("/uploads", formData);
return data.url; // URL string em vez de base64
```

Nenhuma outra alteração é necessária — todos os componentes que usam `ImageUpload` já recebem a string retornada.

**Recomendações:**
- Limitar tamanho máximo a 10MB no servidor
- Aceitar apenas `image/jpeg`, `image/png`, `image/webp`
- Gerar thumbnails para listagens (ex: 300×300)
- Usar CDN (S3 + CloudFront ou similar) — não servir via Node diretamente

---

## 11. Produtos

### `GET /products`
```json
// Query: page, limit, search, status, deliveryType
// Response 200 — { items: Product[], total, page, limit }
```

### `POST /products`
```json
// Request
{
  "name": "string",
  "description": "string",
  "price": number,                          // centavos
  "type": "unique" | "recurring",
  "deliveryType": "digital" | "physical",   // NOVO
  "images": ["url1", "url2"],               // URLs após upload (ver seção 10)
  "videoUrl": "string",                     // YouTube URL (opcional)
  "status": "active" | "inactive"
}
// Response 201 — Product
```

### `GET /products/:id`
```json
// Response 200 — Product
```

### `PATCH /products/:id`
```json
// Request — mesmos campos do POST, todos opcionais
// Response 200 — Product atualizado
```

### `DELETE /products/:id`
```json
// Response 200 — { "ok": true }
```

### `GET /products/slug/:slug`
Rota pública (sem autenticação).
```json
// Response 200 — Product
```

### Tipo `Product`
```typescript
{
  _id: string
  name: string
  description: string
  price: number                              // centavos
  type: "unique" | "recurring"
  deliveryType: "digital" | "physical"       // NOVO
  images: string[]                           // URLs (máx. 5)
  videoUrl?: string
  slug: string                               // gerado pelo backend
  status: "active" | "inactive"
  ownerId: string
  createdAt: string
}
```

---

## 12. Checkout Config (por Produto)

### `GET /products/:id/checkout`
```json
// Response 200 — { "config": CheckoutConfig }
```

### `PUT /products/:id/checkout`
```json
// Request — { "config": CheckoutConfig }
// Response 200 — { "config": CheckoutConfig }
```

---

## 13. Checkout Templates (Builder)

### `GET /checkouts`
```json
// Response 200 — { items: CheckoutTemplate[], total }
```

### `POST /checkouts`
```json
// Request
{ "name": "string", "config": CheckoutConfig }
// Response 201 — CheckoutTemplate
```

### `GET /checkouts/:id`
```json
// Response 200 — CheckoutTemplate
```

### `PUT /checkouts/:id`
```json
// Request — { "name"?: string, "config"?: CheckoutConfig }
// Response 200 — CheckoutTemplate
```

### `DELETE /checkouts/:id`
```json
// Response 200 — { "ok": true }
```

### Tipo `CheckoutTemplate`
```typescript
{
  _id: string
  name: string
  config: CheckoutConfig
  ownerId: string
  createdAt: string
  updatedAt: string
}
```

### Tipo `CheckoutConfig`
```typescript
{
  theme: {
    primaryColor: string   // ex: "#2D8659"
    bgColor: string
    cardColor: string
    textColor: string
    mutedColor: string
    borderColor: string
    btnRadius: string      // ex: "10" (px aplicado no frontend)
  }
  sections: CheckoutSection[]
}

type CheckoutSection = {
  id: string
  type: SectionType
  enabled: boolean
  order: number            // inteiro, define a ordem de exibição
  config: object           // específico por type (ver abaixo)
}

type SectionType =
  | "header"
  | "product"
  | "benefits"
  | "video"
  | "payment"
  | "orderbump"
  | "guarantee"
  | "countdown"
  | "bonus"
  | "testimonials"
  | "faq"
  | "footer"
```

**Configs por tipo de seção:**

```typescript
// header
{
  logoUrl: string          // URL da imagem ou base64 (ver seção 10)
  logoPosition: "left" | "center" | "right"
  brandName: string        // usado quando não há logo
  bgColor: string
  textColor: string
  showBorder: boolean
}

// product
{
  productId: string        // _id do produto vinculado
  layout: "left" | "right" | "top" | "none"
  showDescription: boolean
  showVideo: boolean
  badge: string            // ex: "MAIS VENDIDO"
  badgeColor: string
}

// benefits
{
  title: string
  items: {
    icon: string           // emoji, ex: "✓" ou "🚀"
    title: string
    desc: string
  }[]
}

// video
{
  title: string
  desc: string
  videoUrl: string         // URL do YouTube (watch?v= ou youtu.be/)
}

// payment
{
  methods: ("pix" | "crypto")[]
  requireName: boolean
  requireEmail: boolean
  requirePhone: boolean
  btnText: string
  btnColor: string
}

// orderbump
{
  label: string            // texto da faixa superior, ex: "⚡ Oferta especial"
  title: string
  desc: string
  price: number            // centavos
  originalPrice: number    // centavos (para exibir riscado)
  image: string            // URL ou base64
  accentColor: string      // ex: "#F59E0B"
}

// guarantee
{
  days: number
  text: string
  icon: "shield" | "check" | "star"
}

// countdown
{
  title: string
  deadline: string         // ISO datetime, ex: "2026-12-31T23:59:00"
  label: string            // texto abaixo do timer
  accentColor: string
}

// bonus
{
  title: string
  items: {
    image: string          // URL ou base64
    title: string
    value: number          // centavos (exibido riscado como "valor original")
  }[]
}

// testimonials
{
  title: string
  items: {
    image: string          // URL ou base64 de screenshot/foto do depoimento
    name: string           // nome do cliente (opcional)
  }[]
}

// faq
{
  title: string
  items: {
    q: string              // pergunta
    a: string              // resposta
  }[]
}

// footer
{
  text: string             // ex: "© 2026. Todos os direitos reservados."
  showPowered: boolean     // "Processado por OrionPay"
  showSecurity: boolean    // badge "Pagamento seguro"
}
```

---

## 14. Checkout Público (Pagamento)

### `GET /checkout/:slug`
Rota pública — retorna dados do produto e config do checkout.
```json
// Response 200
{
  "product": Product,
  "config": CheckoutConfig
}
```

### `POST /checkout/:slug/order`
Rota pública — cria o pedido e retorna dados de pagamento.
```json
// Request
{
  "name": "string",
  "email": "string",
  "phone": "string",         // opcional
  "paymentMethod": "pix" | "crypto",
  "orderBump": boolean,      // true se o cliente aceitou o order bump
  "utms": {
    "source": "string",
    "medium": "string",
    "campaign": "string",
    "term": "string",
    "content": "string"
  }
}

// Response 201
{
  "orderId": "string",
  "pixQrCodeImage": "string",    // se method = pix
  "pixKey": "string",            // se method = pix
  "cryptoAddress": "string",     // se method = crypto
  "cryptoCurrency": "string",    // se method = crypto
  "cryptoAmount": "string",      // se method = crypto
  "expiresAt": "ISO string"
}
```

### `GET /checkout/order/:orderId`
Polling de status do pedido (rota pública).
```json
// Response 200
{
  "status": "pending" | "paid" | "confirmed" | "expired",
  "paidAt": "ISO string"
}
```

---

## 15. API Keys

### `GET /api-keys`
```json
// Response 200
{
  "items": [
    { "_id": "string", "name": "string", "prefix": "string", "createdAt": "ISO string", "lastUsed": "ISO string" }
  ]
}
```

### `POST /api-keys`
```json
// Request — { "name": "string" }
// Response 201 — { "_id": string, "name": string, "key": string } // key apenas na criação
```

### `DELETE /api-keys/:id`
```json
// Response 200 — { "ok": true }
```

---

## 16. [PENDENTE] Integrações de Marketing

> **Status:** Frontend implementado com localStorage. Backend precisa criar as rotas abaixo para persistência real.

### `GET /users/me/integrations`
Retorna todas as integrações configuradas pelo usuário.
```json
// Response 200
{
  "integrations": {
    "gtm":            { "enabled": true,  "fields": { "containerId": "GTM-XXXXXX" } },
    "ga4":            { "enabled": true,  "fields": { "measurementId": "G-XXXXXX", "apiSecret": "" } },
    "meta":           { "enabled": false, "fields": { "pixelId": "", "accessToken": "", "testEventCode": "" } },
    "google_ads":     { "enabled": false, "fields": { "conversionId": "", "conversionLabel": "" } },
    "tiktok":         { "enabled": false, "fields": { "pixelId": "", "accessToken": "" } },
    "pinterest":      { "enabled": false, "fields": { "tagId": "" } },
    "clarity":        { "enabled": false, "fields": { "projectId": "" } },
    "hotjar":         { "enabled": false, "fields": { "siteId": "" } },
    "merchant":       { "enabled": false, "fields": { "merchantId": "" } },
    "search_console": { "enabled": false, "fields": { "siteUrl": "", "verificationToken": "" } },
    "n8n":            { "enabled": false, "fields": { "webhookUrl": "", "authToken": "" } },
    "zapier":         { "enabled": false, "fields": { "webhookUrl": "" } },
    "make":           { "enabled": false, "fields": { "webhookUrl": "" } },
    "stape":          { "enabled": false, "fields": { "serverUrl": "", "containerId": "" } },
    "utmfy":          { "enabled": false, "fields": { "apiKey": "", "accountId": "" } }
  }
}
```

### `PATCH /users/me/integrations`
Atualiza uma ou mais integrações (merge parcial por ID).
```json
// Request
{
  "integrations": {
    "gtm": { "enabled": true, "fields": { "containerId": "GTM-XXXXXX" } }
  }
}
// Response 200 — objeto completo igual ao GET
```

**Observações de segurança:**
- Os campos `accessToken`, `apiSecret`, `authToken` e `apiKey` devem ser **criptografados at rest** no banco (AES-256 ou similar).
- Na resposta do GET, retornar tokens mascarados (`EAAxxxx...xxxx` → `EAA****xxxx`) exceto quando o usuário está editando.
- Validar formato dos campos também no backend (ex: GTM-ID deve seguir `/^GTM-[A-Z0-9]+$/`).

**Eventos disparados para webhooks (N8N / Zapier / Make):**

| Evento | Quando |
|---|---|
| `order.created` | Pedido criado no checkout |
| `order.paid` | Pagamento confirmado |
| `order.refunded` | Estorno processado |
| `order.expired` | Pedido expirou sem pagamento |

**Payload do webhook:**
```json
{
  "event": "order.paid",
  "orderId": "ord_xxxxxxxxxxxx",
  "productId": "string",
  "productName": "string",
  "amount": 9700,
  "currency": "BRL",
  "paymentMethod": "pix",
  "orderBumpAccepted": false,
  "customer": {
    "name": "string",
    "email": "string",
    "phone": "string"
  },
  "utms": {
    "source": "google",
    "medium": "cpc",
    "campaign": "black-friday",
    "term": "",
    "content": ""
  },
  "paidAt": "2026-04-13T15:30:00.000Z"
}
```

**Headers do webhook:**
```
Content-Type: application/json
X-OrionPay-Event: order.paid
X-OrionPay-Signature: hmac-sha256 do payload (para validação)
Authorization: {authToken configurado pelo usuário, se houver}
```

---

## 17. [PENDENTE] Domínios Personalizados

> **Status:** Frontend implementado com localStorage. Backend precisa criar as rotas abaixo para verificação DNS real e roteamento de tráfego para o checkout correto.

### `GET /domains`
Lista todos os domínios do usuário autenticado.
```json
// Response 200
{
  "items": Domain[]
}
```

### `POST /domains`
Adiciona um novo domínio personalizado.
```json
// Request
{ "domain": "pay.meuloja.com.br" }

// Response 201
{
  "_id": "string",
  "domain": "pay.meuloja.com.br",
  "status": "pending",
  "verifyToken": "orion-a1b2c3d4",
  "cname": "checkout.orionpay.com",
  "createdAt": "ISO string"
}
```

### `DELETE /domains/:id`
```json
// Response 200 — { "ok": true }
```

### `POST /domains/:id/verify`
Dispara uma verificação de DNS no servidor. O backend deve:
1. Buscar o registro `TXT` de `_orion-verify.{subdomain}` e comparar com `verifyToken`
2. Verificar se o `CNAME` do subdomínio aponta para `checkout.orionpay.com`
3. Atualizar `status` conforme resultado
```json
// Response 200
{
  "_id": "string",
  "domain": "string",
  "status": "verified" | "failed",
  "verifiedAt": "ISO string"   // presente quando status = "verified"
}
```

### Tipo `Domain`
```typescript
{
  _id: string
  domain: string                              // ex: "pay.meuloja.com.br"
  status: "pending" | "verifying" | "verified" | "failed"
  verifyToken: string                         // token para registro TXT
  cname: "checkout.orionpay.com"              // destino do CNAME
  createdAt: string
  verifiedAt?: string
}
```

**Registros DNS que o usuário precisa criar:**

| Tipo | Nome / Host | Destino / Valor |
|---|---|---|
| `CNAME` | `pay` (subdomínio escolhido) | `checkout.orionpay.com` |
| `TXT` | `_orion-verify.pay` | `orion-verify={verifyToken}` |

**Infraestrutura necessária no backend:**
- Wildcard SSL no domínio `*.orionpay.com` ou certificado por-domínio via Let's Encrypt (recomendado: `certbot` com DNS challenge ou `caddy` com on-demand TLS)
- Roteamento reverso: ao receber uma request em `pay.meuloja.com.br`, o servidor deve identificar o dono pelo domínio cadastrado e servir o checkout correto
- Associar o domínio verificado a um checkout específico (endpoint `PATCH /domains/:id` abaixo)

### `PATCH /domains/:id`
Associa o domínio a um checkout template.
```json
// Request
{ "checkoutId": "string" }
// Response 200 — Domain atualizado
```

**Migração no frontend:**

**Arquivo a editar:** `src/pages/dominios/DominiosPage.jsx`

```javascript
// Trocar loadDomains() por:
const { data } = await api.get("/domains");
return data.items;

// Trocar saveDomains() por chamadas diretas:
// Add:   await api.post("/domains", { domain })
// Delete: await api.delete(`/domains/${id}`)
// Verify: const { data } = await api.post(`/domains/${id}/verify`)
//         // atualiza o status retornado localmente
```

---

## 18. Admin

### `GET /admin/accounts`
```json
// Query: search, status, page, limit
// Response 200 — { items: Account[], total, page, limit }
```

### `GET /admin/accounts/:id`
```json
// Response 200 — Account com dados completos
```

### `PATCH /admin/accounts/:id/status`
```json
// Request — { "status": "active" | "suspended" | "blocked" }
// Response 200 — Account atualizado
```

### `GET /admin/accounts/:id/transactions`
```json
// Response 200 — { items: Transaction[], total }
```

### `GET /admin/accounts/:id/kyc`
```json
// Response 200 — KYC data
```

### `GET /users/:id/split`
```json
// Response 200 — { splitPercent: number, fixedFee: number }
```

### `PATCH /users/:id/split`
```json
// Request — { splitPercent?: number, fixedFee?: number }
// Response 200 — configuração atualizada
```

### `PATCH /admin/accounts/:id/routing`
```json
// Request — { provider: string, priority: number }
// Response 200 — routing config
```

### `GET /cashout/list`
```json
// Response 200 — { items: CashoutRequest[], total }
```

### `PATCH /cashout/:id`
```json
// Request — { "status": "approved" | "rejected", "reason"?: string }
// Response 200 — CashoutRequest atualizado
```

---

## 19. Guia de migração do localStorage → API

Resumo de todos os recursos que atualmente usam `localStorage` e a migração necessária quando o backend implementar.

| Recurso | Arquivo frontend | localStorage key | Rota backend |
|---|---|---|---|
| Integrações | `src/hooks/useIntegrations.js` | `orionpay_integrations` | `GET/PATCH /users/me/integrations` |
| Domínios | `src/pages/dominios/DominiosPage.jsx` | `orionpay_domains` | `GET/POST/DELETE/PATCH /domains` |

### Integrações — `src/hooks/useIntegrations.js`

```javascript
// Trocar loadFromStorage() por:
const { data } = await api.get("/users/me/integrations");
return data.integrations;

// Trocar saveToStorage(data) por:
await api.patch("/users/me/integrations", { integrations: data });
```

### Domínios — `src/pages/dominios/DominiosPage.jsx`

```javascript
// Trocar loadDomains() + saveDomains() por chamadas de API diretas
// (ver detalhes na seção 17)
```

O restante do código de UI **não precisa de nenhuma alteração** nas duas migrações acima.

---

*Documento gerado e mantido pelo Claude Code — OrionPay Frontend.*
