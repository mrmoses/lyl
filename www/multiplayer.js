var _io = require('socket.io'), io;
var player1 = '';
var player2 = '';

var entities = {}; // the entities in the game
var clients = {}; //all the connected clients

var players = {};
var playerCount = 0;
var maxPlayers = 3;

var gameWidth = 1024;
var gameHeight = 768;

function Client(socket) {
	var id = socket.id;
	clients[id] = {
		socket: socket
	}
	console.log("client connected " + socket.id);
	
	// sends message to client to let them know they are connected
	socket.emit('clientlog', {msg:"sockets are socketized"});
	
	socket.on('user-connect', function(data, fn) {	
		if(playerCount < maxPlayers) {
			console.log("player detected " + data.id);
			clients[data.id].type = 'player';
			players[data.id] = data.id;
			playerCount++;
			
			entities[data.id] = {
				id: data.id,
				x: 100 * playerCount,
				y: 100 * playerCount,
			}
			
			//spawn this remote player
	  		socket.broadcast.emit('spawn-remote-player', entities[data.id]);
		} else {
			console.log("viewer detected " + data.id);
			clients[data.id].type = 'viewer';
			
			socket.emit('init-spectator');
		}
		
		//let the client know what they are
		fn({type: clients[data.id].type});
		
		//spawn all available entities
		for(id in entities) {
			//if this is the active player
			if(id == data.id) {
				socket.emit('spawn-active-player', entities[id]);
			} else {
				socket.emit('spawn-remote-player', entities[id]);
			}
		}
		
		io.sockets.emit('admin-new-socket', {id: data.id, type: clients[data.id].type});
		io.sockets.emit('adminlog', {msg: clients[data.id].type + " connected " + data.id});
	});

	// when a entity is updated on an active client, send data to other clients
  	socket.on('entity-server-update', function (data) {
  		//update the entities data
  		entities[data.id] = data;
  		
  		//send update to other users
  		socket.broadcast.emit('entity-client-update', entities[data.id]);
  	});

    socket.on('lemmingexplosion', function (data) {
        socket.broadcast.emit('spawn-lemming-explosion', data);
    });

	// when the game ends
  	socket.on('game-win', function (data) {
  		console.log("game over");
  		console.log(data.id + " wins");
  		
  		//kill all entities
    	for(var id in entities) {
    		io.sockets.emit('entity-kill', entities[id]);
    	}
    	entities = {};
    	
    	// show this player the game won screen
    	socket.emit('game-won');
    	socket.disconnect();
    	
    	//show game lost for all other players (game over for viewers)
		for(id in clients) {
			// if this is player
			if(players[id]) {
	  			clients[id].socket.emit('game-lost');
	  			clients[id].socket.disconnect();
			} else {
	  			clients[id].socket.emit('game-over');
	  			clients[id].socket.disconnect();
			}
		}
		clients = {};
		players = {};
    	playerCount = 0;
    	
		io.sockets.emit('adminlog', {msg: "game ended"});
  	});

	// when a entity is updated on an active client, send data to other clients
  	socket.on('lemmegeddon', function () {
    	//kill all entities
    	for(var id in entities) {
    		io.sockets.emit('entity-kill', entities[id]);
    	}
    	entities = {};
    	
    	//show all the lemmegeddon screen
		io.sockets.emit('lemmegeddon');
    	
    	//disconnect all clients  (except admins)
		for(var id in clients) {
			if(clients[id].type != 'admin') {
				clients[id].socket.disconnect();	
			}
		}
		clients = {};
		players = {};
		playerCount = 0;

		io.sockets.emit('adminlog', {msg: "All are dead. Hope you're happy."});
  	});

	// when a admin disconnects a client
  	socket.on('admin-close', function (data) {
  		console.log("admin disconected client " + data.id);
		if(clients[data.id]) {
			clients[data.id].socket.disconnect();
		}
  	});

  	socket.on('admin-connect', function (data, fn) {
		clients[socket.id].type = 'admin';
		
		io.sockets.emit('admin-new-socket', {id: socket.id, name: 'admin'});
		io.sockets.emit('adminlog', {msg: "admin connect"});
		
		var data = {};
		for(var id in clients) {
			data[id] = {id: id, type: clients[id].type};
		}
		fn(data);
  	});

	/* when a client disconnects */
  	socket.on('disconnect', function () {
  		console.log("client disconnected " + socket.id);
  		
  		// delete this everywhere it might exist
		delete clients[socket.id];
		console.log("client deleted")
		
		if(socket.id in players) {
			socket.broadcast.emit('entity-kill', {id: socket.id});
			console.log("entity killed " + socket.id);
			delete entities[socket.id];
			delete players[socket.id];
			console.log("entity deleted");
			console.log("player deleted");
			playerCount--;
			
  			io.sockets.emit('adminlog', {msg: "player disconnected"});
		}
		
		io.sockets.emit('admin-closed-socket', {id: socket.id});
  	});
}

/* Multiplayer Dragons be here */
exports.init = function(app) {
	io = _io.listen(app);
	io.set('log level', 1);
	io.sockets.on('connection', function (socket) {
		this.clientId = socket.id;
		new Client(socket);
	});	
}