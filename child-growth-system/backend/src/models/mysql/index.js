const { sequelize } = require('../../config/sequelize.config');

// Import all models
const User = require('./User');
const Family = require('./Family');
const Child = require('./Child');

// Define associations/relationships

// User <-> Family (One-to-Many)
User.hasMany(Family, {
  foreignKey: 'userId',
  as: 'families',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Family.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Family <-> Child (One-to-Many)
Family.hasMany(Child, {
  foreignKey: 'familyId',
  as: 'children',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Child.belongsTo(Family, {
  foreignKey: 'familyId',
  as: 'family'
});

// Export all models
module.exports = {
  sequelize,
  User,
  Family,
  Child
};
