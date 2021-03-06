define(
		["lib/NearestPoint/BezierUtils",
			"lib/NearestPoint/NearestPointToLine"],
		function(closestPointToBezier,nearestPointToLine){
			return function(pathOrSegList,p){
				var pathSegList = pathOrSegList.pathSegList || pathOrSegList;

				//assume first seg is move seg
				var prevSeg = pathSegList.getItem(0);
				var dMin = Number.MAX_VALUE, 
						pMin = null;

				for(var i=1; i < pathSegList.numberOfItems; i++){
					var curSeg = pathSegList.getItem(i);
				
					//he must be a close path; TODO: deal with this.
					if(curSeg.x === undefined) continue;

					curSeg.x0 = prevSeg.x;
					curSeg.y0 = prevSeg.y;

					//he must be a line segment (we could check his path seg type property as well....)
					var fn = curSeg.x1 === undefined ? 
								nearestPointToLine : 
								closestPointToBezier;

					var o = fn(curSeg,p);

					if(o.dMinimum < dMin){
						dMin = o.dMinimum;
						pMin = o.pMinimum;
					}

					prevSeg = curSeg;
				}

				return {
					dMinimum : dMin,
					pMinimum : pMin
				};
				
			};
		}
);
