define(
	function(){
		return function(env,arrowTargetElement){
			this.behaviours = this.behaviours || {};

			this.arrowTargetElement = arrowTargetElement || this;

			this.behaviours.ARROW_TARGET = true;

			$(this).addClass("arrow-target");

			env.hookElementEventsToStatechart(this,["mouseover","mouseout"],true);
		};
	}
);

