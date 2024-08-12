// src/firestoreFunctions.js
import {
  collection,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import db from "./firebaseConfig";

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

export const getMatchesFromFirestore = async () => {
  const matchCollection = collection(db, "matches");
  const querySnapshot = await getDocs(matchCollection);
  const matches = [];
  querySnapshot.forEach((doc) => {
    // console.log(">>>> ", { ...doc.data() });
    matches.push({ id: doc.id, ...doc.data() });
  });
  return matches;
};

export const updateTeamsInMatches = async (teams, tournamentName) => {
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
