/**
 * Copyright (C) 2011 Jacob Beard
 * Released under GNU GPL, read the file 'COPYING' for more information
 **/
define(['helpers'], function (h) {
	let endPointDragBehaviourAPI = {
		//todo: this is not part of the api exposed to the statechart. should probably move this out, or mark it with an underscore
		localMoveTo: function (x, y) {
			//update current segment
			this.segment.x = x;
			this.segment.y = y;

			//update graphical node
			this.x.baseVal.value = x;
			this.y.baseVal.value = y;
		},
		moveTo: function (x, y) {
			let dx = x - this.segment.x;
			let dy = y - this.segment.y;

			this.localMoveTo(x, y);

			this.associatedControlPoints.forEach(function (cp) {
				cp.localMoveTo(
					cp.segment[cp.propStr.x] + dx,
					cp.segment[cp.propStr.y] + dy,
					this.segment.x,
					this.segment.y
				);
			}, this);
		},
		remove: function () {
			//simply remove him from DOM
			this.parentNode.removeChild(this);
		},
	};

	function setupEndPointDragBehaviour(env, kwArgs) {
		/**
				kwArgs:
					segment
					associatedControlPoints
			*/
		this.behaviours = this.behaviours || {};

		this.behaviours.CTRL_POINT_DRAG = true;

		$(this).addClass('ctrl-point-draggable');

		env.hookElementEventsToStatechart(this, ['mousedown'], true);

		h.mixin(kwArgs, this);

		h.mixin(endPointDragBehaviourAPI, this);
	}

	return setupEndPointDragBehaviour;
});
