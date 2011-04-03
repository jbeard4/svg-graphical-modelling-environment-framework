define(
	["helpers","behaviour/constructors/path-drawable","behaviour/constructors/arrow-editable","behaviour/constructors/removeable"],
	function(h,setupDrawPath,setupArrowEditorBehaviour,setupRemoveable){		
		return function(env,source,x,y){
			x = x || 0;
			y = y || 0;


			var icon = env.svg.group(env.edgeLayer);

			//TODO: make the irst icon expose a nice API like this...
			//TODO: maybe use API to encode behaviour tags?

			//create the group and the path
			//also the source... with the second drop?
			//return the group
			var p = env.svg.createPath().move(x,y).line(x+1,y+1);
			var path = env.svg.path(icon,p);
			$(path).addClass("marker");

			h.addPathRefToEachSegment(path); 

			$(icon).addClass("edge-icon");
			//$(thickPath).addClass("control");

			//set up behaviour interface and data
			setupDrawPath.call(icon,env,source,path);
			setupArrowEditorBehaviour.call(icon,env,path);
			setupRemoveable.call(icon,env);

			return icon;
		};
	}
);
