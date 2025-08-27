import { Model, DataTypes } from "sequelize";

class Contact extends Model {
  static init(sequelize) {
    super.init(
      {
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: {
            name: "email",
            msg: "E-mail já cadastrado",
          },
          validate: {
            isEmail: true,
          },
        },
        status: {
          type: DataTypes.ENUM("ACTIVE", "ARCHIVED"),
          allowNull: false,
          defaultValue: "ACTIVE",
        },
      },
      {
        sequelize,
        modelName: "Contact",
        tableName: "contacts",
        timestamps: true,
        underscored: true,
      },
    );
    return this;
  }

  static associate(models) {
    this.belongsTo(models.Customer, {
      foreignKey: {
        name: "customer_id",
        allowNull: false,
      },
      as: "customer",
    });
  }
}

export default Contact;
