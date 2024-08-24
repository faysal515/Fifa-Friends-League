import React, { useEffect, useState } from "react";
import queryString from "query-string";
import LeagueTournamentTab from "./LeagueTournamentTab";
import MatchTabs from "./MatchTab";
import MatchCard from "./MatchCard";
import {
  getMatchesFromSupabase,
  getTournamentDetails,
} from "./supabaseFunctions";

const PublicTournament = () => {
  const [matches, setMatches] = useState([]);
  const [tournamentName, setTournamentName] = useState("");
  const [tournamentType, setTournamentType] = useState("");
  const [teams, setTeams] = useState([]);

  const search = window.location.search;
  const query = queryString.parse(search);
  const tournamentId = query.id;

  useEffect(() => {
    const fetchTournamentData = async () => {
      if (tournamentId) {
        try {
          const tournament = await getTournamentDetails(tournamentId);
          setTournamentName(tournament.name);
          setTournamentType(tournament.tournamentType);
          setTeams(tournament.teams || []);

          const fetchedMatches = await getMatchesFromSupabase(tournamentId);
          setMatches(fetchedMatches);
        } catch (error) {
          console.error("Error fetching tournament data:", error);
        }
      }
    };

    fetchTournamentData();
  }, [tournamentId]);

  const renderMatchCard = (match) => (
    <MatchCard key={match.id} match={match} hideUpdateButton={true} />
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">{tournamentName}</h1>
      <div className="grid">
        {tournamentType === "league" ? (
          <LeagueTournamentTab
            matches={matches}
            renderMatchCard={renderMatchCard}
            teams={teams}
          />
        ) : (
          <MatchTabs matches={matches} renderMatchCard={renderMatchCard} />
        )}
      </div>
    </div>
  );
};

export default PublicTournament;
