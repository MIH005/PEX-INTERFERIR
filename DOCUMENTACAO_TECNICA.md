# 📄 Documentação Técnica: Sistema de Gestão de Planos de Ação

## 1. Visão Geral da Arquitetura
O sistema é uma aplicação web *Single Page Application* (SPA) baseada em uma arquitetura *Serverless*. O frontend gerencia a interface, estado e roteamento, comunicando-se diretamente com o Backend-as-a-Service (BaaS) via chamadas de API RESTful e WebSockets fornecidos pelo SDK do Supabase.

### Diagrama de Arquitetura (C4 Model - Nível de Container)

```mermaid
graph TD
    Client[Navegador Web / Cliente] -->|HTTPS| React[Frontend: React SPA Vite]
    
    subgraph Supabase [Backend as a Service - Supabase]
        API[API Gateway / PostgREST]
        Auth[Supabase Auth / GoTrue]
        DB[(PostgreSQL Database)]
        Storage[Supabase Storage]
    end

    React -->|Autenticação JWT| Auth
    React -->|REST API| API
    React -->|Upload de Arquivos| Storage
    
    API -->|Consultas SQL + RLS| DB
    Auth -->|Sincronização de Usuários| DB
```

## 2. Stack Tecnológico
* **Frontend Core:** React 18, TypeScript, Vite (Bundler).
* **Roteamento:** React Router DOM v6.
* **Estilização e UI:** Tailwind CSS, Lucide React (Ícones).
* **Backend & Database:** Supabase (PostgreSQL 15+).
* **Autenticação:** Supabase Auth (Integração nativa com RLS).
* **Storage:** Supabase Storage (Buckets para armazenamento de evidências).

## 3. Modelo de Dados (Database Schema)

Abaixo está o Diagrama Entidade-Relacionamento (ERD) que ilustra a estrutura do banco de dados relacional.

```mermaid
erDiagram
    users {
        uuid id PK
        text name
        text email
        text role
        text external_unit_id
    }
    stores {
        uuid id PK
        text name
        text city
        text email
        text region_id
    }
    user_stores {
        uuid user_id PK, FK
        uuid store_id PK, FK
    }
    action_plans {
        uuid id PK
        uuid store_id FK
        text description_problem
        text action_plan
        date due_date
        text status
        uuid created_by FK
        text responsible_user
    }
    action_updates {
        uuid id PK
        uuid action_plan_id FK
        uuid user_id FK
        text comment
        text status_changed_to
        timestamp created_at
    }
    evidences {
        uuid id PK
        uuid action_plan_id FK
        text file_url
        uuid uploaded_by FK
        timestamp created_at
    }

    users ||--o{ user_stores : "possui acesso"
    stores ||--o{ user_stores : "é acessada por"
    
    stores ||--o{ action_plans : "tem"
    users ||--o{ action_plans : "cria"
    
    action_plans ||--o{ action_updates : "possui histórico"
    users ||--o{ action_updates : "comenta"
    
    action_plans ||--o{ evidences : "possui anexos"
    users ||--o{ evidences : "faz upload"
```

## 4. Máquina de Estados: Planos de Ação

O ciclo de vida de um Plano de Ação segue um fluxo de status bem definido, conforme o diagrama de estados abaixo:

```mermaid
stateDiagram-v2
    [*] --> Pendente : Criação do Plano
    Pendente --> Em_Andamento : Iniciar Execução
    Em_Andamento --> Concluído : Finalizar Ação
    Pendente --> Cancelado : Abortar
    Em_Andamento --> Cancelado : Abortar
    Concluído --> [*]
    Cancelado --> [*]
```

## 5. Segurança e Controle de Acesso (RBAC & RLS)

A segurança dos dados é garantida na camada do banco de dados através de **Row Level Security (RLS)** do PostgreSQL. Nenhuma requisição do frontend pode burlar essas regras.

### Matriz de Permissões (Roles)
| Entidade | Admin | Regional | Store |
| :--- | :--- | :--- | :--- |
| **Lojas** | CRUD Total | Leitura (Apenas vinculadas) | Leitura (Apenas a sua) |
| **Usuários** | CRUD Total | Sem acesso | Sem acesso |
| **Planos de Ação** | CRUD Total | CRUD (Apenas lojas vinculadas) | CRUD (Apenas sua loja) |
| **Evidências** | CRUD Total | Leitura/Escrita (Lojas vinculadas) | Leitura/Escrita (Sua loja) |

## 6. Fluxos de Dados Principais (Sequence Diagrams)

### 6.1. Fluxo de Upload de Evidências

```mermaid
sequenceDiagram
    actor User as Usuário
    participant UI as Interface (React)
    participant Storage as Supabase Storage
    participant DB as PostgreSQL (evidences)

    User->>UI: Seleciona arquivo (Imagem/PDF)
    UI->>Storage: Faz upload do arquivo (Bucket: evidences)
    
    alt Upload com Sucesso
        Storage-->>UI: Retorna URL pública do arquivo
        UI->>DB: INSERT INTO evidences (file_url, action_plan_id)
        DB-->>UI: Confirma inserção
        UI-->>User: Exibe nova evidência na tela
    else Falha no Upload
        Storage-->>UI: Retorna Erro
        UI-->>User: Exibe mensagem de erro (Toast)
    end
```

## 7. Estrutura do Projeto Frontend (Diretórios)

O projeto segue uma arquitetura modular baseada em features e responsabilidades:

```text
src/
├── components/       # Componentes de UI reutilizáveis (Botões, Modais, Inputs)
├── lib/              # Configurações e integrações externas
│   ├── supabase.ts   # Instância do client do Supabase e tipagens (Interfaces)
│   └── AuthContext.tsx # Provedor de contexto de Autenticação global
├── pages/            # Componentes de nível de página (Rotas)
│   ├── Dashboard.tsx # Métricas e gráficos
│   ├── Home.tsx      # Listagem e filtros de planos de ação
│   ├── PlanDetails.tsx # View detalhada, timeline e upload de evidências
│   ├── Stores.tsx    # Gestão de lojas (Admin)
│   └── Users.tsx     # Gestão de usuários e vínculos (Admin)
├── App.tsx           # Configuração de Rotas (React Router) e Layout Base
├── index.css         # Diretivas do Tailwind e variáveis CSS globais
└── main.tsx          # Entry point da aplicação React
```

## 8. Variáveis de Ambiente
O sistema requer as seguintes variáveis configuradas no ambiente de deploy (Vercel, Netlify, etc) e no `.env` local:

```env
VITE_SUPABASE_URL=https://[PROJETO].supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...[CHAVE_PUBLICA]
```
