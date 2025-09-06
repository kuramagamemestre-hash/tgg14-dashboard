import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBossSchema, insertMemberSchema, insertNotificationSchema } from "@shared/schema";
import { z } from "zod";

// Middleware para verificar se é líder
const requireLeader = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  // Verificar se tem header de autorização
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("No auth header or invalid format:", authHeader);
    return res.status(401).json({ message: "Unauthorized - Leader access required" });
  }
  
  try {
    const token = authHeader.substring(7); // Remove 'Bearer '
    const authData = JSON.parse(token);
    
    console.log("Parsed auth data:", authData);
    
    // Verificar se é líder (incluir isAdmin para KURAMA)
    if (!authData.isLeader && !authData.isAdmin) {
      console.log("User is not leader or admin:", authData);
      return res.status(403).json({ message: "Forbidden - Leader access required" });
    }
    
    // Adicionar dados do usuário ao request
    req.user = authData;
    next();
  } catch (error) {
    console.error("Error parsing auth token:", error);
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Boss routes
  app.get("/api/bosses", async (_req, res) => {
    try {
      const bosses = await storage.getBosses();
      res.json(bosses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bosses" });
    }
  });

  app.post("/api/bosses/batch", async (req, res) => {
    try {
      const bossesData = req.body.bosses;
      const createdBosses = [];
      
      for (const bossData of bossesData) {
        const validatedBoss = insertBossSchema.parse(bossData);
        const boss = await storage.createBoss(validatedBoss);
        createdBosses.push(boss);
      }
      
      res.status(201).json(createdBosses);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid boss data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create bosses" });
      }
    }
  });

  app.post("/api/bosses", requireLeader, async (req, res) => {
    try {
      const bossData = insertBossSchema.parse(req.body);
      const boss = await storage.createBoss(bossData);
      res.status(201).json(boss);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid boss data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create boss" });
      }
    }
  });

  app.put("/api/bosses/:id", requireLeader, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const boss = await storage.updateBoss(id, updates);
      
      if (!boss) {
        res.status(404).json({ message: "Boss not found" });
        return;
      }
      
      res.json(boss);
    } catch (error) {
      res.status(500).json({ message: "Failed to update boss" });
    }
  });

  app.post("/api/bosses/:id/kill", requireLeader, async (req, res) => {
    try {
      const { id } = req.params;
      const { killedBy } = req.body;
      const boss = await storage.killBoss(id, killedBy);
      
      if (!boss) {
        res.status(404).json({ message: "Boss not found" });
        return;
      }
      
      res.json(boss);
    } catch (error) {
      res.status(500).json({ message: "Failed to kill boss" });
    }
  });

  app.post("/api/bosses/:id/revive", requireLeader, async (req, res) => {
    try {
      const { id } = req.params;
      const boss = await storage.reviveBoss(id);
      
      if (!boss) {
        res.status(404).json({ message: "Boss not found" });
        return;
      }
      
      res.json(boss);
    } catch (error) {
      res.status(500).json({ message: "Failed to revive boss" });
    }
  });

  app.delete("/api/bosses/:id", requireLeader, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteBoss(id);
      
      if (!deleted) {
        res.status(404).json({ message: "Boss not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete boss" });
    }
  });

  // Member routes
  app.get("/api/members", async (_req, res) => {
    try {
      const members = await storage.getMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  // Login endpoint - verifica senha de membro
  app.post("/api/login", async (req, res) => {
    try {
      const { name, password } = req.body;
      
      if (!name || !password) {
        return res.status(400).json({ message: "Nome e senha são obrigatórios" });
      }

      const isValidPassword = await storage.verifyMemberPassword(name, password);
      
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Buscar dados completos do membro
      const member = await storage.getMemberByName(name);
      if (!member) {
        return res.status(404).json({ message: "Membro não encontrado" });
      }

      // Retornar dados do membro (exceto senha)
      const { password: _, ...memberData } = member;
      res.json(memberData);
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rota para membro atualizar seus próprios dados (nível e poder)
  app.put("/api/members/self/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const { level, poder } = req.body;
      
      // Verificar se o membro existe
      const member = await storage.getMemberByName(name);
      if (!member) {
        return res.status(404).json({ message: "Membro não encontrado" });
      }
      
      // Apenas permitir atualização de nível e poder
      const updates: any = {};
      if (level !== undefined) updates.level = level;
      if (poder !== undefined) updates.poder = poder;
      
      const updatedMember = await storage.updateMember(member.id, updates);
      
      if (!updatedMember) {
        return res.status(500).json({ message: "Falha ao atualizar dados" });
      }
      
      // Retornar dados sem senha
      const { password: _, ...memberData } = updatedMember;
      res.json(memberData);
    } catch (error) {
      console.error("Erro ao atualizar dados próprios:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/members", async (req, res) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      const member = await storage.createMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid member data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create member" });
      }
    }
  });

  app.put("/api/members/:id", requireLeader, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const member = await storage.updateMember(id, updates);
      
      if (!member) {
        res.status(404).json({ message: "Member not found" });
        return;
      }
      
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to update member" });
    }
  });

  app.delete("/api/members/:id", requireLeader, async (req, res) => {
    console.log("DELETE route hit for member ID:", req.params.id);
    try {
      const { id } = req.params;
      console.log("Attempting to delete member with ID:", id);
      const deleted = await storage.deleteMember(id);
      
      if (!deleted) {
        console.log("Member not found for deletion:", id);
        res.status(404).json({ message: "Member not found" });
        return;
      }
      
      console.log("Member deleted successfully:", id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting member:", error);
      res.status(500).json({ message: "Failed to delete member" });
    }
  });

  // Activity routes
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const activityData = req.body;
      const activity = await storage.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  // Notification routes
  app.get("/api/notifications/active", async (req, res) => {
    try {
      const notification = await storage.getActiveNotification();
      res.json(notification || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active notification" });
    }
  });

  app.post("/api/notifications", requireLeader, async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create notification" });
      }
    }
  });

  app.delete("/api/notifications", requireLeader, async (req, res) => {
    try {
      await storage.deactivateAllNotifications();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate notifications" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
