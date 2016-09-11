const EventEmitter = require('events');
class EE extends EventEmitter{}
const translate = new EE();
var https = require("https");

translate.name="Translate";

translate.commands = {
	translate: {
		aliases: [],
		allowed: (p,user,args,event) => {
			return true;
		},
		parse: utils.combinator.seq(utils.combinate.phrase.or(utils.combinator.of("help")),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.word.or(utils.combinator.of("auto")),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.phrase.or(utils.combinator.of("en"))),
		usage: "translate \"<phrase>\" <outputLanguage> <inputLanguage>",
		desc: "translate sentances to different languages.",
		run: (p, args, user, channel, event) => {
			if(args[0]=="help"){
				return p.reply(event,"```\nTranslate command usage:"+
										"\ntranslate \"<phrase>\" <outputLanguage> <inputLanguage>"+
										"\n```");
			}else{
				path="/translation/text/translate"+
					"?key="+p.keys.systran+
					"&withSource=false"+
					"&withAnnotations=false"+
					"&backTranslation=false"+
					"&encoding=utf-8"+
					"&input="+encodeURIComponent(args[0])+
					"&source="+encodeURIComponent(args[2])+
					"&target="+encodeURIComponent(args[4]);
				p.reply(event,"Translating `"+args[0]+"` to `"+args[4]+"`...",(e,r)=>{
					https.get({host:"api-platform.systran.net",path:path},(resp)=>{
						var respJ = "";
						resp.on('data',(chunk)=>{
							respJ+=chunk;
						});
						resp.on('end',()=>{
							respO = JSON.parse(respJ).outputs[0];
							p.reply(event,"Translating `"+args[0]+"` to `"+args[4]+"`\nResult : `"+respO.output+"`");
						});
					}).end();
				})
			};
		}
	},
} 

module.exports=translate;
