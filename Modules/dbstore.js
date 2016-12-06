const EventEmitter = require('events');
class EE extends EventEmitter{}
const dbstore = new EE();
dbstore.name="DBStore";

dbstore.on("load",(p,data)=>{
	if(data.lastUpdate)lastUpdate=data.lastUpdate;
	p.bot.getAllUsers();
	console.log("DBStore loaded!");
});
dbstore.on("unload",(p,data)=>{
	data.lastUpdate=lastUpdate;
	console.log("DBStore unloaded!");
});

var updateInterval = 1800000;//5 mins.
var lastUpdate = new Date().getTime();

dbstore.on("tick",(p)=>{
	try{
		if(new Date().getTime()-lastUpdate>updateInterval){
			p.bot.getAllUsers();
			lastUpdate = new Date().getTime();
			console.log("===================================================");
			console.log("-------------------- DBSTORE ----------------------");
			console.log("UPDATING DISCORD DATABASE OF USERS/CHANNELS/GUILDS.");
			console.log("-------------------- DBSTORE ----------------------");
			console.log(Object.keys(p.bot.servers).length+" GUILDS");
			Object.keys(p.bot.servers).forEach(((sid)=>{
				var s = p.bot.servers[sid];
				console.log(sid);
				var sdata = JSON.parse(JSON.stringify(s));
				delete sdata.members;
				sdata = JSON.stringify(sdata);
				p.cons.dbstore.query("INSERT INTO `discord_guilds` (`guildId`,`ownerId`,`name`,`data`) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE `name` = ?, `data` = ?",[s.id,s.owner_id,s.name,sdata,s.name,sdata],(e,r,f)=>{
					if(e)console.log(e);
					delete sdata;
				});
			}).bind(this));
			console.log(Object.keys(p.bot.channels).length+" CHANNELS");
			Object.keys(p.bot.channels).forEach(((sid)=>{
				var s = p.bot.channels[sid];
				console.log(sid);
				p.cons.dbstore.query("INSERT INTO `discord_channels` (`chanId`,`guildId`,`name`,`lastMessageId`,`position`) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE `name` = ?, `lastMessageId` = ?, `position` = ?",[s.id,s.guild_id,s.name,s.last_message_id,s.position,s.name,s.last_message_id,s.position],(e,r,f)=>{
					if(e)console.log(e); 
				});
			}));
			console.log(Object.keys(p.bot.users).length+" USERS");
			var i=0;
			Object.keys(p.bot.users).forEach(((sid)=>{
				var s = p.bot.users[sid];
				console.log(sid);
				setTimeout(((c,s)=>{
					if(!s.username)return;
					c.query("INSERT INTO `discord_users` (`id`,`name`,`discrim`,`avatar`) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE `name` = ?, `discrim` = ?, `avatar` = ?",[s.id,s.username,s.discriminator,s.avatar?s.avatar:"",s.username,s.discriminator,s.avatar?s.avatar:""],(e,r,f)=>{
					if(e)console.log(e); 
				});
				}).bind(null,p.cons.dbstore,s),(i++)*3);
			}));
			console.log("===================================================");
		}else{
			console.log("DBSTORE : "+(new Date().getTime()-lastUpdate));
		}
	}catch(e){console.log(e);}
});

dbstore.commands = {
};

module.exports=dbstore;
