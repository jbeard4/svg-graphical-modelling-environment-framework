/**
 * Copyright (C) 2011 Jacob Beard
 * Released under GNU GPL, read the file 'COPYING' for more information
 **/
define(['helpers'], function (h) {
	//resize stuff

	let resizableEastAPI = {
		resizeBy: function (delta) {
			let dx = delta.dx;
			console.log(dx);
			this.x1.baseVal.value += dx;
			this.x2.baseVal.value += dx;
			this.associatedRect.width.baseVal.value += dx;
		},
	};

	function setupResizableEast(env, kwArgs) {
		this.behaviours = this.behaviours || {};

		this.behaviours.RESIZABLE = true;

		$(this).addClass('resizable-e');
		$(this).addClass('control');

		env.hookElementEventsToStatechart(this, ['mousedown'], true);

		h.mixin(resizableEastAPI, this);

		h.mixin(kwArgs, this);
	}

	let resizableSouthAPI = {
		resizeBy: function (delta) {
			let dy = delta.dy;
			this.y1.baseVal.value = dy;
			this.y2.baseVal.value = dy;
			this.associatedRect.height.baseVal.value += dy;
		},
	};

	function setupResizableSouth(env, kwArgs) {
		this.behaviours = this.behaviours || {};

		this.behaviours.RESIZABLE = true;

		$(this).addClass('resizable-s');
		$(this).addClass('control');

		env.hookElementEventsToStatechart(this, ['mousedown'], true);

		h.mixin(resizableSouthAPI, this);

		h.mixin(kwArgs, this);
	}

	let resizableSouthEastAPI = {
		resizeBy: function (delta) {
			let dx = delta.dx,
				dy = delta.dy;
			this.x1.baseVal.value += dx;
			this.x2.baseVal.value += dx;
			this.y1.baseVal.value += dy;
			this.y2.baseVal.value += dy;
			this.associatedRect.width.baseVal.value += dx;
			this.associatedRect.height.baseVal.value += dy;
		},
	};

	function setupResizableSouthEast(env, kwArgs) {
		this.behaviours = this.behaviours || {};

		this.behaviours.RESIZABLE = true;

		$(this).addClass('resizable-se');
		$(this).addClass('control');

		env.hookElementEventsToStatechart(this, ['mousedown'], true);

		h.mixin(resizableSouthEastAPI, this);

		h.mixin(kwArgs, this);
	}

	return {
		setupResizableEast: setupResizableEast,
		setupResizableSouth: setupResizableSouth,
		setupResizableSouthEast: setupResizableSouthEast,
	};
});
