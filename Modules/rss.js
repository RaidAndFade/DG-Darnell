const EventEmitter = require('events');
const feedread = require("feed-read");
const request = require("request");
class EE extends EventEmitter{}
const rss = new EE();
rss.name="RSS";

interval = 60000;

nextCheck = new Date().getTime()+interval; //300000 = 5 mins //60000 = 1 minute

feeds=[];

feedData=[];

channels={};

rss.on("load",(p,data)=>{
	if(data.feeds)feeds=data.feeds;
	if(data.channels)channels=data.channels;
	if(data.feedData)feedData=data.feedData;
	if(data.nextCheck)nextCheck=data.nextCheck;
	console.log("rss loaded!");
});
rss.on("unload",(p,data)=>{
	data.nextCheck=nextCheck;
	data.feeds = feeds;
	data.channels = channels;
	data.feedData = feedData;
	console.log("rss unloaded!");
});

//Where A is the base and B is the new array.
//Returns what was lost in first array and what was gained in second array as an array of two arrays.
function arr_diff(a,b){
	var c=[];//clone of a
	var d=[];//Anything a does not include
	var e=[];//Anything a *does* include
	for(var an of a){
		c.push(an);
	}
	for(var bn of b){
		if(c.indexOf(bn)===-1)d.push(bn);
		else e.push(bn);
	}
	for(var en of e){
		c.splice(c.indexOf(en),1);
	}
	return [c,d];
}

function feed_diff(a,b){
		var c=[];//clone of a
		var d=[];//Anything a does not include
		var e=[];//Anything a *does* include
		for(var an of a){
			c.push(an);
		}
		for(var bn of b){
			var ds=false;
			for(var cn of c){
				if(cn.title==bn.title||cn.published==bn.published||cn.content==bn.content)ds=true;
				if(ds){
					break;
				}
			}
			if(!ds)d.push(bn);
			else e.push(bn);
		}
		for(var en of e){
			c.splice(c.indexOf(en),1);
		}
		return [c,d];
}

rss.on("tick",(p)=>{
	var feedcount = [];
	for(var chid in channels){
		var channel = channels[chid];
		channel.sort();
		for(var fi in channel){
			var fid = channel[fi];
			if(feeds[fid]){
				feedcount[fid]=isNaN(feedcount[fid]+1)?1:feedcount[fid]+1;
			}else{
				channel.splice(fi,1);
			}
		}
		if(channel.length<1)delete channels[chid];
	}
	for(var fid in feeds){
		if((!feedcount[fid])||feedcount[fid]<1){
			feeds.splice(fid,1);
			feedData.splice(fid,1);
			feedcount.splice(fid,1);
		}
	}
	if(nextCheck - new Date().getTime()>0 || feeds.length<1)return;
	nextCheck = new Date().getTime()+interval;
	for(var fid in feeds){
		var feed = feeds[fid];
		request.get({url:feed,headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36"}},((f,fid,e,r,b)=>{
			feedread.rss(b, ((f,fid,e,a)=>{
				var newData = feed_diff(a,feedData[fid]?feedData[fid]:[])[1];
				//console.log(newData);
				console.log(fid);
				console.log(newData.length);
				feedData[fid] = a;
				if(newData.length<1)return;
				for(var chId in channels){
					console.log(Object.keys(feeds));
					console.log(channels);
					var chan = channels[chId];
					send=false;
					for(var feedid of chan){
						if(feedid==fid){send=true;break;}
					}
					console.log(fid);
					console.log(send);
					if(send){
						var data = newData[0];
						console.log(data);
						p.sendTo(chId,"```prolog\nRSS FEED FROM: \n'\t"+f+"\t'"+(newData.length>1?"\nthere were "+newData.length+" new updates, only showing latest one.":"")+"\n\n  Title : '"+data.title+"'\n Author : "+data.author+"\nContent : "+(data.content.length>50?data.content.substr(0,47).toLowerCase()+"...":data.content.toLowerCase())+"\n\n   Link : '"+data.link+"'\n```");
					}
				}
			}).bind(this,f,fid));
		}).bind(this,feed,fid));
	}
});

rss.commands = {
	rss:{
		aliases: [],
		allowed: (p,user,args,event,helpReq) => {
			return p.hasPerm(event,user,"MANAGE_MESSAGES");;
		},
		parse: utils.combinator.seq(utils.combinate.phrase.or(utils.combinator.of("help")),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.phrase.or(utils.combinator.of(""))),
		usage: "rss help",
		desc: "Manage RSS feeds on this channel.",
		run: (p, args, user, channel, event) => {
			args[1] = args[2];
			args.splice(2,1);
			switch(args[0]){
				case "add":
					if(feeds.indexOf(args[1])===-1)
						request.get({url:args[1],headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36"}},(e,r,b)=>{
							if(e||r.statusCode!=200){
								console.log(r);
								console.log(r.statusCode);
								console.log(e);
								return p.reply(event,"**ERROR** That link cannot be reached!");
							}
							feedread.rss(b, (e,a)=>{
								if(e) return p.reply(event,"**ERROR** That rss stream is not valid!");
								else{
									feeds.push(args[1]);
									if(Object.keys(channels).indexOf(channel)===-1)channels[channel]=[];
									channels[channel].push(feeds.indexOf(args[1]));
									return p.reply(event,"That feed has been added to this channel!");
								}
							});
						});
					else{
						if(Object.keys(channels).indexOf(channel)===-1)channels[channel]=[];
						if(channels[channel].indexOf(feeds.indexOf(args[1]))!==-1)return p.reply(event,"**ERROR** That feed is already in this channel!");
						channels[channel].push(feeds.indexOf(args[1]));
						return p.reply(event,"That feed has been added to this channel!");
					}
					break;
				case "list":
					console.log(channels);
					if(Object.keys(channels).indexOf(channel)!==-1)
						if(channels[channel].length<1) delete channels[channel];
					if(Object.keys(channels).indexOf(channel)===-1)return p.reply(event,"This channel has no rss feeds!\nAsign one using the `rss add` command");
					var links = "";
					for(var fid of channels[channel]){
						links+=fid + " : " + feeds[fid]+"\n";
					}
					p.reply(event,"```\nList of RSS feeds in this channel : \n"+links+"\n```");
					break;  
				case "del":
				case "delete":
					if(Object.keys(channels).indexOf(channel)===-1)return p.reply(event,"This channel has no rss feeds!\nAsign one using the `rss add` command");
					if(!isNaN(args[1])){
						args[1] = (args[1]-1)+1;
						if(feeds[args[1]]===-1)return p.reply(event,"That feed is not in this Channel!");
						if(channels[channel].indexOf(args[1])===-1)return p.reply(event,"That feed is not in this Channel!");
						channels[channel].splice(channels[channel].indexOf(args[1]),1);
						p.reply(event,"Feed successfully removed from this channel!");						
					}else{
						if(feeds.indexOf(args[1])===-1)return p.reply(event,"That feed is not in this Channel!");
						if(channels[channel].indexOf(feeds.indexOf(args[1]))===-1)return p.reply(event,"That feed is not in this Channel!");
						channels[channel].splice(channels[channel].indexOf(feeds.indexOf(args[1])),1);
						p.reply(event,"Feed successfully removed from this channel!");
					}
					break;
				default:
					p.reply(event,"```\nRSS SubCommands:\n\nrss add <link> : Add a feed to this channel.\nrss list       : List all feeds in this channel.\nrss del <link> : Remove a feed from this channel\n```");
					break;
			}
		}
	}
};
module.exports=rss;
