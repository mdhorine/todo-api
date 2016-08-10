var express = require('express');
var app = express();

var _ = require('underscore');

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

var PORT = process.env.PORT || 3000;

var todos = [];
var todoNextId = 1;

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

// GET /todos

app.get('/todos', function(req, res) {
	res.json(todos);
});

// GET /todos/:id

app.get('/todos/:id', function(req, res) {
	var id = parseInt(req.params.id);

	var matchedTodo = _.findWhere(todos, {id: id});

	if (matchedTodo) {
		res.json(matchedTodo);
	}
	else {
		res.status(404).send('Id not found.');
	}
});

// POST /todos

app.post('/todos', jsonParser, function(req, res) {

	var description = req.body.description.trim();
	var completed = req.body.completed;

	if (!_.isString(description) || !_.isBoolean(completed)) {
		res.status(400).send('Invalid request.');
	}
	
	var todo = {
		id: todoNextId,
		description: description,
		completed: completed
	};

	todos.push(todo);
	todoNextId++;

	res.send('Thanks for your submission.');
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

app.listen(PORT, function() {
	console.log('Express listening on port ' + PORT + '!');
});