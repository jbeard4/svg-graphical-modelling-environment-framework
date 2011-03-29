define(["helpers"],
	function(h){
		return function(hookElementEventsToStatechart){
			var endPointDragBehaviourAPI = {
				//todo: this is not part of the api exposed to the statechart. should probably move this out, or mark it with an underscore
				localMoveTo : function(x,y){
					//update current segment
					this.segment.x = x;
					this.segment.y = y;

					//update graphical node
					this.x.baseVal.value = x;
					this.y.baseVal.value = y;
				},
				moveTo : function(x,y){
					var dx = x - this.segment.x;
					var dy = y - this.segment.y;

					this.localMoveTo(x,y);

					this.associatedControlPoints.forEach(function(cp){
						
						cp.localMoveTo(
							cp.segment[cp.propStr.x] + dx,
							cp.segment[cp.propStr.y] + dy,
							this.segment.x,
							this.segment.y);
					},this);
				},
				remove : function(){
					//simply remove him from DOM
					this.parentNode.removeChild(this);
				}
			};


			function setupEndPointDragBehaviour(kwArgs){
				this.behaviours = this.behaviours || {};

				this.behaviours.CTRL_POINT_DRAG = true;

				hookElementEventsToStatechart(this,["mousedown"],true);

				h.mixin(kwArgs,this);

				h.mixin(endPointDragBehaviourAPI,this);
			}

			return setupEndPointDragBehaviour;
		};
	}
);