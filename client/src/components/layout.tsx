import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Bell, Clock, Skull, Users, History, Settings, UserPlus, LogOut, Crown } from "lucide-react";
import { ReactNode, useState } from "react";
import AddBossModal from "./add-boss-modal";
import AddMemberModal from "./add-member-modal";
import { NotificationBanner } from "./notification-banner";
import { NotificationModal } from "./notification-modal";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
  onLogout?: () => void;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const [location] = useLocation();
  const [showAddBossModal, setShowAddBossModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const { notificationCount } = useNotifications();
  const { isLeader, isSystemAdmin, currentMember } = useAuth();

  const { data: bosses = [] } = useQuery<any[]>({
    queryKey: ["/api/bosses"],
  });

  const { data: members = [] } = useQuery<any[]>({
    queryKey: ["/api/members"],
  });

  const { data: activities = [] } = useQuery<any[]>({
    queryKey: ["/api/activities"],
  });

  const activeTimers = bosses.filter((boss: any) => !boss.isAlive);
  const bossesAlive = bosses.filter((boss: any) => boss.isAlive).length;
  const upcomingSpawns = activeTimers.filter((boss: any) => {
    if (!boss.lastKilledAt) return false;
    const killTime = new Date(boss.lastKilledAt).getTime();
    const respawnTime = killTime + (boss.respawnTimeHours * 60 * 60 * 1000);
    const timeLeft = respawnTime - Date.now();
    return timeLeft > 0 && timeLeft < 60 * 60 * 1000; // within 1 hour
  }).length;

  const getPageInfo = (path: string) => {
    switch (path) {
      case "/":
        return { title: "Dashboard", subtitle: "Monitor active boss timers and legion status" };
      case "/bosses":
        return { title: "Boss Management", subtitle: "Manage boss timers and spawns" };
      case "/members":
        return { title: "Legion Members", subtitle: "Manage legion member roster" };
      case "/history":
        return { title: "History", subtitle: "View past boss kills and spawns" };
      case "/settings":
        return { title: "Settings", subtitle: "Configure notifications and preferences" };
      default:
        return { title: "Legion Timer", subtitle: "Boss Management System" };
    }
  };

  const pageInfo = getPageInfo(location);

  const navItems = [
    { path: "/", icon: Clock, label: "Dashboard" },
    { path: "/bosses", icon: Skull, label: "Boss Timers" },
    { path: "/members", icon: Users, label: "Legion Members" },
    { path: "/history", icon: History, label: "History" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Modern Sidebar Navigation */}
      <div className="w-72 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col">
        {/* Modern Logo and Title */}
        <div className="p-8 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg">
              <img 
                src="/attached_assets/command-seal-generator-v0-e1dspn4ztp8e1_1757087364684.jpg" 
                alt="Legion Symbol" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center"><span class="text-black font-bold text-xl">⚔️</span></div>';
                  }
                }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">TGG14</h1>
              <p className="text-sm text-white/60">Legion Management</p>
            </div>
          </div>
        </div>
        
        {/* Modern Navigation Menu */}
        <nav className="flex-1 p-6">
          <ul className="space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={cn(
                      "flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                      isActive
                        ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-lg transform scale-105"
                        : "text-white/70 hover:bg-white/10 hover:text-white hover:transform hover:scale-105 hover:shadow-md"
                    )}
                    data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                  >
                    <Icon size={22} className={cn("transition-all duration-300 z-10", isActive ? "text-black" : "group-hover:scale-110 group-hover:text-white")} />
                    <span className="font-medium z-10">{item.label}</span>
                    {!isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Modern Quick Actions - Only for Leaders or System Admin */}
        {(isLeader || isSystemAdmin) && (
          <div className="p-6 border-t border-white/10 space-y-3">
            <button
              onClick={() => setShowAddBossModal(true)}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center space-x-2"
              data-testid="button-add-boss"
            >
              <Skull className="w-5 h-5" />
              <span>Add Boss</span>
            </button>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center space-x-2"
              data-testid="button-add-member"
            >
              <UserPlus className="w-5 h-5" />
              <span>Add Member</span>
            </button>
            <div className="w-full">
              <NotificationModal />
            </div>
          </div>
        )}
      </div>

      {/* Modern Main Content Area */}
      <div className="flex-1 overflow-auto">
        {/* Modern Header */}
        <header className="bg-black/30 backdrop-blur-xl border-b border-white/10 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">{pageInfo.title}</h2>
            <p className="text-white/60">{pageInfo.subtitle}</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Modern Stats */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
                <div className="text-yellow-400 font-bold text-xl" data-testid="stat-active-timers">{activeTimers.length}</div>
                <div className="text-white/60 text-xs">Active Timers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
                <div className="text-green-400 font-bold text-xl" data-testid="stat-bosses-alive">{bossesAlive}</div>
                <div className="text-white/60 text-xs">Alive</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
                <div className="text-blue-400 font-bold text-xl" data-testid="stat-members">{members.length}</div>
                <div className="text-white/60 text-xs">Members</div>
              </div>
            </div>
            
            {/* Modern Notifications */}
            <div className="relative">
              <button 
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 relative"
                data-testid="button-notifications"
              >
                <Bell size={20} className="text-white" />
                {notificationCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg"
                    data-testid="notification-count"
                  >
                    {notificationCount}
                  </span>
                )}
              </button>
            </div>
            
            {/* Modern User Avatar and Logout */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  {isSystemAdmin ? (
                    <span className="text-black font-bold text-sm">⚙️</span>
                  ) : isLeader ? (
                    <Crown className="w-5 h-5 text-black" />
                  ) : (
                    <span className="text-black font-bold text-sm">
                      {currentMember?.name?.charAt(0).toUpperCase() || "M"}
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-medium text-sm" data-testid="user-name">
                    {currentMember?.name || "Membro"}
                  </span>
                  <span className="text-xs text-white/60 flex items-center">
                    {isSystemAdmin && <span className="mr-1">⚙️</span>}
                    {isLeader && <Crown className="w-3 h-3 mr-1" />}
                    {isSystemAdmin ? "ADM do Sistema" : isLeader ? "Líder" : "Membro"}
                  </span>
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 hover:text-red-400 text-white transition-all duration-300"
                  title="Sair do Sistema"
                  data-testid="button-logout"
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Modern Page Content */}
        <main className="p-8 bg-gradient-to-b from-transparent to-black/10">
          {children}
        </main>
      </div>

      {/* Modals */}
      <AddBossModal 
        open={showAddBossModal} 
        onClose={() => setShowAddBossModal(false)} 
      />
      <AddMemberModal 
        open={showAddMemberModal} 
        onClose={() => setShowAddMemberModal(false)} 
      />
    </div>
  );
}
