
const EventEmitter = require('events');
class EE extends EventEmitter{}
const log = new EE();
log.name="ChatLog";
log.AlwaysEnabled=true;

log.on("load",(p)=>{
	console.log("Log loaded!");
});

log.on("message",(p,user,channelId,message,event)=>{
	chan = event.channel_id;
	srv = event.guild_id?event.guild_id:-1;
	id = event.id;
	msg = event.content;
	usr = event.author.id;
	if(srv==-1){ 
		p.mysql.query('INSERT INTO `log`(messageId,userId,channelID,origmsg,editmsg,date) VALUES(?,?,?,?,"[]",?)',[id,usr,chan,msg,(new Date).getTime()],function(err,res,fs){
			if(err)throw err;
		});
	}else{
		p.mysql.query('INSERT INTO `log`(messageId,userId,channelId,serverId,origmsg,editmsg,date) VALUES(?,?,?,?,?,"[]",?)',[id,usr,chan,srv,msg,(new Date).getTime()],function(err,res,fs){
			if(err)throw err;
		});
	}
});
log.on("message_updated",(p,msgId,user,channelId,message,event)=>{
	if(!event.content)return;
	chan = event.channel_id;
	id = event.id;
	msg = event.content;
	p.mysql.query("SELECT * FROM `log` WHERE `messageId`=? AND `channelId`=? LIMIT 1;",[id,chan],function(err,res,fs){
		if(err)throw err;
		js = res[0].editmsg;
		if(js=="")js="[]";
		msgs=JSON.parse(js);
		msgs.push(msg);
		p.mysql.query("UPDATE `log` SET `editmsg`=?, `flags`=`flags`+2, `updated`=? WHERE  `messageId`=? AND `channelId`=? LIMIT 1;",[JSON.stringify(msgs),(new Date).getTime(),id,chan]);
	});
});
log.on("message_deleted",(p,msgId,channelId,event)=>{
	chan = event.channel_id;
	id = event.id;
	p.mysql.query("UPDATE `log` SET `flags`=`flags`+1, `updated`=? WHERE  `messageId`=? AND `channelId`=? LIMIT 1;",[(new Date).getTime(),id,chan]);
});

log.commands = {
	stats: {
		parse: utils.combinator.seq(utils.combinate.word.or(utils.combinate.user.or(utils.combinator.of("help"))),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.user.or(utils.combinator.of(""))),	
		allowed: (p,user,args,event,helpReq) => {
			console.log(user);
			return (typeof p.bot.servers[event.guild_id]=="undefined")?user.id == p.owner:(user.id==p.bot.servers[event.guild_id].owner_id || user.id == p.owner);
		},
		aliases: ["stat"],
		usage: "stats",
		desc: "Show user/channel specific statistics",
		run: (p, args, user, channel, event) => {
			subcom = args[0].toLowerCase();
			args.shift();
			chan=event.channel_id;
			switch(subcom){
				case "word":
					if(args.length<2||args[1]==""){
						
					}else{
						
					}
				case "deleted":
					if(args.length<2||args[1]==""){
						id=event.author.id;
						p.mysql.query("SELECT * FROM `log` WHERE `channelId`=? AND `flags`%2=1 ORDER BY `date` DESC LIMIT 5;",[chan],function(err,res,fs){
							out="";
							count=1;
							for(var row of res){
								out+="```\n"+(count++)+".\n"+row.origmsg.replace(/`/g,'\'')+"\n```\n";
							}
							if(count==1)
								p.reply(event,"**Somehow... this channel has no deleted messages!**");
							else
								p.reply(event,out+"");
						});
					}else{
						p.bot.getMember({serverID:p.bot.channels[chan].guild_id,userID:args[1].replace("<@","").replace(">","")},function(err,res){
							if(err){id=event.author.id;}else{id=res.user.id;}//if user doesn't exist return sender.
							p.mysql.query("SELECT * FROM `log` WHERE `userId`=? AND `channelId`=? AND `flags`%2=1 ORDER BY `date` DESC LIMIT 5;",[id,chan],function(err,res,fs){
								out="";
								count=1;
								for(var row of res){
									overflowed=row.origmsg.length>100;
									out+="\n**"+(count++)+":** *"+row.messageId+"*```\n"+row.origmsg.substr(0,150).replace(/`/g,'\'')+(overflowed?"...":"")+"\n```";
								}
								if(count==1)
									p.reply(event,"**Somehow... that user has no deleted messages!**");
								else
									p.reply(event,out+"");
							});
						});
					}
					break;
				case "edits":
				case "edit":
				case "edited":
				case "changes":
					if(args.length<2||args[1]==""){
						p.mysql.query("SELECT * FROM `log` WHERE `channelId`=? AND `flags`>1 ORDER BY `date` DESC LIMIT 3;",[chan],function(err,res,fs){
							out="";
							count=1;
							for(var row of res){
								edits=JSON.parse(row.editmsg);
								overflowed=row.origmsg.length>100;
								out+="\n**"+(count++)+":** *"+row.messageId+"*\n`"+row.origmsg.substr(0,100).replace(/`/g,'\'')+(overflowed?"...":"")+"\n`";
								edits=[edits[edits.length-1]];//edits=edits.length>2?[edits[0],edits[edits.length-1]]:edits;
								for(var edit of edits){
									if(!edit)continue;
									overflowed=edit.length>50;
									out+=":arrow_down: \n`"+edit.substr(0,50).replace(/`/g,'\'')+(overflowed?"...":"")+"`\n";
								}
							}
							if(count==1)
								p.reply(event,"**Somehow... this channel has no edited messages!**");
							else
								p.reply(event,out+"");
						});
					}else{
						p.bot.getMember({serverID:p.bot.channels[chan].guild_id,userID:args[1].replace("<@","").replace(">","")},function(err,res){
							if(err){id=event.author.id;}else{id=res.user.id;}//if user doesn't exist return generic.
							p.mysql.query("SELECT * FROM `log` WHERE `userId`=? AND `channelId`=? AND `flags`>1 ORDER BY `date` DESC LIMIT 3;",[id,chan],function(err,res,fs){
								out="";
								count=1;
								for(var row of res){
									edits=JSON.parse(row.editmsg);
									overflowed=row.origmsg.length>100;
									out+="\n**"+(count++)+":** *"+row.messageId+"*\n`"+row.origmsg.substr(0,100).replace(/`/g,'\'')+(overflowed?"...":"")+"`\n";
									edits=[edits[edits.length-1]];//edits=edits.length>2?[edits[0],edits[edits.length-1]]:edits;
									for(var edit of edits){
										if(!edit)continue;
										overflowed=edit.length>50;
										out+=":arrow_down: \n`"+edit.substr(0,50).replace(/`/g,'\'')+(overflowed?"...":"")+"`\n";
									}
								}
								if(count==1)
									p.reply(event,"**Somehow... that user has no edited messages!**");
								else
									p.reply(event,out+"");
							});
						});
					}
					break;
				default:
					//do user stuff here, if user is valid, otherwise don't break so that help msg is sent.
				case "help":
					p.reply(event,"**Subcommands**:\n```\n"
								+"\nstats @user           : Returns simple data about a user"
								+"\nstats word <@user>    : Returns the most used word <that @user has sent>"
								+"\nstats deleted <@user> : Returns the most recent deleted msg <that @user has sent>"
								+"\nstats edits <@user>   : Returns the 5 most recent edits <that @user has done>"
								+"```");
					break;
			}
		}
	},
	log: {
		parse: utils.combinator.seq(utils.combinate.word.or(utils.combinate.user.or(utils.combinator.of("help"))),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.snippet.or(utils.combinate.phrase.or(utils.combinator.all.or(utils.combinator.of(""))))),	
		allowed: (p,user,args,event,helpReq) => {
			if(!helpReq)console.log(user);
			return p.owner==user.id;
		},
		aliases: [],
		usage: "log",
		desc: "Show message specific statistics",
		run: (p, args, user, channel, event) => {
			console.log(args);
			subcom = args[0].toLowerCase();
			args.shift();
			args.shift();
			chan=event.channel_id;
			switch(subcom){
				default:
				case "help":
					p.reply(event,"**Subcommands**:\n```\n"
								+"\nlog unsafe \"snippet\" : Execute an sql query"
								+"\nlog search \"text\" : Search for text in someone's message"
								+"\nlog get <message id> : Returns the text of a message Id"
								+"```");
					break;
				case "unsafe":
					if(!(args[0] instanceof Object)||args[0].lang!="sql")return p.reply(event,"Make sure you are using a snippet, and that the snippet is in SQL");
					args[0].code=(""+args[0].code).replace(/\$\{this\.channel\}/g,channel);
					if(event.guild_id)args[0].code=(""+args[0].code).replace(/\$\{this\.guild\}/g,event.guild_id);
					console.log(args[0].code);
					p.mysql.query(args[0].code,[],function(err,res,fs){
						if(err)return p.reply(event,""+err);
						var columns=[];
						var rows=[];
						var left=5;
						for(var row of res){
							left--;
							if(left<0)break;
							var currow = [];
							for(var col in row){
								var val = row[col];
								if(!(col in columns))columns.push(col);
								currow[col]=val;
							}
							rows.push(currow);
						}
						var out="```\n"
						for(var col of columns){
							
							out+=col;
							if(col != columns[columns.length-1])
								out+=" | ";
							else 
								out+="\n";
						}
						for(var row of rows){
							for(var col in row){
								out+=row[col];
								if(col != columns[columns.length-1])
									out+=" | ";
								else 
									out+="\n";
							}
						}
						out+="\n```";
						p.reply(event,""+out);
					});
					break;
			}			
		}
	}//make a log command, to view certain messages.
}

module.exports=log;
