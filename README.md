# DeathGuard Darnell
===================================
### What is DeathGuard Darnell?:
###### Deathguard Darnell is a ["Discord"](https://discordapp.com/) bot made to allow easy access to WoW data such as items, achievements, quests, and even the auction house! While that is the main goal of the bot it also does an incredible amount of other things such as Math with custom variables, execute code from discord and much more! 
===================================
### Todo: 
###### Todo can be found in a comment at the top of the main files in my projects. In this case it is WoWDB.js.
###### Certain files may also have their own miniature TODO lists at the top of the file.
===================================
### How to use:
1. Make a file called `UserPass.js` in the same directory as `WoWDB.js`

	```javascript 
	var DiscordClient = require('discord.io');
	var bot = new DiscordClient({
		token: "<Your bot token>"
	});
	exports.bot = bot;
	var Twitter = require('twitter');Twitter = new Twitter({consumer_key: '<twitter:conskey>',consumer_secret: '<twitter:consec>',access_token_key: '<twitter:accesskey>',access_token_secret: '<twitter:accessec>'});//Used for the twitter command
	exports.twitter=Twitter;
	var mysql = require("mysql");mysql = mysql.createConnection({host:'<mysqldb:host>',user:'<mysqldb:user>',password:'<mysqldb:pass>',database:'<mysqldb:database>'});mysql.connect();//Used for the log
	exports.mysql=mysql;
	exports.owner = "<your own discord id>";
	```

	MYSQL and Twitter are only required for some modules.
	If you don't have a Twitter api account or a MYSQL database set the variable to null and the associated modules will simply shutdown on load.
2. Make sure you have nodejs installed...

	Install it from [here](https://nodejs.org/en/) if you haven't already.
3. Run the bot.

	```
	node .
	``` 
4. Invite the bot to a server.
5. Type "!help" in the channel you are in for commands.