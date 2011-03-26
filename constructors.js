/**
	These are constructor functions for creating CS entities.
	This would get generated automatically from the Icon Definition model
**/


function setupConstructors(defaultStatechartInstance,cm,constraintGraph,requestLayout,svg,edgeLayer,nodeLayer,controlLayer){

	function propNumtoPropString(propNum){
		var propStr = propNum || "";
		var propX = "x" + propStr;
		var propY = "y" + propStr;

		return {
			x : propX,
			y : propY
		}

	}
	function mixin(from,to){
		for(var p in from){
			if(from.hasOwnProperty(p)) to[p] = from[p];
		}
	}

	function hookElementEventsToStatechart(element,events,stopPropagation){
		events.forEach(function(eventName){
			element.addEventListener(eventName,function(e){
				//console.log(element,eventName);
				e.preventDefault();

				if(stopPropagation) e.stopPropagation();

				//FIXME: this is interesting. in order to not conflict with drag-and-drop behaviour (parent has arrow target), we need to not stop event propagation. when generating the environment, we will need to determine the strict conditions that require us to stop event propagation, or not
				//e.stopPropagation();	
				defaultStatechartInstance[eventName]({domEvent:e,currentTarget:element})
			},false)
		})
	}

	var controlPointDragBehaviourAPI = {
		//todo: this is not part of the api exposed to the statechart. should probably move this out, or mark it with an underscore
		localMoveTo : function(x,y,x2,y2){
			//update current segment
			this.segment[this.propStr.x] = x;
			this.segment[this.propStr.y] = y;

			//update graphical node
			this.point.cx.baseVal.value = x;
			this.point.cy.baseVal.value = y;

			this.line.x1.baseVal.value = x;
			this.line.y1.baseVal.value = y;

			//optionally update the arrow endpoints
			if(x2) this.line.x2.baseVal.value = x2;
			if(y2) this.line.y2.baseVal.value = y2;

		},
		moveTo : function(x,y){
			this.localMoveTo(x,y);

			//compute the position of the associated segment
			if(this.associatedControlPoint){

				var ox = this.associatedEndPoint.segment.x;
				var oy = this.associatedEndPoint.segment.y;

				//compute angle
				var relativeX = x - ox;
				var relativeY = y - oy;

				var a = Math.atan2(relativeX,relativeY);

				//take the angle, rotate by 180 degrees
				var a2 = a + Math.PI;
				
				//determine the current length of the associated segment (the hypotenuse of the triangle)
				var associatedX = this.associatedControlPoint.segment[this.associatedControlPoint.propStr.x];
				var associatedY = this.associatedControlPoint.segment[this.associatedControlPoint.propStr.y];

				var associatedRelativeX = associatedX - ox;
				var associatedRelativeY = associatedY - oy;

				//pythagorean theorem
				var associatedHypotenuse = Math.sqrt(Math.pow(associatedRelativeX,2) + Math.pow(associatedRelativeY,2) ); 

				var newAssociatedX = associatedHypotenuse * Math.sin(a2) + ox;
				var newAssociatedY = associatedHypotenuse * Math.cos(a2) + oy;
				
				//this.associatedControlPoint.segment[this.associatedControlPoint.propStr.x] = newAssociatedX; 
				//this.associatedControlPoint.segment[this.associatedControlPoint.propStr.x] = newAssociatedY; 

				this.associatedControlPoint.localMoveTo(newAssociatedX,newAssociatedY);
			}
		},
		remove : function(){
			//simply remove him from DOM
			this.parentNode.removeChild(this);
		}
	}

	function setupControlPointDragBehaviour(kwArgs){
		this.behaviours = this.behaviours || {};

		this.behaviours.CTRL_POINT_DRAG = true;

		hookElementEventsToStatechart(this,["mousedown"],true);

		mixin(kwArgs,this);

		mixin(controlPointDragBehaviourAPI,this);
	}

	var endPointDragBehaviourAPI = {
		//todo: this is not part of the api exposed to the statechart. should probably move this out, or mark it with an underscore
		localMoveTo : function(x,y){
			//update current segment
			this.segment.x = x;
			this.segment.y = y;

			//update graphical node
			this.x.baseVal.value = x;
			this.y.baseVal.value = y;
		},
		moveTo : function(x,y){
			var dx = x - this.segment.x;
			var dy = y - this.segment.y;

			this.localMoveTo(x,y);

			this.associatedControlPoints.forEach(function(cp){
				
				cp.localMoveTo(
					cp.segment[cp.propStr.x] + dx,
					cp.segment[cp.propStr.y] + dy,
					this.segment.x,
					this.segment.y);
			},this);
		},
		remove : function(){
			//simply remove him from DOM
			this.parentNode.removeChild(this);
		}
	}


	function setupEndPointDragBehaviour(kwArgs){
		this.behaviours = this.behaviours || {};

		this.behaviours.CTRL_POINT_DRAG = true;

		hookElementEventsToStatechart(this,["mousedown"],true);

		mixin(kwArgs,this);

		mixin(endPointDragBehaviourAPI,this);
	}


	var setupArrowEditorBehaviourAPI = {
		showControlPoints : function(){
			//create control points
			//which relate to a particular path, pathsegment (referred to by index), and properties (0,1,or 2 for endpoint, ctrlPoint 1, ctrlPoint2)
			//the statechart then knows how to interpet those. get a behaviour CONTROL_POINT_DRAGGABLE
			//although it might be better just to have a general dragging interface... yah... ok. yah, this can all live in idle don't need to be in a special state to edit curves. yah, i like it. the only question is how to get it out of editing mode. and the answer to that is... normally to click the canvas? yah. so we would need to route this event down.... ok, i can live with that. this will be part of the general deselection method anyway... I say we go for the more general approach now. 

			var numItems = this.pathSegList.numberOfItems;
			for(var i=0; i < numItems; i++){
				var nextPathSeg, cp1, cp2, endPoint;
				nextPathSeg = cp1 = cp2 = null;

				var pathSeg = this.pathSegList.getItem(i);
				//debugger

				//for the endpoint, always create an endpoint icon
				endPoint = constructors.EndPoint(pathSeg);

				this.points.push(endPoint);

				if(i < (numItems - 1) ){
					nextPathSeg = this.pathSegList.getItem(i+1);
				}

				//first is M segment so we skip it
				//last segment we can skip too

				//if current segment is not line, and next segment is not line
				if(nextPathSeg && nextPathSeg.x1 !== undefined){
					cp1 = constructors.ControlPoint(nextPathSeg,1,endPoint);
				}

				if(pathSeg.x2 !== undefined){ 
					cp2 = constructors.ControlPoint(pathSeg,2,endPoint,cp1);
				}

				if(cp2 && cp1){
					cp1.associatedControlPoint = cp2;
				}

				if(cp1){
					endPoint.associatedControlPoints.push(cp1);
					this.points.push(cp1);
				}

				if(cp2){
					endPoint.associatedControlPoints.push(cp2);
					this.points.push(cp2);
				}

			}
			
		},
		hideControlPoints : function(){
			var c;
			while(c = this.points.pop()){
				c.remove();
			}
		}
	}

	function setupArrowEditorBehaviour(){
		//register event listener
		this.behaviours = this.behaviours || {};

		this.behaviours.ARROW_EDITABLE = true;

		this.points = [];
		this.endPoints = [];

		hookElementEventsToStatechart(this,["mousedown","mouseup"],true);

		mixin(setupArrowEditorBehaviourAPI,this);

	}

	//we define this out here, because if we did it inside of the setup function, we would be create new function instances for each path object that gets set up. wastes memory	
	var drawPathBehaviourAPI = {

		willPathBeEmptyAfterRemovingNextPoint : function (){
			return this.pathSegList.numberOfItems==2;	
		},

		rollbackPoint : function (){
			this.pathSegList.removeItem(this.pathSegList.numberOfItems-2);
		},

		setEndPoint : function (x,y){
			var segList = this.pathSegList;
			var numItems = segList.numberOfItems;
			var endSeg = segList.getItem(numItems-1);

			endSeg.x = x;
			endSeg.y = y;
		},

		createNewQuadraticSegment : function (x,y,x1,y1){
			var n = this.createSVGPathSegCurvetoQuadraticAbs(x,y,x1,y1);
			this.pathSegList.appendItem(n);

			return n;
		},

		createNewLineSegment : function (x,y){
			var n = this.createSVGPathSegLinetoAbs(x,y);
			this.pathSegList.appendItem(n);
			return n;
		},

		addControlPoint : function (x,y,mirror){
			var segList = this.pathSegList;
			var numItems = segList.numberOfItems;
			var endSeg = segList.getItem(numItems-1);

			//first item will be M, second item will be the initial this drawing segment
			if(numItems > 1){
				if(endSeg.x2 === undefined && endSeg.x1 === undefined){
					//upgrade him to a quadratic
					var newSeg = this.createSVGPathSegCurvetoQuadraticAbs(endSeg.x,endSeg.y,x,y);
					segList.replaceItem(newSeg,numItems-1); 

				}
				else if(endSeg.x2 === undefined && endSeg.x1 !== undefined){
					//upgrade him to a cubic
					//var newSegX2 = x + 2*( endSeg.x1 - x );
					//var newSegY2 = y + 2*( endSeg.y1 - y );
					var newSeg = this.createSVGPathSegCurvetoCubicAbs(endSeg.x,endSeg.y,endSeg.x1,endSeg.y1,x,y);
					segList.replaceItem(newSeg,numItems-1) 

				}
				else{
					//TODO: throw error
				}
			}
		},
		setLastControlPoint : function(x,y,mirror){
			//get the last control point
			var segList = this.pathSegList;
			var numItems = segList.numberOfItems;
			var endSeg = segList.getItem(numItems-1);

			var curX = endSeg.x, curY = endSeg.y;
			var propX, propY;
			if(endSeg.x2 !== undefined ){
				propX = "x2";
			}else if(endSeg.x1  !== undefined ){
				propX = "x1";
			} 

			//debugger;
			if(endSeg.y2  !== undefined ){
				propY = "y2";
			}else if(endSeg.y1  !== undefined ){
				propY = "y1";
			} 

			//if(propX === undefined || propY === undefined) debugger;

			if(mirror){
				x = x + 2*(curX - x); 
				y = y + 2*(curY - y);
			}

			//console.log("curX",curX,"curY",curY,"x",x,"y",y,"propX",propX,"propY",propY);

			endSeg[propX] = x;
			endSeg[propY] = y;
		},
		setTarget : function(target){

			//set up the constraint graph for the target
			function getConstraintFunction(xOrY,isSource){
				return function(fromX,fromY,fromWidth,fromHeight,toX,toY,toWidth,toHeight){
					var x0 = fromX + fromWidth/2;
					var y0 = fromY + fromHeight/2;

					var x1 = toX + toWidth/2;
					var y1 = toY + toHeight/2;


					var p1 = new Point2D(x0,y0),
						p2 = new Point2D(x1,y1);

					var r1,r2;
					if(isSource){
						r1 = new Point2D(fromX,fromY);
						r2 = new Point2D(fromX + fromWidth, fromY + fromHeight);
					}else{
						r1 = new Point2D(toX,toY);
						r2 = new Point2D(toX + toWidth, toY + toHeight);
					}

					var inter = Intersection.intersectLineRectangle(p1,p2,r1,r2);

					var point = inter.points.pop();

					return point && point[xOrY];	//if there's no intersection, we might get back undefined
				}
			}


			//remove and update sourceConstraintX and sourceConstraintY to avoid arrow occlusion 
			[this.sourceConstraintX,this.sourceConstraintY].forEach(function(c){
				constraintGraph.splice(constraintGraph.indexOf(c),1);
			});


			var depList = [cm.NodeAttrExpr(this.source,"x"),
						cm.NodeAttrExpr(this.source,"y"),
						cm.NodeAttrExpr(this.source,"width"),
						cm.NodeAttrExpr(this.source,"height"),
						cm.NodeAttrExpr(target,"x"),
						cm.NodeAttrExpr(target,"y"),
						cm.NodeAttrExpr(target,"width"),
						cm.NodeAttrExpr(target,"height")];
			
			//set up target constraints
			this.targetConstraintX = 
				cm.Constraint(
					cm.NodeAttr(this,"$endX"),
					depList, 
					getConstraintFunction("x",false)
				);

			this.targetConstraintY = 
				cm.Constraint(
					cm.NodeAttr(this,"$endY"),
					depList, 
					getConstraintFunction("y",false)
				);
		
			//set up new sourceConstraintX and sourceConstraintY
			this.sourceConstraintX = 
				cm.Constraint(
					cm.NodeAttr(this,"$startX"),
					depList, 
					getConstraintFunction("x",true)
				);


			this.sourceConstraintY = 
				cm.Constraint(
					cm.NodeAttr(this,"$startY"),
					depList, 
					getConstraintFunction("y",true)
				);

			constraintGraph.push(this.sourceConstraintX,
						this.sourceConstraintY,
						this.targetConstraintX,
						this.targetConstraintY);

		},
		remove : function(){
			//remove self from dom
			this.parentNode.removeChild(this);
			
			//remove constraints
			[this.sourceConstraintX,this.sourceConstraintY,this.targetConstraintX,this.targetConstraintY].forEach(function(c){
				constraintGraph.splice(constraintGraph.indexOf(c),1);
			});

			requestLayout();
		}
	}

	function setupDrawPath(source){

		this.source = source;

		this.originalSourceConstraintX = this.sourceConstraintX = 
			cm.Constraint(
				cm.NodeAttr(this,"$startX"),
				cm.NodeAttrExpr(this.source,"bbox"),
				function(sourceBBox){
					return sourceBBox.x + sourceBBox.width/2;
				}

			);

		this.originalSourceConstraintY = this.sourceConstraintY = 
			cm.Constraint(
				cm.NodeAttr(this,"$startY"),
				cm.NodeAttrExpr(this.source,"bbox"),
				function(sourceBBox){
					return sourceBBox.y + sourceBBox.height/2;
				}

			);

		constraintGraph.push(this.sourceConstraintX,this.sourceConstraintY);

		mixin(drawPathBehaviourAPI,this); 
	}

	function setupHighlightable(e){

		e.behaviours = e.behaviours || {};

		e.behaviours.HIGHLIGHTABLE = "true";

		//expose the interface
		e.setHighlight = function(){
			$(e).addClass("highlighted");
		}

		e.unsetHighlight = function(){
			$(e).removeClass("highlighted");
		}
		
	}

	//TODO: change the parameter names
	//TODO: make the constraint setup function more flexible?
	function setupDropTarget(classContainerRect,icon,spacing,setupWrapConstraints){

		setupHighlightable(classContainerRect);	//drop target must be highlightable

		classContainerRect.behaviours.DROP_TARGET = true;

		hookElementEventsToStatechart(classContainerRect,["mouseover","mouseout"],false);

		//make these things public properties... make them addressable as "dropconstraints"

		icon.classContainerRectChildren = [];	//TODO: we could encode this in DOM

		classContainerRect.dropShape = function(shape){
			//debugger;
			console.log("here");

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
				removeFromList(shape,p.classContainerRectChildren);
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
						removeFromList(constraint,constraintGraph);
						delete p[prop];	
					}
				}

			})

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
								cm.NodeAttrExpr(shape,["x","width"],cm.sum)],
							function(classContainerRectX){
								//TODO: read arbitrary arguments for second parameter

								var args = Array.prototype.slice.call(arguments);
								args = args.slice(1);
								var rightXArgs = args.map(function(shapeRightX){return shapeRightX - classContainerRectX});
								var rightX = Math.max.apply(this,rightXArgs); 
								var rightXPlusPadding = rightX + spacing.rightPadding; 
								return rightXPlusPadding >= spacing.minWidth ? rightXPlusPadding : spacing.minWidth; 
							}
						);
				
					icon.classContainerRectHeightConstraint = 
						cm.Constraint(
							cm.NodeAttr(this,"height"),
							[cm.NodeAttrExpr(this,"y"),
								cm.NodeAttrExpr(shape,["y","height"],cm.sum)],
							function(classContainerRectY,shapeBottomY){
								//TODO: read arbitrary arguments for second parameter
								var args = Array.prototype.slice.call(arguments);
								args = args.slice(1);
								var bottomYArgs = args.map(function(shapeBottomY){return shapeBottomY - classContainerRectY});
								var bottomY = Math.max.apply(this,bottomYArgs); 
								var bottomYPlusPadding = bottomY + spacing.leftPadding; 

								return bottomYPlusPadding  >= spacing.minHeight ? bottomYPlusPadding : spacing.minHeight ; 
							}
						);
						cm.Constraint(
							cm.NodeAttr(this,"height"),
							cm.NodeAttrExpr(shape,["y","height"],cm.sum),
							Math.max
						);

					//push
					constraintGraph.push(icon.classContainerRectXConstraint,
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

		}

		classContainerRect.hasHierarchicalChild = function(shape){
			return icon.classContainerRectChildren.indexOf(shape) !== -1; 
		}
	}

	function setupArrowSource(){
		//TODO	
	}

	function setupArrowTarget(){
		//TODO	

	}

	function setupCreator(){
		//TODO	

	}

	function setupDraggable(){
		//TODO	
	
	}

	function setupCurvable(){
		//TODO	
	
	}

	function removeFromList(element,list){
		return list.splice(list.indexOf(element),1);
	}

	//FIXME: we also need a way to delete stuff. which will mean deleting the corresponding elements in the constraint graph. need ot think about how best to do that, what that will mean. can imagine it bubbling out... like, arrows should be deleted if the thing that they target gets deleted... so maybe a more sophisticated rollback for the CS is needed?
	var constructors = {
		setupDropTarget : setupDropTarget,
		//TODO: the others...
		ClassIcon : function(x,y){
			
			var icon = svg.group(nodeLayer);
			var nameContainerRect = svg.rect(icon,x,y,1,1);
			var nameText = svg.text(icon,0,0,"Class");	//we really shouldn't set x and y here... maybe use different api?

			nameContainerRect.id = "nameContainerRect";
			nameText.id = "nameText";

			var attributeListRect = svg.rect(icon,0,0,100,10);	//set an initial height
			attributeListRect.id = "attributeListRect";

			var NEW_ATTRIBUTE_BUTTON_RADIUS = 5; 

			var newAttributeButton = svg.circle(icon,0,0,NEW_ATTRIBUTE_BUTTON_RADIUS);
			newAttributeButton.id = "newAttributeButton";

			var children = [icon,nameContainerRect,nameText,attributeListRect,newAttributeButton];

			//create constraint

			var nameContainerRectWidthConstraint, attributeListRectHeightConstraint;	//these will be augmented later

			nameContainerRectWidthConstraint = 
				cm.Constraint(
					cm.NodeAttr(nameContainerRect,"width"),
					cm.NodeAttrExpr(nameText,"width"),	//this gets augmented when we create a new attribute
					Math.max
				);

			constraintGraph.push(
				//nameContainerRect
				cm.Constraint(
					cm.NodeAttr(nameContainerRect,"height"),
					cm.NodeAttrExpr(nameText,"height")
				),

				nameContainerRectWidthConstraint,

				//nameText
				cm.Constraint(
					cm.NodeAttr(nameText,"x"),
					[cm.NodeAttrExpr(nameContainerRect,"x"),		//TODO: this should be centered - fn of width and x
						cm.NodeAttrExpr(nameContainerRect,"width")],
					function(x,width){
						return (width - this.getBBox().width)/2 + x;
					}
				),
				cm.Constraint(
					cm.NodeAttr(nameText,"y"),
					cm.NodeAttrExpr(nameContainerRect,"y")
				),
				

				//attributeListRect
				cm.Constraint(
					cm.NodeAttr(attributeListRect,"width"),
					cm.NodeAttrExpr(nameContainerRect,"width")
				),
				cm.Constraint(
					cm.NodeAttr(attributeListRect,"y"),
					cm.NodeAttrExpr(nameContainerRect,["y","height"],cm.sum)
				),
				cm.Constraint(
					cm.NodeAttr(attributeListRect,"x"),
					cm.NodeAttrExpr(nameContainerRect,"x")
				),

				//newAttributeButton 
				cm.Constraint(
					cm.NodeAttr(newAttributeButton,"cx"),
					cm.NodeAttrExpr(attributeListRect,["x","width"],cm.sum)
				),
				cm.Constraint(
					cm.NodeAttr(newAttributeButton,"cy"),
					cm.NodeAttrExpr(attributeListRect,["y","height"],cm.sum)
				)
			);

			var attributes = [];

			//hook up events

			newAttributeButton.addEventListener("mousedown",function(e){
				e.stopPropagation();

				//create a new attribute and add him to the constraint list
				//FIXME: really we would prompt the user here... in fact maybe I should just prompt... or pop up a dialog. or just let the user type, then focus the text, etc.
				var newAttribute = svg.text(icon,x,y,"+attributeName : attributeType");	
				newAttribute.id = "newAttribute" + attributes.length;


				//modify the existing constraint graph:
				//find constraint with source node attributeListRect, for attributes width and height
				//if they don't exist, create them
				//otherwise, append this guy's width/height

				nameContainerRectWidthConstraint.dest.push(cm.NodeAttrExpr(newAttribute,"width"));

				if(!attributeListRectHeightConstraint){
					//create new constraint
					attributeListRectHeightConstraint = 
						cm.Constraint(
							cm.NodeAttr(attributeListRect,"height"),
							cm.NodeAttrExpr(newAttribute,"height"),
							cm.sum
						);

					constraintGraph.push(attributeListRectHeightConstraint);
				}else{
				
					//modify existing constraint
					attributeListRectHeightConstraint.dest.push(cm.NodeAttrExpr(newAttribute,"height"));
				}
				


				//if there are no attributes, then constraint is created pointing to name text
				//otherwise, constraint is created pointing to the last attribute
				//FIXME: this is not quite correct, though. we want to center the text, but we want the attributes to be left-justified. so we need to basically set the first attribute to the left edge of the other bound box....

				if(attributes.length){
					var prevAttribute = attributes[attributes.length-1];

					constraintGraph.push(
						cm.Constraint(
							cm.NodeAttr(newAttribute,"y"),
							cm.NodeAttrExpr(prevAttribute,["y","height"],cm.sum)
						),
						cm.Constraint(
							cm.NodeAttr(newAttribute,"x"),
							cm.NodeAttrExpr(prevAttribute,"x")
						)
					);
				}else{
					constraintGraph.push(
						cm.Constraint(
							cm.NodeAttr(newAttribute,"y"),
							cm.NodeAttrExpr(attributeListRect,"y")
						),
						cm.Constraint(
							cm.NodeAttr(newAttribute,"x"),
							cm.NodeAttrExpr(attributeListRect,"x")
						)
					);
				}


				attributes.push(newAttribute);
				
				requestLayout();		
			
			},false);

			//all entitites with some default behaviour get the appropriate event listeners hooked up.
			//there is one default behaviour statechart instance shared by all elements
			//FIXME: do we or do we not allow event propagation????

			icon.behaviours = {
				DRAGGABLE : true,
				ARROW_SOURCE : true,
				ARROW_TARGET : true
			};
		
			hookElementEventsToStatechart(icon,["mousedown","mouseup","mousemove","mouseover","mouseout"],true);

			requestLayout();	//FIXME: maybe we would want to pass in a delta of the stuff that changed?

			icon.contains = function(shape){
				//this isn't strictly correct. we should keep an array of subentities
				return children.indexOf(shape) !== -1;
			}

			return icon;
		},

		PackageIcon : function(x,y){

			var PACKAGE_MIN_WIDTH = 100, 
				PACKAGE_MIN_HEIGHT = 100,
				PACKAGE_LEFT_PADDING = 10,
				PACKAGE_RIGHT_PADDING = 10,
				PACKAGE_TOP_PADDING = 10,
				PACKAGE_BOTTOM_PADDING = 10; 

			var icon = svg.group(nodeLayer);
			var nameContainerRect = svg.rect(icon,0,0,1,1);
			var nameText = svg.text(icon,0,0,"Package");

			nameContainerRect.id = "nameContainerRect";
			nameText.id = "nameText";

			var classContainerRect = svg.rect(icon,x,y,PACKAGE_MIN_WIDTH,PACKAGE_MIN_HEIGHT);	//set an initial height
			classContainerRect.id = "classContainerRect";

			var children = [icon,nameContainerRect,nameText,classContainerRect];

			//create constraint

			constraintGraph.push(
				//nameContainerRect bounding box around the text
				cm.Constraint(
					cm.NodeAttr(nameContainerRect,"height"),
					cm.NodeAttrExpr(nameText,"height")
				),
				cm.Constraint(
					cm.NodeAttr(nameContainerRect,"width"),
					cm.NodeAttrExpr(nameText,"width")
				),
				cm.Constraint(
					cm.NodeAttr(nameText,"x"),
					cm.NodeAttrExpr(nameContainerRect,"x")
				),
				cm.Constraint(
					cm.NodeAttr(nameText,"y"),
					cm.NodeAttrExpr(nameContainerRect,"y")
				),
				

				cm.Constraint(
					cm.NodeAttr(nameContainerRect,"y"),
					[cm.NodeAttrExpr(classContainerRect,"y"),cm.NodeAttrExpr(nameContainerRect,"height")],
					function(nameContainerRectY,nameTextHeight){
						return nameContainerRectY - nameTextHeight;
					}
				),
				cm.Constraint(
					cm.NodeAttr(nameContainerRect,"x"),
					cm.NodeAttrExpr(classContainerRect,"x")
				)

			);

			icon.behaviours = {
				DRAGGABLE : true,
				ARROW_SOURCE : true,
				ARROW_TARGET : true
			};

			//here we hook up appropriate events to elements with default behaviour
			//what are appropriate events? we are defining these as we go...

			hookElementEventsToStatechart(icon,["mousedown","mouseup","mousemove","mouseover","mouseout"],true);

			setupDropTarget(classContainerRect,icon,
						{topPadding:PACKAGE_TOP_PADDING,
							bottomPadding:PACKAGE_BOTTOM_PADDING,
							leftPadding:PACKAGE_LEFT_PADDING,
							rightPadding:PACKAGE_RIGHT_PADDING,
							minWidth:PACKAGE_MIN_WIDTH,
							minHeight:PACKAGE_MIN_HEIGHT},true);

			requestLayout();	//FIXME: maybe we would want to pass in a delta of the stuff that changed?

			return icon;
			
		},

		CurveIcon : function(source,x,y){
			x = x || 0;
			y = y || 0;

			//TODO: make the irst icon expose a nice API like this...
			//TODO: maybe use API to encode behaviour tags?

			//create the group and the path
			//also the source... with the second drop?
			//return the group
			var p = svg.createPath();
			var path = svg.path(edgeLayer,p.move(x,y).line(x+1,y+1));
			path.setAttributeNS(null,"class","edge");	//TODO: jquery-ify this statement

			//set up behaviour interface and data
			setupDrawPath.call(path,source);
			setupArrowEditorBehaviour.call(path);

			return path;
		},

		RadioButtonGroup : function(x,y){
			var SPACE_BETWEEN_BUTTONS = 10;	//TODO: break this out into some kind of stylesheet

			var icon = svg.group(nodeLayer);

			var buttons = [],
				selectedButton;

			return {
				createButton : function(text,iconConstructor){
					var buttonIcon = svg.group(icon);
					var nameContainerRect = svg.rect(buttonIcon,0,0,1,1);
					var nameText = svg.text(buttonIcon,x,y,text);

					constraintGraph.push(
						//nameContainerRect bounding box around the text
						cm.Constraint(
							cm.NodeAttr(nameContainerRect,"height"),
							cm.NodeAttrExpr(nameText,"height")
						),
						cm.Constraint(
							cm.NodeAttr(nameContainerRect,"width"),
							cm.NodeAttrExpr(nameText,"width")
						),
						cm.Constraint(
							cm.NodeAttr(nameContainerRect,"x"),
							cm.NodeAttrExpr(nameText,"x")
						),
						cm.Constraint(
							cm.NodeAttr(nameContainerRect,"y"),
							cm.NodeAttrExpr(nameText,"y")
						)
					)

					//add constraints: right-of the pervious button
					if(buttons.length){
						var prevButton = buttons[buttons.length-1];
						
						//TODO: add padding

						constraintGraph.push(
							cm.Constraint(
								cm.NodeAttr(nameText,"x"),
								cm.NodeAttrExpr(prevButton.getButtonIcon(),["x","width"],cm.sum),
								cm.inc(SPACE_BETWEEN_BUTTONS) 
							)
						)
					}

					var self = {
						getIconConstructor : function(){
							return iconConstructor;
						},
						getButtonIcon : function(){
							return buttonIcon;
						}
						//getter for constraints...
					}

					buttons.push(self);

					//hook up events
					buttonIcon.addEventListener("mousedown",function(e){
						//remove class from old one : pressed
						if(selectedButton){
							$(selectedButton.getButtonIcon()).removeClass("pressed");
						}

						//set selected button
						selectedButton = self;

						//add class to new one 
						$(buttonIcon).addClass("pressed");

					},false);

					requestLayout();

					return self;
				},
				deleteButton : function(){
					//TODO
				},
				getSelectedButton : function(){
					return selectedButton;
				}
			}
		},

		//note: we don't call this an Icon, because it doesn't relate to anything in the AS
		//NOTE: due to circular references, associatedControlPoint may not be passed into the constructor, but set up lazilly
		ControlPoint : function(segment,propNum,associatedEndPoint,associatedControlPoint){

			var g = svg.group(controlLayer);

			var propStr = propNumtoPropString(propNum)

			var l = svg.line(g,
				segment[propStr.x],
				segment[propStr.y],
				associatedEndPoint.segment.x,
				associatedEndPoint.segment.y,
				{fill:"none",stroke:"blue"});
			var c = svg.circle(g,segment[propStr.x],segment[propStr.y],5,{fill:"yellow",stroke:"black"});
			
			setupControlPointDragBehaviour.call(g, { segment:segment,
									point : c,
									line : l,
									propStr:propStr,	
									associatedEndPoint:associatedEndPoint,
									associatedControlPoint:associatedControlPoint});

			return g;
			
		},

		//associatedControlPoint1 and associatedControlPoint2 may be set up lazilly
		EndPoint : function(segment,associatedControlPoints){

			associatedControlPoints = associatedControlPoints || [];

			var r = svg.rect(controlLayer,segment.x,segment.y,5,5,{fill:"blue",stroke:"black"});
			
			//TODO: set up behaviour
			setupEndPointDragBehaviour.call(r,{segment:segment,associatedControlPoints:associatedControlPoints});

			return r;
			
		}
	}

	return constructors;

}
