define(
	function(){
		return function(env){
			this.behaviours = this.behaviours || {};

			this.behaviours.DRAGGABLE = true;

			$(this).addClass("draggable");

			env.hookElementEventsToStatechart(this,["mousedown","mousemove","mouseup"],true);
		};
	}
);
