define(
	function(){
		return function(env){
			this.behaviours = this.behaviours || {};

			this.behaviours.ARROW_TARGET = true;

			$(this).addClass("arrow-target");

			env.hookElementEventsToStatechart(this,["mouseover","mouseout"],true);
		};
	}
);

