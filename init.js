function init(evt) {     
	var svgRoot = evt.target.ownerDocument.documentElement;

	var svg = new $.svg._wrapperClass(         
		svgRoot,
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

	var behaviours = {
		DRAGGABLE : "DRAGGABLE",
		CREATOR : "CREATOR"
	}

	//hook up behaviour
	compiledStatechartInstance = new StatechartExecutionContext(); 

	var constructors = setupConstructors(compiledStatechartInstance,constraintModule,constraintGraph,requestLayout,svg); 

	//initialize
	compiledStatechartInstance.initialize();

	compiledStatechartInstance.init({
		controller:{},
		modules:{
			svgHelper:svgModule,
			svg:svg,
			behaviours:behaviours,
			constructors:constructors
		}});

	svgRoot.behaviours = {
		CREATOR : true
	};
	

	//hook up DOM events for svg root
	["mousedown","mouseup","mousemove"
		//,"keydown","keyup"	//TODO: add these in later
			].forEach(function(eventName){
		svgRoot.addEventListener(eventName,function(e){
			e.preventDefault();
			compiledStatechartInstance[eventName]({domEvent:e,currentTarget:svgRoot});
		},false);
	});


	constructors.ClassIcon(100,100);
}
