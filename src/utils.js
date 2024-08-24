import {
  updateFinalTeams,
  updateSemifinalTeams,
  updateTournament,
} from "./supabaseFunctions";

// src/utils.js
export const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const sortMatches = (matches) => {
  return matches.sort((a, b) => a.matchDay - b.matchDay);
};

export const calculateSemiFinalists = (matches) => {
  const quarterFinals = matches.filter((match) =>
    match.matchName.startsWith("QF")
  );
  const semiFinalists = [];

  for (let i = 1; i <= 4; i++) {
    const qfMatches = quarterFinals.filter(
      (match) => match.matchName === `QF${i}`
    );

    if (qfMatches.length !== 2) {
      console.error(`Incomplete data for QF${i}`);
      continue;
    }

    // Assigning teamOne and teamTwo based on the first match
    const teamOne = qfMatches[0].homeTeam;
    const teamTwo = qfMatches[0].awayTeam;

    let teamOneTotalGoals = 0;
    let teamTwoTotalGoals = 0;
    let teamOneAwayGoals = 0;
    let teamTwoAwayGoals = 0;

    qfMatches.forEach((match) => {
      const { homeTeam, homeScore, awayScore } = match;

      // Ensure scores are numbers
      const homeScoreNum = Number(homeScore);
      const awayScoreNum = Number(awayScore);

      if (homeTeam === teamOne) {
        teamOneTotalGoals += homeScoreNum;
        teamTwoTotalGoals += awayScoreNum;
        teamTwoAwayGoals += awayScoreNum;
      } else {
        teamOneTotalGoals += awayScoreNum;
        teamTwoTotalGoals += homeScoreNum;
        teamOneAwayGoals += awayScoreNum; // Changed from homeScoreNum to awayScoreNum
      }
    });

    let winner;
    if (teamOneTotalGoals > teamTwoTotalGoals) {
      winner = teamOne;
      console.log(
        `QF${i}: ${teamOne} wins with total goals ${teamOneTotalGoals} vs ${teamTwoTotalGoals}`
      );
    } else if (teamTwoTotalGoals > teamOneTotalGoals) {
      winner = teamTwo;
      console.log(
        `QF${i}: ${teamTwo} wins with total goals ${teamTwoTotalGoals} vs ${teamOneTotalGoals}`
      );
    } else {
      // If total goals are equal, apply the away goals rule
      if (teamTwoAwayGoals > teamOneAwayGoals) {
        winner = teamTwo;
        console.log(
          `QF${i}: ${teamTwo} wins with more away goals (${teamTwoAwayGoals} vs ${teamOneAwayGoals})`
        );
      } else if (teamOneAwayGoals > teamTwoAwayGoals) {
        winner = teamOne;
        console.log(
          `QF${i}: ${teamOne} wins with more away goals (${teamOneAwayGoals} vs ${teamTwoAwayGoals})`
        );
      } else {
        console.warn(
          `QF${i}: Tie between ${teamOne} and ${teamTwo}. Implement tie-breaker.`
        );
        throw new Error(
          `QF${i}: Tie between ${teamOne} and ${teamTwo}. play again and put new score`
        );
      }
    }

    semiFinalists.push(winner);
  }

  return semiFinalists;
};

export const calculateFinalists = (matches) => {
  const semiFinals = matches.filter((match) =>
    match.matchName.startsWith("SF")
  );
  const finalists = [];

  for (let i = 1; i <= 2; i++) {
    const sfMatches = semiFinals.filter(
      (match) => match.matchName === `SF${i}`
    );

    if (sfMatches.length !== 2) {
      console.error(`Incomplete data for SF${i}`);
      continue;
    }

    // Assigning teamOne and teamTwo based on the first match
    const teamOne = sfMatches[0].homeTeam;
    const teamTwo = sfMatches[0].awayTeam;

    let teamOneTotalGoals = 0;
    let teamTwoTotalGoals = 0;
    let teamOneAwayGoals = 0;
    let teamTwoAwayGoals = 0;

    sfMatches.forEach((match) => {
      const { homeTeam, homeScore, awayScore } = match;

      // Ensure scores are numbers
      const homeScoreNum = Number(homeScore);
      const awayScoreNum = Number(awayScore);

      if (homeTeam === teamOne) {
        teamOneTotalGoals += homeScoreNum;
        teamTwoTotalGoals += awayScoreNum;
        teamTwoAwayGoals += awayScoreNum; // Away goals for teamTwo
      } else {
        teamOneTotalGoals += awayScoreNum;
        teamTwoTotalGoals += homeScoreNum;
        teamOneAwayGoals += awayScoreNum; // Away goals for teamOne
      }
    });

    let winner;
    if (teamOneTotalGoals > teamTwoTotalGoals) {
      winner = teamOne;
      console.log(
        `SF${i}: ${teamOne} wins with total goals ${teamOneTotalGoals} vs ${teamTwoTotalGoals}`
      );
    } else if (teamTwoTotalGoals > teamOneTotalGoals) {
      winner = teamTwo;
      console.log(
        `SF${i}: ${teamTwo} wins with total goals ${teamTwoTotalGoals} vs ${teamOneTotalGoals}`
      );
    } else {
      // If total goals are equal, apply the away goals rule
      if (teamTwoAwayGoals > teamOneAwayGoals) {
        winner = teamTwo;
        console.log(
          `SF${i}: ${teamTwo} wins with more away goals (${teamTwoAwayGoals} vs ${teamOneAwayGoals})`
        );
      } else if (teamOneAwayGoals > teamTwoAwayGoals) {
        winner = teamOne;
        console.log(
          `SF${i}: ${teamOne} wins with more away goals (${teamOneAwayGoals} vs ${teamTwoAwayGoals})`
        );
      } else {
        console.warn(
          `SF${i}: Tie between ${teamOne} and ${teamTwo}. play again and put new score`
        );
        throw new Error(
          `SF${i}: Tie between ${teamOne} and ${teamTwo}. play again and put new score`
        );
      }
    }

    finalists.push(winner);
  }

  return finalists;
};

const generateLeagueMatches = (teams, tournamentId) => {
  const matchResults = [];
  let matchDay = 0;

  for (let i = 0; i < teams.length - 1; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      ++matchDay;
      const matchName1 = `Match 1 of 2`;
      matchResults.push({
        matchName: matchName1,
        homeTeam: teams[i],
        awayTeam: teams[j],
        matchDay,
        tournamentId,
      });

      ++matchDay;
      const matchName2 = `Match 2 of 2`;
      matchResults.push({
        matchName: matchName2,
        homeTeam: teams[j],
        awayTeam: teams[i],
        matchDay,
        tournamentId,
      });
    }
  }

  return matchResults;
};

const generateKnockoutMatches = (teams, tournamentId) => {
  if (teams.length !== 8) {
    throw new Error("There must be exactly 8 teams.");
  }

  const matchResults = [];
  const shuffledTeams = shuffleArray(teams.slice());
  let matchDay = 0;

  // Generate Quarter-Final matches
  for (let i = 0; i < 4; i++) {
    const matchName = `QF${i + 1}`;
    ++matchDay;
    matchResults.push({
      matchName,
      homeTeam: shuffledTeams[i * 2],
      awayTeam: shuffledTeams[i * 2 + 1],
      matchDay,
      tournamentId,
    });

    ++matchDay;
    matchResults.push({
      matchName,
      homeTeam: shuffledTeams[i * 2 + 1],
      awayTeam: shuffledTeams[i * 2],
      matchDay,
      tournamentId,
    });
  }

  // Generate Semi-Final matches
  // Generate Semi-Final matches
  const semiFinalists = [];
  for (let i = 0; i < 2; i++) {
    // Changed from 4 to 2
    const matchName = `SF${i + 1}`;
    const winner1 = `Winner of QF${i * 2 + 1}`;
    const winner2 = `Winner of QF${i * 2 + 2}`;
    semiFinalists.push(winner1);
    semiFinalists.push(winner2);
    ++matchDay;
    matchResults.push({
      matchName,
      homeTeam: winner1,
      awayTeam: winner2,
      matchDay,
      tournamentId,
    });
    ++matchDay;
    matchResults.push({
      matchName,
      homeTeam: winner2,
      awayTeam: winner1,
      matchDay,
      tournamentId,
    });
  }

  // Generate Final match
  const finalMatchNumber = "Final";
  const finalist1 = `Winner of SF1`;
  const finalist2 = `Winner of SF2`;
  matchResults.push({
    matchName: finalMatchNumber,
    homeTeam: finalist1,
    awayTeam: finalist2,
    matchDay: matchDay + 1,
    tournamentId,
  });

  return sortMatches(matchResults);
};

export const generateMatches = (teams, tournamentId, tournamentType) => {
  switch (tournamentType) {
    case "league":
      return generateLeagueMatches(teams, tournamentId);
    case "knockout_quarter_final":
      return generateKnockoutMatches(teams, tournamentId);
    default:
      throw new Error(`Unsupported tournament type: ${tournamentType}`);
  }
};

// Convert camelCase to snake_case
export const camelToSnake = (str) =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

// Convert snake_case to camelCase
export const snakeToCamel = (str) =>
  str.replace(/_([a-z])/g, (group) => group[1].toUpperCase());

// Convert object keys from camelCase to snake_case
export const convertKeysToSnakeCase = (obj) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    newObj[camelToSnake(key)] = obj[key];
  });
  return newObj;
};

// Convert object keys from snake_case to camelCase
export const convertKeysToCamelCase = (obj) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    newObj[snakeToCamel(key)] = obj[key];
  });
  return newObj;
};

export const computeStandings = (matches) => {
  if (!matches) return [];

  const standingsMap = {};

  // Extract unique teams from matches
  matches.forEach((match) => {
    const { homeTeam, awayTeam } = match;

    if (!standingsMap[homeTeam]) {
      standingsMap[homeTeam] = {
        team: homeTeam,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0, // Goals For
        ga: 0, // Goals Against
        gd: 0, // Goal Difference
        points: 0,
      };
    }

    if (!standingsMap[awayTeam]) {
      standingsMap[awayTeam] = {
        team: awayTeam,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0, // Goals For
        ga: 0, // Goals Against
        gd: 0, // Goal Difference
        points: 0,
      };
    }
  });

  console.log("compute: ", { matches, standingsMap });

  // Calculate the statistics based on matches that have been played
  matches.forEach((match) => {
    const { homeTeam, awayTeam, homeScore, awayScore } = match;

    if (homeScore !== null && awayScore !== null) {
      // Increment played matches
      standingsMap[homeTeam].played += 1;
      standingsMap[awayTeam].played += 1;

      // Update goals for and against
      standingsMap[homeTeam].gf += homeScore;
      standingsMap[awayTeam].gf += awayScore;

      standingsMap[homeTeam].ga += awayScore;
      standingsMap[awayTeam].ga += homeScore;

      // Update goal difference
      standingsMap[homeTeam].gd =
        standingsMap[homeTeam].gf - standingsMap[homeTeam].ga;
      standingsMap[awayTeam].gd =
        standingsMap[awayTeam].gf - standingsMap[awayTeam].ga;

      // Update win, draw, loss, and points
      if (homeScore > awayScore) {
        standingsMap[homeTeam].won += 1;
        standingsMap[awayTeam].lost += 1;
        standingsMap[homeTeam].points += 3;
      } else if (awayScore > homeScore) {
        standingsMap[awayTeam].won += 1;
        standingsMap[homeTeam].lost += 1;
        standingsMap[awayTeam].points += 3;
      } else {
        standingsMap[homeTeam].drawn += 1;
        standingsMap[awayTeam].drawn += 1;
        standingsMap[homeTeam].points += 1;
        standingsMap[awayTeam].points += 1;
      }
    }
  });

  // Convert standingsMap to array and sort alphabetically by team name
  const standingsArray = Object.values(standingsMap).sort((a, b) =>
    a.team.localeCompare(b.team)
  );

  // If any team has played matches, sort by points and then by goal difference
  if (
    matches.some(
      (match) => match.homeScore !== null && match.awayScore !== null
    )
  ) {
    standingsArray.sort(
      (a, b) =>
        b.points - a.points ||
        b.gd - a.gd ||
        b.gf - a.gf ||
        a.team.localeCompare(b.team)
    );
  }

  return standingsArray;
};

export const handleKnockoutScoreUpdate = async ({
  selectedTournament,
  selectedMatch,
  matches,
  homeScore,
  awayScore,
}) => {
  // Handle Quarter Finals
  if (selectedMatch.matchName.startsWith("QF")) {
    const qfMatches = matches.filter((match) =>
      match.matchName.startsWith("QF")
    );
    const allQfFinished = qfMatches.every(
      (match) => match.completedAt !== null
    );

    if (allQfFinished) {
      const teams = calculateSemiFinalists(matches);
      await updateSemifinalTeams(teams, selectedTournament.id);
    }
  }

  // Handle Semi Finals
  else if (selectedMatch.matchName.startsWith("SF")) {
    const sfMatches = matches.filter((match) =>
      match.matchName.startsWith("SF")
    );
    const allSfFinished = sfMatches.every(
      (match) => match.completedAt !== null
    );

    if (allSfFinished) {
      const teams = calculateFinalists(matches);
      await updateFinalTeams(teams, selectedTournament.id);
    }
  } else if (selectedMatch.matchName === "Final") {
    const winner =
      homeScore > awayScore ? selectedMatch.homeTeam : selectedMatch.awayTeam;
    await updateTournament(selectedTournament.id, winner);
  }
};

export const handleLeagueScoreUpdate = async (tournamentId, matches, teams) => {
  const standings = computeStandings(matches);
  const winner = standings[0];
  console.log("Wnner ", winner);
  await updateTournament(tournamentId, winner.team);
};
