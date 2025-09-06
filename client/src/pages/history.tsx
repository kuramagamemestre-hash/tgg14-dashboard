import { useQuery } from "@tanstack/react-query";
import { Activity } from "@shared/schema";
import { formatRelativeTime } from "@/lib/timer-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Skull, UserPlus, Heart, Info } from "lucide-react";

const activityIcons = {
  boss_killed: Skull,
  boss_added: Clock,
  timer_set: Clock,
  member_joined: UserPlus,
  member_left: UserPlus,
  boss_removed: Skull,
  boss_spawned: Heart,
};

const activityColors = {
  boss_killed: "bg-destructive",
  boss_added: "bg-primary",
  timer_set: "bg-primary",
  member_joined: "bg-blue-600",
  member_left: "bg-gray-600",
  boss_removed: "bg-destructive",
  boss_spawned: "bg-green-600",
};

const activityLabels = {
  boss_killed: "Boss Killed",
  boss_added: "Boss Added",
  timer_set: "Timer Set",
  member_joined: "Member Joined",
  member_left: "Member Left",
  boss_removed: "Boss Removed",
  boss_spawned: "Boss Spawned",
};

export default function History() {
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, Activity[]>);

  const sortedDates = Object.keys(groupedActivities).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-32"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-6 border border-border animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-foreground">Activity History</h3>
        <p className="text-muted-foreground">View all past events and activities</p>
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Clock className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No activity yet</h3>
              <p className="text-muted-foreground">
                Activity history will appear here as you add bosses, manage members, and track spawns
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((date) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groupedActivities[date].map((activity) => {
                    const Icon = activityIcons[activity.type as keyof typeof activityIcons] || Info;
                    const colorClass = activityColors[activity.type as keyof typeof activityColors] || "bg-muted";
                    const label = activityLabels[activity.type as keyof typeof activityLabels] || "Activity";
                    
                    return (
                      <div 
                        key={activity.id} 
                        className="flex items-start space-x-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        data-testid={`activity-history-${activity.id}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                          <Icon className="text-white" size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-foreground" data-testid={`activity-description-${activity.id}`}>
                              {activity.description}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground" data-testid={`activity-timestamp-${activity.id}`}>
                            {formatRelativeTime(activity.timestamp)} • {new Date(activity.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
