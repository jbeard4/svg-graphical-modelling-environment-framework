/**
* Copyright (C) 2011 Jacob Beard
* Released under GNU GPL, read the file 'COPYING' for more information
**/
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

