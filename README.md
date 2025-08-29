# API-back-end

# 🏢 Gerenciamento De Clientes

> API REST completa para gerenciamento de clientes, contatos e usuários desenvolvida com Node.js, Express e Sequelize.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)

## 📋 Sobre o Projeto

API robusta desenvolvida para gerenciar relacionamentos comerciais, com o controle completo de usuários, clientes e seus respectivos contatos. Implementa autenticação JWT, validações rigorosas e oferece recursos avançados de filtragem e paginação.

## ✨ Funcionalidades

### 🔐 Autenticação
- [x] Cadastro de usuários com validação
- [x] Login com JWT
- [x] Middleware de autenticação
- [x] Hash seguro de senhas (bcrypt)

### 👥 Gerenciamento de Usuários
- [x] CRUD completo de usuários
- [x] Perfil de usuário
- [x] Alteração de senha com validação
- [x] Filtros por nome, email, status e data

### 🏢 Gerenciamento de Clientes
- [x] CRUD completo de clientes
- [x] Status (ACTIVE/ARCHIVED)
- [x] Relacionamento com contatos
- [x] Filtros avançados e paginação
- [x] Ordenação customizável

### 📞 Gerenciamento de Contatos
- [x] CRUD completo de contatos
- [x] Vinculação automática com clientes
- [x] Filtros por cliente, status e período
- [x] Busca por nome e email

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Sequelize** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação via tokens
- **Bcrypt** - Hash de senhas
- **Yup** - Validação de dados
- **Jest** - Testes automatizados
- **ESLint + Prettier** - Qualidade de código

## 🚀 Como Executar

### Pré-requisitos
- Node.js >= 16.x
- PostgreSQL >= 12.x
- npm ou yarn

### 1. Clone o repositório
```bash
git clone https://github.com/JohnLouisMaker/API-back-end.git
cd API-back-end
```

### 2. Instale as dependências
```bash
npm install
# ou
yarn install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
JWT_SECRET=seu_jwt_secret_super_seguro
DB_HOST=localhost
DB_USER=postgres
DB_PASS=sua_senha
DB_NAME=customer_management
DB_DIALECT=postgres
```

### 4. Configure o banco de dados
```bash
# Criar o banco de dados
npx sequelize-cli db:create

# Executar migrations
npx sequelize-cli db:migrate
```

### 5. Execute a aplicação
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

A API estará disponível em `http://localhost:3001`

## 📋 Rotas da API

### 🔐 Autenticação
```http
POST /users          # Cadastro de usuário
POST /login          # Login
```

### 👥 Usuários (Autenticação necessária)
```http
GET    /users        # Listar usuários
GET    /users/:id    # Buscar usuário
PUT    /users/:id    # Atualizar usuário
DELETE /users/:id    # Deletar usuário
```

### 🏢 Clientes
```http
GET    /customers           # Listar clientes
GET    /customers/:id       # Buscar cliente
POST   /customers           # Criar cliente
PUT    /customers/:id       # Atualizar cliente
DELETE /customers/:id       # Deletar cliente
```

### 📞 Contatos
```http
GET    /customers/:customerId/contacts     # Listar contatos
GET    /customers/:customerId/contacts/:id # Buscar contato
POST   /customers/:customerId/contacts     # Criar contato
PUT    /customers/:customerId/contacts/:id # Atualizar contato
DELETE /customers/:customerId/contacts/:id # Deletar contato
```

## 🔍 Filtros e Parâmetros

Todas as listagens suportam os seguintes parâmetros:

### Filtros Gerais
- `name` - Busca por nome (case-insensitive)
- `email` - Busca por email (case-insensitive)  
- `status` - Filtrar por status (ACTIVE, ARCHIVED)
- `page` - Número da página (padrão: 1)
- `limit` - Items por página (padrão: 25)
- `sort` - Ordenação (ex: `name:ASC`, `created_at:DESC`)

### Filtros de Data
- `createdAfter` - Criado após data (ISO 8601)
- `createdBefore` - Criado antes da data (ISO 8601)
- `updatedAfter` - Atualizado após data (ISO 8601)
- `updatedBefore` - Atualizado antes da data (ISO 8601)

### Exemplo de Uso
```http
GET /customers?name=João&status=ACTIVE&page=1&limit=10&sort=created_at:DESC
```

## 📝 Exemplos de Requisições

### Criar Usuário
```http
POST /users
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "12345678",
  "passwordConfirm": "12345678",
  "status": "ACTIVE"
}
```

### Login
```http
POST /login
Content-Type: application/json

{
  "email": "joao@email.com",
  "password": "12345678"
}
```

### Criar Cliente (Autenticado)
```http
POST /customers
Authorization: Bearer seu_jwt_token
Content-Type: application/json

{
  "name": "Empresa XYZ",
  "email": "contato@empresa.com",
  "status": "ACTIVE"
}
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Executar com coverage
npm run test:coverage

# Executar em modo watch
npm run test:watch
```

### Cobertura de Testes
- [x] AuthController - Login e autenticação
- [x] AuthMiddleware - Validação de tokens
- [x] ContactsController - CRUD completo
- [x] CustomersController - CRUD completo
- [x] UsersController - CRUD completo

## 📦 Scripts Disponíveis

```bash
npm run dev        # Executar em desenvolvimento
npm run lint       # Verificar código com ESLint
npm run lint:fix   # Corrigir problemas automaticamente
npm run format     # Formatar código com Prettier
npm test           # Executar testes
```

## 🔒 Segurança

### Implementações de Segurança
- ✅ Autenticação JWT com expiração
- ✅ Hash de senhas com bcrypt + salt
- ✅ Validação rigorosa de entrada
- ✅ Middleware de autenticação
- ✅ Sanitização de dados
- ✅ Proteção contra SQL Injection (Sequelize)

### Headers de Segurança Recomendados
```javascript
// Adicionar ao Express (não implementado)
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
```

## 🚀 Deploy

### Variáveis de Ambiente (Produção)
```env
NODE_ENV=production
JWT_SECRET=jwt_secret_super_forte_producao
DB_HOST=seu_host_producao
DB_USER=usuario_producao
DB_PASS=senha_super_segura
DB_NAME=customer_management_prod
DB_DIALECT=postgres
```

### Plataformas Recomendadas
- **Railway** - Deploy fácil com PostgreSQL
- **Render** - Gratuito com limitações
- **Heroku** - Clássico para APIs
- **DigitalOcean** - VPS customizável

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**João Luis Silva Venâncio**
- LinkedIn: [https://linkedin.com/in/seu-perfil](https://www.linkedin.com/in/jo%C3%A3o-luis-75b18a333/)
- GitHub: [https://github.com/seu-usuario](https://github.com/JohnLouisMaker)
- Email: jluisilvenancio@gmail.com

⭐ **Se este projeto te ajudou, deixe uma estrela!**
