/**
 * Copyright (C) 2011 Jacob Beard
 * Released under GNU GPL, read the file 'COPYING' for more information
 **/
define(function () {
	function addPathRefToSegment(path, seg) {
		seg.pathRef = path;
	}

	return {
		mixin: function (from, to) {
			for (let p in from) {
				if (from.hasOwnProperty(p)) to[p] = from[p];
			}
		},

		removeFromList: function (element, list) {
			return list.splice(list.indexOf(element), 1);
		},

		propNumtoPropString: function (propNum) {
			let propStr = propNum || '';
			let propX = 'x' + propStr;
			let propY = 'y' + propStr;

			return {
				x: propX,
				y: propY,
			};
		},

		getStartSegFromPath: function (path) {
			let segList = path.pathSegList;
			let numItems = segList.numberOfItems;
			let startSeg = segList.getItem(0);
			return startSeg;
		},

		getEndSegFromPath: function (path) {
			let segList = path.pathSegList;
			let numItems = segList.numberOfItems;
			let endSeg = segList.getItem(numItems - 1);
			return endSeg;
		},

		addPathRefToSegment: addPathRefToSegment,

		addPathRefToEachSegment: function (path) {
			let segList = path.pathSegList;
			let numItems = segList.numberOfItems;

			for (let i = 0; i < numItems; i++) {
				let seg = segList.getItem(i);

				addPathRefToSegment(path, seg);
			}
		},
		unique: function (l) {
			return l.reduce(function (a, b) {
				return a.indexOf(b) === -1 ? a.concat(b) : a;
			}, []);
		},
	};
});
