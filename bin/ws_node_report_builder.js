var traverse = require('traverse');
var cli = require('cli');
var fs = require('fs');
var glob = require("glob");

 var WsNodeReportBuilder = exports;
exports.constructor = function WsNodeReportBuilder(){};

WsNodeReportBuilder.refitNodes = function(obj){
	var build, key, destKey, ix, value;
    var mapShortToLong = {
        "dependencies": "children",
        "resolved" : "artifactId"
    };

    build = {};
    for (key in obj) {

        // Get the destination key
        destKey = mapShortToLong[key] || key;

        // Get the value
        value = obj[key];

        // If this is an object, recurse
        if (typeof value === "object") {
            value = WsNodeReportBuilder.refitNodes(value);
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
};


WsNodeReportBuilder.traverseShrinkWrapJson = function(shrinkwrap){
	cli.ok("Building dependencies report");
	var foundedShasum = 0;
	var missingShasum = 0;
	var invalidDeps = [];
	var parseData = shrinkwrap;
	var scrubbed = traverse(parseData).paths();

	var getParentDepPointer = function(depPointer){
		//Example :  "[dependencies"]["ft-next-express"]["dependencies"]["@financial-times"]["n-handlebars"]"

		//["n-handlebars"]"
		var childDepStr = depPointer.substr(depPointer.lastIndexOf('['),depPointer.lastIndexOf(']') );

		//"n-handlebars"
		var childDepName = JSON.parse( childDepStr )[0]; 

		//"[dependencies"]["ft-next-express"]["dependencies"]["@financial-times"]"
		var ansStr = depPointer.substr(0,depPointer.lastIndexOf('['))

		//"[dependencies"]["ft-next-express"]["dependencies"]["@financial-times"
		var transStr = ansStr.substring(0,ansStr.lastIndexOf('"]'));
		
		//"[dependencies"]["ft-next-express"]["dependencies"]["@financial-times" + / + child + "]";
		fixedStr = transStr + "/" + childDepName + '"]';
		return fixedStr;

	};

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
					var invalidProj = false;
					try{
						var dataObjPointer = eval(objPointer);	
					}catch(e){
						try {
							var pointerString = '["' + joinedStr.replace(/node_modules/gi, "dependencies");
							var parentDepPointer = getParentDepPointer(pointerString);
							invalidDeps.push(parentDepPointer);
							var objPointer = 'parseData' + parentDepPointer;
							var parentDep = eval('delete ' + objPointer);
							//delete parentDep;
						}catch(e){
							//pointer points to child of deleted object.
						}
						invalidProj = true;
					}
					
		       		var obj = JSON.parse(fs.readFileSync(uri, 'utf8'));

		       		if( (!invalidProj) && (obj.dist || obj._shasum) ){
		       			//cli.ok('Founded dependencie shasum');
		       			if(obj.dist){
		       				dataObjPointer.shasum = obj.dist.shasum;
		       				path.shasum = obj.dist.shasum;
		       			}
		       			if(obj._shasum){
		       				dataObjPointer.sha1 = obj._shasum;
		       				dataObjPointer.shasum = obj._shasum;
		       				path.shasum = obj._shasum;
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

	// for (var i = 0; i<invalidDeps.length; i++){
	// 	cli.info("Problem with invalid package: " + invalidDeps[i]);	
	// }


	cli.info("Total shasum found: " + foundedShasum);
	cli.info("Missing shasum: " + missingShasum);
  	cli.info("Total project dependencies: " + (missingShasum + foundedShasum));

  	return WsNodeReportBuilder.refitNodes(parseData);
};
