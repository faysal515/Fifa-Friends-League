import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import Login from "./Login";
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
import Shoe from "./shoe.svg";
import Cup from "./cup.svg";
import MatchTabs from "./MatchTab";

const App = () => {
  const [user, setUser] = useState(null); // State to track authenticated user
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
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    setUser(null);
  };

  useEffect(() => {
    if (user) {
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
    }
  }, [user]);

  useEffect(() => {
    if (selectedTournament && user) {
      const fetchMatchesWithDelay = async () => {
        try {
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
        } catch (error) {
          showNotification(error.message, "error");
        } finally {
          setLoadingMatches(false);
        }
      };

      fetchMatchesWithDelay();
    }
  }, [selectedTournament, user]);

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

        const tournamentsList = await getTournamentsFromFirestore();
        setTournaments(tournamentsList);

        const newTournament = tournamentsList.find(
          (tournament) => tournament.id === tournamentId
        );
        setSelectedTournament(newTournament);

        setShowCreateTournamentPopup(false);
        setNewTournamentName("");
        setNewTeamNames("");
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
    const getInitials = (name) => name.slice(0, 1).toUpperCase();

    return (
      <div
        key={match.id}
        className="bg-white rounded-lg shadow-md p-6 mb-6 flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold mb-1">
              {getInitials(match.homeTeam)}
            </div>
            <span className="text-sm text-center font-bold">
              {match.homeTeam}
            </span>
          </div>
          <div className="flex flex-col items-center">
            {match.result ? (
              <div className="text-3xl font-bold">{match.result}</div>
            ) : (
              <span className="text-lg">vs</span>
            )}
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold mb-1">
              {getInitials(match.awayTeam)}
            </div>
            <span className="text-sm text-center font-bold">
              {match.awayTeam}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 ml-auto">
          <button
            onClick={() => handleSelectMatch(match)}
            className={`${
              match.result
                ? "bg-transparent text-gray-700 font-semibold py-2 px-4"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-full"
            }`}
            style={
              match.result
                ? { textDecoration: "underline", cursor: "pointer" }
                : {}
            }
          >
            {match.result ? "Update Score" : "Save Score"}
          </button>
        </div>
      </div>
    );
  };

  if (!user) {
    return <Login onLogin={(user) => setUser(user)} />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-4">
        <img
          src={Footballl}
          alt="Football Icon"
          className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-4"
        />
        <h1 className="text-2xl sm:text-3xl font-bold">Friends League</h1>
      </div>
      {notification && (
        <Notification message={notification.message} type={notification.type} />
      )}

      <div className="flex justify-end mb-4">
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/4 pr-0 md:pr-4 mb-6 md:mb-0">
          <p className="mb-2">Create a Tournament</p>
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
                  <img
                    src={tournament.winner ? Cup : Shoe}
                    alt="Tournament Icon"
                    className="w-5 h-5 mr-3 flex-shrink-0"
                  />
                  <div className="flex-grow overflow-hidden">
                    <span className="truncate block">{tournament.name}</span>
                    {tournament.winner && (
                      <span className="text-sm text-gray-600 truncate block">
                        Winner: {tournament.winner}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="w-full md:w-3/4">
          {loadingMatches ? (
            <div>Loading matches...</div>
          ) : noMatchesFound ? (
            <div>No matches found</div>
          ) : (
            selectedTournament && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Matches for {selectedTournament.name}
                </h2>

                <div className="grid">
                  <MatchTabs
                    matches={matches}
                    renderMatchCard={renderMatchCard}
                  />
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
