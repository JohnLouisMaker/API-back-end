import { Model, DataTypes } from "sequelize";

class Customer extends Model {
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
          unique: true,
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
        modelName: "Customer",
        tableName: "customers",
        timestamps: true,
        underscored: true,
      },
    );
    return this;
  }

  static associate(models) {
    this.hasMany(models.Contact, {
      foreignKey: "customer_id",
      as: "contacts",
    });
  }
}

export default Customer;
