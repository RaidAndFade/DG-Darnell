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
		allowed: (p,user,args,event,helpReq) => {
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
					if("allowed" in utils.mods[modk].commands[comk] && utils.mods[modk].commands[comk].allowed(utils,user,[],event,true)==false)continue;
					com = utils.mods[modk].commands[comk];
					helpstr=sinit+comk+" ("+utils.mods[modk].name+") => ";
					if(com.desc)helpstr+="\n     Description : "+com.desc.replace(/['"]/g,"`");
					if(com.usage)helpstr+="\n     Usage : "+sinit+com.usage.replace(/['"]/g,"`");
					if(com.aliases)helpstr+="\n     Aliases : ["+com.aliases.join(", ").replace(/['"]/g,"`")+"]";
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
			return utils.reply(event,"```py\nUsable commands :\n   Page "+(page+1)+" of "+help.length+" \n"+help[page]+"\n```",[true,30000]);
		}
	},
	mod:{
		usage:"mod help",
		allowed: (p,user,args,event,helpReq)=>{
			return (typeof p.bot.servers[event.guild_id]=="undefined")?user.id == p.owner:(user.id==p.bot.servers[event.guild_id].owner_id || user.id == p.owner);
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
		allowed: (p,user,args,event,helpReq)=>{
			return (typeof p.bot.servers[event.guild_id]=="undefined")?user.id == p.owner:(user.id==p.bot.servers[event.guild_id].owner_id || user.id == p.owner);
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
				case "!set":
				{
					if(typeof event.guild_id=='undefined')return utils.reply(event,"Perhaps you should set a serverwide setting in a server... :)");
					key=args[2];
					val=args[4];
					success=true;
					status=-1;
					for(var channel of Object.keys(utils.bot.servers[event.guild_id].channels)){
						console.log(channel);
						if(key in utils.chanData[channel].settings){
							if(key in utils.chanDataDesc){
								if(utils.chanDataDesc[key][1].parse(val).status!=true){
									success=false;
									status=0;
									break;
								}else{
									var _val = utils.chanDataDesc[key][1].parse(val).value;
									utils.chanData[channel].settings[key]=_val;
								}
							}
						}else{
							success=false;
							status=1;
							break;
						}
					}
					if(!success&&status==0)utils.reply(event,"Invalid value provided. Expecting "+JSON.stringify(utils.chanDataDesc[key][1].parse(val).expected)+" at "+JSON.stringify(utils.chanDataDesc[key][1].parse(val).index));
					else if(!success&&status==1)utils.reply(event,"The setting `"+key+"` does not exist.\nUse `settings list` to see a full list of changeable settings.");
					else utils.reply(event,"Setting variable `"+key+"` to `"+_val+"` for this server.");
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
									+	"\nsettings help                   : Show this text"
									+	"\nsettings list <page>            : Show the possible settings and their values"
									+	"\nsettings <!>set <name> <value>  : Set setting <name> to <value>"
									+	"\n                                  Preface an ! in front of `set`"
									+	"\n                                  to set a variable server-wide"
									+	"\n```"
					);
				}
				break;
			}
		}
	},
	invitelink: {
		usage:"invitelink",
		allowed: (p,user,args,event,helpReq)=>{
			return true;
		},
		aliases: ["oauth","oauthlink"],
		desc:"Get the bot's invite link.",
		run:(utils,args,user,channel,event)=>{
			utils.reply(event,"The URL to invite me is https://gocode.it/dgd");
		}
	},
	restart: {
		usage:"",
		allowed: (p,user,args,event,helpReq)=>{
			return user.id == p.owner;
		},
		aliases: [],
		desc: "Restart the bot",
		run: (p,args,user,channel,event) => {
			p.reply(event,":wave:");
			p.restart();
		}
	},
	botinfo: {
		usage:"",
		allowed: (p,user,args,event,helpReq)=>{
			return user.id == p.owner;
		},
		aliases: [],
		desc: "Get some info about the bot",
		run: (p,args,user,channel,event) => {
			p.reply(event,"In "+Object.keys(p.bot.channels).length+" channels on "+Object.keys(p.bot.servers).length+" servers with "+Object.keys(p.bot.users).length+" users");
		}
	},
	user:{
		usage:"user (<user tag/id>)",
		allowed: (p,user,args,event,helpReq)=>{
			return true;
		},
		parse: utils.combinator.seq(utils.combinate.user.or(utils.combinate.phrase.or(utils.combinator.of(""))),utils.combinate.all),
		aliases: [],
		desc: "Get some info about a user",
		run: (p,args,user,channel,event) => {
			if(args[0]=="")user=event.author.id;
			else user=args[0];
			console.log(user);
			user = p.bot.users[user];
			var member = "";
			var roles  = "";
			var joindate = "";
			var server = "";
			if(typeof event.guild_id !== "undefined") server = p.bot.servers[event.guild_id];
			if(server!="") member = server.members[user.id];
			if(member!="")console.log(member);
			if(member!="")roles = "1";
			if(member!="")console.log(new Date(member.joined_at));
			if(roles!="")
				for(var role in member.roles){
					role = member.roles[role];
					roles+="'"+server.roles[role].name+"', ";
				}
			if(roles!="")
				roles=roles.slice(1,roles.length-2);
			p.reply(event,"```prolog\n"+
							"\nUsername: "+user.username.replace(/'/g,"`").replace(/```/g,"'''")+"#"+user.discriminator+
							"\n      Id: "+user.id+
							"\n    Bot?: "+(user.bot?"Yes":"No")+
							(user.game?"\n  Status: Playing "+user.game.name:"")+
							"\n  Avatar: https://discordapp.com/api/users/"+user.id+"/avatars/"+user.avatar+".jpg"+
							(member!=""?"\n  Joined: "+(""+new Date(member.joined_at)):"")+
							(roles!=""?"\n   Roles: "+roles+"":"")+
							"\n```");
			//p.reply(event,"In "+Object.keys(p.bot.channels).length+" channels on "+Object.keys(p.bot.servers).length+" servers with "+Object.keys(p.bot.users).length+" users");
		}
	},
	features:{
		usage:"features",
		allowed: ()=>{return true;},
		aliases: [],
		desc: "Lists DGD's main features and gives an invite link",
		run:  (p,args,user,channel,event) => {
			if(typeof event.guild_id === "undefined")
				return p.reply(event,"```prolog\nDeathGuard Darnell to the rescue!\nWoW based bot with tons of features!\nSome features:\n   1: Accessible database of ALL Items in the game!\n   2: Commands to find data about Mounts, Titles, Achievements, and More!\n   3: Find Quest rewards and requirements!\n   3: Quick view of your realms Auction House!\n   4: Advanced Calculator that can have Custom Variables\n        and Convert Units of Measurement!\n   5: Instant access to the Weather of your area!\n   6: Translation command!\n   7: Music Bot!\n   8: Minigames like Tic-Tac-Toe!\n   9: Execute Code straight from discord!\n  10: And Much Much More!\n```\nAdd me to your servers using https://gocode.it/dgd");
			p.sendTo(event.author.id,"```prolog\nDeathGuard Darnell to the rescue!\nWoW based bot with tons of features!\nSome features:\n   1: Accessible database of ALL Items in the game!\n   2: Commands to find data about Mounts, Titles, Achievements, and More!\n   3: Find Quest rewards and requirements!\n   3: Quick view of your realms Auction House!\n   4: Advanced Calculator that can have Custom Variables\n        and Convert Units of Measurement!\n   5: Instant access to the Weather of your area!\n   6: Translation command!\n   7: Music Bot!\n   8: Minigames like Tic-Tac-Toe!\n   9: Execute Code straight from discord!\n  10: And Much Much More!\n```\nAdd me to your servers using https://gocode.it/dgd");
			p.reply(event,"Check your DMs!",[true,5000,true]);
		}
	},
	server:{
		usage:"server",
		allowed: (p,user,args,event,helpReq)=>{
			return true;
		},
		aliases: [],
		desc: "Get some info about the server",
		run: (p,args,user,channel,event) => {
			if(typeof event.guild_id === "undefined")return p.reply(event,"Might want to use that command in a server...");
			server = p.bot.servers[event.guild_id];
			p.reply(event,"```prolog\n"+
							"\n Server: "+server.name.replace(/'/g,"").replace(/```/g,"'''")+
							"\n     Id: "+server.id+
							"\n Region: "+server.region.replace(/'/g,"`")+
							"\nMembers: "+Object.keys(server.members).length+" members ("+server.member_count+" total)"+
							"\n  Roles: "+Object.keys(server.roles).length+" roles "+(Object.keys(server.roles).length>0?"(Use 'rolelist' cmd for list)":"")+
							"\n Emojis: "+Object.keys(server.emojis).length+" emojis "+(Object.keys(server.emojis).length>0?"(Use 'emojilist' cmd for list)":"")+
							"\n  Owner: "+p.bot.users[server.owner_id].username+"#"+p.bot.users[server.owner_id].discriminator+
							"\n   Icon: https://discordapp.com/api/guilds/"+server.id+"/icons/"+server.icon+".jpg"+
							"\nCreated: "+(""+new Date((server.id/4194304)+1420070400000))+
							"\n```");
			//p.reply(event,"In "+Object.keys(p.bot.channels).length+" channels on "+Object.keys(p.bot.servers).length+" servers with "+Object.keys(p.bot.users).length+" users");
		}
	},
	rolelist:{
		usage:"rolelist",
		allowed: (p,user,args,event,helpReq)=>{
			return true;
		},
		aliases: [],
		desc: "List all roles on this server",
		run: (p,args,user,channel,event) => {
			if(typeof event.guild_id === "undefined")return p.reply(event,"Might want to use that command in a server...");
			server = p.bot.servers[event.guild_id];
			var roleList = "```py\n";
			for(var roleId in server.roles){
				var role = server.roles[roleId];
				roleList += "'"+role.name + "', ";
			}
			p.reply(event, roleList.slice(0,roleList.length-2)+"\n```");
		}
	},
	emojilist:{
		usage:"emojilist",
		allowed: (p,user,args,event,helpReq)=>{
			return true;
		},
		aliases: [],
		desc: "List all emojis on this server",
		run: (p,args,user,channel,event) => {
			console.log(event.guild_id);
			if(typeof event.guild_id === "undefined")return p.reply(event,"Might want to use that command in a server...");
			server = p.bot.servers[event.guild_id];
			var emojiList = "";
			for(var emojiId in server.emojis){
				var emoji = server.emojis[emojiId];
				console.log(emoji);
				emojiList += "\n<:"+emoji.name + ":"+emoji.id+"> :"+emoji.name+":";
			}
			emojiList=emojiList.slice(1);
			var page = args.length>0&&!isNaN(args[0])&&(args[0]-1)>0?args[0]-1:0;
			var lcount = 0;
			var curpage = 0;
			var curpagect = "";
			var pages = [];
			var lines = emojiList.split("\n");
			for(var line of lines){
				if(lcount++>=10){
					pages[curpage]=curpagect;
					curpagect="";
					curpage++;
					lcount=0;
				}
				curpagect+=line+"\n";
			}
			pages[pages.length]=curpagect;
			page = page>=pages.length?pages.length-1:page;
			p.reply(event, (pages.length>1?"There are multiple pages of emojis!\nUse the command `emojilist <page>`\n**Page "+(page+1)+" Of "+pages.length+"**\n":"")+pages[page]);
		}
	},
	setstatus: {
		usage:"",
		allowed: (p,user,args,event,helpReq)=>{
			return user.id == p.owner;
		},
		aliases: [],
		desc: "Set the bot's status",
		run: (p,args,user,channel,event) => {
			p.bot.setPresence({
				game:{
					name:args.join(" ")
				}
			});
			p.reply(event,"Bot status set to `"+args.join(" ")+"`");
		}
	}
}

module.exports=base;