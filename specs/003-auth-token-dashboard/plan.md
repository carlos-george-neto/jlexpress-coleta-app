# Plano de Implementação: Armazenamento de Token e Dashboard

**Branch**: `003-auth-token-dashboard` | **Data**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-auth-token-dashboard/spec.md`

## Summary

Corrigir o armazenamento do token de autenticação Supabase em cookies HTTP após o login, garantindo que o middleware Next.js valide sessões reais. Complementarmente, corrigir o bug de redirecionamento no middleware para usuários autenticados que acessam `/login`, enriquecer o dashboard com dados reais do perfil e adicionar link de navegação para gestão de usuários (visível apenas para admins).

## Technical Context

**Language/Version**: TypeScript (strict mode)

**Primary Dependencies**: Next.js 16 (App Router), @supabase/supabase-js ^2.106.2, react-hook-form, zod

**Storage**: Supabase (PostgreSQL) para perfis; cookies HTTP para sessão server-side; localStorage para sessão client-side (gerenciado pelo SDK Supabase)

**Testing**: N/A (conforme constituição — sem testes)

**Target Platform**: Web (Next.js App Router, Edge-compatible Middleware)

**Performance Goals**: Redirecionamento pós-login em < 1 segundo

**Constraints**: Zero novas dependências; manter compatibilidade com abordagem de cookies existente; sem alterações de UI significativas além do link no dashboard

**Scale/Scope**: 4 arquivos modificados; nenhum arquivo novo criado

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Observação |
|-----------|--------|------------|
| Português em toda documentação | ✓ | Todos os artefatos em pt-BR |
| Sem testes | ✓ | Nenhum teste criado ou exigido |
| Simplicidade arquitetural (YAGNI) | ✓ | Apenas 4 arquivos modificados; sem novas dependências; sem nova abstração |
| TypeScript estrito, zero `any` implícito | ✓ | Tipos existentes mantidos; nenhum `any` adicionado |
| Componentes funcionais apenas | ✓ | Dashboard usa functional component existente |
| Sem lógica de negócio em componentes UI | ✓ | Lógica de auth permanece em `auth.ts` |
| Zero dependências desnecessárias | ✓ | Nenhuma nova dependência |
| Mobile-first | ✓ | Nenhuma mudança de layout; link usa classes Tailwind existentes |

**Resultado**: Sem violações. Prosseguir para implementação.

## Project Structure

### Documentation (this feature)

```text
specs/003-auth-token-dashboard/
├── plan.md              ← Este arquivo
├── research.md          ← Análise e decisões de design
├── data-model.md        ← Entidades e fluxo de dados
├── quickstart.md        ← Guia de teste manual
├── contracts/
│   └── api-contracts.md ← Contratos de API e middleware
└── tasks.md             ← Gerado por /speckit-tasks
```

### Source Code (arquivos a modificar)

```text
src/
├── lib/
│   └── supabase/
│       └── auth.ts                        ← signIn() retorna accessToken e role
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── login/
│   │           └── route.ts               ← define cookies reais
│   ├── dashboard/
│   │   └── page.tsx                       ← usa getCurrentUser(), link /users
│   └── middleware.ts                      ← corrige redirect /login → /dashboard
```

**Structure Decision**: Single Next.js App Router project. Nenhuma nova pasta ou arquivo criado — todas as mudanças são dentro de arquivos existentes.

---

## Detalhamento das Mudanças

### Mudança 1 — `src/lib/supabase/auth.ts`

**Arquivo**: `src/lib/supabase/auth.ts`
**Função**: `signIn(email, password)`

**Estado atual**: Retorna `{ success, user }` mas descarta os tokens da sessão Supabase.

**Estado desejado**: Retornar também `accessToken`, `refreshToken` e `role` para que o endpoint de login possa definir os cookies corretos.

```typescript
// Retorno atual
return {
  success: true,
  user: { id, email, fullName, profileType, isActive, createdAt, updatedAt }
};

// Retorno desejado
return {
  success: true,
  accessToken: data.session.access_token,
  refreshToken: data.session.refresh_token,
  role: userProfile.role,
  user: { id, email, fullName, profileType, isActive, createdAt, updatedAt }
};
```

**Tipo de retorno**: Adicionar `accessToken?: string`, `refreshToken?: string`, `role?: string` ao tipo de retorno de `signIn()`.

---

### Mudança 2 — `src/app/api/auth/login/route.ts`

**Arquivo**: `src/app/api/auth/login/route.ts`

**Estado atual**: Define `__Secure-auth-token` como `"placeholder"`. Não define `__Secure-user-role` nem `__Secure-refresh-token`.

**Estado desejado**: Usar os tokens retornados por `signIn()` para definir os três cookies:

```typescript
response.cookies.set("__Secure-auth-token", result.accessToken!, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 60 * 60 * 24 * 7,
});

response.cookies.set("__Secure-user-role", result.role!, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 60 * 60 * 24 * 7,
});

response.cookies.set("__Secure-refresh-token", result.refreshToken!, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 60 * 60 * 24 * 7,
});
```

---

### Mudança 3 — `src/middleware.ts`

**Arquivo**: `src/middleware.ts`

**Estado atual** (bug):
```typescript
if (authToken && publicRoutes.some((route) => pathname.startsWith(route))) {
  return NextResponse.next(); // permite acesso à /login com token ativo
}
```

**Estado desejado** (corrigido):
```typescript
if (authToken && publicRoutes.some((route) => pathname.startsWith(route))) {
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
```

---

### Mudança 4 — `src/app/dashboard/page.tsx`

**Arquivo**: `src/app/dashboard/page.tsx`

**Estado atual**:
- Usa `supabase.auth.getUser()` diretamente (sem buscar perfil)
- Define `profileType: "coletor"` fixo em código
- Sem link para gestão de usuários

**Estado desejado**:
- Substituir `supabase.auth.getUser()` por `getCurrentUser()` de `src/lib/supabase/auth.ts`
- `getCurrentUser()` já retorna `fullName` e `profileType` reais
- Adicionar link condicional para `/users`:

```tsx
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/auth";

// No loadUser():
const currentUser = await getCurrentUser();
if (!currentUser) { router.push("/login"); return; }
setUser(currentUser);

// No JSX, após os dados do usuário:
{user.profileType === "admin" && (
  <div className="mt-6 pt-6 border-t border-gray-200">
    <Link
      href="/users"
      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
      aria-label="Ir para a tela de gestão de usuários"
    >
      Gerenciar Usuários
    </Link>
  </div>
)}
```

---

## Complexity Tracking

Nenhuma violação da constituição identificada. Seção não aplicável.
