import React, { useState, useEffect } from "react";
import {
  createTournament,
  getTournamentsFromSupabase,
  insertMatchesInBulk,
} from "./supabaseFunctions";
import supabase from "./supabaseClient";
import ReactGA from "react-ga4";
import { generateMatches } from "./utils";

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
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();
  }, []);

  const validateTournamentInput = (
    tournamentName,
    teamNames,
    tournamentType
  ) => {
    if (!tournamentName.trim()) {
      return "Tournament name cannot be empty.";
    }

    const teamsArray = teamNames.split(",").map((team) => team.trim());

    if (teamsArray.some((team) => !team)) {
      return "No team name can be empty.";
    }

    if (tournamentType === "league" && teamsArray.length < 2) {
      return "There must be at least 2 teams for league tournaments.";
    }

    if (
      tournamentType === "knockout_quarter_final" &&
      teamsArray.length !== 8
    ) {
      return "There must be exactly 8 teams for knockout tournaments.";
    }

    return null;
  };

  const handleCreateTournament = async () => {
    try {
      const validationError = validateTournamentInput(
        tournamentName,
        teamNames,
        tournamentType
      );

      if (validationError) {
        setErrorMessage(validationError);
        return;
      }

      const teamsArray = teamNames.split(",").map((team) => team.trim());

      setIsCreating(true);

      const tournament = await createTournament({
        name: tournamentName,
        teams: teamsArray,
        tournamentType,
        createdBy: user.id,
      });

      const matches = generateMatches(
        teamsArray,
        tournament.id,
        tournamentType
      );

      await insertMatchesInBulk(matches);

      ReactGA.event({
        category: "Tournament",
        action: "Created",
      });

      const tournamentsList = await getTournamentsFromSupabase(user.id);
      console.log("Tounament found ", tournamentsList, user);

      setTournaments(tournamentsList);

      const newTournament = tournamentsList.find((t) => t.id === tournament.id);
      setSelectedTournament(newTournament);

      onClose();
      setTournamentName("");
      setTeamNames("");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
      ReactGA.event({
        category: "Tournament",
        action: "Created_Failed",
        label: JSON.stringify({ tournamentName, teamNames, tournamentType }),
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = () => {
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Create New Tournament
        </h3>
        {errorMessage && (
          <div className="mb-4 text-red-500 text-sm">{errorMessage}</div>
        )}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Tournament Name
            </label>
            <input
              type="text"
              value={tournamentName}
              onChange={(e) => {
                setTournamentName(e.target.value);
                handleInputChange();
              }}
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
              onChange={(e) => {
                setTeamNames(e.target.value);
                handleInputChange();
              }}
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
              onChange={(e) => {
                setTournamentType(e.target.value);
                handleInputChange();
              }}
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
