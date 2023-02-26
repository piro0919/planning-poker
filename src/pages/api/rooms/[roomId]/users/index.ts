// eslint-disable-next-line filenames/match-exported
import { addDoc, collection } from "firebase/firestore";
import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import db from "libs/db";

const handler = nc<NextApiRequest, NextApiResponse>();

export type PostParams = {
  card: string;
  isAdmin: boolean;
  name: string;
};

export type PostData = { id: string };

handler.post(
  async (
    { body, query: { roomId } }: NextApiRequest,
    res: NextApiResponse<PostData>
  ) => {
    if (typeof roomId !== "string") {
      res.status(500).end();

      return;
    }

    const { id } = await addDoc(
      collection(db, "rooms", roomId, "users"),
      body as PostParams
    );

    res.status(200).json({ id });
  }
);

export default handler;
