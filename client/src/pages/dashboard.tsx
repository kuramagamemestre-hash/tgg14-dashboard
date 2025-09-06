import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, Heart, Users, AlertTriangle, RefreshCw } from "lucide-react";
import { Boss, Member, Activity } from "@shared/schema";
import BossTimer from "@/components/boss-timer";
import { formatRelativeTime } from "@/lib/timer-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationBanner } from "@/components/notification-banner";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: bosses = [], isLoading: bossesLoading, refetch: refetchBosses } = useQuery<Boss[]>({
    queryKey: ["/api/bosses"],
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

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: activities = [], refetch: refetchActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const activeTimers = bosses.filter(boss => !boss.isAlive);
  const bossesAlive = bosses.filter(boss => boss.isAlive).length;
  const upcomingSpawns = activeTimers.filter(boss => {
    if (!boss.lastKilledAt) return false;
    const killTime = new Date(boss.lastKilledAt).getTime();
    const respawnTime = killTime + (boss.respawnTimeHours * 60 * 60 * 1000);
    const timeLeft = respawnTime - Date.now();
    return timeLeft > 0 && timeLeft < 60 * 60 * 1000; // within 1 hour
  }).length;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "boss_killed":
        return "fas fa-skull";
      case "boss_added":
      case "timer_set":
        return "fas fa-clock";
      case "member_joined":
        return "fas fa-user-plus";
      case "boss_spawned":
        return "fas fa-heart";
      default:
        return "fas fa-info-circle";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "boss_killed":
        return "bg-destructive";
      case "boss_added":
      case "timer_set":
        return "bg-primary";
      case "member_joined":
        return "bg-blue-600";
      case "boss_spawned":
        return "bg-green-600";
      default:
        return "bg-muted";
    }
  };

  const handleRefresh = () => {
    refetchBosses();
    refetchActivities();
  };

  if (bossesLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-20 mb-2"></div>
              <div className="h-8 bg-white/10 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modern Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm font-medium">Active Timers</p>
              <p className="text-4xl font-bold text-yellow-400 mt-2" data-testid="stat-active-timers-detailed">
                {activeTimers.length}
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Clock className="text-black" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm font-medium">Bosses Alive</p>
              <p className="text-4xl font-bold text-green-400 mt-2" data-testid="stat-bosses-alive-detailed">
                {bossesAlive}
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Heart className="text-black" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm font-medium">Legion Members</p>
              <p className="text-4xl font-bold text-blue-400 mt-2" data-testid="stat-members-detailed">
                {members.length}
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="text-black" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm font-medium">Upcoming Spawns</p>
              <p className="text-4xl font-bold text-orange-400 mt-2" data-testid="stat-upcoming-spawns">
                {upcomingSpawns}
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
              <AlertTriangle className="text-black" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Notification Banner - Between stats and content */}
      <NotificationBanner />

      {/* Modern Active Timers and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Modern Current Active Timers */}
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Timers Ativos</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh} 
              className="bg-white/10 hover:bg-white/20 text-white rounded-xl p-3"
              data-testid="button-refresh-timers"
            >
              <RefreshCw size={18} />
            </Button>
          </div>
          <div>
            {activeTimers.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active timers</p>
                <p className="text-sm text-muted-foreground">All bosses are alive and ready for battle!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTimers.slice(0, 5).map((boss) => (
                  <BossTimer key={boss.id} boss={boss} onRevive={(bossId) => reviveBossMutation.mutate(bossId)} />
                ))}
                {activeTimers.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    And {activeTimers.length - 5} more...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modern Recent Activity */}
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-2xl font-bold text-white mb-6">Atividade Recente</h3>
          <div>
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <AlertTriangle className="w-10 h-10 text-black" />
                </div>
                <p className="text-xl font-bold text-white mb-2">No recent activity</p>
                <p className="text-white/60">Activity will appear here as things happen</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.slice(0, 6).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3" data-testid={`activity-${activity.id}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${getActivityColor(activity.type)}`}>
                      <i className={`${getActivityIcon(activity.type)} text-white text-xs`}></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground font-medium">{activity.description}</p>
                      <p className="text-muted-foreground text-sm">
                        {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                {activities.length > 6 && (
                  <button className="w-full mt-4 text-primary hover:text-primary/80 transition-colors text-sm">
                    View all activity →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
