/**
	These are constructor functions for creating CS entities.
	This would get generated automatically from the Icon Definition model
**/


function setupConstructors(defaultStatechartInstance,cm,constraintGraph,requestLayout){

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
					cm.NodeAttrExpr(nameContainerRect,"x")		//TODO: this should be centered - fn of width and x
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

			requestLayout();	//FIXME: maybe we would want to pass in a delta of the stuff that changed?
		},

		PackageIcon : function(){
			
			
		}
	}

}
