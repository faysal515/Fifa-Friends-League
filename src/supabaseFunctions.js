import supabase from "./supabaseClient";

export const createTournament = async ({
  name,
  teams,
  tournament_type,
  created_by,
}) => {
  const { data, error } = await supabase
    .from("tournaments")
    .insert([
      {
        name,
        tournament_type,
        teams: teams,
        winner: null,
        created_by,
        created_at: new Date(),
      },
    ])
    .select();

  if (error) {
    console.error("Error creating tournament:", error);
    throw error;
  }

  console.log("Tournament created successfully:", data);
  return data[0];
};

export const getTournamentsFromSupabase = async () => {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tournaments:", error);
    throw error;
  }

  console.log("Tournaments fetched successfully:", data);
  return data;
};
