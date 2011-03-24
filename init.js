function init(evt) {     

	var svgRoot = evt.target.ownerDocument.documentElement;

	var svg = new $.svg._wrapperClass(         
		svgRoot,
		{clientWidth: "100%", clientHeight: "100%"});     

	var rootRectDropTarget = svg.rect(0,0,"100%","100%",{fill:"white",stroke:"none"});

	var nodeLayer = svg.group("$node-layer");
	var edgeLayer = svg.group("$edge-layer");

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

	var constructors = setupConstructors(compiledStatechartInstance,constraintModule,constraintGraph,requestLayout,svg,edgeLayer,nodeLayer); 

	//setup canvas as a drop target

	constructors.setupDropTarget(rootRectDropTarget,
						svgRoot,
						{topPadding:10,
							bottomPadding:10,
							leftPadding:10,
							rightPadding:10,
							minWidth:10,
							minHeight:10});

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
	
	//create a radio button group. associate this to the canvas
	var radioButtonGroup = constructors.RadioButtonGroup(10,10);
	radioButtonGroup.createButton("Class",constructors.ClassIcon); 
	radioButtonGroup.createButton("Package",constructors.PackageIcon); 

	//wrap the canvas in a nice object
	//TODO: once again, I wonder if it would be better to, instead of relying on behaviours, just check for existence of representative functions, e.g. create()
	var canvas = {
		create : function(x,y){
			//create whatever the radio buttons point to
			var button = radioButtonGroup.getSelectedButton()  
			if(button){
				var constructor = button.getIconConstructor();
				constructor(x,y);
			}
			
		},
		behaviours : {
			CREATOR : true
		}
	};

	//hook up DOM events for svg root
	["mousedown","mouseup","mousemove"].forEach(function(eventName){
		svgRoot.addEventListener(eventName,function(e){
			e.preventDefault();
			compiledStatechartInstance[eventName]({domEvent:e,currentTarget:canvas});
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
