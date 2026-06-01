# Guia de Início Rápido — Feature 001: Tela de Login

**Data**: 2026-05-31

---

## Setup Inicial

### 1. Configuração do Supabase

#### 1.1 Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie novo projeto (ou use existente)
3. Anote as credenciais:
   - `NEXT_PUBLIC_SUPABASE_URL` — URL da API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Chave pública

#### 1.2 Configurar Autenticação

1. No console Supabase, acesse **Authentication** → **Providers**
2. Ativar **Email** (já habilitado por padrão)
3. Desativar outros provedores (OAuth não é necessário para MVP)

#### 1.3 Variáveis de Ambiente

Criar `.env.local` na raiz do projeto:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-key-aqui
```

**Nunca commitar `.env.local`** — Adicionar ao `.gitignore`.

---

### 2. Instalação de Dependências

```bash
npm install @supabase/supabase-js react-hook-form zod @hookform/resolvers
```

**Dependências Adicionadas**:
- `@supabase/supabase-js` — SDK oficial do Supabase
- `react-hook-form` — Gerenciamento de formulários
- `zod` — Validação de schema
- `@hookform/resolvers` — Integração Zod + Hook Form

---

### 3. Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   ├── page.tsx          ← Página de login
│   │   │   └── LoginForm.tsx      ← Componente do formulário
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   └── auth/
│   │       ├── login/
│   │       │   └── route.ts       ← POST /api/auth/login
│   │       ├── logout/
│   │       │   └── route.ts       ← POST /api/auth/logout
│   │       ├── refresh/
│   │       │   └── route.ts       ← POST /api/auth/refresh
│   │       └── me/
│   │           └── route.ts       ← GET /api/auth/me
│   ├── dashboard/
│   │   └── page.tsx               ← Página protegida (redirecionada após login)
│   ├── middleware.ts              ← Proteção de rotas
│   ├── layout.tsx
│   └── page.tsx                   ← Home (redireciona para login se não autenticado)
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── FormField.tsx
│   │   └── Card.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── LogoutButton.tsx
│   └── layout/
│       └── Header.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts              ← Cliente Supabase browser
│   │   ├── server.ts              ← Cliente Supabase server
│   │   └── auth.ts                ← Funções de autenticação
│   ├── hooks/
│   │   └── useAuth.ts             ← Hook de autenticação (se necessário)
│   ├── schemas/
│   │   └── auth.ts                ← Zod schemas para validação
│   └── types/
│       └── auth.ts                ← Types TypeScript
└── public/
    └── design-system.md           ← Referência de design
```

---

### 4. Inicializar Cliente Supabase

#### `src/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssa-js';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

#### `src/lib/supabase/server.ts`

```typescript
import { createServerClient, getCookies, setCookie } from '@supabase/ssa-js/edge';

export function createSupabaseServerClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => getCookies()[name],
        set: (name, value, options) => setCookie(name, value, options),
        remove: (name) => setCookie(name, '', { maxAge: 0 }),
      },
    }
  );
}
```

---

### 5. Middleware de Proteção

#### `src/middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('__Secure-auth-token')?.value;

  // Rotas públicas
  if (request.nextUrl.pathname.startsWith('/login') || 
      request.nextUrl.pathname.startsWith('/reset-password')) {
    if (token) {
      // Se autenticado, redirecionar para dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Rotas protegidas
  if (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname === '/') {
    if (!token) {
      // Se não autenticado, redirecionar para login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

### 6. Componente de Login

#### `src/components/auth/LoginForm.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/schemas/auth';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      setError(null);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        setError('E-mail ou senha inválidos');
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError('Falha ao conectar ao servidor');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField error={errors.email?.message}>
        <Input
          type="email"
          placeholder="seu@email.com"
          {...register('email')}
          disabled={isSubmitting}
        />
      </FormField>

      <FormField error={errors.password?.message}>
        <Input
          type="password"
          placeholder="Sua senha"
          {...register('password')}
          disabled={isSubmitting}
        />
      </FormField>

      {error && (
        <div className="rounded bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
```

---

### 7. Executar Localmente

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
# (editar .env.local com suas credenciais Supabase)

# Iniciar servidor de desenvolvimento
npm run dev

# Acessar http://localhost:3000/login
```

---

## Próximos Passos

1. ✅ Configurar Supabase
2. ✅ Instalar dependências
3. ✅ Criar estrutura de pastas
4. ✅ Implementar componentes (LoginForm, Button, Input)
5. ✅ Implementar Route Handlers (/api/auth/*)
6. ✅ Implementar middleware
7. ✅ Testes manuais
8. ⏳ Deploy em staging
9. ⏳ Deploy em produção

---

## Referências

- [Supabase Docs - Authentication](https://supabase.com/docs/guides/auth)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## Troubleshooting

### Erro: "NEXT_PUBLIC_SUPABASE_URL is not defined"
- Verificar se `.env.local` foi criado
- Reiniciar servidor de desenvolvimento

### Erro: "Cookies not accessible in browser"
- Usar `HttpOnly` cookies (apenas server)
- Para dados de sessão, usar contexto React

### Erro: "Supabase connection refused"
- Verificar URL e chaves do Supabase
- Confirmar que projeto Supabase está online
