/**
 * Copyright (C) 2011 Jacob Beard
 * Released under GNU GPL, read the file 'COPYING' for more information
 **/
define(['behaviour/constructors/end-point-draggable'], function (
	setupEndPointDragBehaviour
) {
	//associatedControlPoint1 and associatedControlPoint2 may be set up lazilly
	return function (env, segment, associatedControlPoints) {
		associatedControlPoints = associatedControlPoints || [];

		let r = env.svg.rect(env.controlLayer, segment.x, segment.y, 5, 5, {
			fill: 'blue',
			stroke: 'black',
		});

		$(r).addClass('end-point-icon');

		//TODO: set up behaviour
		setupEndPointDragBehaviour.call(r, env, {
			segment: segment,
			associatedControlPoints: associatedControlPoints,
		});

		return r;
	};
});
