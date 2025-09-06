import { type Boss, type InsertBoss, type Member, type InsertMember, type Activity, type InsertActivity, type Notification, type InsertNotification } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { bosses, members, activities, notifications } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Boss operations
  getBosses(): Promise<Boss[]>;
  getBoss(id: string): Promise<Boss | undefined>;
  createBoss(boss: InsertBoss): Promise<Boss>;
  updateBoss(id: string, updates: Partial<Boss>): Promise<Boss | undefined>;
  deleteBoss(id: string): Promise<boolean>;
  killBoss(id: string, killedBy?: string): Promise<Boss | undefined>;
  reviveBoss(id: string): Promise<Boss | undefined>;
  
  // Member operations
  getMembers(): Promise<Member[]>;
  getMember(id: string): Promise<Member | undefined>;
  getMemberByName(name: string): Promise<Member | undefined>;
  verifyMemberPassword(name: string, password: string): Promise<boolean>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: string, updates: Partial<Member>): Promise<Member | undefined>;
  deleteMember(id: string): Promise<boolean>;
  
  // Activity operations
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Notification operations
  getActiveNotification(): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  deactivateAllNotifications(): Promise<void>;
}

export class MemStorage implements IStorage {
  private bosses: Map<string, Boss>;
  private members: Map<string, Member>;
  private activities: Map<string, Activity>;
  private notifications: Map<string, Notification>;

  constructor() {
    this.bosses = new Map();
    this.members = new Map();
    this.activities = new Map();
    this.notifications = new Map();
    
    // Inicializar bosses automaticamente
    this.initializeBosses();
  }
  
  private async initializeBosses() {
    const defaultBosses = [
      { name: "QUIMERA", level: 38, location: "MAPA 6", respawnTimeHours: 2, imageUrl: "/attached_assets/QUIMERA (2)_1757078487051.png" },
      { name: "THRANDIR", level: 43, location: "MAPA 12", respawnTimeHours: 2, imageUrl: "/attached_assets/THARANDIR (2)_1757078488715.png" },
      { name: "CIGANTUS", level: 48, location: "MAPA 2", respawnTimeHours: 3, imageUrl: "/attached_assets/97efbd2f4_GIGANTUS_1757078759830.png" },
      { name: "FLONEBLE", level: 53, location: "MAPA 5", respawnTimeHours: 3, imageUrl: "/attached_assets/1580a664a_FLONEBLE_1757078759830.png" },
      { name: "CORVO DA MOR", level: 63, location: "MAPA 3", respawnTimeHours: 4, imageUrl: "/attached_assets/768aa2a16_CORVODAMORTE_1757078759830.png" },
      { name: "GYES", level: 68, location: "MAPA 10", respawnTimeHours: 4, imageUrl: "/attached_assets/c8c7f9105_GYES_1757078759829.png" },
      { name: "LINDWURM", level: 73, location: "MAPA 8", respawnTimeHours: 4, imageUrl: "/attached_assets/db7136160_LIMDWURMN_1757078759829.png" },
      { name: "BRIARE", level: 78, location: "MAPA 17", respawnTimeHours: 3, imageUrl: "/attached_assets/bRIARE_1757079089393.png" },
      { name: "LEO", level: 83, location: "MAPA 19", respawnTimeHours: 3, imageUrl: "/attached_assets/LEO_1757079515655.png" },
      { name: "RUGINOAMAN", level: 88, location: "MAPA 14", respawnTimeHours: 2.5, imageUrl: "/attached_assets/Ruginoaman_1757078484600.jpg" },
      { name: "LYTHEA", level: 93, location: "MAPA 18", respawnTimeHours: 2, imageUrl: "/attached_assets/LYTHEA_1757079089392.png" },
      { name: "OSTIAR", level: 98, location: "MAPA 22", respawnTimeHours: 1, imageUrl: "/attached_assets/OSTIAR_1757079089392.png" }
    ];

    // Só adiciona se não tiver bosses ainda
    if (this.bosses.size === 0) {
      for (const boss of defaultBosses) {
        await this.createBossInitial(boss);
      }
    }
  }
  
  private async createBossInitial(insertBoss: InsertBoss): Promise<Boss> {
    const id = randomUUID();
    const boss: Boss = { 
      ...insertBoss, 
      id,
      lastKilledAt: null,
      lastKilledBy: null,
      isAlive: insertBoss.isAlive ?? true,
      iconType: insertBoss.iconType ?? "dragon",
      iconColor: insertBoss.iconColor ?? "red",
      imageUrl: insertBoss.imageUrl ?? null
    };
    this.bosses.set(id, boss);
    return boss;
  }

  // Boss operations
  async getBosses(): Promise<Boss[]> {
    return Array.from(this.bosses.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getBoss(id: string): Promise<Boss | undefined> {
    return this.bosses.get(id);
  }

  async createBoss(insertBoss: InsertBoss): Promise<Boss> {
    const id = randomUUID();
    const boss: Boss = { 
      ...insertBoss, 
      id,
      lastKilledAt: null,
      lastKilledBy: null,
      isAlive: insertBoss.isAlive ?? true,
      iconType: insertBoss.iconType ?? "dragon",
      iconColor: insertBoss.iconColor ?? "red",
      imageUrl: insertBoss.imageUrl ?? null
    };
    this.bosses.set(id, boss);
    
    await this.createActivity({
      type: "boss_added",
      description: `${boss.name} added to boss list`,
      bossId: id,
      memberId: null,
    });
    
    return boss;
  }

  async updateBoss(id: string, updates: Partial<Boss>): Promise<Boss | undefined> {
    const boss = this.bosses.get(id);
    if (!boss) return undefined;
    
    const updatedBoss = { ...boss, ...updates };
    this.bosses.set(id, updatedBoss);
    return updatedBoss;
  }

  async deleteBoss(id: string): Promise<boolean> {
    const boss = this.bosses.get(id);
    if (!boss) return false;
    
    this.bosses.delete(id);
    
    await this.createActivity({
      type: "boss_removed",
      description: `${boss.name} removed from boss list`,
      bossId: null,
      memberId: null,
    });
    
    return true;
  }

  async killBoss(id: string, killedBy?: string): Promise<Boss | undefined> {
    const boss = this.bosses.get(id);
    if (!boss) return undefined;
    
    const updatedBoss = {
      ...boss,
      isAlive: false,
      lastKilledAt: new Date(),
      lastKilledBy: killedBy || null,
    };
    
    this.bosses.set(id, updatedBoss);
    
    await this.createActivity({
      type: "boss_killed",
      description: killedBy 
        ? `${boss.name} has been killed by ${killedBy}`
        : `${boss.name} has been killed`,
      bossId: id,
      memberId: null,
    });
    
    return updatedBoss;
  }

  async reviveBoss(id: string): Promise<Boss | undefined> {
    const boss = this.bosses.get(id);
    if (!boss) return undefined;
    
    const updatedBoss = {
      ...boss,
      isAlive: true,
      lastKilledAt: null,
      lastKilledBy: null,
    };
    
    this.bosses.set(id, updatedBoss);
    
    await this.createActivity({
      type: "boss_spawned",
      description: `${boss.name} foi revivido (erro corrigido)`,
      bossId: id,
      memberId: null,
    });
    
    return updatedBoss;
  }

  // Member operations
  async getMembers(): Promise<Member[]> {
    const allMembers = Array.from(this.members.values());
    // Filtrar KURAMA - ele é invisível no sistema
    return allMembers.filter(member => member.name !== 'KURAMA').sort((a, b) => a.name.localeCompare(b.name));
  }

  async getMember(id: string): Promise<Member | undefined> {
    return this.members.get(id);
  }

  async getMemberByName(name: string): Promise<Member | undefined> {
    return Array.from(this.members.values()).find(member => member.name === name);
  }

  async verifyMemberPassword(name: string, password: string): Promise<boolean> {
    const member = await this.getMemberByName(name);
    if (!member) return false;
    
    return await bcrypt.compare(password, member.password);
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const id = randomUUID();
    const member: Member = { 
      ...insertMember, 
      id,
      joinedAt: new Date(),
      role: insertMember.role ?? "Membro",
      status: insertMember.status ?? "offline",
      dkp: insertMember.dkp ?? 0
    };
    this.members.set(id, member);
    
    await this.createActivity({
      type: "member_joined",
      description: `${member.name} joined the legion`,
      bossId: null,
      memberId: id,
    });
    
    return member;
  }

  async updateMember(id: string, updates: Partial<Member>): Promise<Member | undefined> {
    const member = this.members.get(id);
    if (!member) return undefined;
    
    const updatedMember = { ...member, ...updates };
    this.members.set(id, updatedMember);
    return updatedMember;
  }

  async deleteMember(id: string): Promise<boolean> {
    const member = this.members.get(id);
    if (!member) return false;
    
    this.members.delete(id);
    
    await this.createActivity({
      type: "member_left",
      description: `${member.name} left the legion`,
      bossId: null,
      memberId: null,
    });
    
    return true;
  }

  // Activity operations
  async getActivities(limit: number = 50): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = { 
      ...insertActivity, 
      id,
      timestamp: new Date(),
      bossId: insertActivity.bossId ?? null,
      memberId: insertActivity.memberId ?? null
    };
    this.activities.set(id, activity);
    return activity;
  }
  
  // Notification operations
  async getActiveNotification(): Promise<Notification | undefined> {
    return Array.from(this.notifications.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .find(notification => notification.isActive);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    
    // Desativar todas as notificações anteriores
    await this.deactivateAllNotifications();
    
    const notification: Notification = { 
      ...insertNotification, 
      id,
      createdAt: new Date()
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async deactivateAllNotifications(): Promise<void> {
    for (const [id, notification] of this.notifications.entries()) {
      this.notifications.set(id, { ...notification, isActive: false });
    }
  }
}

// DatabaseStorage implementation
export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeBosses();
  }
  
  private async initializeBosses() {
    const defaultBosses = [
      { name: "QUIMERA", level: 38, location: "MAPA 6", respawnTimeHours: 2, imageUrl: "/attached_assets/QUIMERA (2)_1757078487051.png" },
      { name: "THRANDIR", level: 43, location: "MAPA 12", respawnTimeHours: 2, imageUrl: "/attached_assets/THARANDIR (2)_1757078488715.png" },
      { name: "CIGANTUS", level: 48, location: "MAPA 2", respawnTimeHours: 3, imageUrl: "/attached_assets/97efbd2f4_GIGANTUS_1757078759830.png" },
      { name: "FLONEBLE", level: 53, location: "MAPA 5", respawnTimeHours: 3, imageUrl: "/attached_assets/1580a664a_FLONEBLE_1757078759830.png" },
      { name: "CORVO DA MOR", level: 63, location: "MAPA 3", respawnTimeHours: 4, imageUrl: "/attached_assets/768aa2a16_CORVODAMORTE_1757078759830.png" },
      { name: "GYES", level: 68, location: "MAPA 10", respawnTimeHours: 4, imageUrl: "/attached_assets/c8c7f9105_GYES_1757078759829.png" },
      { name: "LINDWURM", level: 73, location: "MAPA 8", respawnTimeHours: 4, imageUrl: "/attached_assets/db7136160_LIMDWURMN_1757078759829.png" },
      { name: "BRIARE", level: 78, location: "MAPA 17", respawnTimeHours: 3, imageUrl: "/attached_assets/bRIARE_1757079089393.png" },
      { name: "LEO", level: 83, location: "MAPA 19", respawnTimeHours: 3, imageUrl: "/attached_assets/LEO_1757079515655.png" },
      { name: "RUGINOAMAN", level: 88, location: "MAPA 14", respawnTimeHours: 2.5, imageUrl: "/attached_assets/Ruginoaman_1757078484600.jpg" },
      { name: "LYTHEA", level: 93, location: "MAPA 18", respawnTimeHours: 2, imageUrl: "/attached_assets/LYTHEA_1757079089392.png" },
      { name: "OSTIAR", level: 98, location: "MAPA 22", respawnTimeHours: 1, imageUrl: "/attached_assets/OSTIAR_1757079089392.png" }
    ];

    try {
      const existingBosses = await db.select().from(bosses).limit(1);
      if (existingBosses.length === 0) {
        for (const boss of defaultBosses) {
          await this.createBossInitial(boss);
        }
      }
    } catch (error) {
      console.error("Error initializing bosses:", error);
    }
  }
  
  private async createBossInitial(insertBoss: InsertBoss): Promise<Boss> {
    const id = randomUUID();
    const boss: Boss = { 
      ...insertBoss, 
      id,
      lastKilledAt: null,
      lastKilledBy: null,
      isAlive: insertBoss.isAlive ?? true,
      iconType: insertBoss.iconType ?? "dragon",
      iconColor: insertBoss.iconColor ?? "red",
      imageUrl: insertBoss.imageUrl ?? null
    };
    
    const [createdBoss] = await db.insert(bosses).values(boss).returning();
    return createdBoss;
  }

  // Boss operations
  async getBosses(): Promise<Boss[]> {
    const allBosses = await db.select().from(bosses);
    return allBosses.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getBoss(id: string): Promise<Boss | undefined> {
    const [boss] = await db.select().from(bosses).where(eq(bosses.id, id));
    return boss;
  }

  async createBoss(insertBoss: InsertBoss): Promise<Boss> {
    const id = randomUUID();
    const boss: Boss = { 
      ...insertBoss, 
      id,
      lastKilledAt: null,
      lastKilledBy: null,
      isAlive: insertBoss.isAlive ?? true,
      iconType: insertBoss.iconType ?? "dragon",
      iconColor: insertBoss.iconColor ?? "red",
      imageUrl: insertBoss.imageUrl ?? null
    };
    
    const [createdBoss] = await db.insert(bosses).values(boss).returning();
    
    await this.createActivity({
      type: "boss_added",
      description: `${boss.name} added to boss list`,
      bossId: id,
      memberId: null,
    });
    
    return createdBoss;
  }

  async updateBoss(id: string, updates: Partial<Boss>): Promise<Boss | undefined> {
    const [updatedBoss] = await db.update(bosses)
      .set(updates)
      .where(eq(bosses.id, id))
      .returning();
    return updatedBoss;
  }

  async deleteBoss(id: string): Promise<boolean> {
    const boss = await this.getBoss(id);
    if (!boss) return false;
    
    await db.delete(bosses).where(eq(bosses.id, id));
    
    await this.createActivity({
      type: "boss_deleted",
      description: `${boss.name} removed from boss list`,
      bossId: id,
      memberId: null,
    });
    
    return true;
  }

  async killBoss(id: string, killedBy?: string): Promise<Boss | undefined> {
    const boss = await this.getBoss(id);
    if (!boss) return undefined;
    
    const updatedBoss = await this.updateBoss(id, {
      isAlive: false,
      lastKilledAt: new Date()
    });
    
    if (updatedBoss) {
      await this.createActivity({
        type: "boss_killed",
        description: `${boss.name} foi morto${killedBy ? ` por ${killedBy}` : ''}`,
        bossId: id,
        memberId: null,
      });
    }
    
    return updatedBoss;
  }

  async reviveBoss(id: string): Promise<Boss | undefined> {
    const boss = await this.getBoss(id);
    if (!boss) return undefined;
    
    const updatedBoss = await this.updateBoss(id, {
      isAlive: true,
      lastKilledAt: null
    });
    
    if (updatedBoss) {
      await this.createActivity({
        type: "boss_spawned",
        description: `${boss.name} foi revivido`,
        bossId: id,
        memberId: null,
      });
    }
    
    return updatedBoss;
  }

  // Member operations
  async getMembers(): Promise<Member[]> {
    const allMembers = await db.select().from(members);
    // Filtrar KURAMA - ele é invisível no sistema
    return allMembers.filter(member => member.name !== 'KURAMA');
  }

  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member;
  }

  // Método especial para buscar qualquer membro (incluindo KURAMA) - usado para autenticação
  async getMemberByName(name: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.name, name));
    return member;
  }

  // Método para verificar senha de um membro
  async verifyMemberPassword(name: string, password: string): Promise<boolean> {
    const member = await this.getMemberByName(name);
    if (!member) return false;
    
    return await bcrypt.compare(password, member.password);
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const id = randomUUID();
    
    // Hash da senha para segurança
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(insertMember.password, saltRounds);
    
    const member: Member = { 
      ...insertMember, 
      id,
      password: hashedPassword, // Usar senha hashada
      status: insertMember.status ?? "offline",
      dkp: insertMember.dkp ?? 0,
      joinedAt: new Date()
    };
    
    const [createdMember] = await db.insert(members).values(member).returning();
    
    await this.createActivity({
      type: "member_joined",
      description: `${member.name} joined the legion`,
      bossId: null,
      memberId: id,
    });
    
    return createdMember;
  }

  async updateMember(id: string, updates: Partial<Member>): Promise<Member | undefined> {
    const [updatedMember] = await db.update(members)
      .set(updates)
      .where(eq(members.id, id))
      .returning();
    return updatedMember;
  }

  async deleteMember(id: string): Promise<boolean> {
    try {
      console.log("Searching for member to delete:", id);
      const member = await this.getMember(id);
      if (!member) {
        console.log("Member not found in database:", id);
        return false;
      }
      
      console.log("Found member, deleting from database:", member.name);
      await db.delete(members).where(eq(members.id, id));
      
      console.log("Creating activity for member deletion:", member.name);
      await this.createActivity({
        type: "member_left",
        description: `${member.name} left the legion`,
        bossId: null,
        memberId: id,
      });
      
      console.log("Member deletion completed successfully:", member.name);
      return true;
    } catch (error) {
      console.error("Error in deleteMember:", error);
      throw error;
    }
  }

  // Activity operations
  async getActivities(limit?: number): Promise<Activity[]> {
    const query = db.select().from(activities).orderBy(desc(activities.timestamp));
    
    if (limit) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = { 
      ...insertActivity, 
      id,
      timestamp: new Date(),
      bossId: insertActivity.bossId ?? null,
      memberId: insertActivity.memberId ?? null
    };
    
    const [createdActivity] = await db.insert(activities).values(activity).returning();
    return createdActivity;
  }
  
  // Notification operations
  async getActiveNotification(): Promise<Notification | undefined> {
    const [notification] = await db.select()
      .from(notifications)
      .where(eq(notifications.isActive, true))
      .orderBy(desc(notifications.createdAt))
      .limit(1);
    return notification;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    
    // Desativar todas as notificações anteriores
    await this.deactivateAllNotifications();
    
    const notification: Notification = { 
      ...insertNotification, 
      id,
      createdAt: new Date()
    };
    
    const [createdNotification] = await db.insert(notifications).values(notification).returning();
    return createdNotification;
  }

  async deactivateAllNotifications(): Promise<void> {
    await db.update(notifications)
      .set({ isActive: false })
      .where(eq(notifications.isActive, true));
  }
}

export const storage = new DatabaseStorage();
