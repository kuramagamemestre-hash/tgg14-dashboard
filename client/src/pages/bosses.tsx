import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Boss } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatTimeRemaining, getTimeUntilRespawn } from "@/lib/timer-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Snail, Skull, Leaf, Crown, Shield, Flame, Edit, Trash, Target, Plus, Database, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import AddBossModal from "@/components/add-boss-modal";

// Importar as imagens dos bosses
import quimeraImage from "@assets/QUIMERA (2)_1757078487051.png";
import thrandirImage from "@assets/THARANDIR (2)_1757078488715.png";
import rugionaamanImage from "@assets/Ruginoaman_1757078484600.jpg";
import lindwurmImage from "@assets/db7136160_LIMDWURMN_1757078759829.png";
import gyesImage from "@assets/c8c7f9105_GYES_1757078759829.png";
import flonebleImage from "@assets/1580a664a_FLONEBLE_1757078759830.png";
import cigantusImage from "@assets/97efbd2f4_GIGANTUS_1757078759830.png";
import corvoImage from "@assets/768aa2a16_CORVODAMORTE_1757078759830.png";
import lytheaImage from "@assets/LYTHEA_1757079089392.png";
import ostiarImage from "@assets/OSTIAR_1757079089392.png";
import briareImage from "@assets/bRIARE_1757079089393.png";
import leoImage from "@assets/LEO_1757079515655.png";

const defaultBosses = [
  { name: "QUIMERA", level: 38, location: "MAPA 6", respawnTimeHours: 2, iconType: "dragon", iconColor: "purple", imageUrl: quimeraImage },
  { name: "THRANDIR", level: 43, location: "MAPA 12", respawnTimeHours: 2, iconType: "crown", iconColor: "blue", imageUrl: thrandirImage },
  { name: "CIGANTUS", level: 48, location: "MAPA 2", respawnTimeHours: 3, iconType: "shield", iconColor: "green", imageUrl: cigantusImage },
  { name: "FLONEBLE", level: 53, location: "MAPA 5", respawnTimeHours: 3, iconType: "flame", iconColor: "orange", imageUrl: flonebleImage },
  { name: "CORVO DA MOR", level: 63, location: "MAPA 3", respawnTimeHours: 4, iconType: "skull", iconColor: "red", imageUrl: corvoImage },
  { name: "GYES", level: 68, location: "MAPA 10", respawnTimeHours: 4, iconType: "dragon", iconColor: "blue", imageUrl: gyesImage },
  { name: "LINDWURM", level: 73, location: "MAPA 8", respawnTimeHours: 4, iconType: "dragon", iconColor: "green", imageUrl: lindwurmImage },
  { name: "BRIARE", level: 78, location: "MAPA 17", respawnTimeHours: 3, iconType: "crown", iconColor: "purple", imageUrl: briareImage },
  { name: "LEO", level: 83, location: "MAPA 19", respawnTimeHours: 3, iconType: "flame", iconColor: "yellow", imageUrl: leoImage },
  { name: "RUGINOAMAN", level: 88, location: "MAPA 14", respawnTimeHours: 2.5, iconType: "skull", iconColor: "red", imageUrl: rugionaamanImage },
  { name: "LYTHEA", level: 93, location: "MAPA 18", respawnTimeHours: 2, iconType: "leaf", iconColor: "green", imageUrl: lytheaImage },
  { name: "OSTIAR", level: 98, location: "MAPA 22", respawnTimeHours: 1, iconType: "shield", iconColor: "orange", imageUrl: ostiarImage }
];

const iconMap = {
  dragon: Snail,
  skull: Skull,
  leaf: Leaf,
  crown: Crown,
  shield: Shield,
  flame: Flame,
};

const colorMap = {
  red: "bg-red-600",
  purple: "bg-purple-600",
  green: "bg-green-600",
  blue: "bg-blue-600",
  yellow: "bg-yellow-600",
  orange: "bg-orange-600",
};

export default function Bosses() {
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: bosses = [], isLoading } = useQuery<Boss[]>({
    queryKey: ["/api/bosses"],
  });

  const killBossMutation = useMutation({
    mutationFn: async (bossId: string) => {
      const killedBy = localStorage.getItem("user_nickname") || "Unknown";
      const response = await apiRequest("POST", `/api/bosses/${bossId}/kill`, { killedBy });
      return response.json();
    },
    onSuccess: (updatedBoss) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bosses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Boss Killed",
        description: `${updatedBoss.name} has been marked as killed. Timer started!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to kill boss",
        variant: "destructive",
      });
    },
  });

  const reviveBossMutation = useMutation({
    mutationFn: async (bossId: string) => {
      const response = await apiRequest("POST", `/api/bosses/${bossId}/revive`);
      return response.json();
    },
    onSuccess: (updatedBoss) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bosses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Boss Revivido",
        description: `${updatedBoss.name} foi revivido. Clique foi desfeito!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao reviver boss",
        variant: "destructive",
      });
    },
  });

  const deleteBossMutation = useMutation({
    mutationFn: async (bossId: string) => {
      await apiRequest("DELETE", `/api/bosses/${bossId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bosses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Boss Deleted",
        description: "Boss has been removed from the list.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete boss",
        variant: "destructive",
      });
    },
  });

  const populateBossesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/bosses/batch", { bosses: defaultBosses });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bosses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Bosses Added",
        description: "All legion bosses have been added successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to populate bosses",
        variant: "destructive",
      });
    },
  });

  const handleKillBoss = (bossId: string) => {
    killBossMutation.mutate(bossId);
  };

  const handleDeleteBoss = (bossId: string) => {
    if (confirm("Are you sure you want to delete this boss?")) {
      deleteBossMutation.mutate(bossId);
    }
  };

  const getBossStatus = (boss: Boss) => {
    if (boss.isAlive) {
      return { text: "Alive", variant: "default" as const, color: "bg-green-600 text-white" };
    }
    
    const timeLeft = getTimeUntilRespawn(boss.lastKilledAt, boss.respawnTimeHours);
    if (timeLeft <= 0) {
      return { text: "Ready", variant: "default" as const, color: "bg-green-600 text-white" };
    }
    
    return { text: "Dead", variant: "destructive" as const, color: "bg-destructive text-destructive-foreground" };
  };

  const getRespawnDisplay = (boss: Boss) => {
    if (boss.isAlive) {
      return "Ready for hunt";
    }
    
    const timeLeft = getTimeUntilRespawn(boss.lastKilledAt, boss.respawnTimeHours);
    if (timeLeft <= 0) {
      return "Ready for hunt";
    }
    
    return formatTimeRemaining(timeLeft);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-32"></div>
          </div>
          <div className="h-10 bg-muted rounded w-32"></div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Boss Management</h3>
          <p className="text-muted-foreground">rom golden age tgg14</p>
        </div>
        <div className="flex space-x-3">
          {bosses.length === 0 && (
            <Button 
              onClick={() => populateBossesMutation.mutate()}
              disabled={populateBossesMutation.isPending}
              variant="outline"
              data-testid="button-populate-bosses"
            >
              <Database className="w-4 h-4 mr-2" />
              {populateBossesMutation.isPending ? "Adding Bosses..." : "Add All Legion Bosses"}
            </Button>
          )}
          <Button onClick={() => setShowAddModal(true)} data-testid="button-add-boss-page">
            <Plus className="w-4 h-4 mr-2" />
            Add New Boss
          </Button>
        </div>
      </div>

      {bosses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Skull className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No bosses yet</h3>
              <p className="text-muted-foreground mb-6">
                Add your first boss to start tracking respawn timers
              </p>
              <Button onClick={() => setShowAddModal(true)} data-testid="button-add-first-boss">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Boss
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Boss</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Respawn Timer</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bosses.map((boss) => {
                    const Icon = iconMap[boss.iconType as keyof typeof iconMap] || Snail;
                    const iconColorClass = colorMap[boss.iconColor as keyof typeof colorMap] || "bg-red-600";
                    const status = getBossStatus(boss);
                    
                    return (
                      <TableRow key={boss.id} data-testid={`boss-row-${boss.id}`}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {boss.imageUrl ? (
                              <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-primary/30 bg-card">
                                <img 
                                  src={boss.imageUrl} 
                                  alt={boss.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", iconColorClass)}>
                                <Icon className="text-white" size={20} />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-foreground" data-testid={`boss-name-row-${boss.id}`}>
                                {boss.name}
                              </p>
                              <p className="text-sm text-muted-foreground">Level {boss.level}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color} data-testid={`boss-status-row-${boss.id}`}>
                            {status.text}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground" data-testid={`boss-location-row-${boss.id}`}>
                          {boss.location}
                        </TableCell>
                        <TableCell>
                          <span 
                            className={cn(
                              "font-bold",
                              boss.isAlive || getTimeUntilRespawn(boss.lastKilledAt, boss.respawnTimeHours) <= 0
                                ? "text-green-400"
                                : "text-primary"
                            )}
                            data-testid={`boss-respawn-time-row-${boss.id}`}
                          >
                            {getRespawnDisplay(boss)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleKillBoss(boss.id)}
                              disabled={!boss.isAlive && getTimeUntilRespawn(boss.lastKilledAt, boss.respawnTimeHours) > 0}
                              data-testid={`button-kill-boss-${boss.id}`}
                              title="Mark as killed"
                            >
                              <Target className="w-4 h-4" />
                            </Button>
                            {!boss.isAlive && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => reviveBossMutation.mutate(boss.id)}
                                className="text-yellow-600 hover:text-yellow-700"
                                data-testid={`button-revive-boss-${boss.id}`}
                                title="Desfazer morte (clicou por engano)"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              data-testid={`button-edit-boss-${boss.id}`}
                              title="Edit boss"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteBoss(boss.id)}
                              data-testid={`button-delete-boss-${boss.id}`}
                              title="Delete boss"
                            >
                              <Trash className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <AddBossModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
