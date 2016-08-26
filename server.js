var express = require('express');
var app = express();

var _ = require('underscore');

var db = require('./db.js');

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

var PORT = process.env.PORT || 3000;

var todos = [];
var todoNextId = 1;

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

// GET /todos (params: completed)

app.get('/todos', function(req, res) {
	var filter = req.query.completed;
	var q = req.query.q;
	var filteredTodos = todos;

	if (filter == "true") {
		filteredTodos = _.filter(todos, function(todo) {
			return todo.completed === true;
		});
	}
	else if (filter == "false") {
		filteredTodos = _.filter(todos, function(todo) {
			return todo.completed === false;
		});
	}

	if (q) {
		filteredTodos = _.filter(filteredTodos, function(todo) {
			if (todo.description.toLowerCase().indexOf(q.toLowerCase()) > -1) {
				return true;
			};
		});
	};

	res.json(filteredTodos);
});

// GET /todos/:id

app.get('/todos/:id', function(req, res) {
	var id = parseInt(req.params.id);

	db.Todo
		.findOne({
			where: {
				id: id
			}
		})
		.then(function(todo) {
			if(!!todo) {
				res.status(200).json(todo.toJSON());
			}
			else {
				res.status(404).send('Item not found');
			}
		})
		.catch(function(e) {
			res.status(400).json(e);
		});
});

// POST /todos

app.post('/todos', jsonParser, function(req, res) {

	var body = _.pick(req.body, 'description', 'completed');

	db.Todo
		.create({
			description: body.description.trim(),
			completed: body.completed
		})
		.then(function(todo) {
			res.status(200).json(todo);
		})
		.catch(function(e) {
			res.status(400).json(e);
		});
});

// PUT /todos/:id

app.put('/todos/:id', jsonParser, function(req, res) {
	var id = parseInt(req.params.id);
	var matchedTodo = _.findWhere(todos, {id: id});

	var body = _.pick(req.body, 'description', 'completed');
	var validAttributes = {};

	if (!matchedTodo)  {
		return res.status(404).send('Id not found');
	}

	if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
		validAttributes.completed = body.completed;
	}
	else if (body.hasOwnProperty('completed')) {
		return res.status(400).send('Invalid request.');
	}

	if (body.hasOwnProperty('description') && _.isString(body.description) && 
		body.description.trim().length > 0) {
		validAttributes.description = body.description.trim();
	}
	else if (body.hasOwnProperty('description')) {
		return res.status(400).send('Invalid request.');
	}

	_.extend(matchedTodo, validAttributes);

	res.json(validAttributes);
});


// DELETE /todos/:id

app.delete('/todos/:id', function(req, res) {
	var id = parseInt(req.params.id);

	var matchedTodo = _.findWhere(todos, {id: id});

	if (matchedTodo) {
		todos = _.without(todos, matchedTodo);
		res.json(matchedTodo);
	}
	else {
		res.status(404).send('Id not found.');
	}
});

db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
	console.log('Express listening on port ' + PORT + '!');
	});
});

