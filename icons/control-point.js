define(["helpers"],
	function(helpers){

		return function(svg,controlLayer,constraintGraph,setupControlPointDragBehaviour){
			return function(segment,propNum,associatedEndPoint,associatedControlPoint){

				var g = svg.group(controlLayer);

				$(g).addClass("control-point-icon");

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
