define(["lib/svg"],
	function(svg){

		var log = false; 	//TODO: set this in some global prefs.js

		var LABEL_PADDING = 10;

		function identity(o){return o;}

		//function sum(a,b){return a + b};

		function sum(){
			var toReturn = 0;
			for(var i = 0; i < arguments.length; i++){
				toReturn += arguments[i];
			}
			return toReturn;
		}


		//higher order function used for padding and stuff
		function inc(i){
			return function(n){
				return n + i;
			};
		}

		function dec(i){
			return function(n){
				return n - i;
			};
		}

		function compose(){
			//takes an array of functions as input, returns a function which call the given functions in order, taking result of prev call and passing it into next; finally, returns result

			var args = Array.prototype.slice.call(arguments);
			return function(){
				var r,f;
				/*jsl:ignore*/
				while(f = args.pop()){
				/*jsl:end*/
					r = f.apply(this,arguments);
				}
				return r;
			};
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
			};
		}

		function NodeAttrExpr(node,attributeNameOrNames,expression){
			if(!(attributeNameOrNames instanceof Array)){
				attributeNameOrNames  = [attributeNameOrNames];
			}

			expression = expression || identity;

			return {
				nodeAttrs : attributeNameOrNames.map(function(attr){
					return NodeAttr(node,attr);
				}),
				expr : expression
			};
		}

		function NodeAttr(node,attr){
			return {
				node : node,
				attr : attr,
				toString : function(){
					return "(" + node.id + "," + attr + ")";
				},
				equals : function(nodeAttr){
					return this.node === nodeAttr.node && this.attr === nodeAttr.attr;
				}
			};
		}

		function topoSortNodes(constraints){

			function noIncomingEdges(n){

				var toReturn= !edges.some(function(e){
					return e.dest.equals(n);
				});

				if(log) console.log(n.toString(),toReturn);

				return toReturn;
			}

			function unique(arr){
				return arr.reduce(function(a,b){
						return a.filter(function(nodeAttr){return nodeAttr.equals(b);}).length ? a : a.concat(b);},[]);

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
							if(d.nodeAttrs.indexOf(undefined) !== -1){
								debugger;
							}
							return d.nodeAttrs;
						}).reduce(flatten,[]));
			}).reduce(flatten,[]);

			//eliminate duplicate nodes
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
					map(function(nae){return nae.nodeAttrs;})	//so then we have NodeAttr[][]
					.reduce(flatten,[])	//then we have NodeAttr[]
					.map(function(d){
						return {
							source : c.source,
							dest : d,
							equals : function(node){
								return this === node;
							}
						};
					});
			}).reduce(flatten,[]);

			edges = edges.filter(function(edge){
					//if(edge.source.node === edge.dest.node){ debugger;}
					return edge.source.node !== edge.dest.node;
				});

			function printEdges(nodeList){
				/*jsl:ignore*/
				if(log) console.log("edges : ", nodeList.map(function(n){return "{" + n.source.toString() + "," + n.dest.toString() + "}"}).join(","));
				/*jsl:end*/
			}
		
			printEdges(edges);

			var s = nodes.filter(noIncomingEdges);
			var l = [];

			function printNodes(title,nodeList){
				/*jsl:ignore*/
				if(log) console.log(title + " : ", nodeList.map(function(n){return n.toString()}).join(","));
				/*jsl:end*/
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
							edges.filter(function(e){return e.source.equals(n);}));

					edgesCorrespondingToThisNode
						.map(function(e){return e.dest;})	
						.forEach(function(destNode){
							visit(destNode,nodesOnStack);});

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

				var constraintsAssociatedWithNode = 
					constraints.filter(function(c){
						return c.source.equals(n);
					});

				//if(n.node.id === "nameText") debugger;

				constraintsAssociatedWithNode.forEach(function(c){
					var sourceNode = c.source.node;
					var sourceAttr = c.source.attr;

					if(log) console.log("=== setting ", sourceAttr, " for node ", sourceNode.id,"===");

					var attrValues = c.dest.map(function(destNodeAttrExpr){
						var destNodeAttrs = destNodeAttrExpr.nodeAttrs;


						var destAttributeValues = 
							destNodeAttrs.map(function(destNodeAttr){
								var destNode = destNodeAttr.node;
								var destAttr = destNodeAttr.attr;

								//FIXME: SVGLocatable would be more accurate and preferred, but the SVGLocatable interface is not currently exposed to js in chromium, possible other browsers as well
								if(destNode instanceof Node){

									//same thing here: SVGLocatable would be preferred
									var bbox;
									if(sourceNode instanceof Node){
										bbox = svg.getBBoxInElementSpace(destNode,sourceNode); 
									}else if(sourceNode.pathSegType){
										bbox = svg.getBBoxInElementSpace(destNode,sourceNode.pathRef);
									}else{
										bbox = svg.getBBoxInCanvasSpace(destNode);
									}
			
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
											return destNode.getAttributeNS(null,destAttr);
									}
								}else{
									//assume it is some other kind of object, and access the value as a regular js property
									return destNode[destAttr];
								}
							}); 

						var toReturn;
						if(destAttributeValues.length > 1){
							toReturn = destNodeAttrExpr.expr.apply(this,destAttributeValues); //TODO: parameterize the "this" object
						}else{
							toReturn = destNodeAttrExpr.expr(destAttributeValues.pop());
						}

						if(log) console.log("computed ", toReturn," for nodeAttrs ", destNodeAttrs.toString());

						return toReturn;
					});

					var constraintValue = c.expr.apply(sourceNode,attrValues);
					
					//constraintValue might return undefined, in which case we don't set it
					if(constraintValue !== undefined){

						if(log) console.log("setting ",sourceNode.id,sourceAttr,constraintValue);

						//width, height and everything else
						//FIXME: see other note regarding SVGLocatable
						if(sourceNode instanceof Node){
							sourceNode.setAttributeNS(null,sourceAttr,constraintValue);
						}else{
							sourceNode[sourceAttr]=constraintValue;
						}

					}
				});
			});
		}


		return {
			Constraint : Constraint,
			NodeAttrExpr : NodeAttrExpr,
			NodeAttr : NodeAttr,
			resolveGraphicalConstraints : function(constraints){
				var topoSortedNodes = topoSortNodes(constraints);
				if(log) console.log("topoSortedNodes",topoSortedNodes);
				performTopoSort(topoSortedNodes,constraints);
			},
			sum : sum,
			inc : inc,
			dec : dec
		};

	}
);
