define(["c"],
	function(cm){
		return function(svg,nodeLayer,constraintGraph,hookElementEventsToStatechart,requestLayout){
			return function(x,y){
				
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

					newAttribute.behaviours = {
						TEXT_EDITABLE : true
					};

					hookElementEventsToStatechart(newAttribute,["mousedown"],false);


					attributes.push(newAttribute);
					
					requestLayout();		
				
				},false);

				//all entitites with some default behaviour get the appropriate event listeners hooked up.
				//there is one default behaviour statechart instance shared by all elements
				//FIXME: do we or do we not allow event propagation????

				nameText.behaviours = {
					TEXT_EDITABLE : true
				};

				hookElementEventsToStatechart(nameText,["mousedown"],false);

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
				};

				return icon;
			};
		};
	}
);
