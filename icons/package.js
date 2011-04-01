define(["c"],

	function(cm){
		return function(svg,nodeLayer,constraintGraph,hookElementEventsToStatechart,requestLayout,resizable,setupDropTarget){
			return function(x,y){

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


				//generated resize stuff
				var classContainerRectEastResizeHandle =  svg.line(icon,x+PACKAGE_MIN_WIDTH,y,x+PACKAGE_MIN_WIDTH,y+PACKAGE_MIN_HEIGHT);

				var classContainerRectSouthResizeHandle =  svg.line(icon,x,y+PACKAGE_MIN_HEIGHT,x+PACKAGE_MIN_WIDTH,y+PACKAGE_MIN_HEIGHT);

				var classContainerRectSouthEastResizeHandle =  svg.line(icon,x+PACKAGE_MIN_WIDTH - 5, y+PACKAGE_MIN_HEIGHT - 5,x+PACKAGE_MIN_WIDTH,y+PACKAGE_MIN_HEIGHT); //hardcoded 5 pixels


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
					),

					//setup constraints on resize handles
					cm.Constraint(
						cm.NodeAttr(classContainerRectEastResizeHandle,"x1"),
						cm.NodeAttrExpr(classContainerRect,["x","width"],cm.sum)
					),
					cm.Constraint(
						cm.NodeAttr(classContainerRectEastResizeHandle,"y1"),
						cm.NodeAttrExpr(classContainerRect,"y")
					),
					cm.Constraint(
						cm.NodeAttr(classContainerRectEastResizeHandle,"x2"),
						cm.NodeAttrExpr(classContainerRect,["x","width"],cm.sum)
					),
					cm.Constraint(
						cm.NodeAttr(classContainerRectEastResizeHandle,"y2"),
						cm.NodeAttrExpr(classContainerRect,["y","height"],cm.sum)
					),


					cm.Constraint(
						cm.NodeAttr(classContainerRectSouthResizeHandle,"x1"),
						cm.NodeAttrExpr(classContainerRect,"x")
					),
					cm.Constraint(
						cm.NodeAttr(classContainerRectSouthResizeHandle,"y1"),
						cm.NodeAttrExpr(classContainerRect,["y","height"],cm.sum)
					),
					cm.Constraint(
						cm.NodeAttr(classContainerRectSouthResizeHandle,"x2"),
						cm.NodeAttrExpr(classContainerRect,["x","width"],cm.sum)
					),
					cm.Constraint(
						cm.NodeAttr(classContainerRectSouthResizeHandle,"y2"),
						cm.NodeAttrExpr(classContainerRect,["y","height"],cm.sum)
					),
					
					cm.Constraint(
						cm.NodeAttr(classContainerRectSouthEastResizeHandle,"x1"),
						cm.NodeAttrExpr(classContainerRect,["x","width"],cm.sum),
						cm.dec(5)
					),
					cm.Constraint(
						cm.NodeAttr(classContainerRectSouthEastResizeHandle,"y1"),
						cm.NodeAttrExpr(classContainerRect,["y","height"],cm.sum),
						cm.dec(5)
					),
					cm.Constraint(
						cm.NodeAttr(classContainerRectSouthEastResizeHandle,"x2"),
						cm.NodeAttrExpr(classContainerRect,["x","width"],cm.sum)
					),
					cm.Constraint(
						cm.NodeAttr(classContainerRectSouthEastResizeHandle,"y2"),
						cm.NodeAttrExpr(classContainerRect,["y","height"],cm.sum)
					)
				);

				icon.contains = function(shape){
					//this isn't strictly correct. we should keep an array of subentities
					return children.indexOf(shape) !== -1;
				};

				var resizeHandleKwArgs = {
					associatedRect : classContainerRect
				};

				resizable.setupResizableEast.call(classContainerRectEastResizeHandle,resizeHandleKwArgs);
				resizable.setupResizableSouth.call(classContainerRectSouthResizeHandle,resizeHandleKwArgs);
				resizable.setupResizableSouthEast.call(classContainerRectSouthEastResizeHandle,resizeHandleKwArgs);

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
				
			};
		};
	}
);

