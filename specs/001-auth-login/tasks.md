# Tasks: Tela de Login e Autenticação

**Feature**: Feature 001 — Tela de Login (Autenticação com E-mail e Senha)

**Input**: Design documents from `/specs/001-auth-login/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Status**: Ready for implementation

---

## Formato de Tarefas: `[ID] [P?] [Story?] Descrição com caminho do arquivo`

- **[ID]**: Identificador sequencial (T001, T002, etc.)
- **[P]**: Indica se a tarefa pode ser executada em paralelo
- **[Story]**: Identifica a qual história de usuário pertence (US1, US2, US3, US4, US5)
- Cada descrição inclui caminho exato do arquivo

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Propósito**: Inicialização do projeto e estrutura básica

**Dependências**: Nenhuma — esta é a fase inicial

- [x] T001 Criar estrutura de pastas conforme plano de implementação em `src/`
- [x] T002 [P] Configurar variáveis de ambiente em `.env.local` e `.env.example` (Supabase URL, ANON_KEY, SERVICE_ROLE_KEY)
- [x] T003 [P] Instalar dependências do projeto: `@supabase/supabase-js`, `react-hook-form`, `zod`, `@hookform/resolvers`, `framer-motion`
- [x] T004 [P] Configurar TypeScript strict mode e resolver imports em `tsconfig.json`
- [x] T005 [P] Configurar ESLint e Prettier para padrão de projeto em `eslint.config.mjs`

**Checkpoint**: Setup básico concluído — estrutura de pastas criada e dependências instaladas

---

## Phase 2: Fundações Bloqueantes (Pré-requisitos)

**Propósito**: Infraestrutura de autenticação que DEVE estar pronta antes de qualquer história de usuário

**⚠️ CRÍTICO**: Nenhuma história de usuário pode começar até que esta fase esteja 100% completa

- [x] T006 [P] Criar cliente Supabase para ambiente browser em `src/lib/supabase/client.ts`
- [x] T007 [P] Criar cliente Supabase para ambiente server em `src/lib/supabase/server.ts`
- [x] T008 [P] Criar schemas Zod para validação em `src/lib/schemas/auth.ts` (email, password, validações)
- [x] T009 [P] Criar tipos TypeScript compartilhados em `src/lib/types/auth.ts` (User, AuthState, LoginInput, etc.)
- [x] T010 Criar middleware de autenticação em `src/middleware.ts` para proteção de rotas (verifica JWT/sessão)
- [x] T011 [P] Criar componentes UI base em `src/components/ui/`:
  - [x] Button.tsx (primário, secundário, com loading)
  - [x] Input.tsx (com suporte a erro e validação visual)
  - [x] FormField.tsx (wrapper para validação)
  - [x] Card.tsx (container para formulário)
  - [x] Typography.tsx (títulos e textos)
- [x] T012 [P] Criar layout base em `src/app/layout.tsx` com estrutura HTML5 semântica
- [x] T013 [P] Criar funções auxiliares de autenticação em `src/lib/supabase/auth.ts`:
  - [x] `signIn(email, password)`
  - [x] `signOut()`
  - [x] `getCurrentUser()`
  - [x] `refreshSession()`

**Checkpoint**: Infraestrutura de autenticação pronta — clientes Supabase, validações, tipos, middleware e componentes base criados

---

## Phase 3: User Story 1 — Autenticação com E-mail e Senha (Priority: P1) 🎯 MVP

**Objetivo**: Um usuário não autenticado consegue acessar o sistema fornecendo e-mail e senha válidos, obtendo acesso seguro à aplicação com manutenção de sessão.

**Teste Independente**: Um usuário completa a tela de login com e-mail e senha válidos, é redirecionado para a página inicial autenticado, e permanece autenticado ao recarregar a página.

### Implementação para User Story 1

- [x] T014 [P] [US1] Criar rota de autenticação em `src/app/api/auth/login/route.ts`:
  - POST handler que valida email/senha com Supabase
  - Retorna JWT em cookie httpOnly
  - Trata erros (email inválido, senha incorreta, servidor indisponível)
  - Segue contrato em `contracts/api-contracts.md`

- [x] T015 [P] [US1] Criar componente LoginForm em `src/components/auth/LoginForm.tsx`:
  - Integra react-hook-form com Zod schema
  - Campos: email, password
  - Estado de loading durante submit
  - Exibe mensagens de erro genéricas ("E-mail ou senha inválidos")
  - Desabilita botão enquanto há erros

- [x] T016 [US1] Criar página de login em `src/app/(auth)/login/page.tsx`:
  - Redireciona para dashboard se usuário já autenticado (via middleware)
  - Exibe LoginForm
  - Layout centralizado no desktop, full-width no mobile
  - Responsivo (mobile-first, 320px+)

- [x] T017 [P] [US1] Criar grupo de layout `(auth)` em `src/app/(auth)/layout.tsx`:
  - Layout específico para rotas de autenticação
  - Sem header/navegação
  - Background e estilo consistente

- [x] T018 [US1] Criar página dashboard em `src/app/dashboard/page.tsx`:
  - Página protegida (middleware redireciona para login se não autenticado)
  - Exibe dados do usuário autenticado
  - Botão de logout
  - Confirma que sessão é mantida após recarga

- [x] T019 [P] [US1] Adicionar função de login em `src/lib/supabase/auth.ts`:
  - `loginWithEmail(email, password)` — integra com Supabase signInWithPassword
  - Trata erros e retorna response tipado

- [x] T020 [P] [US1] Implementar persistência de sessão:
  - Verificar JWT em cookie ao carregar aplicação
  - Renovar token via `POST /api/auth/refresh` se próximo de expirar
  - Manter usuário logado após reload de página

- [x] T021 [US1] Testar fluxo completo (manual):
  - Login com credenciais válidas → redirecionado para dashboard
  - Login com email incorreto → mensagem "E-mail ou senha inválidos"
  - Login com senha incorreta → mensagem "E-mail ou senha inválidos"
  - Recarregar página após login → permanece autenticado

**Checkpoint**: User Story 1 funcional — Login básico implementado e testado

---

## Phase 4: User Story 2 — Validação de Credenciais (Priority: P1)

**Objetivo**: Um usuário vê validações claras sobre o formato de suas credenciais antes de tentar fazer login, melhorando UX.

**Teste Independente**: Formulário valida campos em tempo real, mostrando mensagens específicas para cada erro (email inválido, senha vazia, etc.). Botão "Entrar" permanece desabilitado enquanto houver erros.

### Implementação para User Story 2

- [x] T022 [P] [US2] Expandir schema Zod em `src/lib/schemas/auth.ts`:
  - Email: validação RFC 5322 simplificada, mensagem "Formato de e-mail inválido"
  - Senha: mínimo 8 caracteres, pelo menos 1 maiúscula, 1 minúscula, 1 número
  - Mensagens de erro em pt-BR para cada validação

- [x] T023 [US2] Atualizar LoginForm em `src/components/auth/LoginForm.tsx`:
  - Validação em tempo real enquanto usuário digita (via react-hook-form watch)
  - Exibir ícones de erro/sucesso inline no Input
  - Mostrar mensagens específicas abaixo de cada campo:
    - Email: "E-mail é obrigatório" | "Formato de e-mail inválido"
    - Senha: "Senha é obrigatória" | "Senha deve ter no mínimo 8 caracteres" | "Senha deve conter maiúscula, minúscula e número"
  - Desabilitar botão "Entrar" enquanto houver erros (fórmula: `!isValid || isLoading`)
  - Botão habilitado apenas se email e senha são válidos

- [x] T024 [P] [US2] Criar componente FieldError em `src/components/ui/FieldError.tsx`:
  - Exibe mensagem de erro com ícone de alerta
  - Estilo consistente com design system
  - Animação suave ao aparecer/desaparecer (Framer Motion)

- [x] T025 [P] [US2] Atualizar Input.tsx em `src/components/ui/Input.tsx`:
  - Aceitar prop `error?: string` e `success?: boolean`
  - Mostrar estado visual (border vermelha/verde)
  - Integrar com FieldError para mostrar mensagem
  - Acessibilidade: aria-invalid, aria-describedby

- [x] T026 [US2] Testar validações (manual):
  - Email vazio → mensagem "E-mail é obrigatório", botão desabilitado
  - Email inválido (ex: "usuario@") → mensagem "Formato de e-mail inválido", botão desabilitado
  - Senha vazia → mensagem "Senha é obrigatória", botão desabilitado
  - Senha com menos de 8 caracteres → mensagem apropriada, botão desabilitado
  - Senha sem maiúscula/minúscula/número → mensagem apropriada, botão desabilitado
  - Email e senha válidos → botão habilitado, sem mensagens de erro
  - Validações acontecem sem enviar dados ao servidor

**Checkpoint**: User Story 2 funcional — Validação em tempo real implementada e testada

---

## Phase 5: User Story 3 — Recuperação de Senha (Priority: P2)

**Objetivo**: Um usuário que esqueceu sua senha consegue recuperá-la através de um e-mail de redefinição.

**Teste Independente**: Um usuário clica em "Esqueceu sua senha?", insere seu e-mail, recebe e-mail com link de redefinição e consegue criar nova senha. Pode fazer login com a nova senha.

### Implementação para User Story 3

- [x] T027 [P] [US3] Criar rota de requisição de redefinição em `src/app/api/auth/reset-password/route.ts`:
  - POST handler que recebe email
  - Valida email e verifica se usuário existe (segurança: não revelar se email existe)
  - Chama Supabase `resetPasswordForEmail(email)`
  - Retorna mensagem genérica "E-mail de redefinição enviado"

- [x] T028 [P] [US3] Criar rota de callback de redefinição em `src/app/api/auth/callback/route.ts`:
  - GET handler para callback de redefinição de senha
  - Processa token recebido via URL (Supabase envia no link)
  - Valida token e redireciona para página de redefinição se válido
  - Redireciona para login se token inválido/expirado

- [x] T029 [US3] Criar página de recuperação em `src/app/(auth)/forgot-password/page.tsx`:
  - Formulário com campo de email
  - Botão "Enviar Instruções"
  - Validação de email (reutilizar schema)
  - Mensagem de sucesso após envio
  - Link "Voltar para login"

- [x] T030 [US3] Criar componente ForgotPasswordForm em `src/components/auth/ForgotPasswordForm.tsx`:
  - Integra react-hook-form com schema de email
  - Submit envia POST para `/api/auth/reset-password`
  - Exibe mensagem de sucesso com instruções
  - Trata erros de servidor

- [x] T031 [US3] Criar página de redefinição em `src/app/(auth)/reset-password/page.tsx`:
  - Renderiza se token válido
  - Formulário com nova_senha e confirmar_senha
  - Valida senhas antes de submit
  - Submit envia PUT para Supabase `updateUser({ password: novaSenha })`
  - Mensagem de sucesso e redirecionamento para login

- [x] T032 [P] [US3] Criar componente ResetPasswordForm em `src/components/auth/ResetPasswordForm.tsx`:
  - Campos: nova_senha (8+ chars, maiúscula, minúscula, número)
  - Campo: confirmar_senha (deve ser igual a nova_senha)
  - Validação em tempo real
  - Ícone de visibilidade de senha (show/hide)
  - Submit envia dados ao servidor

- [x] T033 [P] [US3] Atualizar layout `(auth)` para incluir links de navegação:
  - Link "Voltar para login" em página de recuperação
  - Link "Esqueceu sua senha?" na página de login

- [x] T034 [US3] Adicionar função de reset em `src/lib/supabase/auth.ts`:
  - `requestPasswordReset(email)` — chama Supabase
  - `resetPasswordWithToken(token, novaSenha)` — valida e atualiza senha

- [x] T035 [US3] Testar fluxo de recuperação (manual):
  - Clicar "Esqueceu sua senha?" na página de login
  - Inserir email válido → mensagem "E-mail de redefinição enviado"
  - Simular clique em link do e-mail (usando token de teste)
  - Inserir nova senha → mensagem de sucesso
  - Fazer login com nova senha → sucesso
  - Teste com email não registrado → mensagem genérica (sem revelar)
  - Teste com token expirado → mensagem "Link inválido ou expirado"

**Checkpoint**: User Story 3 funcional — Recuperação de senha implementada e testada

---

## Phase 6: User Story 4 — Logout (Priority: P2)

**Objetivo**: Um usuário autenticado consegue fazer logout de forma simples e segura para encerrar sua sessão.

**Teste Independente**: Um usuário clica em "Sair", a sessão é destruída no servidor e cliente, é redirecionado para login e não consegue acessar áreas protegidas.

### Implementação para User Story 4

- [x] T036 [P] [US4] Criar rota de logout em `src/app/api/auth/logout/route.ts`:
  - POST handler que recebe JWT do usuário
  - Revoga refresh token no Supabase (signOut)
  - Limpa cookies de autenticação (`__Secure-auth-token`, `__Secure-refresh-token`)
  - Retorna sucesso
  - Trata erro se usuário não autenticado (401)

- [x] T037 [P] [US4] Criar componente LogoutButton em `src/components/auth/LogoutButton.tsx`:
  - Botão "Sair" com ícone
  - POST para `/api/auth/logout` ao clicar
  - Exibe loading enquanto processa
  - Redireciona para `/login` após sucesso
  - Trata erros com mensagem para usuário

- [x] T038 [US4] Adicionar LogoutButton no dashboard em `src/app/dashboard/page.tsx`:
  - Coloca botão em header ou menu do usuário
  - Exibe dados do usuário autenticado com opção de logout

- [x] T039 [P] [US4] Atualizar Header/Navigation em `src/components/layout/Header.tsx`:
  - Renderiza conteúdo diferente para usuário autenticado vs não autenticado
  - Se autenticado: exibe menu com LogoutButton
  - Se não autenticado: exibe link para login

- [x] T040 [P] [US4] Adicionar função de logout em `src/lib/supabase/auth.ts`:
  - `logout()` — chama Supabase signOut e limpa estado local

- [x] T041 [US4] Testar logout (manual):
  - Usuário autenticado clica "Sair"
  - Redireciona para `/login`
  - Tenta acessar URL protegida manualmente → redireciona para login
  - Verifica que cookies foram limpos
  - Clica botão voltar do navegador após logout → não consegue acessar páginas protegidas

**Checkpoint**: User Story 4 funcional — Logout implementado e testado

---

## Phase 7: User Story 5 — Layout Responsivo (Priority: P2)

**Objetivo**: Um usuário consegue usar a tela de login em qualquer tamanho de dispositivo (desktop, tablet, mobile).

**Teste Independente**: Testador abre tela de login em diferentes tamanhos de viewport (desktop 1920px, tablet 768px, mobile 375px) e consegue interagir normalmente com todos elementos: digitar, clicar, ler mensagens.

### Implementação para User Story 5

- [ ] T042 [P] [US5] Atualizar login page `src/app/(auth)/login/page.tsx` com Tailwind responsivo:
  - Desktop (1024px+): Formulário centralizado em 400px
  - Tablet (768px-1023px): Formulário em 90% da tela, max-width 500px
  - Mobile (320px-767px): Full-width com padding, min de 16px de cada lado
  - Tipografia responsiva: títulos maiores no desktop, menores no mobile
  - Espaçamento responsivo (gap, padding)

- [ ] T043 [P] [US5] Atualizar LoginForm `src/components/auth/LoginForm.tsx` com responsividade:
  - Campos Input responsive (full-width, padding adaptado)
  - Botão tamanho full-width em mobile, ajustado em desktop
  - Mensagens de erro e sucesso com font-size responsivo
  - Links (Esqueceu senha?) com tap-target mínimo de 44px em mobile

- [ ] T044 [P] [US5] Atualizar componentes UI (Button, Input, Card) em `src/components/ui/`:
  - Padding responsivo (mobile: px-4 py-3, desktop: px-6 py-4)
  - Font-size responsivo (text-sm mobile, text-base desktop)
  - Border-radius apropriado para toque (44px mínimo de altura em mobile)
  - Espaçamento entre elementos responsivo

- [ ] T045 [P] [US5] Configurar viewport meta em `src/app/layout.tsx`:
  - `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />`
  - Garante que layout não sofra zoom indesejado em mobile

- [ ] T046 [P] [US5] Atualizar global CSS em `src/app/globals.css`:
  - Tailwind mobile-first (base styles mobile, depois breakpoints maiores)
  - Cores, tipografia, espaçamento consistentes
  - Sem scroll horizontal em nenhum viewport

- [ ] T047 [P] [US5] Adicionar página de recuperação responsiva em `src/app/(auth)/forgot-password/page.tsx`:
  - Mesmo padrão de responsividade que login
  - Formulário centralizado e responsivo

- [ ] T048 [P] [US5] Adicionar página de redefinição responsiva em `src/app/(auth)/reset-password/page.tsx`:
  - Mesmo padrão de responsividade que login
  - Formulário centralizado e responsivo

- [ ] T049 [US5] Testar responsividade (manual em diferentes viewports):
  - Desktop (1920px): Layout otimizado, legível, não quebrado
  - Tablet (768px): Layout se adapta, tudo funcional, sem scroll horizontal
  - Mobile (375px): Full-width, padding adequado, botões clicáveis (44px+), textos legíveis
  - Teste em navegador (DevTools) e em dispositivos reais se possível
  - Verificar input password não é cortado em mobile
  - Verificar teclado virtual não quebra layout

**Checkpoint**: User Story 5 funcional — Layout responsivo implementado e testado em todos os breakpoints

---

## Phase 8: Polimento & Melhorias Transversais

**Propósito**: Tratamento de erros, melhorias de UX, segurança e acessibilidade

### Melhorias de Tratamento de Erros

- [ ] T050 [P] Tratamento de erro: Supabase indisponível:
  - Detectar erro 503 ou timeout
  - Exibir mensagem "Falha ao conectar ao servidor. Tente novamente."
  - Permitir retry automático

- [ ] T051 [P] Tratamento de erro: Token expirado:
  - Middleware detecta 401 (token inválido)
  - Tenta renovar com refresh token via `POST /api/auth/refresh`
  - Se refresh falhar, redireciona para login com mensagem "Sessão expirada"

- [ ] T052 [P] Tratamento de erro: Múltiplas tentativas de login com falha:
  - Registrar tentativas falhadas (opcional: rate limiting no servidor)
  - Após 5 tentativas: sugerir "Esqueceu sua senha?"
  - Mensagem: "Muitas tentativas. Tente recuperar sua senha ou tente novamente em 5 minutos."

- [ ] T053 [P] Tratamento de erro: Network request timeout:
  - Timeout padrão de 10 segundos em requisições
  - Exibir mensagem "A requisição demorou muito. Verifique sua conexão."
  - Permitir retry

### Melhorias de Acessibilidade

- [ ] T054 [P] Adicionar labels semânticos para inputs:
  - `<label htmlFor="email">` com associação correta
  - `aria-label` para ícones
  - `aria-required="true"` em campos obrigatórios

- [ ] T055 [P] Adicionar suporte a teclado:
  - Tab order correto (email → senha → botão)
  - Enter em formulário faz submit
  - Esc em modais/dropdowns (se houver)

- [ ] T056 [P] Adicionar indicadores visuais de foco:
  - Focus ring visível (outline ou shadow)
  - Color contrast mínimo WCAG AA (4.5:1 para texto)

- [ ] T057 [P] Adicionar suporte a screen readers:
  - `role="form"` em formulários
  - `aria-live="polite"` em mensagens de erro
  - `aria-describedby` ligando campo a mensagem de erro
  - Teste com NVDA ou VoiceOver

### Melhorias de Segurança

- [ ] T058 [P] Implementar rate limiting em `/api/auth/login`:
  - Máximo 5 tentativas por email por 15 minutos
  - Responder com 429 Too Many Requests se excedido

- [ ] T059 [P] Validar CORS:
  - Supabase deve estar configurado com origin correto
  - Testar requisições cross-origin (se aplicável)

- [ ] T060 [P] Implementar Content Security Policy (CSP):
  - Adicionar header CSP em `next.config.ts` ou middleware
  - Proteger contra XSS

- [ ] T061 [P] Garantir HTTPS em produção:
  - Todos os cookies com `Secure` flag
  - Redirecionar HTTP → HTTPS

### Melhorias de Performance

- [ ] T062 [P] Otimizar bundle de JavaScript:
  - Code splitting em páginas `(auth)` vs dashboard
  - Lazy load de componentes pesados se houver

- [ ] T063 [P] Otimizar imagens (se houver):
  - Usar Next.js Image component
  - Servir múltiplas resoluções

- [ ] T064 [P] Implementar cache de sessão:
  - Cache local de dados do usuário (localStorage ou sessionStorage)
  - Invalidar cache ao logout

### Polimento de UX

- [ ] T065 [P] Adicionar animações com Framer Motion:
  - Fade in ao entrar em página de login
  - Slide down de mensagens de erro
  - Bounce sutil no botão ao hover
  - Indicador de carregamento (spinner) no botão durante submit

- [ ] T066 [P] Melhorar feedback visual:
  - Botão muda cor/opacity ao hover
  - Input muda border-color ao focus
  - Sucesso: ícone check + cor verde, fade out após 2s
  - Erro: ícone X + cor vermelha, shake animation

- [ ] T067 [P] Adicionar toast/notification system (opcional):
  - Se layout permitir, mostrar toast para sucessos/erros
  - Dismiss automático após 5 segundos

**Checkpoint**: Projeto polido — erros tratados, acessibilidade implementada, segurança reforçada, performance otimizada

---

## Resumo Executivo

### Contagem de Tarefas
- **Total**: 67 tarefas
- **Phase 1 (Setup)**: 5 tarefas
- **Phase 2 (Fundações)**: 8 tarefas
- **Phase 3 (US1 - Autenticação)**: 8 tarefas
- **Phase 4 (US2 - Validação)**: 5 tarefas
- **Phase 5 (US3 - Recuperação)**: 9 tarefas
- **Phase 6 (US4 - Logout)**: 6 tarefas
- **Phase 7 (US5 - Responsividade)**: 8 tarefas
- **Phase 8 (Polimento)**: 18 tarefas

### Oportunidades de Paralelização

**Phase 1**: T002, T003, T004, T005 podem rodar em paralelo (todas independentes)

**Phase 2**: T006, T007, T008, T009, T011 podem rodar em paralelo (diferentes arquivos, sem dependências)

**Phase 3 (US1)**:
- T014, T015, T019, T020 podem rodar em paralelo (diferentes componentes)
- T016 depende de T015 (precisa de LoginForm)
- T018 depende de T013 e T010 (middleware e funções de auth)

**Phase 4 (US2)**:
- T022, T024, T025 podem rodar em paralelo (componentes UI)
- T023 depende de T022 (schema Zod)
- T026 depende de todas anteriores

**Phase 5 (US3)**:
- T027, T028, T030, T032, T034 podem rodar em paralelo (diferentes rotas e componentes)
- T029 depende de T030 (ForgotPasswordForm)
- T031 depende de T032 (ResetPasswordForm)
- T033 depende de todas anteriores

**Phase 6 (US4)**:
- T036, T037, T040 podem rodar em paralelo
- T038, T039 dependem de T037 (LogoutButton)

**Phase 7 (US5)**:
- T042-T048 podem rodar em paralelo (atualizações responsivas de componentes diversos)

**Phase 8**:
- Maioria das tarefas podem rodar em paralelo (melhorias transversais independentes)

### Critérios de Teste Independente

**User Story 1**: Fazer login com credenciais válidas → autenticado, sessão persistida após reload ✓

**User Story 2**: Validações em tempo real, botão desabilitado se há erros, sem envio ao servidor ✓

**User Story 3**: Email de reset enviado, link funciona, nova senha permite login ✓

**User Story 4**: Logout destroi sessão, redireciona para login, URLs protegidas inacessíveis ✓

**User Story 5**: Funcional em desktop (1920px), tablet (768px), mobile (375px) ✓

### Escopo MVP Recomendado

**Entrega 1 (MVP Mínimo)**:
- Phase 1: Setup ✓
- Phase 2: Fundações ✓
- Phase 3: US1 (Autenticação básica) ✓
- Phase 4: US2 (Validação) ✓

**Entrega 2 (MVP +)**:
- Phase 5: US3 (Recuperação de senha)
- Phase 6: US4 (Logout)
- Phase 7: US5 (Responsividade completa)

**Entrega 3 (Polimento)**:
- Phase 8: Melhorias transversais

### Estratégia de Implementação

1. **Comece por Phase 1 e 2**: Setup e fundações devem estar 100% antes de histórias de usuário
2. **Paralelizar quando possível**: T006/T007/T008/T009 podem rodar ao mesmo tempo
3. **Testar cada história independentemente**: Não pule para próxima história sem testar a atual
4. **Validar segurança**: Garantir JWT em httpOnly, sem sensitive data em localStorage
5. **Testes manuais**: Segundo constituição, não há testes automatizados obrigatórios
6. **Responsividade por último**: Implementar lógica primeiro, depois ajustar CSS

---

**Pronto para implementação!**
