/**
TODO--

-Migrate server/channel settings to mysql instead of json


*/


const DiscordClient = require('discord.io');
const bot = require("./UserPass.js").bot;
const Twitter = require("./UserPass.js").twitter;
const mysql = require("./UserPass.js").mysql;
const cons = require("./UserPass.js").connections;
const owner = require("./UserPass.js").owner;
const fs = require('fs');
const combinate = require("parsimmon");
const request = require('request');
//var youtubedl = require('youtube-dl');
const querystring = require('querystring');
const fp = require('path');
const reload = require('require-reload')(require);
data={persistent:{errors:[],delQueue:{},modData:{}},ownMsgs:[],commandReplies:{}};
chanData={};
chanData.def={ModBlacklist:[],blockedUsers:[],settings:{comInit:"!",enabled:true,autoDelete:true}};
/******************* MODULE MANAGERS ******************/
Modules=[];
function loadModules(){
	console.log("===================================================");
	console.log("=                 LOADING MODULES                 =");
	console.log("=                                                 =");
	fs.readdir( "Modules/", function( err, files ) {
        files.forEach( function( file, index ) {
			if(fp.extname(file)!=".js")return;
			watchModule(file);
			try{loadModule(file);}catch(e){console.log(e);}
		});
		console.log("===================================================");
		//watchModules();
	});
}
Reloading=[];
function fileByMod(mod){
	for(var modf in Modules){
		var tmod = Modules[modf];
		if(mod==tmod)return modf;
	}
	return null;
}
function watchModule(mod){
	pad = new Array(39-mod.length).join(" ");console.log("= WATCHING: "+mod+pad+"=");
	fs.watch("./Modules/"+mod,(eventType,filename) => {
		if(eventType=="change"){reloadModule(filename);pad = new Array(36-filename.length).join(" ");console.log("= MOD CHANGED: "+filename+pad+"=");}
		else console.log(eventType+" => "+filename);
	});
}
function reloadModule(file){
	try{
		console.log(Reloading);
		for(k in Reloading){
			m=Reloading[k];
			if(m==file)return;
		}
		Reloading.push(file);
		setTimeout(()=>{
			Reloading.shift(Reloading.indexOf(file),1);
			Modules[file]=reload("./Modules/"+file);
			if(data.persistent.modData[file])
				Modules[file].emit("load",utils,data.persistent.modData[file]);
			else 
				Modules[file].emit("load",utils,{});
			Modules[file].utils=utils;
			pad2 = new Array(40-file.length).join(" ");
			console.log("= RELOADED "+file+pad2+"=");
		},2000);
		pad1 = new Array(39-file.length).join(" ");
		console.log("= RELOADING "+file+pad1+"=");
		if(!data.persistent.modData[file])data.persistent.modData[file]={}
		Modules[file].emit("unload",utils,data.persistent.modData[file]);
		delete require.cache[require.resolve("./Modules/"+file)];
		delete Modules[file];
	}catch(e){console.log(e);}
}
function loadModule(file){
	try{
		pad1 = new Array(41-file.length).join(" ");
		console.log("= LOADING "+file+pad1+"=");
		Modules[file]=require("./Modules/"+file);
		if(data.persistent.modData[file])
			Modules[file].emit("load",utils,data.persistent.modData[file]);
		else 
			Modules[file].emit("load",utils,{});
		
		try{Modules[file].utils=utils;}catch(e){console.log("Failed to load the previous module, check the error");return;}
		
		pad2 = new Array(42-Modules[file].name.length).join(" ");
		console.log("= LOADED "+Modules[file].name+pad2+"=");
	}catch(e){console.log(e);}
}
function unloadModule(file){
	try{
		pad1 = new Array(39-Modules[file].name.length).join(" ");
		console.log("= UNLOADING "+file+pad1+"=");
		if(!data.persistent.modData[file])data.persistent.modData[file]={}
		Modules[file].emit("unload",utils,data.persistent.modData[file]);
		delete require.cache[require.resolve("./Modules/"+file)];
		delete Modules[file];
		pad2 = new Array(40-file.length).join(" ");
		console.log("= UNLOADED "+file+pad2+"=");
	}catch(e){console.log(e);}
}
/******************* MODULE UTILS ******************/
utils={
	mysql:			mysql,
	cons: 			cons,
	twitter:		Twitter,
	bot:			bot,
	mods:			Modules,
	chanData:		chanData,
	owner: 			owner,
	keys:			require("./UserPass.js").keys,
	ownId: 			"",
	combinate:		{
		letter 		: combinate.regexp(/[a-z]/i),
		letters 	: combinate.regexp(/[a-z]+/i),
		digit		: combinate.regexp(/[0-9]/).map(Number),
		digits		: combinate.regexp(/[0-9]+/).map(Number),
		space		: combinate.whitespace,
		any			: combinate.any,
		all			: combinate.all,
		eof			: combinate.eof,
		word		: combinate.regexp(/\S+/),
		phrase      : combinate.regexp(/\"(\\.|[^\"])*\"/).map((res)=>{return res.substr(1,res.length-2);}).or(combinate.regexp(/\S+/)),
		user		: combinate.regexp(/<@!?[0-9]+>/).map((res)=>{return res.replace(/[\@\!\?\<\>]+/g,"");}).map(Number).or(combinate.regexp(/[0-9]+/).map(Number)),
		channel		: combinate.regexp(/<#[0-9]+>/),
		snippet		: combinate.regexp(/```(\S+)\n(.*?)\n```/).map((res)=>{var exp = /```(\S+)\n(.*?)\n```/;var reg = exp.exec(res);var lang=reg[1];var code=reg[2];return {lang:lang,code:code};}),
		bool		: combinate.regexp(/(true|false)/i).map((res)=>{return res=="true";})
	},
	combinator:	combinate,
	disable: 	(mod,reason)=>{
		unloadModule(fileByMod(mod));
		console.log(mod.name+" Unloaded because:\n\t"+reason+"\n");
	},
	sendMSG:	(event,msg,del=[true,30000,false],callback=(e,d)=>{})=>{
		if(typeof del == "function"){callback = del;del=[true,30000,false];}
		msg = msg.substr(0,2000); 
		bot.sendMessage({
			to: event.channel_id,
			message: msg
		},function(e,d){
			data.ownMsgs.push(d.id);
			callback(e,d);
			if(del[0]){
				if(utils.chanData[event.channel_id].autoDelete||del[2])data.persistent.delQueue[event.id]=[event.channel_id,d.id,(new Date).getTime()+del[1]];
			}
		});
	},
	sendTo:	(to,msg,del=[true,30000,false],callback=(e,d)=>{})=>{
		if(typeof del == "function"){callback = del;del=[true,30000,false];}
		msg = msg.substr(0,2000); 
		bot.sendMessage({
			to: to,
			message: msg
		},function(e,d){
			if(e)return console.log({Err:e,Args:{c:to,m:msg}});
			data.ownMsgs.push(d.id);
			callback(e,d);
			if(del[0]){
				if(utils.chanData[to].autoDelete||del[2])data.persistent.delQueue[event.id]=[to,d.id,(new Date).getTime()+del[1]];
			}
		});
	},	
	reply:	(event,msg,del=[true,30000,false],shouldEdit=true,callback=(e,d)=>{})=>{
		if(typeof del == "function"){callback = del;del=[true,30000,false];}
		msg = msg.substr(0,2000);
		edit=false;
		for(repk in data.commandReplies){
			rep = data.commandReplies[repk];
			console.log(repk+" E= "+rep+" E= "+event.id);
			if(repk==event.id){edit=rep;break;}
		}
		if(edit&&shouldEdit){
			utils.editReply(event,msg,callback);
		}else{
			bot.sendMessage({
				to: event.channel_id,
				message: msg
			},function(e,d){
				console.log(e);
				data.ownMsgs.push(d.id);
				data.commandReplies[event.id]=d.id;
				callback(e,d);
				if(del[0]){
					if(utils.chanData[event.channel_id].autoDelete||del[2])data.persistent.delQueue[event.id]=[event.channel_id,event.id,(new Date).getTime()+del[1]];
					if(utils.chanData[event.channel_id].autoDelete||del[2])data.persistent.delQueue[d.id]=[event.channel_id,d.id,(new Date).getTime()+del[1]];
				}
			});
		}
	},
	editReply:  (event,msg,del=[true,30000],callback=(e,d)=>{})=>{
		if(typeof del == "function"){callback = del;del=[true,30000];}
		msg = msg.substr(0,2000);
		for(repk in data.commandReplies){
			rep = data.commandReplies[repk];
			console.log(repk+" E= "+rep+" E= "+event.id);
			if(repk==event.id){edit=rep;break;}
		}
		chan=event.channel_id;
		bot.editMessage({
			channelID: chan, 
			messageID: edit,
			message: msg
		},(e,d)=>{
			callback(e,d);
			if(del[0]){
				if(utils.chanData[event.channel_id].autoDelete)data.persistent.delQueue[event.id]=[event.channel_id,event.id,(new Date).getTime()+del[1]];
				if(utils.chanData[event.channel_id].autoDelete)data.persistent.delQueue[d.id]=[event.channel_id,d.id,(new Date).getTime()+del[1]];
			}
		});
	},
	editMSG:	(chan,id,txt,callback=(e,d)=>{})=>{
		txt = txt.substr(0,2000);
		bot.editMessage({
			channelID: chan, 
			messageID: id,
			message: txt
		},(e,d)=>{
			callback(e,d);
		});
	},
	delMSG:		(channelID,id)=>{
		bot.deleteMessage({
			channelID: channelID,
			messageID: id
		});
	},
	pushDEL: 	(channelID,id,del=30000)=>{
		data.persistent.delQueue[id]=[channelID,id,(new Date).getTime()+del];
	},
	pad:	(msg,length,filler=" ")=>{
		msg=msg+"";
		length=length-msg.length;
		while(length-->0){
			msg+=filler;
		}
		return msg;
	}
}
utils.chanDataDesc=	{comInit:["The text before a command. Set to empty if you want to call it using user tag.",utils.combinate.phrase],enabled:["Whether the bot is enabled in this channel or not",utils.combinate.bool],autoDelete:["Should the bot auto-delete commands and responses after 30 seconds?",utils.combinate.bool]};
/******************** EVENTS **********************/
bot.on('ready', function(rawEvent) {
	utils.ownId=rawEvent.d.user.id;
	for(modf in Modules){
		Modules[modf].emit("ready",utils,rawEvent);
	}
	for(var channel in bot.channels){
		if(!(channel in utils.chanData))
			utils.chanData[channel]=utils.chanData.def;
		for(var key in utils.chanData.def){
			if(!(key in utils.chanData[channel])){
				utils.chanData[channel][key]=utils.chanData.def[key];
			}
		}
	}
	for(var user in bot.users){
		var channel = bot.users[user].id;
		if(!(channel in utils.chanData))
			utils.chanData[channel]=utils.chanData.def;
		for(var key in utils.chanData.def){
			if(!(key in utils.chanData[channel])){
				utils.chanData[channel][key]=utils.chanData.def[key];
			}
		}
	}
	setTimeout(()=>{console.log("Started Ticking!");tick()},5000);
});
bot.on('message', function(unusable, unusable2, channelId, message, rawEvent) {
	try{
	if(!(channelId in utils.chanData))
		utils.chanData[channelId]=utils.chanData.def;
	for(var key in utils.chanData.def){
		if(!(key in utils.chanData[channelId])){
			utils.chanData[channelId][key]=utils.chanData.def[key];
		}
	}
	if(!utils.chanData[channelId].settings.enabled)return;
	user = rawEvent.d.author;
	user.tag="<@"+user.id+">";
	rawEvent.d.cancelled=false;
	try{rawEvent.d.guild_id=bot.channels[channelId].guild_id;}catch(e){}
	for(modf in Modules){
		if(utils.chanData[channelId].ModBlacklist.indexOf(modf)!=-1)continue;
		try{Modules[modf].emit("message",utils,user,channelId,message,rawEvent.d);}catch(e){}
	}
	if(rawEvent.d.id in data.ownMsgs)return;
	if(rawEvent.d.cancelled)return;
	init=utils.chanData[channelId].settings.comInit;
	if((init!=""&&message.startsWith(init))||message.startsWith("<@"+utils.ownId+">")||message.startsWith("<@!"+utils.ownId+">")){
		if(message.startsWith("<@!"+utils.ownId+">"))message=message.replace("<@!"+utils.ownId+">","<@"+utils.ownId+">");
		comd = message.substr((init!=""&&message.startsWith(init))?init.length:("<@"+utils.ownId+">").length).trim().split(" ")[0].toLowerCase();
		args = message.substr((init!=""&&message.startsWith(init))?init.length:("<@"+utils.ownId+">").length).trim().split(" ");args.shift();
		for(modf in Modules){
			if(utils.chanData[channelId].ModBlacklist.indexOf(modf)!=-1)continue;
			if(!Modules[modf].commands)continue;
			coms = Modules[modf].commands;
			for(comk in coms){
				var run=(comk==comd);
				for(aliask in coms[comk].aliases){
					alias=coms[comk].aliases[aliask];
					if(!run){if(comd==alias)run=true;}else break;
				}
				console.log(run+" : "+comd+"/"+comk);
				if(run){
					if("allowed" in coms[comk]){
						canrun = coms[comk].allowed(utils,user,args,rawEvent.d,false);
						console.log(comk+" : "+canrun);
						if(canrun==false){
							utils.reply(rawEvent.d,"You don't have permission to use that command!");
							return;
						}
					}
					if(coms[comk].parse){
						if(coms[comk].parse.parse(args.join(" ")).status==false){console.log([args,args.join(" "),coms[comk].parse.parse(args.join(" "))]);return;}
						coms[comk].run(utils,coms[comk].parse.parse(args.join(" ")).value,user,channelId,rawEvent.d);
					}else{
						coms[comk].run(utils,args,user,channelId,rawEvent.d);
					}
				}
			}
		}
	}
	}catch(e){console.log(e);}
});
bot.on('messageUpdate', function(nothing,rawEvent){
	channelId=rawEvent.channel_id;
	messageId=rawEvent.message_id;
	user=rawEvent.author;
	message=rawEvent.content;
	rawEvent.cancelled=false;
	try{
	if(!utils.chanData[channelId].settings.enabled)return;
	try{user.tag="<@"+user.id+">"}catch(e){};
	try{rawEvent.guild_id=bot.channels[channelId].guild_id;}catch(e){}
	for(modf in Modules){
		if(utils.chanData[channelId].ModBlacklist.indexOf(modf)!=-1)continue;
		try{Modules[modf].emit("message_updated",utils,messageId,user,channelId,message,rawEvent);}catch(e){}
	}
	console.log(message);
	if(rawEvent.id in data.ownMsgs){return;}
	if(!message)return;
	if(rawEvent.cancelled)return;
	//console.log(message);
	init=utils.chanData[channelId].settings.comInit;
	if((init!=""&&message.startsWith(init))||message.startsWith("<@"+utils.ownId+">")||message.startsWith("<@!"+utils.ownId+">")){
		//if(data.commandReplies[rawEvent.d.id]){utils.delMSG(channelId,data.commandReplies[rawEvent.d.id]);console.log("Deleted "+data.commandReplies[rawEvent.d.id]+"!");}
		if(message.startsWith("<@!"+utils.ownId+">"))message.replace("<@!"+utils.ownId+">","<@"+utils.ownId+">");
		comd = message.substr((init!=""&&message.startsWith(init))?init.length:("<@"+utils.ownId+">").length).trim().split(" ")[0].toLowerCase();
		args = message.substr((init!=""&&message.startsWith(init))?init.length:("<@"+utils.ownId+">").length).trim().split(" ");args.shift();
		for(modf in Modules){
			if(utils.chanData[channelId].ModBlacklist.indexOf(modf)!=-1)continue;
			if(!Modules[modf].commands)continue;
			coms = Modules[modf].commands;
			for(comk in coms){
				run=(comk==comd);
				for(aliask in coms[comk].aliases){
					alias=coms[comk].aliases[aliask];
					if(!run){if(comd===alias)run=true;}else break;
				}
				console.log(run+" : "+comd+"/"+comk);
				if(run==true){
					if(coms[comk].parse){
						if(coms[comk].parse.parse(args.join(" ")).status==false){console.log([args,args.join(" "),coms[comk].parse.parse(args.join(" "))]);return;}
						if("allowed" in coms[comk]){
							if(coms[comk].allowed(utils,user,coms[comk].parse.parse(args.join(" ")).value,rawEvent,false)==false){
								utils.reply(rawEvent,"You don't have permission to use that command!");
								return;
							}
						}
						coms[comk].run(utils,coms[comk].parse.parse(args.join(" ")).value,user,channelId,rawEvent);
					}else{
						if("allowed" in coms[comk]){
							if(coms[comk].allowed(utils,user,args,rawEvent,false)==false){
								utils.reply(rawEvent,"You don't have permission to use that command!");
								return;
							}
						}
						coms[comk].run(utils,args,user,channelId,rawEvent);
					}
				}
			}
		}
	}
	}catch(e){console.log(e);}
});
bot.on('messageDelete', function(rawEvent){
	channelId=rawEvent.d.channel_id;
	messageId=rawEvent.d.id;
	rawEvent.d.cancelled=false;
	if(!(channelId in utils.chanData))
		utils.chanData[channelId]=utils.chanData.def;
	try{rawEvent.d.guild_id=bot.channels[channelId].guild_id;}catch(e){}
	try{
	for(var key in utils.chanData.def){
		if(!(key in utils.chanData[channelId])){
			console.log(key);
			utils.chanData[channelId][key]=utils.chanData.def[key];
		}
	}
	if(!utils.chanData[channelId].settings.enabled)return;
	for(modf in Modules){
		Modules[modf].emit("message_deleted",utils,messageId,channelId,rawEvent.d);
	}
	}catch(e){}
	if(rawEvent.d.cancelled)return;
	if(rawEvent.d.id in data.commandReplies){utils.delMSG(channelId,data.commandReplies[rawEvent.d.id]);}
	if(rawEvent.d.id in data.ownMsgs){data.ownMsgs.splice(data.ownMsgs.indexOf(rawEvent.d.id),1);}
	if(rawEvent.d.id in data.persistent.delQueue)delete data.persistent.delQueue[rawEvent.d.id];
});
bot.on('disconnect', function(errMsg, code) {
		console.log(errMsg);
		console.log(code);
	if(code==1001){
		Crestart();
	}else if(code==1006){
		setTimeout(Crestart,3000);
	}else{
		console.log(errMsg);
		console.log(code);
	}
});
bot.on('gcreate', function(server){
	for(var chanId in server.channels){
		if(!(chanId in utils.chanData))
			utils.chanData[chanId]=utils.chanData.def;
		for(var key in utils.chanData.def){
			if(!(key in utils.chanData[chanId])){
				utils.chanData[chanId][key]=utils.chanData.def[key];
			}
		}
	}
});
bot.on('ccreate', function(channel){
	chanId = channel.id;
	if(!(chanId in utils.chanData))
		utils.chanData[chanId]=utils.chanData.def;
	for(var key in utils.chanData.def){
		if(!(key in utils.chanData[chanId])){
			utils.chanData[chanId][key]=utils.chanData.def[key];
		}
	}
});
bot.on('any', function(event){
	try{
		for(modf in Modules){
			Modules[modf].emit("raw_event",utils,event);
			Modules[modf].emit((""+event.t).toLowerCase(),utils,event);
		}
	}catch(e){}
});
/**************** TICKING THINGS *****************/
function tick(){
	setTimeout(tick,1000)
	for(modf in Modules){
		try{Modules[modf].emit("tick",utils);}catch(e){};
	}
	msgDelQueue();
}
function msgDelQueue(){
	for(msg_id in data.persistent.delQueue){
		msg_del = data.persistent.delQueue[msg_id];
		if(msg_del[2]<(new Date).getTime()){utils.delMSG(msg_del[0],msg_del[1]);delete data.persistent.delQueue[msg_id];}
	}
	//data.persistent.delQueue;
}
/****************** CORE UTILS ********************/
function evalUntil(msgId){
	if(msgQueue.length<=0)return;
	evalThis = msgQueue.shift();
	if(evalThis[3].d.id==msgId){
		return;
	}else{
		evalMSG(evalThis[0],evalThis[1],evalThis[2],evalThis[3]);
		evalUntil(msgId);
	}
}
function start(){
	var readline = require('readline');
    var in_ = readline.createInterface({ input: process.stdin, output: process.stdout });
	setTimeout(prompt, 100);
	function prompt() {
		in_.question(">", function(str) {
			consoleCommandHandle(str);
			return prompt(); // Too lazy to learn async
		});	
	};
	load(function(){loadModules();bot.connect();});
}
function stop(){
	for(modf in Modules){
		unloadModule(modf);
	}
	save();
	try{
		if(mysql)mysql.end();
		for(connection in cons){
			if(end in connection)connection.end();
			if(close in connection)connection.close();
			if(exit in connection)connection.exit();
		}
	}catch(e){}
	var id = setTimeout(function() {}, 0);
	while (id--) {
		clearTimeout(id);
	}
	try{bot.disconnect();}catch(e){}
	process.exit();
}
function Crestart(){
	save();
	var id = setTimeout(function() {}, 0);
	while (id--) {
		clearTimeout(id);
	}
	try{bot.disconnect();}catch(e){}
	start();
}
utils.restart=()=>{
	save();
	var id = setTimeout(function() {}, 0);
	while (id--) {
		clearTimeout(id);
	}
	try{bot.disconnect();}catch(e){}
	setTimeout(start,2000);
};
function save(){
	data.persistent.chanData=utils.chanData;
	saveArr = data.persistent;
	var saveData = JSON.stringify(saveArr);
	fs.writeFileSync( "./data.json", saveData, "utf8");
	console.log(saveData);
}
function consoleCommandHandle(cmd){
	cmd = cmd.toLowerCase();
	if(cmd=="save"){
		save();
	}
	if(cmd=="load"){
		load();
	}
	if(cmd=="stop"){
		stop();
	}
}
function load(callback){
	fs.exists('./data.json',function(exists){
		if(exists){
			try{
			var loadArr = require("./data.json");
			data.persistent=loadArr;
			utils.chanData=data.persistent.chanData;
			delete data.persistent.chanData;
			}catch(e){console.log(e)};
		}
		if(callback){
			callback();
		}
	});
}
process.stdin.resume();
process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);
process.on('uncaughtException', errorHandler);
function exitHandler(options, err) {
	stop();
}
function errorHandler(err){
	console.log(err);
	data.persistent.errors.push(err);
}
function requireUncached(module){
    delete require.cache[require.resolve(module)]
    return require(module)
}
start();

