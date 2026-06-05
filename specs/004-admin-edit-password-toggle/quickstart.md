# Quickstart: Feature 004

## Como testar localmente

```bash
npm run dev
```

### Teste 1 — Bloqueio de Auto-Desativação do Admin

1. Fazer login com um usuário de role `admin`
2. Navegar para `/users`
3. Clicar em "Editar" no próprio usuário (cujo ID corresponde ao usuário logado)
4. **Resultado esperado**: A seção "Ações" NÃO exibe o botão "Desativar Usuário"
5. Clicar em "Editar" em outro usuário
6. **Resultado esperado**: A seção "Ações" exibe normalmente "Desativar/Ativar Usuário"

### Teste 2 — Toggle de Visibilidade de Senha no Login

1. Acessar `/login` sem estar autenticado
2. Digitar algo no campo de senha
3. **Resultado esperado**: Campo mostra senha mascarada por padrão; ícone de olho visível
4. Clicar no ícone de olho
5. **Resultado esperado**: Senha fica visível; ícone muda para olho riscado
6. Clicar novamente
7. **Resultado esperado**: Senha volta a ser mascarada
8. Submeter o formulário com toggle ativo
9. **Resultado esperado**: Login funciona normalmente, independente do estado do toggle

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/app/api/auth/me/route.ts` | Corrigir para usar `getServerUser()` + buscar role em `public.users` |
| `src/components/ui/Input.tsx` | Adicionar prop `rightElement?: React.ReactNode` |
| `src/components/auth/LoginForm.tsx` | Adicionar toggle de visibilidade de senha |
| `src/app/(admin)/users/[userId]/page.tsx` | Buscar usuário logado, suprimir botão de desativar |
