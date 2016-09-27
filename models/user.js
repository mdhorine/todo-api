var bcrypt = require('bcrypt');
const saltRounds = 10;

var _ = require('underscore');
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');

module.exports = function (sequelize, DataTypes) {
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
			set: function (val) {
				var salt = bcrypt.genSaltSync(saltRounds);
				var hash = bcrypt.hashSync(val, salt);
				this.setDataValue('password', val);
				this.setDataValue('salt', salt);
				this.setDataValue('password_hash', hash);
			}
		}
	}, {
			hooks: {
				beforeValidate: function (user, options) {
					if (typeof user.email === 'string') {
						user.email = user.email.toLowerCase();
					}
				}
			},
			classMethods: {
				authenticate: function (body) {
					var email = body.email.trim();
					var password = body.password.trim();

					return new Promise(function (resolve, reject) {
						if (typeof email === 'string' && email.length > 0 &&
							typeof password === 'string' && password.length > 0) {
							// Lookup user in the database
							User
								.findOne({
									where: {
										email: email
									}
								})
								.then(function (user) {
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
								.catch(function (e) {
									reject();
								});
						}
						else {
							return reject();
						}
					});
				},
				findByToken: function (token) {
					return new Promise(function (resolve, reject) {
						try {
							var verifiedToken = jwt.verify(token, 'qwerty098');
							var decryptedTokenBytes = cryptojs.AES.decrypt(verifiedToken.token, 'abc123!"£$');
							var decryptedToken = JSON.parse(decryptedTokenBytes.toString(cryptojs.enc.Utf8));
							User.findById(decryptedToken.id)
								.then(function (user) {
									if (user) {
										resolve(user);
									}
									else {
										reject();
									}
								})
						}
						catch (e) {
							return reject(e);
						}
					});
				}
			},
			instanceMethods: {
				toPublicJSON: function () {
					var json = this.toJSON();
					return _.pick(json, 'id', 'email', 'createdAt', 'updatedAt');
				},
				generateToken: function (type) {
					if (!_.isString(type)) {
						return undefined;
					}
					try {
						var stringData = JSON.stringify({ id: this.get('id'), type: type });
						var encryptedData = cryptojs.AES.encrypt(stringData, 'abc123!"£$').toString();
						var token = jwt.sign({
							token: encryptedData
						}, 'qwerty098');
						return token;
					} catch (e) {
						return undefined;
					}
				}
			}
		});
	return User;
};