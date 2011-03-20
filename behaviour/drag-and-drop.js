//TODO: pull stuff out of markup
//document.evaluate(".//*[m:behaviourInterface]", n, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null);

var draggableEntities = [ClassIcon1,CompositeStateIcon1,BasicStateIcon1,BasicStateIcon2,theCircle];


var isDragging = false;
var draggingRect,evtStamp,startEvtStamp,currentDraggingEntity;

function createDraggingRect(bbox){
	rect = document.createElementNS(svgNS,"rect");
	rect.setAttributeNS(null,"x",bbox.x);
	rect.setAttributeNS(null,"y",bbox.y);
	rect.setAttributeNS(null,"width",bbox.width);
	rect.setAttributeNS(null,"height",bbox.height);
	rect.setAttributeNS(null,"id","dragging");

	console.log(rect);

	document.documentElement.appendChild(rect);

	return rect;
}

function removeDraggingRect(){
	document.documentElement.removeChild(draggingRect);
}

function getAllVisualObjectDescendants(n){
	var descendants = document.evaluate(".//*", n, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null);

	var descendantArr = [];

	for ( var i=0 ; i < descendants.snapshotLength; i++ )
	{
		var node = descendants.snapshotItem(i);
		descendantArr.push(node);	//only add this node if it's in the set of visual objects
	}

	return descendantArr.filter(function(n){return visualObjects.indexOf(n) !== -1});
}

function updateConstraints(group){
	var objs = getAllVisualObjectDescendants(group);
	//debugger;
	//var topoSortedNodes = topoSortNodes(objs,constraints);
	//TODO: optimize this. should be possible to not perform it on the whole graph, as we're doing now, but instead only on the updated nodes.
	var topoSortedNodes = topoSortNodes(visualObjects,constraints); 
	performTopoSort(topoSortedNodes);
}

document.documentElement.addEventListener("mousemove",function(e){
	e.preventDefault();
	if(isDragging){
		var tDeltaX = e.clientX - evtStamp.clientX;
		var tDeltaY = e.clientY - evtStamp.clientY;

		svg.translate(draggingRect,tDeltaX,tDeltaY);  

		evtStamp = e;
	}
},false); 

document.documentElement.addEventListener("mouseup",function(e){
	e.preventDefault();
	if(isDragging){
		isDragging = false;
		removeDraggingRect();

		var tDeltaX = e.clientX - startEvtStamp.clientX;
		var tDeltaY = e.clientY - startEvtStamp.clientY;

		//move group
		svg.translate(currentDraggingEntity,tDeltaX,tDeltaY); 

		//then update all dependencies of descendants for attributes x and y
		updateConstraints(currentDraggingEntity);	
	}
},false); 


draggableEntities.forEach(function(draggableEntity){

	draggableEntity.addEventListener("mousedown",function(e){
		e.preventDefault();
		e.stopPropagation();
		isDragging = true;

		var bbox = svg.getBBoxInCanvasSpace(draggableEntity);
		draggingRect = createDraggingRect(bbox);

		startEvtStamp = evtStamp = e;

		currentDraggingEntity = draggableEntity;
	},false); 

});

