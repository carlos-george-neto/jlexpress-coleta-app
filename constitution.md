# JLExpress Coleta App — Constituição do Projeto

**Versão**: 1.0.0 | **Ratificação**: 2026-05-31 | **Última Emenda**: 2026-05-31

## I. Princípios Fundamentais (Regras Inegociáveis)

### Idioma de Interação
100% das respostas textuais do agente, explicações, comentários no chat e feedbacks devem ser gerados em português brasileiro (pt-BR). Documentação, mensagens de commit e pull requests DEVEM ser escritos exclusivamente em português.
**Justificativa**: Garantir coerência linguística e facilitar compreensão para o time brasileiro.

### Modificações e Documentação
Todos os comentários inseridos no código-fonte, mensagens de commit sugeridas, pull requests, arquivos Markdown gerados (`spec.md`, `plan.md`, `tasks.md`) e documentações internas DEVEM ser escritos exclusivamente em português. Exceção: apenas a sintaxe lógica da linguagem (nomes de variáveis, funções, classes e palavras-chave do código) deve permanecer em inglês para manter o padrão técnico da base de código.
**Justificativa**: Manter código consistente com a indústria, documentação acessível ao contexto local.

### Qualidade em Primeiro Lugar (Sem Testes)
Absolutamente não deve haver testes (testes unitários, testes de integração e testes e2e). Esta diretiva prevalece sobre qualquer outra orientação.
**Justificativa**: Simplificar a arquitetura, reduzir complexidade e manter enfoque no MVP funcional.

### Simplicidade Arquitetural
Princípios de Clean Code. Favorecer designs simples (YAGNI — You Aren't Gonna Need It). Evitar otimizações prematuras. Código autodocumentado: variáveis e funções devem ter nomes descritivos. Comentários apenas para decisões de design complexas.
**Justificativa**: Maximizar manutenibilidade e agilidade na evolução do projeto.

## II. Padrões de Qualidade de Código

- TypeScript estrito (`strict: true` no tsconfig), zero `any` implícito
- Componentes funcionais apenas, sem class components
- Props sempre tipadas com interfaces nomeadas em `types.ts`
- Sem lógica de negócio dentro de componentes de UI
- Separação clara entre regras de negócio e componentes de interface

## III. Pilha Tecnológica (Tech Stack)

- **Linguagem**: TypeScript (latest)
- **Framework**: Next.js (App Router)
- **Estilização**: Tailwind CSS
- **Banco de Dados & Autenticação**: Supabase (login com e-mail e senha)
- **Ícones**: Uma única biblioteca de ícones
- **Zero dependências desnecessárias**: Apenas React, TypeScript, Supabase e biblioteca de ícones

## IV. Princípios Arquiteturais

- Separação clara e explícita: padrões que separam regras de negócio de componentes de UI
- Zero dependências desnecessárias
- Modularidade e reutilização de componentes
- Estrutura de pastas intuitiva e escalável

## V. Padrões de Design

- **Mobile-First**: Todos os componentes devem funcionar em largura mínima de 320px
- **Design System**: Seguir o arquivo `design-system.md` como referência absoluta de cores, tipografia e espaçamento
- **Acessibilidade Mínima**: Todos os links com `aria-label`, imagens com `alt`, contraste WCAG AA

## VI. SEO

- SEO local implementado
- Estruturação semântica de conteúdo

## VII. Delimitação de Escopo

### Foco no MVP
Recursos não listados na especificação ativa (`spec.md`) serão sumariamente rejeitados.

### Privacidade e Conformidade
O sistema não deve coletar, armazenar ou trafegar dados sensíveis de usuários sem consentimento explícito. Conformidade com LGPD/GDPR é obrigatória.

## VIII. Governança do Documento

### Autoridade e Precedência
Esta constituição é documento vinculante para todas as decisões técnicas e de design do projeto JLExpress Coleta App. Prevalece sobre orientações genéricas.

### Procedimento de Emenda
- Alterações nesta constituição exigem revisão humana formal
- Versão deve incrementar via Semantic Versioning (MAJOR.MINOR.PATCH)
- MAJOR: Mudanças incompatíveis ou remoção de princípios
- MINOR: Novos princípios ou expansão material de orientações
- PATCH: Clarificações, correções de digitação, refinamentos não-semânticos

### Conformidade e Auditoria
Todos os PRs e especificações devem verificar conformidade com esta constituição durante revisão. Discussões sobre violações devem ser documentadas no corpo da emenda.
