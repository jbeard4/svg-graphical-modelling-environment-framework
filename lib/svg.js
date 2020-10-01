/**
 * Copyright (C) 2011 Jacob Beard
 * Released under GNU GPL, read the file 'COPYING' for more information
 **/
define(function () {
	let scxmlJsNS = 'http://commons.apache.org/scxml-js';
	let svgNS = 'http://www.w3.org/2000/svg';
	let scxmlNS = 'http://www.w3.org/2005/07/scxml';
	let xlinkNS = 'http://www.w3.org/1999/xlink';

	function getBoundingBoxInArbitrarySpace(element, mat) {
		let svgRoot = element.ownerSVGElement;
		let bbox = element.getBBox();

		let cPt1 = svgRoot.createSVGPoint();
		cPt1.x = bbox.x;
		cPt1.y = bbox.y;
		cPt1 = cPt1.matrixTransform(mat);

		// repeat for other corner points and the new bbox is
		// simply the minX/minY  to maxX/maxY of the four points.
		let cPt2 = svgRoot.createSVGPoint();
		cPt2.x = bbox.x + bbox.width;
		cPt2.y = bbox.y;
		cPt2 = cPt2.matrixTransform(mat);

		let cPt3 = svgRoot.createSVGPoint();
		cPt3.x = bbox.x;
		cPt3.y = bbox.y + bbox.height;
		cPt3 = cPt3.matrixTransform(mat);

		let cPt4 = svgRoot.createSVGPoint();
		cPt4.x = bbox.x + bbox.width;
		cPt4.y = bbox.y + bbox.height;
		cPt4 = cPt4.matrixTransform(mat);

		let points = [cPt1, cPt2, cPt3, cPt4];

		//find minX,minY,maxX,maxY
		let minX = 1000000000000;
		let minY = 1000000000000;
		let maxX = 0;
		let maxY = 0;
		for (let i = 0; i < points.length; i++) {
			if (points[i].x < minX) {
				minX = points[i].x;
			}
			if (points[i].y < minY) {
				minY = points[i].y;
			}
			if (points[i].x > maxX) {
				maxX = points[i].x;
			}
			if (points[i].y > maxY) {
				maxY = points[i].y;
			}
		}

		//instantiate new object that is like an SVGRect
		let newBBox = {
			x: minX,
			y: minY,
			width: maxX - minX,
			height: maxY - minY,
		};
		return newBBox;
	}

	function getPointInArbitrarySpace(svgRoot, m, x, y) {
		let cPt1 = svgRoot.createSVGPoint();
		cPt1.x = x;
		cPt1.y = y;
		cPt1 = cPt1.matrixTransform(m);
		return cPt1;
	}

	function matrixesEqual(m1, m2) {
		return ['a', 'b', 'c', 'd', 'e', 'f'].every(function (prop) {
			return m1[prop] === m2[prop];
		});
	}

	function getBBoxInCanvasSpace(element) {
		return getBoundingBoxInArbitrarySpace(
			element,
			element.getTransformToElement(element.ownerSVGElement)
		);
	}

	function getPointInArbitrarySpaceFromEvent(event, element) {
		let target = event.target,
			svgRoot = event.target.ownerSVGElement;
		let pt = getPointInArbitrarySpace(
			svgRoot,
			target.getTransformToElement(element),
			event.clientX,
			event.clientY
		);
		return pt;
	}

	function getPointInCanvasSpaceFromEvent(event) {
		let target = event.target,
			svgRoot = event.target.ownerSVGElement;
		let pt = getPointInArbitrarySpace(
			svgRoot,
			target.getTransformToElement(svgRoot),
			event.clientX,
			event.clientY
		);
		return pt;
	}

	function getBBoxInElementSpace(element, spaceElement) {
		//this if statement is a workaround for a bug in Webkit. it's also more efficient than calling the method in the else statement
		if (matrixesEqual(element.getCTM(), spaceElement.getCTM())) {
			return element.getBBox();
		} else {
			return getBoundingBoxInArbitrarySpace(
				element,
				element.getTransformToElement(spaceElement)
			);
		}
	}

	function getCenter(element) {
		let bbox = element.getBBox();
		return [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2];
	}

	function getCenterInCanvasSpace(element) {
		let bbox = getBBoxInCanvasSpace(element);
		return [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2];
	}

	function getCenterInElementSpace(element, spaceElement) {
		let bbox = getBBoxInElementSpace(element, spaceElement);
		return [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2];
	}

	function translate(rawNode, dx, dy) {
		let tl = rawNode.transform.baseVal;
		let t = tl.numberOfItems
			? tl.getItem(0)
			: rawNode.ownerSVGElement.createSVGTransform();
		let m = t.matrix;
		let newM = rawNode.ownerSVGElement
			.createSVGMatrix()
			.translate(dx, dy)
			.multiply(m);
		t.setMatrix(newM);
		tl.initialize(t);
		return newM;
	}

	function translateTo(e, x, y) {
		// Convenience method: Moves this entity to the new location
		let bbox = e.getBBox();
		let curX = bbox.x,
			curY = bbox.y;
		let dx = x - curX;
		let dy = y - curY;
		translate(e, dx, dy);
	}

	function getAggregateBBoxInCanvasSpace(elementsArr) {
		let bboxes = elementsArr.map(getBBoxInCanvasSpace);
		let minX = Math.min.apply(
			this,
			bboxes.map(function (bbox) {
				return bbox.x;
			})
		);
		let minY = Math.min.apply(
			this,
			bboxes.map(function (bbox) {
				return bbox.y;
			})
		);
		let maxX = Math.max.apply(
			this,
			bboxes.map(function (bbox) {
				return bbox.x + bbox.width;
			})
		);
		let maxY = Math.max.apply(
			this,
			bboxes.map(function (bbox) {
				return bbox.y + bbox.height;
			})
		);

		return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
	}

	function contains(outerRect, innerRect) {
		return (
			outerRect.x < innerRect.x &&
			outerRect.y < innerRect.y &&
			outerRect.width + outerRect.x > innerRect.x + innerRect.width &&
			outerRect.height + outerRect.y > innerRect.y + innerRect.height
		);
	}

	return {
		SVG_NS: svgNS,
		SCXML_NS: scxmlNS,
		SCXML_JS_NS: scxmlJsNS,
		XLINK_NS: xlinkNS,

		translate: translate,
		translateTo: translateTo,
		getBBoxInCanvasSpace: getBBoxInCanvasSpace,
		getBBoxInElementSpace: getBBoxInElementSpace,
		getPointInCanvasSpaceFromEvent: getPointInCanvasSpaceFromEvent,
		getPointInArbitrarySpaceFromEvent: getPointInArbitrarySpaceFromEvent,
		getAggregateBBoxInCanvasSpace: getAggregateBBoxInCanvasSpace,
		contains: contains,
	};
});
