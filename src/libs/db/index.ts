import { getFirestore } from "firebase/firestore";
import app from "libs/app";

const db = getFirestore(app);

export default db;
