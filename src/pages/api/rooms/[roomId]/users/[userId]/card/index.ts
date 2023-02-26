// eslint-disable-next-line filenames/match-exported
import { doc, updateDoc } from "firebase/firestore";
import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import db from "libs/db";

const handler = nc<NextApiRequest, NextApiResponse>();

export type PutParams = {
  card: string;
};

export type PutData = { id: string };

handler.put(
  async (
    { body, query: { roomId, userId } }: NextApiRequest,
    res: NextApiResponse
  ) => {
    if (typeof roomId !== "string" || typeof userId !== "string") {
      res.status(500).end();

      return;
    }

    await updateDoc(
      doc(db, "rooms", roomId, "users", userId),
      body as PutParams
    );

    res.status(200).end();
  }
);

export default handler;
