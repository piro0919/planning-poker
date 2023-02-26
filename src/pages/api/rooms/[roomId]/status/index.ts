// eslint-disable-next-line filenames/match-exported
import { doc, setDoc } from "firebase/firestore";
import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import db from "libs/db";

const handler = nc<NextApiRequest, NextApiResponse>();

/*
 * reserve: 待機中
 * start: 投票中
 * wait: 公開中
 */
type Status = "reserve" | "start" | "wait";

export type PutParams = {
  status: Status;
};

handler.put(
  async ({ body, query: { roomId } }: NextApiRequest, res: NextApiResponse) => {
    if (typeof roomId !== "string") {
      res.status(500).end();

      return;
    }

    const docRef = doc(db, "rooms", roomId);

    await setDoc(docRef, body as PutParams);

    res.status(200).end();
  }
);

export default handler;
