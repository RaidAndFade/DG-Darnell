const EventEmitter = require('events');
class EE extends EventEmitter{}
const rpg = new EE();
rpg.name="RPG";


playerConfig = {
	"bagSpace": 45,
	"hpPerLevel": 50,
	"startingSkillPoints": 5
}

basePlayer = {
	"name":"",
	"inv":[0,0,0,0,0],
	"level":1,
	"hp":playerConfig.hpPerLevel,
	get hpmax(){return this.level*playerConfig.hpPerLevel;},
	"skillpoints":playerConfig.startingSkillPoints,
	"str":0,
	"luck":0,
	"def":0,
	"lastReply":[-1,-1],
}

//########### LIST OF ITEMS BEGINS HERE ################
items = [
	{
		"name": "Apple",
		"buy": 0,
		"sell": 5,
		"effect": "Heals you for 15hp when consumed.",
		"onuse": (pl)=>{
			pl.hp+=15;
			if(pl.hp>pl.hpmax)pl.hp=pl.hpmax;
			pl.inv.splice(pl.inv.indexOf(0),pl.inv.indexOf(0)+1);
			return "You have been healed from eating the apple!";
		},
		"weapon": false,
		"armor": false,
	}
];
//############ LIST OF ITEMS ENDS HERE ##################


playing = {};
players = {};



rpg.on("load",(p,data)=>{
	if(data.playing)playing=data.playing;
	if(data.players)players=data.players;
	console.log("RPG Mod loaded!");
});
rpg.on("unload",(p,data)=>{
	data.playing=playing;
	data.players=players;
	console.log("RPG Mod unloaded!");
});
rpg.on("message",(p,user,channelId,message,event)=>{
	if(!(channelId in playing))return;
	if(playing[channelId].indexOf(user.id)===-1)return;
	try{
		init=utils.chanData[channelId].settings.comInit;
		console.log("0:"+init);
		if((init!=""&&message.startsWith(init))||message.startsWith("<@"+utils.ownId+">")||message.startsWith("<@!"+utils.ownId+">")){
			if(message.startsWith("<@!"+utils.ownId+">"))message=message.replace("<@!"+utils.ownId+">","<@"+utils.ownId+">");
			comd = message.substr((init!=""&&message.startsWith(init))?init.length:("<@"+utils.ownId+">").length).trim().split(" ")[0].toLowerCase();
			args = message.substr((init!=""&&message.startsWith(init))?init.length:("<@"+utils.ownId+">").length).trim().split(" ");args.shift();
			coms = rpgCommands;
			console.log("1:"+coms);
			for(comk in coms){
				console.log("2:"+comk);
				var run=(comk==comd);
				for(aliask in coms[comk].aliases){
					alias=coms[comk].aliases[aliask];
					if(!run){if(comd==alias)run=true;}else break;
				}
				console.log(run+" ~:~ "+comd+"/"+comk);
				if(run){
					if(coms[comk].parse){
						if(coms[comk].parse.parse(args.join(" ")).status==false){console.log([args,args.join(" "),coms[comk].parse.parse(args.join(" "))]);return;}
						if("allowed" in coms[comk]){
							if(coms[comk].allowed(utils,user,coms[comk].parse.parse(args.join(" ")).value,event,false)==false){
								utils.reply(event,"You don't have permission to use that command!");
								return;
							}
						}
						coms[comk].run(utils,coms[comk].parse.parse(args.join(" ")).value,user,channelId,event);
					}else{
						if("allowed" in coms[comk]){
							if(coms[comk].allowed(utils,user,args,event,false)==false){
								utils.reply(event,"You don't have permission to use that command!");
								return;
							}
						}
						coms[comk].run(utils,args,user,channelId,event);
					}
					event.cancelled=true;
				}
			}
		}
	}catch(e){console.log(e);}
});
rpg.on("message_updated",(p,msgId,user,channelId,message,event)=>{
	if(!(channelId in playing))return;
	if(playing[channelId].indexOf(user.id)===-1)return;
	try{
	init=utils.chanData[channelId].settings.comInit;
	if((init!=""&&message.startsWith(init))||message.startsWith("<@"+utils.ownId+">")||message.startsWith("<@!"+utils.ownId+">")){
		//if(data.commandReplies[rawEvent.d.id]){utils.delMSG(channelId,data.commandReplies[rawEvent.d.id]);console.log("Deleted "+data.commandReplies[rawEvent.d.id]+"!");}
		if(message.startsWith("<@!"+utils.ownId+">"))message.replace("<@!"+utils.ownId+">","<@"+utils.ownId+">");
		comd = message.substr((init!=""&&message.startsWith(init))?init.length:("<@"+utils.ownId+">").length).trim().split(" ")[0].toLowerCase();
		args = message.substr((init!=""&&message.startsWith(init))?init.length:("<@"+utils.ownId+">").length).trim().split(" ");args.shift();
		coms = rpgCommands;
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
						if(coms[comk].allowed(utils,user,coms[comk].parse.parse(args.join(" ")).value,event,false)==false){
							utils.reply(event,"You don't have permission to use that command!");
							return;
						}
					}
					coms[comk].run(utils,coms[comk].parse.parse(args.join(" ")).value,user,channelId,event);
				}else{
					if("allowed" in coms[comk]){
						if(coms[comk].allowed(utils,user,args,event,false)==false){
							utils.reply(event,"You don't have permission to use that command!");
							return;
						}
					}
					coms[comk].run(utils,args,user,channelId,event);
				}
			}
		}
	}
	}catch(e){console.log(e);}
});
rpg.on("message_deleted",(utils,messageId,channelId,event)=>{
	if(!(channelId in playing))return;
	if(playing[channelId].indexOf(user.id)===-1)return;
	for(var plid in players){
		if(players[plid].lastReply&&players[plid].lastReply.length==4&&players[plid].lastReply[3]==messageId){event.cancelled=true;return;}
	}
});

rpg.commands = {
	rstats:{
		aliases: [],
		allowed: (p,user,args,event,helpReq) => {
			return p.hasPerm(event,user,"BOT_OWNER");//TODO finish RSTATS
		}, 
		usage: "rstats",
		desc: "Get your RPG stats!",
		run: (p, args, user, channel, event) => {
			
		}
	},
	rpg:{
		aliases: [],
		allowed: (p,user,args,event,helpReq) => {
			return p.hasPerm(event,user,"BOT_OWNER");//TODO finish RPG
		}, 
		usage: "rpg",
		desc: "Start/Stop your adventure!",
		run: (p, args, user, channel, event) => {
			if(!(channel in playing))playing[channel]=[];
			if(playing[channel].indexOf(event.author.id)!==-1){
				playing[channel].splice(playing[channel].indexOf(event.author.id),playing[channel].indexOf(event.author.id)+1);
				return p.reply(event,"You have exited RPG mode in this channel.\nAll of your commands have been restored");
			}else{
				playing[channel].push(event.author.id);
				if(!(user.id in players))players[user.id]=basePlayer;
				return p.reply(event,"You have entered RPG mode in this channel.\nMany normal commands are now overridden with RPG related commands for you.\nUse the `help` command for a full list of RPG commands.");
			}
		}
	}
};

rpgCommands = {
	rpg: rpg.commands.rpg,
	stats:{
		aliases: [],
		allowed: (p,user,args,event,helpReq) => {
			return true;
		}, 
		usage: "stats",
		desc: "Get your stats!",
		run: (p, args, user, channel, event) => {
			rper = players[user.id];
			now = new Date().getTime();
			statsMsg="```diff\n";
			statsMsg+="\n```";
			if(rper.lastReply&&rper.lastReply.length==4&&rper.lastReply[0]-now<900000&&rper.lastReply[0]!=-1&&rper.lastReply[1]!=-1&&rper.lastReply[2]==channel)//Less than 15 minutes old
			{
				p.delMSG(channel,rper.lastReply[3]);
				p.editMSG(channel,rper.lastReply[1],statsMsg,((rper,chan,e,d)=>{rper.lastReply=[new Date().getTime(),d.id,chan]}).bind(this,rper,channel));
			}else{
				p.reply(event,statsMsg,((rper,chan,lastInvoker,e,d)=>{rper.lastReply=[new Date().getTime(),d.id,chan,lastInvoker]}).bind(this,rper,channel,event.id));
			}
		}
	},
	help:{
		aliases:["?"],
		usage:"help <page>",
		allowed: (p,user,args,event,helpReq) => {
			return true;
		},
		desc:"Shows help page for RPG commands.",  
		run:(utils,args,user,channel,event)=>{
			help = [];
			sinit = utils.chanData[event.channel_id].settings.comInit;
			mod=args.length>0?isNaN(args[0])?args[0]:'undefined':'undefined';
			if(mod!='undefined')args.shift();
			//if(utils.modExists(mod))utils.reply(event,user.tag+"That module does not exist!\n Use **"+sinit+"mod list** to see a list of all mods\n Use **"+sinit+"help <page>** to see all help")
			page=args.length>0?!isNaN(args[0])?parseInt(args[0])-1:0:0;
			for(comk in rpgCommands){
				if("allowed" in rpgCommands[comk] && rpgCommands[comk].allowed(utils,user,[],event,true)==false)continue;
				com = rpgCommands[comk];
				helpstr=sinit+comk+" => ";
				if(com.desc)helpstr+="\n     Description : "+com.desc.replace(/['"]/g,"`");
				if(com.usage)helpstr+="\n     Usage : "+sinit+com.usage.replace(/['"]/g,"`");
				if(com.aliases)helpstr+="\n     Aliases : ["+com.aliases.join(", ").replace(/['"]/g,"`")+"]";
				helpstr+="\n";
				help.push(helpstr);
			}
			helpstr = help.join("\n");
			help=[];
			pagelen=300; 
			if(helpstr.length>pagelen){
				console.log(helpstr.length>pagelen);
				while(helpstr.length>pagelen){
					var cmdEnds=0;var attempts=0;
					while(cmdEnds<pagelen&&attempts++<5){
						cmdEnds=helpstr.indexOf("\n\n",cmdEnds+1);
					}
					if(attempts>=5){
						cmdEnds=helpstr.length;
					}
					pagestr=helpstr.substr(0,cmdEnds);
					if(help.length>0)pagestr=pagestr.replace(/^\n{0,}/,"");
					help.push(pagestr);
					helpstr=helpstr.substr(cmdEnds);
				}
				if(helpstr!="")help.push(helpstr.replace(/^\n{0,}/,""));
			}else{help[0]=helpstr;}
			if(page>=help.length){page=help.length-1;}
			if(page<0){page=0;}
			return utils.reply(event,"```py\nRPG commands :\n   Page "+(page+1)+" of "+help.length+" \n"+help[page]+"\n```",[true,30000]);
		}
	},
	adventure:{
		aliases:["?"],
		usage:"help <page>",
		allowed: (p,user,args,event,helpReq) => {
			return true;
		},
		desc:"Shows help page for RPG commands.",  
		run:(utils,args,user,channel,event)=>{
			
		}		
	}
};

module.exports=rpg;
