var WsBowerReportBuilder = exports;
exports.constructor = function WsBowerReportBuilder(){};

var fs = require('fs');
var cli = require('cli');
var glob = require('glob');

var MissingBower = 'Problem reading Bower.json, please check the file exists and is a valid JSON';
var invalidBowerFile = 'Problem reading Bower.json, please check that you added a NAME and VERSION to the bower.json file.';
var errorReadingBowerFiles = "error reading bower dependencies bower.json file.";


WsBowerReportBuilder.getBowerCompsDir = function(){
	try{
		var origJson = JSON.parse(fs.readFileSync('./.bowerrc', 'utf8'));
		if(origJson.directory){
			return origJson.directory; //custom user setting directory.
		}
	}catch(e){
		return "bower_components"; //default directory;
	}
}

WsBowerReportBuilder.buildReport = function(){
	var depsArray = [];
	var report_JSON = {};
	try{
		bowerFile = JSON.parse(fs.readFileSync('./bower.json', 'utf8'));
	}catch(e){
		cli.error(MissingBower);
		return false;
	}

	try{
		report_JSON.name = bowerFile.name;
		report_JSON.version = bowerFile.version;
	}catch(e){
		cli.error(invalidBowerFile);
		return false;
	}

	var bowerDeps = bowerFile.dependencies;

	var options = {};
	try {
		var files = glob.sync( WsBowerReportBuilder.getBowerCompsDir() + "/**/bower.json", options);
	}catch(e){
		cli.error(erroRReadingBowerFiles);
	}


	for(var i = 0; i<files.length; i++){
		try{
			console.log('reading: + ' + files[i]);
			bowerFile = JSON.parse(fs.readFileSync(files[i], 'utf8'));
			var item = {};
			item['name'] = bowerFile.name;
			item['artifactId'] = bowerFile.name;
			item['version'] = bowerFile.version;
			item['groupId'] = bowerFile.name;
			item['systemPath'] = null;
			item['scope'] = null;
			item['exclusions'] = [];
			item['children'] = [];
			item['classifier'] = null;
			depsArray.push(item);
		}catch(e){
			//should never happen but, only if bowerfile is missing the name | ver node. 
			cli.error(invalidBowerFile);
			cli.error("bower plugin file route:  " + files[i]);
			return false;
		}
	}

	return {"deps":depsArray,"report":report_JSON};
}