import React, { useState, useEffect } from "react";
import supabase from "./supabaseClient";

import Login from "./Login";
import {
  sortMatches,
  handleKnockoutScoreUpdate,
  handleLeagueScoreUpdate,
} from "./utils";
import CreateTournamentPopup from "./CreateTournament";
import UpdateScorePopup from "./UpdateScore";
import Notification from "./Notification";
import Footballl from "./football.svg";
import Shoe from "./shoe.svg";
import Cup from "./cup.svg";
import MatchTabs from "./MatchTab";
import {
  getMatchesFromSupabase,
  getTournamentsFromSupabase,
  setMatchResult,
} from "./supabaseFunctions";
import LeagueTournamentTab from "./LeagueTournamentTab";

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
    // Listening to auth state changes
    const { subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    // Fetch the user session on initial load
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error logging out:", error);
    setUser(null);
  };

  useEffect(() => {
    if (user) {
      const fetchTournaments = async () => {
        try {
          setLoadingTournaments(true);
          const tournamentsList = await getTournamentsFromSupabase(user.id);
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

          const fetchedMatches = await getMatchesFromSupabase(
            selectedTournament.id
          );

          const sortedMatches = sortMatches(fetchedMatches);

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

  const handleSelectMatch = (match) => {
    setSelectedMatch(match);
    setHomeScore("");
    setAwayScore("");
  };

  const handleUpdateScore = async () => {
    try {
      if (selectedMatch && homeScore !== "" && awayScore !== "") {
        const completedAt = new Date().toISOString();
        console.log(
          "updating score for ",
          selectedMatch.matchDay,
          selectedMatch.matchName
        );

        // Update the match result in the database
        await setMatchResult({
          matchId: selectedMatch.id,
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
          completedAt,
        });

        // Update the match result in the local state
        const updatedMatches = matches.map((match) =>
          match.id === selectedMatch.id
            ? { ...match, homeScore, awayScore, completedAt }
            : match
        );

        const sortedMatches = sortMatches(updatedMatches);
        setMatches(sortedMatches);
        setSelectedMatch(null);
        setHomeScore("");
        setAwayScore("");

        // Handle post-match updates based on tournament type
        if (selectedTournament.tournamentType === "knockout_quarter_final") {
          await handleKnockoutScoreUpdate({
            selectedTournament,
            selectedMatch,
            matches: sortedMatches,
            homeScore,
            awayScore,
          });
        } else if (selectedTournament.tournamentType === "league") {
          const allMatchFinished = updatedMatches.every(
            (m) => m.completedAt !== null
          );
          if (allMatchFinished) {
            console.log(
              "Every match finished for tournament. calculating winner",
              selectedTournament.id,
              updatedMatches,
              selectedTournament.teams
            );
            await handleLeagueScoreUpdate(
              selectedTournament.id,
              updatedMatches,
              selectedTournament.teams
            );
            showNotification("Tournament updated with winner");
          }
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
            {match.completedAt ? (
              <div className="text-3xl font-bold">
                {match.homeScore} - {match.awayScore}
              </div>
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
              match.completedAt
                ? "bg-transparent text-gray-700 font-semibold py-2 px-4"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-full"
            }`}
            style={
              match.completedAt
                ? { textDecoration: "underline", cursor: "pointer" }
                : {}
            }
          >
            {match.completedAt ? "Update Score" : "Save Score"}
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
                  {selectedTournament?.tournamentType === "league" ? (
                    <LeagueTournamentTab
                      matches={matches}
                      renderMatchCard={renderMatchCard}
                      teams={selectedTournament?.teams}
                    />
                  ) : (
                    <MatchTabs
                      matches={matches}
                      renderMatchCard={renderMatchCard}
                    />
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <CreateTournamentPopup
        show={showCreateTournamentPopup}
        onClose={() => setShowCreateTournamentPopup(false)}
        setTournaments={setTournaments}
        setSelectedTournament={setSelectedTournament}
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
