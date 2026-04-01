# Sistema de Gestão de Planos de Ação

Um aplicativo web para criação, acompanhamento e gestão de planos de ação para lojas, permitindo o registro de problemas, prazos, status e evidências fotográficas.

## 🛠 Tecnologias Utilizadas

* **Frontend:** React 18 com TypeScript, construído com Vite.
* **Estilização:** Tailwind CSS para design responsivo e moderno.
* **Ícones:** Lucide React.
* **Backend & Banco de Dados:** Supabase (PostgreSQL, Autenticação e Storage de Arquivos).
* **Roteamento:** React Router DOM.

## 👥 Perfis de Acesso (Roles)

O sistema possui controle de acesso baseado em funções (Role-Based Access Control - RBAC) com três níveis principais:

1. **Admin (Administrador):**
   * Acesso total ao sistema.
   * Pode gerenciar (criar, editar, excluir) Lojas e Usuários.
   * Pode visualizar, criar, editar e excluir planos de ação de qualquer loja.
   * Pode vincular usuários regionais a lojas específicas.

2. **Regional:**
   * Acesso focado na gestão de múltiplas lojas.
   * Pode visualizar e interagir apenas com os planos de ação das lojas às quais está vinculado (tabela `user_stores`).

3. **Store (Loja):**
   * Acesso restrito à sua própria unidade.
   * Pode visualizar, criar e atualizar planos de ação apenas da sua loja.

## 🗄️ Estrutura do Banco de Dados (Supabase)

O banco de dados relacional é composto pelas seguintes tabelas principais:

* **`users`**: Armazena os dados dos usuários (nome, email, role). Sincronizado com o Supabase Auth.
* **`stores`**: Cadastro das lojas físicas (nome, cidade, email).
* **`user_stores`**: Tabela de relacionamento (N:N) que vincula usuários (como Regionais) a múltiplas lojas.
* **`action_plans`**: O núcleo do sistema. Armazena o problema, a ação corretiva, prazo, status e a loja vinculada.
* **`action_updates`**: Histórico de atualizações de um plano de ação (mudanças de status e comentários).
* **`evidences`**: Registros de arquivos/fotos anexados a um plano de ação (armazenados no Supabase Storage).

## 🚀 Funcionalidades Principais

* **Dashboard:** Visão geral com métricas de planos (Total, Pendentes, Em Andamento, Concluídos) e gráficos de status.
* **Gestão de Planos:** Criação de planos com descrição detalhada, definição de responsáveis e prazos.
* **Filtros Avançados:** Busca de planos por texto, loja, status e período de datas.
* **Histórico e Evidências:** Upload de imagens para comprovar a execução do plano e linha do tempo de comentários/atualizações.
* **Gestão de Acessos:** Painel exclusivo para admins gerenciarem a base de lojas e a equipe.

## 🔒 Segurança (Row Level Security - RLS)

O banco de dados utiliza as políticas de segurança do PostgreSQL (RLS) para garantir que:
* Usuários de loja só leiam/escrevam dados da sua loja.
* Regionais só acessem dados das lojas vinculadas a eles.
* Apenas os criadores dos planos (ou admins) possam excluí-los.

## 💻 Como rodar o projeto localmente

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente criando um arquivo `.env` na raiz do projeto:
   ```env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse `http://localhost:3000` no seu navegador.
