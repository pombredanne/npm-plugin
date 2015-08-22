var WsHelper = exports;
exports.constructor = function WsHelper(){};

WsLang.dictionary = function(){
	var obj = {
		noConfMsg:"Please create a whitesource.config.json to continue",
		fileMsg:"whitesource.config.json is not a valid JSON file'; 'Getting ready to post report to WhiteSource...",
		running:"Running whitesource...",
		doneShrinkwrap:"Done shrinkwrapping!",
		readingShrinkwrap:"Reading shrinkwrap report"
	}
	return obj;
}

WsLang.text = function(key){
	return WsLang.dictionary()[key];
}