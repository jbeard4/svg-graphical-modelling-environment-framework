/**
* Copyright (C) 2011 Jacob Beard
* Released under GNU GPL, read the file 'COPYING' for more information
**/
define(["helpers","c","lib/NearestPoint/NearestPointToPath","lib/geometry/2D.js","lib/geometry/Intersection.js"],


	function(h,cm,getNearestPointOnPath){

		//constraint computes the center point of the box constraints
		//get the intersection of that, and the other point we're giving it
		function getSourceConstraintFunction(xOrY){
			return function(x0,y0,toX,toY,toWidth,toHeight){
				var x1 = toX + toWidth/2;
				var y1 = toY + toHeight/2;


				var p1 = new Point2D(x0,y0),
					p2 = new Point2D(x1,y1);

				var r1,r2;
				r1 = new Point2D(toX,toY);
				r2 = new Point2D(toX + toWidth, toY + toHeight);

				var inter = Intersection.intersectLineRectangle(p1,p2,r1,r2);

				var point = inter.points.pop();

				return point && point[xOrY];	//if there's no intersection, we might get back undefined
			};
		}


		function getSimpleConstraintFunction(xOrY,isSource){
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



		//we define this out here, because if we did it inside of the setup function, we would be create new function instances for each path object that gets set up. wastes memory	
		var drawPathBehaviourAPI = {

			willPathBeEmptyAfterRemovingNextPoint : function (){
				return this.path.pathSegList.numberOfItems==2;	
			},

			rollbackPoint : function (){
				this.path.pathSegList.removeItem(this.path.pathSegList.numberOfItems-2);
			},

			setEndPoint : function (x,y){
				var segList = this.path.pathSegList;
				var numItems = segList.numberOfItems;
				var endSeg = segList.getItem(numItems-1);

				endSeg.x = x;
				endSeg.y = y;
			},

			createNewQuadraticSegment : function (x,y,x1,y1){
				var n = this.path.createSVGPathSegCurvetoQuadraticAbs(x,y,x1,y1);
				this.path.pathSegList.appendItem(n);

				h.addPathRefToSegment(this.path,n);

				return n;
			},

			createNewLineSegment : function (x,y){
				var n = this.path.createSVGPathSegLinetoAbs(x,y);
				this.path.pathSegList.appendItem(n);

				h.addPathRefToSegment(this.path,n);

				return n;
			},

			addControlPoint : function (x,y,mirror){
				var segList = this.path.pathSegList;
				var numItems = segList.numberOfItems;
				var endSeg = segList.getItem(numItems-1);
				var newSeg;

				//first item will be M, second item will be the initial this drawing segment
				if(numItems > 1){
					if(endSeg.x2 === undefined && endSeg.x1 === undefined){
						//upgrade him to a quadratic
						newSeg = this.path.createSVGPathSegCurvetoQuadraticAbs(endSeg.x,endSeg.y,x,y);
						segList.replaceItem(newSeg,numItems-1); 

						h.addPathRefToSegment(this.path,newSeg);

					}
					else if(endSeg.x2 === undefined && endSeg.x1 !== undefined){
						//upgrade him to a cubic
						//var newSegX2 = x + 2*( endSeg.x1 - x );
						//var newSegY2 = y + 2*( endSeg.y1 - y );
						newSeg = this.path.createSVGPathSegCurvetoCubicAbs(endSeg.x,endSeg.y,endSeg.x1,endSeg.y1,x,y);
						segList.replaceItem(newSeg,numItems-1);

						h.addPathRefToSegment(this.path,newSeg);
					}
				}
			},
			setLastControlPoint : function(x,y,mirror){
				//get the last control point
				var segList = this.path.pathSegList;
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
				var endSeg;



				//create a thick path, which the user will interact with
				this.thickPath = this.path.cloneNode(true);
				$(this.thickPath).removeClass("marker");
				$(this.thickPath).addClass("control");
				h.addPathRefToEachSegment(this.thickPath); 
				this.appendChild(this.thickPath); 

				this.thickPathBindingConstraints = [];

				//set constraints on thickPath
				for(var i=0, l=this.path.pathSegList.numberOfItems; i < l;i++){
					var pathSeg = this.path.pathSegList.getItem(i);
					var thickPathSeg = this.thickPath.pathSegList.getItem(i);
					
					if(pathSeg.x2 !== undefined){
						this.thickPathBindingConstraints.push(
							cm.Constraint(
								cm.NodeAttr(thickPathSeg,"x2"),
								cm.NodeAttrExpr(pathSeg,"x2")
							),
							cm.Constraint(
								cm.NodeAttr(thickPathSeg,"y2"),
								cm.NodeAttrExpr(pathSeg,"y2")
							)
						);
					}
					if(pathSeg.x1 !== undefined){
						this.thickPathBindingConstraints.push(
							cm.Constraint(
								cm.NodeAttr(thickPathSeg,"x1"),
								cm.NodeAttrExpr(pathSeg,"x1")
							),
							cm.Constraint(
								cm.NodeAttr(thickPathSeg,"y1"),
								cm.NodeAttrExpr(pathSeg,"y1")
							)
						);
					}
					if(pathSeg.x !== undefined){
						this.thickPathBindingConstraints.push(
							cm.Constraint(
								cm.NodeAttr(thickPathSeg,"x"),
								cm.NodeAttrExpr(pathSeg,"x")
							),
							cm.Constraint(
								cm.NodeAttr(thickPathSeg,"y"),
								cm.NodeAttrExpr(pathSeg,"y")
							)
						);
					}
				}

				console.log("this.thickPathBindingConstraints",this.thickPathBindingConstraints);

				this.thickPathBindingConstraints.forEach(function(c){
					this.env.constraintGraph.push(c);
				},this);

				/*
				//TODO: another possibility is to cheat and just mind to "d" attr
				//we would need to make our constraint solver smarter for that though
				//it would need to know that "d" means having a dependency on all attributes of all segment nodes
				//if we were to just use "d" without changing the constraint solver, then the topo sort would not work correctly.
				this.thickPathBindingConstraint = 
					cm.Constraint(
						cm.NodeAttr(this.path,"d"),
						cm.NodeAttrExpr(this.thickPath,"d")
					);

				this.env.constraintGraph.push(this.thickPathBindingConstraint);
				*/



				//remove and update sourceConstraintX and sourceConstraintY to avoid arrow occlusion 
				[this.sourceConstraintX,this.sourceConstraintY].forEach(function(c){
					h.removeFromList(c,this.env.constraintGraph);
				},this);

				var segList = this.path.pathSegList;
				var numItems = segList.numberOfItems;
	
				endSeg = segList.getItem(numItems-1);
				var startSeg = segList.getItem(0);
				var segAfterStartSeg = segList.getItem(1);
				
				var  getTargetConstraintFunction,
					afterStartSegPropStr,
					beforeEndSegPropStr,
					startDepList,
					endDepList,
					depList,
					segBeforeEndSeg;

				var targetIsPath = target.localName === "path";
				var useAdvancedLayout = numItems > 2 || segAfterStartSeg.x1 !== undefined || targetIsPath;

				//set up the constraint graph for the target
				//will be different depending on if we're targeting a path, or something else
				console.log("target",target);
				this.target = target;
				if(useAdvancedLayout){

					afterStartSegPropStr = segAfterStartSeg.x1 !== undefined ?  "1" : ""; 

					if(endSeg.x2 !== undefined){
						beforeEndSegPropStr = "2";
						segBeforeEndSeg = endSeg;
					}else if(endSeg.x1 !== undefined){
						beforeEndSegPropStr = "1";
						segBeforeEndSeg = endSeg;
					}else{
						beforeEndSegPropStr = "";
						segBeforeEndSeg = segList.getItem(numItems-2);
					}

					if(targetIsPath){

						endDepList = [
									cm.NodeAttrExpr(segBeforeEndSeg,"x" + beforeEndSegPropStr),
									cm.NodeAttrExpr(segBeforeEndSeg,"y" + beforeEndSegPropStr),
									cm.NodeAttrExpr(target,"pathSegList")];

						//constraint computes the center point of the box constraints
						//get the intersection of that, and the other point we're giving it
						getTargetConstraintFunction = function(xOrY){
							return function(x0,y0,segList){
								var o = getNearestPointOnPath(segList,{x:x0,y:y0});

								var pMin = o.pMinimum;

								return pMin[xOrY];
							};
						};
					}else{


						endDepList = [
									cm.NodeAttrExpr(segBeforeEndSeg,"x" + beforeEndSegPropStr),
									cm.NodeAttrExpr(segBeforeEndSeg,"y" + beforeEndSegPropStr),
									cm.NodeAttrExpr(target,"x"),
									cm.NodeAttrExpr(target,"y"),
									cm.NodeAttrExpr(target,"width"),
									cm.NodeAttrExpr(target,"height")];

						//constraint computes the center point of the box constraints
						//get the intersection of that, and the other point we're giving it
						getTargetConstraintFunction = function(xOrY){
							return function(x0,y0,toX,toY,toWidth,toHeight){
								var x1 = toX + toWidth/2;
								var y1 = toY + toHeight/2;


								var p1 = new Point2D(x0,y0),
									p2 = new Point2D(x1,y1);

								var r1,r2;
								r1 = new Point2D(toX,toY);
								r2 = new Point2D(toX + toWidth, toY + toHeight);

								var inter = Intersection.intersectLineRectangle(p1,p2,r1,r2);

								var point = inter.points.pop();

								return point && point[xOrY];	//if there's no intersection, we might get back undefined
							};
						};
					}

					//constraint will be the intersection between the rect, 
					//and the line starting from the center of the rect and extending to the point we have picked out. 
					startDepList = [
								cm.NodeAttrExpr(segAfterStartSeg,"x" + afterStartSegPropStr),
								cm.NodeAttrExpr(segAfterStartSeg,"y" + afterStartSegPropStr),
								cm.NodeAttrExpr(this.source,"x"),
								cm.NodeAttrExpr(this.source,"y"),
								cm.NodeAttrExpr(this.source,"width"),
								cm.NodeAttrExpr(this.source,"height")];

					//set up new sourceConstraintX and sourceConstraintY
					this.sourceConstraintX = 
						cm.Constraint(
							cm.NodeAttr(startSeg,"x"),
							startDepList, 
							getSourceConstraintFunction("x",true)
						);


					this.sourceConstraintY = 
						cm.Constraint(
							cm.NodeAttr(startSeg,"y"),
							startDepList, 
							getSourceConstraintFunction("y",true)
						);

					//set up target constraints
					this.targetConstraintX = 
						cm.Constraint(
							cm.NodeAttr(endSeg,"x"),
							endDepList,
							getTargetConstraintFunction("x",false)
						);

					this.targetConstraintY = 
						cm.Constraint(
							cm.NodeAttr(endSeg,"y"),
							endDepList,
							getTargetConstraintFunction("y",false)
						);
				

					this.env.constraintGraph.push(this.sourceConstraintX,
								this.sourceConstraintY,
								this.targetConstraintX,
								this.targetConstraintY);

				}else{
					
					depList = [cm.NodeAttrExpr(this.source,"x"),
								cm.NodeAttrExpr(this.source,"y"),
								cm.NodeAttrExpr(this.source,"width"),
								cm.NodeAttrExpr(this.source,"height"),
								cm.NodeAttrExpr(target,"x"),
								cm.NodeAttrExpr(target,"y"),
								cm.NodeAttrExpr(target,"width"),
								cm.NodeAttrExpr(target,"height")];
					
					//set up target constraints
					this.targetConstraintX = 
						cm.Constraint(
							cm.NodeAttr(endSeg,"x"),
							depList, 
							getSimpleConstraintFunction("x",false)
						);

					this.targetConstraintY = 
						cm.Constraint(
							cm.NodeAttr(endSeg,"y"),
							depList, 
							getSimpleConstraintFunction("y",false)
						);
				
					//set up new sourceConstraintX and sourceConstraintY
					this.sourceConstraintX = 
						cm.Constraint(
							cm.NodeAttr(startSeg,"x"),
							depList, 
							getSimpleConstraintFunction("x",true)
						);


					this.sourceConstraintY = 
						cm.Constraint(
							cm.NodeAttr(startSeg,"y"),
							depList, 
							getSimpleConstraintFunction("y",true)
						);

					this.env.constraintGraph.push(this.sourceConstraintX,
								this.sourceConstraintY,
								this.targetConstraintX,
								this.targetConstraintY);
				}
				
			},
			unsetTarget : function(){
				//TODO: use a better test
				if(this.target.localName !== "path"){
					this.thickPath.parentNode.removeChild(this.thickPath);

					var constraintsToRemove = 
						this.thickPathBindingConstraints.concat([
							this.sourceConstraintX,
							this.sourceConstraintY,
							this.targetConstraintX,
							this.targetConstraintY]);

					constraintsToRemove.forEach(function(c){
						h.removeFromList(c,this.env.constraintGraph);
					},this);

					//putt original source constraints back in the graph
					this.sourceConstraintX = this.originalSourceConstraintX;
					this.sourceConstraintY = this.originalSourceConstraintY;
					this.env.constraintGraph.push(this.originalSourceConstraintX,this.originalSourceConstraintY);
				}

			}
		};

		function setupDrawPath(env,source,path){

			this.env = env;

			$(source).addClass("path-drawable");

			this.source = source;
			this.path = path;

			var segList = this.path.pathSegList;
			var numItems = segList.numberOfItems;
			var startSeg = segList.getItem(0);

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

			env.constraintGraph.push(this.sourceConstraintX,this.sourceConstraintY);

			h.mixin(drawPathBehaviourAPI,this); 
		}

		return setupDrawPath;
	}
);
