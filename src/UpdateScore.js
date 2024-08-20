import React from "react";

const UpdateScorePopup = ({
  show,
  onClose,
  match,
  homeScore,
  setHomeScore,
  awayScore,
  setAwayScore,
  onUpdateScore,
}) => {
  if (!show || !match) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Update Score
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {match.matchDay} - {match.matchName}
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 w-1/3">
              {match.homeTeam}
            </label>
            <input
              type="number"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              className="w-20 p-2 border rounded-md text-center"
              min={0}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 w-1/3">
              {match.awayTeam}
            </label>
            <input
              type="number"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              className="w-20 p-2 border rounded-md text-center"
              min={0}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={onUpdateScore}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Update Score
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateScorePopup;
