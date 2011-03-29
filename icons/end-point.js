define(["behaviour/constructors/end-point-draggable"],
	function(setupEndPointDragBehaviour){
		return function(svg,controlLayer){
			//associatedControlPoint1 and associatedControlPoint2 may be set up lazilly
			return function(segment,associatedControlPoints){

				associatedControlPoints = associatedControlPoints || [];

				var r = svg.rect(controlLayer,segment.x,segment.y,5,5,{fill:"blue",stroke:"black"});
				
				//TODO: set up behaviour
				setupEndPointDragBehaviour.call(r,{segment:segment,associatedControlPoints:associatedControlPoints});

				return r;
				
			};
		};
	}
);
