const EventEmitter = require('events');
class EE extends EventEmitter{}
const base = new EE();
base.name="Base";
base.AlwaysEnabled=true;

/*test.on("load",(p)=>{
	console.log("Example loaded!");
});*/

//test.on("message",(p,user,channelId,message,rawEvent)=>{console.log(user.id+" said "+rawEvent.d.id)});
//test.on("message_updated",(p,msgId,user,channelId,message,rawEvent)=>{console.log(user.id+" edited "+msgId)});
//test.on("message_deleted",(p,msgId,user,channelId,message,rawEvent)=>{console.log(user.id+" deleted "+msgId)});

base.commands={
	help:{
		aliases:["?"],
		usage:"help (mod) <page>",
		allowed: (p,user,args,event) => {
			return true;
		},
		desc:"Shows help page for all commands.",  
		run:(utils,args,user,channel,event)=>{
			help = [];
			sinit = utils.chanData[event.channel_id].settings.comInit;
			mod=args.length>0?isNaN(args[0])?args[0]:'undefined':'undefined';
			if(mod!='undefined')args.shift();
			//if(utils.modExists(mod))utils.reply(event,user.tag+"That module does not exist!\n Use **"+sinit+"mod list** to see a list of all mods\n Use **"+sinit+"help <page>** to see all help")
			page=args.length>0?!isNaN(args[0])?parseInt(args[0])-1:0:0;
			for(modk in utils.mods){ 
				//if()
				for(comk in utils.mods[modk].commands){
					if("allowed" in utils.mods[modk].commands[comk] && utils.mods[modk].commands[comk].allowed(utils,user,[],event)==false)continue;
					com = utils.mods[modk].commands[comk];
					helpstr=sinit+comk+" ("+utils.mods[modk].name+") => ";
					if(com.desc)helpstr+="\n     Description : "+com.desc.match(/.{1,50}/g).join("\n                   ");
					if(com.usage)helpstr+="\n     Usage : "+sinit+com.usage;
					if(com.aliases)helpstr+="\n     Aliases : ["+com.aliases.join(", ")+"]";
					helpstr+="\n";
					help.push(helpstr);
				}
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
			utils.reply(event,"```py\nUsable commands :\n   Page "+(page+1)+" of "+help.length+" \n"+help[page]+"\n```",[true,30000])
		}
	},
	mod:{
		usage:"mod help",
		allowed: (p,user,args,event)=>{
			return (typeof p.bot.serverInfoFromChannel(event.channel_id)=="undefined")?user.id == p.owner:(user.id==p.bot.serverInfoFromChannel(event.channel_id).owner_id || user.id == p.owner);
		},
		aliases: ["mods"],
		parse: utils.combinator.seq(utils.combinate.phrase.or(utils.combinator.of("help")),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.phrase.or(utils.combinator.of(""))),
		desc:"Module management command. Disable/Enable modules using this command.",
		run:(utils,args,user,channel,event)=>{
			switch(args[0]){
				case "toggle":
				{
					modN=args[2];
					reqMod="";
					reqModD="";
					if(modN==""){utils.reply(event,"You did not specify a module!\nUsage : `mod toggle <module>`");return;}
					for(var modk in utils.mods){
						mod = utils.mods[modk];
						if(mod.name.toUpperCase()==modN.toUpperCase()){
							reqMod=modk;
							reqModD=mod;
						}
					}
					if(reqMod==""){utils.reply(event,"The module you specified is invalid.\nTo see a list of modules use `mod list <page>`");return;}
					if(utils.chanData[event.channel_id].ModBlacklist.indexOf(reqMod)==-1){
						if(reqModD.AlwaysEnabled)return utils.reply(event,"The module `"+reqModD.name+"` cannot be disabled.");
						utils.chanData[event.channel_id].ModBlacklist.push(reqMod);
						console.log(chanData);
						utils.reply(event,"The module `"+reqModD.name+"` has been disabled in this channel.");
					}else{
						delete utils.chanData[event.channel_id].ModBlacklist[utils.chanData[event.channel_id].ModBlacklist.indexOf(reqMod)];
						utils.reply(event,"The module `"+reqModD.name+"` has been enabled in this channel.");
					}
				}
				break;
				case "list":
				{
					reqpage=args[2]==""||isNaN(args[2])?0:args[2]-1;
					modlist = "";
					modsPerPage=8;
					modCount=0;
					pages=[];
					curPage=0;
					longestKey=5;
					varLCount=0;
					for(var modk in utils.mods){
						key = utils.mods[modk].name.substr(0,45);
						varLCount++;
						if(varLCount<curPage*modsPerPage)continue;
						if(varLCount>(curPage+1)*modsPerPage)break;
						if(key.length>longestKey)longestKey=key.length;
					}
					for(var modk in utils.mods){
						mod = utils.mods[modk];
						modlist += utils.pad(mod.name.substr(0,45),longestKey+2)+": "+(utils.chanData[event.channel_id].ModBlacklist.indexOf(modk)==-1?mod.AlwaysEnabled?"Enabled <Forced>":"Enabled":"Disabled")+"\n";
						modCount++;
						if(modCount>=modsPerPage){
							modCount=0;
							pages.push(modlist+"");
							curPage++;
							modlist = "";
							longestKey=5;
							varLCount=0;
							for(var modk in utils.mods){
								key = utils.mods[modk].name.substr(0,45);
								varLCount++;
								if(varLCount<curPage*modsPerPage)continue;
								if(varLCount>(curPage+1)*modsPerPage)break;
								if(key.length>longestKey)longestKey=key.length;
							}
						}
					}
					if(modlist!=""){
						pages.push(modlist+"");
					}
					if(reqpage<0){reqpage=0;}
					if(reqpage>pages.length-1){reqpage=pages.length-1;}
					utils.reply(event,"```py\nModules List:\n   Page "+(reqpage+1)+" of "+(pages.length)+"\n\n"+pages[reqpage]+"\n```");
				}
				break;
				case "help":
				default:
				{
					utils.reply(event,	"```py\nMod Subcommands:\n"+
										"mod help               : Shows this text\n"+
										"mod list <page>        : Shows a list of all mods\n"+
										"mod toggle <Mod name>  : Enables/Disables a mod\n"+
										"```"
								);
				}
				break;
			}
		}
	},
	settings:{
		usage:"settings help",
		allowed: (p,user,args,event)=>{
			return (typeof p.bot.serverInfoFromChannel(event.channel_id)=="undefined")?user.id == p.owner:(user.id==p.bot.serverInfoFromChannel(event.channel_id).owner_id || user.id == p.owner);
		},
		aliases: ["botsettings"],
		parse: utils.combinator.seq(utils.combinate.phrase.or(utils.combinator.of("help")),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.phrase.or(utils.combinator.of("")),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.all.or(utils.combinator.of(""))),
		desc:"Bot settings management command. Set channel specific settings.",
		run:(utils,args,user,channel,event)=>{
			switch(args[0]){
				case "set":
				{
					key=args[2];
					val=args[4];
					if(key in utils.chanData[event.channel_id].settings){
						if(key in utils.chanDataDesc){
							if(utils.chanDataDesc[key][1].parse(val).status!=true){
								utils.reply(event,"Invalid value provided. Expecting "+JSON.stringify(utils.chanDataDesc[key][1].parse(val).expected)+" at "+JSON.stringify(utils.chanDataDesc[key][1].parse(val).index));
							}else{
								val = utils.chanDataDesc[key][1].parse(val).value;
								utils.reply(event,"Setting variable `"+key+"` to `"+val+"` for this channel.");
								utils.chanData[event.channel_id].settings[key]=val;
							}
						}
					}else{
						utils.reply(event,"The setting `"+key+"` does not exist.\nUse `settings list` to see a full list of changeable settings.");
					}
				}
				break;
				case "list":
				{
					reqpage=args[2]==""||isNaN(args[2])?0:args[2]-1;
					varlist = "";
					varsPerPage=8;
					varCount=0;
					pages=[];
					curPage=0;
					longestKey=5;
					longestVal=10;
					varLCount=0;
					for(var key in utils.chanData[event.channel_id].settings){
						varLCount++;
						if(varLCount<curPage*varsPerPage)continue;
						if(varLCount>(curPage+1)*varsPerPage)break;
						if(key.length>longestKey)longestKey=key.length;
						val = utils.chanData[event.channel_id].settings[key]+"";
						if(val.length>longestVal)longestVal=val.length;
					}
					for(var key in utils.chanData[event.channel_id].settings){
						varlist += utils.pad(key,longestKey+2)+" : "+utils.pad(utils.chanData[event.channel_id].settings[key],longestVal+2)+" # "+utils.chanDataDesc[key][0]+"\n";
						varCount++;
						if(varCount>=varsPerPage){
							varCount=0;
							curPage++;
							pages.push(varlist);
							varlist = "";
							longestKey=8;
							longestVal=10;
							varLCount=0;
							for(var key in utils.chanData[event.channel_id].settings){
								varLCount++;
								if(varLCount<curPage*varsPerPage)continue;
								if(varLCount>(curPage+1)*varsPerPage)break;
								if(key.length>longestKey)longestKey=key.length;
								val = utils.chanData[event.channel_id].settings[key]+"";
								if(val.length>longestVal)longestVal=val.length;
							}
						}
					}
					if(varlist!=""){
						pages.push(varlist);
					}
					if(reqpage<0){reqpage=0;}
					if(reqpage>pages.length-1){reqpage=pages.length-1;}
					console.log(pages);
					utils.reply(event,"```py\nSettings list:\n    Page "+(reqpage+1)+" of "+pages.length+"\n\n"+pages[reqpage]+"\n```");
				}
				break;
				case "help":
				default:
				{
					utils.reply(event,	"```\nSettings Subcommands:"
									+	"\nsettings help                : Show this text"
									+	"\nsettings list <page>         : Show the possible settings and their values"
									+	"\nsettings set <name> <value>  : Set setting <name> to <value>"
									+	"\n```"
					);
				}
				break;
			}
		}
	},
	invitelink: {
		usage:"invitelink",
		allowed: (p,user,args,event)=>{
			return (typeof p.bot.serverInfoFromChannel(event.channel_id)=="undefined")?user.id == p.owner:(user.id==p.bot.serverInfoFromChannel(event.channel_id).owner_id || user.id == p.owner);
		},
		aliases: ["oauth","oauthlink"],
		desc:"Get the bot's invite link.",
		run:(utils,args,user,channel,event)=>{
			utils.reply(event,"The URL to invite me is "+utils.bot.inviteURL);
		}
	}//TODO : crap
}

module.exports=base;