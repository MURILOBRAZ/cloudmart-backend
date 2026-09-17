import { Router } from "express";
import { checkPassword, createToken } from "../auth.js";

const router = Router();

router.post("/login", (req, res) => {
  if (!checkPassword(req.body?.password)) {
    return res.status(401).json({ error: "Invalid password" });
  }
  res.json(createToken());
});

export default router;
