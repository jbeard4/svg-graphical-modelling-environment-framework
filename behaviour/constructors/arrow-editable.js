/**
* Copyright (C) 2011 Jacob Beard
* Released under GNU GPL, read the file 'COPYING' for more information
**/
define(
	["helpers","icons/end-point","icons/control-point"],
	function(h,EndPoint,ControlPoint){

		var setupArrowEditorBehaviourAPI = {
			showControlPoints : function(){
				//create control points
				//which relate to a particular path, pathsegment (referred to by index), and properties (0,1,or 2 for endpoint, ctrlPoint 1, ctrlPoint2)
				//the statechart then knows how to interpet those. get a behaviour CONTROL_POINT_DRAGGABLE
				//although it might be better just to have a general dragging interface... yah... ok. yah, this can all live in idle don't need to be in a special state to edit curves. yah, i like it. the only question is how to get it out of editing mode. and the answer to that is... normally to click the canvas? yah. so we would need to route this event down.... ok, i can live with that. this will be part of the general deselection method anyway... I say we go for the more general approach now. 

				var numItems = this.path.pathSegList.numberOfItems;
				for(var i=0; i < numItems; i++){
					var nextPathSeg, cp1, cp2, endPoint;
					nextPathSeg = cp1 = cp2 = null;

					var pathSeg = this.path.pathSegList.getItem(i);
					//debugger

					//for the endpoint, always create an endpoint icon
					endPoint = EndPoint(this.env,pathSeg);

					this.points.push(endPoint);

					if(i < (numItems - 1) ){
						nextPathSeg = this.path.pathSegList.getItem(i+1);
					}

					//first is M segment so we skip it
					//last segment we can skip too

					//if current segment is not line, and next segment is not line
					if(nextPathSeg && nextPathSeg.x1 !== undefined){
						cp1 = ControlPoint(this.env,nextPathSeg,1,endPoint);
					}

					if(pathSeg.x2 !== undefined){ 
						cp2 = ControlPoint(this.env,pathSeg,2,endPoint,cp1);
					}

					if(cp2 && cp1){
						cp1.associatedControlPoint = cp2;
					}

					if(cp1){
						endPoint.associatedControlPoints.push(cp1);
						this.points.push(cp1);
					}

					if(cp2){
						endPoint.associatedControlPoints.push(cp2);
						this.points.push(cp2);
					}

				}
				
			},
			hideControlPoints : function(){
				var c;
				/*jsl:ignore*/
				while(c = this.points.pop()){
					c.remove();
				}
				/*jsl:end*/
			}
		};

		function setupArrowEditorBehaviour(env,path){

			this.env = env;

			//register event listener
			this.behaviours = this.behaviours || {};

			this.behaviours.ARROW_EDITABLE = true;

			this.path = path;

			$(this).addClass("arrow-editable");

			this.points = [];
			this.endPoints = [];

			env.hookElementEventsToStatechart(this,["mousedown","mouseup"],true);

			h.mixin(setupArrowEditorBehaviourAPI,this);

		}

		return setupArrowEditorBehaviour;
	}
);
