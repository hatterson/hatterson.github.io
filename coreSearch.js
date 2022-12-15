var game = newGame();
var save;
var spireIncrements = [ 8, 9, 10, 10, 10, 11, 11 ]
var spireCumulativeIncrements = [ 8, 17, 27, 37, 47, 58, 69 ]
var spireToClear = 0;
var requiredMods = [];
var maxZone;
var filter;

document.getElementById("saveInput").addEventListener("paste", (event) => {
	onSavePaste(event);
});

document.getElementById("coreSearchButton").addEventListener("click", (event) => {
	generateNext10Cores(spireToClear, !!document.getElementById("filterCores").checked);
});

document.getElementById("filterCores").addEventListener("change", (event) => {
	showFilter(event);	
});

document.getElementById("runFinderButton").addEventListener("click", (event) => {
	GenerateRunOulineForMatchingCore();
});

function showFilter(event) {
	filter = !!document.getElementById("filterCores").checked
	if (filter) {
		buildModsChecksAndTexts();
		document.getElementById("modifiers").removeAttribute("hidden")
	} else {
		document.getElementById("modifiers").setAttribute("hidden", true)
	}
}

function setSpireToClear(value) {
	spireToClear = value;
}

function onSavePaste(event) {
	let paste = event.clipboardData.getData("text");
	save = JSON.parse(LZString.decompressFromBase64(paste));
	
	game.global.coreSeed = save.global.coreSeed;
	
	// prevents some code that won't work from running
	game.stats.totalHeirlooms.value = 1
}

function buildRequiredMods() {
	requiredMods = [];
	
	let type = "Core"
	let eligible = [];
	let ele;
	let ele2;
	for (let item in game.heirlooms[type]){
		eligible.push(item);
	}
	
	//Check each to see if they're checked
	
	for (let i = 0; i < eligible.length; i++){
		ele = document.getElementById("checkbox" + i);
		ele2 = document.getElementById("requiredValue" + i);
		if (ele.checked && ele2.value > 0) {
			requiredMods.push([ele.value, ele2.value]);
		}
	}
	
}

function buildModsChecksAndTexts() {
	
	//get list of eligible mods
	let type = "Core"
	let eligible = [];
	for (let item in game.heirlooms[type]){
		eligible.push(item);
	}	
	
	let ele = document.getElementById("modifiers")
	ele.innerHTML = ""
	for (let i = 0; i < eligible.length; i++){
		ele.innerHTML += '<input type="checkbox" id=checkbox' + i + ' value="' + eligible[i] + '">' + eligible[i] +'&nbsp;' + '<input type="text" id=requiredValue' + i + '>' + '&nbsp;'
		
	}
}

function GenerateRunOulineForMatchingCore() {

	document.getElementById("RunOutput").innerHTML = "";

	game.global.coreSeed = save.global.coreSeed;

	clearCoreDisplay();

	let runs = findRunsForNextGoodCore();

	if (runs.length == 0) {
		//Couldn't find any
		document.getElementById("RunOutput").innerHTML = "Could not find any matching cores within 10000 seeds (~144 spire 7 clears). Try different required mods.";
	} else {
		let core = game.global.heirloomsExtra[game.global.heirloomsExtra.length-1];
		game.global.heirloomsExtra = [];
		//This is the core that will return, put it in slot 1

		document.getElementById("RunOutput").innerHTML = "";
		for (let i = 0; i < runs.length - 1; i++ ) {
			document.getElementById("RunOutput").innerHTML += "Run " + runs[i] + " completion(s) of spire ";
			for (let j = 0; j<i; j++) {
				document.getElementById("RunOutput").innerHTML += (j+1) + " + ";
			} 
			document.getElementById("RunOutput").innerHTML += (i+1);
			
			document.getElementById("RunOutput").innerHTML += "<br>";
		}
		document.getElementById("RunOutput").innerHTML += "Then you will be on track to earn the following core:";

		document.getElementById('core0').innerText += (runs[runs.length - 1] + 1) + " ahead" + "\n" + coreToString(core);
	}
	
}

function clearCoreDisplay() {
	document.getElementById("RunOutput").innerHTML = "";
	for (let i = 0; i<10; i++) {
		document.getElementById('core'+i).innerText = "";
	}
}

function generateNext10Cores(spire, requireMods) {
	//Spire is passed as the int value of the spire to be cleared
	
	//Set the seed from the save so if the user presses the button a bunch of times it still generates the right cores
	game.global.coreSeed = save.global.coreSeed;

	clearCoreDisplay();
	
	let core;
	let numAhead = 0;
	let numFound = 0;
	let display = true;
	let keepSearching = true;
	
	if (requireMods) {
		buildRequiredMods();
	}
	
	
	while (keepSearching) {
		//If clearing above spire I need to increment the seed for the previous spires cleared before this one each running
		//Easier to just up the seed than actually generate and throw out the cores.
		
		if (spire > 1) {
			game.global.coreSeed += spireCumulativeIncrements[spire-2];
		}
		
		//for (let j = 1; j < spire; j++) {
			//console.log("generating core for spire " + j);
			//createHeirloom(j*100 + 100, false, true);
		//}
		
		createHeirloom(spire*100 + 100, false, true);
		core = game.global.heirloomsExtra[game.global.heirloomsExtra.length-1];
		
		if (requireMods) {
			display = shouldKeepCore(core);
		} else {
			display = true;
		}
		
		if (display) {
			document.getElementById('core'+numFound).innerText = (numAhead + 1) + " ahead" + "\n" + coreToString(core);
			numFound++;
		}
		
		numAhead++;
		
		if (!requireMods && numAhead >= 10) {
			keepSearching = false;
		} else if (requireMods && numFound >= 10) {
			keepSearching = false;
		} else if (numAhead >= 100) {
			keepSearching = false;
		}
		
	}
	
	game.global.heirloomsExtra = [];
		
}

function shouldKeepCore(core) {
	let keep = true;
	
	let match = false;
	
	for (let i = 0; i < requiredMods.length; i++) {
		//Verify each required mod is present to the required level
		match = false;
		for (let j = 0; j < core.mods.length; j++){
			if (core.mods[j][0] == requiredMods[i][0]) {
				if (core.mods[j][1] >= requiredMods[i][1]) {
					match = true;
					break;
				}
			}
		}
		
		if (!match) { 
			keep = false;
			break;
		}
	}
	
	return keep;
}

function isCorePerfect(core) {
	let perfect = true;
	
	for (let i = 0; i < core.mods.length; i++){
		if (core.mods[i][0] != "condenserEffect"
			&& core.mods[i][0] != "lightningTrap"
			&& core.mods[i][0] != "poisonTrap"
			&& core.mods[i][0] != "runestones")
		{
				//nonperfect mod
			perfect = false;
		}
	}
	
	return  perfect;
}

function coreToString(core){
	let text = ""
	text += core.name + "\n"
	
	let modName = "";
	let modPercent = "";
	
	for (let i = 0; i < core.mods.length; i++){
		modName = game.heirlooms[core.type][core.mods[i][0]].name
		modPercent = core.mods[i][1]
		text += modPercent + "% " + modName + "\n"	
	}		
	return text
}

function findRunsForNextGoodCore() {
	let nextSeedOffset = getSeedOffsetNeeded(save.global.coreSeed, 7);
	
	if (nextSeedOffset == -1) {
		return [];
	}

	let runs = getRunsNeededToMatchSeed(nextSeedOffset);
	
	while (runs.length == 0 && nextSeedOffset < 10000) {
		nextSeedOffset = getSeedOffsetNeeded(save.global.coreSeed + nextSeedOffset + 1, 7);

		if (nextSeedOffset == -1) {
			runs = [];
			break;
		}

		runs = getRunsNeededToMatchSeed(nextSeedOffset);
	}

	return runs;
	
}

function getRunsNeededToMatchSeed(newSeedOffset) {
	//There is 100% a good way to solve this.
	//This isn't it
	
	//May need to limit this, but the break when this would take us past the seed below should prevent insane calculations..
	let maxRuns = 100;
	
	if (newSeedOffset % spireCumulativeIncrements[6] == 0) {
		//We're on the path if we portal now
		return [ 0,0,0,0,0,0, newSeedOffset /  spireCumulativeIncrements[6]];
	}

	//Maximize the number of spire 7 runs. To do this we'll start with the mod of the new seed against a full run and see if
	//we can match that. If we can't, we slowly add in one copy of a full run until we can get a result

	for (let stepNum = Math.floor(newSeedOffset / spireCumulativeIncrements[6]); stepNum > 0; stepNum-- ) {
		
		let tmpSeedOffest = newSeedOffset - spireCumulativeIncrements[6] * stepNum;

		let runCounts = [];
		let tmpValue = 0
	
		for (let i = 0; i < maxRuns; i++) {
		
			if ((spireCumulativeIncrements[0] * i) > tmpSeedOffest) {
				//We can't fit in this many runs, so break out
				break;
			}
		
			for (let j = 0; j < maxRuns; j++) {
			
				if (((spireCumulativeIncrements[0] * i)
					+ (spireCumulativeIncrements[1] * j))
					> tmpSeedOffest)
				{
					break;
				}
			
				for (let k = 0; k < maxRuns; k++) {
				
					if (((spireCumulativeIncrements[0] * i)
						+ (spireCumulativeIncrements[1] * j)
						+ (spireCumulativeIncrements[2] * k))
						> tmpSeedOffest)
					{
						break;
					}
				
					for (let l=0; l < maxRuns; l++) {
					
						if (((spireCumulativeIncrements[0] * i)
							+ (spireCumulativeIncrements[1] * j)
							+ (spireCumulativeIncrements[2] * k)
							+ (spireCumulativeIncrements[3] * l))
							> tmpSeedOffest)
						{
							break;
						}
					
						for (let m=0; m < maxRuns; m++) { 
					
							if (((spireCumulativeIncrements[0] * i)
								+ (spireCumulativeIncrements[1] * j)
								+ (spireCumulativeIncrements[2] * k)
								+ (spireCumulativeIncrements[3] * l)
								+ (spireCumulativeIncrements[4] * m))
								> tmpSeedOffest)
							{
								break;
							}
					
							for (let n=0; n < maxRuns; n++) {
							
								if (((spireCumulativeIncrements[0] * i)
									+ (spireCumulativeIncrements[1] * j)
									+ (spireCumulativeIncrements[2] * k)
									+ (spireCumulativeIncrements[3] * l)
									+ (spireCumulativeIncrements[4] * m)
									+ (spireCumulativeIncrements[5] * n))
									> tmpSeedOffest)
								{
									break;
								}
							
							
								tmpValue = tmpSeedOffest
									- (spireCumulativeIncrements[0] * i) 
									- (spireCumulativeIncrements[1] * j) 
									- (spireCumulativeIncrements[2] * k) 
									- (spireCumulativeIncrements[3] * l) 
									- (spireCumulativeIncrements[4] * m) 
									- (spireCumulativeIncrements[5] * n);
								if (tmpValue % spireCumulativeIncrements[6] == 0)
								{
									return [ i, j, k, l, m, n, stepNum ];
								}
							}
						}
					}
				}
			}
		}
	}
	
	return [];
}

function getSeedOffsetNeeded(baseSeed, spire) {
	let nextSeed = getSeedOfNextMatchingCore(baseSeed, spire);

	//Means we can't find one
	if (nextSeed == -1) 
		return -1;
	
	return nextSeed - save.global.coreSeed - spireCumulativeIncrements[5];
}

function getSeedOfNextMatchingCore(currentSeed, spire) {
	//check when the next heirloom would be get generated.
	
	buildRequiredMods();
	
	let goodSeed = -1;
	
	//Start checking at next possible seed
	let startingSeed = currentSeed + spireCumulativeIncrements[5];
	
	//Check each seed for the next 10000 (~144 full runs)
	for (let i = startingSeed; i < startingSeed + 10000; i++) {
		game.global.coreSeed = i;	
		createHeirloom(spire*100 + 100, false, true);
		core = game.global.heirloomsExtra[game.global.heirloomsExtra.length-1];
		
		if (shouldKeepCore(core)) {
			//console.log(coreToString(core));
			goodSeed = i;
			break;
		}
		game.global.heirloomsExtra = [];
		
	}
	
	
	return goodSeed;
	
}

//Functions taken from trimps.github.io main.js on 12/11/2022

function seededRandom(seed){
	var x = Math.sin(seed++) * 10000;
	return parseFloat((x - Math.floor(x)).toFixed(7));
}

function getRandomIntSeeded(seed, minIncl, maxExcl) {
	var toReturn = Math.floor(seededRandom(seed) * (maxExcl - minIncl)) + minIncl;
	return (toReturn === maxExcl) ? minIncl : toReturn;
}

function getRandomBySteps(steps, mod, seed){
		if (mod && typeof mod[4] !== 'undefined'){
			seed = mod[4]++;
		}
		var possible = ((steps[1] - steps[0]) / steps[2]);
		var roll = getRandomIntSeeded(seed, 0, possible + 1);
		var result = steps[0] + (roll * steps[2]);
		result = Math.round(result * 100) / 100;
		return ([result, Math.round(possible - roll)]);
}

function createHeirloom(zone, fromBones, spireCore, forceBest){
	var slots = game.heirlooms.slots;
	var rarityNames = game.heirlooms.rarityNames;
	//Determine Type
	var seed = (fromBones) ? game.global.heirloomBoneSeed : game.global.heirloomSeed;
	if (forceBest) seed = game.global.bestHeirloomSeed;
	var type;
	var rarity;
	if (spireCore){
		type = "Core";
		rarity = Math.round((zone - 200) / 100);
		if (rarity > 6) rarity = 6;
		if (rarity < 0) rarity = 0;
		game.stats.coresFound.value++;
		seed = game.global.coreSeed;
	}
	else{
		type = (getRandomIntSeeded(seed++, 0, 2) == 0) ? "Shield" : "Staff";
		//Determine type rarity
		rarity = getHeirloomRarity(zone, seed++, fromBones, forceBest);
	}
	//Sort through modifiers and build a list of eligible items. Check filters if applicable
	var eligible = [];
	for (var item in game.heirlooms[type]){
		var heirloom = game.heirlooms[type][item];
		if (item == "empty" && (rarity == 0 || rarity == 1)) continue;
		if (typeof heirloom.filter !== 'undefined' && !heirloom.filter()) continue;
		if (heirloom.steps && heirloom.steps[rarity] === -1) continue;
		eligible.push(item);
	}

	slots = slots[rarity];
	var name = rarityNames[rarity] + " " + type;
	//Heirloom configuration
	//{name: "", type: "", rarity: #, mods: [[ModName, value, createdStepsFromCap, upgradesPurchased, seed]]}
	var buildHeirloom = {id: (game.stats.totalHeirlooms.valueTotal + game.stats.totalHeirlooms.value), nuMod: 1, name: name, type: type, repSeed: getRandomIntSeeded(seed++, 1, 10e6), rarity: rarity, mods: []};
	buildHeirloom.icon = ((type == "Core") ? 'adjust' : (type == "Shield") ? '*shield3' : 'grain')
	var x = 0;
	if (!game.heirlooms.canReplaceMods[rarity]){
		x++;
		buildHeirloom.mods.push(["empty", 0, 0, 0, getRandomIntSeeded(seed++, 0, 1000)]);
	}
	for (x; x < slots; x++){
		var roll = getRandomIntSeeded(seed++, 0, eligible.length);
		var thisMod = eligible[roll];
		eligible.splice(roll, 1);
		var steps = (typeof game.heirlooms[type][thisMod].steps !== 'undefined') ? game.heirlooms[type][thisMod].steps : game.heirlooms.defaultSteps;
		steps = getRandomBySteps(steps[rarity], null, seed++);
		buildHeirloom.mods.push([thisMod, steps[0], steps[1], 0, getRandomIntSeeded(seed++, 0, 1000)]);
	}
	seed += 6 - (x * 2);
	buildHeirloom.mods.sort(function(a, b){
		a = a[0].toLowerCase();
		b = b[0].toLowerCase();
		if (a == "empty") return 1;
		if (b == "empty" || b > a) return -1;
		return a > b
	})
	if (game.global.challengeActive == "Daily" && !fromBones){
		buildHeirloom.nuMod *= (1 + (getDailyHeliumValue(countDailyWeight()) / 100));
	}
	//Not used in cores
	//if (autoBattle.oneTimers.Nullicious.owned && game.global.universe == 2) buildHeirloom.nuMod *= autoBattle.oneTimers.Nullicious.getMult();
	//if (game.global.universe == 2 && u2Mutations.tree.Nullifium.purchased) buildHeirloom.nuMod *= 1.1;
	game.global.heirloomsExtra.push(buildHeirloom);
	//Don't display
	//displaySelectedHeirloom(false, 0, false, "heirloomsExtra", game.global.heirloomsExtra.length - 1, true);
	//if ((game.stats.totalHeirlooms.value + game.stats.totalHeirlooms.valueTotal) == 0) document.getElementById("heirloomBtnContainer").style.display = "block";
	game.stats.totalHeirlooms.value++;
	//checkAchieve("totalHeirlooms");
	//if (heirloomsShown) displayExtraHeirlooms();
	if (spireCore) game.global.coreSeed = seed;
	else if (fromBones) game.global.heirloomBoneSeed = seed;
	else if (forceBest) game.global.bestHeirloomSeed = seed;
	else game.global.heirloomSeed = seed;
}