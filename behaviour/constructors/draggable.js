/**
* Copyright (C) 2011 Jacob Beard
* Released under GNU GPL, read the file 'COPYING' for more information
**/
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
