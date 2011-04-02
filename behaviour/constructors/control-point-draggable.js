define(["helpers"],
	function(h){
		var controlPointDragBehaviourAPI = {
			//todo: this is not part of the api exposed to the statechart. should probably move this out, or mark it with an underscore
			localMoveTo : function(x,y,x2,y2){
				//update current segment
				this.segment[this.propStr.x] = x;
				this.segment[this.propStr.y] = y;

				//update graphical node
				this.point.cx.baseVal.value = x;
				this.point.cy.baseVal.value = y;

				this.line.x1.baseVal.value = x;
				this.line.y1.baseVal.value = y;

				//optionally update the arrow endpoints
				if(x2) this.line.x2.baseVal.value = x2;
				if(y2) this.line.y2.baseVal.value = y2;

			},
			moveTo : function(x,y){
				this.localMoveTo(x,y);

				//compute the position of the associated segment
				if(this.associatedControlPoint){

					var ox = this.associatedEndPoint.segment.x;
					var oy = this.associatedEndPoint.segment.y;

					//compute angle
					var relativeX = x - ox;
					var relativeY = y - oy;

					var a = Math.atan2(relativeX,relativeY);

					//take the angle, rotate by 180 degrees
					var a2 = a + Math.PI;
					
					//determine the current length of the associated segment (the hypotenuse of the triangle)
					var associatedX = this.associatedControlPoint.segment[this.associatedControlPoint.propStr.x];
					var associatedY = this.associatedControlPoint.segment[this.associatedControlPoint.propStr.y];

					var associatedRelativeX = associatedX - ox;
					var associatedRelativeY = associatedY - oy;

					//pythagorean theorem
					var associatedHypotenuse = Math.sqrt(Math.pow(associatedRelativeX,2) + Math.pow(associatedRelativeY,2) ); 

					var newAssociatedX = associatedHypotenuse * Math.sin(a2) + ox;
					var newAssociatedY = associatedHypotenuse * Math.cos(a2) + oy;
					
					//this.associatedControlPoint.segment[this.associatedControlPoint.propStr.x] = newAssociatedX; 
					//this.associatedControlPoint.segment[this.associatedControlPoint.propStr.x] = newAssociatedY; 

					this.associatedControlPoint.localMoveTo(newAssociatedX,newAssociatedY);
				}
			},
			remove : function(){
				//simply remove him from DOM
				this.parentNode.removeChild(this);
			}
		};

		function setupControlPointDragBehaviour(env,kwArgs){
			/**
				kwArgs:
					segment:segment,
					point : c,
					line : l,
					propStr:propStr,	
					associatedEndPoint:associatedEndPoint,
					associatedControlPoint:associatedControlPoint
			*/
			this.behaviours = this.behaviours || {};

			this.behaviours.CTRL_POINT_DRAG = true;

			$(this).addClass("ctrl-point-draggable");

			env.hookElementEventsToStatechart(this,["mousedown"],true);

			h.mixin(kwArgs,this);

			h.mixin(controlPointDragBehaviourAPI,this);
		}

		return setupControlPointDragBehaviour;
	}
);
