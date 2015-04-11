#!/usr/bin/env node

'use strict';

process.title = 'whitesource';
var shell = require('shelljs/global');
var cli = require('cli');
var fs = require('fs');
var traverse = require('traverse');
var prompt = require('prompt');
prompt.message = "whitesource";
prompt.delimiter = ">".green;
var http = require('http');
var https = require('https');
var querystring = require('querystring');
var baseURL = 'saas.whitesourcesoftware.com';
var runtime = new Date().valueOf();
var foundedShasum = 0;
var missingShasum = 0;
var confJson = {};

var checkPolSent = false;
var mapShortToLong = {
    "dependencies": "children",
    "resolved" : "artifactId"
};

var buildCallback = function(resJson){
	var timer = new Date().valueOf() - runtime;
	timer = timer / 1000;
	

	var finish = function(){
		cli.ok('Build success!' + " ( took: " + timer +"s ) " );
		process.exit(0);
	}


	if(!checkPolSent){
	fs.writeFile("whitesource.response.json", JSON.stringify(resJson, null, 4),function(err){
	if(err){
	cli.error(err);
	}
	});
	}

	cli.ok('Running callback');
	if(checkPolEnabled()){
		console.log(resJson)
		var existingProjs = resJson.existingProjects;
		var newProjs = resJson.newProjects;
		var failBuild = false;
		var policyDeps = [];
		var newDeps = [];
		//check and handle exsiting projects
		if(existingProjs){
			for (key in existingProjs) {
				var projChildren = existingProjs[key].children;
				for(var i = 0; i<projChildren.length; i++){
						if(projChildren[i].policy){
							policyDeps.push(projChildren[i]);
							failBuild = true;
						}
				}
			}
		}

		//check and handle new projects
		if(newProjs){
			for (key in newProjs) {
				var projChildren = newProjs[key].children;
				for(var i = 0; i<projChildren.length; i++){
						newDeps.push(projChildren[i]);
						if(projChildren[i].policy){
							policyDeps.push(projChildren[i]);
							failBuild = true;
						}
				}
			}
		}
		if(policyDeps.length != 0){
			cli.error("Policy violations found exiting build")
			cli.info("See list of violations:")
			for(var i = 0; i<policyDeps.length; i++){
				cli.info(policyDeps[i].resource.displayName + " : " + policyDeps[i].policy.displayName);
			}
		}else{
	/*		finish();
			return false; //disable checkPolicy.*/
		   cli.ok("No policy violations found");
		   if(checkPolSent){
		   		finish();
		   }else{
		   	checkPolSent = true;
		   	postJson()
		   }
		}
	}

	finish();
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
	cli.ok('Getting ready to post report to WhiteSource...');
	var origJson = JSON.parse(fs.readFileSync('./whitesource.report.json', 'utf8'));
	var modifiedJson = refit_keys(origJson);
	try{
		var modJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
	}catch(e){
		cli.error('Problem reading Package.json, please check the file is a valid JSON');
		return false;
	}

	if(!modJson.name || !modJson.version){
		cli.error('Node module -Name- and -Version- must be specified in module Package.json file');
		return false;
	}

	var isHttps = true;
	
	if(typeof(confJson.https) !== "undefined"){
		 isHttps = confJson.https;
	}
	
	var reqHost = (confJson.baseURL) ? confJson.baseURL : baseURL;
	var port = (confJson.port) ? confJson.port : "443";
	var productName = (confJson.productName) ? confJson.productName : modJson.name;
	var productVer = (confJson.productVersion) ? confJson.productVersion : modJson.version;
	var productToken = (confJson.productToken) ? confJson.productToken : "";
	var projectName = (confJson.projectName) ? confJson.projectName : modJson.name;
	var projectVer = (confJson.projectVer) ? confJson.projectVer : modJson.version;
	var projectToken = (confJson.projectToken) ? confJson.projectToken : "";
	var ts = new Date().valueOf();
	var post_req;

	if(!confJson.apiKey){
		cli.error('Cant find API Key, please make sure you input your whitesource API token in the whitesource.config file.');
		return false
	}

	
	if(projectToken && productToken){
		cli.error('Cant use both project Token & product Token please select use only one token,to fix this open the whitesource.config file and remove one of the tokens.');
		return false
	}

	var json = [{
		dependencies:modifiedJson.children,
		coordinates:{
        	"artifactId": modJson.name,
	        "version":modJson.version
    	}
	}]
	var checkPol = (confJson.checkPolicies) ? confJson.checkPolicies : true;
	var myReqType = ((checkPol && !checkPolSent) ? 'CHECK_POLICIES' : 'UPDATE');

	if(!checkPolEnabled()){
		myReqType = 'UPDATE';
	}

	var myPost = {
		  'type' : myReqType,
		  'agent':'npm-plugin',
		  'agentVersion':'1.0',
		  'product':productName,
		  'productVer':productVer,
		  'projectName':projectName,
		  'projectVer':projectVer,
		  'token':confJson.apiKey,
		  'timeStamp':ts,
		  'diff':JSON.stringify(json)
	  }
		console.log(myPost);
	  //if both Project-Token and ProductToken send the Project-Token
	  if(projectToken){
		myPost.projectToken = projectToken;
	  }else if(productToken){
	  	myPost.productToken = productToken;
	  }

	  // Build the post string from an object
	  var post_data = querystring.stringify(myPost);

	  cli.ok("Posting to " + reqHost + ":" + port)

	  // An object of options to indicate where to post to
	  var post_options = {
	      host: reqHost,
	      /*host: '10.0.0.11',*/
	      port: port,
	      path: '/agent',
	      method: 'POST',
	      headers: {
	          'Content-Type': 'application/x-www-form-urlencoded',
	          /*'Content-Length': post_data.length*/
	      }
	  };

	  var callback = function(res){
	  	  var str = [];
  		  res.on('data', function (chunk){
		    str += (chunk);
		    //TODO:draw post_req progress.
		  });

		  res.on('end', function(){
		  	var resJson = JSON.parse(str);
  	        if(resJson.status == 1){
	      	  buildCallback(resJson);
	        }else{
  	      	  cli.error(JSON.stringify(resJson));
  	      	  process.exit(1);
	        }
		    // your code here if you want to use the results !
		  });
	  }

      // Set up the request
	  post_req = http.request(post_options, callback);

      if(isHttps){
      	  cli.info("Using HTTPS")
      	  post_options.headers = {
	          'Content-Type': 'application/x-www-form-urlencoded',
	          'Content-Length': post_data.length
	      }
		  post_req = https.request(post_options, callback);
      }

	  // post the data
	  post_req.write(post_data);
	  post_req.end();
}

var checkPolEnabled = function(){
	return (confJson.checkPolicies) ? confJson.checkPolicies : false;
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
		try {
			JSON.parse(fs.readFileSync('./whitesource.report.json', 'utf8'));
		}catch(e){
		    cli.ok('Running whitesource for the first time');
		}
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
