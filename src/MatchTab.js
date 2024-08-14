import React, { useState } from "react";

const MatchTabs = ({ matches, renderMatchCard }) => {
  const [activeTab, setActiveTab] = useState("QF");

  const renderMatches = (matchType) => {
    return matches
      .filter((match) => match.matchName.startsWith(matchType))
      .map((match, index) => renderMatchCard(match, index));
  };

  return (
    <div>
      <div className="flex border-b border-gray-200">
        <button
          className={`px-4 py-2 w-full text-sm font-medium ${
            activeTab === "QF"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-600 hover:text-blue-500"
          }`}
          onClick={() => setActiveTab("QF")}
        >
          Quarter Finals
        </button>
        <button
          className={`px-4 py-2 w-full text-sm font-medium ${
            activeTab === "SF"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-600 hover:text-blue-500"
          }`}
          onClick={() => setActiveTab("SF")}
        >
          Semifinals
        </button>
        <button
          className={`px-4 py-2 w-full text-sm font-medium ${
            activeTab === "Final"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-600 hover:text-blue-500"
          }`}
          onClick={() => setActiveTab("Final")}
        >
          Final
        </button>
      </div>

      <div className="mt-4">
        {activeTab === "QF" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {renderMatches("QF")}
          </div>
        )}
        {activeTab === "SF" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {renderMatches("SF")}
          </div>
        )}
        {activeTab === "Final" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {renderMatches("Final")}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchTabs;
