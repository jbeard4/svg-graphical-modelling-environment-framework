/**
	These are constructor functions for creating CS entities.
	This would get generated automatically from the Icon Definition model
**/


function setupConstructors(defaultStatechartInstance,cm,constraintGraph,visualObjects,requestLayout){

	//FIXME: we also need a way to delete stuff. which will mean deleting the corresponding elements in the constraint graph. need ot think about how best to do that, what that will mean. can imagine it bubbling out... like, arrows should be deleted if the thing that they target gets deleted... so maybe a more sophisticated rollback for the CS is needed?
	return {
		ClassIcon : function(x,y){
			var classIconG = svg.group();
			var nameContainerRect = svg.rect(classIconG);
			var nameText = svg.text(classIconG,x,y,"Class");

			nameContainerRect.setAttributeNS(null,"id","nameContainerRect");
			nameText.setAttributeNS(null,"id","nameText");

			var attributeListRect = svg.rect(classIconG,0,0,100,10);	//set an initial height
			attributeListRect.setAttributeNS(null,"id","attributeListRect");

			var NEW_ATTRIBUTE_BUTTON_RADIUS = 5; 

			var newAttributeButton = svg.circle(classIconG,0,0,NEW_ATTRIBUTE_BUTTON_RADIUS);

			//create constraint
			constraintGraph.push(
				//nameContainerRect
				cm.Constraint(
					cm.NodeAttr(nameContainerRect,"width"),
					[cm.NodeAttr(nameText,"width"),cm.NodeAttr(attributeListRect,"width")],
					Math.max
				),
				cm.Constraint(
					cm.NodeAttr(nameContainerRect,"x"),
					cm.NodeAttr(nameText,"x")
				),
				cm.Constraint(
					cm.NodeAttr(nameContainerRect,"y"),
					cm.NodeAttr(nameText,"y")
				),
				cm.Constraint(
					cm.NodeAttr(nameContainerRect,"height"),
					cm.NodeAttr(nameText,"height")
				),

				//attributeListRect
				cm.Constraint(
					cm.NodeAttr(attributeListRect,"width"),
					cm.NodeAttr(nameText,"width"),
					Math.max
				),
				cm.Constraint(
					cm.NodeAttr(attributeListRect,"y"),
					cm.NodeAttr(nameText,["y","height"],cm.sum)
				),
				cm.Constraint(
					cm.NodeAttr(attributeListRect,"x"),
					cm.NodeAttr(nameText,"x")
				),

				//newAttributeButton 
				cm.Constraint(
					cm.NodeAttr(newAttributeButton,"cx"),
					cm.NodeAttr(attributeListRect,["x","width"],cm.sum)
				),
				cm.Constraint(
					cm.NodeAttr(newAttributeButton,"cy"),
					cm.NodeAttr(attributeListRect,["y","height"],cm.sum)
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
				newAttribute.setAttributeNS(null,"id","newAttribute" + attributes.length);


				//modify the existing constraint graph:
				//find constraint with source node attributeListRect, for attributes width and height
				//if they don't exist, create them
				//otherwise, append this guy's width/height

				var sourceNodeConstraints = constraintGraph.filter(function(constraint){
					return constraint.source.node === attributeListRect
				});

				var sourceNodeWidthConstraint = sourceNodeConstraints.filter(function(constraint){
					return constraint.source.attrs.indexOf("width") !== -1; 
				}).pop();

				var sourceNodeHeightConstraint = sourceNodeConstraints.filter(function(constraint){
					return constraint.source.attrs.indexOf("height") !== -1; 
				}).pop();

				sourceNodeWidthConstraint.dest.push(cm.NodeAttr(newAttribute,"width"));

				//debugger;

				if(!sourceNodeHeightConstraint){
					//create new constraint
					constraintGraph.push(
						cm.Constraint(
							cm.NodeAttr(attributeListRect,"height"),
							cm.NodeAttr(newAttribute,"height"),
							cm.sum
						)
					)
				}else{
				
					//modify existing constraint
					sourceNodeHeightConstraint.dest.push(cm.NodeAttr(newAttribute,"height"));
				}
				


				//if there are no attributes, then constraint is created pointing to name text
				//otherwise, constraint is created pointing to the last attribute
				//FIXME: this is not quite correct, though. we want to center the text, but we want the attributes to be left-justified. so we need to basically set the first attribute to the left edge of the other bound box....
				var targetNode = !attributes.length ? nameText : attributes[attributes.length-1];

				constraintGraph.push(
					cm.Constraint(
						cm.NodeAttr(newAttribute,"y"),
						cm.NodeAttr(targetNode,["y","height"],cm.sum)
					),
					cm.Constraint(
						cm.NodeAttr(newAttribute,"x"),
						cm.NodeAttr(targetNode,"x")
					)
				);

				visualObjects.push(newAttribute);

				attributes.push(newAttribute);
				
				requestLayout();		
			
			},false);

			visualObjects.push(nameContainerRect,nameText,attributeListRect,newAttributeButton);

			requestLayout();	//FIXME: maybe we would want to pass in a delta of the stuff that changed?
		},

		PackageIcon : function(){
			
			
		}
	}

}
