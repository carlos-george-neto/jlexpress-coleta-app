# Pesquisa — Feature 001: Tela de Login

**Data**: 2026-05-31
**Status**: Pesquisa Completa

---

## 1. Integração Supabase com Next.js App Router

### Decisão
Usar `@supabase/supabase-js` (SDK oficial) com Next.js App Router, seguindo padrão de route handlers para API.

### Rationale
- Supabase fornece SDK otimizado para JavaScript/TypeScript
- Integração nativa com Next.js 13+ via Route Handlers
- Suporte a JWT e sessão server-side via middleware
- Melhor segurança ao manter tokens no servidor

### Alternativas Consideradas
- NextAuth.js: Mais complexo para caso de uso simples com Supabase
- Clerk: Alternativa paga, adiciona dependência externa
- Auth0: Mesmo problema, alternativa paga

### Implementação
```
Route Handlers:
  - /app/api/auth/login → POST (email + senha)
  - /app/api/auth/logout → POST
  - /app/api/auth/refresh → POST (renovação de sessão)
  - /app/api/auth/reset-password → POST

Middleware:
  - middleware.ts na raiz de /app protege rotas
  - Verifica JWT/sessão antes de permitir acesso
```

### Estrutura de Sessão
- **JWT no Cookie HttpOnly**: Seguro contra XSS
- **Refresh Token**: Armazenado em cookie httpOnly separado
- **Middleware Next.js**: Verifica token antes de renderizar

---

## 2. Validação com React Hook Form

### Decisão
Usar `react-hook-form` para validação + `zod` para schema validation (opcional, mas recomendado).

### Rationale
- Hook Form: Leve, sem dependências pesadas, excelente performance
- Zod: Type-safe schema validation com suporte a mensagens customizadas em pt-BR
- Ambas são padrão de indústria para React moderno

### Alternativas Consideradas
- Formik: Mais pesado, menos popular em Next.js moderno
- Validação manual: Complexo, sujeito a erros
- HTML5 nativa: Insuficiente para casos complexos

### Padrão de Validação
```typescript
// Em pt-BR
const schema = z.object({
  email: z.string()
    .email("Formato de e-mail inválido")
    .min(1, "E-mail é obrigatório"),
  password: z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .min(1, "Senha é obrigatória"),
});
```

---

## 3. Design de Componentes

### Componentes Necessários (do design-system.md)
- `Button` — Botão primário/secundário
- `Input` — Campo de texto com suporte a erro
- `FormField` — Wrapper para validação visual
- `Card` — Container para formulário
- `Typography` — Títulos e textos

### Decisão
Implementar componentes simples e compostos no Tailwind CSS, seguindo design-system.md.

### Padrão
```
/src/components/ui/
  - Button.tsx
  - Input.tsx
  - FormField.tsx
  - Card.tsx
```

---

## 4. Responsividade Mobile

### Decisão
Mobile-First approach: Começar em 320px (iPhone SE), expandir para tablet (768px), desktop (1024px+).

### Padrão Tailwind
```
sm: 640px (tablet)
md: 768px (tablet grande)
lg: 1024px (desktop)
xl: 1280px (desktop grande)
```

### Estrutura Login
- Desktop: Formulário centralizado em 400px
- Tablet: Formulário em 90% da tela
- Mobile: Formulário full-width com padding

---

## 5. Tratamento de Erros

### Camadas de Erro
1. **Frontend**: Validação de schema (Zod)
2. **Route Handler**: Lógica de negócio (credenciais inválidas)
3. **Supabase**: Erros de conexão/banco

### Mensagens de Erro (pt-BR)
- "E-mail ou senha inválidos" — Credencial incorreta (genérico por segurança)
- "E-mail já registrado" — Email duplicado (em cadastro)
- "Falha ao conectar ao servidor" — Erro de conexão
- "Sessão expirada" — Refresh token inválido

---

## 6. Segurança

### Checklist
- [ ] Senhas com hash (bcrypt via Supabase)
- [ ] JWT em cookie httpOnly (não localStorage)
- [ ] CORS configurado (Supabase)
- [ ] Rate limiting em /api/auth/login (opcional, mas recomendado)
- [ ] HTTPS obrigatório em produção
- [ ] Validação server-side de todas as entradas

### LGPD/GDPR
- Usuário pode deletar sua conta (futura)
- Consentimento de coleta de dados (future)
- Dados mínimos coletados: email, name, profile

---

## Conclusão

Todas as incógnitas foram resolvidas. A especificação técnica está pronta para Fase 1 (Design) e Fase 2 (Implementação).

**Status**: ✅ Pronto para próxima fase
