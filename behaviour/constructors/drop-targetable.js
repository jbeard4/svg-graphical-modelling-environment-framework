/**
* Copyright (C) 2011 Jacob Beard
* Released under GNU GPL, read the file 'COPYING' for more information
**/
define(["c","helpers","behaviour/constructors/highlightable"],

	function(cm,h,setupHighlightable){
		//TODO: change the parameter names
		//TODO: make the constraint setup function more flexible?
		function setupDropTarget(env,icon,spacing,setupWrapConstraints){

			$(this).addClass("drop-target");

			setupHighlightable(this);	//drop target must be highlightable

			this.behaviours.DROP_TARGET = true;

			env.hookElementEventsToStatechart(this,["mouseover","mouseout"],false);

			//make these things public properties... make them addressable as "dropconstraints"

			icon.thisChildren = [];	//TODO: we could encode this in DOM

			this.dropShape = function(shape){
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
				if(p.thisChildren){
					h.removeFromList(shape,p.thisChildren);
				} 

				["thisXConstraint",
					"thisYConstraint",
					"thisWidthConstraint",
					"thisHeightConstraint"].forEach(function(prop){

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

				},this);

				//now go ahead and add him to the new icon
				icon.thisChildren.push(shape); 

				//furthermore, move stuff to be children of the group
				shape.parentNode.removeChild(shape);

				//TODO: we may want a separate group just for these children
				icon.appendChild(shape);	

				//containment relationship... for all of his targets
				//minx, miny for all shapes he contains
				//maxx, maxy for all shapes he contains
				//debugger;
				if(setupWrapConstraints){
					if(!icon.thisXConstraint){
						icon.thisXConstraint =
							cm.Constraint(
								cm.NodeAttr(this,"x"),
								[cm.NodeAttrExpr(this,"x"),cm.NodeAttrExpr(shape,"x",cm.dec(spacing.leftPadding))],
								Math.min
							);

						icon.thisYConstraint =
							cm.Constraint(
								cm.NodeAttr(this,"y"),
								[cm.NodeAttrExpr(this,"y"),cm.NodeAttrExpr(shape,"y",cm.dec(spacing.topPadding))],
								Math.min
							);

						icon.thisWidthConstraint =
							cm.Constraint(
								cm.NodeAttr(this,"width"),
								[cm.NodeAttrExpr(this,"x"),
									cm.NodeAttrExpr(this,["x","width"],cm.sum),
									cm.NodeAttrExpr(shape,["x","width"],cm.sum)],
								function(thisX,thisRightX){
									//TODO: read arbitrary arguments for second parameter

									var args = Array.prototype.slice.call(arguments);
									args = args.slice(2);
									/*jsl:ignore*/
									var rightXArgs = args.map(function(shapeRightX){return shapeRightX - thisX});
									/*jsl:end*/
									var rightX = Math.max.apply(this,rightXArgs); 
									var rightXPlusPadding = rightX + spacing.rightPadding; 
									rightXPlusPadding = Math.max(rightXPlusPadding,thisRightX - thisX);
									return rightXPlusPadding >= spacing.minWidth ? rightXPlusPadding : spacing.minWidth; 
								}
							);
					
						icon.thisHeightConstraint = 
							cm.Constraint(
								cm.NodeAttr(this,"height"),
								[cm.NodeAttrExpr(this,"y"),
									cm.NodeAttrExpr(this,["y","height"],cm.sum),
									cm.NodeAttrExpr(shape,["y","height"],cm.sum)],
								function(thisY,thisBottomY){
									//TODO: read arbitrary arguments for second parameter
									var args = Array.prototype.slice.call(arguments);
									args = args.slice(2);
									/*jsl:ignore*/
									var bottomYArgs = args.map(function(shapeBottomY){return shapeBottomY - thisY});
									/*jsl:end*/
									var bottomY = Math.max.apply(this,bottomYArgs); 
									var bottomYPlusPadding = bottomY + spacing.leftPadding; 
									bottomYPlusPadding = Math.max(bottomYPlusPadding, thisBottomY - thisY);

									return bottomYPlusPadding  >= spacing.minHeight ? bottomYPlusPadding : spacing.minHeight ; 
								}
							);
							cm.Constraint(
								cm.NodeAttr(this,"height"),
								cm.NodeAttrExpr(shape,["y","height"],cm.sum),
								Math.max
							);

						//push
						env.constraintGraph.push(icon.thisXConstraint,
									icon.thisYConstraint,
									icon.thisWidthConstraint,
									icon.thisHeightConstraint);
					}else{
						icon.thisXConstraint.dest.push(cm.NodeAttrExpr(shape,"x"));
						icon.thisYConstraint.dest.push(cm.NodeAttrExpr(shape,"y"));
						icon.thisWidthConstraint.dest.push(cm.NodeAttrExpr(shape,["x","width"],cm.sum));
						icon.thisHeightConstraint.dest.push(cm.NodeAttrExpr(shape,["y","height"],cm.sum));
					}
				}

			};

			this.hasHierarchicalChild = function(shape){
				return icon.thisChildren.indexOf(shape) !== -1; 
			};
		}

		return setupDropTarget;
	}
);
