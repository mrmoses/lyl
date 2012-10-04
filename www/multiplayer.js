function Client(socket) {
	var id = 'socket id';
}

exports.init = function(app) {
	/* Multiplayer Dragons be here */
	var player1 = '';
	var player2 = '';
	var entities = {}; // the entities in the game
	var clients = {}; //all the connected clients
	
	/* */
	io = require('socket.io').listen(app);
	io.set('log level', 1);
	io.sockets.on('connection', function (socket) {
		this.clientId = socket.id;
		clients[this.clientId] = socket;
		
		console.log("added " + this.clientId + " to clients");
		io.sockets.emit('admin-new-socket', {id: socket.id});
		
		// sends message to client to let them know they are connected
		socket.emit('clientlog', {msg:"sockets are socketized"});
		
		socket.on('user-connect', function(data) {
			this.clientId = data.id;
			//if player 1 is available
			if(!player1 || this.clientId == player1) {
				player1 = this.clientId;
				io.sockets.emit('adminlog', {msg: "player 1 connected " + player1});
				
		  		// add the player to the entites
				entities[this.clientId] = {
					id: player1,
					type:'player',
					x:100,
					y:100
				};
				
				//spawn this on already connected screens
		  		socket.broadcast.emit('spawn-remote-player', entities[this.clientId]);
				
			//else if player 2 is available
			} else if (!player2 || this.clientId == player2) {
				player2 = this.clientId;
				io.sockets.emit('adminlog', {msg: "player 2 connected " + player2});
				
				// add the player to the entites
				entities[this.clientId] = {
					id: player2,
					type:'player',
					x:1024-100,
					y:768-100
				};
				
				//spawn this on already connected screens
		  		socket.broadcast.emit('spawn-remote-player', entities[this.clientId]);
				
			//otherwise they are just a viewer
			} else {
				io.sockets.emit('adminlog', {msg: "viewer connected"});
				socket.emit('init-spectator');
			}
			
			//spawn all available entities
			for(id in entities) {
				//if this is the active player
				if(id == this.clientId) {		
					socket.emit('spawn-active-player', entities[id]);
				} else {
					socket.emit('spawn-remote-player', entities[id]);
				}
			}	
		});
	
		// when a entity is updated on an active client, send data to other clients
	  	socket.on('entity-server-update', function (data) {
	  		entities[data.id] = data;
	  		socket.broadcast.emit('entity-client-update', data);
	  	});
	
	
	    socket.on('lemmingexplosion', function (data) {
	        socket.broadcast.emit('spawn-lemming-explosion', data);
	    });
	
	
		// when a entity is updated on an active client, send data to other clients
	  	socket.on('game-win', function (data) {
	  		//kill all entities
	    	for(var id in entities) {
	    		io.sockets.emit('entity-kill', entities[id]);
	    	}
	  		
	  		if(data.id == player1) {
				io.sockets.emit('adminlog', {msg: "player 1 won"});
		  		clients[player2].emit('game-lost');
		  		clients[player2].disconnect();
	  		} else {
				io.sockets.emit('adminlog', {msg: "player 2 won"});
		  		clients[player1].emit('game-lost');
		  		clients[player1].disconnect();
	  		}
	    	
	    	socket.emit('game-won');
	    	socket.disconnect();
	    	
			io.sockets.emit('game-over');
	
	  		delete clients[player1];
	  		delete clients[player2];
	    	player1 = false;
	    	player2 = false;
	    	entities = {};
	  	});
	
		// when a entity is updated on an active client, send data to other clients
	  	socket.on('lemmegeddon', function () {
	    	//kill all entities
	    	for(var id in entities) {
	    		io.sockets.emit('entity-kill', entities[id]);
	    	}
	    	player1 = false;
	    	player2 = false;
	    	entities = {};
			io.sockets.emit('adminlog', {msg: "All are dead. Hope you're happy."});
			io.sockets.emit('lemmegeddon', entities[id]);
	  	});
	
		// when a entity is updated on an active client, send data to other clients
	  	socket.on('admin-close', function (data) {
	  		clients[data.id].disconnect();
	  		delete clients[data.id]
	  	});
	
	  	socket.on('admin-connect', function (data, fn) {
			io.sockets.emit('adminlog', {msg: "admin connect"});
			var data = {};
			for(id in clients) {
				data[id] = id;
			}
			fn(data);
	  	});
		
		/* when a client disconnects */
	  	socket.on('disconnect', function () {
			io.sockets.emit('admin-closed-socket', {id: socket.id});
			
			//io.sockets.emit('user disconnected');
	  		if(socket.id == player1) {
	  			io.sockets.emit('adminlog', {msg: "player 1 disconnected"});
				io.sockets.emit('entity-kill', entities[id]);
	  			delete entities[player1];
	  			player1 = false;
	  		} else if(socket.id == player2) {
	  			io.sockets.emit('adminlog', {msg: "player 2 disconnected"});
				io.sockets.emit('entity-kill', entities[id]);
	  			delete entities[player2];
	  			player2 = false;
	  		} else {
				io.sockets.emit('adminlog', {msg: "viewer disconnected"});
	  		}
	  	});
	});
	
}