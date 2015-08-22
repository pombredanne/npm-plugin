#!/usr/bin/env node

'use strict';

process.title = 'whitesource';

var shell = require('shelljs/global');
var cli = require('cli');
var fs = require('fs');

var prompt = require('prompt');
prompt.message = "whitesource";
prompt.delimiter = ">".green;

var runtime = new Date().valueOf();

var WsCheckPol = require('./ws_check_pol');
var WsNodeReportBuilder = require('./ws_node_report_builder');
var WsBowerReportBuilder = require('./ws_bower_report_builder');
var WsPost = require('./ws_post');
var WsHelper = require('./ws_helper');

var finish = function(){
	//cleaning up shrinkwrap file to avoid future errors.
	try{
		// fs.rename('./npm-shrinkwrap', './ws-npm-shrinkwrap',function (err) {
		//   //if (err) throw err;
		//   console.log('saved ws-npm-shrinkwrap');
		// })
	}catch(e){
		cli.info(e);
	}

	var timer = new Date().valueOf() - runtime;
	timer = timer / 1000;
	cli.ok('Build success!' + " ( took: " + timer +"s ) " );
	//process.exit(0);
}

var nodeBuildCallback = function(isSuc,resJson){
	if(isSuc){
		WsHelper.saveReportFile(resJson,"response-npm.json");
		cli.ok(resJson);
		finish();
	}else{
		//process.exit(1);
	}
}

var bowerBuildCallback = function(isSuc,resJson){
	if(isSuc){
		WsHelper.saveReportFile(resJson,"response-bower.json");
		cli.ok(resJson);
		finish();
	}else{
		//process.exit(1);
	}
}

var postNodeJson = function(report,confJson){
	cli.ok('Getting ready to post report to WhiteSource...');
	WsPost.postNpmUpdateJson(report,confJson,nodeBuildCallback);
}


var postBowerJson = function(report,confJson){
	cli.ok('Getting ready to post report to WhiteSource...');
	WsPost.postNpmUpdateJson(report,confJson,bowerBuildCallback);
}


var buildNodeReport = function(shrinkwrapJson){
	cli.ok("Building dependencies report");
	var WsJsonFromShrinkwrap = WsNodeReportBuilder.traverseShrinkWrapJson(shrinkwrapJson);
	return WsJsonFromShrinkwrap;
}

var buildBowerReport = function(){
	cli.ok("Building dependencies report");
	var bowerJsonReport = WsBowerReportBuilder.buildReport();
	return bowerJsonReport;
}

cli.parse(null, ['bower','run']);
cli.main(function (args, options) {
		
	var confJson = WsHelper.initConf();

	if(cli.command === "run"){

		cli.ok('Running whitesource...');
		var cmd = (confJson.devDep === "true") ? 'npm shrinkwrap --dev' : 'npm shrinkwrap';
		exec(cmd);
		
		cli.ok('Done shrinkwrapping!');
		cli.ok('Reading shrinkwrap report');

		var shrinkwrap = JSON.parse(fs.readFileSync("./npm-shrinkwrap.json", 'utf8'));
		var json = buildNodeReport(shrinkwrap);

		cli.ok("Saving dependencies report");
		WsHelper.saveReportFile(json,"npm-report");

		postNodeJson(json,confJson);

	}

	if(cli.command === "bower"){
		cli.ok('Running whitesource...');
		cli.ok('Checking Bower Dependencies...');
		
		var json = buildBowerReport();

		cli.ok("Saving bower dependencies report");
		WsHelper.saveReportFile(json,"bower-report");
		postBowerJson(json,confJson);
	}

})