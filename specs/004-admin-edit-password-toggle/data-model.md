# Modelo de Dados: Admin Self-Deactivation Block & Toggle de Senha

**Feature**: 004-admin-edit-password-toggle | **Data**: 2026-06-05

---

## Entidades Existentes (sem alteração de schema)

### UserRecord (src/lib/types/user.ts)

| Campo      | Tipo      | Descrição                            |
|------------|-----------|--------------------------------------|
| id         | string    | UUID — identificador único           |
| email      | string    | E-mail do usuário                    |
| full_name  | string    | Nome completo                        |
| role       | UserRole  | "admin" | "collector" | "deliverer" | "user" |
| is_active  | boolean   | Status ativo/inativo                 |
| created_at | string    | ISO timestamp                        |
| updated_at | string    | ISO timestamp                        |

### CurrentUserContext (novo estado de UI, sem persistência)

Estado local no componente `EditUserPage`:

```ts
interface CurrentUser {
  id: string;
  role: UserRole;
}
```

Populado via `GET /api/auth/me` ao montar o componente. Usado exclusivamente para avaliar a regra: `currentUser.id === userId && currentUser.role === 'admin'`.

---

## Regra de Supressão (lógica de negócio)

```
mostrarBotaoDesativar = NOT (currentUser.id === userId AND currentUser.role === 'admin')
```

| Cenário                                      | Exibe botão? |
|----------------------------------------------|:------------:|
| Admin editando próprio perfil                | Não          |
| Admin editando outro usuário                 | Sim          |
| Não-admin editando qualquer usuário          | Sim          |
| currentUser não carregado (loading/erro)     | Sim (default safe — visível) |

---

## Estado do Toggle de Senha (UI local, sem persistência)

```ts
const [showPassword, setShowPassword] = useState<boolean>(false);
```

- Estado inicial: `false` (senha oculta — padrão)
- Controla apenas o `type` do `<input>` de senha no `LoginForm`
- Não afeta o valor submetido ao formulário
- Resetado automaticamente a cada carregamento da página (estado local)

---

## Contrato da API /api/auth/me (corrigido)

**GET /api/auth/me**

Resposta de sucesso (200):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

Resposta de erro (401):
```json
{
  "success": false,
  "error": "Não autenticado"
}
```

Leitura do token: cookie httpOnly `auth-token` (via `getServerUser()` de `server.ts`).
