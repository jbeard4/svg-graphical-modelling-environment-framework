define(["c"],
	function(cm){
		return function(svg,nodeLayer,constraintGraph,requestLayout){	
			return function(x,y){
				var SPACE_BETWEEN_BUTTONS = 10;	//TODO: break this out into some kind of stylesheet

				var icon = svg.group(nodeLayer);

				$(icon).addClass("radio-button-group-icon");

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
						);

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
							);
						}

						var self = {
							getIconConstructor : function(){
								return iconConstructor;
							},
							getButtonIcon : function(){
								return buttonIcon;
							}
							//getter for constraints...
						};

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
				};
			};
		};
	}
);
