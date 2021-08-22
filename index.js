// parse URL, get querystring league value

// fn()s

/**
 * 
 */
function getLeague() {
    league = parseURL(window.location).searchObject.league

    if (!league) { league = "Standard" }

    document.getElementById('league').innerHTML = decodeURIComponent(league);

    return league;
}

/**
 * @source https://www.abeautifulsite.net/parsing-urls-in-javascript
 * @param {*} url string
 */
function parseURL(url) {
    var parser = document.createElement('a'),
        searchObject = {},
        queries, split, i;
    // Let the browser do the work
    parser.href = url;
    // Convert query string to object
    queries = parser.search.replace(/^\?/, '').split('&');
    for (i = 0; i < queries.length; i++) {
        split = queries[i].split('=');
        searchObject[split[0]] = split[1];
    }

    return {
        protocol: parser.protocol,
        host: parser.host,
        hostname: parser.hostname,
        port: parser.port,
        pathname: parser.pathname,
        search: parser.search,
        searchObject: searchObject,
        hash: parser.hash
    };
}

/**
 * 
 */
function PollTradeSite(baseUrl, league, itemName) {
    return new Promise(resolve =>
        setTimeout(async function () {
            returnData = {}
            url = baseUrl + 'search/' + league;
            body = JSON.stringify({
                "query": {
                  "status": {
                    "option": "online"
                  },
                  "name": itemName,
                  "filters": {
                    "misc_filters": {
                      "filters": {
                        "corrupted": {
                          "option": "false"
                        }
                      },
                      "disabled": false
                    }
                  }
                },
                "sort": {
                  "price": "asc"
                }
            })

            itemData = await searchItem(url, body);
            console.log (itemData)

            try {
                itemMarketData = await getItemMarketData(baseUrl, itemData.id, itemData.result[0])
            } catch (err) {
                console.log(err);
            }

            itemMarketInstanceData = await extractDesiredItemData_v2(itemMarketData)

            returnData = {
                "name": itemName,
                "currency": itemMarketInstanceData.currency,
                "amount": itemMarketInstanceData.amount,
                "wiki_url": "https://pathofexile.gamepedia.com/" + encodeURIComponent(itemName),
                "trade_url": "https://www.pathofexile.com/trade/search/" + encodeURIComponent(league) + "/" + itemData.id
            }

            resolve(returnData)
        }, timer += 5000)
    );
}

/**
 * 
 * @param {*} data string
 */
function currencyConverter(data) {
    returnData = data;

    // keep this first check as chaos is the default
    if (data.currency == "chaos") {
    } else if (data.currency == "exa") {
        returnData.amount = (data.amount * 100)
    } else {
        returnData.amount = 0.1
    }

    return returnData;
}

/**
 * 
 * @param {*} rowData array
 */
function calProfit(rowData) {
    returnData = { 'profit': 0 }
    if (rowData[2].amount > 0 && rowData[1].amount > 0 && rowData[0].amount > 0) {
        returnData = { 'profit': Math.round(rowData[2].amount - rowData[1].amount - rowData[0].amount) }
    }

    return returnData;
}

/**
 * source: https://www.w3schools.com/jsref/met_node_appendchild.asp
 * @param {*} data string
 */
async function printToDom(data, elem_id = 'data') {

    var node = document.createElement("span");
    var textnode = document.createTextNode(data);
    node.appendChild(textnode);
    document.getElementById(elem_id).appendChild(node);
}

/**
 * 
 * @param {*} url string
 * @param {*} body string
 * @return promise
 */
async function searchItem(url, body) {
    return fetch(url, {
        method: 'post',
        body: body,
        headers: { 'Content-Type': 'application/json' },
    })
        .then((response) => response.json())
        .then((data) => {
            return data;
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

/**
 * Example URL: https://www.pathofexile.com/api/trade/fetch/c84fa4b129d5271cf8b8bc4b736688bbe149830fed0086d80f508f778917077d?query=WqmMQzTm
 * 
 * @param {*} baseUrl string
 * @param {*} item_id string
 * @param {*} item_instance_id string
 * @return promise
 */
async function getItemMarketData(baseUrl, item_id, item_instance_id) {
    return fetch(baseUrl + 'fetch/' + item_instance_id + '?query=' + item_id, {
        method: 'get'
    })
        .then((response) => response.json())
        .then((data) => {
            return data;
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

/**
 * 
 * @param {*} data JSON
 */
async function extractDesiredItemData(data) {
    returnData = {};
    returnData.amount = data.result[0].listing.price.amount
    returnData.currency = data.result[0].listing.price.currency;
    returnData.id = data.result[0].item.id;
    return returnData;
}

/**
 * 
 * @param {*} data JSON
 */
async function extractDesiredItemData_v2(data) {

    returnData = {};
    if (data.result[0].listing.price) {
        returnData.amount = data.result[0].listing.price.amount
        returnData.currency = data.result[0].listing.price.currency
        returnData.id = data.result[0].item.id
    } else {
        returnData = {
            "amount": 0,
            "currency": "NA",
            "id": "NA"
        }
    }

    return returnData;
}

function tableRowFromJson(data) {
    // https://www.encodedna.com/javascript/populate-json-data-to-html-table-using-javascript.htm

    // u/CoqeCase: This is your return element
    var tr = document.createElement('tr');                // table row.

    var tabItemZeroName = tr.insertCell(-1);
    tabItemZeroName.innerHTML = "<a href=\"" + data[0].wiki_url + "\">" + data[0].name + "</a>";
    var tabItemZeroAmount = tr.insertCell(-1);
    tabItemZeroAmount.innerHTML = data[0].amount
    var tabItemZeroTrade = tr.insertCell(-1);
    tabItemZeroTrade.innerHTML = "<a href=\"" + data[0].trade_url + "\">Trade</a>";

    var tabItemTwoName = tr.insertCell(-1);
    tabItemTwoName.innerHTML = "<a href=\"" + data[1].wiki_url + "\">" + data[1].name + "</a>";
    var tabItemOneAmount = tr.insertCell(-1);
    tabItemOneAmount.innerHTML = data[1].amount
    var tabItemOneTrade = tr.insertCell(-1);
    tabItemOneTrade.innerHTML = "<a href=\"" + data[1].trade_url + "\">Trade</a>";

    var tabItemTwoName = tr.insertCell(-1);
    tabItemTwoName.innerHTML = "<a href=\"" + data[2].wiki_url + "\">" + data[2].name + "</a>";
    var tabItemTwoAmount = tr.insertCell(-1);
    tabItemTwoAmount.innerHTML = data[2].amount
    var tabItemTwoTrade = tr.insertCell(-1);
    tabItemTwoTrade.innerHTML = "<a href=\"" + data[2].trade_url + "\">Trade</a>";

    var tabProfit = tr.insertCell(-1);
    tabProfit.innerHTML = data[3];
    var tabRegion = tr.insertCell(-1);
    tabRegion.innerHTML = data[4];
    var tabMap = tr.insertCell(-1);
    tabMap.innerHTML = data[5];

    return tr;
}

// vars

var baseUrl = "https://www.pathofexile.com/api/trade/"
var CompleteTable = [
    ["Fire and Ice", "Hrimsorrow", "Hrimburn", "Act 1", "Tidal Island"],
    ["The Snuffed Flame", "Kaltenhalt", "Kaltensoul", "Act 1", "Lower Prison"],
    ["Heavy Blows", "Craghead", "Cragfall", "Act 2", "The Old Fields"],
    ["Ancient Doom", "Doomfletch", "Doomfletch's Prism", "Act 2", "Ancient Pyramid"],
    ["Winter's Mournful Melodies", "Hrimnor's Hymn", "Hrimnor's Dirge", "Act 2", "The Fellshrine Ruins"],
    ["The Beginning and the End", "Realmshaper", "Realm Ender", "Act 2", "The Crypt Level 2"],
    ["The Silverwood", "Silverbranch", "Silverbough", "Act 2", "Riverways"],
    ["Nature's Resilience", "Springleaf", "The Oak", "Act 2", "Southern Forest"],
    ["The Servant's Heart", "Storm Cloud", "The Tempest", "Act 2", "Chamber of Sins"],
    ["Dying Cry", "Deidbell", "Deidbellow", "Act 3", "The Ebony Barracks"],
    ["Trapped in the Tower", "Fencoil", "Mirebough", "Act 3", "The Sceptre of God"],
    ["Fire and Brimstone", "Blackgleam", "The Signal Fire", "Act 3", "The Crematorium"],
    ["Power Magnified", "Reverberation Rod", "Amplification Rod", "Act 3", "The Lunaris Temple Level 2"],
    ["The Bowstring's Music", "Death's Harp", "Death's Opus", "Act 4", "Dried Lake"],
    ["Agony at Dusk", "Dusktoe", "Duskblight", "Act 4", "Maligaro @ The Harvest"],
    ["The King's Path", "Kaom's Sign", "Kaom's Way", "Act 4", "Kaom's Stronghold"],
    ["A Forest of False Idols", "Araku Tiki", "Ngamahu Tiki", "Act 4", "Kaom's Dream"],
    ["The Misunderstood Queen", "Queen's Decree", "Queen's Escape", "Act 4", "The Belly of the Beast"],
    ["The Flow of Energy", "Shavronne's Pace", "Shavronne's Gambit", "Act 4", "The Harvest"],
    ["Severed Limbs", "Limbsplit", "The Cauteriser", "Act 4", "The Mines Level 2"],
    ["The Apex Predator", "The Screaming Eagle", "The Gryphon", "Act 4", "Aqueduct"],
    ["Mouth of Horrors", "Chalice of Horrors", "Thirst for Horrors", "Act 4", "The Harvest"],
    ["The King and the Brambles", "Bramblejack", "Wall of Brambles", "Act 4", "Grand Arena"],
    ["A Dishonourable Death", "Hyrri's Bite", "Hyrri's Demise", "Act 6", "The Mud Flats"],
    ["End of the Light", "Icetomb", "Crystal Vault", "Act 6", "The Brine King's Reef"],
    ["Dark Instincts", "Foxshade", "Fox's Fortune", "Act 7", "The Temple of Decay Level 2"],
    ["The Bloody Flowers Redux", "Ezomyte Peak", "Ezomyte Hold", "Act 8", "Grain Gate"],
    ["The Karui Rebellion", "Karui Ward", "Karui Charge", "Act 8", "The Grain Gate"],
    ["Sun's Punishment", "Sundance", "Sunspite", "Act 8", "The Solaris Temple Level 2"],
    ["The Great Mind of the North", "The Magnate", "The Tactician", "Act 8", "The Bath House"],
    ["Song of the Sekhema", "Asenath's Mark", "Asenath's Chant", "Act 9", "The Quarry"],
    ["The Great Leader of the North", "The Magnate", "The Nomad", "Act 9", "The Foothills"],
    ["Blind Faith", "The Ignomon", "The Effigon", "T01", "Haunted Mansion"],
    ["Cold Blooded Fury", "Bloodboil", "Winterweave", "T02", "Beach Map"],
    ["Faith Exhumed", "Chober Chaber", "Chaber Cairn", "T02", "Mausoleum Map"],
    ["The Bishop's Legacy", "Geofri's Crest", "Geofri's Legacy", "T02", "Cursed Crypt Map"],
    ["Last of the Wildmen", "Briskwrap", "Wildwrap", "T02", "Strand"],
    ["Cold Greed", "Cameria's Maul", "Cameria's Avarice", "T02", "Waterways"],
    ["Battle Hardened", "Iron Heart", "The Iron Fortress", "T02", "Colonnade"],
    ["Blinding Light", "Eclipse Solaris", "Corona Solaris", "T03", "Temple Map"],
    ["The Dreaded Rhoa", "Redbeak", "Dreadbeak", "T03", "Bog Map"],
    ["Greed's Folly", "Wondertrap", "Greedtrap", "T03", "Vault Map"],
    ["Dance of Steel", "The Dancing Dervish", "The Dancing Duo", "T03", "Arsenal"],
    ["The Storm Spire", "The Stormheart", "The Stormwall", "T03", "Plateau Map"],
    ["The Mentor", "Matua Tupuna", "Whakatutuki o Matua", "T05", "Basilica Map"],
    ["Darktongue's Shriek", "Windscream", "Windshriek", "T06", "Sepulchre Map"],
    ["Black Devotion", "Geofri's Baptism", "Geofri's Devotion", "T09", "Relic Chambers Map"],
    ["The Fall of an Empire", "Quecholli", "Panquetzaliztli", "T09", "Maze Map"],
    ["Burning Dread", "Dreadarc", "Dreadsurge", "T09", "Shrine Map"],
    ["The Nightmare Awakens", "Malachai's Simula", "Malachai's Awakening", "T11", "Core"],
    ["Pleasure and Pain", "Crown of Thorns", "Martyr's Crown", "T11", "Core Map"],
    ["From The Void", "Blackheart", "Voidheart", "T14", "Beyond Demon"],
    ["A Rift in Time", "Timeclasp", "Timetwist", "T14", "Laboratory Map"],
    ["The Malevolent Witch", "Doedre's Tenure", "Doedre's Malevolence", "T14", "Phantasmagoria Map"],
    ["A Vision of Ice and Fire", "Heatshiver", "Frostferno", "T14", "Estuary Map"],
    ["Crimson Hues", "Goredrill", "Sanguine Gambol", "T15", "Overgrown Ruin Map"],
    ["The Queen's Sacrifice", "Atziri's Mirror", "Atziri's Reflection", "Uber", "The Alluring Abyss"]
]
var outputData = []
var RowNumber = 0
var DisplayCounter = 1

// core logic

/**
 * page has loaded and is ready
 */
window.onload = function () {
    league = getLeague()
    timer = 0;

    const cont = document.querySelector('#showData')
    // Create a table.
    var table = document.createElement("table");

    var myCol = [
        'Prophecy', 'Amount', 'Trade',
        'Ingredient', 'Amount', 'Trade',
        'Result', 'Amount', 'Trade',
        'Profit', 'Region', 'Map'
    ];

    // Create table header row using the extracted headers above.
    var tr = table.insertRow(-1);                   // table row.

    // first row of data is expected to be table header row
    for (var i = 0; i < myCol.length; i++) {
        var th = document.createElement("th");      // table header.
        th.innerHTML = myCol[i];
        tr.appendChild(th);
    }

    cont.appendChild(table);

    // loop each row
    CompleteTable.forEach(async function (RowArray, RowNumber) {
        const outputData = [];
        outputData[RowNumber] = [];
        const Item1 = RowArray[0];
        const Item2 = RowArray[1];
        const Item3 = RowArray[2];
        const Region = RowArray[3];
        const Map = RowArray[4];

        const tr = await GatherInfoAsync(Item1, Item2, Item3, Region, Map, RowNumber);

        table.appendChild(tr);
    });

};

async function GatherInfoAsync(Item1, Item2, Item3, Region, Map, RowNumber) {
    const Item1Test = await PollTradeSite(baseUrl, league, Item1).then((data) => { return currencyConverter(data) })
    printToDom(RowNumber + "..", 'prophecies')

    const Item2Test = await PollTradeSite(baseUrl, league, Item2).then((data) => { return currencyConverter(data) })
    printToDom(RowNumber + "..", 'sacrifices')

    const Item3Test = await PollTradeSite(baseUrl, league, Item3).then((data) => { return currencyConverter(data) })
    printToDom(RowNumber + "..", 'results')

    const RowCalc = [Item1Test, Item2Test, Item3Test]
    RowCalc.push = calProfit(RowCalc)

    const ToPrint = [Item1Test, Item2Test, Item3Test, RowCalc.push.profit, Region, Map]
    DisplayCounter++

    // u/CoqeCase: tableRowFromJson returns a <tr>, and then we return that back to the forEach in onload.
    return tableRowFromJson(ToPrint);
}