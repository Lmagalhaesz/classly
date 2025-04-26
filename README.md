# UpTeach
Plataforma de gestão e marketing para professores autônomos e instituições de ensino.

# 📚 Prisma Schema - UpTeach Education Platform
Este é o schema de banco de dados da plataforma UpTeach, uma solução de gestão para professores autônomos e pequenas escolas.
O schema foi projetado para ser escalável, organizado e adaptável para o crescimento da aplicação.

## 📑 Organização do Schema
O schema está dividido em:

- Datasource & Generator
- Enums
- Models (Tabelas)

Cada item está comentado para fácil entendimento e manutenção.

## 🔗 Datasource e Generator

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

* Usa o banco PostgreSQL.
* Usa o Prisma Client para interação com o banco.

## 🎯 ENUMS

Enum	        Descrição
Role	        Define o tipo de usuário: estudante, professor ou admin
Level	        Níveis de fluência do aluno (Basic, Intermediate, etc.)
MessageType	    Tipos de mensagens automáticas
Sender	        Quem enviou a mensagem: aluno ou IA
RecurrenceType	Tipos de recorrência de pagamento
PaymentStatus	Status do pagamento
ActivityType	Tipos de atividades propostas aos alunos
StudentRange	Faixas de quantidade de alunos para análise comercial
TeacherRange	Faixas de quantidade de professores para análise comercial

## 🗂️ Models

### 🏢 Company
Representa uma escola ou empresa de professores.

- Pode ter múltiplos professores e alunos.
- Associa a um plano (CompanyPlan).
- Guarda informações de contato para venda humanizada.
- Guarda faixa de alunos/professores.

### 📦 CompanyPlan
Representas os planos de assinatura da empresa em específico.

- Valor fixo.
- ermite múltiplos níveis de preço via tiers.

### 💰 CompanyPlanTier
Faixas de valores dos planos para empresas, de acordo com o número de alunos/professores.

### 👤 User
Representa usuários da plataforma (estudantes, professores ou administradores).

- Relacionado a uma empresa (Company).
- Controla roles, nível de fluência, grupos e atividades.
- Controle de login por tokens.

### 👥 Group
Representa turmas de alunos.

- Cada grupo pertence a um professor.
- Alunos podem ser associados a grupos.
- Atividades e planejamentos de aula podem ser criados por grupo.

### ✉️ GroupInvitation
Representa os convites para alunos entrarem em turmas via link, QR Code ou código.

### 📚 LessonPlan
Representa os planejamentos de aula gerados (por IA ou manualmente) com base nos interesses e conversas dos alunos do grupo.

- A API vai armazenar o histórico de conversas dos alunos no chatbot, e com isso criará planejamentos e insights para aperfeiçoar e transformar as aulas mais produtivas.

#### 📝 Activity
Atividades educacionais criadas para alunos realizarem.

### 🧠 TaskAttempt
Tentativas de alunos nas atividades.

### 🎬 Video
Vídeos educacionais enviados pelos professores.

### 📺 Playlist
Playlists de vídeos, organizadas por nível de dificuldade.

### 💬 Conversation
Conversa entre aluno e IA para análise e sugestão de conteúdos/planejamento de aulas.

### 💭 ChatMessage
Mensagens trocadas em conversas de IA.

### 🔎 ChatInsight
Insights gerados com base nas conversas com a IA.

### 🧠 AutomatedMessageConfig
Configurações de mensagens automáticas de lembretes, felicitações, follow-ups de atividades, etc.

### 🔐 RefreshToken
Tokens de sessão para autenticação segura com JWT.

### 🧾 Payment
Controle de pagamentos de alunos para professores.

### 📅 PaymentPlan
Planos de cobrança recorrente configurados pelos professores.

## 🔥 Boas Práticas Aplicadas

- Uso de Soft Delete (deletedAt) em todos os modelos.
- Relacionamentos bem definidos e claros.
- Faixas de alunos/professores pensando em venda e expansão comercial.
- Preparado para IA (conversas e insights).
- Escalável para SaaS: Company ➔ Teachers ➔ Students ➔ Activities/Payments.

## 🚀 Futuras melhorias previstas

- Histórico de atualizações (auditoria).
- Faturamento automático via integração com gateways de pagamento.
- Sistema de avaliações de atividades com IA.
- Gamificação: sistema de conquistas e progressão de nível.

## ✨ Finalizando

Esse schema está pronto para:

- Gerenciar escolas de pequeno a grande porte.
- Permitir crescimento modular do sistema.
- Ser usado como base para integrações futuras (ex.: IA de ensino adaptativo, disparos automáticos de marketing, etc).
