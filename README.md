## SkillUp IA – Plataforma inteligente de talentos

Aplicação full‑stack para descoberta de talentos e planejamento de carreira com apoio de IA.  
Permite criar um card profissional completo, usar filtros avançados para buscar perfis e gerar recomendações, resumos e planos de estudo com auxílio da OpenAI (opcional).

---

## Tecnologias

- **Frontend**: React + Vite + Tailwind CSS (modo claro/escuro)
- **Backend**: Node.js + Express
- **Persistência**: arquivos JSON em `backend/data` (sem banco de dados)
- **Autenticação**: JWT simples com armazenamento em JSON
- **IA (opcional)**: OpenAI API (`gpt-4o-mini`) para sugestões, resumos e plano de estudos

---

## Estrutura do projeto

```text
SkillUp-IA/
├─ backend/          # API Express (auth, perfis, IA, upload)
│  ├─ src/
│  │  ├─ server.js
│  │  ├─ routes/
│  │  │  ├─ auth.routes.js
│  │  │  ├─ profile.routes.js
│  │  │  ├─ ai.routes.js
│  │  │  ├─ upload.routes.js
│  │  │  └─ recommend.routes.js
│  └─ data/          # users.json, profiles.json, etc. (criados automaticamente)
└─ frontend/         # SPA em React
   ├─ src/
   │  ├─ pages/      # Auth, MeuPlano, etc.
   │  ├─ components/ # Home, Card, Modal, AuthBar, Brand...
   │  └─ lib/api.js  # cliente Axios para a API
   └─ public/
```

---

## Pré‑requisitos

- **Node.js 18+** (recomendado)  
- **npm** ou **pnpm/yarn** (exemplos abaixo usam `npm`)

---

## 1. Backend – API

### Instalação

```bash
cd backend
npm install
```

Crie o arquivo **`backend/.env`** com, no mínimo:

```ini
PORT=3000
SECRET_KEY=uma_chave_bem_secreta

# Opcional: funcionalidades de IA (OpenAI)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

> O arquivo `.env` deve ficar dentro da pasta **`backend`**.

### Rodando em desenvolvimento

```bash
npm run dev
```

Por padrão a API sobe em `http://localhost:3000`.

### Endpoints principais

Alguns endpoints úteis para teste rápido:

| Método / Rota              | Descrição                                               |
| -------------------------- | ------------------------------------------------------- |
| `GET /health`              | Verifica se o backend está online                       |
| `POST /register`           | Cria usuário (body: `{ username, password }`)          |
| `POST /login`              | Autentica e retorna token JWT                          |
| `GET /profiles`            | Lista perfis paginados (`page`, `pageSize`)            |
| `POST /profiles`           | Cria novo perfil (card profissional)                   |
| `GET /data/profiles.json`  | Retorna o arquivo estático com todos os perfis         |
| `GET /ai/suggest`          | Sugere perfis por skills/área/cidade (se houver dados) |

> Se o arquivo **`backend/data/profiles.json`** não existir, o backend cria automaticamente com um array vazio quando necessário.

---

## 2. Frontend – SPA em React

### Instalação

```bash
cd ../frontend
npm install
```

Crie o arquivo **`frontend/.env`**:

```ini
# URL pública do backend
VITE_API_URL=http://localhost:3000
```

### Rodando em desenvolvimento

```bash
npm run dev
```

O Vite mostra a URL no terminal (normalmente `http://localhost:5173`).  
Ao acessar a aplicação você será redirecionado para `/auth`.

---

## Fluxo de uso da aplicação

1. **Cadastro / Login**
   - Acesse a rota `/auth` (já é a tela inicial).
   - Aba **“Já tenho conta”**: login rápido com usuário e senha.
   - Aba **“Criar conta e card”**: cria usuário **e** um card completo em um fluxo único.

2. **Criar conta + card**
   - Preencha **Conta** (usuário e senha).
   - Complete o **Perfil** com nome, cargo, resumo, localização (cidade/estado), área de atuação etc.
   - Adicione **habilidades técnicas**, **soft skills**, experiências, formação, projetos, idiomas e certificações.
   - Escolha ou envie uma **foto** de perfil (upload).
   - Use os recursos de **IA** (quando `OPENAI_API_KEY` estiver configurada):
     - Sugestões de **skills técnicas** e **soft skills**.
     - Geração de **headline/resumo** do perfil.
     - Criação de **plano de estudos** baseado no card.
   - Clique em **“Criar conta e card”**: o sistema registra o usuário, faz login automático e cria o perfil.

3. **Explorar perfis (Home)**
   - Após login, você é redirecionado para `/perfis` (Home).
   - Filtros por **nome**, **área**, **estado** e **tecnologia**.
   - Botão de **“Sugestões da IA”** para destacar perfis recomendados.
   - Cada card abre um **Modal** com mais detalhes e ações extras.

4. **Meu plano**
   - A rota `/meu-plano` mostra o plano de desenvolvimento gerado com base no seu card e nas respostas da IA.

---

## Deploy na Vercel

A forma mais simples é:

- **Backend** em um serviço Node (Render, Railway, Fly.io, etc.).  
- **Frontend** na **Vercel**, apontando `VITE_API_URL` para a URL pública do backend.

### 1. Publicar o backend

Você pode usar qualquer serviço de hospedagem para Node.js que rode o comando `npm install` + `npm run dev`/`npm start`. Em geral:

1. Crie um novo projeto a partir deste repositório (pasta `backend` como base).
2. Configure as variáveis de ambiente do backend (as mesmas do `.env`):
   - `PORT` (se necessário)
   - `SECRET_KEY`
   - `OPENAI_API_KEY` (opcional, mas necessário para todos os recursos de IA online).
3. Depois do deploy, anote a URL pública, algo como `https://skillup-backend.onrender.com`.

### 2. Publicar o frontend na Vercel

1. No painel da Vercel, clique em **New Project** e importe este repositório.
2. Em **Project Settings → Root Directory**, selecione **`frontend`**.
3. Use as configurações padrão de build:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Em **Environment Variables** da Vercel, defina:
   - `VITE_API_URL=https://sua-url-do-backend.com`
5. Faça o deploy. Após alguns minutos a Vercel fornecerá uma URL do tipo `https://skillup-ia.vercel.app`.

> Dica: após o primeiro deploy, qualquer push para a branch configurada (por exemplo, `main` ou `dev`) dispara um novo build automático na Vercel.

---

## Notas sobre IA e fallbacks

- Se **`OPENAI_API_KEY` não estiver configurada**, muitas rotas de IA usam **fallback local**:
  - Sugestões de habilidades a partir de texto.
  - Plano de aprendizado baseado apenas nas skills existentes.
  - Respostas de mentoria simples geradas localmente.
- Com a chave configurada, o backend usa os modelos da OpenAI para gerar:
  - Sugestões de perfis (`/ai/suggest`).
  - Extração de skills de texto (`/ai/extract`).
  - Resumos e headline do perfil (`/ai/summary`).
  - Planos de estudo (`/ai/learning-plan`).
  - Mentoria orientada ao plano (`/ai/mentor`).

---

## Próximos passos / ideias

- Trocar o armazenamento em JSON por um banco (PostgreSQL, MongoDB etc.).  
- Adicionar paginação e busca server‑side mais avançadas.  
- Criar área de admin para curadoria dos perfis.  
- Internacionalização (PT/EN) e personalização de temas.

Se quiser, posso te ajudar a montar os arquivos de configuração específicos para o provedor onde você for subir o backend (Render, Railway, etc.).

