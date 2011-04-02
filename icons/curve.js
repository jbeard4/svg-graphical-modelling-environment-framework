define(
	["helpers","behaviour/constructors/path-drawable","behaviour/constructors/arrow-editable","behaviour/constructors/removeable"],
	function(h,setupDrawPath,setupArrowEditorBehaviour,setupRemoveable){		
		return function(env,source,x,y){
			x = x || 0;
			y = y || 0;

			//TODO: make the irst icon expose a nice API like this...
			//TODO: maybe use API to encode behaviour tags?

			//create the group and the path
			//also the source... with the second drop?
			//return the group
			var p = env.svg.createPath();
			var path = env.svg.path(env.edgeLayer,p.move(x,y).line(x+1,y+1));

			h.addPathRefToEachSegment(path); 

			$(path).addClass("edge-icon");

			//set up behaviour interface and data
			setupDrawPath.call(path,env,source);
			setupArrowEditorBehaviour.call(path,env);
			setupRemoveable.call(path,env);

			return path;
		};
	}
);
