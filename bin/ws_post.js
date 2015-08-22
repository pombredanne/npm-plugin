var http = require('http');
var https = require('https');
var querystring = require('querystring');
var cli = require('cli');
var fs = require('fs');
var globalTunnel = require('global-tunnel');
var request = require('request');
var WsHelper = require('./ws_helper');

var WsPost = exports;
exports.constructor = function WsPost(){};

WsPost.postBowerUpdateJson = function(report,confJson){
	cli.ok('Getting ready to post report to WhiteSource...');
	var isHttps = true;

	if(typeof(confJson.https) !== "undefined"){
		 isHttps = confJson.https;
	}


	var protocol = (isHttps) ? "https://" : "http://";
	var checkPol = (confJson.checkPolicies) ? confJson.checkPolicies : true;
	var myReqType = ((checkPol && !checkPolSent) ? 'CHECK_POLICIES' : 'UPDATE');

	if(!confJson.checkPolEnabled){
		myReqType = 'UPDATE';
	}

	var reqHost = (confJson.baseURL) ? confJson.baseURL : baseURL;
	var port = (confJson.port) ? confJson.port : "443";
	var productName = (confJson.productName) ? confJson.productName : report.name;
	var productVer = (confJson.productVersion) ? confJson.productVersion : report.version;
	var productToken = (confJson.productToken) ? confJson.productToken : "";
	var projectName = (confJson.projectName) ? confJson.projectName : report.name;
	var projectVer = (confJson.projectVer) ? confJson.projectVer : report.version;
	var projectToken = (confJson.projectToken) ? confJson.projectToken : "";
	var ts = new Date().valueOf();
	var postURL = protocol + reqHost + ":" + port + "/agent";

	if(!confJson.apiKey){
		//console.log(confJson.apiKey)
		cli.error('Cant find API Key, please make sure you input your whitesource API token in the whitesource.config file.');
		return false
	}

	if(projectToken && productToken){
		cli.error('Cant use both project Token & product Token please select use only one token,to fix this open the whitesource.config file and remove one of the tokens.');
		return false
	}

	var json = [{
		dependencies:report.dependencies,
		name:report.name,
		version:report.version,
		coordinates:{
			"artifactId": report.name,
			"version":report.version
		}}]

	var myPost = {
		  'type' : myReqType,
		  'agent':'bower-plugin',
		  'agentVersion':'1.0',
		  'product':productName,
		  'productVer':productVer,
		  'projectName':projectName,
		  'projectVer':projectVer,
		  'token':confJson.apiKey,
		  'timeStamp':ts,
		  'diff':JSON.stringify(json)
	  }
	  //if both Project-Token and ProductToken send the Project-Token
	  if(projectToken){
		myPost.projectToken = projectToken;
	  }else if(productToken){
		myPost.productToken = productToken;
	  }

	  WsHelper.saveReportFile(json,'whitesource-bower.report.json');
	  WsHelper.saveReportFile(myPost,'whitesource-bower.report-post.json');
	  
	  cli.ok("Posting to " + reqHost + ":" + port)
	  request.post(postURL,function optionalCallback(err, httpResponse, body) {
		  if (err) {
		    console.error('upload failed:', err);
		    console.error(JSON.stringify(httpResponse));
		    console.error(JSON.stringify(body));
		  	process.exit(1);
		  }
		  buildCallback(body);
	  }).form(myPost);
}

WsPost.postNpmUpdateJson = function(report,confJson,postCallback){
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

	var baseURL = 'saas.whitesourcesoftware.com';
	var protocol = (isHttps) ? "https://" : "http://";
	var checkPol = (confJson.checkPolicies) ? confJson.checkPolicies : true;
	var myReqType ='UPDATE';

	if(!confJson.checkPolEnabled){
		myReqType = 'UPDATE';
	}

	var reqHost = (confJson.baseURL) ? confJson.baseURL : baseURL;
	var port = (confJson.port) ? confJson.port : "443";
	var productName = (confJson.productName) ? confJson.productName : report.name;
	var productVer = (confJson.productVersion) ? confJson.productVersion : report.version;
	var productToken = (confJson.productToken) ? confJson.productToken : "";
	var projectName = (confJson.projectName) ? confJson.projectName : report.name;
	var projectVer = (confJson.projectVer) ? confJson.projectVer : report.version;
	var projectToken = (confJson.projectToken) ? confJson.projectToken : "";
	var ts = new Date().valueOf();
	var postURL = protocol + reqHost + ":" + port + "/agent";

	if(!confJson.apiKey){
		//console.log(confJson.apiKey)
		cli.error('Cant find API Key, please make sure you input your whitesource API token in the whitesource.config file.');
		return false
	}

	if(projectToken && productToken){
		cli.error('Cant use both project Token & product Token please select use only one token,to fix this open the whitesource.config file and remove one of the tokens.');
		return false
	}


	var json = [{
		dependencies:report.children,
		name: modJson.name,
		version:modJson.version,
		coordinates:{
        	"artifactId": modJson.name,
	        "version":modJson.version
    	}
	}]

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

	  //if both Project-Token and ProductToken send the Project-Token
	  if(projectToken){
		myPost.projectToken = projectToken;
	  }else if(productToken){
		myPost.productToken = productToken;
	  }


	  WsHelper.saveReportFile(json,'whitesource.report.json');
	  WsHelper.saveReportFile(myPost,'whitesource.report-post.json');

	  
	  cli.ok("Posting to " + reqHost + ":" + port)

	 if(confJson.proxy){
	 	globalTunnel.initialize({
		  host: confJson.proxy,
		  port: confJson.proxyPort
		  //sockets: 50 // for each http and https 
		});

		cli.ok('Using proxy: ' + confJson.proxy + ":" + confJson.proxyPort);
	 }
		

	  request.post(postURL,function optionalCallback(err, httpResponse, body) {
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
	  }).form(myPost);


}