define(
	["helpers","behaviour/constructors/control-point-draggable"],
	function(helpers,setupControlPointDragBehaviour){

		return function(env,segment,propNum,associatedEndPoint,associatedControlPoint){

			var g = env.svg.group(env.controlLayer);

			$(g).addClass("control-point-icon");

			var propStr = helpers.propNumtoPropString(propNum);

			var l = env.svg.line(g,
				segment[propStr.x],
				segment[propStr.y],
				associatedEndPoint.segment.x,
				associatedEndPoint.segment.y,
				{fill:"none",stroke:"blue"});
			var c = env.svg.circle(g,segment[propStr.x],segment[propStr.y],5,{fill:"yellow",stroke:"black"});
			
			setupControlPointDragBehaviour.call(g,env,{ segment:segment,
									point : c,
									line : l,
									propStr:propStr,	
									associatedEndPoint:associatedEndPoint,
									associatedControlPoint:associatedControlPoint});

			return g;
			
		};
	}
);
