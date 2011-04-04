define(
	function(){
		return function(env){
			this.behaviours = this.behaviours || {};

			this.behaviours.ARROW_SOURCE = true;

			$(this).addClass("arrow-source");

			env.hookElementEventsToStatechart(this,["mousedown"],true);
		};
	}
);
