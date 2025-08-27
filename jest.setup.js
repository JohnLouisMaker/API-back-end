// test/jest.setup.js
import { sequelize } from "../src/database/index.js";
import User from "../src/app/models/users.js";
import Customer from "../src/app/models/customers.js";
import Contact from "../src/app/models/contacts.js";

// Configuração global antes de todos os testes
beforeAll(async () => {
  try {
    console.log("Configurando banco de dados de teste...");

    // Autenticar
    await sequelize.authenticate();
    console.log("Conexão com banco de dados estabelecida");

    // Sincronizar forçando a recriação das tabelas
    await sequelize.sync({ force: true });
    console.log("Tabelas sincronizadas com force: true");
  } catch (error) {
    console.error("Erro ao configurar banco de dados:", error);
    throw error;
  }
});

// Limpeza após cada teste
afterEach(async () => {
  try {
    console.log("Limpando dados após teste...");

    // Método seguro para SQLite - deletar em vez de truncate
    await Contact.destroy({ where: {}, force: true });
    await Customer.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    console.log("Dados limpos com sucesso");
  } catch (error) {
    console.error("Erro ao limpar dados:", error);
  }
});

// Limpeza após todos os testes
afterAll(async () => {
  try {
    await sequelize.close();
    console.log("Conexão com banco de dados fechada");
  } catch (error) {
    console.error("Erro ao fechar conexão:", error);
  }
});
