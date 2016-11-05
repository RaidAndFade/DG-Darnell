 
const EventEmitter = require('events');
class EE extends EventEmitter{}
const wh = new EE();
wh.name="WoWDB";

var persistentVar={};
var channelRealms={};
wh.on("load",(p,data)=>{
	if(data.persistentVar)persistentVar=data.persistentVar;
	if(persistentVar.chRealms)channelRealms=persistentVar.chRealms;
	console.log("WoWDB loaded!");
	if(!p.cons.wowdb||!p.cons.wowauc){
		p.disable(wh,"DBs not found. Disabling WoWDB module");
	}else{
		p.cons.wowdb.query('SELECT 1', (err, rows) => {
			if(err)p.disable(wh,"WoW DB database having issues, not going to bother, disabling WoWDB module");
		});
		p.cons.wowauc.query('SELECT 1', (err, rows) => {
			if(err)p.disable(wh,"WoW AUC database having issues, not going to bother, disabling WoWDB module");
		});
	}
});
wh.on("unload",(p,data)=>{
	persistentVar.chRealms = channelRealms;
	data.persistentVar=persistentVar;
	console.log("WoWDB unloaded!");
});
//wh.on("message",(p,user,channelId,message,rawEvent)=>{console.log(user.id+" said "+rawEvent.d.id)});
//wh.on("message_updated",(p,msgId,user,channelId,message,rawEvent)=>{console.log(user.id+" edited "+msgId)});
//wh.on("message_deleted",(p,msgId,user,channelId,message,rawEvent)=>{console.log(user.id+" deleted "+msgId)});
function bitmaskToArr(bitmask){
	setBits=[];
	for(k=0;k<32;k++){
		if((bitmask&Math.pow(2,k))!=0)setBits[k+1]=true;
	}
	return setBits;
}
raceList={1:"Human",2:"Orc",3:"Dwarf",4:"Night Elf",5:"Undead",6:"Tauren",7:"Gnome",8:"Troll",9:"Goblin",10:"Blood Elf",11:"Draenei",12:"Fel Orc",13:"Naga",14:"Broken",15:"Skeleton",16:"Vrykul",17:"Tuskarr",18:"Forest Troll",19:"Taunka",20:"Northrend Skeleton",21:"Ice Troll",22:"Worgen",23:"Gilnean",24:"Neutral Pandaren",25:"Tushui Pandaren",26:"Huojin Pandaren"};
function readRaceBitmask(mask){
	if(mask==-1||mask==4294967295)return "Any";
	if(mask==18875469)return "Alliance";
	if(mask==33555378)return "Horde";
	races="";
	for(k in bitmaskToArr(mask)){
		races+=raceList[k]+",";
	}
	return races.slice(0,races.length-2);
}
function search(event,args,p){
	subsubcom = args.length>2&&args[2]!=""?args[2]:"help";
	p.cons.wowdb.getConnection((err,con)=>{
		if(err)return p.reply(event,"**Error**: "+err);
		if(args.length<5||args[4]==""){subsubcom="help";}
		subsubcom=subsubcom.toLowerCase();
		searchQuery = args[4];
		searchType = !isNaN(searchQuery)?"ID":"Name";
		var possibleSubSubComs = {item:[],spell:[],achievement:["achieve","achiev"],creature:[],title:[],mount:[],map:[],itemset:[],area:["maparea"],zone:["mapzone","mapoverlay"],quest:[]};//quest:[]
		validsubcom=false;
		for(valk in possibleSubSubComs){
			if(valk==subsubcom){validsubcom=true;break;}
			for(alias of possibleSubSubComs[valk]){
				console.log(alias);
				if(alias==subsubcom){subsubcom=valk;validsubcom=true;break;}
			}
		}
		if(validsubcom){
			p.reply(event,"Searching for `"+subsubcom.toLowerCase()+" "+searchType+" "+searchQuery+"`",(e,d)=>{
				switch(subsubcom.toLowerCase()){
				case "item":
					p.mysql.query((searchType=="ID"?"SELECT * FROM `wow_items` WHERE `ID` = ?;":"SELECT * FROM `wow_items` WHERE `Name` LIKE ?;"),[(searchType=="ID"?searchQuery:"%"+searchQuery+"%")],function(err,res,fs){
						if(err)return p.reply(event,"**Error**: "+err);
						items="";
						icount=0;
						for(var item of res){
							items+=item['ID']+" : '"+item['Name']+"'\n";
							icount++;
							if(icount>=10)break;
						}
						items="```py\n"+res.length+" result"+(res.length==1?"":"s")+" found\n"+items;
						items+="```";
						if(icount>0)p.reply(event,items);
						else p.reply(event,"No items with the "+searchType+" `"+searchQuery+"` were found.")
					});
					break;
				case "spell":
					p.mysql.query((searchType=="ID"?"SELECT * FROM `wow_spells` WHERE `ID`=?;":"SELECT * FROM `wow_spells` WHERE `Name` LIKE (?);"),[(searchType=="ID"?searchQuery:"%"+searchQuery+"%")],function(err,res,fs){
						if(err)return p.reply(event,"**Error**: "+err);
						items="";
						icount=0;
						for(var item of res){
							items+=item['ID']+" : '"+item['Name']+"'\n";
							icount++;
							if(icount>=10)break;
						}
						items="```py\n"+res.length+" results found\n"+items;
						items+="```";
						if(icount>0)p.reply(event,items);
						else p.reply(event,"No spells with the `"+searchType+"` `"+searchQuery+"` were found.")
					});
					break;
				case "achievement":
				case "achieve":
				case "achiev":
					con.query((searchType=="ID"?"SELECT * FROM `Achievement` WHERE `Id`=? AND `IconId`!=1;":"SELECT * FROM `Achievement` WHERE `Name` LIKE (?) AND `IconId`!=1;"),[(searchType=="ID"?searchQuery:"%"+searchQuery+"%")],function(err,res,fs){
						if(err)return p.reply(event,"**Error**: "+err);
						items="";
						icount=0;
						for(var item of res){
							if(bitmaskToArr(item.Flags)[1]||bitmaskToArr(item.Flags)[2])continue; 
							items+=item['Id']+" : '"+item['Name']+"'\n";// Show Zone / Faction
							icount++;
							if(icount>=10)break;
						}
						items="```py\n"+res.length+" results found\n"+items;
						items+="```";
						if(icount>0)p.reply(event,items);
						else p.reply(event,"No achievements with the `"+searchType+"` `"+searchQuery+"` were found.")
					});
				break;
				case "creature":
					con.query((searchType=="ID"?"SELECT * FROM `Creature` WHERE `Id`=?;":"SELECT * FROM `Creature` WHERE `Name` LIKE (?);"),[(searchType=="ID"?searchQuery:"%"+searchQuery+"%")],function(err,res,fs){
						if(err)return p.reply(event,"**Error**: "+err);
						items="";
						icount=0;
						for(var item of res){
							items+=item['Id']+" : '"+item['Name']+"'\n";
							icount++;
							if(icount>=10)break;
						}
						items="```py\n"+res.length+" results found\n"+items;
						items+="```";
						if(icount>0)p.reply(event,items);
						else p.reply(event,"No creatures with the `"+searchType+"` `"+searchQuery+"` were found.")
					});
				break;
				case "title":
					con.query((searchType=="ID"?"SELECT * FROM `CharTitle` WHERE `Id`=?;":"SELECT * FROM `CharTitle` WHERE `Name` LIKE (?);"),[(searchType=="ID"?searchQuery:"%"+searchQuery+"%")],function(err,res,fs){
						if(err)return p.reply(event,"**Error**: "+err);
						items="";
						icount=0;
						for(var item of res){
							items+=item['Id']+" : '"+item['Name']+"'\n";// Show Zone / Faction
							icount++;
							if(icount>=10)break;
						}
						items="```py\n"+res.length+" results found\n"+items;
						items+="```";
						if(icount>0)p.reply(event,items);
						else p.reply(event,"No titles with the `"+searchType+"` `"+searchQuery+"` were found.")
					});
				break;
				case "mount":
					con.query((searchType=="ID"?"SELECT * FROM `Mount` WHERE `Id`=?;":"SELECT * FROM `Mount` WHERE `Name` LIKE (?);"),[(searchType=="ID"?searchQuery:"%"+searchQuery+"%")],function(err,res,fs){
						if(err)return p.reply(event,"**Error**: "+err);
						items="";
						icount=0;
						for(var item of res){
							items+=item['Id']+" : '"+item['Name']+"'\n";
							icount++;
							if(icount>=10)break;
						}
						items="```py\n"+res.length+" results found\n"+items;
						items+="```";
						if(icount>0)p.reply(event,items);
						else p.reply(event,"No mounts with the `"+searchType+"` `"+searchQuery+"` were found.")
					});
				break;
				case "map":
					con.query((searchType=="ID"?"SELECT * FROM `Map` WHERE `Id`=?;":"SELECT * FROM `Map` WHERE `MapNameLang` LIKE (?);"),[(searchType=="ID"?searchQuery:"%"+searchQuery+"%")],function(err,res,fs){
						if(err)return p.reply(event,"**Error**: "+err);
						items="";
						icount=0;
						for(var item of res){
							items+=item['Id']+" : '"+item['MapNameLang']+"'\n";
							icount++;
							if(icount>=10)break;
						}
						items="```py\n"+res.length+" results found\n"+items;
						items+="```";
						if(icount>0)p.reply(event,items);
						else p.reply(event,"No maps with the `"+searchType+"` `"+searchQuery+"` were found.")
					});
				break;//area:["maparea"],zone:["mapzone","mapoverlay"]
				case "area":
				case "maparea":
					con.query((searchType=="ID"?"SELECT * FROM `WorldMapArea` WHERE `Id`=?;":"SELECT * FROM `WorldMapArea` WHERE `Name` LIKE (?);"),[(searchType=="ID"?searchQuery:"%"+searchQuery.replace(/ /g,"")+"%")],function(err,res,fs){
						if(err)return p.reply(event,"**Error**: "+err);
						items="";
						icount=0;
						for(var item of res){
							items+=item['Id']+" : '"+item['Name'].replace(/([A-Z])/g," $1").trim()+"'\n";
							icount++;
							if(icount>=10)break;
						}
						items="```py\n"+res.length+" results found\n"+items;
						items+="```";
						if(icount>0)p.reply(event,items);
						else p.reply(event,"No areas with the `"+searchType+"` `"+searchQuery+"` were found.")
					});
				break;
				case "zone":
				case "mapzone":
				case "mapoverlay":
					con.query((searchType=="ID"?"SELECT * FROM `WorldMapOverlay` WHERE `Id`=?;":"SELECT * FROM `WorldMapOverlay` WHERE `Name` LIKE (?);"),[(searchType=="ID"?searchQuery:"%"+searchQuery.replace(/ /g,"")+"%")],function(err,res,fs){
						if(err)return p.reply(event,"**Error**: "+err);
						items="";
						icount=0;
						for(var item of res){
							items+=item['Id']+" : '"+item['Name'].replace(/([A-Z])/g," $1").trim()+"'\n";
							icount++;
							if(icount>=10)break;
						}
						items="```py\n"+res.length+" results found\n"+items;
						items+="```";
						if(icount>0)p.reply(event,items);
						else p.reply(event,"No zones with the `"+searchType+"` `"+searchQuery+"` were found.")
					});
				break;
				case "quest":
					con.query((searchType=="ID"?"SELECT * FROM `Quest` WHERE `QuestId`=?;":"SELECT * FROM `Quest` WHERE `Title` LIKE (?);"),[(searchType=="ID"?searchQuery:"%"+searchQuery+"%")],function(err,res,fs){
						if(err)return p.reply(event,"**Error**: "+err);
						items="";
						icount=0;
						for(var item of res){
							items+=item['QuestId']+" : '"+item['Title']+"'\n";// Show Zone / Faction
							icount++;
							if(icount>=10)break;
						}
						items="```py\n"+res.length+" results found\n"+items;
						items+="```";
						if(icount>0)p.reply(event,items);
						else p.reply(event,"No quests with the `"+searchType+"` `"+searchQuery+"` were found.")
					});
				break;		
				case "itemset":
					con.query((searchType=="ID"?"SELECT * FROM `ItemSet` WHERE `Id`=?;":"SELECT * FROM `ItemSet` WHERE `Name` LIKE (?);"),[(searchType=="ID"?searchQuery:"%"+searchQuery+"%")],function(err,res,fs){
						if(err)return p.reply(event,"**Error**: "+err);
						items="";
						icount=0;
						for(var item of res){
							items+=item['Id']+" : '"+item['Name']+"'\n";// Show Zone / Faction
							icount++;
							if(icount>=10)break;
						}
						items="```py\n"+res.length+" results found\n"+items;
						items+="```";
						if(icount>0)p.reply(event,items);
						else p.reply(event,"No itemsets with the `"+searchType+"` `"+searchQuery+"` were found.")
					});
				break;	
				}
			});
		}else{
			searchString="```\nPossible Search Usages:\nAll search requests return up to 10 results.\n";
			for(var searchK in possibleSubSubComs){
				searchString += p.pad("\nwd search "+searchK+" <"+searchK+" id/name part>",50)+" : Search for a"+(searchK.match(/^[aeiou]/)?"n":"")+" "+searchK+" with a specific id/name";
			}
			searchStringSuff="\n```";
			p.reply(event,searchString+searchStringSuff);
		}
		con.release();
	});
}
function get(event,args,p){
	subsubcom = args.length>2&&args[2]!=""?args[2]:"help";
	if(args.length<5||args[4]==""){subsubcom="help";}
	subsubcom=subsubcom.toLowerCase();
	var possibleSubSubComs = {item:[],spell:[],achievement:["achieve","achiev"],creature:[],title:[],mount:[],map:[],itemset:[],area:["maparea"],zone:["mapzone","mapoverlay"],quest:[]};//quest:[]
	validsubcom=false;
	for(valk in possibleSubSubComs){
		if(valk==subsubcom){validsubcom=true;break;}
		for(alias of possibleSubSubComs[valk]){
			console.log(alias);
			if(alias==subsubcom){subsubcom=valk;validsubcom=true;break;}
		}
	}
	if(validsubcom){
		p.cons.wowdb.getConnection((err,con)=>{
			if(err)return p.reply(event,"**DB ERROR**: "+err);
			searchQuery = args[4];
			if(isNaN(searchQuery.replace("@","")))return p.reply(event,"Id has to be a number");
			p.reply(event,"Retrieving `"+subsubcom.toLowerCase()+" "+searchQuery+"`",(e,d)=>{
				switch(subsubcom.toLowerCase()){
					case "mount":
					{
						con.query(("SELECT * FROM `Mount` WHERE `Id`=? LIMIT 1;"),[searchQuery],function(err,res,fs){
							if(err)return p.reply(event,"**Error**: "+err);
							if(res.length==0)return p.reply(event,"No Mounts with the Id `"+searchQuery+"` were found!");
							mountData=res[0];
							mountStr="```py\n";
							mountStr+="Mount : '"+mountData.Name+"' | ID : "+mountData.Id;
							mountStr+="\nDesc :\n\t'"+mountData.Description+"'";
							mountStr+="\nAcquire :\n\t"+mountData.Acquire.replace(/\|c[0-9A-F]{1,8}/g,"").replace(/\|n/g,"\n\t").replace(/\|r/g,"\r\t\t");
							mountStr+="\n```";
							p.reply(event,mountStr);
						});
					}
					break;
					case "item":
					{
						p.reply(event,"https://api.gocode.it/wowdb/img/item/"+searchQuery.replace("@","/"));//Properly download, cache, and reupload
					}
					break;
					case "spell":
					{
						//TODO < Doing easier stuff first>
					}
					break;
					case "achievement":
					{
						con.query("SELECT * FROM `Achievement` WHERE `Id`=? AND `IconId`!=1 LIMIT 1;",[searchQuery],(err,res,fs)=>{
							if(err)return p.reply(event,"**Error**: "+err);
							if(res.length==0)return p.reply(event,"No Achievements with the Id `"+searchQuery+"` were found!");
							errored=false;
							achieve = "```py\n";
							achieve += "Achievement : '"+res[0].Name.replace(/'/g,"`")+"'\n";
							achieve += "Description : \n\t'"+res[0].Description.replace(/'/g,"`")+"'\n";
							if(res[0].RewardDesc!="")achieve += "Reward : '"+res[0].RewardDesc.replace(/'/g,"`")+"'\n";
							hasAchievCatagory=true;gotAchievCatagory=false;achievCatagory="";
							con.query("SELECT * FROM `Achievement_Category` WHERE `Id`=? LIMIT 1;",[res[0].Category],(err_t,res_t,fs_t)=>{
								if(err_t){return p.reply(event,"**Error**: "+err_t);errored=true;}
								console.log(res_t);
								if(res_t.length<1){hasAchievCatagory=false;gotAchievCatagory=true;return;}
								if(res_t[0].ParentId!=-1){
									getParentCategory=(category,prefix)=>{
										console.log("Checking "+category);
										con.query("SELECT * FROM `Achievement_Category` WHERE `Id`=? LIMIT 1;",[category],(err_t_t,res_t_t,fs_t_t)=>{
											if(err_t_t){return p.reply(event,"**Error**: "+err_t);errored=true;}
											if(res_t_t.length<1){	
												achievCatagory="Catagory: '"+prefix+"'\n";
												gotAchievCatagory=true;
											}else{
												if(res_t_t[0].ParentId!=-1){
													getParentCategory(res_t_t[0].ParentId,res_t_t[0].Name+"->"+prefix);
												}else{
													achievCatagory="Catagory: '"+prefix+"'\n";
													gotAchievCatagory=true;
												}
											}
										});
									}
									getParentCategory(res_t[0].ParentId,res_t[0].Name.replace(/'/g,"`"));
								}else{
									achievCatagory="Catagory: '"+res_t[0].Name.replace(/'/g,"`")+"'\n";
									gotAchievCatagory=true;
								}
							});
							sent=false;
							attempts=0;
							waitForFinished=(event)=>{
								if(gotAchievCatagory&&!sent){
									sent=true;
									if(hasAchievCatagory)achieve += achievCatagory;
									achieve += "\n```";
									p.reply(event,achieve);
								}else{
									if(attempts++>200)
										return p.reply(event,"**ERROR** Query took too long. Try again!")
									if(!errored)
										setTimeout(waitForFinished.bind(this,event),100);
								}
							}
							setTimeout(waitForFinished.bind(this,event),100);
						});
					}
					break;
					case "title":
					{
						
					}
					break;
					case "map":
					{
						
					}
					break;
					case "quest":
					{
						con.query("SELECT * FROM `Quest` WHERE `QuestId`=? LIMIT 1;",[searchQuery],(err,res,fs)=>{
							if(err)return p.reply(event,"**Error**: "+err);
							if(res.length==0)return p.reply(event,"No quests with the `id` `"+searchQuery+"` were found.")
							errored=false;
							quest = "```py\n";
							quest += "Quest : '"+res[0].Title.replace(/'/g,"`")+"' (ID:"+res[0].QuestId+") "+(bitmaskToArr(res[0].Flags_0)[15]?"[DEPRECATED]":"")+"\n";
							if(res[0].SuggestedGroupNum!=0)quest += "Suggested No. of Players : '"+res[0].SuggestedGroupNum+"'\n";
							
							questRequirements = "";
							if(res[0].RewardMoney<0)questRequirements += "\t"+(~~(Math.abs(res[0].RewardMoney)/10000)>0?(~~(Math.abs(res[0].RewardMoney)/10000))+" Gold ":"")+(~~(Math.abs(res[0].RewardMoney)/100)%100>0?(~~(Math.abs(res[0].RewardMoney)/100)%100)+" Silver ":"")+(~~(Math.abs(res[0].RewardMoney)%100)>0?(~~(Math.abs(res[0].RewardMoney)%100))+" Copper ":"")+"\n";
							if(res[0].QuestMinLevel>0)questRequirements += "\tLevel : "+res[0].QuestMinLevel+"\n";
							questRewards = "";
							if(res[0].RewardMoney>0)questRewards += "\t"+(~~(res[0].RewardMoney/10000)>0?(~~(res[0].RewardMoney/10000))+"Gold":"")+(~~(res[0].RewardMoney/100)>0?(~~(res[0].RewardMoney/100)%100)+"Silver":"")+(~~(res[0].RewardMoney%100)>0?(~~(res[0].RewardMoney%100))+"Copper":"")+"\n";
							questSuff = "Summary : '"+res[0].Summary.replace(/$B/g,"\n\t").replace(/'/g,"`")+"'";
							
							hasNextQuest=res[0].RewardNextQuest!=0;gotNextQuest=false||!hasNextQuest;nextQuest="";
							hasPreviousQuest=true;gotPreviousQuest=false;previousQuest="";
							hasQuestExp=res[0].QuestLevel>0;gotQuestExp=false||!hasQuestExp;questExp="";
							hasQuestType=true;gotQuestType=false;questType=""//QuestInfo
							questCatagoryIsSort=res[0].QuestSortId<0;hasQuestCatagory=true;gotQuestCatagory=false;questCatagory=""//QuestSort
							//TODO 
							// ~ SPELLS CAST
							// ~ SPELLS REWARDED
							// ~ ITEMS REWARDED
							if(res[0].RaceFlags!=-1&&res[0].RaceFlags!=4294967295)quest += "Allowed Races : "+readRaceBitmask(res[0].RaceFlags)+"\n";
							if(hasNextQuest){
								con.query("SELECT * FROM `Quest` WHERE `QuestId`=? LIMIT 1;",[res[0].RewardNextQuest],(err_t,res_t,fs_t)=>{
									if(err){return p.reply(event,"**Error**: "+err);errored=true;}
									if(res_t.length<1){hasNextQuest=false;gotNextQuest=true;return;}
									nextQuest="'"+res_t[0].Title.replace(/'/g,"`")+"' (ID:"+res_t[0].QuestId+")";
									gotNextQuest=true;
								});
							}
							con.query("SELECT * FROM `Quest` WHERE `RewardNextQuest`=? LIMIT 1;",[res[0].QuestId],(err_t,res_t,fs_t)=>{
								if(err){return p.reply(event,"**Error**: "+err);errored=true;}
								if(res_t.length<1){hasPreviousQuest=false;gotPreviousQuest=true;return;}
								previousQuest="'"+res_t[0].Title.replace(/'/g,"`")+"' (ID:"+res_t[0].QuestId+")";
								gotPreviousQuest=true;
							});
							if(hasQuestExp){
								con.query("SELECT * FROM `QuestXP` WHERE `Id`=? LIMIT 1;",[res[0].QuestLevel],(err_t,res_t,fs_t)=>{
									if(err){return p.reply(event,"**Error**: "+err);errored=true;}
									questExp="\tXp Gained at level "+res[0].QuestLevel+" : "+(res_t[0]["Diff"+res[0].RewardXPDifficulty]*res[0].RewardXPMultiplier);
									gotQuestExp=true;
								});
							}
							con.query("SELECT * FROM `QuestInfo` WHERE `Id`=? LIMIT 1;",[res[0].QuestInfoId],(err_t,res_t,fs_t)=>{
								if(err){return p.reply(event,"**Error**: "+err);errored=true;}
								if(res_t.length<1){hasQuestType=false;gotQuestType=true;return;}
								questType="Quest Type : "+res_t[0].Name;
								gotQuestType=true;
							});
							if(questCatagoryIsSort){
								res[0].QuestSortId=Math.abs(res[0].QuestSortId);
								con.query("SELECT * FROM `QuestSort` WHERE `Id`=? LIMIT 1;",[res[0].QuestSortId],(err_t,res_t,fs_t)=>{
									if(err){return p.reply(event,"**Error**: "+err);errored=true;}
									if(res_t.length<1){hasQuestCatagory=false;gotQuestCatagory=true;return;}
									questCatagory="Quest Catagory : "+res_t[0].Name;
									gotQuestCatagory=true;
								});
							}else{
								//get Map Area based on QuestSortId
								con.query("SELECT * FROM `WorldMapArea` WHERE `Id`=? LIMIT 1;",[res[0].QuestSortId],(err_t,res_t,fs_t)=>{
									if(err){return p.reply(event,"**Error**: "+err);errored=true;}
									if(res_t.length<1){hasQuestCatagory=false;gotQuestCatagory=true;return;}
									questCatagory="Quest Zone : "+res_t[0].Name;
									gotQuestCatagory=true;
								});
							}
							sent=false;
							attempts=0;
							waitForFinished=(event)=>{
								if(gotNextQuest&&gotPreviousQuest&&gotQuestExp&&gotQuestType&&gotQuestCatagory&&!sent){
									sent=true;
									if(hasQuestType)quest += questType+"\n";
									if(hasQuestCatagory)quest += questCatagory+"\n";
									if(hasQuestExp)questRewards += questExp+"\n";
									if(hasNextQuest)quest += "Next Quest : "+nextQuest+"\n";
									if(hasPreviousQuest)quest += "Previous Quest : "+previousQuest+"\n";
									if(questRequirements!="")questRequirements="Quest Requirements:\n"+questRequirements;
									if(questRewards!="")questRewards="Quest Rewards:\n"+questRewards;
									questSuff=questRequirements+questRewards+questSuff;
									quest += questSuff;
									quest += "\n```";
									p.reply(event,quest);
								}else{
									if(attempts++>200)
										return p.reply(event,"**ERROR** Query took too long. Try again!")
									if(!errored)
										setTimeout(waitForFinished.bind(this,event),100);
								}
							}
							setTimeout(waitForFinished.bind(this,event),100);
						});
					}
					break;
					case "area":
					case "maparea":
					{
						con.query("SELECT * FROM `WorldMapArea` WHERE `Id`=?;",[searchQuery],function(err,res,fs){
							if(err)return p.reply(event,"**Error**: "+err);//TODO
							//if(icount>0)p.reply(event,items);
							//else p.reply(event,"No areas with the `"+searchType+"` `"+searchQuery+"` were found.")
						});
					}
					break;
					case "zone":
					case "mapzone":
					case "mapoverlay":
					break;
					case "filedata":
					{
						con.query(("SELECT * FROM `FileDataComplete` WHERE `Id`=? LIMIT 1;"),[searchQuery],function(err,res,fs){
							if(err)return p.reply(event,"**Error**: "+err);//TODO
							//if(res.length==0)return p.reply(event,"No Itemset with the Id `"+searchQuery+"` were found!");
							//return p.reply(event,"```py\nFile Data Id: "+res[0].Id+"\nFile Directory: '"+res[0].Directory+"'\nFile Name: '"+res[0].FileName+"'\n```");
						});
					}
					break;
					case "itemset":
					{
						con.query(("SELECT * FROM `ItemSet` WHERE `Id`=? LIMIT 1;"),[searchQuery],function(err,res,fs){
							if(err)return p.reply(event,"**Error**: "+err);
							if(res.length==0)return p.reply(event,"No Itemset with the Id `"+searchQuery+"` were found!");
							itemSData=res[0];
							itemSStr="```py";
							itemSStr+="\nItemSet : '"+itemSData.Name+"'";
							hasSkill=itemSData.RequiredSkill!="0";
							gotSkill=false;
							if(hasSkill){
								con.query(("SELECT * FROM `SkillLine` WHERE `Id`=? LIMIT 1;"),[itemSData.RequiredSkill],(err,res,fs)=>{
									gotSkill=true;
									itemSStr+="\nRequires "+itemSData.RequiredSkillRank+" "+res[0].Name;
								});
							}
							itemPStr={};
							for(var i = 0;i < 17; i++){
								if(itemSData["itemID"+i]!=0){
									cb = (i,err,res)=>{
										itemPStr[i]=res[0];//perhaps itemtype?
									}
									con.query(("SELECT * FROM `Item-sparse` WHERE `Id`=? LIMIT 1;"),[itemSData["itemID"+i]],cb.bind(this,i));
								}
							}
							var attempts=0;
							checkFinished=()=>{
								done=hasSkill?gotSkill:true;
								for(var i = 0;i < 17&&done; i++){
									if(itemSData["itemID"+i]!=0){
										if(!(i in itemPStr))done=false;
									}
								}
								if(done){
									itemSStr+="\nItems Included:";
									longestItemLength=15;
									for(itemk in itemPStr){
										item = itemPStr[itemk];
										if(item.Name1.length>longestItemLength)longestItemLength=item.Name1.length+1;
									}
									for(itemk in itemPStr){
										item = itemPStr[itemk];
										itemSStr+="\n\t"+p.pad(item.Name1,longestItemLength)+" (ID:"+item.Id+")";
									}
									itemSStr+="\n```";//TODO < Doing easier stuff first>
									p.reply(event,itemSStr);//JSON.stringify(itemSData));
								}else{
									if(attempts++<20){setTimeout(checkFinished.bind(this,event),100);}else{p.reply(event,"**Error**:Query took too long! Try again!")}
								}
							};
							setTimeout(checkFinished.bind(this,event),100);
						});
					}
					break;
				}
			});
			con.release();
		});
	}else{
		subsubcomstr="";
		for(subsubcom in possibleSubSubComs){
			subsubcomstr+=p.pad("\nwd get "+subsubcom+" <"+subsubcom+"id>",35)+" : Get information about a"+(subsubcom.match(/^[aeiou]/)?"n":"")+" "+subsubcom+".";
		}
		suffix="Items can be requested at a specific ilvl by replacing the ID with \"id@ilvl\", ex. `19019@250`";
		p.reply(event,"```\nPossible Subcommands:\n"+subsubcomstr+"\n\n"+suffix+"\n```");
	}	
}

function auctions(event,args,p){
	subsubcom = args.length>2&&args[2]!=""?args[2]:"help";
	switch(subsubcom){
		case "get" :
			if(args.length<4||args[4]==""||isNaN(args[4]))return p.reply(event,"Please remember to enter an item id to check for!\nUse `wd search item \"item name\"` to find the item id of an item.");
			if(event.channel_id in channelRealms)
				p.cons.wowauc.getConnection((err,con)=>{
					if(err)return p.reply(event, "**Database error!**: "+err);
					var item = args[4];
					con.query("SELECT * FROM `ItemHistoryDaily` WHERE `item` = ? AND `house` = ? ORDER BY `when` DESC LIMIT 1;",[item,channelRealms[event.channel_id]],(err,res)=>{
						if(err)return p.reply(event, "**Query error!**: "+err);
						var pricemin = (~~(res[0].pricemin/10000)>0?(~~(res[0].pricemin/10000))+" G ":"")+(~~(res[0].pricemin/100%100)>0?(~~(res[0].pricemin/100)%100)+" S ":"")+(~~(res[0].pricemin%100)>0?(~~(res[0].pricemin%100))+" C ":"");
						var priceavg = (~~(res[0].priceavg/10000)>0?(~~(res[0].priceavg/10000))+" G ":"")+(~~(res[0].priceavg/100%100)>0?(~~(res[0].priceavg/100)%100)+" S ":"")+(~~(res[0].priceavg%100)>0?(~~(res[0].priceavg%100))+" C ":"");
						var pricemax = (~~(res[0].pricemax/10000)>0?(~~(res[0].pricemax/10000))+" G ":"")+(~~(res[0].pricemax/100%100)>0?(~~(res[0].pricemax/100)%100)+" S ":"")+(~~(res[0].pricemax%100)>0?(~~(res[0].pricemax%100))+" C ":"");
						p.reply(event,	"```py\nData last updated '"+(""+new Date(res[0].when*1000))+"'\n"+
										(pricemin!=""?"Minimum price was "+pricemin+"\n":"")+
										(priceavg!=""?"Average price was "+priceavg+"\n":"")+
										(pricemax!=""?"Maximum price was "+pricemax+"\n":"")+
										"```");
					});
				});
			else
				return p.reply(event, "This channel does not have a specific auction house!\nSet one using `wd auc set <realmname@region>`\nMake sure realmname is all lowercase.\nEx:\n`wd auc set rexxar@us`\n`wd auc set aerie-peak@eu`");//Force this to autodelete
			break;
		case "realm":
			sub3com = args.length>4&&args[4]!=""?args[4]:"help";
			if(sub3com=="set"){
				if(!(typeof event.guild_id == undefined || (event.guild_id&&p.bot.servers[event.guild_id]&&user.id==p.bot.servers[event.guild_id].owner_id) || user.id == p.owner)&&!(user.id == event.channel_id || user.id == p.owner)){
					return p.reply(event,"Only the owner of the server can use this command! Sorry!\nDM me if you want to use this on another realm!\nOr invite me to your server by using the `invitelink` command");//Force this to autodelete
				}
				console.log(args);
				if(args.length<6||args[6]==""||args[6].indexOf("@")==-1)return p.reply(event,"Command Usage : \n`wd auc set <realm@region>` with everything lowercase\nEx:\n`wd auc set rexxar@us`\n`wd auc set aerie-peak@eu`");
				var realmstr = args[6];
				var realm = realmstr.split("@")[0];
				var region = realmstr.split("@")[1];
				p.cons.wowauc.getConnection((err,con)=>{
					if(err)return p.reply(event, "**Database error!**: "+err);
					con.query("SELECT * FROM `Realms` WHERE `slug` LIKE ? AND `region` LIKE ? LIMIT 1;",[realm,region],(err,res)=>{
							if(err)return p.reply(event, "**Query error!**: "+err);
							channelRealms[event.channel_id]=res[0].house;
							return p.reply(event,"Channel auction house set to `"+res[0].name+"@"+res[0].region.toLowerCase()+"`");
					});
				});
			}else{
				if(event.channel_id in channelRealms)
					p.cons.wowauc.getConnection((err,con)=>{
						if(err)return p.reply(event, "**Database error!**: "+err);
						con.query("SELECT * FROM `Realms` WHERE `house` = ? AND locale != ''",[channelRealms[event.channel_id]],(err,res)=>{
							if(err)return p.reply(event, "**Query error!**: "+err);
							var realmList = "";
							for(var tres of res){
								realmList+="`"+tres.name+"`/";
							}
							realmList=realmList.slice(0,realmList.length-1);
							return p.reply(event, "This channel's realm(s) : "+realmList.toLowerCase()+" On `"+res[0].region+"`");
						});
					});
				else	
					return p.reply(event, "This channel does not have a specific auction house!\nSet one using `wd auc set <realmname@region>`\nMake sure realmname is all lowercase.\nEx:\n`wd auc set rexxar@us`\n`wd auc set aerie-peak@eu`");//Force this to autodelete
			}
			break;
		default:
			return p.reply(event,	"```py"+
									"\nwd auc help         : Shows this text"+
									"\nwd auc realm        : Set/Get this channel`s realm"+
									"\nwd auc get <itemid> : Get info about an item from it`s Id"+
									"\n```");
	}
}

wh.commands = {
	wd: {
		aliases: ["wow","wowdb"],
		parse: utils.combinator.seq(
			utils.combinate.word.or(utils.combinator.of("help")),
			utils.combinate.space.or(utils.combinator.of("")),
			utils.combinate.digits.or(utils.combinate.phrase.or(utils.combinator.of(""))),
			utils.combinate.space.or(utils.combinator.of("")),
			utils.combinate.phrase.or(utils.combinator.of("")),
			utils.combinate.space.or(utils.combinator.of("")),
			utils.combinate.phrase.or(utils.combinate.all)
		),	
		usage: "wd help",
		desc: "Get information about WoW!",
		run: (p, args, user, channel, event) => {
			subcom = args[0];
			switch(subcom){
				default:
				case "help":
					p.reply(event,"```py"+
							"\nwd get help     : Get info about an item/spell/itemset/etc."+
							"\nwd search help  : Search for an ingame item/spell/itemset/etc."+
							"\nwd auc help     : Get information about the auction-hosue of a realm."+
							"\nwd auction help : Alias for `wd auction`"+
							"\n```");
					break;
				case "search":
					search(event,args,p);
					break;
				case "get":
					get(event,args,p);
					break;
				case "auction":
				case "auc":
					auctions(event,args,p);
					break;
			}
		}
	},
	wddebug: {
		allowed: (p,user,args,event,helpReq)=>{
			return user.id == p.owner;
		},
		parse: utils.combinator.seq(utils.combinate.word.or(utils.combinator.of("help")),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.phrase.or(utils.combinate.all)),
		usage: "debug help",
		desc: "WoWDB Debug command",
		run: (p,args,user,channel,event)=>{
			subcoms={
				bitmask:{
					run: (p,args,user,channel,event)=>{
						if(isNaN(args[0]))return p.reply(event,"Arg[0] must be a bitmask.");
						givenBitmask=new Number(args[0]);
						setBits=bitmaskToArr(givenBitmask);
						finalStr="```\n";
						for(bit in setBits){
							finalStr+="\n"+bit+"("+Math.pow(2,bit-1)+")"+" is set!";
						}
						finalStr+="\n```";
						p.reply(event,finalStr);
					}
				},
				test:{
					run: (p,args,user,chanel,event)=>{
						//p.reply(event,bitmaskToArr(16392)[15]?"[DEPRECATED]":"");
					}
				}
			};
			if(args[0]=="help"||!(args[0] in subcoms)){
				subcomStr="```\nDebug SubComs:\n";
				for(subcom in subcoms){
					subcomStr+="\nwddebug "+subcom+" <args>";
				}
				subcomStr+="\n```";
				return p.reply(event,subcomStr);
			}
			if(args[0] in subcoms){
				subcoms[args[0]].run(p,args.slice(2),user,channel,event);
			}
		}
	}
} 

module.exports=wh;
