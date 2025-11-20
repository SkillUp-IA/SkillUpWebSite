## SkillUp IA – Plataforma inteligente de talentos

Aplicação full‑stack para descoberta de talentos e planejamento de carreira com apoio de IA.  
Permite criar um card profissional completo, usar filtros avançados para buscar perfis e gerar recomendações, resumos e planos de estudo com auxílio da OpenAI (opcional).

---

> [!IMPORTANT]
> **VÍDEO DEMONSTRATIVO ABAIXO, POIS USAMOS A OPENAI API EM USO**

   - [Video](https://youtu.be/5ie5-eYgNeQ?si=cgOhkP7oHzOjh3FE)

---

## Tecnologias

- **Frontend**: React + Vite + Tailwind CSS (modo claro/escuro)
- **Backend**: Node.js + Express
- **Persistência**: arquivos JSON em `backend/data` (sem banco de dados)
- **Autenticação**: JWT simples com armazenamento em JSON
- **IA (opcional)**: OpenAI API (`gpt-4o-mini`) para sugestões, resumos e plano de estudos


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

### Rodando 

```bash
npm run dev
```

Por padrão a API sobe em `http://localhost:3000`.


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

## Testes

### A fim de testes use o user

- **user: Teste**
- **senha: Teste123**
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

## Integrantes

- Lorenzo Andolfatto Coque | RM:563385
- Diogo Pelinson Duarte de Moraes | RM:563321
-