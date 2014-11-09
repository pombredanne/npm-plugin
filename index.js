#!/usr/bin/env node
"use strict";
var shell = require('shelljs/global');
var cli = require('cli');
var fs = require('fs');
var traverse = require('traverse');

var prompt = require('prompt');
prompt.message = "whitesource";
prompt.delimiter = ">".green;

var http = require('http');
var querystring = require('querystring');
var baseURL = 'beta.whitesourcesoftware.com';
var runtime = new Date().valueOf();
var foundedShasum = 0;
var missingShasum = 0;
var confJson = {};
var mapShortToLong = {
    "dependencies": "children",
    "resolved" : "artifactId"
};

var buildCallback = function(){
	var timer = new Date().valueOf() - runtime;
	timer = timer / 1000;
	cli.ok('Running callback');
	cli.ok('Build success!' + " ( took: " + timer +"s ) " );
}


var refit_keys = function(o){
    var build, key, destKey, ix, value;

    build = {};
    for (key in o) {

        // Get the destination key
        destKey = mapShortToLong[key] || key;

        // Get the value
        value = o[key];

        // If this is an object, recurse
        if (typeof value === "object") {
            value = refit_keys(value);
        }

        // Set it on the result using the destination key
        build[destKey] = value;
        if(destKey === "children"){
        	build[destKey] = [];
        	for (var i in value){
        		build[destKey].push(value[i]);
        		value[i].name = i;
        		value[i].groupId = i;
        		value[i].systemPath = null;
        		value[i].scope = null;;
        		value[i].exclusions = [];
				value[i].classifier = null;
        	}
        }
    }
    return build;
}




var postJson = function(){
	cli.ok('Posting report to WhiteSource...');
	var origJson = JSON.parse(fs.readFileSync('./whitesource.report.json', 'utf8'));
	var modifiedJson = refit_keys(origJson);
	var modJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
	if(!modJson.name || !modJson.version){
		cli.error('Node module -Name- and -Version- must be specified in module Package.json file');
		return false;
	}


	var json = [{
		dependencies:modifiedJson.children,
		coordinates:{
        	"artifactId": modJson.name,
	        "version":modJson.version
    	}
	}]

	  // Build the post string from an object
	  var ts = new Date().valueOf();
	  var post_data = querystring.stringify({
		  'type' : 'UPDATE',
		  'agent':'generic',
		  'agentVersion':'1.0',
		  'product':'',
		  'productVersion':'',
		  'token':confJson.token,
		  'timeStamp':ts,
		  'diff':JSON.stringify(json)
	  });

	  // An object of options to indicate where to post to
	  var post_options = {
	      host: (confJson.baseURL) ? confJson.baseURL : baseURL,
	      /*host: '10.0.0.11',*/
	      port: '80',
	      path: '/agent',
	      method: 'POST',
	      headers: {
	          'Content-Type': 'application/x-www-form-urlencoded',
	          /*'Content-Length': post_data.length*/
	      }
	  };

	  // Set up the request
	  var post_req = http.request(post_options, function(res) {
	      res.setEncoding('utf8');
	      res.on('data', function (chunk) {
	          cli.ok('Response: ' + chunk);
	          if(chunk.status == 1){
	          		buildCallback();
	          }else{
	          	//cli.error('Build failed due to bad request');
	          }
	      });
	  });

	  // post the data
	  post_req.write(post_data);
	  post_req.end();

}


var traverseJson = function(callback){
	cli.ok("Building dependencies report");
	var shrinkwrap = JSON.parse(fs.readFileSync("./npm-shrinkwrap.json", 'utf8'));
	var parseData = shrinkwrap;
	var scrubbed = traverse(parseData).paths();
	for (var i = 0; i<scrubbed.length; i++){
		var path = scrubbed[i];
		for(var j = 0; j<path.length; j++){
			var isDep =  (path[j] === "dependencies")
			var isVer = (path[j] === "version");
			var isResolved = (path[j] === "resolved");
			var isFrom = (path[j] === "from");
			var isName = (path[j] === "name");
			var isShasum = ((path[j] === "shasum" ) || (path[j] === "_shasum")); //shasum can be "_shasum"
		//	var isShasum = (path[j] === "shasum"); //shasum can be "_shasum"
			var isNodeMod = (path[j] === "node_modules");
			if(isDep){
				path[j] = "node_modules";
				isNodeMod = true;
			}

	        if(path[j] === path[path.length -1]
	        	 && !isName && !isNodeMod && !isFrom
	        	 && !isResolved && !isVer && !isShasum){
		        	var pointerStrng = scrubbed[i].join('.').replace(/node_modules/gi, "dependencies");
		        	var uri = scrubbed[i].join('/') + "/package.json";
		        	//console.log('scanning for shasum at path: ' + uri )
		        	var strArr = uri.split("");
		        	for(var k = 0; k<strArr.length; k++){
					   if(strArr[k] == "/"){
					    strArr[k] = '"]["';
					   }
					}

					var joinedStr = strArr.join('');
					joinedStr = joinedStr.substr(0,joinedStr.lastIndexOf('['));
					var objPointer = 'parseData["' + joinedStr.replace(/node_modules/gi, "dependencies");
					var dataObjPointer = eval(objPointer);
		       		var obj = JSON.parse(fs.readFileSync(uri, 'utf8'));

		       		if(obj.dist || obj._shasum){
		       			//cli.ok('Founded dependencie shasum');
		       			if(obj.dist){
		       				dataObjPointer.shasum = obj.dist.shasum;
		       				path.shasum = obj.dist.shasum;
		       			}
		       			if(obj._shasum){
		       				dataObjPointer.sha1 = obj._shasum;
		       				path.sha1 = obj._shasum;
		       			}

		       			foundedShasum++;
		       		}else{//couldn't find shasum key
		       			missingShasum++;
		       			cli.info('Missing : ' +  obj.name);
		       		}
	       		
	         }
		}
	}

	cli.info("Total shasum found: " + foundedShasum);
	cli.info("Missing shasum: " + missingShasum);
  	cli.info("Total project dependencies: " + (missingShasum + foundedShasum));

	cli.ok("Saving dependencies report");
	fs.writeFile("whitesource.report.json", JSON.stringify(parseData, null, 4), function(err) {
	    if(err){
	      cli.error(err);
	    } else {
	      callback();
	    }
	}); 

}

cli.parse(null, ['test', 'config','run']);
cli.main(function (args, options) {

	try{
		var noConfMsg = 'Please create a whitesource.config.json to continue';
		var fileMsg = 'whitesource.config.json is not a valid JSON file';
		confJson = fs.readFileSync('./whitesource.config.json', 'utf8',
		function(err,data){
			if(!err){
				cli.error(fileMsg);
				return false;
			}
		});	
		confJson = JSON.parse(confJson);
	}catch(e){
		cli.error(noConfMsg);
		return false;
	}

	if(cli.command === "run"){
		cli.ok('Running whitesource...');
		exec('npm shrinkwrap');
		cli.ok('Done shrinkwrapping!');
		traverseJson(postJson);
	}

	if(cli.command === "test"){
	}

	if(cli.command === "config"){
	}
})