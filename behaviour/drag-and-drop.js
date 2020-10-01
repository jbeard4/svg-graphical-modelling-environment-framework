/**
 * Copyright (C) 2011 Jacob Beard
 * Released under GNU GPL, read the file 'COPYING' for more information
 **/
function DragBehaviourModule(svg, svgRoot, svgHelper) {
	let isDragging = false;
	let draggingRect, evtStamp, startEvtStamp, currentDraggingEntity;

	svgRoot.addEventListener(
		'mousemove',
		function (e) {
			//console.log(e);
			e.preventDefault();
			if (isDragging) {
				let tDeltaX = e.clientX - evtStamp.clientX;
				let tDeltaY = e.clientY - evtStamp.clientY;

				svgHelper.translate(draggingRect, tDeltaX, tDeltaY);

				evtStamp = e;
			}
		},
		false
	);

	svgRoot.addEventListener(
		'mouseup',
		function (e) {
			//console.log(e);
			e.preventDefault();
			if (isDragging) {
				isDragging = false;

				svg.remove(draggingRect);

				let tDeltaX = e.clientX - startEvtStamp.clientX;
				let tDeltaY = e.clientY - startEvtStamp.clientY;

				//move group
				svgHelper.translate(currentDraggingEntity, tDeltaX, tDeltaY);

				//TODO: then update all dependencies of descendants for attributes x and y
				//updateConstraints(currentDraggingEntity);
			}
		},
		false
	);

	return {
		addBehaviour: function (draggableEntity) {
			draggableEntity.addEventListener(
				'mousedown',
				function (e) {
					console.log(e);
					e.preventDefault();
					e.stopPropagation();
					isDragging = true;

					let bbox = svgHelper.getBBoxInCanvasSpace(draggableEntity);
					console.log(bbox);
					draggingRect = svg.rect(
						bbox.x,
						bbox.y,
						bbox.width,
						bbox.height
					);
					draggingRect.id = 'dragging';

					console.log(draggingRect);

					startEvtStamp = evtStamp = e;

					currentDraggingEntity = draggableEntity;
				},
				false
			);
		},
		removeBehaviour: function (draggableEntity) {
			//TODO
		},
	};
}
