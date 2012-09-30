/**
 * Master server controller for Canvas Prime to run on NodeJS.
 * @author Joe Moses, Ash Blue
 * @todo Create a method to combine all the engine files and return them dynamically
 * @todo Break logic up into smaller files?
 * @todo Change file name requests to proper names '.json' instead of '.php' files
 */
var SELF = null;

/** @type {number} Port to run the application from */
// HEROKU
//var PORT = process.env.PORT || 5000;
// dotcloud
var PORT = process.env.PORT || 8080;

/** @type {object} Loads in file helper script for combining files */
var _files = require('./compiler/helpers/files.js').files;

/** @type {string} Folder to build from */
var _jsRoot = 'js/';

/** @type {array} Order to load and compile items */
var _jsBuildOrder = [
    _jsRoot + 'depen',
    _jsRoot + 'engine'
];

/**
 * @todo general cleanup of methods
 * @todo use of private vars
 */
var server = {
    // Retrieve necessary node components
    fs: require('fs'),
    http: require('http'),
    express: require('express'),
    compiler: require('./compiler/controller.js').compiler,

    /**
     * Creates the server with basic settings
     * @returns {undefined}
     */
    init: function () {
        SELF = this;
        
        //updated according to https://github.com/visionmedia/express/wiki/Migrating-from-2.x-to-3.x
        this.app = this.express();
		
        this
            .setFolders()
            .setReturnJSON('images', ['.jpg', '.png', '.gif'], '/include/image-files.php')
            .getAudio('audio', '/include/sound-files.php');

        this.server = this.http.createServer(this.app).listen(PORT);
        console.log('listening on ' + PORT);
        
        this.app.get('/reset', function (req, res) {
        	console.log('reseting server');
        	player1 = false;
        	player2 = false;
        	entities = {};
        	res.send('ohai');
        });

        return this.server;
    },

    /**
     * Create static folders
     * @link http://expressjs.com/api.html#app.configure
     * @todo Looks like the first parameter can be removed from server.use
     * @returns {self}
     * @example NODE_EVN=production node server.js
     */
    setFolders: function () {
        // Activates production mode so you can demo the compiled code
        this.app.configure('production', function () {
            console.log('production');

            SELF.app.get('/js/all.js', function (req, res) {
                var compiledJS = SELF.compiler.createJS();
                res.header('Content-Type', 'application/javascript');
                res.send(compiledJS);
            });

            SELF.app.get('/', function (req, res) {
                var compiledHTML = SELF.compiler.createIndex();
                res.header('Content-Type', 'text/html');
                res.send(compiledHTML);
            });
        });

        // Settings will be overriden by production if activated
        this.app.configure(function () {
            SELF.app.use('/style', SELF.express.static(__dirname + '/style'));
            SELF.app.use('/js', SELF.express.static(__dirname + '/js'));
            SELF.app.use('/images', SELF.express.static(__dirname + '/images'));
            SELF.app.use('/audio', SELF.express.static(__dirname + '/audio'));
            SELF.setCombinedJS('js/engine', '/js/engine/all.js');
            SELF.setRoot('index.html');
        });

        return this;
    },

    /**
     * Specified file to return on root request
     * @todo Is there a more effecient way to do this?
     */
    /**  */
    setRoot: function (file) {
        this.app.get('/', function (req, res) {
            res.sendfile(file);
        });

        return this;
    },

    /**
     * Test to discover if the needle(s) are present inside
     * a string.
     * @param {string} haystack String you want to search
     * @param {string} needle Item you're looking for in the haystack
     * @returns {boolean} True upon discovery, false upon failure.
     */
    getString: function (haystack, needle) {
        if (Array.isArray(needle)) {
            needle.forEach(function (value) {
                if (haystack.indexOf(value) !== 1) {
                    return true;
                }
            });
        } else if (typeof needle === 'string') {
            return haystack.indexOf(needle) !== -1;
        }

        return false;
    },

    /**
     * Dynamically combines and returns a JavaScript file when requested.
     * @param folder {string} Location of the JavaScript files
     * @param request {string} Request such as 'engine.js' to the server
     * @returns {self}
     */
    setCombinedJS: function (folder, request) {
        // Retrieve all files
        var fileContents = this.fs.readdirSync(folder),
            filteredContents = [];

        // Verify file data is what you requested
        fileContents.forEach(function (value) {
            if (SELF.getString(value, '.js')) {
                filteredContents.push(value);
            }
        });

        //console.log(filteredContents);
        this.app.get(request, function (req, res) {
            var compiledJS = _files.getCombinedFiles(_jsBuildOrder, ['js']);
            //var compiledJS = '';
            //
            //filteredContents.forEach(function (value) {
            //    compiledJS += SELF.fs.readFileSync(folder + '/' + value);
            //});

            res.header('Content-Type', 'application/javascript');
            res.send(compiledJS);
        });

        return this;
    },

    /**
     * Retrieve all specific file contents from a specified folder when a particular
     * request is made to the server.
     * @param {string} folder Folder location to search
     * @param {string|array} type Extension to search for such as .jpg
     * @param {string} request URL request string such as 'image-files.php'
     * @returns {self}
     */
    setReturnJSON: function (folder, type, request) {
        // Retrieve all files
        var fileContents = this.fs.readdirSync(folder),
            filteredContents = [];

        // Verify file data is what you requested
        fileContents.forEach(function (value) {
            if (SELF.getString(value, type)) {
                filteredContents.push(value);
            }
        });

        // Send back remaining data as JSON
        filteredContents = JSON.stringify(filteredContents);
        this.app.get(request, function (req, res) {
            res.header('Content-Type', 'text/html');
            res.send(filteredContents);
        });

        return this;
    },

    /**
     * Retrieve all specific audio file contents from a specified folder.
     * @param {string} folder Folder location to search
     * @param {string} request URL request string such as 'audio-files.php'
     * @returns {self}
     */
    getAudio: function (folder, request) {
        var fileContents = this.fs.readdirSync(folder),
            audioFiles = [];

        fileContents.forEach(function (value) {
            if (SELF.getString(value, '.ogg')) {
                audioFiles.push(value.replace('.ogg', ''));
            }
        });

        // Send back audio files as JSON
        audioFiles = JSON.stringify(audioFiles);
        this.app.get(request, function (req, res) {
            res.header('Content-Type', 'text/html');
            res.send(audioFiles);
        });

        return this;
    }
};

var app = server.init();

/* Multiplayer Dragons be here */
var player1 = '';
var player2 = '';
var entities = {};

/* */
io = require('socket.io').listen(app);
io.set('log level', 1);
io.sockets.on('connection', function (socket) {
	this.clientId = socket.id;
	
	// sends message to client to let them know they are connected
	socket.emit('clientlog', {msg:"sockets are socketized"});
	
	//if player 1 is available
	if(!player1 || this.clientId == player1) {
		console.log("player 1 connected");
		player1 = this.clientId;
		
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
		console.log("player 2 connected");
		player2 = socket.id;
		
		// add the player to the entites
		entities[this.clientId] = {
			id: player2,
			type:'player',
			x:300,
			y:300
		};
		
		//spawn this on already connected screens
  		socket.broadcast.emit('spawn-remote-player', entities[this.clientId]);
		
	//otherwise they are just a viewer
	} else {
		console.log("viewer connected");
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

	// when a entity is updated on an active client, send data to other clients
  	socket.on('entity-server-update', function (data) {
  		entities[data.id] = data;
  		socket.broadcast.emit('entity-client-update', data);
  	});
	
	/* when a client disconnects */
  	socket.on('disconnect', function () {
		//io.sockets.emit('user disconnected');
  		if(socket.id == player1) {
  			console.log("player 1 disconnected");
  			delete entities[player1];
  			player1 = false;
  		}
  		if(socket.id == player2) {
  			console.log("player 2 disconnected");
  			delete entities[player2];
  			player2 = false;
  		}
  	});
});
/* */