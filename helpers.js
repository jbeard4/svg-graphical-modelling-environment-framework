define(
	function(){

		function addPathRefToSegment(path,seg){
			seg.pathRef = path;
		}


		return {
			mixin : function (from,to){
				for(var p in from){
					if(from.hasOwnProperty(p)) to[p] = from[p];
				}
			},


			removeFromList : function (element,list){
				return list.splice(list.indexOf(element),1);
			},

			propNumtoPropString : function (propNum){
				var propStr = propNum || "";
				var propX = "x" + propStr;
				var propY = "y" + propStr;

				return {
					x : propX,
					y : propY
				};

			},

			getStartSegFromPath : function(path){
				var segList =  path.pathSegList;
				var numItems = segList.numberOfItems;
				var startSeg = segList.getItem(0);
				return startSeg;
			},

			
			getEndSegFromPath : function(path){
				var segList =  path.pathSegList;
				var numItems = segList.numberOfItems;
				var endSeg = segList.getItem(numItems-1);
				return endSeg;
			},

			addPathRefToSegment : addPathRefToSegment,

			addPathRefToEachSegment : function(path){
				var segList =  path.pathSegList;
				var numItems = segList.numberOfItems;
				
				for(var i = 0; i < numItems; i++){
					var seg = segList.getItem(i);

					addPathRefToSegment(path,seg);
				} 
			}
		};
	}
);
