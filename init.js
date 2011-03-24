function init(evt) {     
	svg = new $.svg._wrapperClass(         
		evt.target.ownerDocument.documentElement,
		{clientWidth: "100%", clientHeight: "100%"});     

	var constraintGraph = [];

	function requestLayout(){
		//goal of this function is to act as a listener, decoupling those objects that can change the scene graph (visual object or constraints), 
		//from being repsonsible for re-applying layout
		//right now we just pass the request straight through, but this could be more sophisticated
		constraintModule.resolveGraphicalConstraints(constraintGraph);
	}

	var svgModule = SVGHelper();
	var constraintModule = ConstraintModule(svgModule);
	var constructors = setupConstructors(null,constraintModule,constraintGraph,requestLayout); 

	constructors.ClassIcon(100,100);

	document.documentElement.addEventListener("mousedown",function(e){
		constructors.ClassIcon(e.clientX,e.clientY);
	},false);

	
}
