/**
 * @requires 'models/.js'
 */
(function(cp) {
    /** @type {number} Cached reference of game's play area */
    var _gameWidth = null;
    /** @type {number} Cached reference of game's play area */
    var _gameHeight = null;
    
    cp.template.Player = cp.template.Entity.extend({        
        player: true, // Do not remove, used for search functionality elsewhere

        width: 20,
        height: 20,
        color: '#f0f',
        
        angle: 0,
        
        speed: 0,
        accelRate: 0.2,
        maxSpeed: 5,
        
        turnRate: 0.025,
        turnLeft: false,
        turnRight: false,
        
        
        init: function (x, y) {
            if (_gameWidth === null) {
                _gameWidth = cp.core.canvasWidth;
            }
            if (_gameHeight  === null) {
                _gameHeight = cp.core.canvasHeight;
            }

            // Set player's position manually
            if (x !== undefined) {
                this.x = x;
                this.y = y;
            } else { // Center the player by default
                this.x = (_gameWidth / 2) - (this.width / 2);
                this.y = (_gameHeight / 2) - (this.height / 2);
            }

            // Set boundaries
            this.boundaryRight = _gameWidth - this.width;
            this.boundaryBottom = _gameHeight - this.height;
        },
        
        draw: function() {
	        cp.ctx.fillStyle = this.color;
	        cp.ctx.fillRect(this.x, this.y, this.width, this.height);
	        return;
	        
            this._super();
            
            cp.ctx.save(); //save the current draw state
	
			//set drawing area to where the tank is
			cp.ctx.translate(this.x,this.y);
	
			//rotate drawing area
			cp.ctx.rotate(this.angle);
	
			//set the color to the color of the body of the tank
			cp.ctx.fillStyle = this.color;"rgb(255,0,255)"; //white		
			//draw rectangle (main body)
	        cp.ctx.fillRect(-this.length/2,-this.width/2,this.length,this.width);
	
	
			//set color to grey
			cp.ctx.fillStyle = this.color;		
			//draw rectangle (front)
	        cp.ctx.fillRect(0,-this.width/3,this.length/2,this.width*2/3);
	
			cp.ctx.restore(); //restore the previous draw state
        },

        /**
         * @todo The keyboard input for directions really needs to be optimized
         */
        update: function () {
            this._super();

            // left
            if (cp.input.press('left')) {
				this.turnLeft();
				
            // Right
            } else if (cp.input.press('right')) {
				this.turnRight();
                
            // Up
            } else if (cp.input.press('up')) {
            	/* use accelleration */
				if (this.speed < this.maxSpeed)
					this.speed += this.accelRate;
				/* */

            // Down
            } else if (cp.input.press('down') && this.y < this.boundaryBottom) {
				this.speed = 0;
            }
            
            if(cp.input.up('up')) {
            	console.log("up key released");
            	this.speed = 0;
            }
            
			// update our position based on our angle and speed
			this.x = this.x + this.speed * Math.cos(this.angle);
			this.y = this.y + this.speed * Math.sin(this.angle);

			//if hitting east side
			if(this.x > _gameWidth - 5) {
				this.x = _gameWidth - 5;
			}
			//if hitting west side
			if(this.x < 5) {
				this.x = 5;
			}
			//if hitting south side
			if(this.y > _gameHeight - 5) {
				this.y = _gameHeight - 5;
			}
			//if hitting north side
			if(this.y < 5) {
				this.y = 5;
			}
        },

		turnLeft: function() {
			this.turn(-1);
		},
	
		turnRight: function() {
			this.turn(1);
		},

		turn: function(direction) {
			this.angle = (this.angle + direction * this.turnRate) % (2 * Math.PI);
		},

        collide: function () {
            this.hit = true;
            this.kill();
            ++this.deathCount;
        },

        kill: function () {
            // Increment deaths stat, id - 6
            cp.stats.incrementData(6);

            cp.game.spawn('Continue', this);
            this._super();
        }
    });
}(cp));