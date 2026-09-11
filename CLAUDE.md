# NEXA AI — CLAUDE.md

## 1. SOBRE O PROJETO

NEXA AI é uma plataforma de geração de aplicações por IA, inspirada em ferramentas como Lovable e Bolt.new, com foco em gerar projetos completos, funcionais e visualmente profissionais a partir de prompts em linguagem natural.

O objetivo não é apenas gerar código que funcione, mas gerar aplicações com:

* UI profissional
* UX consistente
* arquitetura organizada
* responsividade
* componentes reutilizáveis
* código funcional
* preview estável
* capacidade de validar e corrigir problemas automaticamente

---

## 2. REGRA PRINCIPAL

**Não implemente mudanças grandes sem primeiro entender a arquitetura existente.**

Antes de modificar código:

1. Analise os arquivos envolvidos.
2. Entenda como o fluxo atual funciona.
3. Identifique dependências entre frontend e backend.
4. Preserve funcionalidades existentes.
5. Explique mudanças arquiteturais importantes antes de implementá-las.

Não reescreva o projeto inteiro quando uma alteração localizada for suficiente.

---

## 3. REGRAS DE CÓDIGO

* Não remover funcionalidades existentes sem autorização.
* Não substituir integrações reais por mocks.
* Não expor API keys no frontend.
* Não duplicar lógica desnecessariamente.
* Não criar arquivos ou abstrações sem necessidade.
* Preferir código simples, modular e reutilizável.
* Evitar arquivos gigantes quando uma separação fizer sentido.
* Manter compatibilidade entre frontend e backend.
* Não alterar dependências sem necessidade.
* Não instalar pacotes sem justificar a necessidade.
* Não alterar configurações importantes sem verificar o impacto.

---

## 4. NEXA ENGINE

O objetivo da evolução do NEXA é sair de um modelo de:

Prompt → IA → projeto inteiro

para um pipeline mais controlado:

Prompt
→ Planning
→ ProjectPlan
→ Scaffold determinístico
→ Design System
→ Geração incremental
→ Validação
→ Review
→ Correção
→ Preview

### Princípio fundamental

**A IA decide intenção e conteúdo. O código controla estrutura e regras determinísticas.**

O LLM NÃO deve ser responsável sozinho por:

* estrutura básica do projeto
* imports fundamentais
* organização obrigatória dos arquivos
* regras de espaçamento
* resolução de imports
* detecção de white screen
* decisões estruturais que podem ser determinísticas

---

## 5. ENGINE 2.0

A evolução planejada do Engine deve seguir etapas incrementais.

### Prioridade 1 — ProjectPlan + Scaffold

Transformar o prompt em uma estrutura planejada antes de gerar código.

Fluxo:

Prompt
→ ProjectPlan JSON
→ Scaffold determinístico
→ aplicação mínima funcional
→ Preview

O scaffold deve garantir que a estrutura básica exista antes da geração dos componentes.

### Prioridade 2 — Archetypes + geração incremental

Utilizar estruturas/componentes pré-definidos para tipos comuns de seção.

Exemplos:

* Hero
* Navbar
* Features
* Pricing
* Testimonials
* Product Grid
* Dashboard
* Footer
* Contact
* CTA

A IA deve preencher e adaptar estruturas profissionais em vez de inventar toda a estrutura do zero.

### Prioridade 3 — Design System

O Design System deve controlar de forma consistente:

* tipografia
* escala de espaçamento
* cores
* bordas
* radius
* sombras
* densidade
* elevação
* animações
* responsividade

Evitar que cada componente invente seus próprios valores.

### Prioridade 4 — Validation + Review

O NEXA deve ser capaz de:

1. gerar
2. executar/validar
3. detectar erros
4. identificar o arquivo responsável
5. corrigir
6. validar novamente

A geração não deve terminar simplesmente porque o código foi produzido.

### Prioridade 5 — Model Tier Routing

Diferentes tarefas podem utilizar diferentes níveis/modelos de IA.

Planner e Reviewer são etapas críticas.

Nunca esconder uma degradação de modelo que possa prejudicar significativamente a qualidade.

Quando houver fallback relevante, o sistema deve conseguir identificar que está em modo degradado.

### Prioridade 6 — Persistência

A persistência de projetos e estados do pipeline pode utilizar `ProjectRecord`/SQLite quando essa etapa for implementada.

Não implementar persistência apenas para "seguir a arquitetura" se ainda não houver necessidade funcional.

---

## 6. IMPLEMENTAÇÃO INCREMENTAL

Não implementar todas as etapas do Engine 2.0 de uma vez.

Cada etapa deve:

1. ser implementada isoladamente;
2. compilar;
3. passar pelo typecheck;
4. passar pelos testes relevantes;
5. manter o sistema funcionando;
6. só então permitir a próxima etapa.

Se uma etapa causar regressão, corrigir antes de continuar.

---

## 7. QUALIDADE VISUAL

A qualidade visual é uma prioridade do NEXA.

Ao gerar interfaces:

* evitar aparência genérica;
* evitar excesso de cards;
* evitar layouts repetitivos;
* utilizar hierarquia visual clara;
* manter espaçamento consistente;
* criar responsividade real;
* utilizar tipografia coerente;
* criar seções visualmente equilibradas;
* evitar interfaces que pareçam apenas um template básico.

O resultado deve parecer um produto real, não apenas uma demonstração de código.

---

## 8. PREVIEW

O Preview é parte fundamental do produto.

Uma aplicação considerada "gerada com sucesso" deve:

* iniciar corretamente;
* não apresentar white screen;
* não possuir erros críticos no console;
* carregar seus módulos;
* renderizar a interface;
* manter responsividade básica.

Sempre que possível, erros encontrados no Preview devem alimentar o processo de correção.

---

## 9. VALIDAÇÃO

Depois de alterações relevantes, executar as validações disponíveis no projeto.

Prioridade:

1. TypeScript/typecheck
2. testes
3. lint
4. build
5. validação do Preview quando aplicável

Não afirmar que uma alteração está funcionando sem verificar.

---

## 10. ARQUITETURA EXISTENTE

Antes de alterar o Engine, analisar especialmente os fluxos atualmente relacionados a:

* `server/index.js`
* `createGeneratePrompt`
* `streamModelText`
* `resolveTheme`
* `useStore`
* fluxo `/api/generate`
* fluxo `/api/chat`
* pipeline atual de geração
* validação
* preview

Não assumir que a arquitetura proposta já está implementada.

A documentação do Engine 2.0 representa o **roadmap arquitetural**, não necessariamente o estado atual do código.

---

## 11. NÃO FAZER

Não:

* reescrever o projeto inteiro sem necessidade;
* trocar toda a stack;
* apagar funcionalidades para simplificar;
* criar uma nova arquitetura paralela sem necessidade;
* transformar tudo em abstrações excessivas;
* instalar dezenas de bibliotecas;
* esconder erros;
* usar mocks para fingir que uma integração funciona;
* considerar "código gerado" como sinônimo de "projeto concluído".

---

## 12. COMO TRABALHAR

Quando receber uma tarefa:

### Tarefa pequena

Pode implementar diretamente depois de analisar os arquivos necessários.

### Tarefa média

Analise os arquivos envolvidos, explique rapidamente o plano e implemente.

### Tarefa arquitetural

Primeiro:

1. analisar arquitetura;
2. identificar impacto;
3. apresentar plano;
4. aguardar aprovação quando a mudança for significativa;
5. implementar em etapas.

---

## 13. REGRA DE OURO

**Priorize estabilidade + qualidade + evolução incremental.**

O objetivo não é apenas fazer o NEXA funcionar.

O objetivo é fazer o NEXA gerar aplicações que pareçam ter sido desenvolvidas por um profissional.
