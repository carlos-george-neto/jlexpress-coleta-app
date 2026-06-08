<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/007-dashboard-coletas/plan.md
<!-- SPECKIT END -->

# JLExpress Coleta App

## Idioma
Todas as respostas, comentários no código, commits, PRs e documentação
em português brasileiro (pt-BR). Apenas sintaxe do código em inglês
(variáveis, funções, classes).

## Stack
- Next.js (App Router) + TypeScript strict
- Tailwind CSS
- Supabase (auth com e-mail/senha + banco)
- Uma única biblioteca de ícones (Lucide)
- Zero dependências além dessas

## Comandos
- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run lint` — linting

## Convenções de Código
- TypeScript strict: zero `any` implícito
- Componentes funcionais apenas, sem class components
- Props sempre tipadas com interfaces em `types.ts`
- Sem lógica de negócio dentro de componentes de UI
- Nomes descritivos; comentários só para decisões de design complexas
- Princípios: Clean Code, YAGNI, sem otimizações prematuras

## Arquitetura
- Separação clara entre regras de negócio e componentes de UI
- Estrutura de pastas intuitiva e escalável
- Mobile-first: largura mínima 320px
- Acessibilidade: aria-label em links, alt em imagens, contraste WCAG AA

## O que NÃO fazer
- Não criar testes (unitários, integração ou e2e) — diretiva absoluta
- Não usar `any` em TypeScript
- Não instalar dependências não listadas na stack
- Não implementar recursos fora do escopo do spec.md ativo
- Não armazenar dados sensíveis sem consentimento (LGPD)

## Referências
- Design: seguir `design-system.md` para cores, tipografia e espaçamento
- Escopo: seguir `spec.md` ativo; recursos não listados são rejeitados
