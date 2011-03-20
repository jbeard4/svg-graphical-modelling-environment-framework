/**
	These are constructor functions for creating CS entities.
	This would get generated automatically from the Icon Definition model
**/


function setupConstructors(defaultStatechartInstance,constraintModule){

	//FIXME: we also need a way to delete stuff. which will mean deleting the corresponding elements in the constraint graph. need ot think about how best to do that, what that will mean. can imagine it bubbling out... like, arrows should be deleted if the thing that they target gets deleted... so maybe a more sophisticated rollback for the CS is needed?
	return {
		ClassIcon : function(){
			var classIconG = svg.group();
			var nameContainerRect = svg.rect(classIconG,0,0,100,100);
			var nameText = svg.text(classIconG,0,0,"Class");

			//create constraint

			/*
			Constraint(
				NodeAttr(nameContainerRect,"width"),
				[NodeAttr(nameText,"width"),NodeAttr(attributeListRect,"width")],//FIXME
				Math.max
			),
			*/


			var constraint = constraintModule.Constraint(
				constraintModule.NodeAttr(nameContainerRect,"width"),
				constraintModule.NodeAttr(nameText,"width")
			);

			//constraintGraph.push(constraint); 
			//visualObjectList.push(nameContainerRect,nameText);

			//TODO: hook up events...

			return {
				constraints:[constraint],
				constraintVisualObjects:[nameContainerRect,nameText]
			};
		},

		PackageIcon : function(){
			
			
		}
	}

}
