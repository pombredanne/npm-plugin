var WsBowerHelper = exports;
exports.constructor = function WsBowerHelper(){};

var fs = require('fs');
var cli = require('cli');
var glob = require('glob');
var checksum = require('checksum');
var WsBowerReportBuilder = require('./ws_bower_report_builder');

WsBowerHelper.checksumBowerDeps = function(files){
	for(var i = 0; i<files.length; i++){
		var file = files[i];
		var locationHash = file.split('/');
		locationHash.pop();
		var newLoc = locationHash.join('/');
		var compBower = JSON.parse( fs.readFileSync(file, 'utf8') );
		var callback = function (err, sum) {
			WsBowerHelper.writeSha1File(newLoc,sum);
		};
		console.log('checksum now for ' + newLoc + "/" + compBower.main)
		checksum.file(newLoc + "/" + compBower.main, callback);
	}

	// for (var i = 0; i< bowerDepsFilePaths.length; i++){
		
	// }
}


WsBowerHelper.generateCompsSha1 = function(){
	var bowerDir = WsBowerReportBuilder.getBowerCompsDir();
	var files = glob.sync( bowerDir + "/**/.bower.json", {});
	WsBowerHelper.checksumBowerDeps(files);
}

WsBowerHelper.writeSha1File = function(location,sum){
	try{
	
		fs.writeFile(location + "/.ws_sha1.json", JSON.stringify({"sha1":sum}, null, 4), function(err) {
		    if(err){
		      cli.error(err);
		    }else{}
		});
	}catch(e){
		cli.error(e);
	}
}
