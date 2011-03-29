define({
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

	}
});
