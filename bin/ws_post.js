var cli = require('cli');
var fs = require('fs');
var globalTunnel = require('global-tunnel');
var request = require('request');

var WsHelper = require('./ws_helper');

var WsPost = exports;
exports.constructor = function WsPost(){};

var baseURL = 'saas.whitesourcesoftware.com';


WsPost.getPostOptions = function(confJson,report,isBower){
	
	//TODO: make this better - if this is bower then report is an object.report node.
	if(isBower){
		var report = report.report;
	}

	var useHttps = true;

	if(typeof(confJson.https) !== "undefined"){
		 useHttps = confJson.https;
	}

	var options = {
		isHttps:useHttps,
		protocol:( (useHttps) ? "https://" : "http://"),
		checkPol:((confJson.checkPolicies) ? confJson.checkPolicies : true),
		myReqType:'UPDATE',
		reqHost:( (confJson.baseURL) ? confJson.baseURL : baseURL),
		port:( (confJson.port) ? confJson.port : "443"),
		productName : ( (confJson.productName) ? confJson.productName : report.name),
		productVer  : ( (confJson.productVersion) ? confJson.productVersion : report.version),
		productToken : ( (confJson.productToken) ? confJson.productToken : "" ),
		projectName : ( (confJson.projectName) ? confJson.projectName : report.name ),
		projectVer : ( (confJson.projectVer) ? confJson.projectVer : report.version ),
		projectToken : ( (confJson.projectToken) ? confJson.projectToken : "" ),
		apiKey: confJson.apiKey,
		ts:new Date().valueOf()
	}
	
	options.postURL = (options.protocol + options.reqHost + ":" + options.port + "/agent");

	//add proxy if set.
	if(confJson.proxy){
	 	globalTunnel.initialize({
		  host: confJson.proxy,
		  port: confJson.proxyPort
		  //sockets: 50 // for each http and https 
		});
		cli.ok('Using proxy: ' + confJson.proxy + ":" + confJson.proxyPort);
	 }

	 return options;
}



WsPost.postBowerUpdateJson = function(report,confJson,postCallback){
	cli.ok('Getting ready to post -bower- report to WhiteSource...');
	var reqOpt = WsPost.getPostOptions(confJson,report,true);

	if(!confJson.apiKey){
		//console.log(confJson.apiKey)
		cli.error('Cant find API Key, please make sure you input your whitesource API token in the whitesource.config file.');
		return false
	}

	if(reqOpt.projectToken && reqOpt.productToken){
		cli.error('Cant use both project Token & product Token please select use only one token,to fix this open the whitesource.config file and remove one of the tokens.');
		return false
	}
	
	var myRequest = WsPost.buildRequest(report,reqOpt,"bower-plugin");
	//if both Project-Token and ProductToken send the Project-Token
	if(reqOpt.projectToken){
		myPost.projectToken = reqOpt.projectToken;
	}else if(reqOpt.productToken){
		myPost.productToken = reqOpt.productToken;
	}

	WsHelper.saveReportFile(myRequest.json,'bower-report.json');
	WsHelper.saveReportFile(myRequest.myPost,'bower-report-post.json');
	

	cli.ok("Posting to :"  + reqOpt.postURL);
	request.post(reqOpt.postURL,function optionalCallback(err, httpResponse, body) {
		  if (err){
		  	if(postCallback){
		  		postCallback(false,err);
		  	}else{
			    console.error('upload failed:', err);
			    console.error(JSON.stringify(httpResponse));
			    console.error(JSON.stringify(body));
		  	}
		  }
		  postCallback(true,body);
	  }).form(myRequest.myPost);
}

WsPost.postNpmUpdateJson = function(report,confJson,postCallback){
	var reqOpt = WsPost.getPostOptions(confJson,report);

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

	if(!confJson.apiKey){
		//console.log(confJson.apiKey)
		cli.error('Cant find API Key, please make sure you input your whitesource API token in the whitesource.config file.');
		return false
	}

	if(reqOpt.projectToken && reqOpt.productToken){
		cli.error('Cant use both project Token & product Token please select use only one token,to fix this open the whitesource.config file and remove one of the tokens.');
		return false
	}

	var myRequest = WsPost.buildRequest(report,reqOpt,"npm-plugin",modJson);

	  //if both Project-Token and ProductToken send the Project-Token
	  if(reqOpt.projectToken){
		myPost.projectToken = reqOpt.projectToken;
	  }else if(reqOpt.productToken){
		myPost.productToken = reqOpt.productToken;
	  }


	  WsHelper.saveReportFile(myRequest.json,'report.json');
	  WsHelper.saveReportFile(myRequest.myPost,'report-post.json');

	  
	  cli.ok("Posting to :"  + reqOpt.postURL);

	  request.post(reqOpt.postURL,function optionalCallback(err, httpResponse, body) {
		  if (err) {
		  	if(postCallback){
		  		postCallback(false,err);
		  	}else{
			    console.error('upload failed:', err);
			    console.error(JSON.stringify(httpResponse));
			    console.error(JSON.stringify(body));
		  	}
		  }
		  postCallback(true,body);
	  }).form(myRequest.myPost);
}

WsPost.buildRequest = function(report,reqOpt,agent,modJson){

	//TODO: make this better - if this is bower then report is an object.report node.
	var dependencies = (modJson) ? report.children : report.deps;
	var name = (modJson) ? modJson.name : report.report.name;
	var version = (modJson) ? modJson.version : report.report.version;

	var json = [{
		dependencies:dependencies,
		name: name,
		version:version,
		coordinates:{
        	"artifactId": name,
	        "version":version
    	}
	}]

	var myPost = {
		  'type' : reqOpt.myReqType,
		  'agent':agent,
		  'agentVersion':'1.0',
		  'product':reqOpt.productName,
		  'productVer':reqOpt.productVer,
		  'projectName':reqOpt.projectName,
		  'projectVer':reqOpt.projectVer,
		  'token':reqOpt.apiKey,
		  'timeStamp':reqOpt.ts,
		  'diff':JSON.stringify(json)
	  }

	  return {myPost:myPost,json:json};
}
