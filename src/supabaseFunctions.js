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
        teams: teams,
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

  console.log("Tournament created successfully:", data);
  return convertKeysToCamelCase(data[0]);
};

// Fetch tournaments with case conversion
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

// Insert matches in bulk with case conversion
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

  console.log("Matches fetched successfully:", data);
  return data.map(convertKeysToCamelCase);
};
