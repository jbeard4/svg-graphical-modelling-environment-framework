/**
* Copyright (C) 2011 Jacob Beard
* Released under GNU GPL, read the file 'COPYING' for more information
**/
define(function(){
	function setupHighlightable(e){

		e.behaviours = e.behaviours || {};

		e.behaviours.HIGHLIGHTABLE = "true";

		$(e).addClass("highlightable");

		//expose the interface
		e.setHighlight = function(){
			$(e).addClass("highlighted");
		};

		e.unsetHighlight = function(){
			$(e).removeClass("highlighted");
		};
		
	}

	return setupHighlightable;
});
