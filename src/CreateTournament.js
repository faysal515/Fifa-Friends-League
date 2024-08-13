// CreateTournamentPopup.js
import React from "react";

const CreateTournamentPopup = ({
  show,
  onClose,
  onSubmit,
  tournamentName,
  setTournamentName,
  teamNames,
  setTeamNames,
}) => {
  if (!show) return null;

  return (
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
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Team Names (comma separated)
            </label>
            <input
              type="text"
              value={teamNames}
              onChange={(e) => setTeamNames(e.target.value)}
              className="w-full p-2 border rounded-md"
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
            onClick={onSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTournamentPopup;
