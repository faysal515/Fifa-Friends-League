// src/firestoreFunctions.js
import {
  collection,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import db from "./firebaseConfig";

export const getTournamentsFromFirestore = async () => {
  const tournamentCollection = collection(db, "tournaments");
  const querySnapshot = await getDocs(tournamentCollection);
  const tournaments = [];

  querySnapshot.forEach((doc) => {
    tournaments.push({ id: doc.id, ...doc.data() });
  });

  return tournaments;
};

export const saveMatchesToFirestore = async (matches) => {
  const matchCollection = collection(db, "matches");
  for (const match of matches) {
    await addDoc(matchCollection, match);
  }
  console.log("Matches saved to Firestore successfully.");
};

export const setMatchResult = async (matchDay, result) => {
  const matchCollection = collection(db, "matches");
  const q = query(matchCollection, where("matchDay", "==", matchDay));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach(async (doc) => {
    const matchDoc = doc.ref;
    console.log(">>>> ", matchDoc);
    await updateDoc(matchDoc, { result });
    console.log(`Result set for match ${matchDay}`);
  });
};

export const getMatchesFromFirestore = async (tournamentName) => {
  const matchCollection = collection(db, "matches");

  // Create a query to filter matches by the tournament name
  const q = query(
    matchCollection,
    where("tournamentName", "==", tournamentName)
  );

  const querySnapshot = await getDocs(q);
  const matches = [];

  querySnapshot.forEach((doc) => {
    matches.push({ id: doc.id, ...doc.data() });
  });

  return matches;
};

export const updateSemifinalTeams = async (teams, tournamentName) => {
  const matchCollection = collection(db, "matches");

  const q = query(
    matchCollection,
    where("tournamentName", "==", tournamentName),
    where("matchName", ">=", "SF"),
    where("matchName", "<=", "SF\uf8ff")
  );

  const querySnapshot = await getDocs(q);

  const placeholders = [
    "Winner of QF1",
    "Winner of QF2",
    "Winner of QF3",
    "Winner of QF4",
  ];

  querySnapshot.forEach(async (doc) => {
    const matchData = doc.data();
    let updatedFields = {};

    placeholders.forEach((placeholder, index) => {
      const teamName = teams[index];

      if (matchData.homeTeam === placeholder) {
        updatedFields.homeTeam = teamName;
      }

      if (matchData.awayTeam === placeholder) {
        updatedFields.awayTeam = teamName;
      }
    });

    // Perform the update if there are fields to update
    if (Object.keys(updatedFields).length > 0) {
      console.log(".... ", updatedFields);
      await updateDoc(doc.ref, updatedFields);
    }
  });

  console.log("Team names updated successfully in matches starting with 'SF'.");
};

export const updateFinalTeams = async (teams, tournamentName) => {
  const matchCollection = collection(db, "matches");

  // Query to find the final match in the specified tournament
  const q = query(
    matchCollection,
    where("tournamentName", "==", tournamentName),
    where("matchName", "==", "Final")
  );

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    const matchData = doc.data();
    let updatedFields = {};

    // Assuming the teams array has two elements, one for home and one for away
    updatedFields.homeTeam = teams[0];
    updatedFields.awayTeam = teams[1];

    // Perform the update
    await updateDoc(doc.ref, updatedFields);

    console.log("Final team names updated successfully.");
  } else {
    console.log("No final match found for the specified tournament.");
  }
};

// New function to create a tournament
export const createTournament = async (name, teams) => {
  const tournamentCollection = collection(db, "tournaments");

  const tournament = {
    name,
    teams,
    winner: null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(tournamentCollection, tournament);
  console.log("Tournament created successfully with ID:", docRef.id);
  return docRef.id;
};
