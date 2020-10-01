/**
 * Copyright (C) 2011 Jacob Beard
 * Released under GNU GPL, read the file 'COPYING' for more information
 **/
define(['lib/svg'], function (svg) {
	let log = false; //TODO: set this in some global prefs.js

	let LABEL_PADDING = 10;

	function identity(o) {
		return o;
	}

	//function sum(a,b){return a + b};

	function sum() {
		let toReturn = 0;
		for (let i = 0; i < arguments.length; i++) {
			toReturn += arguments[i];
		}
		return toReturn;
	}

	//higher order function used for padding and stuff
	function inc(i) {
		return function (n) {
			return n + i;
		};
	}

	function dec(i) {
		return function (n) {
			return n - i;
		};
	}

	function compose() {
		//takes an array of functions as input, returns a function which call the given functions in order, taking result of prev call and passing it into next; finally, returns result

		let args = Array.prototype.slice.call(arguments);
		return function () {
			let r, f;
			/*jsl:ignore*/
			while ((f = args.pop())) {
				/*jsl:end*/
				r = f.apply(this, arguments);
			}
			return r;
		};
	}

	function Constraint(source, destinationOrDestinations, layoutAction) {
		if (!(destinationOrDestinations instanceof Array)) {
			destinationOrDestinations = [destinationOrDestinations];
		}

		layoutAction = layoutAction || identity;

		return {
			source: source, //NodeAttr
			dest: destinationOrDestinations, //NodeAttrExpression[]
			expr: layoutAction,
		};
	}

	function NodeAttrExpr(node, attributeNameOrNames, expression) {
		if (!(attributeNameOrNames instanceof Array)) {
			attributeNameOrNames = [attributeNameOrNames];
		}

		expression = expression || identity;

		return {
			nodeAttrs: attributeNameOrNames.map(function (attr) {
				return NodeAttr(node, attr);
			}),
			expr: expression,
		};
	}

	function NodeAttr(node, attr) {
		return {
			node: node,
			attr: attr,
			toString: function () {
				return '(' + node.id + ',' + attr + ')';
			},
			equals: function (nodeAttr) {
				return (
					this.node === nodeAttr.node && this.attr === nodeAttr.attr
				);
			},
		};
	}

	function topoSortNodes(constraints) {
		function noIncomingEdges(n) {
			let toReturn = !edges.some(function (e) {
				return e.dest.equals(n);
			});

			if (log) console.log(n.toString(), toReturn);

			return toReturn;
		}

		function unique(arr) {
			return arr.reduce(function (a, b) {
				return a.filter(function (nodeAttr) {
					return nodeAttr.equals(b);
				}).length
					? a
					: a.concat(b);
			}, []);

			/*
				return arr.filter(function(nodeAttr){
					return arr.filter(function(nodeAttr2){
						return nodeAttr.equals(nodeAttr2);	
					}).length > 1;
				})
				*/
		}

		function flatten(a, b) {
			return a.concat(b);
		}

		function pathSegListToJsArray(pathSegList) {
			let toReturn = [];
			for (let i = 0; i < pathSegList.numberOfItems; i++) {
				toReturn.push(pathSegList.getItem(i));
			}
			return toReturn;
		}

		let nodes = constraints
			.map(function (c) {
				return [c.source].concat(
					c.dest
						.map(function (d) {
							if (d.nodeAttrs.indexOf(undefined) !== -1) {
								debugger;
							}
							return d.nodeAttrs;
						})
						.reduce(flatten, [])
				);
			})
			.reduce(flatten, []);

		function nodeExprIsTransitivePathOntoSegs(n) {
			return (
				n.node.localName &&
				n.node.localName === 'path' &&
				(n.attr === 'd' || n.attr === 'pathSegList')
			);
		}

		//eliminate duplicate nodes
		nodes = unique(nodes);

		printNodes('nodes', nodes);

		//console.log("nodes to sort: ",;

		//get a flattened array of NodeAttr -> NodeAttr edges
		//source:nodeAttr
		//dest:nodeAttrExpr[]
		//get nodeAttr[] from each
		//flatten them
		//dest.nodeAttrs	//get all of the nodeAttrs
		//.nodeAttr
		//.node
		let edges = constraints
			.map(function (c) {
				return c.dest
					.map(function (nae) {
						return nae.nodeAttrs;
					}) //so then we have NodeAttr[][]
					.reduce(flatten, []) //then we have NodeAttr[]
					.map(function (d) {
						return {
							source: c.source,
							dest: d,
							equals: function (node) {
								return this === node;
							},
						};
					});
			})
			.reduce(flatten, []);

		edges = edges.filter(function (edge) {
			//if(edge.source.node === edge.dest.node){ debugger;}
			return edge.source.node !== edge.dest.node;
		});

		let segAttrs = ['x', 'y', 'x1', 'y1', 'x2', 'y2'];

		let transitivePathNodeExpr = nodes.filter(
			nodeExprIsTransitivePathOntoSegs
		);

		console.log('transitivePathNodeExpr', transitivePathNodeExpr);

		//add transitive nodes of paths onto its segments
		let transitivePathSegmentEdges = transitivePathNodeExpr
			.map(function (n) {
				return pathSegListToJsArray(n.node.pathSegList)
					.map(function (seg) {
						return segAttrs
							.map(function (attr) {
								if (
									!edges.some(function (e) {
										return (
											e.source === seg && e.attr === attr
										);
									})
								) {
									//may return undefined
									return {
										source: n,
										dest: NodeAttr(seg, attr),
										equals: function (node) {
											return this === node;
										},
									};
								} else {
									console.log('filtered out ', seg, attr);
									return undefined;
								}
							})
							.filter(function (e) {
								return e;
							}); //filter out undefined
					})
					.reduce(flatten, []);
			})
			.reduce(flatten, []);

		let transitivePathSegmentNodes = transitivePathSegmentEdges.map(
			function (c) {
				return c.dest;
			}
		);

		console.log('transitivePathSegmentNodes', transitivePathSegmentNodes);
		console.log('transitivePathSegmentEdges', transitivePathSegmentEdges);

		nodes = nodes.concat(transitivePathSegmentNodes);

		nodes = unique(nodes);

		edges = edges.concat(transitivePathSegmentEdges);

		function printEdges(nodeList) {
			/*jsl:ignore*/
			if (log)
				console.log(
					'edges : ',
					nodeList
						.map(function (n) {
							return (
								'{' +
								n.source.toString() +
								',' +
								n.dest.toString() +
								'}'
							);
						})
						.join(',')
				);
			/*jsl:end*/
		}

		printEdges(edges);

		let s = nodes.filter(noIncomingEdges);
		let l = [];

		function printNodes(title, nodeList) {
			/*jsl:ignore*/
			if (log)
				console.log(
					title + ' : ',
					nodeList
						.map(function (n) {
							return n.toString();
						})
						.join(',')
				);
			/*jsl:end*/
		}

		printNodes('s', s);

		s.forEach(function (n) {
			visit(n, []);
		});

		function visit(n, nodesOnStack) {
			if (nodesOnStack.indexOf(n) !== -1) {
				throw new Error('Dependency graph has cycle.');
			} else {
				nodesOnStack = nodesOnStack.concat(n);

				let edgesCorrespondingToThisNode = unique(
					edges.filter(function (e) {
						return e.source.equals(n);
					})
				);

				edgesCorrespondingToThisNode
					.map(function (e) {
						return e.dest;
					})
					.forEach(function (destNode) {
						visit(destNode, nodesOnStack);
					});

				l.push(n);
			}
		}

		printNodes('l', l);

		return l;
	}

	/**
			for each topo-sorted node
			get the value of his dependencies (or the defaul value set on the node, if he has no dependencies)
			transform the value as needed
			set the new value on the node	(which I think gets encoded in DOM... as opposed to keeping some kind of nodeattr-to-value map or something...)
		*/
	function performTopoSort(topoSortedNodes, constraints) {
		topoSortedNodes.forEach(function (n) {
			let constraintsAssociatedWithNode = constraints.filter(function (
				c
			) {
				return c.source.equals(n);
			});

			//if(n.node.id === "nameText") debugger;

			constraintsAssociatedWithNode.forEach(function (c) {
				let sourceNode = c.source.node;
				let sourceAttr = c.source.attr;

				if (log)
					console.log(
						'=== setting ',
						sourceAttr,
						' for node ',
						sourceNode.id,
						'==='
					);

				let attrValues = c.dest.map(function (destNodeAttrExpr) {
					let destNodeAttrs = destNodeAttrExpr.nodeAttrs;

					let destAttributeValues = destNodeAttrs.map(function (
						destNodeAttr
					) {
						let destNode = destNodeAttr.node;
						let destAttr = destNodeAttr.attr;

						//FIXME: SVGLocatable would be more accurate and preferred, but the SVGLocatable interface is not currently exposed to js in chromium, possible other browsers as well
						if (destNode instanceof Node) {
							//same thing here: SVGLocatable would be preferred
							let bbox;
							if (sourceNode instanceof Node) {
								bbox = svg.getBBoxInElementSpace(
									destNode,
									sourceNode
								);
							} else if (sourceNode.pathSegType) {
								bbox = svg.getBBoxInElementSpace(
									destNode,
									sourceNode.pathRef
								);
							} else {
								bbox = svg.getBBoxInCanvasSpace(destNode);
							}

							switch (destAttr) {
								case 'x':
									return bbox.x;
								case 'y':
									return bbox.y;
								case 'width':
									return bbox.width;
								case 'height':
									return bbox.height;
								case 'bbox':
									return bbox;
								default:
									return (
										destNode[destAttr] ||
										destNode.getAttributeNS(null, destAttr)
									);
							}
						} else {
							//assume it is some other kind of object, and access the value as a regular js property
							return destNode[destAttr];
						}
					});

					let toReturn;
					if (destAttributeValues.length > 1) {
						toReturn = destNodeAttrExpr.expr.apply(
							this,
							destAttributeValues
						); //TODO: parameterize the "this" object
					} else {
						toReturn = destNodeAttrExpr.expr(
							destAttributeValues.pop()
						);
					}

					if (log)
						console.log(
							'computed ',
							toReturn,
							' for nodeAttrs ',
							destNodeAttrs.toString()
						);

					return toReturn;
				});

				let constraintValue = c.expr.apply(sourceNode, attrValues);

				//constraintValue might return undefined, in which case we don't set it
				if (constraintValue !== undefined) {
					if (log)
						console.log(
							'setting ',
							sourceNode.id,
							sourceAttr,
							constraintValue
						);

					//width, height and everything else
					//FIXME: see other note regarding SVGLocatable
					if (sourceNode instanceof Node) {
						sourceNode.setAttributeNS(
							null,
							sourceAttr,
							constraintValue
						);
					} else {
						sourceNode[sourceAttr] = constraintValue;
					}
				}
			});
		});
	}

	return {
		Constraint: Constraint,
		NodeAttrExpr: NodeAttrExpr,
		NodeAttr: NodeAttr,
		resolveGraphicalConstraints: function (constraints) {
			let topoSortedNodes = topoSortNodes(constraints);
			if (log) console.log('topoSortedNodes', topoSortedNodes);
			performTopoSort(topoSortedNodes, constraints);
		},
		sum: sum,
		inc: inc,
		dec: dec,
	};
});
