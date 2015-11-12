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
		var compMainFile = compBower.main;
		if(Object.prototype.toString.call(compMainFile) === "[object Array]"){
			compMainFile = compMainFile[0];
		}
		if(compMainFile[0] == "."){
			compMainFile = compMainFile.substr(1);
		}
		if(compMainFile[0] == "/"){
			compMainFile = compMainFile.substr(1);
		}

		var callback = function (err, sum,isLast) {
			console.log(this.newLoc + "  sum: " + sum);
			WsBowerHelper.writeSha1File(this.newLoc,sum);
		}

		// console.log('checksum now for ' + newLoc + "/" + compMainFile);
		checksum.file(newLoc + "/" + compMainFile, callback.bind({newLoc:newLoc}));
		// checksum.file(newLoc + "/" + compMainFile, function(){
		// 	console.log('wtf?')
		// });
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
		// console.log('writing sha1 : ' + sum + " to " + location + "/.ws_sha1.json");
		fs.writeFileSync(location + "/.ws-sha1.json", JSON.stringify({"sha1":sum}, null, 4),{});
	}catch(e){
		cli.error(e);
	}
}
