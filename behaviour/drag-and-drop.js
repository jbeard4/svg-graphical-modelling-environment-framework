//TODO: pull stuff out of markup
//document.evaluate(".//*[m:behaviourInterface]", n, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null);


function DragBehaviourModule(svg,svgRoot,svgHelper){

	var isDragging = false;
	var draggingRect,evtStamp,startEvtStamp,currentDraggingEntity;

	/*
	function updateConstraints(group){
		var objs = getAllVisualObjectDescendants(group);
		//debugger;
		//var topoSortedNodes = topoSortNodes(objs,constraints);
		//TODO: optimize this. should be possible to not perform it on the whole graph, as we're doing now, but instead only on the updated nodes.
		var topoSortedNodes = topoSortNodes(visualObjects,constraints); 
		performTopoSort(topoSortedNodes);
	}
	*/

	svgRoot.addEventListener("mousemove",function(e){
		//console.log(e);
		e.preventDefault();
		if(isDragging){
			var tDeltaX = e.clientX - evtStamp.clientX;
			var tDeltaY = e.clientY - evtStamp.clientY;

			svgHelper.translate(draggingRect,tDeltaX,tDeltaY);  

			evtStamp = e;
		}
	},false); 

	svgRoot.addEventListener("mouseup",function(e){
		//console.log(e);
		e.preventDefault();
		if(isDragging){
			isDragging = false;

			svg.remove(draggingRect);

			var tDeltaX = e.clientX - startEvtStamp.clientX;
			var tDeltaY = e.clientY - startEvtStamp.clientY;

			//move group
			svgHelper.translate(currentDraggingEntity,tDeltaX,tDeltaY); 

			//TODO: then update all dependencies of descendants for attributes x and y
			//updateConstraints(currentDraggingEntity);	
		}
	},false); 


	return {
		addBehaviour : function(draggableEntity){

			draggableEntity.addEventListener("mousedown",function(e){
				console.log(e);
				e.preventDefault();
				e.stopPropagation();
				isDragging = true;

				var bbox = svgHelper.getBBoxInCanvasSpace(draggableEntity);
				console.log(bbox);
				draggingRect = 	svg.rect(bbox.x,bbox.y,bbox.width,bbox.height);
				draggingRect.id="dragging";

				console.log(draggingRect);

				startEvtStamp = evtStamp = e;

				currentDraggingEntity = draggableEntity;
			},false); 

		},
		removeBehaviour : function(draggableEntity){
			//TODO
		}
	}
}
