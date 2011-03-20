var LABEL_PADDING = 10;

function identity(o){return o};

function sum(a,b){return a + b};

//higher order function used for padding and stuff
function inc(i){
	return function(n){
		return n + i;
	}
}

function dec(i){
	return function(n){
		return n - i;
	}
}

function compose(){
	//takes an array of functions as input, returns a function which call the given functions in order, taking result of prev call and passing it into next; finally, returns result

	var args = Array.prototype.slice.call(arguments);
	return function(){
		var r,f;
		while(f = args.pop()){
			r = f.apply(this,arguments)
		}
		return r;
	}
}

function Constraint(source,destinationOrDestinations,layoutAction){
	if(!(destinationOrDestinations instanceof Array)){
		destinationOrDestinations = [destinationOrDestinations];
	}

	layoutAction = layoutAction || identity;

	return {
		source : source,
		dest : destinationOrDestinations,
		expr : layoutAction
	}
}

function NodeAttr(node,attributeNameOrNames,expression){
	if(!(attributeNameOrNames instanceof Array)){
		attributeNameOrNames  = [attributeNameOrNames];
	}

	expression = expression || identity;

	return {
		node : node,
		attrs : attributeNameOrNames,
		expr : expression
	}
}

var classIcon2nameContainerRect = document.getElementById("classIcon2nameContainerRect");

var visualObjects = [
	nameContainerRect,
	nameText,
	attributeListRect,
	attributeListAttr1,
	attributeListAttr2,

	arrow,
	theCircle,

	CompositeStateIcon1,
	compositeStateRect,
	compositeStateNameText,
	compositeStateLineUnderNameText,
	BasicStateIcon1,
	basicState1Rect,
	basicState1NameText,
	BasicStateIcon2,
	basicState2Rect,
	basicState2NameText,

	bezierArrow 
];


var constraints = [
	//nameContainerRect
	Constraint(
		NodeAttr(nameContainerRect,"width"),
		[NodeAttr(nameText,"width"),NodeAttr(attributeListRect,"width")],//FIXME
		Math.max
	),
	//TODO: think about how to consolidate attributes. more concise syntax
	Constraint(
		NodeAttr(nameContainerRect,"x"),
		NodeAttr(nameText,"x")
	),
	Constraint(
		NodeAttr(nameContainerRect,"y"),
		NodeAttr(nameText,"y")
	),
	Constraint(
		NodeAttr(nameContainerRect,"height"),
		NodeAttr(nameText,"height")
	),

	//attributeListRect,
	//FIXME: we really need a shorthand for "contains"
	Constraint(
		NodeAttr(attributeListRect,"width"),
		[NodeAttr(nameText,"width"),NodeAttr(attributeListAttr1,"width"),NodeAttr(attributeListAttr2,"width")],
		Math.max
	),
	Constraint(
		NodeAttr(attributeListRect,"height"),
		[NodeAttr(attributeListAttr1,"height"),NodeAttr(attributeListAttr2,"height")],
		sum
	),
	Constraint(
		NodeAttr(attributeListRect,"y"),
		NodeAttr(attributeListAttr1,"y")
	),
	Constraint(
		NodeAttr(attributeListRect,"x"),
		NodeAttr(attributeListAttr1,"x")
	),

	//attributeListAttr1
	Constraint(
		NodeAttr(attributeListAttr1,"y"),
		NodeAttr(nameText,["y","height"],sum)
	),
	Constraint(
		NodeAttr(attributeListAttr1,"x"),
		NodeAttr(nameText,"x")
	),

	//attributeListAttr2
	//FIXME: need shorthand for "below" as well
	Constraint(
		NodeAttr(attributeListAttr2,"y"),
		NodeAttr(attributeListAttr1,["y","height"],sum)
	),
	Constraint(
		NodeAttr(attributeListAttr2,"x"),
		NodeAttr(attributeListAttr1,"x")
	),

	//arrow
	Constraint(
		NodeAttr(arrow,"x1"),
		NodeAttr(attributeListRect,"bbox"),
		function(attributeListRectBbox){
			return attributeListRectBbox.x + attributeListRectBbox.width/2;
		}
	),
	Constraint(
		NodeAttr(arrow,"y1"),
		NodeAttr(attributeListRect,"bbox"), 
		function(attributeListRectBbox){
			return attributeListRectBbox.y + attributeListRectBbox.height/2;
		}
	),
	Constraint(
		NodeAttr(arrow,["$endX","$endY"]),
		[NodeAttr(attributeListRect,"x"),
			NodeAttr(attributeListRect,"y"),
			NodeAttr(attributeListRect,"width"),
			NodeAttr(attributeListRect,"height"),
			NodeAttr(theCircle,"bbox")],
		function(x,y,width,height,bbox){
			var cx = bbox.x + bbox.width/2,
				cy = bbox.y + bbox.height/2,
				r = bbox.width/2;

			var a1x1 = x + width/2;
			var a1y1 = y + height/2;

			var a1x2 = cx;
			var a1y2 = cy;

			var inter = Intersection.intersectCircleLine(
				new Point2D(cx,cy),
				r,
				new Point2D(a1x1,a1y1),
				new Point2D(a1x2,a1y2))

			var point = inter.points.pop();
			return [point.x,point.y];
		}
	),

	//compositeStateRect
	//FIXME: regarding the next two constraints: we need to set x and width here at the same time, because width depends on x being set first. however, the constraint graph must be acyclic, so we can't have a constraint back to self. the solution is to set them at the same time, but it's a bit ugly. it would be nice if we could at some point deal with cycles.
	Constraint(
		NodeAttr(compositeStateRect,["x","width"]),
		[ NodeAttr(basicState1Rect,"x"),
			NodeAttr(basicState2Rect,"x"),
			NodeAttr(compositeStateNameText,"x"),

			NodeAttr(basicState1Rect,["x","width"],sum),
			NodeAttr(basicState2Rect,["x","width"],sum),
			NodeAttr(compositeStateNameText,["x","width"],sum)],
		function(
			basicState1RectLeftCoordinate,
			basicState2RectLeftCoordinate,	
			compositeStateNameTextLeftCoordinate,

			basicState1RectRightCoordinate,
			basicState2RectRightCoordinate,	
			compositeStateNameTextRightCoordinate){

			var leftCoord = Math.min( basicState1RectLeftCoordinate,
							basicState2RectLeftCoordinate,	
							compositeStateNameTextLeftCoordinate);
			var rightCoord = Math.max(basicState1RectRightCoordinate,
							basicState2RectRightCoordinate,
							compositeStateNameTextRightCoordinate);

			var leftCoordToLabelLeftDistance = compositeStateNameTextLeftCoordinate - leftCoord;
			var rightCoordtoLabelRightDistance = rightCoord - compositeStateNameTextRightCoordinate;

			var distanceDifference = Math.abs(rightCoordtoLabelRightDistance - leftCoordToLabelLeftDistance);

			//update coord to center the label
			if(rightCoordtoLabelRightDistance  < leftCoordToLabelLeftDistance){
				//push the right coordinate
				rightCoord += distanceDifference;
			}else{
				leftCoord -= distanceDifference;
			}

			var width = rightCoord - leftCoord; 

			//add a bit of padding to the label
			leftCoord -= LABEL_PADDING;
			width += LABEL_PADDING*2;
			
			return [leftCoord, width];
		}
		
	),

	Constraint(
		NodeAttr(compositeStateRect,["y","height"]),
		[NodeAttr(basicState1Rect,["y","height"],sum),
			NodeAttr(basicState2Rect,["y","height"],sum),
			NodeAttr(compositeStateNameText,"y"),
			NodeAttr(compositeStateNameText,["y","height"],sum)],
		function(basicState1RectBottomCoordinate,
			basicState2RectBottomCoordinate,
			compositeStateNameTextTopCoordinate,
			compositeStateNameTextBottomCoordinate){

			var topCoord = compositeStateNameTextTopCoordinate;
			var bottomCoord = Math.max(basicState1RectBottomCoordinate,
							basicState2RectBottomCoordinate,
							compositeStateNameTextBottomCoordinate);
			var height = bottomCoord - topCoord; 

			//add a bit of padding to the label
			height += LABEL_PADDING;
			
			return [topCoord, height];
		}
		
	),

	//compositeStateLineUnderNameText
	Constraint(
		NodeAttr(compositeStateLineUnderNameText,"x1"),
		NodeAttr(compositeStateRect,"x")
	),
	Constraint(
		NodeAttr(compositeStateLineUnderNameText,"x2"),
		NodeAttr(compositeStateRect,["x","width"],sum)
	),
	Constraint(
		NodeAttr(compositeStateLineUnderNameText,"y1"),
		NodeAttr(compositeStateNameText,["y","height"],sum)
	),
	Constraint(
		NodeAttr(compositeStateLineUnderNameText,"y2"),
		NodeAttr(compositeStateNameText,["y","height"],sum)
	),


	//basicState1Rect
	Constraint(
		NodeAttr(basicState1Rect,"width"),
		NodeAttr(basicState1NameText,"width",inc(LABEL_PADDING*2)),
		Math.max
	),
	Constraint(
		NodeAttr(basicState1Rect,"x"),
		NodeAttr(basicState1NameText,"x",dec(LABEL_PADDING))
	),
	Constraint(
		NodeAttr(basicState1Rect,"y"),
		NodeAttr(basicState1NameText,"y")
	),
	Constraint(
		NodeAttr(basicState1Rect,"height"),
		NodeAttr(basicState1NameText,"height")
	),

	//basicState2Rect
	Constraint(
		NodeAttr(basicState2Rect,"width"),
		NodeAttr(basicState2NameText,"width",inc(LABEL_PADDING*2)),
		Math.max
	),
	Constraint(
		NodeAttr(basicState2Rect,"x"),
		NodeAttr(basicState2NameText,"x",dec(LABEL_PADDING))
	),
	Constraint(
		NodeAttr(basicState2Rect,"y"),
		NodeAttr(basicState2NameText,"y")
	),
	Constraint(
		NodeAttr(basicState2Rect,"height"),
		NodeAttr(basicState2NameText,"height")
	),

	//TODO: add some constraints to ensure that the states are below the name text... or that the name-text is above the states. whatever makes sense from a usability perspective

	Constraint(
		NodeAttr(bezierArrow,"$startX"),
		NodeAttr(attributeListRect,"bbox"),
		function(attributeListRectBbox){
			return attributeListRectBbox.x + attributeListRectBbox.width/2;
		}
	),
	Constraint(
		NodeAttr(bezierArrow,"$startY"),
		NodeAttr(attributeListRect,"bbox"), 
		function(attributeListRectBbox){
			return attributeListRectBbox.y + attributeListRectBbox.height/2;
		}
	),

	Constraint(
		NodeAttr(bezierArrow,["$endX","$endY"]),
		[NodeAttr(attributeListRect,"x"),
			NodeAttr(attributeListRect,"y"),
			NodeAttr(attributeListRect,"width"),
			NodeAttr(attributeListRect,"height"),
			NodeAttr(compositeStateRect,"x"),
			NodeAttr(compositeStateRect,"y"),
			NodeAttr(compositeStateRect,"width"),
			NodeAttr(compositeStateRect,"height")], 
		function(fromX,fromY,fromWidth,fromHeight,toX,toY,toWidth,toHeight){

			var x0 = fromX + fromWidth/2;
			var y0 = fromY + fromHeight/2;

			var x3 = toX + toWidth/2;
			var y3 = toY + toHeight/2;

			//FIXME: we are hard-coding what kind of path this is. must consider how this will work when we dynamically generate these things. how much control will the user have, etc...
			var curveToSegment = this.pathSegList.getItem(1);

			var x1 = curveToSegment.x1, 
				y1 = curveToSegment.y1, 
				x2 = curveToSegment.x2, 
				y2 = curveToSegment.y2; 

			var p1 = new Point2D(x0,y0),
				p2 = new Point2D(x1,y1),
				p3 = new Point2D(x2,y2),
				p4 = new Point2D(x3,y3),
				r1 = new Point2D(toX,toY),
				r2 = new Point2D(toX + toWidth, toY + toHeight);

			var inter = Intersection.intersectBezier3Rectangle(p1,p2,p3,p4,r1,r2);

			var point = inter.points.pop();

			return [point.x,point.y];
		}
	),



];

function handleEndXOrEndY(sourceNode,isX,value){
	if(sourceNode.localName === "path"){
		var lastPathSegment = sourceNode.pathSegList.getItem(sourceNode.pathSegList.numberOfItems-1);

		//we actually don't need to switch him, as endpoint will be x,y for all path segment types
		//switch(lastPathSegment.pathSegTypeAsLetter)	

		if(isX){
			lastPathSegment.x = value; 
		}else{
			lastPathSegment.y = value; 
		}
	}else if(sourceNode.localName === "line"){
		if(isX){
			sourceNode.x2.baseVal.value = value;
		}else{
			sourceNode.y2.baseVal.value = value;
		}
	}else{
		throw new Exception("attribute $endX must be used with node of type path or line");
	}
}

function handleStartXOrStartY(sourceNode,isX,value){
	if(sourceNode.localName === "path"){
		var firstPathSegment = sourceNode.pathSegList.getItem(0);

		//we actually don't need to switch him, as start segment will be move segment, hence x,y for all path segment types
		//switch(firstPathSegment.pathSegTypeAsLetter)	

		if(isX){
			firstPathSegment.x = value; 
		}else{
			firstPathSegment.y = value; 
		}
	}else if(sourceNode.localName === "line"){
		if(isX){
			sourceNode.x1.baseVal.value = value;
		}else{
			sourceNode.y1.baseVal.value = value;
		}
	}else{
		throw new Exception("attribute $endX must be used with node of type path or line");
	}
}

function setAttr(sourceNode,sourceAttr,value){
	
	console.log("setting ",sourceNode.id,sourceAttr,value);

	switch(sourceAttr){
		case "$endX":
			handleEndXOrEndY(sourceNode,true,value);
			break;
		case "$endY":
			handleEndXOrEndY(sourceNode,false,value);
			break;
		case "$startX":
			handleStartXOrStartY(sourceNode,true,value);
			break;
		case "$startY":
			handleStartXOrStartY(sourceNode,false,value);
			break;
		default:
			//width, height and everything else
			sourceNode.setAttributeNS(null,sourceAttr,value);
	}
}

function topoSortNodes(visualObjs,constraints){
	var nodes = visualObjs.slice();

	console.log("nodes to sort: ",nodes);

	//reverse the edges
	var edges = constraints.map(function(c){
		return c.dest.map(function(d){
			return {
				source : c.source.node,
				dest : d.node
			}
		})
	}).reduce(function(a,b){return a.concat(b)},[]);

	function noIncomingEdges(n){
		return !edges.some(function(e){
			return e.dest === n;
		});
	}

	function unique(arr){
		return arr.reduce(function(a,b){
				return a.indexOf(b) === -1 ? a.concat(b) : a},[]);
	}

	var s = nodes.filter(noIncomingEdges);
	var l = [];

	s.forEach(function(n){
		visit(n);
	});

	console.log("s",s);

	function visit(n){
		if(!n.visited){

			n.visited=true;

			var edgesCorrespondingToThisNode = 
				edges
					.filter(function(e){return e.source === n})
					.reduce(function(a,b){
						return a.indexOf(b) === -1 ? a.concat(b) : a},[]);

			edgesCorrespondingToThisNode.map(function(e){return e.dest}).forEach(visit);

			l.push(n);
		}
	}

	//FIXME: this is pretty ugly. we should not be setting properties directly on dom nodes, as they get retained each time this function is called
	visualObjs.forEach(function(n){n.visited=false});

	return l;
}

function performTopoSort(topoSortedNodes){
	topoSortedNodes.forEach(function(n){
		var constraintsAssociatedWithNode = 
			constraints.filter(function(c){
				return c.source.node === n;
			});

		constraintsAssociatedWithNode.forEach(function(c){
			var sourceNode = c.source.node;
			var sourceAttrs = c.source.attrs;

			console.log("=== setting ", sourceAttrs, " for node ", sourceNode.getAttributeNS(null,"id"),"===");

			//if(sourceNode === attributeListAttr1) debugger;

			var attrValues = c.dest.map(function(destNodeAttr){
				var destNode = destNodeAttr.node;
				var destAttrs = destNodeAttr.attrs;

				var bbox = svg.getBBoxInElementSpace(destNode,sourceNode);

				var destAttributeValues = 
					destAttrs.map(function(destAttr){
						switch(destAttr){
							case "x":
								return bbox.x;
							case "y":
								return bbox.y;
							case "width":
								return bbox.width;
							case "height":
								return bbox.height;
							case "bbox":
								return bbox;
							default:
								return parseInt(destNode.getAttributeNS(null,destAttr)) || 0;
						}
					}); 

				var toReturn;
				if(destAttributeValues.length > 1){
					toReturn = destAttributeValues.reduce(destNodeAttr.expr);
				}else{
					toReturn = destNodeAttr.expr(destAttributeValues.pop());
				}

				console.log("computed ", toReturn," for node ", destNode.getAttributeNS(null,"id"), " and attrs ", destAttrs);

				return toReturn;
			});

			var constraintValue = c.expr.apply(sourceNode,attrValues);

			
			if(sourceAttrs.length > 1){
				for(var i=0;i<sourceAttrs.length;i++){
					var sourceAttr = sourceAttrs[i];
					var cv = constraintValue[i];
					
					setAttr(sourceNode,sourceAttr,cv);
				}
			}else{
				setAttr(sourceNode,sourceAttrs[0],constraintValue);
			} 
		});
	});
}

function main(){
	topoSortedNodes = topoSortNodes(visualObjects,constraints);
	console.log("topoSortedNodes",topoSortedNodes);
	performTopoSort(topoSortedNodes);
}

main();

//perform topo sort action

