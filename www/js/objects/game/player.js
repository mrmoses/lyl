/**
 * @requires 'models/.js'
 */
(function(cp) {
    /** @type {number} Cached reference of game's play area */
    var _gameWidth = null;

    /** @type {number} Cached reference of game's play area */
    var _gameHeight = null;

    var _deltaSlow = 1/30;

    var _playerSize = 5;

    var _debug = false;

    var _private = {
        calcMag: function (obj) {
            var speedCalc = obj.speedX * obj.speedX + obj.speedY * obj.speedY;
            speedCalc = Math.sqrt(speedCalc);
            return cp.math.round(speedCalc);
        }
    };

    var _enemy = null;

    cp.template.Player = cp.template.Entity.extend({
    	type: 'a',
        name: 'player', // Do not remove, used for search functionality elsewhere

        width: 80,
        height: 80,
        color: '#00f',
        mass: 3,

        angle: 0,

        collisionTimer: 0,
        timerDuration: 100,
        collided: false,

        speedX: 0,
        speedY: 0,
        magnitude: 0,
        accelRate: 0.2,
        maxSpeed: 15,
        minSpeed: -15,
        decaySpeed: 10,

        turnRate: 0.025,
        turnLeft: false,
        turnRight: false,

        inCollision: false,

        init: function (serverID, x, y) {
            if (_gameWidth === null) {
                _gameWidth = cp.core.canvasWidth;
            }
            if (_gameHeight  === null) {
                _gameHeight = cp.core.canvasHeight;
            }

            this.deltaSlow = cp.math.round(this.deltaSlow);
            this.x = x
            this.y = y;

            // Set boundaries
            this.boundaryRight = _gameWidth - this.width;
            this.boundaryBottom = _gameHeight - this.height;

            // Set ID
            this.id = serverID;

            var animSheet = new cp.animate.sheet('ball.png', 80, 80);
            this.animPlayer = new cp.animate.cycle(animSheet, 1, [0]);
            this.animSet = this.animPlayer;
        },

        /**
         * @todo The keyboard input for directions really needs to be optimized
         */
        update: function () {

            if(this.collided == true)
            {
                this.collisionTimer = this.collisionTimer - cp.core.delta;
                if(this.collisionTimer <= 0) {
                    this.collided = false;
                    this.collisionTimer = 0;
                }
            }

        	var speedXAbs = (this.speedX > 0) ? this.speedX : this.speedX * -1;
        	var speedYAbs = (this.speedY > 0) ? this.speedY : this.speedY * -1;
        	var speedAbs =  speedXAbs + speedYAbs;
        	if(speedAbs == 0) {
        		this.angle = 0;
        	} else if (speedAbs < 6) {
            	this.angle += cp.core.delta * 0.1;
        	} else if (speedAbs < 10) {
            	this.angle += cp.core.delta * 0.2;
        	} else {
            	this.angle += cp.core.delta * 0.3;
        	}

            if (this.angle > 360) {
                this.angle -= 360;
            }

            this._super();

            // update our position based on our speed
            this.x = cp.math.round(this.x + this.speedX * (cp.core.delta * _deltaSlow));
            this.y = cp.math.round(this.y + this.speedY * (cp.core.delta * _deltaSlow));


			// Determine boundary collisions
			//if hitting east side
			if(this.x > this.boundaryRight - 5) {
				this.x = this.boundaryRight - 5;
			}
			//if hitting west side
			if(this.x < 5) {
				this.x = 5;
			}
			//if hitting south side
			if(this.y > this.boundaryBottom - 5) {
				this.y = this.boundaryBottom - 5;
			}
			//if hitting north side
			if(this.y < 5) {
				this.y = 5;
			}
        },

        collide: function (obj) {
            if (obj.name === 'player') {
                if(this.collided == false && obj.collided == false) {
                    this.collided = true;
                    this.collisionTimer = this.timerDuration;
                    obj.collided = true;
                    obj.collisionTimer = obj.timerDuration;
                    // Who hit who?
                    if (_private.calcMag(this) > _private.calcMag(obj)) {
                        console.log('enemy smash');
                        this.mass -= 0.25;
                        this.playerSize -= 1;
                        obj.mass += 0.25;
                        obj.playerSize += 1;

                        this.speedX = cp.math.round( -1 * obj.mass * 0.5 * this.speedX * 0.5);
                        this.speedY = cp.math.round( -1 * obj.mass * 0.5 * this.speedY * 0.5);
                        obj.speedX = cp.math.round( -1 * this.mass * 1.25 * obj.speedX * 0.5);
                        obj.speedY = cp.math.round( -1 * this.mass * 1.25 * obj.speedY * 0.5);

                        cp.game.spawn('LemmingExplosion', this.x, this.y);



                    } else {
                        console.log('player smash');
                        // Transfer Mass
                        this.mass += 0.25;
                        this.playerSize += 1;
                        obj.mass -= 0.25;
                        obj.playerSize -= 1;

                        obj.speedX = -1 * this.mass * 0.5 * obj.speedX * 0.5;
                        obj.speedY = -1 * this.mass * 0.5 * obj.speedY * 0.5;
                        this.speedX = -1 * obj.mass * 1.25 * this.speedX * 0.5;
                        this.speedY = -1 * obj.mass * 1.25 * this.speedY * 0.5;

                        cp.game.spawn('LemmingExplosion', obj.x, obj.y);
                    }

                    obj.x = cp.math.round(obj.x + obj.speedX * (cp.core.delta * _deltaSlow));
                    obj.y = cp.math.round(obj.y + obj.speedY * (cp.core.delta * _deltaSlow));
                    this.x = cp.math.round(this.x + this.speedX * (cp.core.delta * _deltaSlow));
                    this.y = cp.math.round(this.y + this.speedY * (cp.core.delta * _deltaSlow));

                    //////////
                    // MAYBE put packet sending here
                    // Send a packet that updates objs data
                    var data = {
                        id: obj.id,
                        x: obj.x,
                        y: obj.y,
                        speedX: obj.speedX,
                        speedY: obj.speedY,
                        collision: true
                    };

                    socket.emit('entity-server-update', data);
                }
            }
        },
    });

    cp.template.ActivePlayer = cp.template.Player.extend({
    	type: 'a',

    	update: function(){
    	    // Update timers


    		//// Update our input
            if (window.DeviceMotionEvent && !this.collided) {
                this.speedX = cp.math.round(Math.round(cp.input.accel.x / 10 * -1));
                this.speedY = cp.math.round(Math.round(cp.input.accel.y / 10 * -1));
            } else {
                // left
               if (cp.input.press('left')) {
                    if(this.speedX > this.minSpeed) {
                        this.speedX -= 1;
                    }
                // Right
                } if (cp.input.press('right')) {
                    if(this.speedX < this.maxSpeed) {
                        this.speedX += 1;
                    }
                // Up
                } if (cp.input.press('up')) {
                    if(this.speedY > this.minSpeed) {
                        this.speedY -= 1;
                    }
                // Down
                } if (cp.input.press('down')) {
                    if(this.speedY < this.maxSpeed) {
                        this.speedY += 1;
                    }
                }

                // Decay speed
                if((!cp.input.press('up')) && (!cp.input.press('down'))) {
                    if(this.speedY > 0) {
                        this.speedY -= 1;
                    } else if(this.speedY < 0) {
                        this.speedY += 1;
                    }
                } if(!(cp.input.press('left')) && (!cp.input.press('right'))) {
                    if(this.speedX < 0) {
                        this.speedX += 1;
                    } else if(this.speedX > 0) {
                        this.speedX -= 1;
                    }
                }
            }

			var data = {
    			id: this.id,
    			x: this.x,
    			y: this.y,
    			speedX: this.speedX,
    			speedY: this.speedY
			};

    		socket.emit('entity-server-update', data);

            this._super();
    	}
    });

    cp.template.RemotePlayer = cp.template.Player.extend({
    	type: 'b',
        color: '#f00',

        init: function (serverID, x, y) {
            this._super(serverID, x, y);
            var animSheet = new cp.animate.sheet('ball-alt.png', 80, 80);
            this.animEnemy = new cp.animate.cycle(animSheet, 1, [0]);
            this.animSet = this.animEnemy;
        },

        collide: function() {}
    });

}(cp));