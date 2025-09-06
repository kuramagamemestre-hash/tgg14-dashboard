// server/login.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "./db";                 // sua conexão Drizzle
import { members } from "../shared/schema"; // ajuste se precisar
import { sql } from "drizzle-orm";

const router = Router();

router.post("/api/login", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const password = String(req.body.password || "").trim();

    if (!name || !password) {
      return res.status(400).json({ message: "Informe nome e senha" });
    }

    // busca case-insensitive
    const rows = await db
      .select()
      .from(members)
      .where(sql`LOWER(${members.name}) = LOWER(${name})`)
      .limit(1);

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: "Credenciais incorretas" });
    }

    // compara a senha digitada com a do banco
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Credenciais incorretas" });
    }

    // sucesso
    return res.json({ id: user.id, name: user.name });
  } catch (err) {
    console.error("Erro no login:", err);
    return res.status(500).json({ message: "Erro no login" });
  }
});

export default router;
