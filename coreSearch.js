var game = newGame();
var save;
var spireIncrements = [ 8, 9, 10, 10, 10, 11, 11 ]
var spireCumulativeIncrements = [ 8, 17, 27, 37, 47, 58, 69 ]
var spireToClear = 0;

document.getElementById("saveInput").addEventListener("paste", (event) => {
	onSavePaste(event);
});

document.getElementById("coreSearchButton").addEventListener("click", (event) => {
	generateNext10Cores(spireToClear, !!document.getElementById("onlyShowPerfectCores").checked);
});

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

function generateNext10Cores(spire, onlyShowPerfect) {
	//Spire is passed as the int value of the spire to be cleared
	
	//Set the seed from the save so if the user presses the button a bunch of times it still generates the right cores
	game.global.coreSeed = save.global.coreSeed;
	
	let core;
	let numAhead = 0;
	let numFound = 0;
	let display = true;
	let keepSearching = true;
	
	
	while (keepSearching) {
		//If clearing above spire I need to increment the seed for the previous spires cleared before this one each running
		//Easier to just up the seed than actually generate and throw out the cores.
		
		//game.global.coreSeed += spireCumulativeIncrements[spire-1];
		
		console.log(game.global.coreSeed);
		
		for (let j = 1; j < spire; j++) {
			//console.log("generating core for spire " + j);
			createHeirloom(j*100 + 100, false, true);
		}
		
		createHeirloom(spire*100 + 100, false, true);
		core = game.global.heirloomsExtra[game.global.heirloomsExtra.length-1];
		
		if (onlyShowPerfect) {
			display = isCorePerfect(core);
		} else {
			display = true;
		}
		
		if (display) {
			document.getElementById('core'+numFound).innerText = (numAhead + 1) + " ahead" + "\n" + coreToString(core);
			numFound++;
		}
		
		numAhead++;
		
		if (!onlyShowPerfect && numAhead >= 10) {
			keepSearching = false;
		} else if (onlyShowPerfect && numFound >= 10) {
			keepSearching = false;
		}
		
	}
	
	game.global.heirloomsExtra = [];
		
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