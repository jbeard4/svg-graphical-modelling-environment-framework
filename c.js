function ConstraintModule(svg){

	var LABEL_PADDING = 10;

	function identity(o){return o};

	//function sum(a,b){return a + b};

	function sum(){
		var toReturn = 0;
		for(var i = 0; i < arguments.length; i++){
			toReturn += arguments[i];
		}
		return toReturn;
	};


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

		function resetVisited(){
			//FIXME: this is pretty ugly. we should not be setting properties directly on dom nodes, as they get retained each time this function is called
			visualObjs.forEach(function(n){n.visited=false});
		}

		var i = 0;
		s.forEach(function(n){
			console.log(i++);
			visit(n,[]);
			//resetVisited();
		});

		console.log("s",s);

		function visit(n,nodesOnStack){
			if(nodesOnStack.indexOf(n) !== -1){
				throw new Error("Dependency graph has cycle.");
			}
			nodesOnStack = nodesOnStack.concat(n);

			if(!n.visited){

				n.visited=true;

				var edgesCorrespondingToThisNode = 
					edges
						.filter(function(e){return e.source === n})
						.reduce(function(a,b){
							return a.indexOf(b) === -1 ? a.concat(b) : a},[]);

				edgesCorrespondingToThisNode
					.map(function(e){return e.dest})	
					.forEach(function(destNode){
						visit(destNode,nodesOnStack)});

				l.push(n);
			}
		}

		resetVisited();

		return l;
	}

	function performTopoSort(topoSortedNodes,constraints){
		topoSortedNodes.forEach(function(n){
			var constraintsAssociatedWithNode = 
				constraints.filter(function(c){
					return c.source.node === n;
				});

			constraintsAssociatedWithNode.forEach(function(c){
				var sourceNode = c.source.node;
				var sourceAttrs = c.source.attrs;

				console.log("=== setting ", sourceAttrs, " for node ", sourceNode.getAttributeNS(null,"id"),"===");

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
						toReturn = destNodeAttr.expr.apply(destNode,destAttributeValues);
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


	return {
		Constraint : Constraint,
		NodeAttr : NodeAttr,
		resolveGraphicalConstraints : function(visualObjects,constraints){
			topoSortedNodes = topoSortNodes(visualObjects,constraints);
			console.log("topoSortedNodes",topoSortedNodes);
			performTopoSort(topoSortedNodes,constraints);
		},
		sum : sum
	}

}
