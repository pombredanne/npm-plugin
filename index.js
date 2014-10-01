"use strict";

var cli = require('cli');
var fs = require('fs');
var util = require('util');
var npm = require('npm');
var traverse = require('traverse');
var prompt = require('prompt');

prompt.message = "whitesource";
prompt.delimiter = ">".green;
var runtime = new Date().valueOf();
var foundedShasum = 0;
var missingShasum = 0;


var traverseJson = function(){
	var file = "./npm-shrinkwrap.json";
	fs.readFile(file, 'utf8', function (err, data) {
		 
		 if (err) {
		    console.log('Error: ' + err);
		    return;
		  }

		data = JSON.parse(data);
		var scrubbed = traverse(data).paths();
		for (var i = 0; i<scrubbed.length; i++){
			var path = scrubbed[i];
			for(var j = 0; j<path.length; j++){
				var isDep =  (path[j] === "dependencies")
				var isVer = (path[j] === "version");
				var isResolved = (path[j] === "resolved");
				var isFrom = (path[j] === "from");
				var isName = (path[j] === "name");
				var isShasum = (path[j] === "shasum");
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
						joinedStr = joinedStr.substr(0,joinedStr.lastIndexOf('['))
						var objPointer = 'data["' + joinedStr.replace(/node_modules/gi, "dependencies");
						var dataObjPointer = eval(objPointer);
			       		var obj = JSON.parse(fs.readFileSync(uri, 'utf8'));
			       		if(obj.dist) {
			       			//cli.ok('Founded dependencie shasum');
			       			dataObjPointer.shasum = obj.dist.shasum;
			       			path.shasum = obj.dist.shasum;
			       			foundedShasum++;
			       		}else{//couldn't find shasum key
			       			missingShasum++;
			       		}
		       		
		         }
		         /*else{//skip invalid path
		         	console.log("skipped")
		         }*/
			}
		}

		cli.ok("Building dependencies report");
		fs.writeFile("whitesource.report.json", JSON.stringify(data, null, 4), function(err) {
		    if(err){
		      cli.error(err);
		    } else {
		      cli.ok("Saving report");
		      cli.info("Total shasum found: " + foundedShasum);
		      cli.info("Missing shasum: " + missingShasum);
		      cli.info("Total project dependencies: " + (missingShasum + foundedShasum));
		      var timer = new Date().valueOf() - runtime;
		      timer = timer / 1000;
		      
		      cli.ok('Running callback');
		      cli.ok('Build success!' + " ( took: " + timer +"s ) " );
		       
		    }
		}); 
	});


}


var startPrompt = function(){
	  var schema = {
	    properties: {
	      "Username": {
	        pattern: /^[a-zA-Z\s\-]+$/,
	        message: 'Name must be only letters, spaces, or dashes',
	        required: true
	      },
	      "Password": {
	        hidden: true
	      },
	      "Token": {
	        pattern: /^[a-zA-Z\s\-]+$/,
	        message: 'Name must be only letters, spaces, or dashes',
	        required: true
	      },
	      "Traverse Depth": {
	        hidden: false
	      },
	      "Use black list? <yes></no>": {
	        hidden: false
	      },
	      "Fail build when using invalid dependencies? <yes> | <no>": {
	        hidden: false
	      }
	    }
	  };
	  //
	  // Start the prompt
	  //
	  prompt.start();

	  //
	  // Get two properties from the user: email, password
	  //
	  prompt.get(schema, function (err, result) {
	    //
	    // Log the results.
	    //
	    var outputFilename = 'whitesource.config.json';

		fs.writeFile(outputFilename, JSON.stringify(result, null, 4), function(err) {
		    if(err) {
		      console.log(err);
		    } else {
		      cli.ok("Configuration saved!");
		    }
		}); 
	  });
}

var start = function(){
	npm.load({"devDependencies":true,"dev":true},function(er){
			fs.exists('./npm-shrinkwrap.json', function (exists) {
				console.log(npm.commands.shrinkwrap)
			  //util.debug(exists ? "it's there" : "not here!");
			  	//npm.commands.shrinkwrap({"devDependencies":true,"dev":true},function(){cli.ok('wwwwwooooopppyyy!');})
			  	npm.commands.shrinkwrap(function(){
			  		cli.ok('Done shrinkwrapping!');
			  		cli.ok("Building project shrinkwrapp");
					traverseJson()
			  	})
			});
	});
}



cli.parse(null, ['test', 'config','run']);


cli.main(function (args, options) {
	/*console.log(args)
	console.log(options)*/
	if(cli.command === "run"){
		cli.ok('Running whitesource plugin...')
		//console.log(options);
		start();
	}
	if(cli.command === "config"){
		console.log("\n\n")
		console.log("-----------------------------------------------")
		console.log("-----------------------------------------------")
		console.log("-----------------------------------------------")
		console.log("--------- Whitesource CLI configuration -------")
		console.log("-----------------------------------------------")
		console.log("-----------------------------------------------")
		console.log("-----------------------------------------------")
		console.log("\n\n")
		startPrompt();
	}
})