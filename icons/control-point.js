define(["helpers","behaviour/constructors/control-point-draggable"],
	function(helpers,setupControlPointDragBehaviour){

		return function(svg,controlLayer,constraintGraph){
			return function(segment,propNum,associatedEndPoint,associatedControlPoint){

				var g = svg.group(controlLayer);

				var propStr = helpers.propNumtoPropString(propNum);

				var l = svg.line(g,
					segment[propStr.x],
					segment[propStr.y],
					associatedEndPoint.segment.x,
					associatedEndPoint.segment.y,
					{fill:"none",stroke:"blue"});
				var c = svg.circle(g,segment[propStr.x],segment[propStr.y],5,{fill:"yellow",stroke:"black"});
				
				setupControlPointDragBehaviour.call(g, { segment:segment,
										point : c,
										line : l,
										propStr:propStr,	
										associatedEndPoint:associatedEndPoint,
										associatedControlPoint:associatedControlPoint});

				return g;
				
			};
		};
	}
);
