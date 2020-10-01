/**
 * Copyright (C) 2011 Jacob Beard
 * Released under GNU GPL, read the file 'COPYING' for more information
 **/
define([
	'c',
	'behaviour/constructors/selectable',
	'behaviour/constructors/removeable',
	'behaviour/constructors/arrow-source',
	'behaviour/constructors/arrow-target',
	'behaviour/constructors/draggable',
	'behaviour/constructors/text-editable',
], function (
	cm,
	setupSelectable,
	setupRemoveable,
	setupArrowSource,
	setupArrowTarget,
	setupDraggable,
	setupTextEditable
) {
	return function (env, x, y) {
		let icon = env.svg.group(env.nodeLayer);

		$(icon).addClass('class-icon');

		let nameContainerRect = env.svg.rect(icon, x, y, 1, 1);
		let nameText = env.svg.text(icon, 0, 0, 'Class'); //we really shouldn't set x and y here... maybe use different api?

		nameContainerRect.id = 'nameContainerRect';
		nameText.id = 'nameText';

		let attributeListRect = env.svg.rect(icon, 0, 0, 100, 10); //set an initial height
		attributeListRect.id = 'attributeListRect';

		let NEW_ATTRIBUTE_BUTTON_RADIUS = 5;

		let newAttributeButton = env.svg.circle(
			icon,
			0,
			0,
			NEW_ATTRIBUTE_BUTTON_RADIUS
		);
		newAttributeButton.id = 'newAttributeButton';

		let children = [
			icon,
			nameContainerRect,
			nameText,
			attributeListRect,
			newAttributeButton,
		];

		//create constraint

		let nameContainerRectWidthConstraint, attributeListRectHeightConstraint; //these will be augmented later

		nameContainerRectWidthConstraint = cm.Constraint(
			cm.NodeAttr(nameContainerRect, 'width'),
			cm.NodeAttrExpr(nameText, 'width'), //this gets augmented when we create a new attribute
			Math.max
		);

		env.constraintGraph.push(
			//nameContainerRect
			cm.Constraint(
				cm.NodeAttr(nameContainerRect, 'height'),
				cm.NodeAttrExpr(nameText, 'height')
			),

			nameContainerRectWidthConstraint,

			//nameText
			cm.Constraint(
				cm.NodeAttr(nameText, 'x'),
				[
					cm.NodeAttrExpr(nameContainerRect, 'x'), //TODO: this should be centered - fn of width and x
					cm.NodeAttrExpr(nameContainerRect, 'width'),
				],
				function (x, width) {
					return (width - this.getBBox().width) / 2 + x;
				}
			),
			cm.Constraint(
				cm.NodeAttr(nameText, 'y'),
				cm.NodeAttrExpr(nameContainerRect, 'y')
			),

			//attributeListRect
			cm.Constraint(
				cm.NodeAttr(attributeListRect, 'width'),
				cm.NodeAttrExpr(nameContainerRect, 'width')
			),
			cm.Constraint(
				cm.NodeAttr(attributeListRect, 'y'),
				cm.NodeAttrExpr(nameContainerRect, ['y', 'height'], cm.sum)
			),
			cm.Constraint(
				cm.NodeAttr(attributeListRect, 'x'),
				cm.NodeAttrExpr(nameContainerRect, 'x')
			),

			//newAttributeButton
			cm.Constraint(
				cm.NodeAttr(newAttributeButton, 'cx'),
				cm.NodeAttrExpr(attributeListRect, ['x', 'width'], cm.sum)
			),
			cm.Constraint(
				cm.NodeAttr(newAttributeButton, 'cy'),
				cm.NodeAttrExpr(attributeListRect, ['y', 'height'], cm.sum)
			)
		);

		let attributes = [];

		//hook up events

		newAttributeButton.addEventListener(
			'mousedown',
			function (e) {
				e.stopPropagation();

				//create a new attribute and add him to the constraint list
				//FIXME: really we would prompt the user here... in fact maybe I should just prompt... or pop up a dialog. or just let the user type, then focus the text, etc.
				let newAttribute = env.svg.text(
					icon,
					x,
					y,
					'+attributeName : attributeType'
				);
				newAttribute.id = 'newAttribute' + attributes.length;

				//modify the existing constraint graph:
				//find constraint with source node attributeListRect, for attributes width and height
				//if they don't exist, create them
				//otherwise, append this guy's width/height

				nameContainerRectWidthConstraint.dest.push(
					cm.NodeAttrExpr(newAttribute, 'width')
				);

				if (!attributeListRectHeightConstraint) {
					//create new constraint
					attributeListRectHeightConstraint = cm.Constraint(
						cm.NodeAttr(attributeListRect, 'height'),
						cm.NodeAttrExpr(newAttribute, 'height'),
						cm.sum
					);

					env.constraintGraph.push(attributeListRectHeightConstraint);
				} else {
					//modify existing constraint
					attributeListRectHeightConstraint.dest.push(
						cm.NodeAttrExpr(newAttribute, 'height')
					);
				}

				//if there are no attributes, then constraint is created pointing to name text
				//otherwise, constraint is created pointing to the last attribute
				//FIXME: this is not quite correct, though. we want to center the text, but we want the attributes to be left-justified. so we need to basically set the first attribute to the left edge of the other bound box....

				if (attributes.length) {
					let prevAttribute = attributes[attributes.length - 1];

					env.constraintGraph.push(
						cm.Constraint(
							cm.NodeAttr(newAttribute, 'y'),
							cm.NodeAttrExpr(
								prevAttribute,
								['y', 'height'],
								cm.sum
							)
						),
						cm.Constraint(
							cm.NodeAttr(newAttribute, 'x'),
							cm.NodeAttrExpr(prevAttribute, 'x')
						)
					);
				} else {
					env.constraintGraph.push(
						cm.Constraint(
							cm.NodeAttr(newAttribute, 'y'),
							cm.NodeAttrExpr(attributeListRect, 'y')
						),
						cm.Constraint(
							cm.NodeAttr(newAttribute, 'x'),
							cm.NodeAttrExpr(attributeListRect, 'x')
						)
					);
				}

				newAttribute.behaviours = {
					TEXT_EDITABLE: true,
				};

				env.hookElementEventsToStatechart(
					newAttribute,
					['mousedown'],
					false
				);

				attributes.push(newAttribute);

				env.requestLayout();
			},
			false
		);

		setupTextEditable.call(nameText, env);

		setupArrowSource.call(icon, env);
		setupArrowTarget.call(icon, env);
		setupDraggable.call(icon, env);

		setupSelectable.call(icon);
		setupRemoveable.call(icon, env);

		env.requestLayout(); //FIXME: maybe we would want to pass in a delta of the stuff that changed?

		icon.contains = function (shape) {
			//this isn't strictly correct. we should keep an array of subentities
			return children.indexOf(shape) !== -1;
		};

		return icon;
	};
});
