
const EventEmitter = require('events');
class EE extends EventEmitter{}
const test = new EE();
test.name="Testing";

var persistentVar="";
test.on("load",(p,data)=>{
	if(data.persistentVar)persistentVar=data.persistentVar;
	console.log("Example loaded!");
});
test.on("unload",(p,data)=>{
	data.persistentVar=persistentVar;
	console.log("Example unloaded!");
});


//test.on("message",(p,user,channelId,message,rawEvent)=>{console.log(user.id+" said "+rawEvent.d.id)});
//test.on("message_updated",(p,msgId,user,channelId,message,rawEvent)=>{console.log(user.id+" edited "+msgId)});
//test.on("message_deleted",(p,rawEvent)=>{console.log(user.id+" deleted "+rawEvent.d.id)});

function bitmaskToArr(bitmask){
	setBits=[];
	for(k=0;k<32;k++){
		if((bitmask&Math.pow(2,k))!=0)setBits[k+1]=true;
	}
	return setBits;
}

test.commands = {
	persistencytest: {
		aliases: ["tstpersist"],
		allowed: (p,user,args,event,helpReq) => {
			return true;
		}, 
		usage: "persistencytest <new Var>",
		desc: "This command is a test command",
		run: (p, args, user, channel, event) => {
			//p.reply(event, JSON.stringify(p.bot));
			//p.reply(event, user.tag+" you said "+args.join(" "))
			p.reply(event,persistentVar);
			persistentVar=args.join(" ");
		}
	},
	test: {
		aliases: [],
		allowed: ()=>{return true;},
		usage: "test <return text>",
		parse: utils.combinate.all,
		desc: "This command is a test command",
		run: (p,args,user,channel,event)=>{
			p.reply(event,"returning : `"+args+"`");
		}
	},
	permissiontest: {
		aliases: [],
		allowed: (p, user, args, event, helpReq)=>{
			if(helpReq)return true;
			console.log("Checking "+user.username+" if allowed to use PERMISSIONTEST");
			console.log("~PERMISSIONTEST BEGINS~");
			setTimeout(p.reply.bind(this,event,"You are "+(user.id==p.owner?"":"not ")+"the owner of this bot..."),0);
			setTimeout(p.reply.bind(this,event,"You are "+(user.id==p.bot.servers[p.bot.channels[event.channel_id].guild_id].owner_id?"":"not ")+"the owner of this server..."),2000);
			servUser=p.bot.servers[p.bot.channels[event.channel_id].guild_id].members[user.id];
			userRoles=[]
			outputRoles="";
			userPermissions=0;
			for(role of servUser.roles){
				userRoles.push(p.bot.servers[p.bot.channels[event.channel_id].guild_id].roles[role]);
				outputRoles+=p.bot.servers[p.bot.channels[event.channel_id].guild_id].roles[role].name+"\n";
				userPermissions=userPermissions|p.bot.servers[p.bot.channels[event.channel_id].guild_id].roles[role]._permissions;
			}
			setTimeout(p.reply.bind(this,event,"You are part of these groups (serverwide): ```py\n"+outputRoles+"\n```"),4000);
			setTimeout(p.reply.bind(this,event,"You have these perms (serverwide): ```py\n"+userPermissions+"\n```"),6000);
			userChanPerms=userPermissions;
			for(role of servUser.roles){
				console.log(p.bot.channels[event.channel_id].permissions.role[role]);
				if(!p.bot.channels[event.channel_id].permissions.role[role])continue;
				userChanPerms=userChanPerms|p.bot.channels[event.channel_id].permissions.role[role].allow;
				userChanPerms=userChanPerms^p.bot.channels[event.channel_id].permissions.role[role].deny;
			}
			setTimeout(p.reply.bind(this,event,"You have these perms (in this channel): ```py\n"+userChanPerms+"\n```"),8000);
			console.log("~PERMISSIONTEST ENDS~");
			return true;
			//setTimeout(p.reply.bind(this,event,"You are "+(user.id==p.owner?"":"not ")+"the owner of this bot"),4000);
			//setTimeout(p.reply.bind(this,event,"You are "+(user.id==p.owner?"":"not ")+"the owner of this bot"),5000);
		},
		usage:"permissiontest",
		desc:"Test your permissions.",
		run: (p,args,user,channel,event)=>{
			
		}
	},
	litaf:{
		aliases: [],
		allowed: (p, user, args, event, helpReq)=>{return user.id==p.owner;},
		usage:"React `lit af` to the latest message",
		desc:"Do it. Just do it.",
		run: (p,args,user,channel,event)=>{
			emojis = ["%F0%9F%87%B1","%F0%9F%87%AE","%F0%9F%87%B9","%F0%9F%94%A5","%F0%9F%87%A6","%F0%9F%87%AB"];
			putEmoji = (p,e,l)=>{
				p.addReaction(e,message,channel,(e,r)=>{
					if(e)console.log(e);
					if(l.length<1)return;
					setTimeout(putEmoji.bind(this,p,l.shift(),l),150);
				});
			};
			message = "";
			p.delMSG(event.channel_id,event.id,(e_,r_)=>{
				if(e_){
					p.bot.getMessages({channelID:channel,limit:2},(e,r)=>{
						message = r[1].id;
						putEmoji(p,emojis.shift(),emojis);
					});
				}else{
					p.bot.getMessages({channelID:channel,limit:1},(e,r)=>{
						message = r[0].id;
						putEmoji(p,emojis.shift(),emojis);
					});
				}
			});
			console.log(p.bot.channels[channel].last_message_id);
			console.log(channel);
			//putEmoji(p,emojis.shift(),emojis);
		}
		//  
	},
	sotru:{
		aliases: [],
		allowed: (p, user, args, event, helpReq)=>{return user.id==p.owner;},
		usage:"React `so tru` to the latest message",
		desc:"Do it. Just do it.",
		run: (p,args,user,channel,event)=>{
			emojis = ["%F0%9F%91%8C%F0%9F%8F%BC","%F0%9F%87%B8","%F0%9F%87%B4","%F0%9F%92%AF","%F0%9F%87%B9","%F0%9F%87%B7","%F0%9F%87%BA","%F0%9F%91%8C%F0%9F%8F%BB"];
			putEmoji = (p,e,l)=>{
				p.addReaction(e,message,channel,(e,r)=>{
					if(e)console.log(e);
					if(l.length<1)return;
					setTimeout(putEmoji.bind(this,p,l.shift(),l),150);
				});
			};
			message = "";
			p.delMSG(event.channel_id,event.id,(e_,r_)=>{
				if(e_){
					p.bot.getMessages({channelID:channel,limit:2},(e,r)=>{
						message = r[1].id;
						putEmoji(p,emojis.shift(),emojis);
					});
				}else{
					p.bot.getMessages({channelID:channel,limit:1},(e,r)=>{
						message = r[0].id;
						putEmoji(p,emojis.shift(),emojis);
					});
				}
			});
			console.log(p.bot.channels[channel].last_message_id);
			console.log(channel);
			//putEmoji(p,emojis.shift(),emojis);
		}
		//  
	},
	getemoji:{
		aliases: [],
		allowed: (p, user, args, event, helpReq)=>{return true;},
		usage:"Get an emoji's string",
		desc:"Useful for http queries and ways to share emojis.",
		run: (p,args,users,channel,event)=>{
			p.reply(event,args[0]+" = `"+p.stringifyEmoji(args[0])+"`");
		}
	}
} 

module.exports=test;
