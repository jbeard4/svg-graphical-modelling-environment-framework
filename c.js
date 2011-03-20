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
			source : source,	//NodeAttr
			dest : destinationOrDestinations,	//NodeAttrExpression[]
			expr : layoutAction
		}
	}

	function NodeAttrExpr(node,attributeNameOrNames,expression){
		if(!(attributeNameOrNames instanceof Array)){
			attributeNameOrNames  = [attributeNameOrNames];
		}

		expression = expression || identity;

		return {
			nodeAttrs : attributeNameOrNames.map(function(attr){
				return NodeAttr(node,attr)
			}),
			expr : expression
		};
	}

	function NodeAttr(node,attr){
		return {
			node : node,
			attr : attr,
			toString : function(){
				return "(" + node.id + "," + attr + ")"
			},
			equals : function(nodeAttr){
				return this.node === nodeAttr.node && this.attr === nodeAttr.attr;
			}
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

	function topoSortNodes(constraints){

		function noIncomingEdges(n){

			var toReturn= !edges.some(function(e){
				return e.dest.equals(n);
			});

			console.log(n.toString(),toReturn);

			return toReturn;
		}

		function unique(arr){
			return arr.reduce(function(a,b){
					return a.filter(function(nodeAttr){return nodeAttr.equals(b)}).length ? a : a.concat(b)},[]);

			/*
			return arr.filter(function(nodeAttr){
				return arr.filter(function(nodeAttr2){
					return nodeAttr.equals(nodeAttr2);	
				}).length > 1;
			})
			*/
		}

		function flatten(a,b){
			return a.concat(b);
		}


		var nodes = constraints.map(function(c){
			return [c.source].concat(
					c.dest.map(function(d){
						return d.nodeAttrs
					}).reduce(flatten,[]))
		}).reduce(flatten,[]);

		nodes = unique(nodes);

		printNodes("nodes",nodes);

		//console.log("nodes to sort: ",;

		//get a flattened array of NodeAttr -> NodeAttr edges
		//source:nodeAttr
		//dest:nodeAttrExpr[]
			//get nodeAttr[] from each
			//flatten them
		//dest.nodeAttrs	//get all of the nodeAttrs
			//.nodeAttr	
			//.node
		var edges = constraints.map(function(c){
			return c.dest.
				map(function(nae){return nae.nodeAttrs})	//so then we have NodeAttr[][]
				.reduce(flatten,[])	//then we have NodeAttr[]
				.map(function(d){
					return {
						source : c.source,
						dest : d,
						equals : function(node){
							return this === node;
						}
					}
				})
		}).reduce(flatten,[]);

		function printEdges(nodeList){
			console.log("edges : ", nodeList.map(function(n){return "{" + n.source.toString() + "," + n.dest.toString() + "}"}).join(","))
		}
	
		printEdges(edges);

		var s = nodes.filter(noIncomingEdges);
		var l = [];

		function printNodes(title,nodeList){
			console.log(title + " : ", nodeList.map(function(n){return n.toString()}).join(","))
		}

		printNodes("s",s);

		s.forEach(function(n){
			visit(n,[]);
		});

		function visit(n,nodesOnStack){
			if(nodesOnStack.indexOf(n) !== -1){
				throw new Error("Dependency graph has cycle.");
			}else{

				nodesOnStack = nodesOnStack.concat(n);

				var edgesCorrespondingToThisNode = 
					unique(
						edges.filter(function(e){return e.source.equals(n)}));

				edgesCorrespondingToThisNode
					.map(function(e){return e.dest})	
					.forEach(function(destNode){
						visit(destNode,nodesOnStack)});

				l.push(n);
			}
		}

		printNodes("l",l);

		return l;
	}

	/**
		for each topo-sorted node
		get the value of his dependencies (or the defaul value set on the node, if he has no dependencies)
		transform the value as needed
		set the new value on the node	(which I think gets encoded in DOM... as opposed to keeping some kind of nodeattr-to-value map or something...)
	*/
	function performTopoSort(topoSortedNodes,constraints){
		topoSortedNodes.forEach(function(n){
			console.log("foo",n.toString());

			var constraintsAssociatedWithNode = 
				constraints.filter(function(c){
					return c.source.equals(n);
				});

			constraintsAssociatedWithNode.forEach(function(c){
				var sourceNode = c.source.node;
				var sourceAttr = c.source.attr;

				console.log("=== setting ", sourceAttr, " for node ", sourceNode.id,"===");

				var attrValues = c.dest.map(function(destNodeAttrExpr){
					var destNodeAttrs = destNodeAttrExpr.nodeAttrs;


					var destAttributeValues = 
						destNodeAttrs.map(function(destNodeAttr){
							var destNode = destNodeAttr.node;
							var destAttr = destNodeAttr.attr;

							var bbox = svg.getBBoxInElementSpace(destNode,sourceNode);
	
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
						toReturn = destNodeAttrExpr.expr.apply(this,destAttributeValues); //TODO: parameterize the "this" object
					}else{
						toReturn = destNodeAttrExpr.expr(destAttributeValues.pop());
					}

					//console.log("computed ", toReturn," for node ", destNode.getAttributeNS(null,"id"), " and attrs ", destNodeAttrs);

					return toReturn;
				});

				var constraintValue = c.expr.apply(sourceNode,attrValues);
				
				setAttr(sourceNode,sourceAttr,constraintValue);
			});
		});
	}


	return {
		Constraint : Constraint,
		NodeAttrExpr : NodeAttrExpr,
		NodeAttr : NodeAttr,
		resolveGraphicalConstraints : function(visualObjects,constraints){
			topoSortedNodes = topoSortNodes(constraints);
			console.log("topoSortedNodes",topoSortedNodes);
			performTopoSort(topoSortedNodes,constraints);
		},
		sum : sum
	}

}
