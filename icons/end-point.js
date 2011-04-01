define(
	function(){
		return function(svg,controlLayer,setupEndPointDragBehaviour){
			//associatedControlPoint1 and associatedControlPoint2 may be set up lazilly
			return function(segment,associatedControlPoints){

				associatedControlPoints = associatedControlPoints || [];

				var r = svg.rect(controlLayer,segment.x,segment.y,5,5,{fill:"blue",stroke:"black"});

				$(r).addClass("end-point-icon");
				
				//TODO: set up behaviour
				setupEndPointDragBehaviour.call(r,{segment:segment,associatedControlPoints:associatedControlPoints});

				return r;
				
			};
		};
	}
);
