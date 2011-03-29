define(["helpers"],
	function(h){
		return function(hookElementEventsToStatechart){
			//resize stuff

			var resizableEastAPI = {
				resizeTo : function(x,y){
					this.x1.baseVal.value = x;
					this.x2.baseVal.value = x;
					this.associatedRect.width.baseVal.value = x - this.associatedRect.x.baseVal.value;
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
				resizeTo : function(x,y){
					this.y1.baseVal.value = y;
					this.y2.baseVal.value = y;
					this.associatedRect.height.baseVal.value = y - this.associatedRect.y.baseVal.value;
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
				resizeTo : function(x,y){
					this.x1.baseVal.value = x;
					this.x2.baseVal.value = x;
					this.y1.baseVal.value = y;
					this.y2.baseVal.value = y;
					this.associatedRect.width.baseVal.value = x - this.associatedRect.x.baseVal.value;
					this.associatedRect.height.baseVal.value = y - this.associatedRect.y.baseVal.value;
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
