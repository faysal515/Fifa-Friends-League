import supabase from "./supabaseClient";
import { convertKeysToCamelCase, convertKeysToSnakeCase } from "./utils";

export const createTournament = async ({
  name,
  teams,
  tournamentType,
  createdBy,
}) => {
  const { data, error } = await supabase
    .from("tournaments")
    .insert([
      convertKeysToSnakeCase({
        name,
        tournamentType,
        teams,
        winner: null,
        createdBy,
        createdAt: new Date(),
      }),
    ])
    .select();

  if (error) {
    console.error("Error creating tournament:", error);
    throw error;
  }

  return convertKeysToCamelCase(data[0]);
};

export const getTournamentsFromSupabase = async (createdBy) => {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("created_by", createdBy)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tournaments:", error);
    throw error;
  }

  console.log("Tournaments fetched successfully:", data);
  return data.map(convertKeysToCamelCase);
};
export const getTournamentDetails = async (tournamentId) => {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single();

  if (error) {
    console.error("Error fetching tournament details:", error);
    throw error;
  }

  console.log("Tournament details fetched successfully:", data);
  return convertKeysToCamelCase(data);
};

export const insertMatchesInBulk = async (matches) => {
  const matchesInSnakeCase = matches.map(convertKeysToSnakeCase);

  const { data, error } = await supabase
    .from("matches")
    .insert(matchesInSnakeCase)
    .select();

  if (error) {
    console.error("Error inserting matches:", error);
    throw error;
  }

  console.log("Matches inserted successfully:", data);
  return data.map(convertKeysToCamelCase);
};

export const getMatchesFromSupabase = async (tournamentId) => {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("match_day", { ascending: true });

  if (error) {
    console.error("Error fetching matches:", error);
    throw error;
  }

  console.log("Matches fetched successfully:", data.length);
  return data.map(convertKeysToCamelCase);
};

export const updateSemifinalTeams = async (teams, tournamentId) => {
  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .like("match_name", "SF%")
    .order("match_name", { ascending: true });

  if (error) {
    console.error("Error fetching semifinal matches:", error);
    throw error;
  }

  if (matches.length !== 4) {
    console.error("Expected 4 semifinal matches, found", matches.length);
    throw new Error("Incorrect number of semifinal matches");
  }

  const updates = matches.map(async (match, matchIndex) => {
    let homeTeam, awayTeam;

    if (matchIndex < 2) {
      // First two matches: team[0] vs team[1]
      homeTeam = matchIndex === 0 ? teams[0] : teams[1];
      awayTeam = matchIndex === 0 ? teams[1] : teams[0];
    } else {
      // Last two matches: team[2] vs team[3]
      homeTeam = matchIndex === 2 ? teams[2] : teams[3];
      awayTeam = matchIndex === 2 ? teams[3] : teams[2];
    }

    const updatedFields = {
      home_team: homeTeam,
      away_team: awayTeam,
    };

    const { error: updateError } = await supabase
      .from("matches")
      .update(updatedFields)
      .eq("id", match.id);

    if (updateError) {
      console.error(`Error updating match ID ${match.id}:`, updateError);
      throw updateError;
    }
  });

  await Promise.all(updates);

  console.log("Team names updated successfully in semifinal matches.");
};

export const updateFinalTeams = async (teams, tournamentId) => {
  const { data: finalMatch, error } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("match_name", "Final")
    .single(); // Assuming there's only one final match

  if (error) {
    console.error("Error fetching final match:", error);
    throw error;
  }

  if (finalMatch) {
    const updatedFields = {
      home_team: teams[0],
      away_team: teams[1],
    };

    const { error: updateError } = await supabase
      .from("matches")
      .update(updatedFields)
      .eq("id", finalMatch.id);

    if (updateError) {
      console.error("Error updating final match:", updateError);
      throw updateError;
    }

    console.log("Final team names updated successfully.");
  } else {
    console.log("No final match found for the specified tournament.");
  }
};

export const updateTournament = async (tournamentId, winner) => {
  const { error } = await supabase
    .from("tournaments")
    .update(
      convertKeysToSnakeCase({
        winner,
        updatedAt: new Date(),
      })
    )
    .eq("id", tournamentId);

  if (error) {
    console.error("Error updating tournament:", error);
    throw error;
  }

  console.log(
    `Tournament '${tournamentId}' updated successfully with winner '${winner}':`
  );
};

export const setMatchResult = async ({
  matchId,
  homeScore,
  awayScore,
  completedAt,
}) => {
  const { data, error } = await supabase
    .from("matches")
    .update(
      convertKeysToSnakeCase({
        homeScore,
        awayScore,
        completedAt,
      })
    )
    .eq("id", matchId);
  // .select();

  if (error) {
    console.error("Error setting match result:", error);
    throw error;
  }

  console.log("Match result updated successfully:", data);
  // return convertKeysToCamelCase(data[0]);
};
