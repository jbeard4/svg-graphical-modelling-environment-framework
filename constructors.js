/**
	These are constructor functions for creating CS entities.
	This would get generated automatically from the Icon Definition model
**/


function setupConstructors(defaultStatechartInstance,cm){

	//FIXME: we also need a way to delete stuff. which will mean deleting the corresponding elements in the constraint graph. need ot think about how best to do that, what that will mean. can imagine it bubbling out... like, arrows should be deleted if the thing that they target gets deleted... so maybe a more sophisticated rollback for the CS is needed?
	return {
		ClassIcon : function(x,y){
			var classIconG = svg.group();
			var nameContainerRect = svg.rect(classIconG,0,0,100,100);
			var nameText = svg.text(classIconG,x,y,"Class");

			//create constraint

			/*
			Constraint(
				NodeAttr(nameContainerRect,"width"),
				[NodeAttr(nameText,"width"),NodeAttr(attributeListRect,"width")],//FIXME
				Math.max
			),
			*/


			var constraints = [
				cm.Constraint(
					cm.NodeAttr(nameContainerRect,"width"),
					cm.NodeAttr(nameText,"width")
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
				)
			]

			//constraintGraph.push(constraint); 
			//visualObjectList.push(nameContainerRect,nameText);

			//TODO: hook up events...

			return {
				constraints:constraints,
				constraintVisualObjects:[nameContainerRect,nameText]
			};
		},

		PackageIcon : function(){
			
			
		}
	}

}
