define(["helpers","behaviours"],
	function(h,behaviours){
		var api = {
			remove : function(){
				//remove all constraints where he is the source from the constraint graph
				//his descendants too
				//debugger;
				//console.log("removing",this);

				//first get his descendants
				//any removable, call their remove method. assume this recursively removes them.
				var descendants = Array.prototype.slice.call(this.querySelectorAll("*"));
				descendants.filter(function(e){
					return e.behaviours && e.behaviours[behaviours.REMOVABLE];
				}).forEach(function(e){
					e.remove();
				});

				var thisAndDescendants = descendants.concat(this);

				thisAndDescendants.forEach(function(node){ 

					//console.log("removing sub-node",node);

					//remove all splines which are attached to him from the constraint graph
					var allSplinesInConstraintGraph = 
						this.env.constraintGraph.filter(function(c){
							//get all splines
							//console.log("c.source.node.pathSegType",c.source.node.pathSegType);
							//console.log("c.source.node.pathRef",c.source.node.pathRef);
							return c.source.node.pathSegType && c.source.node.pathRef && c.source.node.pathRef.behaviours[behaviours.REMOVABLE]; 
						});

					//console.log("allSplinesInConstraintGraph",allSplinesInConstraintGraph);

					var splinesTargetingNode = 
						allSplinesInConstraintGraph.filter(function(c){
							//flatten out dests
							var allNodeAttrs = c.dest.reduce(function(a,b){return a.concat(b.nodeAttrs);},[]);

							var nodeAttrsTargetingThis = 
								allNodeAttrs.filter(function(nodeAttr){return nodeAttr.node === node;},this); 

							return nodeAttrsTargetingThis.length; 

						});

					//console.log("splinesTargetingNode",splinesTargetingNode);

					var splinesToRemove =
						splinesTargetingNode.map(function(c){
							//get source node
							return c.source.node.pathRef;
						});

					var uniqueSplinesToRemove = h.unique(splinesToRemove);  

					//console.log("uniqueSplinesToRemove",uniqueSplinesToRemove);

					uniqueSplinesToRemove.forEach(function(spline){spline.remove();}); 

					//remove constraints in which this is the source from the constraint graph
					//we also have a case handling path segments. 
					var constraintsWithThisAsSource = this.env.constraintGraph.filter(function(c){
						return c.source.node === node
							|| (c.source.node.pathRef && c.source.node.pathRef === node);
					});

					//console.log("constraintsWithThisAsSource",constraintsWithThisAsSource);

					constraintsWithThisAsSource.forEach(function(c){
						h.removeFromList(c,this.env.constraintGraph);
					},this);

					//remove destination nodeAttrs from the constraint graph
					this.env.constraintGraph.forEach(function(c){

						c.dest.forEach(function(nodeAttrExpr){
							var nodeAttrsToRemove = 
								nodeAttrExpr.nodeAttrs.filter(
									function(nodeAttr){
										return nodeAttr.node === node
											|| (nodeAttr.node.pathRef && nodeAttr.node.pathRef === node);
									});

							//console.log("nodeAttrsToRemove",nodeAttrsToRemove);
							nodeAttrsToRemove.forEach(function(na){
								h.removeFromList(na,nodeAttrExpr.nodeAttrs);
							}); 
						});

						//cleanup empty nodeAttrs
						var destsToRemove = c.dest.filter(function(nodeAttrExpr){
							return !nodeAttrExpr.nodeAttrs.length;
						});
						//console.log("destsToRemove",destsToRemove); 
						destsToRemove.forEach(function(dest){
							h.removeFromList(dest,c.dest);
						});
					},this);

					//cleanup constraints without dests
					var constraintsToRemove = this.env.constraintGraph.filter(function(c){
						return !c.dest.length;
					},this);

					//console.log("constraintsToRemove",constraintsToRemove); 
					constraintsToRemove.forEach(function(c){
						h.removeFromList(c,this.env.constraintGraph);
					},this);
				},this);

				//remove him from dom
				//we guard here, because in the case where we have multiple levels of hierarchy, it's posisble that a child of this icon will have already deleted his child
				if(this.parentNode) this.parentNode.removeChild(this);
			}
		};


		return function(env){

			this.behaviours = this.behaviours || {};

			this.behaviours.REMOVABLE = true;

			this.env = env;

			h.mixin(api,this);
		};
	
	}
);
