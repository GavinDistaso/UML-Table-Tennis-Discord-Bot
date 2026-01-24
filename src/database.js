const sqlite3 = require('sqlite3').verbose();
const database = new sqlite3.Database('ratings.sqlite');
const eloSystem = require('./elo');

database.serialize(()=>{
    database.exec(
        `
        CREATE TABLE IF NOT EXISTS ratings (
            userDiscordID TEXT, 
            nickname TEXT,
            ELO INTEGER,
            numMatches INTEGER
        )
        `
    )

    database.exec(
        `
        CREATE TABLE IF NOT EXISTS games (
            playerID_A TEXT, 
            playerID_B TEXT, 
            finalScoreA INTEGER,
            finalScoreB INTEGER,
            playerAEloDiff INTEGER,
            playerBEloDiff INTEGER
        )
        `
    )
})

function databaseFetchOne(query){
    return new Promise((res, rej) => {
        database.get(query, (err, row)=>{
            res(row)
        })
    })
}

function databaseFetch(query){
    return new Promise((res, rej) => {
        database.all(query, (err, rows)=>{
            res(rows)
        })
    })
}

export async function playerExists(discordID){
    const res = await databaseFetchOne(`SELECT * FROM ratings WHERE userDiscordID="${discordID}";`)

    return res != undefined;
}

export async function createPlayerEntryIfNotExist(discordID, nickname, ELO){
    if(!await playerExists(discordID)){
        database.exec(
            `
            INSERT INTO ratings (userDiscordID, nickname, ELO, numMatches) VALUES ("${discordID}", "${nickname}", ${ELO}, 0);
            `
        )
    }
}

export function setPlayerNick(discordID, nick){
    database.exec(
        `
        UPDATE ratings
        SET nickname="${nick}"
        WHERE userDiscordID="${discordID}"
        `
    );
}

export async function setPlayerELO(discordID, ELO){
    // TODO: FIX
    if(await playerExists(discordID)){
        let currentElo = (await getPlayerData(discordID))['ELO'];

        database.exec(
            `
            INSERT INTO games (playerID_A, playerID_B, finalScoreA, finalScoreB, playerAEloDiff, playerBEloDiff)
            VALUES ("${discordID}", "0", 0, 0, ${ELO - currentElo}, 0)
            `
        );
    }

    database.exec(
        `
        UPDATE ratings
        SET ELO=${ELO}
        WHERE userDiscordID="${discordID}"
        `
    );
}

export function setPlayerMatchesPlayed(discordID, matchesPlayed){
    database.exec(
        `
        UPDATE ratings
        SET numMatches=${matchesPlayed}
        WHERE userDiscordID="${discordID}"
        `
    )
}

export async function getPlayerData(discordID){
    return await databaseFetchOne(
        `
        SELECT * FROM ratings
        WHERE userDiscordID="${discordID}"
        `
    )
}

export async function getRankings() {
    return await databaseFetch(
        `
        SELECT nickname, ELO, numMatches, userDiscordID FROM ratings
        ORDER BY ELO DESC
        `
    )
}

export async function getPlayerIdByNick(nickname) {
    let res = (await databaseFetchOne(
        `
        SELECT userDiscordID FROM ratings
        WHERE nickname = "${nickname}" COLLATE NOCASE
        `
    ))

    if(res){
        return res['userDiscordID'];
    }
    else {
        return undefined;
    }
}

/* */

export async function getPlayerEloHistory(playerId){
    let gameResultsEntries = 
        await databaseFetch(
            `
            SELECT playerAEloDiff FROM games WHERE playerID_A="${playerId}"
            `
        );
    gameResultsEntries = gameResultsEntries.concat(
        await databaseFetch(
            `
            SELECT playerBEloDiff FROM games WHERE playerID_B="${playerId}"
            `
        )
    );

    let elo = (await getPlayerData(playerId))['ELO'];
    const endingElo = elo;

    const results = gameResultsEntries.reverse().map((entry)=>{
        elo -= Object.values(entry)[0];
        return elo;
    }).reverse();

    results.push(endingElo)

    return results;
}

export function getAllPlayerNicknames(){
    return ['a', 'b', 'c'];
    // return (await databaseFetch('SELECT nickname FROM ratings')).map((entry)=>{
    //     return entry['nickname'];
    // })
}

/* Game functions */

export async function reportGame(playerIdA, playerIdB, finalScoreA, finalScoreB){
    let playerA = await getPlayerData(playerIdA);
    let playerB = await getPlayerData(playerIdB);

    let matchResults = eloSystem.calculateMatchResults(
        finalScoreA, finalScoreB,
        playerA['ELO'], playerB['ELO'],
        playerA['numMatches'], playerB['numMatches']
    );


    setPlayerELO(playerIdA, matchResults.newEloA);
    setPlayerELO(playerIdB, matchResults.newEloB);

    // add entry

    database.exec(
        `
        INSERT INTO games (playerID_A, playerID_B, finalScoreA, finalScoreB, playerAEloDiff, playerBEloDiff)
        VALUES ("${playerIdA}", "${playerIdB}", ${finalScoreA}, ${finalScoreB}, ${matchResults.eloDiffA}, ${matchResults.eloDiffB})
        `
    )
    
    // update player info
    
    database.exec(
        `
        UPDATE ratings
        SET numMatches = numMatches + 1
        WHERE userDiscordID = "${playerIdA}" OR userDiscordID = "${playerIdB}"
        `
    )

    //

    return [matchResults.eloDiffA, matchResults.eloDiffB];
}
