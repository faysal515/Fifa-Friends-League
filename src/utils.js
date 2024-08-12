// src/utils.js
export const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const generateMatches = (teams, tournamentName) => {
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
      tournamentName,
    });

    ++matchDay;
    matchResults.push({
      matchName,
      homeTeam: shuffledTeams[i * 2 + 1],
      awayTeam: shuffledTeams[i * 2],
      matchDay,
      tournamentName,
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
      tournamentName,
    });
    ++matchDay;
    matchResults.push({
      matchName,
      homeTeam: winner2,
      awayTeam: winner1,
      matchDay,
      tournamentName,
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
    tournamentName,
  });

  return sortMatches(matchResults);
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

    let winner = null;
    let totalHomeGoals = 0;
    let totalAwayGoals = 0;

    qfMatches.forEach((match) => {
      const [homeGoals, awayGoals] = match.result.split("-").map(Number);
      if (match.homeTeam === qfMatches[0].homeTeam) {
        totalHomeGoals += homeGoals;
        totalAwayGoals += awayGoals;
      } else {
        totalHomeGoals += awayGoals;
        totalAwayGoals += homeGoals;
      }
    });

    if (totalHomeGoals > totalAwayGoals) {
      winner = qfMatches[0].homeTeam;
    } else if (totalAwayGoals > totalHomeGoals) {
      winner = qfMatches[0].awayTeam;
    } else {
      console.warn(`Tie in QF${i}. Implement tie-breaker.`);
      winner = "TBD";
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

    let totalHomeGoals = 0;
    let totalAwayGoals = 0;

    sfMatches.forEach((match) => {
      const [homeGoals, awayGoals] = match.result.split("-").map(Number);
      if (match.homeTeam === sfMatches[0].homeTeam) {
        totalHomeGoals += homeGoals;
        totalAwayGoals += awayGoals;
      } else {
        totalHomeGoals += awayGoals;
        totalAwayGoals += homeGoals;
      }
    });

    let winner = null;

    if (totalHomeGoals > totalAwayGoals) {
      winner = sfMatches[0].homeTeam;
    } else if (totalAwayGoals > totalHomeGoals) {
      winner = sfMatches[0].awayTeam;
    } else {
      throw new Error(`Tie in SF${i}. A tie-breaker must be implemented.`);
    }

    finalists.push(winner);
  }

  return finalists;
};
