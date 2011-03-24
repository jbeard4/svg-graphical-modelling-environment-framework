/**
	These are constructor functions for creating CS entities.
	This would get generated automatically from the Icon Definition model
**/


function setupConstructors(defaultStatechartInstance,cm,constraintGraph,requestLayout,svg){

	//FIXME: we also need a way to delete stuff. which will mean deleting the corresponding elements in the constraint graph. need ot think about how best to do that, what that will mean. can imagine it bubbling out... like, arrows should be deleted if the thing that they target gets deleted... so maybe a more sophisticated rollback for the CS is needed?
	return {
		ClassIcon : function(x,y){
			var classIconG = svg.group();
			var nameContainerRect = svg.rect(classIconG,x,y,1,1);
			var nameText = svg.text(classIconG,0,0,"Class");	//we really shouldn't set x and y here... maybe use different api?

			nameContainerRect.id = "nameContainerRect";
			nameText.id = "nameText";

			var attributeListRect = svg.rect(classIconG,0,0,100,10);	//set an initial height
			attributeListRect.id = "attributeListRect";

			var NEW_ATTRIBUTE_BUTTON_RADIUS = 5; 

			var newAttributeButton = svg.circle(classIconG,0,0,NEW_ATTRIBUTE_BUTTON_RADIUS);
			newAttributeButton.id = "newAttributeButton";

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
				var newAttribute = svg.text(classIconG,x,y,"+attributeName : attributeType");	
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

			classIconG.behaviours = {
				DRAGGABLE : true,
				ARROW_SOURCE : true,
				ARROW_TARGET : true
			};
		
			//add drag behaviour
			["mousedown","mouseup","mousemove","mouseover","mouseout"].forEach(function(eventName){
				//we call e.preventDefault for all of these events to prevent firefox from using its default dragging behaviour: 
				//see https://bugzilla.mozilla.org/show_bug.cgi?id=525591#c4
				//it may be the case that only certain events (md, mu, or mm) need to be canceled to prevent this behaviour
				classIconG.addEventListener(eventName,function(e){
					e.preventDefault();
					e.stopPropagation();
					defaultStatechartInstance[eventName]({domEvent:e,currentTarget:classIconG})
				},false);
			});

			requestLayout();	//FIXME: maybe we would want to pass in a delta of the stuff that changed?

			return classIconG;
		},

		PackageIcon : function(){
			
			
		},

		CurveIcon : function(source,x,y){
			x = x || 0;
			y = y || 0;

			//TODO: make the irst icon expose a nice API like this...
			//TODO: maybe use API to encode behaviour tags?

			//create the group and the path
			//also the source... with the second drop?
			//return the group
			var line = svg.line(x,y,x+1,y+1);
			line.setAttributeNS(null,"class","edge");	//TODO: jquery-ify this statement

			var targetConstraintX,
				targetConstraintY,
				sourceConstraintX = 
					cm.Constraint(
						cm.NodeAttr(line,"$startX"),
						cm.NodeAttrExpr(source,"bbox"),
						function(sourceBBox){
							return sourceBBox.x + sourceBBox.width/2;
						}

					),
				sourceConstraintY = 
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
					function getConstraintFunction(xOrY){
						return function(fromX,fromY,fromWidth,fromHeight,toX,toY,toWidth,toHeight){
							var x0 = fromX + fromWidth/2;
							var y0 = fromY + fromHeight/2;

							var x1 = toX + toWidth/2;
							var y1 = toY + toHeight/2;


							var p1 = new Point2D(x0,y0),
								p2 = new Point2D(x1,y1),
								r1 = new Point2D(toX,toY),
								r2 = new Point2D(toX + toWidth, toY + toHeight);

							var inter = Intersection.intersectLineRectangle(p1,p2,r1,r2);

							var point = inter.points.pop();

							return point[xOrY];
						}
					}

					var depList = [cm.NodeAttrExpr(source,"x"),
								cm.NodeAttrExpr(source,"y"),
								cm.NodeAttrExpr(source,"width"),
								cm.NodeAttrExpr(source,"height"),
								cm.NodeAttrExpr(target,"x"),
								cm.NodeAttrExpr(target,"y"),
								cm.NodeAttrExpr(target,"width"),
								cm.NodeAttrExpr(target,"height")];
					
					targetConstraintX = 
						cm.Constraint(
							cm.NodeAttr(line,"$endX"),
							depList, 
							getConstraintFunction("x")
						);

					targetConstraintY = 
						cm.Constraint(
							cm.NodeAttr(line,"$endY"),
							depList, 
							getConstraintFunction("y")
						);

					constraintGraph.push(targetConstraintX,targetConstraintY);

					requestLayout();
				},
				rollback : function(){		//here aliased to remove, but in polyline or path, may not be
					this.remove();
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
						constraintGraph.splice(constraintGraph.indexOf(c),1);
						constraintGraph.splice(constraintGraph.indexOf(c),1);	//FIXME: make sure targetConstraint is set?
						constraintGraph.splice(constraintGraph.indexOf(c),1);	//FIXME: make sure targetConstraint is set?
					})

					requestLayout();
				}
			}
		}
	}

}
