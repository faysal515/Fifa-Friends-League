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
  updateTournament,
} from "./firestoreFunctions";
import CreateTournamentPopup from "./CreateTournament";
import UpdateScorePopup from "./UpdateScore";
import Notification from "./Notification";

const App = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
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
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 2000);
  };

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const tournamentsList = await getTournamentsFromFirestore();
        setTournaments(tournamentsList);

        if (tournamentsList.length > 0) {
          const lastTournament = tournamentsList[tournamentsList.length - 1];
          setSelectedTournament(lastTournament);
        }
      } catch (error) {
        showNotification(error.message, "error");
      }
    };

    fetchTournaments();
  }, []);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        if (selectedTournament) {
          const fetchedMatches = await getMatchesFromFirestore(
            selectedTournament.name
          );
          const sortedMatches = sortMatches(fetchedMatches);
          setMatches(sortedMatches);

          console.log(">>>> ", { sortedMatches });
        }
      } catch (error) {
        showNotification(error.message, "error");
      }
    };

    fetchMatches();
  }, [selectedTournament]);

  const handleCreateTournament = () => {
    setShowCreateTournamentPopup(true);
  };

  const handleCreateTournamentSubmit = async () => {
    try {
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

        setShowCreateTournamentPopup(false);
        setNewTournamentName("");
        setNewTeamNames("");

        await handleGenerateMatches(newTournamentName, teamsArray);
      } else {
        alert("Please enter both a tournament name and team names.");
      }
    } catch (error) {
      showNotification(error.message, "error");
    }
  };

  const handleGenerateMatches = async (newTournamentName, teams) => {
    try {
      const generatedMatches = generateMatches(teams, newTournamentName);
      const sortedMatches = sortMatches(generatedMatches);
      console.log("==== ", sortedMatches);
      setMatches(sortedMatches);
      await saveMatchesToFirestore(sortedMatches);
    } catch (error) {
      showNotification(error.message, "error");
    }
  };

  const handleConfirmUpdateSemifinalTeams = async () => {
    try {
      setShowConfirmPopup(false);
      if (selectedTournament) {
        await updateSemifinalTeams(semiFinalTeams, selectedTournament.name);
      }
    } catch (error) {
      showNotification(error.message, "error");
    }
  };

  const handleConfirmUpdateFinalTeams = async () => {
    try {
      setShowFinalistPopup(false);
      if (selectedTournament) {
        await updateFinalTeams(finalistTeams, selectedTournament.name);
      }
    } catch (error) {
      showNotification(error.message, "error");
    }
  };

  const handleSelectMatch = (match) => {
    setSelectedMatch(match);
    setHomeScore("");
    setAwayScore("");
  };

  const handleUpdateScore = async () => {
    try {
      if (selectedMatch && homeScore !== "" && awayScore !== "") {
        const result = `${homeScore}-${awayScore}`;
        console.log(
          "updating score for ",
          selectedMatch.matchDay,
          selectedMatch.matchName
        );

        await setMatchResult(
          selectedMatch.matchDay,
          result,
          selectedTournament.name
        );

        const updatedMatches = matches.map((match) =>
          match.id === selectedMatch.id ? { ...match, result } : match
        );

        const sortedMatches = sortMatches(updatedMatches);
        setMatches(sortedMatches);
        setSelectedMatch(null);
        setHomeScore("");
        setAwayScore("");

        if (selectedMatch.matchName.startsWith("QF")) {
          // Check if all QF matches are finished to calculate semifinalists
          const qfMatches = sortedMatches.filter((match) =>
            match.matchName.startsWith("QF")
          );
          const allQfFinished = qfMatches.every((match) => match.result);
          console.log("QF status ", { qfMatches, allQfFinished });

          if (allQfFinished) {
            console.log(
              "All QF finished, calculating and updating semifinalist..."
            );
            const teams = calculateSemiFinalists(sortedMatches);
            await updateSemifinalTeams(teams, selectedTournament.name);
          }
        } else if (selectedMatch.matchName.startsWith("SF")) {
          // Check if all SF matches are finished to calculate finalists
          const sfMatches = sortedMatches.filter((match) =>
            match.matchName.startsWith("SF")
          );
          const allSfFinished = sfMatches.every((match) => match.result);
          console.log("SF status ", { sfMatches, allSfFinished });

          if (allSfFinished) {
            try {
              console.log(
                "All SF finished, calculating and updating finalists..."
              );
              const teams = calculateFinalists(sortedMatches);
              await updateFinalTeams(teams, selectedTournament.name);
            } catch (error) {
              console.error("Error calculating finalists:", error);
            }
          }
        } else if (selectedMatch.matchName === "Final") {
          // Update the tournament with the winner after the final match is updated
          const winner =
            homeScore > awayScore
              ? selectedMatch.homeTeam
              : selectedMatch.awayTeam;
          await updateTournament(selectedTournament.name, winner);
          console.log(
            `Tournament '${selectedTournament.name}' updated with winner '${winner}'.`
          );
        }
      }
    } catch (error) {
      console.error("Failed to update score:", error);
      showNotification(error.message, "error");
    }
  };

  const renderMatchCard = (match, index) => (
    <div key={index} className="bg-white shadow-md rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-2">
        Match #{match.matchDay} - {match.matchName}
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold">{match.homeTeam}</div>
        <div className="text-xl font-bold">
          {match.result ? match.result : "vs"}
        </div>
        <div className="text-lg font-semibold">{match.awayTeam}</div>
      </div>
      <button
        onClick={() => handleSelectMatch(match)}
        className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        Update Score
      </button>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Football Schedule</h1>

      {notification && (
        <Notification message={notification.message} type={notification.type} />
      )}
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
                Matches for {selectedTournament.name}{" "}
                {selectedTournament.winner
                  ? `Winner - ${selectedTournament.winner}`
                  : ""}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map(renderMatchCard)}
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateTournamentPopup
        show={showCreateTournamentPopup}
        onClose={() => setShowCreateTournamentPopup(false)}
        onSubmit={handleCreateTournamentSubmit}
        tournamentName={newTournamentName}
        setTournamentName={setNewTournamentName}
        teamNames={newTeamNames}
        setTeamNames={setNewTeamNames}
      />

      <UpdateScorePopup
        show={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        match={selectedMatch}
        homeScore={homeScore}
        setHomeScore={setHomeScore}
        awayScore={awayScore}
        setAwayScore={setAwayScore}
        onUpdateScore={handleUpdateScore}
      />

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
