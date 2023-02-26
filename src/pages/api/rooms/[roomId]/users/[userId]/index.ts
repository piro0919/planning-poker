// eslint-disable-next-line filenames/match-exported
import { deleteDoc, doc } from "firebase/firestore";
import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import db from "libs/db";

const handler = nc<NextApiRequest, NextApiResponse>();

handler.delete(
  async (
    { query: { roomId, userId } }: NextApiRequest,
    res: NextApiResponse
  ) => {
    if (typeof roomId !== "string" || typeof userId !== "string") {
      res.status(500).end();

      return;
    }

    await deleteDoc(doc(db, "rooms", roomId, "users", userId));

    res.status(200).end();
  }
);

export default handler;
