var bcrypt = require('bcrypt');
const saltRounds = 10;

var _ = require('underscore');

module.exports = function(sequelize, DataTypes) {
	var User = sequelize.define('user', {
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
		salt: {
			type: DataTypes.STRING
		},
		password_hash: {
			type: DataTypes.STRING
		},
		password: {
			type: DataTypes.VIRTUAL,
			allowNull: false,
			validate: {
				len: [7, 100]
			},
			set: function(val) {
				var salt = bcrypt.genSaltSync(saltRounds);
				var hash = bcrypt.hashSync(val, salt);
				this.setDataValue('password', val);
				this.setDataValue('salt', salt);
				this.setDataValue('password_hash', hash);
			}
		}
	}, {
		hooks: {
			beforeValidate: function(user, options) {
				if (typeof user.email === 'string') {
					user.email = user.email.toLowerCase();
				}
			}
		}, 
		classMethods: {
			authenticate: function(body) {
				var email = body.email.trim();
				var password = body.password.trim();

				return new Promise(function(resolve, reject) {
					if (typeof email === 'string' && email.length > 0 &&
						typeof password === 'string' && password.length > 0) {						
						// Lookup user in the database
						User
							.findOne({
								where: {
									email: email
								}
							})
							.then(function(user) {
								if (user) {
									if (bcrypt.compareSync(password, user.password_hash)) {
										resolve(user);
									}
									else {
										reject();
									}
								}
								else {
									reject();
								}
							})
							.catch(function(e) {
								reject();
							});
					} 
					else {
						return reject();
					}
				});
			}
		},
		instanceMethods: {
			toPublicJSON: function() {
				var json = this.toJSON();
				return _.pick(json, 'id', 'email', 'createdAt', 'updatedAt');
			}
		}
	});
	return User;
};