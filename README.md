Tártaro Delivery 🍔

Aplicação Full Stack para delivery de hamburgueria artesanal. Backend em ASP.NET Core + Entity Framework Core + MySQL e frontend em React. Autenticação com JWT, senhas com BCrypt, consumo de API com Axios e UI reativa com cards de produtos.

Sumário

Visão Geral

Funcionalidades

Arquitetura

Demonstração

Stack Técnica

Início Rápido

Pré-requisitos

Configuração das variáveis de ambiente

Rodando localmente

Rodando com Docker

Banco de Dados e Migrações

Estrutura de Pastas

Endpoints Principais

Padrões e Convenções

Testes

CI/CD

Roadmap

Contribuições

Segurança

Licença

Autor

Visão Geral

O Tártaro Delivery é um sistema completo de pedidos para uma hamburgueria artesanal. A proposta é permitir que clientes se cadastrem, naveguem pelo cardápio com imagens, adicionem itens ao carrinho, acompanhem o status do pedido e paguem via PIX ou cartão de crédito (integrações planejadas).

Este repositório é um projeto de portfólio com foco em boas práticas de engenharia de software, entendimento de arquitetura web e entrega contínua de funcionalidades reais.

Funcionalidades

Implementadas

Cadastro e login de clientes (JWT, BCrypt).

CRUD de produtos via API REST (ASP.NET Core, EF Core, MySQL).

Frontend em React consumindo a API com Axios.

Renderização de Cards de produtos; produto cadastrado no backend aparece automaticamente no front (atualização otimista de estado).

Validações básicas, tratamento de erros e feedback de UI (toasts/loading).

Em desenvolvimento

Checkout com PIX e cartão (integração de pagamentos).

Carrinho, endereço e frete.

Painel do Administrador (gestão de catálogo/pedidos).

Status de pedido: Confirmado → Aguardando Pagamento → Em preparo → Saiu para entrega → Entregue.

Observabilidade (logs estruturados, métricas).

Arquitetura

React (Axios)  ─────────▶  ASP.NET Core API  ─────────▶  MySQL
  UI/Estado                 Controllers/DTOs               Persistência
  Rotas/Proteção            Services/Repos                 EF Core Migrations
  Cards/Forms               JWT/Auth/Validações            Seeds

API REST com Controllers enxutos e Services para regras de negócio.

Entity Framework Core para acesso a dados e migrações.

DTOs para contratos estáveis entre front e back.

JWT para autenticação e BCrypt para hash de senha.

Demonstração

Vídeo do fluxo de cadastro de produto e renderização no front: adicione em docs/demo-cadastro-produto.mp4 e referencie aqui.

Dica: publique GIF/MP4 curto no README para aumentar retenção.

Stack Técnica

Backend: C#, .NET 8, ASP.NET Core, EF Core, MySQL

Frontend: React, Axios, (Vite ou Create React App)

Auth: JWT, BCrypt

Outros: Docker (opcional), ESLint/Prettier (front), EditorConfig

Início Rápido

Pré-requisitos

.NET 8 SDK

Node.js 18+ e npm

MySQL 8+ (local ou Docker)

Configuração das variáveis de ambiente

Backend (appsettings.Development.json ou variáveis de ambiente)

{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=tartaro_db;User=tartaro;Password=secret;"
  },
  "Jwt": {
    "Key": "troque-por-uma-chave-segura",
    "Issuer": "TartaroAPI",
    "Audience": "TartaroClient",
    "ExpiresInMinutes": 60
  },
  "AllowedHosts": "*"
}

Alternativa por variáveis de ambiente:

ConnectionStrings__DefaultConnection

Jwt__Key, Jwt__Issuer, Jwt__Audience, Jwt__ExpiresInMinutes

Frontend (.env na pasta do front)

VITE_API_URL=http://localhost:5100

Rodando localmente

1) Banco de dados (MySQL)

Crie o banco e o usuário:

CREATE DATABASE tartaro_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tartaro'@'%' IDENTIFIED BY 'secret';
GRANT ALL PRIVILEGES ON tartaro_db.* TO 'tartaro'@'%';
FLUSH PRIVILEGES;

2) Backend

# a partir da pasta /backend (ex.: TartaroAPI)
dotnet restore
# aplica migrações (crie se ainda não existir)
dotnet ef database update
# roda a API
dotnet run

API padrão em http://localhost:5100 (ajuste conforme launchSettings.json).

3) Frontend

# a partir da pasta /frontend
npm install
npm run dev

Acesse http://localhost:5173 (ou porta configurada pelo dev server).

Rodando com Docker

docker-compose.yml (exemplo mínimo):

version: "3.9"
services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: tartaro_db
      MYSQL_USER: tartaro
      MYSQL_PASSWORD: secret
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql
    command: ["--default-authentication-plugin=mysql_native_password"]
volumes:
  db_data:

Você pode adicionar serviços para api e web conforme a estrutura do projeto.

Banco de Dados e Migrações

Criação/atualização de migrações (na pasta do projeto API):

# criar nova migração
dotnet ef migrations add InitialCreate
# aplicar no banco configurado
dotnet ef database update
# reverter última migração (se necessário)
dotnet ef database remove

Certifique-se de ter o dotnet-ef instalado: dotnet tool install --global dotnet-ef.

Estrutura de Pastas

T-rtaroDelivery/
├─ backend/ (ex.: TartaroAPI/)
│  ├─ Controllers/
│  ├─ DTO/
│  ├─ Models/
│  ├─ Data/ (DbContext, Migrations)
│  ├─ Services/
│  ├─ appsettings*.json
│  └─ Program.cs / Startup
├─ frontend/
│  ├─ src/
│  │  ├─ components/ (Cards, Forms, Toasts)
│  │  ├─ pages/
│  │  ├─ services/ (axios)
│  │  └─ hooks/
│  ├─ public/
│  └─ .env
└─ docs/
   ├─ demo-cadastro-produto.mp4
   └─ imagens/

Endpoints Principais

Auth

POST /api/auth/login → autentica um cliente e retorna JWT.

Body: { "email": "", "senha": "" }

200: token + claims | 401: credenciais inválidas

Produtos

GET /api/produtos → lista produtos (público)

GET /api/produtos/{id} → detalhe de produto (público)

POST /api/produtos → cria produto (restrito)

PUT /api/produtos/{id} → atualiza produto (restrito)

DELETE /api/produtos/{id} → remove produto (restrito)

Observação: endpoints podem variar conforme evolução do projeto. Verifique o arquivo de rotas/controllers.

Padrões e Convenções

Código:

Backend: Clean Controllers, Services, DTOs, validações, logs.

Frontend: componentes funcionais, hooks, estado previsível.

Commits: Conventional Commits (feat, fix, chore, refactor, docs, test).

Branches: main (estável) | feat/* novas features | fix/* correções.

Estilo: EditorConfig; ESLint/Prettier no front.

Testes

Backend: xUnit/FluentAssertions (planejado).

Frontend: Vitest/React Testing Library (planejado).

CI/CD

GitHub Actions para build, testes e verificação de lint (planejado).

Roadmap



Contribuições

Contribuições são bem-vindas!

Abra uma issue descrevendo o problema/feature.

Crie um branch a partir de main.

Envie um PR com descrição clara, prints ou vídeo (quando aplicável).

Segurança

Nunca commitar segredos/keys. Use .env e GitHub Secrets.

Rotas administrativas protegidas por JWT + Autorização.

Licença

Este projeto está sob a licença MIT. Veja LICENSE para mais detalhes.

Autor

Caio Gustavo LinkedIn: https://www.linkedin.com/in/caio-ferreira-037820229
E-mail: caiogggustavo49@gmail.com

Dúvidas, sugestões ou vagas? Me chama no LinkedIn! 


