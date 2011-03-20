function init(evt) {     
	svg = new $.svg._wrapperClass(         
		evt.target.ownerDocument.documentElement,
		{clientWidth: "100%", clientHeight: "100%"});     

	var constraintGraph = [];
	var visualObjects = [];

	function requestLayout(){
		//goal of this function is to act as a listener, decoupling those objects that can change the scene graph (visual object or constraints), 
		//from being repsonsible for re-applying layout
		//right now we just pass the request straight through, but this could be more sophisticated
		constraintModule.resolveGraphicalConstraints(visualObjects,constraintGraph);
	}

	var svgModule = SVGHelper();
	var constraintModule = ConstraintModule(svgModule);
	var constructors = setupConstructors(null,constraintModule,constraintGraph,visualObjects,requestLayout); 

	//constructors.ClassIcon(100,100);

	/*
	(function(){
		var x=y=100;
		var classIconG = svg.group();
		var nameContainerRect = svg.rect(classIconG);
		nameContainerRect.id="nameContainerRect";
		var nameText = svg.text(classIconG,x,y,"Class");
		nameText.id = "nameText";
		
		constraintGraph.push(
			//nameContainerRect
			constraintModule.Constraint(
				constraintModule.NodeAttr(nameContainerRect,"width"),
				constraintModule.NodeAttrExpr(nameText,"width")
			),
			constraintModule.Constraint(
				constraintModule.NodeAttr(nameContainerRect,"height"),
				constraintModule.NodeAttrExpr(nameText,"height")
			),
			constraintModule.Constraint(
				constraintModule.NodeAttr(nameContainerRect,"x"),
				constraintModule.NodeAttrExpr(nameText,"x")
			),
			constraintModule.Constraint(
				constraintModule.NodeAttr(nameContainerRect,"y"),
				constraintModule.NodeAttrExpr(nameText,"y")
			)
		)

		visualObjects.push(nameContainerRect,nameText);

		requestLayout();
	})()
	*/

	constructors.ClassIcon(100,100);

	document.documentElement.addEventListener("mousedown",function(e){
		constructors.ClassIcon(e.clientX,e.clientY);
	},false);

	
}
