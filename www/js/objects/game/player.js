/**
 * @requires 'models/.js'
 */
(function(cp) {
    /** @type {number} Cached reference of game's play area */
    var _gameWidth = null;

    /** @type {number} Cached reference of game's play area */
    var _gameHeight = null;

    var _deltaSlow = 1/30;

    var _debug = false;

    var _defSize = 120;

    var _defHP = 10;

    var _minHP = 3;

    var _maxHP = 17;
    var _gameOver = {
        xMin: 453,
        xMax: 553,
        yMin: 336,
        yMax: 436,
    }

    var _private = {
        calcMag: function (obj) {
            var speedCalc = obj.speedX * obj.speedX + obj.speedY * obj.speedY;
            speedCalc = Math.sqrt(speedCalc);
            return cp.math.round(speedCalc);
        },

        setSize: function (obj) {
            if (obj.hp > _maxHP) {
                obj.hp = _maxHP;
            } else if (obj.hp < _minHP) {
                obj.hp = _minHP;
                canWin = true;
            } else {
                canWin = false;
                obj.width = obj.height = (obj.hp / _defHP) * _defSize;
            }
        },

        checkMiddle: function (obj) {
            if(obj.hp <= _minHP+1){
                if(obj.x < _gameOver.xMax && obj.x > _gameOver.xMin) {
                    if(obj.y < _gameOver.yMax && obj.x > _gameOver.yMin) {
                        // Win Stuff
                        // CALL ARMEGEDDON
                        socket.emit("game-win", {id:obj.id});
                        // Play audio message
                        cp.audio.play('oh-yeah-high');
                    }
                }  
            }

        }
    };

    var _enemy = null;

    cp.template.Player = cp.template.Entity.extend({
    	type: 'a',
        name: 'player', // Do not remove, used for search functionality elsewhere

        width: _defSize,
        height: _defSize,
        color: '#00f',
        mass: 3,

        angle: 0,

        collisionTimer: 0,
        timerDuration: 100,
        collided: false,
        canWin: false,

        speedX: 0,
        speedY: 0,
        accelRate: 0.2,
        maxSpeed: 15,
        minSpeed: -15,
        decaySpeed: 10,
        hp: _defHP,

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

            // Set image
            var self = this;
            this.img = new Image();
            this.img.onload = function () {
                self.imgReady = true;
            };

            if (this.type === 'a') {
                this.img.src = 'images/ball.png';
            } else {
                this.img.src = 'images/ball-alt.png';
            }
        },

        draw: function () {
            if (this.imgReady) {
                cp.ctx.save();

                // Rotation logic
                cp.ctx.translate(this.x + (this.width / 2), this.y + (this.height / 2));
                cp.ctx.rotate(Math.PI / 180 * this.angle);
                cp.ctx.translate(-(this.x + (this.width / 2)), -(this.y + (this.height / 2)));

                // Draw the image
                cp.ctx.drawImage(this.img, this.x, this.y, this.width, this.height);

                cp.ctx.restore();
            }
        },

        /**
         * @todo The keyboard input for directions really needs to be optimized
         */
        update: function () {

            if (this.collided === true) {
                this.collisionTimer = this.collisionTimer - cp.core.delta;
                if(this.collisionTimer <= 0) {
                    this.collided = false;
                    this.collisionTimer = 0;
                }
            }

        	var speedXAbs = (this.speedX > 0) ? this.speedX : this.speedX * -1;
        	var speedYAbs = (this.speedY > 0) ? this.speedY : this.speedY * -1;
        	var speedAbs =  speedXAbs + speedYAbs;

            if (speedAbs < 6) {
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

            _private.checkMiddle(this);
                
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
                if(this.collided === false && obj.collided === false) {
                    this.collided = true;
                    this.collisionTimer = this.timerDuration;
                    obj.collided = true;
                    obj.collisionTimer = obj.timerDuration;
                    // Who hit who?
                    if (_private.calcMag(this) > _private.calcMag(obj)) {
                        console.log('enemy smash');
                        this.mass -= 0.25;
                        this.hp -= 1;
                        obj.mass += 0.25;
                        obj.hp += 1;

                        this.speedX = cp.math.round( -1 * obj.mass * 0.5 * this.speedX * 0.5);
                        this.speedY = cp.math.round( -1 * obj.mass * 0.5 * this.speedY * 0.5);
                        obj.speedX = cp.math.round( -1 * this.mass * 1.25 * obj.speedX * 0.5);
                        obj.speedY = cp.math.round( -1 * this.mass * 1.25 * obj.speedY * 0.5);

                        cp.game.spawn('LemmingExplosion', this.x, this.y);

                    } else {
                        console.log('player smash');
                        // Transfer Mass
                        this.mass += 0.25;
                        this.hp += 1;
                        obj.mass -= 0.25;
                        obj.hp -= 1;

                        obj.speedX = cp.math.round( -1 * this.mass * 0.5 * obj.speedX * 0.5);
                        obj.speedY = cp.math.round( -1 * this.mass * 0.5 * obj.speedY * 0.5);
                        this.speedX = cp.math.round( -1 * obj.mass * 1.25 * this.speedX * 0.5);
                        this.speedY = cp.math.round( -1 * obj.mass * 1.25 * this.speedY * 0.5);

                        cp.game.spawn('LemmingExplosion', obj.x, obj.y);
                    }

                    cp.audio.play('collide');
                    obj.x = cp.math.round(obj.x + obj.speedX * (cp.core.delta * _deltaSlow));
                    obj.y = cp.math.round(obj.y + obj.speedY * (cp.core.delta * _deltaSlow));
                    this.x = cp.math.round(this.x + this.speedX * (cp.core.delta * _deltaSlow));
                    this.y = cp.math.round(this.y + this.speedY * (cp.core.delta * _deltaSlow));

                    _private.setSize(this);
                    _private.setSize(obj);
                }
            }
        }
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
    			speedY: this.speedY,
    			//mass: this.mass,
    			//hp: ti
    			
			};

    		socket.emit('entity-server-update', data);

            this._super();
    	}
    });

    cp.template.RemotePlayer = cp.template.Player.extend({
    	type: 'b',
        color: '#f00',

        collide: function() {}
    });

}(cp));