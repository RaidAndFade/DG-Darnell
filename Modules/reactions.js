const EventEmitter = require('events');
class EE extends EventEmitter{}
const reactions = new EE();
reactions.name="Reactions";

reactions.on("load",(p,data)=>{
	console.log("Reactions loaded!");
});
reactions.on("unload",(p,data)=>{
	console.log("Reactions Module unloaded!");
});

reactions.commands = {
	litaf:{
		aliases: [],
		allowed: (p, user, args, event, helpReq)=>{return p.hasPerm(event,user,"BOT_OWNER");},
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
		allowed: (p, user, args, event, helpReq)=>{return p.hasPerm(event,user,"BOT_OWNER");},
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
		}
	},
	writeReaction:{
		aliases: [],
		allowed: (p, user, args, event, helpReq)=>{return p.hasPerm(event,user,"BOT_OWNER");},
		usage:"React `your message` to the latest message",
		desc:"Do it. Just do it.",
		run: (p,args,user,channel,event)=>{
			letterToEmoji = (l)=>{

			}
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
		}
	},
	clearReactions:{
		aliases: [],
		allowed: (p, user, args, event, helpReq)=>{return p.hasPerm(event,user,"BOT_OWNER");},
		usage:"React `so tru` to the latest message",
		desc:"Do it. Just do it.",
		run: (p,args,user,channel,event)=>{

		}
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
};
module.exports=reactions;
