import React, { useState, useEffect } from "react";
import { computeStandings } from "./utils";

const LeagueTournamentTab = ({ matches, renderMatchCard, teams }) => {
  const [standings, setStandings] = useState([]);
  const [activeTab, setActiveTab] = useState("matches");

  useEffect(() => {
    if (!teams || !matches || teams.length === 0) return;

    console.log(">> computing > ", { teams, matches });

    const updatedStandings = computeStandings(matches);
    setStandings(updatedStandings);
  }, [teams, matches]);

  if (!matches || !teams) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`px-4 py-2 w-full text-sm font-medium ${
            activeTab === "matches"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-600 hover:text-blue-500"
          }`}
          onClick={() => setActiveTab("matches")}
        >
          Matches
        </button>
        <button
          className={`px-4 py-2 w-full text-sm font-medium ${
            activeTab === "standings"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-600 hover:text-blue-500"
          }`}
          onClick={() => setActiveTab("standings")}
        >
          Standings
        </button>
      </div>

      {activeTab === "matches" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {matches.map(renderMatchCard)}
        </div>
      )}

      {activeTab === "standings" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">League Standings</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 text-left">Rank</th>
                  <th className="py-2 px-4 text-left">Team</th>
                  <th className="py-2 px-4 text-center">P</th>
                  <th className="py-2 px-4 text-center">W</th>
                  <th className="py-2 px-4 text-center">D</th>
                  <th className="py-2 px-4 text-center">L</th>
                  <th className="py-2 px-4 text-center">GF</th>
                  <th className="py-2 px-4 text-center">GA</th>
                  <th className="py-2 px-4 text-center">GD</th>
                  <th className="py-2 px-4 text-center">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, index) => (
                  <tr
                    key={index}
                    className={`${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } hover:bg-gray-200`}
                  >
                    <td className="py-2 px-4 text-left font-semibold">
                      {index + 1}
                    </td>
                    <td className="py-2 px-4">{team.team}</td>
                    <td className="py-2 px-4 text-center">{team.played}</td>
                    <td className="py-2 px-4 text-center">{team.won}</td>
                    <td className="py-2 px-4 text-center">{team.drawn}</td>
                    <td className="py-2 px-4 text-center">{team.lost}</td>
                    <td className="py-2 px-4 text-center">{team.gf}</td>
                    <td className="py-2 px-4 text-center">{team.ga}</td>
                    <td className="py-2 px-4 text-center">{team.gd}</td>
                    <td className="py-2 px-4 text-center font-bold">
                      {team.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueTournamentTab;
