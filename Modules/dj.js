const EventEmitter = require('events');
var youtubedl = require('youtube-dl');
//var Lame = require('lame'); was going to use lame but ffmpeg does a better job
var spawn = require('child_process').spawn;
var fs = require("fs");
class EE extends EventEmitter{}
const dj = new EE();
dj.name="DJ";

dj.channels = {};//STRUCTURE = guild_id:{channel_id,join_command_initiator_userID,join_command_initiator_channelID};
dj.queue = {}
dj.connected = {};
streamlist = [];
streams = {};
dj.on("load",(p,d)=>{
	if(d.queue)dj.queue=d.queue;
	if(d.channels)dj.channels=d.channels;
});
dj.on("unload",(p,d)=>{
	d.channels=dj.channels;  
	for(serv in dj.channels){
		chan=dj.channels[serv];
		try{p.bot.leaveVoiceChannel(chan[0]);}catch(e){}
	}
	for(server in dj.queue){
		for(song in dj.queue[server]){
			dj.queue[server][song].playing=false;
			dj.queue[server][song].at-=5;
			if(dj.queue[server][song].at<0)dj.queue[server][song].at=0;
			dj.queue[server][song].startAt=dj.queue[server][song].at;
		}
	}
	for(stream in streamlist){
		try{streamlist[stream].kill();}catch(e){}
	}
	d.queue=dj.queue; 
});
//test.on("message",(p,user,channelId,message,rawEvent)=>{console.log(user.id+" said "+rawEvent.d.id)});
//test.on("message_updated",(p,msgId,user,channelId,message,rawEvent)=>{console.log(user.id+" edited "+msgId)});
//test.on("message_deleted",(p,msgId,user,channelId,message,rawEvent)=>{console.log(user.id+" deleted "+msgId)});
function isMod(event,user,p){
	servUser=p.bot.servers[p.bot.channels[event.channel_id].guild_id].members[user.id];
	userRoles=[];
	outputRoles="";
	userPermissions=0;  
	for(role of servUser.roles){
		userRoles.push(p.bot.servers[p.bot.channels[event.channel_id].guild_id].roles[role]);
		outputRoles+=p.bot.servers[p.bot.channels[event.channel_id].guild_id].roles[role].name+"\n";
		userPermissions=userPermissions|p.bot.servers[p.bot.channels[event.channel_id].guild_id].roles[role]._permissions;
	}
	return userPermissions&2==2||userPermissions&8192==8192; 
}
function Song(user,id,title,server,info){
	var sself = this;
	this.id = id;
	this.link = "https://www.youtube.com/watch?v="+id;
	this.title = title;
	this.file = "./Modules/dj/"+id+".mp3";
	this.isSaved = false;
	this.requestedBy = {"name":user.username,"id":user.id};
	this.playing=false;
	this.finished=false;
	this.durationStr=info.duration;
	dur = this.durationStr.split(":");
	this.duration = dur.length==3?(+dur[0])*3600+(+dur[1])*60+(+dur[2]):(+dur[0])*60+(+dur[1]);
	this.server=server;
	this.at=0;
	this.startAt=0;
	this.atStr="";
	youtubedl.exec(this.link, ['-o',"./Modules/dj/%(id)s.%(ext)s",'-x', '--audio-format', 'mp3'], {}, function exec(err, output) {
	  'use strict';
	  if (err) { throw err; }
	  console.log(output.join('\n'));
	  sself.isSaved=true;
	});
}
function delSong(song){
	unlink(song.file);
	delete song;
}
function playSong(song,audiostream,server){ 
	console.log("Starting at "+song.at);
	song.playing=true;
	streams[server]=spawn('ffmpeg',['-i',song.file,'-f','s16le','-af','volume=0.5','-acodec','pcm_s16le','-ar','48000','-ac','2','-ss',song.at,'pipe:1'],{stdio:['pipe','pipe','pipe']});
	streams[server].stdout.once('readable',()=>{
		audiostream.send(streams[server].stdout); 
	});
	streams[server].stderr.on('data',(d)=>{  
		var data = d.toString();
		if(data.indexOf("time=")==-1)return console.log(data);
		timeStr = data.match(/time=([0-9]{2}:[0-9]{2}:[0-9]{2})/)[1];
		song.atStr=timeStr;
		timeArr = timeStr.split(":");
		song.at=timeArr.length==3?(+timeArr[0])*3600+(+timeArr[1])*60+(+timeArr[2]):(+timeArr[0])*60+(+timeArr[1]);
		//console.log(timeStr);
		//console.log(d.toString()); //<<parse this somehow>>
	});
	streamlist.push(streams[server]);
}
function idFromLink(url){
	if(url.indexOf("youtu")==-1&&url.indexOf("?")==-1&&url.indexOf("com")==-1)return url;
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?\>]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
}
function getSong(l,e,p){
	l=idFromLink(l);
	p.reply(e,"Fetching video `"+l+"`"); 
	youtubedl.getInfo('http://www.youtube.com/watch?v='+l, [], function(err, info) {
		if (err){
			return p.reply(e,"**ERROR**: "+err);
		}
		ratings = info.like_count?
				"\n"+info.like_count+" Likes / "+info.dislike_count+" Dislikes"+
				"\nAverage rating : "+(~~(((info.like_count)/(info.like_count+info.dislike_count))*100))+"%":
				"\nLikes and Dislikes are disabled";

		if(e.guild_id in dj.queue){
			for(song of dj.queue[e.guild_id]){ 
				if(song.id==l){ 
					return p.reply(e,"**ERROR** : That song is already in queue");
				}
			}
			dj.queue[e.guild_id].push(new Song(e.author,l,info.title,e.guild_id,info));
		}else{
			dj.queue[e.guild_id]=[];
			dj.queue[e.guild_id].push(new Song(e.author,l,info.title,e.guild_id,info));
		}
		p.reply(e,"```py\nVideo Given:"+
				"\nTitle : '"+info.title+"'"+
				"\nVideo Length : "+info.duration+
				"\nChannel: "+info.uploader+""+
				"\n"+info.view_count+" Views"+
				ratings+
				"\nDownloading now...\n```");
	});
}
joinedYet=false;
joining=false;
joined=true;
chAcCallback = (p,ch,e,s)=>{
	if(e)return console.log(e);
	dj.connected[ch]=s;
	console.log("JOINED "+ch);
	joined=true;
}
getChAc = (p,ch)=>{
	console.log("GETAC "+ch);
	p.bot.getAudioContext(ch,chAcCallback.bind(this,p,ch));
}
chJoinCallback = (p,ch,e)=>{
	if(e)return console.log(e);
	console.log("JOINING "+ch);
	setTimeout(getChAc.bind(this,p,ch),0);
}
joinCh = (p,ch)=>{
	console.log("JOIN "+ch);
	p.bot.joinVoiceChannel(ch,chJoinCallback.bind(this,p,ch));
}
join = (p,chans)=>{
	if(joining)return;
	joining=true;
	joinQueue = [];
	lastJoined = 0;
	for(serv in chans){
		joinQueue.push(chans[serv][0]);
	}
	joinNext = ()=>{
		if(joined==false){
			setTimeout(joinNext,100);
		}else{
			if(lastJoined<joinQueue.length){
				joined=false;
				setTimeout(joinCh.bind(this,p,joinQueue[lastJoined++]),0);
				setTimeout(joinNext,100);
			}
		}
	}
	setTimeout(joinNext,100);
	joinedYet=true;
};
dj.on("tick",(p)=>{
	if(!joinedYet){
		console.log("START JOINING");
		join(p,dj.channels);
		return;
	}
	for(server in dj.queue){
		queue = dj.queue[server];
		if(queue.length<1)continue;
		if(!dj.channels[server])continue;
		if(queue[0].playing==false){
			if(queue[0].isSaved==true){
				if(!dj.connected[dj.channels[server][0]])continue;
				playSong(queue[0],dj.connected[dj.channels[server][0]],server);
			}
		}else{
			if(queue[0].finished==true){
				delSong(queue.shift());
			}
		}
	}
});
statusUpdates={};
function serverStatus(server,event,p){
	if(statusUpdates[server][0]++>=10)return;
	setTimeout(serverStatus.bind(this,server,statusUpdates[server][1],p),2000);
	if(dj.queue.length<1)return p.editReply(event,"```xl\nWaiting for a request\n```");
	sTT = (secs)=>{
		hours=~~(secs/3600)
		mins=0;
		return "N/A";
	}
	
	statusMsg = "```xl\n\tDJ Status"+
				"\nCurrent Song  : '"+dj.queue[server][0].title.replace(/'/g,"`")+"'"+
				"\nSong Time     : "+sTT(dj.queue[server][0].at+dj.queue[server][0].startAt)+"/"+sTT(dj.queue[server][0].duration)+
				"\nRequested By  : '"+(""+dj.queue[server][0].requestedBy.name).replace(/'/g,"`")+"'"+
				"\n"+(dj.queue[server].length>1?"Next Song : '"+dj.queue[server][1].title.replace(/'/g,"`")+"'":"No Other Songs In Queue")+
				"\n```";
	p.editReply(event,statusMsg);
};

dj.commands = {
	dj: {
		aliases: ["music"],
		allowed: (p,user,args,event,helpReq) => {
			return true;
		},
		usage: "dj help",
		desc: "Music bot ~ Plays youtube videos",
		parse: utils.combinator.seq(utils.combinate.word.or(utils.combinator.of("help")),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.phrase.or(utils.combinator.of("")),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.phrase.or(utils.combinator.of("")),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.phrase.or(utils.combinator.of(""))),
		run: (p, args, user, channel, event) => {
			p.pushDEL(channel,event.id);
			if(!event.guild_id)return p.reply(event,"This command can only be used in servers, not DMs. DM call bots are planned though...");
			switch(args[0]){
				case "test":
					console.log(user);
					break;
				case "request":
				case "queue":
					getSong(args[2],event,p);
					break;
				case "join":
					if(dj.channels[event.guild_id]&&!isMod(event,user,p))return p.reply(event,"I am already in `"+p.bot.channels[dj.channels[event.guild_id]].name+"`!");
					vchan = p.bot.servers[event.guild_id].members[event.author.id].voice_channel_id;
					if(!vchan)return p.reply(event,"You must be in a voice channel!");
					vchanD = p.bot.channels[vchan];
					if(Object.keys(vchanD.members).length>=vchanD.user_limit&&vchanD.user_limit!=0)return p.reply(event,"The channel you are in is full!");
					if(dj.channels[event.guild_id])p.bot.leaveVoiceChannel(dj.channels[event.guild_id][0],()=>{p.bot.joinVoiceChannel(vchan,(e)=>{if(e)return p.reply(event,"**ERROR JOINING CHANNEL:** "+e);dj.channels[event.guild_id]=[vchan,user.id,channel];setTimeout(getChAc.bind(this,p,vchan),0);});});
					else p.bot.joinVoiceChannel(vchan,(e)=>{if(e)return p.reply(event,"**ERROR JOINING CHANNEL:** "+e);dj.channels[event.guild_id]=[vchan,user.id,channel];setTimeout(getChAc.bind(this,p,vchan),0);});
					break; 
				case "skip":
					if(!streams[event.guild_id])p.reply(event,"Nothing to skip.");
					song = dj.queue[event.guild_id][0];
					if(song.requestedBy.id!=user.id&&!isMod(event,user,p))return p.reply(event,"Skip Voting is a planned feature, for now only mods and the requester can skip songs.");
					song = dj.queue[event.guild_id].shift();
					console.log(song);
					streams[event.guild_id].kill();
					delete streams[event.guild_id];
					delSong(song);
					p.reply(event,"Skipped `"+song.title+"`");
					break;
				case "status":
					p.reply(event,streams[event.guild_id]?"```xl\nLoading DJ Status\n```":"```xl\nWaiting for a request\n```",(e,r)=>{
						if(!streams[event.guild_id])return;
						statusUpdates[event.guild_id]=[0,event];
						serverStatus(event.guild_id,event,p);
					});
					break;
				default: 
					p.reply(event,"```\nDJ Subcommands:\n"+ 
									"\ndj request <youtube link> : Add a youtube video to the song queue."+
									"\ndj skip                   : Skip the current song."+
									"\ndj join                   : Join the same channel as you"+
									"\ndj status                 : Show current DJ status"+
									"\n```");
					break;
			}
		}
	}
} 

module.exports=dj;
