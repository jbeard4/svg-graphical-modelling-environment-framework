define(function(){
	function setupHighlightable(e){

		e.behaviours = e.behaviours || {};

		e.behaviours.HIGHLIGHTABLE = "true";

		//expose the interface
		e.setHighlight = function(){
			$(e).addClass("highlighted");
		}

		e.unsetHighlight = function(){
			$(e).removeClass("highlighted");
		}
		
	}

	return setupHighlightable;
});
