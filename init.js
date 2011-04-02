function init(evt) {     

	if(window.console === undefined){
		window.console = {
			log : function(s){
				//TODO: do something with s
			}
		};
	}

	var svgRoot = evt.target.ownerDocument.documentElement;

	require(["helpers","c","lib/svg","behaviours",
			"behaviour/constructors/arrow-editable",
			"behaviour/constructors/control-point-draggable",
			"behaviour/constructors/draggable",
			"behaviour/constructors/drop-targetable",
			"behaviour/constructors/end-point-draggable",
			"behaviour/constructors/highlightable",
			"behaviour/constructors/path-drawable",
			"behaviour/constructors/resizable",
			"icons/class",
			"icons/control-point",
			"icons/curve",
			"icons/end-point",
			"icons/package",
			"icons/radio-button-group",

			"lib/intersection/2D.js",
			"lib/intersection/Intersection.js",
			"build/default.js",
			"batikCompatibility.js" ],

		function(h,constraintModule,svgModule,behaviours,
				arrowEditable,
				controlPointDraggable,
				draggable,
				dropTargetable,
				endPointDraggable,
				highlightable,
				pathDrawable,
				resizable,
				classIcon,
				controlPointIcon,
				curveIcon,
				endPointIcon,
				packageIcon,
				radioButtonGroupIcon){

			var svg = new $.svg._wrapperClass(         
				svgRoot,
				{clientWidth: "100%", clientHeight: "100%"});     

			var rootRectDropTarget = svg.rect(0,0,"100%","100%",{fill:"white",stroke:"none"});

			var nodeLayer = svg.group("$node-layer");
			var edgeLayer = svg.group("$edge-layer");
			var controlLayer = svg.group("$control-layer");

			var constraintGraph = [];
			var selectedIcons = [];

			function requestLayout(){
				//goal of this function is to act as a listener, decoupling those objects that can change the scene graph (visual object or constraints), 
				//from being repsonsible for re-applying layout
				//right now we just pass the request straight through, but this could be more sophisticated
				constraintModule.resolveGraphicalConstraints(constraintGraph);
			}



			//hook up behaviour
			var compiledStatechartInstance = new StatechartExecutionContext(); 

			//var constructors = setupConstructors(compiledStatechartInstance,constraintModule,constraintGraph,requestLayout,svg,edgeLayer,nodeLayer,controlLayer); 

			function hookElementEventsToStatechart (element,events,stopPropagation){
				events.forEach(function(eventName){
					element.addEventListener(eventName,function(e){
						//console.log(element,eventName);
						e.preventDefault();

						if(stopPropagation) e.stopPropagation();

						//FIXME: this is interesting. in order to not conflict with drag-and-drop behaviour (parent has arrow target), we need to not stop event propagation. when generating the environment, we will need to determine the strict conditions that require us to stop event propagation, or not
						//e.stopPropagation();	
						compiledStatechartInstance[eventName]({domEvent:e,currentTarget:element});
					},false);
				});
			}

			//bootstrap constructors
			var classIconConstructor = classIcon(svg,nodeLayer,constraintGraph,hookElementEventsToStatechart,requestLayout),
				controlPointDraggableConstructor = controlPointDraggable(hookElementEventsToStatechart),
				controlPointIconConstructor = controlPointIcon(svg,controlLayer,constraintGraph,controlPointDraggableConstructor),
				endPointDraggableConstructor = endPointDraggable(hookElementEventsToStatechart),
				endPointIconConstructor = endPointIcon(svg,controlLayer,endPointDraggableConstructor),
				radioButtonGroupConstructor = radioButtonGroupIcon (svg,nodeLayer,constraintGraph,requestLayout),
				dropTargetableConstructor = dropTargetable(constraintGraph,hookElementEventsToStatechart),
				arrowEditableConstructor = arrowEditable(endPointIconConstructor,controlPointIconConstructor,hookElementEventsToStatechart),
				pathDrawableConstructor = pathDrawable(constraintGraph),
				resizableConstructor = resizable(hookElementEventsToStatechart),
				packageIconConstructor = packageIcon(svg,nodeLayer,constraintGraph,hookElementEventsToStatechart,requestLayout,resizableConstructor,dropTargetableConstructor),
				curveIconConstructor = curveIcon(svg,edgeLayer,pathDrawableConstructor,arrowEditableConstructor);

			

			//setup canvas as a drop target

			dropTargetableConstructor(rootRectDropTarget,
								nodeLayer,
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
					canvas : svgRoot,
					behaviours:behaviours,
					constructors:{
						CurveIcon : curveIconConstructor
					},
					constraintGraph:constraintGraph,
					requestLayout:requestLayout
				}});

			//for now, it only makes sense to use keydown
			["keydown"
				//,"keyup"
				].forEach(function(eventName){
				svgRoot.addEventListener(eventName,function(e){
					var eventMap = {
						8:  "backspace",
						13: "enter",
						27: "esc",
						37: "left",
						38: "up",
						39: "right",
						40: "down"
					};

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
					};


					var scEvent = eventMap[e.keyCode] || charCodeEventMap[e.charCode] || String.fromCharCode(e.charCode);

					if(!scEvent){
						console.error("Could not turn keyboard event into statechart event");
					}

					if(e.ctrlKey){
						scEvent = "ctrl_" + scEvent;
					}

					//we don't want to override ctrl+r... probably others as well
					if(scEvent !== "ctrl_r"){
						e.preventDefault();
					}

					compiledStatechartInstance.GEN(scEvent,({domEvent:e,currentTarget:svgRoot}));
				},false);
			});
			
			//create a radio button group. associate this to the canvas

			var radioButtonGroup = radioButtonGroupConstructor(10,10);
			radioButtonGroup.createButton("Class",classIconConstructor); 
			radioButtonGroup.createButton("Package",packageIconConstructor); 

			//wrap the canvas in a nice object
			//TODO: once again, I wonder if it would be better to, instead of relying on behaviours, just check for existence of representative functions, e.g. create()
			var canvasAPI = {
				create : function(x,y){
					//create whatever the radio buttons point to
					var button = radioButtonGroup.getSelectedButton();
					if(button){
						var constructor = button.getIconConstructor();
						constructor(x,y);
					}
					
				},
				behaviours : {
					CREATOR : true
				},
					
				getEnclosureList2 : function(rect,query){
					var elements = Array.prototype.slice.call(document.querySelectorAll(query));
					console.log("all selectable elements",  elements);
					return elements.filter(function(element){
						return svgModule.contains(
							rect, svgModule.getBBoxInCanvasSpace(element));
					});
				}
			};

			h.mixin(canvasAPI,svgRoot);		

			//hook up DOM events for svg root
			hookElementEventsToStatechart (svgRoot,["mousedown","mouseup","mousemove"],false);

			hookElementEventsToStatechart (rootRectDropTarget,["mousedown"],false);

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
	);
}
