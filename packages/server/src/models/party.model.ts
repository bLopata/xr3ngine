import { Sequelize, DataTypes } from 'sequelize'
import { Application } from '../declarations'

export default (app: Application): any => {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const Party = sequelizeClient.define('party', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      allowNull: false,
      primaryKey: true
    }
  }, {
    hooks: {
      beforeCount (options: any) {
        options.raw = true
      }
    }
  });

  (Party as any).associate = (models: any) => {
    (Party as any).belongsToMany(models.user, { through: 'party_user' });
    (Party as any).hasMany(models.party_user, { unique: false })
  }
  return Party
}