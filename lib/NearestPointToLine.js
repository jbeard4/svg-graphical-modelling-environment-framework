//implementatino of nearest point to line, based on theory described here: http://paulbourke.net/geometry/pointline/
define(
	function(){
		return function(seg,p){
			var closestPoint;

			var x1 = seg.x0,
							y1 = seg.y0,
							x2 = seg.x,
							y2 = seg.y,
							x3 = p.x,
							y3 = p.y;

			var u = ((x3 - x1) * (x2 - x1) + (y3 - y1) * (y2 - y1))/
								Math.pow(Math.sqrt(Math.pow(x2 - x1,2) + Math.pow(y2 - y1,2)),2);

			if(u < 0){
				closestPoint = {x:x1,y:y1};
			}else if(u > 1){
				closestPoint = {x:x2,y:y2};
			}else{
				closestPoint = {x:x1 + u * (x2 - x1),
												y:y1 + u * (y2 - y1)};
			}

			return closestPoint;
		};
	}
);
