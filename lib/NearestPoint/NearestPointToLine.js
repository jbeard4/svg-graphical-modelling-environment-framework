//implementatino of nearest point to line, based on theory described here: http://paulbourke.net/geometry/pointline/
define(
	function(){

		function getDist(x1,x2,y1,y2){
			return Math.sqrt(Math.pow(x2 - x1,2) + Math.pow(y2 - y1,2));
		}

		return function(seg,p){
			var closestPoint;

			var x1 = seg.x0,
							y1 = seg.y0,
							x2 = seg.x,
							y2 = seg.y,
							x3 = p.x,
							y3 = p.y;

			var u = ((x3 - x1) * (x2 - x1) + (y3 - y1) * (y2 - y1))/
								Math.pow(getDist(x1,x2,y1,y2),2);

			if(u < 0){
				closestPoint = {x:x1,y:y1};
			}else if(u > 1){
				closestPoint = {x:x2,y:y2};
			}else{
				closestPoint = {x:x1 + u * (x2 - x1),
												y:y1 + u * (y2 - y1)};
			}
	
			var dMinimum = getDist(closestPoint.x,closestPoint.y,x3,y3);	//TODO

			return {dMinimum:dMinimum,pMinimum:closestPoint};
		};
	}
);
