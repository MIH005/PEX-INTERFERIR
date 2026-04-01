# 🛠️ Manual de Manutenção e Operação do Sistema

Este manual é destinado ao **desenvolvedor ou administrador técnico** que assumirá a manutenção do Sistema de Gestão de Planos de Ação. Aqui você encontrará o mapa de onde e como alterar cada parte da aplicação.

---

## 1. Banco de Dados e Backend (Supabase)

Todo o banco de dados, autenticação de usuários e armazenamento de imagens ficam no **Supabase**.

* **Acesso:** Acesse [supabase.com](https://supabase.com) e faça login com a conta administrativa.
* **Onde ver e editar os dados reais (Tabelas):**
  * No menu lateral esquerdo, clique em **Table Editor**.
  * Lá você verá as tabelas `users`, `stores`, `action_plans`, etc. Você pode editar os dados diretamente ali, como se fosse uma planilha do Excel (útil para correções rápidas).
* **Onde alterar a estrutura do banco ou regras de segurança (RLS):**
  * Vá em **SQL Editor**. É aqui que rodamos os scripts para criar novas tabelas ou alterar as permissões de quem pode deletar/editar o quê.
* **Onde gerenciar Usuários e Senhas:**
  * Vá em **Authentication** > **Users**. Lá você pode resetar senhas, excluir usuários ou ver quem está cadastrado.
* **Onde ficam as fotos anexadas:**
  * Vá em **Storage** > Bucket `evidences`.

---

## 2. Interface Visual e Código Frontend (React + Tailwind)

A interface do usuário foi construída usando **React** e **Tailwind CSS**. Se você precisar mudar cores, botões, adicionar novos campos ou criar novas telas, é aqui que você vai mexer.

### Estrutura de Pastas Principal:
* `src/pages/`: Contém as telas inteiras do sistema.
  * *Exemplo:* Quer mudar algo na tela de detalhes do plano? Abra `src/pages/PlanDetails.tsx`.
* `src/components/`: Contém pedaços de tela reutilizáveis (botões, modais, cabeçalhos).
* `src/lib/supabase.ts`: Arquivo que faz a ponte entre o visual e o banco de dados.

### Como alterar o visual (Cores, Tamanhos, Posições):
O projeto usa **Tailwind CSS**. Os estilos estão escritos diretamente nas tags HTML dentro do atributo `className`.
* *Exemplo:* Para mudar um botão azul para vermelho, procure por `className="bg-blue-600"` e altere para `className="bg-red-600"`.
* Para testar as mudanças no seu computador antes de mandar para o ar:
  1. Abra o terminal na pasta do projeto.
  2. Rode `npm install` (apenas na primeira vez).
  3. Rode `npm run dev`.
  4. Acesse `http://localhost:3000`.

---

## 3. Automações e Integrações (Google Apps Script e Checklist Fácil)

O sistema possui uma integração via **Google Apps Script** para conectar com a API do **Checklist Fácil**. Essa automação é responsável por ler os comentários das avaliações do Checklist Fácil e transformá-los automaticamente em Planos de Ação.

* **Onde acessar o código:**
  1. Acesse a Planilha do Google oficial da integração através deste link:
     [Planilha de Integração - Checklist Fácil](https://docs.google.com/spreadsheets/d/1biN49kBbM4gEF8b6z0rbPyAQsT1WzJGzQPjSEeBLmkQ/edit?usp=sharing)
  2. No menu superior da planilha, clique em **Extensões** > **Apps Script**.
  3. No editor de código que será aberto, procure pelo arquivo/aba chamado **`conexao_checklist_plano_de_acao`**.

### Como a integração funciona (Lógica do Script):
O script principal (`processarComentarios()`) faz o seguinte fluxo:
1. **Lê as Abas da Planilha:** Ele busca dados de três abas principais:
   * `Checklist_API`: Onde caem os dados brutos vindos do Checklist Fácil.
   * `Planos_Acao`: Onde os planos processados são salvos.
   * `Usuarios`: Tabela de-para que mapeia o `UserID` do Checklist Fácil para o e-mail e nome da loja.
2. **Evita Duplicidade:** Ele verifica a coluna `Codigo_Avaliacao` para garantir que um mesmo comentário não gere dois planos de ação repetidos.
3. **Extração Inteligente de Texto (Regex):** A função `parsearComentario()` analisa o texto livre digitado pelo usuário no Checklist Fácil. Ela procura por padrões específicos para quebrar o texto em três partes:
   * `Problema: [texto]`
   * `Plano de Ação: [texto]`
   * `Data: [texto]`
   * *Nota de manutenção:* Se os usuários pararem de digitar nesse formato, o script colocará todo o texto dentro do campo "Problema". Se precisar mudar o padrão de leitura, você deve alterar as expressões regulares (`regexProblema`, `regexPlano`, `regexData`) dentro desta função.
4. **Geração do Plano:** Por fim, ele monta a linha completa com os dados extraídos, vincula à loja correta (baseado no UserID) e insere na aba `Planos_Acao` com o status inicial de "Pendente".

* **Como atualizar a automação:**
  * Faça a alteração no código `.gs`.
  * Salve (ícone de disquete).
  * Verifique os Acionadores (ícone de relógio no menu esquerdo) para garantir que a função `processarComentarios` está configurada para rodar periodicamente (ex: a cada hora) ou baseada em algum evento.

---

## 4. Hospedagem e Atualizações (Netlify)

O site está hospedado no **Netlify**. Quando você faz uma alteração no código visual (Frontend) e quer que os usuários vejam a nova versão:

* **Se estiver conectado ao GitHub (Deploy Contínuo):**
  Basta fazer o `git push` para a branch principal (`main` ou `master`). O Netlify detecta a mudança e atualiza o site sozinho em cerca de 2 minutos.
* **Se for Deploy Manual:**
  1. No seu computador, rode o comando `npm run build`. Ele vai gerar uma pasta chamada `dist`.
  2. Acesse o painel do Netlify, vá na aba **Deploys**.
  3. Arraste a pasta `dist` para a área de upload no final da página. O site será atualizado instantaneamente.
* **Variáveis de Ambiente:**
  Se o banco de dados mudar, você deve atualizar as chaves no Netlify indo em **Site configuration** > **Environment variables**.

---

## 5. Atualizações de Código via Inteligência Artificial (Google AI Studio - Remix)

Se você precisar de ajuda da Inteligência Artificial para criar novas telas, alterar cores ou adicionar funcionalidades, você pode continuar usando o ambiente do **Google AI Studio** onde este app foi originalmente criado.

### Passo a passo para assumir o ambiente de IA (Fazer o "Remix"):
1. **Acessar o Link Compartilhado:** O criador original do app deve te enviar o link público de compartilhamento do AI Studio.
2. **Fazer o Remix (Cópia):** Abra o link no seu navegador (logado na sua conta Google). No topo da tela, clique no botão **"Remix"** (ou "Edit in AI Studio"). 
3. **Novo Ambiente:** O Google AI Studio criará um ambiente de chat exclusivo para você, copiando todo o código fonte atual do aplicativo.
4. **Configurar as Chaves Secretas (MUITO IMPORTANTE):** Por segurança, as senhas do banco de dados não são copiadas no Remix. Antes de pedir qualquer alteração para a IA ou rodar o app, você precisa configurar as variáveis:
   * Clique no ícone de **Engrenagem ⚙️ (Settings)** no canto superior direito.
   * Vá na seção de **Environment Variables** (Variáveis de Ambiente).
   * Adicione as duas chaves do Supabase exatamente com estes nomes:
     * `VITE_SUPABASE_URL` = *(URL do seu projeto no Supabase)*
     * `VITE_SUPABASE_ANON_KEY` = *(Chave anônima do seu projeto no Supabase)*
5. **Pedir Alterações:** Pronto! Agora você pode usar o chat para pedir coisas como: *"Mude a cor do botão de login para verde"* ou *"Crie um novo gráfico no Dashboard"*, e a IA fará a alteração no código para você.

---

## 6. Arquivos do Projeto e Acessos (Google Drive)

Todos os arquivos relacionados a este projeto estão centralizados no Google Drive para fácil acesso, backup e organização da equipe.

* **Pasta Principal do Projeto:** Todos os arquivos gerais do projeto estão salvos na pasta **"08. Pex Interferir"**.
  * 🔗 [Acessar Pasta Principal (08. Pex Interferir)](https://drive.google.com/drive/folders/1Iw013iGMj31rTI_bveuAICkS7qJlnuZJ?usp=sharing)
* **Logins e Acessos:** Os arquivos contendo as credenciais e logins dos usuários do aplicativo estão organizados na subpasta **"acessos"** (dentro da pasta 08. Pex Interferir).
  * 🔗 [Acessar Pasta de Logins (acessos)](https://drive.google.com/drive/folders/1y3JjdSSHXRWJJbG2Qdb-_ubvi1k6evqJ?usp=sharing)

---
*Em caso de dúvidas estruturais, consulte o arquivo `DOCUMENTACAO_TECNICA.md` para ver os diagramas de arquitetura e tabelas.*
