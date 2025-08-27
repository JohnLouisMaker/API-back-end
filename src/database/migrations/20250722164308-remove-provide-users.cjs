"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.removeColumn("users", "provider");
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.addColumn("users", "provider", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      default: false,
    });
  },
};
