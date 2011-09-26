/**
* Copyright (C) 2011 Jacob Beard
* Released under GNU GPL, read the file 'COPYING' for more information
**/
if(typeof location === "undefined"){
	location = "file:///"	//FIXME: expose necessary API in batik to get URI from the navigation bar
}

if(typeof navigator === "undefined"){
	navigator = {
		userAgent : "Mozilla/5.0 (X11; U; Linux i686; en-US) AppleWebKit/534.16 (KHTML, like Gecko) Ubuntu/10.04 Chromium/10.0.648.133 Chrome/10.0.648.133 Safari/534.16"
	}
}

if(typeof console === "undefined"){
	console = {
		log : function(){}
	}
}
