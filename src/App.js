import React, { useState, useEffect } from "react";
import {
  generateMatches,
  sortMatches,
  calculateSemiFinalists,
  calculateFinalists,
} from "./utils";
import {
  saveMatchesToFirestore,
  setMatchResult,
  getMatchesFromFirestore,
  updateSemifinalTeams,
  updateFinalTeams,
  createTournament,
  getTournamentsFromFirestore,
} from "./firestoreFunctions";

const App = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [semiFinalTeams, setSemiFinalTeams] = useState([]);
  const [finalistTeams, setFinalistTeams] = useState([]);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showFinalistPopup, setShowFinalistPopup] = useState(false);
  const [showCreateTournamentPopup, setShowCreateTournamentPopup] =
    useState(false);
  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTeamNames, setNewTeamNames] = useState("");

  useEffect(() => {
    const fetchTournaments = async () => {
      const tournamentsList = await getTournamentsFromFirestore();
      setTournaments(tournamentsList);

      if (tournamentsList.length > 0) {
        const lastTournament = tournamentsList[tournamentsList.length - 1];
        setSelectedTournament(lastTournament);
        setTeams(lastTournament.teams);
      }
    };

    fetchTournaments();
  }, []);

  useEffect(() => {
    const fetchMatches = async () => {
      if (selectedTournament) {
        const fetchedMatches = await getMatchesFromFirestore(
          selectedTournament.name
        );
        const sortedMatches = sortMatches(fetchedMatches);
        setMatches(sortedMatches);

        console.log(">>>> ", { sortedMatches });
      }
    };

    fetchMatches();
  }, [selectedTournament]);

  const handleCreateTournament = () => {
    setShowCreateTournamentPopup(true);
  };

  const handleCreateTournamentSubmit = async () => {
    if (newTournamentName && newTeamNames) {
      const teamsArray = newTeamNames.split(",").map((team) => team.trim());
      if (teamsArray.length !== 8) {
        throw new Error("There must be exactly 8 teams.");
      }
      const tournamentId = await createTournament(
        newTournamentName,
        teamsArray
      );
      console.log("Tournament created with ID: ", tournamentId);

      const tournamentsList = await getTournamentsFromFirestore();
      setTournaments(tournamentsList);
      const lastTournament = tournamentsList[tournamentsList.length - 1];
      setSelectedTournament(lastTournament);
      setTeams(teamsArray);

      setShowCreateTournamentPopup(false);
      setNewTournamentName("");
      setNewTeamNames("");

      await handleGenerateMatches(newTournamentName);
    } else {
      alert("Please enter both a tournament name and team names.");
    }
  };

  const handleGenerateMatches = async (newTournamentName) => {
    // if (!selectedTournament) throw new Error("No tournament is selected");

    const generatedMatches = generateMatches(teams, newTournamentName);
    const sortedMatches = sortMatches(generatedMatches);
    console.log("==== ", sortedMatches);
    setMatches(sortedMatches);
    await saveMatchesToFirestore(sortedMatches);
  };

  const handleCalculateSemifinal = async () => {
    const teams = calculateSemiFinalists(matches);
    console.log("====Teams ==== ", teams);
    setSemiFinalTeams(teams);
    setShowConfirmPopup(true);
  };

  const handleConfirmUpdateSemifinalTeams = async () => {
    setShowConfirmPopup(false);
    if (selectedTournament) {
      await updateSemifinalTeams(semiFinalTeams, selectedTournament.name);
    }
  };

  const handleCalculateFinalist = async () => {
    try {
      const teams = calculateFinalists(matches);
      console.log("====Finalists ==== ", teams);
      setFinalistTeams(teams);
      setShowFinalistPopup(true);
    } catch (error) {
      console.error(error.message);
      alert(error.message);
    }
  };

  const handleConfirmUpdateFinalTeams = async () => {
    setShowFinalistPopup(false);
    if (selectedTournament) {
      await updateFinalTeams(finalistTeams, selectedTournament.name);
    }
  };

  const handleSelectMatch = (match) => {
    setSelectedMatch(match);
    setHomeScore("");
    setAwayScore("");
  };

  const handleUpdateScore = async () => {
    if (selectedMatch && homeScore !== "" && awayScore !== "") {
      const result = `${homeScore}-${awayScore}`;
      console.log(
        "updating score for ",
        selectedMatch.matchDay,
        selectedMatch.matchName
      );
      await setMatchResult(selectedMatch.matchDay, result);
      const updatedMatches = matches.map((match) =>
        match.matchName === selectedMatch.matchName
          ? { ...match, result }
          : match
      );
      const sortedMatches = sortMatches(updatedMatches);
      setMatches(sortedMatches);
      setSelectedMatch(null);
      setHomeScore("");
      setAwayScore("");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Football Schedule</h1>

      <div className="flex">
        <div className="w-1/4 pr-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Tournaments</h2>
            <button
              onClick={handleCreateTournament}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full p-2"
            >
              +
            </button>
          </div>

          <ul className="space-y-2">
            {tournaments.map((tournament, index) => (
              <li
                key={index}
                className={`cursor-pointer ${
                  selectedTournament === tournament ? "font-bold" : ""
                }`}
                onClick={() => {
                  setSelectedTournament(tournament);
                  setTeams(tournament.teams);
                }}
              >
                {tournament.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="w-3/4">
          {selectedTournament && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Matches for {selectedTournament.name}
              </h2>

              <button
                onClick={handleCalculateSemifinal}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
              >
                Calculate Semifinalist
              </button>

              <button
                onClick={handleCalculateFinalist}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
              >
                Calculate Finalist
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map((match, index) => (
                  <div
                    key={index}
                    className="bg-white shadow-md rounded-lg p-4"
                  >
                    <div className="text-sm text-gray-600 mb-2">
                      Match #{match.matchDay} - {match.matchName}
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-lg font-semibold">
                        {match.homeTeam}
                      </div>
                      <div className="text-xl font-bold">
                        {match.result ? match.result : "vs"}
                      </div>
                      <div className="text-lg font-semibold">
                        {match.awayTeam}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectMatch(match)}
                      className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Update Score
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Tournament Popup */}
      {showCreateTournamentPopup && (
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
                  value={newTournamentName}
                  onChange={(e) => setNewTournamentName(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Team Names (comma separated)
                </label>
                <input
                  type="text"
                  value={newTeamNames}
                  onChange={(e) => setNewTeamNames(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateTournamentPopup(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTournamentSubmit}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMatch && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Update Score
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedMatch.matchDay} - {selectedMatch.matchName}
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 w-1/3">
                  {selectedMatch.homeTeam}
                </label>
                <input
                  type="number"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-20 p-2 border rounded-md text-center"
                  min="0"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 w-1/3">
                  {selectedMatch.awayTeam}
                </label>
                <input
                  type="number"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="w-20 p-2 border rounded-md text-center"
                  min="0"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedMatch(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateScore}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Update Score
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmPopup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Confirm Update
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to update the teams for the semifinals?
            </p>
            <ul className="list-disc pl-5 mb-4">
              {semiFinalTeams.map((team, index) => (
                <li key={index} className="text-lg">
                  {team}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmPopup(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpdateSemifinalTeams}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showFinalistPopup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Confirm Update
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to update the teams for the final?
            </p>
            <ul className="list-disc pl-5 mb-4">
              {finalistTeams.map((team, index) => (
                <li key={index} className="text-lg">
                  {team}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowFinalistPopup(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpdateFinalTeams}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <ul className="list-disc pl-5">
          {semiFinalTeams.map((team, index) => (
            <li key={index} className="text-lg">
              {team}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
