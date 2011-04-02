define(["c","helpers","behaviour/constructors/highlightable"],

	function(cm,h,setupHighlightable){
		//TODO: change the parameter names
		//TODO: make the constraint setup function more flexible?
		function setupDropTarget(env,classContainerRect,icon,spacing,setupWrapConstraints){

			$(classContainerRect).addClass("drop-target");

			setupHighlightable(classContainerRect);	//drop target must be highlightable

			classContainerRect.behaviours.DROP_TARGET = true;

			env.hookElementEventsToStatechart(classContainerRect,["mouseover","mouseout"],false);

			//make these things public properties... make them addressable as "dropconstraints"

			icon.classContainerRectChildren = [];	//TODO: we could encode this in DOM

			classContainerRect.dropShape = function(shape){
				//debugger;
				//console.log("here");

				//modify the shape's ctm to match the parent's
				//TODO: move this out into SVG helper lib?
				var m2 = shape.getTransformToElement(this);

				var tl = shape.transform.baseVal;
				var t = tl.numberOfItems ? tl.getItem(0) : shape.ownerSVGElement.createSVGTransform();
				var m = t.matrix;
				t.setMatrix(m2);
				tl.initialize(t);

				//remove him from previous drop target, if it exists
				//bookkeeping, bookkeeping...
				var p = shape.parentNode;
				if(p.classContainerRectChildren){
					h.removeFromList(shape,p.classContainerRectChildren);
				} 

				["classContainerRectXConstraint",
					"classContainerRectYConstraint",
					"classContainerRectWidthConstraint",
					"classContainerRectHeightConstraint"].forEach(function(prop){

					var constraint = p[prop];

					if(constraint){
						//here we are trying to weed out the nodeAttrs in this constraint dest for which 'shape' is the node
						constraint.dest.forEach(function(nodeAttrExpr){
							nodeAttrExpr.nodeAttrs = nodeAttrExpr.nodeAttrs.filter(function(nodeAttr){
								return nodeAttr.node !== shape;
							}); 
						});

						//filter out empty nodeAttrs
						constraint.dest = constraint.dest.filter(function(nodeAttrExpr){
							return nodeAttrExpr.nodeAttrs.length; 
						});

						if(!constraint.dest){
							//remove constraint from graph and delete property on the parent object
							h.removeFromList(constraint,env.constraintGraph);
							delete p[prop];	
						}
					}

				});

				//now go ahead and add him to the new icon
				icon.classContainerRectChildren.push(shape); 

				//furthermore, move stuff to be children of the group
				shape.parentNode.removeChild(shape);

				//TODO: we may want a separate group just for these children
				icon.appendChild(shape);	

				//containment relationship... for all of his targets
				//minx, miny for all shapes he contains
				//maxx, maxy for all shapes he contains
				//debugger;
				if(setupWrapConstraints){
					if(!icon.classContainerRectXConstraint){
						icon.classContainerRectXConstraint =
							cm.Constraint(
								cm.NodeAttr(this,"x"),
								[cm.NodeAttrExpr(this,"x"),cm.NodeAttrExpr(shape,"x",cm.dec(spacing.leftPadding))],
								Math.min
							);

						icon.classContainerRectYConstraint =
							cm.Constraint(
								cm.NodeAttr(this,"y"),
								[cm.NodeAttrExpr(this,"y"),cm.NodeAttrExpr(shape,"y",cm.dec(spacing.topPadding))],
								Math.min
							);

						icon.classContainerRectWidthConstraint =
							cm.Constraint(
								cm.NodeAttr(this,"width"),
								[cm.NodeAttrExpr(this,"x"),
									cm.NodeAttrExpr(this,["x","width"],cm.sum),
									cm.NodeAttrExpr(shape,["x","width"],cm.sum)],
								function(classContainerRectX,classContainerRectRightX){
									//TODO: read arbitrary arguments for second parameter

									var args = Array.prototype.slice.call(arguments);
									args = args.slice(2);
									/*jsl:ignore*/
									var rightXArgs = args.map(function(shapeRightX){return shapeRightX - classContainerRectX});
									/*jsl:end*/
									var rightX = Math.max.apply(this,rightXArgs); 
									var rightXPlusPadding = rightX + spacing.rightPadding; 
									rightXPlusPadding = Math.max(rightXPlusPadding,classContainerRectRightX - classContainerRectX);
									return rightXPlusPadding >= spacing.minWidth ? rightXPlusPadding : spacing.minWidth; 
								}
							);
					
						icon.classContainerRectHeightConstraint = 
							cm.Constraint(
								cm.NodeAttr(this,"height"),
								[cm.NodeAttrExpr(this,"y"),
									cm.NodeAttrExpr(this,["y","height"],cm.sum),
									cm.NodeAttrExpr(shape,["y","height"],cm.sum)],
								function(classContainerRectY,classContainerRectBottomY){
									//TODO: read arbitrary arguments for second parameter
									var args = Array.prototype.slice.call(arguments);
									args = args.slice(2);
									/*jsl:ignore*/
									var bottomYArgs = args.map(function(shapeBottomY){return shapeBottomY - classContainerRectY});
									/*jsl:end*/
									var bottomY = Math.max.apply(this,bottomYArgs); 
									var bottomYPlusPadding = bottomY + spacing.leftPadding; 
									bottomYPlusPadding = Math.max(bottomYPlusPadding, classContainerRectBottomY - classContainerRectY);

									return bottomYPlusPadding  >= spacing.minHeight ? bottomYPlusPadding : spacing.minHeight ; 
								}
							);
							cm.Constraint(
								cm.NodeAttr(this,"height"),
								cm.NodeAttrExpr(shape,["y","height"],cm.sum),
								Math.max
							);

						//push
						env.constraintGraph.push(icon.classContainerRectXConstraint,
									icon.classContainerRectYConstraint,
									icon.classContainerRectWidthConstraint,
									icon.classContainerRectHeightConstraint);
					}else{
						icon.classContainerRectXConstraint.dest.push(cm.NodeAttrExpr(shape,"x"));
						icon.classContainerRectYConstraint.dest.push(cm.NodeAttrExpr(shape,"y"));
						icon.classContainerRectWidthConstraint.dest.push(cm.NodeAttrExpr(shape,["x","width"],cm.sum));
						icon.classContainerRectHeightConstraint.dest.push(cm.NodeAttrExpr(shape,["y","height"],cm.sum));
					}
				}

			};

			classContainerRect.hasHierarchicalChild = function(shape){
				return icon.classContainerRectChildren.indexOf(shape) !== -1; 
			};
		}

		return setupDropTarget;
	}
);
