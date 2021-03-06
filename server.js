var express = require('express');
var app = express();

var bcrypt = require('bcrypt');

var _ = require('underscore');

var db = require('./db.js');

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var middleware = require('./middleware.js')(db);

var PORT = process.env.PORT || 3000;

var todos = [];
var todoNextId = 1;

app.get('/', function (req, res) {
	res.send('Todo API Root');
});

// GET /todos (params: completed)

app.get('/todos', middleware.requireAuthentication, function (req, res) {
	var query = req.query;
	var where = {};
	where.userId = req.user.id;

	if (query.hasOwnProperty('completed')) {
		if (query.completed === 'true') {
			where.completed = true;
		}
		else if (query.completed === 'false') {
			where.completed = false;
		}
	}

	if (query.hasOwnProperty('q') && query.q.length > 0) {
		where.description = {
			$like: '%' + query.q + '%'
		};
	}

	db.Todo.findAll({
		where: where
	})
		.then(function (todos) {
			if (todos.length > 0) {
				res.status(200).json(todos);
			}
			else {
				res.status(404).send('No matching results');
			}
		})
		.catch(function (e) {
			res.status(400).json(e);
		});
});

// GET /todos/:id

app.get('/todos/:id', middleware.requireAuthentication, function (req, res) {
	var id = parseInt(req.params.id);

	db.Todo
		.findById(id)
		.then(function (todo) {
			if (!!todo) {
				if (todo.get('userId') === req.user.id) {
					res.status(200).json(todo.toJSON());
				}
				else {
					res.status(401).send();
				}
			}
			else {
				res.status(404).send('Item not found');
			}
		})
		.catch(function (e) {
			res.status(400).json(e);
		});
});

// POST /todos

app.post('/todos', middleware.requireAuthentication, jsonParser, function (req, res) {

	var body = _.pick(req.body, 'description', 'completed');

	db.Todo
		.create({
			description: body.description.trim(),
			completed: body.completed,
			userId: req.user.id
		})
		.then(function (todo) {
			res.status(200).json(todo);
		})
		.catch(function (e) {
			res.status(400).json(e);
		});
});

// PUT /todos/:id

app.put('/todos/:id', middleware.requireAuthentication, jsonParser, function (req, res) {
	var id = parseInt(req.params.id);

	var body = _.pick(req.body, 'description', 'completed');
	var attributes = {};

	if (body.hasOwnProperty('completed')) {
		attributes.completed = body.completed;
	}

	if (body.hasOwnProperty('description')) {
		attributes.description = body.description.trim();
	}

	// lookup row, update attributes, save row

	db.Todo
		.findById(id)
		.then(function (todo) {
			if (todo) {
				if(todo.get('userId') === req.user.id) {
					todo.update(attributes)
						.then(function (todo) {
							res.status(200).json(todo.toJSON());
						}, function (e) {
							res.status(400).json(e);
						});
				}
				else {
					res.status(401).send('Unauthorized');
				}
			}
			else {
				res.status(404).send('Item not found');
			}
		}, function (e) {
			res.status(500).json(e);
		});
});


// DELETE /todos/:id

app.delete('/todos/:id', middleware.requireAuthentication, function (req, res) {
	var id = parseInt(req.params.id);

	db.Todo
		.destroy({
			where: {
				id: id,
				userId: req.user.id
			}
		})
		.then(function (num) {
			if (num > 0) {
				res.status(200).send(num + ' record(s) deleted.');
			}
			else {
				res.status(404).send('Id not found or user not authorized.');
			}
		})
		.catch(function (e) {
			res.status(400).json(e);
		});
});

// POST /users

app.post('/users', jsonParser, function (req, res) {
	var body = _.pick(req.body, 'email', 'password');

	db.User
		.create({
			email: body.email.trim(),
			password: body.password.trim()
		})
		.then(function (todo) {
			res.status(200).json(todo.toPublicJSON());
		})
		.catch(function (e) {
			res.status(400).json(e);
		});
});

// POST /users/login

app.post('/users/login', jsonParser, function (req, res) {
	var body = _.pick(req.body, 'email', 'password');

	db.User.authenticate(body)
		.then(function (user) {
			var token = user.generateToken('authentication');
			if (token) {
				res.status(200).header('Auth', token).json(user.toPublicJSON());
			}
			else {
				res.status(401).send();
			}
		}, function () {
			res.status(401).send();
		});
});


db.sequelize.sync({ force: true }).then(function () {
	app.listen(PORT, function () {
		console.log('Express listening on port ' + PORT + '!');
	});
});

