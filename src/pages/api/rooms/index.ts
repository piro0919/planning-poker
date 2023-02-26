// eslint-disable-next-line filenames/match-exported
import { addDoc, collection } from "firebase/firestore";
import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import db from "libs/db";

const handler = nc<NextApiRequest, NextApiResponse>();

export type PostData = { id: string };

handler.post(async (_: NextApiRequest, res: NextApiResponse<PostData>) => {
  const { id } = await addDoc(collection(db, "rooms"), {
    status: "reserve",
  });

  res.status(200).json({ id });
});

export default handler;
