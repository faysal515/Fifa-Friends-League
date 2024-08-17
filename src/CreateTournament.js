import React, { useState, useEffect } from "react";
import {
  createTournament,
  getTournamentsFromSupabase,
} from "./supabaseFunctions";
import supabase from "./supabaseClient";

const CreateTournamentPopup = ({
  show,
  onClose,
  setTournaments,
  setSelectedTournament,
}) => {
  const [tournamentName, setTournamentName] = useState("");
  const [teamNames, setTeamNames] = useState("");
  const [tournamentType, setTournamentType] = useState("league");
  const [isCreating, setIsCreating] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();
  }, []);

  const handleCreateTournament = async () => {
    try {
      if (tournamentName && teamNames) {
        const teamsArray = teamNames.split(",").map((team) => team.trim());
        if (
          tournamentType === "knockout_quarter_final" &&
          teamsArray.length !== 8
        ) {
          throw new Error(
            "There must be exactly 8 teams for knockout tournaments."
          );
        }

        setIsCreating(true);

        const tournamentId = await createTournament({
          name: tournamentName,
          teams: teamsArray,
          tournament_type: tournamentType,
          created_by: user.id,
        });

        const tournamentsList = await getTournamentsFromSupabase(); // Fetch the latest tournaments
        console.log("Tournament created with ID: ", {
          tournamentId,
          tournamentsList,
        });

        // setTournaments(tournamentsList);

        // const newTournament = tournamentsList.find(
        //   (tournament) => tournament.id === tournamentId
        // );
        // setSelectedTournament(newTournament);

        onClose(); // Close the popup after creation
        setTournamentName("");
        setTeamNames("");
      } else {
        alert("Please enter both a tournament name and team names.");
      }
    } catch (error) {
      alert(error.message); // Replace with your notification system if available
    } finally {
      setIsCreating(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Create New Tournament
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Tournament Name
            </label>
            <input
              type="text"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={isCreating}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Team Names (comma separated)
            </label>
            <input
              type="text"
              value={teamNames}
              onChange={(e) => setTeamNames(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={isCreating}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Tournament Type
            </label>
            <select
              value={tournamentType}
              onChange={(e) => setTournamentType(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={isCreating}
            >
              <option value="league">League</option>
              <option value="knockout_quarter_final">
                Knockout (Quarter Final)
              </option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreateTournament}
            className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isCreating
                ? "bg-blue-300 text-white cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
            disabled={isCreating}
          >
            {isCreating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTournamentPopup;
