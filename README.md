# CloudMart Backend

API do [CloudMart](https://github.com/MURILOBRAZ/cloudmart), um e-commerce de demonstração.
Não depende da AWS: usa **Node.js + Express**, **Postgres** (Supabase) e o **Google Gemini** (plano gratuito) nos assistentes de IA.
Roda localmente como servidor comum e no **Vercel** como função serverless.

## Como rodar localmente

Requisitos: Node.js 22.13 ou mais recente.

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL e GEMINI_API_KEY
npm run db:init        # cria as tabelas e insere produtos de exemplo
npm run dev
```

A API sobe em `http://localhost:5000/api`. No frontend, use `VITE_API_BASE_URL=http://localhost:5000/api`.

### Onde pegar as credenciais

- **`DATABASE_URL`:** no Supabase, em *Project Settings > Database > Connection string*, escolha o **Transaction pooler** e troque `[YOUR-PASSWORD]` pela senha do banco.
- **`GEMINI_API_KEY`:** crie de graça em https://aistudio.google.com/apikey, num projeto **sem conta de faturamento**.

No plano gratuito do Gemini, o Google pode usar as conversas para melhorar os produtos dele, e há limite de mensagens por minuto e por dia.

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | — | Connection string do Postgres (obrigatória) |
| `GEMINI_API_KEY` | — | Chave da API do Gemini (obrigatória para os chats) |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Modelo usado pelos assistentes |
| `GEMINI_FALLBACK_MODEL` | `gemini-3.5-flash-lite` | Modelo reserva quando o principal está sobrecarregado |
| `PORT` | `5000` | Porta da API (só no modo local) |
| `CORS_ORIGIN` | `*` | Origens permitidas, separadas por vírgula (em produção, as URLs do frontend) |
| `DB_POOL_MAX` | `5` | Máximo de conexões no pool |
| `CRON_SECRET` | — | Protege a rota `/api/cron/ping` (o Vercel envia como Bearer token) |
| `ADMIN_PASSWORD` | — | Senha das páginas /admin e /orders (obrigatória para elas funcionarem) |
| `ADMIN_SESSION_SECRET` | igual à senha | Chave que assina o token da sessão |
| `ADMIN_SESSION_HOURS` | `12` | Duração da sessão do admin |

O `.env` tem prioridade sobre as variáveis de ambiente do sistema ([src/env.js](src/env.js)), para uma chave antiga definida no Windows não atrapalhar.

## Deploy no Vercel

1. Importe este repositório no Vercel (framework: *Other*).
2. Em *Settings > Environment Variables*, cadastre `DATABASE_URL`, `GEMINI_API_KEY` e `CORS_ORIGIN` (a URL do frontend).
3. Faça o deploy. O [vercel.json](vercel.json) manda todas as rotas para [api/index.js](api/index.js), que serve o mesmo app Express.

Rode o `npm run db:init` uma vez na sua máquina (ou cole o [src/schema.sql](src/schema.sql) no SQL Editor do Supabase) antes do primeiro acesso.

### Mantendo o banco acordado

O plano gratuito do Supabase pausa o projeto após **7 dias sem atividade**. O [vercel.json](vercel.json) cadastra um cron diário (06:00 UTC) que chama `/api/cron/ping`, e essa rota faz uma consulta no banco. No plano Hobby do Vercel o cron roda **uma vez por dia**, o que é suficiente.

Cadastre também a variável `CRON_SECRET` no Vercel (um texto aleatório): ele a envia no cabeçalho `Authorization`, e a rota recusa quem não souber o valor.

Use sempre a connection string do **Transaction pooler**: funções serverless abrem e fecham conexões o tempo todo, e a conexão direta do Postgres não aguenta esse ritmo.

## Rotas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/products` | Lista produtos |
| POST | `/api/products` | Cria produto |
| PUT | `/api/products/:id` | Atualiza produto |
| DELETE | `/api/products/:id` | Remove produto |
| GET | `/api/orders` | Lista todos os pedidos |
| GET | `/api/orders/user?email=` | Pedidos de um usuário |
| POST | `/api/orders` | Cria pedido |
| PUT | `/api/orders/:id` | Altera o status do pedido |
| DELETE | `/api/orders/:id` | Remove pedido |
| POST | `/api/auth/login` | Login do admin; devolve o token da sessão |
| POST | `/api/ai/start` | Abre conversa de suporte (`threadId`) |
| POST | `/api/ai/message` | Envia mensagem ao suporte |
| POST | `/api/ai/bedrock/start` | Abre conversa com o assistente de compras (`conversationId`) |
| POST | `/api/ai/bedrock/message` | Envia mensagem ao assistente |
| GET | `/api/cron/ping` | Mantém o banco acordado (chamada diária do cron do Vercel) |

### Rotas protegidas

Exigem o token do admin no cabeçalho `Authorization: Bearer <token>`: criar, editar e apagar produtos, e todas as de pedidos menos `POST /api/orders` (a compra) e `GET /api/orders/user` (os pedidos do próprio cliente). O catálogo e os chats continuam públicos.

As rotas `/ai/bedrock/*` mantêm o nome antigo para o frontend funcionar sem alterações, mas quem responde é o Gemini.

## Docker

```bash
docker build -t cloudmart-backend .
docker run -p 5000:5000 --env-file .env cloudmart-backend
```
