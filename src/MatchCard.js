import React from "react";

const MatchCard = ({ match, onSelect }) => {
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
          onClick={() => onSelect(match)}
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

export default MatchCard;
