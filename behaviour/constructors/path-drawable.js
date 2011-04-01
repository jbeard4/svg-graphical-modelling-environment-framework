define(["helpers","c","lib/geometry/2D.js","lib/geometry/Intersection.js"],

	function(h,cm){
		return function(constraintGraph){
			//we define this out here, because if we did it inside of the setup function, we would be create new function instances for each path object that gets set up. wastes memory	
			var drawPathBehaviourAPI = {

				willPathBeEmptyAfterRemovingNextPoint : function (){
					return this.pathSegList.numberOfItems==2;	
				},

				rollbackPoint : function (){
					this.pathSegList.removeItem(this.pathSegList.numberOfItems-2);
				},

				setEndPoint : function (x,y){
					var segList = this.pathSegList;
					var numItems = segList.numberOfItems;
					var endSeg = segList.getItem(numItems-1);

					endSeg.x = x;
					endSeg.y = y;
				},

				createNewQuadraticSegment : function (x,y,x1,y1){
					var n = this.createSVGPathSegCurvetoQuadraticAbs(x,y,x1,y1);
					this.pathSegList.appendItem(n);

					return n;
				},

				createNewLineSegment : function (x,y){
					var n = this.createSVGPathSegLinetoAbs(x,y);
					this.pathSegList.appendItem(n);
					return n;
				},

				addControlPoint : function (x,y,mirror){
					var segList = this.pathSegList;
					var numItems = segList.numberOfItems;
					var endSeg = segList.getItem(numItems-1);
					var newSeg;

					//first item will be M, second item will be the initial this drawing segment
					if(numItems > 1){
						if(endSeg.x2 === undefined && endSeg.x1 === undefined){
							//upgrade him to a quadratic
							newSeg = this.createSVGPathSegCurvetoQuadraticAbs(endSeg.x,endSeg.y,x,y);
							segList.replaceItem(newSeg,numItems-1); 

						}
						else if(endSeg.x2 === undefined && endSeg.x1 !== undefined){
							//upgrade him to a cubic
							//var newSegX2 = x + 2*( endSeg.x1 - x );
							//var newSegY2 = y + 2*( endSeg.y1 - y );
							newSeg = this.createSVGPathSegCurvetoCubicAbs(endSeg.x,endSeg.y,endSeg.x1,endSeg.y1,x,y);
							segList.replaceItem(newSeg,numItems-1);
						}
					}
				},
				setLastControlPoint : function(x,y,mirror){
					//get the last control point
					var segList = this.pathSegList;
					var numItems = segList.numberOfItems;
					var endSeg = segList.getItem(numItems-1);

					var curX = endSeg.x, curY = endSeg.y;
					var propX, propY;
					if(endSeg.x2 !== undefined ){
						propX = "x2";
					}else if(endSeg.x1  !== undefined ){
						propX = "x1";
					} 

					//debugger;
					if(endSeg.y2  !== undefined ){
						propY = "y2";
					}else if(endSeg.y1  !== undefined ){
						propY = "y1";
					} 

					//if(propX === undefined || propY === undefined) debugger;

					if(mirror){
						x = x + 2*(curX - x); 
						y = y + 2*(curY - y);
					}

					//console.log("curX",curX,"curY",curY,"x",x,"y",y,"propX",propX,"propY",propY);

					endSeg[propX] = x;
					endSeg[propY] = y;
				},
				setTarget : function(target){

					//set up the constraint graph for the target

					//remove and update sourceConstraintX and sourceConstraintY to avoid arrow occlusion 
					[this.sourceConstraintX,this.sourceConstraintY].forEach(function(c){
						h.removeFromList(c,constraintGraph);
					});

					
					var segList = this.pathSegList;
					var numItems = segList.numberOfItems;
					var endSeg = segList.getItem(numItems-1);
					var startSeg = segList.getItem(0);
					
					/*
					if(numItems > 2){
						var segmentAfterStartSeg = segList.getItem(1);
						var xAfterStartSeg, yAfterStartSeg;
						if(segmentAfterStartSeg.x1 !== undefined){
							xAfterStartSeg = segmentAfterStartSeg.x1;
							yAfterStartSeg = segmentAfterStartSeg.y1;
						}else{
							xAfterStartSeg = segmentAfterStartSeg.x;
							yAfterStartSeg = segmentAfterStartSeg.y;
						}

						var xBeforeEndSeg, yBeforeEndSeg;
						if(endSeg.x2 !== undefined){
							xBeforeEndSeg = endSeg.x2;
							yBeforeEndSeg = endSeg.y2;
						}else if(endSeg.x1 !== undefined){
							xBeforeEndSeg = endSeg.x1;
							yBeforeEndSeg = endSeg.y1;
						}else{
							var segBeforeEndSeg = segList.getItem(numItems-2);
							xBeforeEndSeg = segBeforeEndSeg.x;
							yBeforeEndSeg = segBeforeEndSeg.y;
						}

						//ok... we need to extend constraint system to support line segments... shouldn't be too hard I think

						//constraint will be the intersection between the rect, and the line starting from the center of the rect and extending to the point we have picked out. 
					}else{
					*/

						
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
							};
						}

						var depList = [cm.NodeAttrExpr(this.source,"x"),
									cm.NodeAttrExpr(this.source,"y"),
									cm.NodeAttrExpr(this.source,"width"),
									cm.NodeAttrExpr(this.source,"height"),
									cm.NodeAttrExpr(target,"x"),
									cm.NodeAttrExpr(target,"y"),
									cm.NodeAttrExpr(target,"width"),
									cm.NodeAttrExpr(target,"height")];

						
						//add backward refs to path so that we can run layout on him
						[startSeg,endSeg].forEach(function(seg){
							h.addPathRefToEachSegment(this,seg);
						},this);
						
						//set up target constraints
						this.targetConstraintX = 
							cm.Constraint(
								cm.NodeAttr(endSeg,"x"),
								depList, 
								getConstraintFunction("x",false)
							);

						this.targetConstraintY = 
							cm.Constraint(
								cm.NodeAttr(endSeg,"y"),
								depList, 
								getConstraintFunction("y",false)
							);
					
						//set up new sourceConstraintX and sourceConstraintY
						this.sourceConstraintX = 
							cm.Constraint(
								cm.NodeAttr(startSeg,"x"),
								depList, 
								getConstraintFunction("x",true)
							);


						this.sourceConstraintY = 
							cm.Constraint(
								cm.NodeAttr(startSeg,"y"),
								depList, 
								getConstraintFunction("y",true)
							);

						constraintGraph.push(this.sourceConstraintX,
									this.sourceConstraintY,
									this.targetConstraintX,
									this.targetConstraintY);
					//}
				},
				remove : function(){
					//remove self from dom
					this.parentNode.removeChild(this);
					
					//remove constraints
					[this.sourceConstraintX,this.sourceConstraintY,this.targetConstraintX,this.targetConstraintY].forEach(function(c){
						constraintGraph.splice(constraintGraph.indexOf(c),1);
					});

				}
			};

			function setupDrawPath(source){

				this.source = source;

				var segList = this.pathSegList;
				var numItems = segList.numberOfItems;
				var startSeg = segList.getItem(0);

				//add path refs to this segment so that we can run layout on him
				h.addPathRefToEachSegment(this,startSeg);

				this.originalSourceConstraintX = this.sourceConstraintX = 
					cm.Constraint(
						cm.NodeAttr(startSeg,"x"),
						cm.NodeAttrExpr(this.source,"bbox"),
						function(sourceBBox){
							return sourceBBox.x + sourceBBox.width/2;
						}

					);

				this.originalSourceConstraintY = this.sourceConstraintY = 
					cm.Constraint(
						cm.NodeAttr(startSeg,"y"),
						cm.NodeAttrExpr(this.source,"bbox"),
						function(sourceBBox){
							return sourceBBox.y + sourceBBox.height/2;
						}

					);

				constraintGraph.push(this.sourceConstraintX,this.sourceConstraintY);

				h.mixin(drawPathBehaviourAPI,this); 
			}

			return setupDrawPath;
		};
	}
);
