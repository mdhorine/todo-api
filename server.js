var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;
var todos = [{
	id: 1,
	description: "Take money to Rebecca",
	completed: false
}, {
	id: 2,
	description: "Meeting with Sidharth",
	completed: true
}, {
	id: 3,
	description: "Meeting with Anne",
	completed: false
}];

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

// GET todos

app.get('/todos', function(req, res) {
	res.json(todos);
});

// GET todos/:id

app.get('/todos/:id', function(req, res) {
	var id = req.params.id;

	var todo = function(id) {
		for (var i=0; i<todos.length; i++) {
			if (todos[i].id == id) {
				return todos[i];
			}
		}
		res.status(404).send('Id not found.')
	}

	res.json(todo(id));
});

app.listen(PORT, function() {
	console.log('Express listening on port ' + PORT + '!');
});