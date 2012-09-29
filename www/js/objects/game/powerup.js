/**
 * @requires 'models/.js'
 */
(function(cp) {
    /**
     * @todo Get it to work on enemies and players
     */
    cp.template.Powerup = cp.template.Entity.extend({
    	type: 'b',

        init: function (x, y) {
            this.x = x;
            this.y = y;
        },

    	update: function () {},

        //draw: function () {
        //
        //},

        collide: function () {
            console.log('pickup');
        }
    });

}(cp));