#!/usr/bin/env node

'use strict';

process.title = 'whitesource';

var shell = require('shelljs/global');
var cli = require('cli');
var fs = require('fs');
var Q = require('q');
var checksum = require('checksum');

var prompt = require('prompt');
prompt.message = "whitesource";
prompt.delimiter = ">".green;

var runtime = new Date().valueOf();

var WsCheckPol = require('./ws_check_pol');
var WsNodeReportBuilder = require('./ws_node_report_builder');
var WsBowerReportBuilder = require('./ws_bower_report_builder');
var WsBowerHelper = require('./ws_bower_helper');
var WsPost = require('./ws_post');
var WsHelper = require('./ws_helper');
var runtimeMode = "node";

var finish = function(){
	//TODO: rename/remove shrinkwrap file to avoid npm to use hardcoded versions.
	var timer = new Date().valueOf() - runtime;
	timer = timer / 1000;
	cli.ok('Build success!' + " ( took: " + timer +"s ) " );
	//process.exit(0);
}

var buildCallback = function(isSuc,resJson){
	var fileName = (runtimeMode === "node") ? "response-npm.json" : "response-bower.json";
	if(isSuc){
		WsHelper.saveReportFile(resJson,fileName);
		cli.ok(resJson);
		finish();
	}else{
		//process.exit(1);
	}
}

var postReportToWs = function(report,confJson){
	cli.ok('Getting ready to post report to WhiteSource...');
	if(runtimeMode === "node"){
		WsPost.postNpmUpdateJson(report,confJson,buildCallback);
	}else{
		WsPost.postBowerUpdateJson(report,confJson,buildCallback);
	}
}

var buildReport = function(shrinkwrapJson){
	cli.ok("Building dependencies report");

	if(runtimeMode === "node"){
		var jsonFromShrinkwrap = WsNodeReportBuilder.traverseShrinkWrapJson(shrinkwrapJson);
		var resJson = jsonFromShrinkwrap;
	}else{
		var bowerJsonReport = WsBowerReportBuilder.buildReport();
		var resJson = bowerJsonReport;
	}
	return resJson;
}

cli.parse(null, ['bower','run','bower-sha1']);
cli.main(function (args, options){
	var confJson = WsHelper.initConf();
	if(cli.command === "run"){
		runtimeMode = "node";
		cli.ok('Running whitesource...');
		var cmd = (confJson.devDep === "true") ? 'npm shrinkwrap --dev' : 'npm shrinkwrap';
		exec(cmd);
		
		cli.ok('Done shrinkwrapping!');
		cli.ok('Reading shrinkwrap report');

		var shrinkwrap = JSON.parse(fs.readFileSync("./npm-shrinkwrap.json", 'utf8'));
		var json = buildReport(shrinkwrap);

		cli.ok("Saving dependencies report");
		WsHelper.saveReportFile(json,"npm-report");

		postReportToWs(json,confJson);
	}
	if(cli.command === "bower-sha1"){
		WsBowerHelper.generateCompsSha1();
		process.exit(0);
		/*then(function(results){debugger;
			console.log("from then fn");
			    results.forEach(function (result) {
			        if (result.state === "fulfilled") {
			            var value = result.valueOf();
			            console.log('value = ' + value);
			        } else {
			            var reason = result.reason;
			        }
			    });
		});*/
		// Q.allSettled(generateShaPromise	).then(function (results) {
		//     results.forEach(function (result) {
		//         if (result.state === "fulfilled") {
		//             var value = result.value;
		//         } else {
		//             var reason = result.reason;
		//         }
		//     });
		// });
	}

	if(cli.command === "bower"){
		runtimeMode = "bower";

		cli.ok('Running Whitesource Bower...');
		cli.ok('Generating Version Keys');
		var cmd = (confJson.devDep === "true") ? 'whitesource bower-sha1 --dev' : 'whitesource bower-sha1';
		exec(cmd);		
		cli.ok('Checking Bower Dependencies...');
		var json = buildReport();

		cli.ok("Saving bower dependencies report");
		WsHelper.saveReportFile(json.report,"bower-report");
		WsHelper.saveReportFile(json.deps,"bower-deps-report");
		postReportToWs(json,confJson);
	}
});