define(
	function(){		
		return function(svg,edgeLayer,setupDrawPath,setupArrowEditorBehaviour){
			return function(source,x,y){
				x = x || 0;
				y = y || 0;

				//TODO: make the irst icon expose a nice API like this...
				//TODO: maybe use API to encode behaviour tags?

				//create the group and the path
				//also the source... with the second drop?
				//return the group
				var p = svg.createPath();
				var path = svg.path(edgeLayer,p.move(x,y).line(x+1,y+1));
				path.setAttributeNS(null,"class","edge");	//TODO: jquery-ify this statement

				//set up behaviour interface and data
				setupDrawPath.call(path,source);
				setupArrowEditorBehaviour.call(path);

				return path;
			};
		};
	}
);
