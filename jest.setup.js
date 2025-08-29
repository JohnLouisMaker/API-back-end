import { sequelize } from "../src/database/index.js";
import User from "../src/app/models/users.js";
import Customer from "../src/app/models/customers.js";
import Contact from "../src/app/models/contacts.js";

beforeAll(async () => {
  try {
    console.log("Configurando banco de dados de teste...");

    await sequelize.authenticate();
    console.log("Conexão com banco de dados estabelecida");

    await sequelize.sync({ force: true });
    console.log("Tabelas sincronizadas com force: true");
  } catch (error) {
    console.error("Erro ao configurar banco de dados:", error);
    throw error;
  }
});

afterEach(async () => {
  try {
    console.log("Limpando dados após teste...");

    await Contact.destroy({ where: {}, force: true });
    await Customer.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    console.log("Dados limpos com sucesso");
  } catch (error) {
    console.error("Erro ao limpar dados:", error);
  }
});

afterAll(async () => {
  try {
    await sequelize.close();
    console.log("Conexão com banco de dados fechada");
  } catch (error) {
    console.error("Erro ao fechar conexão:", error);
  }
});
