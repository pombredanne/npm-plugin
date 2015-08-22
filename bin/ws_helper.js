var WsHelper = exports;
exports.constructor = function WsHelper(){};

var fs = require('fs');
var cli = require('cli');

var noConfMsg = 'Please create a whitesource.config.json to continue';
var fileMsg = 'whitesource.config.json is not a valid JSON file';

WsHelper.initConf = function(){
	 try{
		res = fs.readFileSync('./whitesource.config.json', 'utf8',function(err,data){
			if(!err){
				cli.error(fileMsg);
				return false;
			}
		});	
		res = JSON.parse(res);
	}catch(e){
		cli.error(noConfMsg);
		return false;
	}

	return res;

}

WsHelper.saveReportFile = function(json,filename){
	try{
		fs.writeFile("ws-log-" + filename, JSON.stringify(json, null, 4), function(err) {
		    if(err){
		      cli.error(err);
		    }else{}
		});
	}catch(e){
		cli.error(e);
	}
}