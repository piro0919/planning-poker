// eslint-disable-next-line filenames/match-exported
import { connectFirestoreEmulator } from "firebase/firestore";
import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import db from "libs/db";

export default nc<NextApiRequest, NextApiResponse>().post(
  (_: NextApiRequest, res: NextApiResponse) => {
    connectFirestoreEmulator(db, "localhost", 8080);

    res.status(200).end();
  }
);
