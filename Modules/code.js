
const request = require('request');
const querystring = require('querystring');
const EventEmitter = require('events');
class EE extends EventEmitter{}
const code = new EE();
code.name="Eval";

code.on("load",(p,data)=>{
	console.log("Code loaded!");
});
code.on("unload",(p,data)=>{
	console.log("Code unloaded!");
});

code.commands={
	exec: {
		aliases: [],
		allowed: (p,user,args,event,helpReq) => {
			return true;
		}, 
		parse: utils.combinate.snippet,
		usage: "exec <code snippet>",
		desc: "This command attempts to execute your code snippet! WEEE!",
		run: (p, args, user, channel, event) => {
			console.log(args);
			if(args.lang==""){
				p.reply(event,"Make sure you say what language your code is by having your snippet start with the ending of that language's file.\nEx : \`\`\`js or \`\`\`cpp or \`\`\`py");
			}else{
				if(args.code==""){
					p.reply(event,"Not executing empty code. Sorry pal");
				}else{
					p.reply(event,"Executing your `"+args.lang+"` code now! Please wait!",()=>{
						request.post({
							headers: {'content-type' : 'application/x-www-form-urlencoded'},
							url: 'http://192.168.5.60:6051/'+args.lang,
							body: "code="+querystring.escape(args.code)},
							function (error, response, body) {
								if (!error && response.statusCode == 200) {
									p.reply(event,"```\n"+body.replace(/`/,"'")+"\n```");
								}else{
									console.log(error);
								}
							}
						);
					});
				}
			}
		}		
	}
};
module.exports=code;
