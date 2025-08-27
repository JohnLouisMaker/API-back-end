/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.addColumn("customers", "status", {
      type: Sequelize.ENUM("ACTIVE", "ARCHIVED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const table = await queryInterface.describeTable("customers");

      if (table.status) {
        await queryInterface.removeColumn("customers", "status", { transaction });
      }

      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_customers_status";', {
        transaction,
      });
    });
  },
};
