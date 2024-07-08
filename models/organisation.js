module.exports = (sequelize, DataTypes) => {
  const Organisation = sequelize.define('Organisation', {
    orgId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING
    }
  }, {});
  Organisation.associate = function(models) {
    // associations can be defined here
    Organisation.belongsToMany(models.User, { through: 'UserOrganisation' });
  };
  return Organisation;
};

