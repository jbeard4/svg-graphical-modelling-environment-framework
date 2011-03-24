/**
	These are constructor functions for creating CS entities.
	This would get generated automatically from the Icon Definition model
**/


function setupConstructors(defaultStatechartInstance,cm,constraintGraph,requestLayout,svg,edgeLayer,nodeLayer){

	//FIXME: we also need a way to delete stuff. which will mean deleting the corresponding elements in the constraint graph. need ot think about how best to do that, what that will mean. can imagine it bubbling out... like, arrows should be deleted if the thing that they target gets deleted... so maybe a more sophisticated rollback for the CS is needed?
	return {
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


			/*
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
				NodeAttr(nameText,["y","height"],sum)
			),
			Constraint(
				NodeAttr(attributeListRect,"x"),
				NodeAttr(nameText,"x")
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
			*/

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
		
			//add drag behaviour
			["mousedown","mouseup","mousemove","mouseover","mouseout"].forEach(function(eventName){
				//we call e.preventDefault for all of these events to prevent firefox from using its default dragging behaviour: 
				//see https://bugzilla.mozilla.org/show_bug.cgi?id=525591#c4
				//it may be the case that only certain events (md, mu, or mm) need to be canceled to prevent this behaviour
				icon.addEventListener(eventName,function(e){
					e.preventDefault();
					e.stopPropagation();
					defaultStatechartInstance[eventName]({domEvent:e,currentTarget:icon})
				},false);
			});

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

			classContainerRect.behaviours = {
				DROP_TARGET : true
			};

			//here we hook up appropriate events to elements with default behaviour
			//what are appropriate events? we are defining these as we go...

			["mousedown","mouseup","mousemove","mouseover","mouseout"].forEach(function(eventName){
				icon.addEventListener(eventName,function(e){
					e.preventDefault();
					e.stopPropagation();
					defaultStatechartInstance[eventName]({domEvent:e,currentTarget:icon})
				},false);
			});

			["mouseover","mouseout"].forEach(function(eventName){
				classContainerRect.addEventListener(eventName,function(e){
					e.preventDefault();
					//FIXME: this is interesting. in order to not conflict with drag-and-drop behaviour (parent has arrow target), we need to not stop event propagation. when generating the environment, we will need to determine the strict conditions that require us to stop event propagation, or not
					//e.stopPropagation();	
					defaultStatechartInstance[eventName]({domEvent:e,currentTarget:classContainerRect})
				},false);
			});

			//FIXME: I think I really shouldn't be adding this type of stuff directly to DOM objects...
			classContainerRect.setHighlight = function(){
				$(classContainerRect).addClass("highlighted");
			}

			classContainerRect.unsetHighlight = function(){
				$(classContainerRect).removeClass("highlighted");
			}

			var classContainerRectXConstraint,
				classContainerRectYConstraint,
				classContainerRectWidthConstraint,
				classContainerRectHeightConstraint;

			var classContainerRectChildren = [];	//TODO: we could encode this in DOM

			classContainerRect.dropShape = function(shape){
				console.log("here");

				//modify the shape's ctm to match the parent's
				//TODO: move this out into SVG helper lib?
				var m2 = classContainerRect.getCTM().inverse();

				var tl = shape.transform.baseVal;
				var t = tl.numberOfItems ? tl.getItem(0) : rawNode.ownerSVGElement.createSVGTransform();
				var m = t.matrix;
				var newM = m.multiply(m2);
				t.setMatrix(newM);
				tl.initialize(t);

				classContainerRectChildren.push(shape); 

				//furthermore, move stuff to be children of the group
				shape.parentNode.removeChild(shape);

				//TODO: we may want a separate group just for these children
				//TODO: we may also need to do some matrix normalization
				icon.appendChild(shape);	

				//containment relationship... for all of his targets
				//minx, miny for all shapes he contains
				//maxx, maxy for all shapes he contains
				//debugger;
				if(!classContainerRectXConstraint){
					classContainerRectXConstraint =
						cm.Constraint(
							cm.NodeAttr(classContainerRect,"x"),
							cm.NodeAttrExpr(shape,"x",cm.dec(PACKAGE_LEFT_PADDING)),
							Math.min
						);

					classContainerRectYConstraint =
						cm.Constraint(
							cm.NodeAttr(classContainerRect,"y"),
							cm.NodeAttrExpr(shape,"y",cm.dec(PACKAGE_TOP_PADDING)),
							Math.min
						);

					classContainerRectWidthConstraint =
						cm.Constraint(
							cm.NodeAttr(classContainerRect,"width"),
							[cm.NodeAttrExpr(classContainerRect,"x"),
								cm.NodeAttrExpr(shape,["x","width"],cm.sum)],
							function(classContainerRectX){
								//TODO: read arbitrary arguments for second parameter

								var args = Array.prototype.slice.call(arguments);
								args = args.slice(1);
								var rightXArgs = args.map(function(shapeRightX){return shapeRightX - classContainerRectX});
								var rightX = Math.max.apply(this,rightXArgs); 
								var rightXPlusPadding = rightX + PACKAGE_RIGHT_PADDING; 
								return rightXPlusPadding >= PACKAGE_MIN_WIDTH ? rightXPlusPadding : PACKAGE_MIN_WIDTH; 
							}
						);
				
					classContainerRectHeightConstraint = 
						cm.Constraint(
							cm.NodeAttr(classContainerRect,"height"),
							[cm.NodeAttrExpr(classContainerRect,"y"),
								cm.NodeAttrExpr(shape,["y","height"],cm.sum)],
							function(classContainerRectY,shapeBottomY){
								//TODO: read arbitrary arguments for second parameter
								var args = Array.prototype.slice.call(arguments);
								args = args.slice(1);
								var bottomYArgs = args.map(function(shapeBottomY){return shapeBottomY - classContainerRectY});
								var bottomY = Math.max.apply(this,bottomYArgs); 
								var bottomYPlusPadding = bottomY + PACKAGE_LEFT_PADDING; 

								return bottomYPlusPadding  >= PACKAGE_MIN_HEIGHT ? bottomYPlusPadding : PACKAGE_MIN_HEIGHT ; 
							}
						);
						cm.Constraint(
							cm.NodeAttr(classContainerRect,"height"),
							cm.NodeAttrExpr(shape,["y","height"],cm.sum),
							Math.max
						);

					//push
					constraintGraph.push(classContainerRectXConstraint,
								classContainerRectYConstraint,
								classContainerRectWidthConstraint,
								classContainerRectHeightConstraint);
				}else{
					classContainerRectXConstraint.dest.push(cm.NodeAttrExpr(shape,"x"));
					classContainerRectYConstraint.dest.push(cm.NodeAttrExpr(shape,"y"));
					classContainerRectWidthConstraint.dest.push(cm.NodeAttrExpr(shape,["x","width"],cm.sum));
					classContainerRectHeightConstraint.dest.push(cm.NodeAttrExpr(shape,["y","height"],cm.sum));
				}

				requestLayout();
			}

			icon.contains = function(shape){
				//this isn't strictly correct. we should keep an array of subentities
				return children.indexOf(shape) !== -1;
			}

			classContainerRect.hasHierarchicalChild = function(shape){
				return classContainerRectChildren.indexOf(shape) !== -1; 
			}


			//TODO: undrop shape somehow
			//rollback all constraint relationships, etc.
		
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
			var line = svg.line(edgeLayer,x,y,x+1,y+1);
			line.setAttributeNS(null,"class","edge");	//TODO: jquery-ify this statement

			var targetConstraintX,
				targetConstraintY,
				sourceConstraintX,
				sourceConstraintY,
				originalSourceConstraintX,
				originalSourceConstraintY;
 
			originalSourceConstraintX = sourceConstraintX = 
				cm.Constraint(
					cm.NodeAttr(line,"$startX"),
					cm.NodeAttrExpr(source,"bbox"),
					function(sourceBBox){
						return sourceBBox.x + sourceBBox.width/2;
					}

				);

			originalSourceConstraintY = sourceConstraintY = 
				cm.Constraint(
					cm.NodeAttr(line,"$startY"),
					cm.NodeAttrExpr(source,"bbox"),
					function(sourceBBox){
						return sourceBBox.y + sourceBBox.height/2;
					}

				);

			constraintGraph.push(sourceConstraintX,sourceConstraintY);

			requestLayout();

			return {
				setEndPoint : function(x,y){
					line.x2.baseVal.value = x;	 
					line.y2.baseVal.value = y;
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
					[sourceConstraintX,sourceConstraintY].forEach(function(c){
						constraintGraph.splice(constraintGraph.indexOf(c),1);
					});


					var depList = [cm.NodeAttrExpr(source,"x"),
								cm.NodeAttrExpr(source,"y"),
								cm.NodeAttrExpr(source,"width"),
								cm.NodeAttrExpr(source,"height"),
								cm.NodeAttrExpr(target,"x"),
								cm.NodeAttrExpr(target,"y"),
								cm.NodeAttrExpr(target,"width"),
								cm.NodeAttrExpr(target,"height")];
					
					//set up target constraints
					targetConstraintX = 
						cm.Constraint(
							cm.NodeAttr(line,"$endX"),
							depList, 
							getConstraintFunction("x",false)
						);

					targetConstraintY = 
						cm.Constraint(
							cm.NodeAttr(line,"$endY"),
							depList, 
							getConstraintFunction("y",false)
						);
				
					//set up new sourceConstraintX and sourceConstraintY
					sourceConstraintX = 
						cm.Constraint(
							cm.NodeAttr(line,"$startX"),
							depList, 
							getConstraintFunction("x",true)
						);


					sourceConstraintY = 
						cm.Constraint(
							cm.NodeAttr(line,"$startY"),
							depList, 
							getConstraintFunction("y",true)
						);

					constraintGraph.push(sourceConstraintX,
								sourceConstraintY,
								targetConstraintX,
								targetConstraintY);

					requestLayout();
				},
				rollback : function(){
					//here using targetConstraintX/targetConstraintY to encode state 
					if(targetConstraintX && targetConstraintY){
						[sourceConstraintX,sourceConstraintY,targetConstraintX,targetConstraintY].forEach(function(c){
							constraintGraph.splice(constraintGraph.indexOf(c),1);
						});

						sourceConstraintX = originalSourceConstraintX;
						sourceConstraintY = originalSourceConstraintY;

						constraintGraph.push(sourceConstraintX,sourceConstraintY);  

						targetConstraintX = targetConstraintY = null;
					
						requestLayout();
					}else{ 
						this.remove();
					}
				},	
				getNumberOfControlPoints : function(){
					return 0;
				},
				remove : function(){
					//remove self from dom
					line.parentNode.removeChild(line);
					
					//remove constraints
					[sourceConstraintX,sourceConstraintY,targetConstraintX,targetConstraintY].forEach(function(c){
						constraintGraph.splice(constraintGraph.indexOf(c),1);
					});

					requestLayout();
				}
			}
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
		}
	}

}
