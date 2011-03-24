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
			constructors:constructors,
			constraintGraph:constraintGraph,
			requestLayout:requestLayout
		}});

	svgRoot.behaviours = {
		CREATOR : true
	};

	["keydown","keyup"].forEach(function(eventName){
		svgRoot.addEventListener(eventName,function(e){
			var eventMap = {
				8:  "backspace",
				13: "enter",
				27: "esc",
				37: "left",
				38: "up",
				39: "right",
				40: "down",
			}

			var charCodeEventMap = {
				34 : "double_quote",
				36: "bling",
				48 : "zero",
				49 : "one",
				50 : "two",
				51 : "three",
				52 : "four",
				58 : "colon",
				64 : "at"
			}


			var scEvent = eventMap[e.keyCode] || charCodeEventMap[e.charCode] || String.fromCharCode(e.charCode);

			if(!scEvent){
				console.error("Could not turn keyboard event into statechart event");
			}

			if(e.ctrlKey){
				scEvent = "ctrl_" + scEvent;
			}

			e.preventDefault();

			compiledStatechartInstance.GEN(scEvent,({domEvent:e,currentTarget:svgRoot}));
		},false);
	});
	

	//hook up DOM events for svg root
	["mousedown","mouseup","mousemove"].forEach(function(eventName){
		svgRoot.addEventListener(eventName,function(e){
			e.preventDefault();
			compiledStatechartInstance[eventName]({domEvent:e,currentTarget:svgRoot});
		},false);
	});


	/*
	var g1 = constructors.ClassIcon(100,100);
	var g2 = constructors.ClassIcon(200,200);
	var c = constructors.CurveIcon(g1);
	c.setEndPoint(300,300); 
	c.setTarget(g2); 

	var g3 = constructors.ClassIcon(200,100);
	var g4 = constructors.ClassIcon(300,200);
	var c2 = constructors.CurveIcon(g3);
	c2.setEndPoint(300,300); 
	c2.setTarget(g4); 
	c2.remove();
	*/
}
