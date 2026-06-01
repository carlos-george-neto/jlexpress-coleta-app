# Feature Specification: Tela de Login e Autenticação

**Feature Branch**: `001-auth-login`

**Created**: 2026-05-31

**Status**: Draft

**Input**: Feature 1.1 do backlog do produto — Tela de Login

---

## User Scenarios & Testing

### User Story 1 - Autenticação com E-mail e Senha (Priority: P1)

Um usuário não autenticado quer acessar o sistema fornecendo suas credenciais (e-mail e senha) para obter acesso seguro à aplicação.

**Why this priority**: Sem autenticação, não há segregação de permissões ou segurança. É a funcionalidade absolutamente fundamental para o sistema. Todo acesso posterior depende disso.

**Independent Test**: Um usuário completa a tela de login com e-mail e senha válidos e é redirecionado para a página inicial autenticado. A sessão é mantida e o usuário não precisa fazer login novamente ao recarregar a página.

**Acceptance Scenarios**:

1. **Given** um usuário na tela de login, **When** insere e-mail e senha válidos e clica em "Entrar", **Then** a sessão é criada, o usuário é autenticado e redirecionado para a página inicial
2. **Given** um usuário na tela de login, **When** insere e-mail correto mas senha incorreta, **Then** exibe mensagem de erro "E-mail ou senha inválidos"
3. **Given** um usuário na tela de login, **When** insere e-mail não registrado, **Then** exibe mensagem de erro "E-mail ou senha inválidos"
4. **Given** um usuário autenticado que recarrega a página, **When** a sessão é válida, **Then** permanece autenticado sem necessidade de novo login

---

### User Story 2 - Validação de Credenciais (Priority: P1)

Um usuário quer validações claras sobre o formato de suas credenciais antes de tentar fazer login, para entender quais dados são inválidos.

**Why this priority**: Validação no frontend melhora UX e reduz requisições desnecessárias ao servidor. É crítico para uma experiência profissional.

**Independent Test**: O formulário valida campos em tempo real, mostrando mensagens específicas para cada erro (e-mail inválido, senha vazia, etc.). O botão "Entrar" permanece desabilitado enquanto houver erros.

**Acceptance Scenarios**:

1. **Given** um usuário na tela de login, **When** digita um e-mail em formato inválido, **Then** exibe mensagem "Formato de e-mail inválido"
2. **Given** um usuário na tela de login, **When** o campo de senha está vazio, **Then** exibe mensagem "Senha é obrigatória"
3. **Given** um usuário na tela de login, **When** e-mail e senha são válidos, **Then** botão "Entrar" fica habilitado
4. **Given** um usuário na tela de login, **When** digita caracteres inválidos, **Then** validações aparecem sem enviar dados ao servidor

---

### User Story 3 - Recuperação de Senha (Priority: P2)

Um usuário que esqueceu sua senha quer poder recuperá-la através de um e-mail de redefinição.

**Why this priority**: Função crítica de autoatendimento que reduz tickets de suporte. Essencial para acessibilidade, mas pode ser implementada em um segundo momento após autenticação básica.

**Independent Test**: Um usuário clica em "Esqueceu sua senha?", insere seu e-mail, recebe um e-mail com link de redefinição e consegue criar uma nova senha. Pode fazer login com a nova senha.

**Acceptance Scenarios**:

1. **Given** um usuário na tela de login, **When** clica em "Esqueceu sua senha?", **Then** é redirecionado para tela de recuperação
2. **Given** um usuário na tela de recuperação, **When** insere um e-mail registrado, **Then** exibe mensagem "E-mail de redefinição enviado"
3. **Given** um usuário recebe e-mail de redefinição, **When** clica no link, **Then** é redirecionado para tela de criação de nova senha com token validado
4. **Given** um usuário na tela de redefinição, **When** insere e confirma uma senha válida, **Then** senha é atualizada e pode fazer login com a nova senha

---

### User Story 4 - Logout (Priority: P2)

Um usuário autenticado quer poder fazer logout de forma simples e segura para encerrar sua sessão.

**Why this priority**: Funcionalidade de segurança importante para compartilhamento de dispositivos. Pode ser implementada junto com a navegação, após autenticação básica estar funcionando.

**Independent Test**: Um usuário clica em "Sair" em seu perfil/menu, a sessão é destruída no servidor e cliente, é redirecionado para a página de login e não consegue acessar áreas protegidas.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado, **When** clica em "Sair", **Then** sessão é destruída e é redirecionado para tela de login
2. **Given** um usuário que acabou de fazer logout, **When** tenta acessar URL protegida diretamente, **Then** é redirecionado para login
3. **Given** um usuário que faz logout, **When** clica botão voltar do navegador, **Then** não consegue acessar páginas protegidas

---

### User Story 5 - Layout Responsivo (Priority: P2)

Um usuário quer uma tela de login usável em qualquer tamanho de dispositivo, seja desktop, tablet ou mobile.

**Why this priority**: Conforme backlog especifica, sistema deve funcionar em web e mobile. Layout responsivo garante acessibilidade em todos os dispositivos.

**Independent Test**: Testador abre tela de login em diferentes tamanhos de viewport (desktop, tablet, mobile) e consegue interagir normalmente com todos os elementos: digitar, clicar, ler mensagens.

**Acceptance Scenarios**:

1. **Given** tela de login no desktop (1920px), **When** usuário interage com elementos, **Then** layout é otimizado para desktop
2. **Given** tela de login no tablet (768px), **When** usuário interage com elementos, **Then** layout se adapta sem perder funcionalidade
3. **Given** tela de login no mobile (375px), **When** usuário interage com elementos, **Then** tudo é acessível, campo de senha não é cortado, botões são clicáveis

---

### Edge Cases

- O que acontece se um usuário digita credenciais corretamente mas o servidor Supabase está indisponível?
- Como o sistema se comporta se um token JWT expira durante uma sessão ativa?
- O que ocorre se um usuário tenta redefinir senha com um link expirado/inválido?
- Como o sistema lida com múltiplas tentativas de login com credenciais inválidas?

---

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE permitir autenticação via e-mail e senha usando Supabase Authentication
- **FR-002**: O sistema DEVE validar formato de e-mail antes de enviar ao servidor (RFC 5322 simplificado)
- **FR-003**: O sistema DEVE exigir que a senha tenha mínimo de 8 caracteres com pelo menos 1 maiúscula, 1 minúscula e 1 número
- **FR-004**: O sistema DEVE exibir mensagens de erro específicas para cada tipo de falha (e-mail inválido, credenciais incorretas, etc.)
- **FR-005**: O sistema DEVE manter a sessão do usuário através de JWT/Auth Token armazenado seguramente
- **FR-006**: O sistema DEVE permitir logout que invalida a sessão no servidor e cliente
- **FR-007**: O sistema DEVE prover funcionalidade de "Esqueceu a senha?" que envia e-mail de redefinição
- **FR-008**: O sistema DEVE permitir que usuários reseteiem sua senha através de link tokenizado no e-mail
- **FR-009**: O sistema DEVE implementar layout responsivo que funciona em desktop (1920px+), tablet (768px-1024px) e mobile (320px-480px)
- **FR-010**: O sistema DEVE redirecionar usuários não autenticados que acessem URLs protegidas para a página de login
- **FR-011**: O sistema DEVE validar que sessão está ativa antes de permitir acesso a qualquer página protegida
- **FR-012**: O sistema DEVE exibir indicadores de carregamento enquanto processa login/logout/redefinição

### Key Entities

- **User**: Representa um usuário do sistema com e-mail único, senha hasheada, data de criação e status ativo/inativo
- **Session/Auth Token**: Representa uma sessão ativa do usuário com token JWT, data de expiração e permissões associadas
- **Password Reset Token**: Token temporário gerado para recuperação de senha com TTL (time-to-live) de 24 horas

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Um usuário consegue fazer login em menos de 30 segundos após inserir credenciais válidas
- **SC-002**: 100% das tentativas de login com credenciais inválidas retornam mensagem de erro em menos de 3 segundos
- **SC-003**: A taxa de sucesso de autenticação para usuários com credenciais corretas é 100% (zero falsos negativos)
- **SC-004**: 95% dos usuários conseguem redefinir senha através do fluxo de recuperação na primeira tentativa
- **SC-005**: O tempo de carregamento da página de login não ultrapassa 2 segundos (First Contentful Paint)
- **SC-006**: A tela de login é completamente funcional em todos os breakpoints definidos (mobile, tablet, desktop) sem erros de layout
- **SC-007**: Sessão permanece válida por no mínimo 8 horas de inatividade (tempo de token JWT)
- **SC-008**: 100% das requisições de autenticação são realizadas através de conexão HTTPS
- **SC-009**: Nenhuma senha é armazenada em logs ou localStorage; apenas tokens JWT seguros

---

## Assumptions

- **Autenticação**: Supabase fornecerá autenticação via e-mail/senha. JWT será usado como mecanismo de sessão padrão.
- **Segurança**: Todas as senhas serão hasheadas no servidor (Supabase cuidará disso). HTTPS é obrigatório em produção.
- **Armazenamento**: Tokens JWT serão armazenados de forma segura no cliente (httpOnly cookie recomendado).
- **E-mail**: Sistema de e-mail já está configurado no Supabase ou terceiro integrado para envio de recuperação de senha.
- **Política de Senha**: A política mínima descrita (8 caracteres, 1 maiúscula, 1 minúscula, 1 número) segue práticas de segurança padrão da indústria.
- **Escopo**: Mobile web responsivo no primeiro ciclo; apps nativas (iOS/Android) estão fora do escopo v1.
- **Rate Limiting**: Supabase fornecerá proteção contra brute force. Frontend implementará feedback de tentativas inválidas.
- **Contexto Global**: Autenticação será global (cookie/token disponível em toda a aplicação). Não será escopo por página.

