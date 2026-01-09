export function calculateKValue(gamesPlayed){
    let K = 45 / (1 + (gamesPlayed / 10));

    return K;
}

export function calculatePlayerExpectedWinChance(playerAElo, playerBElo){
    let playerAExpectedWinPercent = 1.0 / (1 + Math.pow(10, (playerBElo - playerAElo) / 400));
    return [playerAExpectedWinPercent, 1.0 - playerAExpectedWinPercent];
}

export function calculatedAdjustedElo(elo, KValue, scoreValue, expectedWinPercent){
    let newElo = Math.round(elo + KValue * (scoreValue - expectedWinPercent));
    return newElo;
}

export function calculateMatchResults(finalScoreA, finalScoreB, EloA, EloB, numMatchesA, numMatchesB){
    let playerAWin = (finalScoreA > finalScoreB) ? 1 : ((finalScoreB > finalScoreA) ? 0 : 0.5);
    let playerBWin = 1 - playerAWin;

    let [playerAExpectedWinPercent, playerBExpectedWinPercent] = calculatePlayerExpectedWinChance(EloA, EloB);

    let Ka = calculateKValue(numMatchesA);
    let Kb = calculateKValue(numMatchesB);

    let playerANewRating = calculatedAdjustedElo(EloA, Ka, playerAWin, playerAExpectedWinPercent);
    let playerBNewRating = calculatedAdjustedElo(EloB, Kb, playerBWin, playerBExpectedWinPercent);

    let playerADiff = playerANewRating - EloA;
    let playerBDiff = playerBNewRating - EloB;

    return {
        newEloA: playerANewRating,
        newEloB: playerBNewRating,
        eloDiffA: playerADiff,
        eloDiffB: playerBDiff,
    }
}
