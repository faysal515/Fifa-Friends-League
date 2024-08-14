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
import Footballl from "./football.svg";

const App = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [showCreateTournamentPopup, setShowCreateTournamentPopup] =
    useState(false);
  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTeamNames, setNewTeamNames] = useState("");
  const [notification, setNotification] = useState(null);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [noTournamentsFound, setNoTournamentsFound] = useState(false);
  const [noMatchesFound, setNoMatchesFound] = useState(false);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 2000);
  };

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoadingTournaments(true);
        const tournamentsList = await getTournamentsFromFirestore();
        setTournaments(tournamentsList);

        if (tournamentsList.length > 0) {
          const lastTournament = tournamentsList[tournamentsList.length - 1];
          setSelectedTournament(lastTournament);
          setNoTournamentsFound(false);
        } else {
          setNoTournamentsFound(true);
        }
      } catch (error) {
        showNotification(error.message, "error");
      } finally {
        setLoadingTournaments(false);
      }
    };

    fetchTournaments();
  }, []);

  useEffect(() => {
    const fetchMatchesWithDelay = async () => {
      try {
        if (selectedTournament) {
          setLoadingMatches(true);
          await new Promise((resolve) => setTimeout(resolve, 1500)); // Delay of 1.5 seconds

          const fetchedMatches = await getMatchesFromFirestore(
            selectedTournament.name
          );
          console.log("Fetched matches: ", fetchedMatches);

          const sortedMatches = sortMatches(fetchedMatches);
          console.log("Sorted matches: ", sortedMatches);

          setMatches(sortedMatches);

          if (sortedMatches.length > 0) {
            setNoMatchesFound(false);
          } else {
            setNoMatchesFound(true);
          }
        }
      } catch (error) {
        showNotification(error.message, "error");
      } finally {
        setLoadingMatches(false);
      }
    };

    fetchMatchesWithDelay();
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
        await handleGenerateMatches(newTournamentName, teamsArray);
        const tournamentId = await createTournament(
          newTournamentName,
          teamsArray
        );
        console.log("Tournament created with ID: ", tournamentId);

        // Fetch the tournaments after creating the new one
        const tournamentsList = await getTournamentsFromFirestore();
        setTournaments(tournamentsList);

        // Set the newly created tournament as the selected one
        const newTournament = tournamentsList.find(
          (tournament) => tournament.id === tournamentId
        );
        setSelectedTournament(newTournament);

        setShowCreateTournamentPopup(false);
        setNewTournamentName("");
        setNewTeamNames("");

        console.log("====== ", { newTournamentName, teamsArray });
      } else {
        showNotification(
          "Please enter both a tournament name and team names.",
          "error"
        );
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

  const renderMatchCard = (match) => {
    return (
      <div key={match.id} className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="">{`Match #${match.matchDay} - ${match.matchName}`}</h3>
            <p className="text-2xl font-bold text-gray-600">{`${match.homeTeam} vs ${match.awayTeam}`}</p>
          </div>
          {match.result && (
            <div className="text-6xl font-bold">{match.result}</div>
          )}
        </div>
        <button
          onClick={() => handleSelectMatch(match)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-full"
        >
          Update Score
        </button>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-4">
        <img src={Footballl} alt="Football Icon" className="w-10 h-10 mr-4" />
        <h1 className="text-3xl font-bold">Friends League</h1>
      </div>
      {notification && (
        <Notification message={notification.message} type={notification.type} />
      )}

      <div className="flex">
        <div className="w-1/4 pr-4">
          <p>Create a Tournament</p>
          <button
            onClick={handleCreateTournament}
            className="mb-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center"
          >
            +
          </button>

          {loadingTournaments ? (
            <div>Loading tournaments...</div>
          ) : noTournamentsFound ? (
            <div>No tournament found, create one!</div>
          ) : (
            <ul className="space-y-2">
              {tournaments.map((tournament, index) => (
                <li
                  key={index}
                  className={`flex items-center p-2 rounded-md cursor-pointer ${
                    selectedTournament === tournament
                      ? "bg-gray-100"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    setSelectedTournament(tournament);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-5 h-5 mr-3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 21h8M12 17v4M7 4h10v8a5 5 0 01-10 0V4zm12 0v4a2 2 0 01-2 2M5 4v4a2 2 0 002 2"
                    />
                  </svg>

                  {tournament.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="w-3/4">
          {loadingMatches ? (
            <div>Loading matches...</div>
          ) : noMatchesFound ? (
            <div>No matches found</div>
          ) : (
            selectedTournament && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Matches for {selectedTournament.name}{" "}
                  {selectedTournament.winner
                    ? `Winner - ${selectedTournament.winner}`
                    : ""}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  {matches.map(renderMatchCard)}
                </div>
              </div>
            )
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
    </div>
  );
};

export default App;
