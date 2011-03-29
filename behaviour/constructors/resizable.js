define(["helpers"],
	function(h){
		return function(hookElementEventsToStatechart){
			//resize stuff

			var resizableEastAPI = {
				resizeBy : function(delta){
                    var dx = delta.dx;
                    console.log(dx);
					this.x1.baseVal.value += dx;
					this.x2.baseVal.value += dx;
					this.associatedRect.width.baseVal.value += dx;
				}
			};

			function setupResizableEast(kwArgs){

				this.behaviours = this.behaviours || {};

				this.behaviours.RESIZABLE = true;

				$(this).addClass("resizable-e");

				hookElementEventsToStatechart(this,["mousedown"],true);

				h.mixin(resizableEastAPI,this);

				h.mixin(kwArgs,this);
				
			}

			var resizableSouthAPI = {
				resizeBy : function(delta){
                    var dy = delta.dy;
					this.y1.baseVal.value = dy;
					this.y2.baseVal.value = dy;
					this.associatedRect.height.baseVal.value += dy;
				}
			};

			function setupResizableSouth(kwArgs){

				this.behaviours = this.behaviours || {};

				this.behaviours.RESIZABLE = true;

				$(this).addClass("resizable-s");

				hookElementEventsToStatechart(this,["mousedown"],true);

				h.mixin(resizableSouthAPI,this);

				h.mixin(kwArgs,this);
			}


			var resizableSouthEastAPI = {
				resizeBy : function(delta){
                    var dx = delta.dx, dy = delta.dy;
					this.x1.baseVal.value += dx;
					this.x2.baseVal.value += dx;
					this.y1.baseVal.value += dy;
					this.y2.baseVal.value += dy;
					this.associatedRect.width.baseVal.value += dx;
					this.associatedRect.height.baseVal.value += dy;
				}
			};

			function setupResizableSouthEast(kwArgs){

				this.behaviours = this.behaviours || {};

				this.behaviours.RESIZABLE = true;

				$(this).addClass("resizable-se");

				hookElementEventsToStatechart(this,["mousedown"],true);

				h.mixin(resizableSouthEastAPI,this);

				h.mixin(kwArgs,this);
			}

			return {
				setupResizableEast : setupResizableEast,
				setupResizableSouth : setupResizableSouth,
				setupResizableSouthEast : setupResizableSouthEast
			};
		};
	}
);
