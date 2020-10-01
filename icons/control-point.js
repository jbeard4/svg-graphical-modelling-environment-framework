/**
 * Copyright (C) 2011 Jacob Beard
 * Released under GNU GPL, read the file 'COPYING' for more information
 **/
define(['helpers', 'behaviour/constructors/control-point-draggable'], function (
	helpers,
	setupControlPointDragBehaviour
) {
	return function (
		env,
		segment,
		propNum,
		associatedEndPoint,
		associatedControlPoint
	) {
		let g = env.svg.group(env.controlLayer);

		$(g).addClass('control-point-icon');

		let propStr = helpers.propNumtoPropString(propNum);

		let l = env.svg.line(
			g,
			segment[propStr.x],
			segment[propStr.y],
			associatedEndPoint.segment.x,
			associatedEndPoint.segment.y,
			{ fill: 'none', stroke: 'blue' }
		);
		let c = env.svg.circle(g, segment[propStr.x], segment[propStr.y], 5, {
			fill: 'yellow',
			stroke: 'black',
		});

		setupControlPointDragBehaviour.call(g, env, {
			segment: segment,
			point: c,
			line: l,
			propStr: propStr,
			associatedEndPoint: associatedEndPoint,
			associatedControlPoint: associatedControlPoint,
		});

		return g;
	};
});
