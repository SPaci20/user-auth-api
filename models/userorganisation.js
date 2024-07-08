module.exports = (sequelize, DataTypes) => {
  const UserOrganisation = sequelize.define('UserOrganisation', {
    userId: DataTypes.STRING,
    orgId: DataTypes.STRING
  }, {});
  return UserOrganisation;
};

