import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Member } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, UserPlus, Edit, Trash, MessageCircle, Plus, Crown, Coins, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import AddMemberModal from "@/components/add-member-modal";
import ManageDkpModal from "@/components/manage-dkp-modal";
import EditProfileModal from "@/components/edit-profile-modal";

const classIcons = {
  ARQUEIRO: "🏹",
  GUERREIRO: "⚔️",
  MAGO: "🔮",
};

const statusColors = {
  online: "bg-green-600 text-white",
  offline: "bg-gray-600 text-white",
  away: "bg-yellow-600 text-white",
};

export default function Members() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDkpModal, setShowDkpModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isLeader, isSystemAdmin } = useAuth();
  const hasAdminAccess = isLeader || isSystemAdmin;

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await apiRequest("DELETE", `/api/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Member Removed",
        description: "Member has been removed from the legion.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  const updateMemberStatusMutation = useMutation({
    mutationFn: async ({ memberId, status }: { memberId: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/members/${memberId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Status Updated",
        description: "Member status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update member status",
        variant: "destructive",
      });
    },
  });

  const handleDeleteMember = (memberId: string) => {
    if (confirm("Are you sure you want to remove this member from the legion?")) {
      deleteMemberMutation.mutate(memberId);
    }
  };

  const handleStatusToggle = (member: Member) => {
    const statusCycle = ["online", "away", "offline"];
    const currentIndex = statusCycle.indexOf(member.status);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    
    updateMemberStatusMutation.mutate({
      memberId: member.id,
      status: nextStatus,
    });
  };

  const handleManageDkp = (member: any) => {
    setSelectedMember(member);
    setShowDkpModal(true);
  };

  const promoteToLeaderMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiRequest("PUT", `/api/members/${memberId}`, { role: "Líder" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Membro Promovido",
        description: "Membro foi promovido a líder com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao promover membro",
        variant: "destructive",
      });
    },
  });

  const demoteToMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiRequest("PUT", `/api/members/${memberId}`, { role: "Membro" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Líder Rebaixado",
        description: "Líder foi rebaixado a membro com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao rebaixar líder",
        variant: "destructive",
      });
    },
  });

  const handlePromoteToLeader = (member: any) => {
    if (confirm(`Tem certeza que deseja promover ${member.name} a líder?`)) {
      promoteToLeaderMutation.mutate(member.id);
    }
  };

  const handleDemoteToMember = (member: any) => {
    if (confirm(`Tem certeza que deseja rebaixar ${member.name} a membro?`)) {
      demoteToMemberMutation.mutate(member.id);
    }
  };

  const promoteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiRequest("PUT", `/api/members/${memberId}`, { 
        role: "Líder"
      });
      return response.json();
    },
    onSuccess: (updatedMember) => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Membro Promovido",
        description: `${updatedMember.name} foi promovido a Líder!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao promover membro",
        variant: "destructive",
      });
    },
  });

  const handlePromoteMember = (member: any) => {
    if (confirm(`Tem certeza que deseja promover ${member.name} a Líder?`)) {
      promoteMemberMutation.mutate(member.id);
    }
  };

  const promoteToViceLeaderMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiRequest("PUT", `/api/members/${memberId}`, { role: "Vice Líder" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Membro Promovido",
        description: "Membro foi promovido a Vice Líder com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao promover membro",
        variant: "destructive",
      });
    },
  });

  const demoteToViceLeaderMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiRequest("PUT", `/api/members/${memberId}`, { role: "Vice Líder" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Líder Rebaixado",
        description: "Líder foi rebaixado a Vice Líder com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao rebaixar líder",
        variant: "destructive",
      });
    },
  });

  const handlePromoteToViceLeader = (member: any) => {
    if (confirm(`Tem certeza que deseja promover ${member.name} a Vice Líder?`)) {
      promoteToViceLeaderMutation.mutate(member.id);
    }
  };

  const handleDemoteToViceLeader = (member: any) => {
    if (confirm(`Tem certeza que deseja rebaixar ${member.name} a Vice Líder?`)) {
      demoteToViceLeaderMutation.mutate(member.id);
    }
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-6 border border-border animate-pulse">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div>
                  <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-3xl font-bold text-white">Legion Members</h3>
          <p className="text-white/60">Manage your legion member roster</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => setShowEditProfileModal(true)} 
            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
            data-testid="button-edit-profile"
          >
            <Edit className="w-5 h-5 mr-2" />
            Editar Meu Perfil
          </Button>
          {hasAdminAccess && (
            <Button 
              onClick={() => setShowAddModal(true)} 
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
              data-testid="button-add-member-page"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Add Member
            </Button>
          )}
        </div>
      </div>

      {members.length === 0 ? (
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl">
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <User className="w-10 h-10 text-black" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No members yet</h3>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              Add your first legion member to start building your roster
            </p>
            {hasAdminAccess && (
              <Button 
                onClick={() => setShowAddModal(true)} 
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                data-testid="button-add-first-member"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Add Your First Member
              </Button>
            )}
          </div>
        </div>
      ) : hasAdminAccess ? (
        // Layout para líderes e admins - interface completa com edição
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.id} className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300 shadow-lg group" data-testid={`member-card-${member.id}`}>
              {/* Layout horizontal com todas as informações */}
              <div className="flex items-center justify-between">
                {/* Avatar e Info Principal */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">
                      {classIcons[member.class as keyof typeof classIcons] || "👤"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-xl text-white" data-testid={`member-name-${member.id}`}>
                        {member.name}
                      </h4>
                      {(member.role === "Líder" || member.role === "Vice Líder") && <Crown className="w-5 h-5 text-yellow-400" />}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-white/60" data-testid={`member-role-${member.id}`}>
                        {member.role}
                      </span>
                      <span className="text-white/40">•</span>
                      <span className="text-sm text-white font-medium" data-testid={`member-class-${member.id}`}>
                        {member.class}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Inline */}
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-yellow-400 font-bold text-lg" data-testid={`member-level-${member.id}`}>
                      {member.level}
                    </div>
                    <div className="text-white/60 text-xs">Nível</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-400 font-bold text-lg" data-testid={`member-power-${member.id}`}>
                      {member.poder?.toString() || '0'}
                    </div>
                    <div className="text-white/60 text-xs">Poder</div>
                  </div>
                  {/* DKP - Apenas para líderes e admins */}
                  {hasAdminAccess && (
                    <div className="text-center">
                      <div className="text-green-400 font-bold text-lg" data-testid={`member-dkp-${member.id}`}>
                        {member.dkp || 0}
                      </div>
                      <div className="text-white/60 text-xs">DKP</div>
                    </div>
                  )}
                  
                  {/* Status Badge - só líderes e admins podem alterar */}
                  {hasAdminAccess ? (
                    <button 
                      onClick={() => handleStatusToggle(member)}
                      data-testid={`member-status-${member.id}`}
                    >
                      <Badge 
                        className={cn(
                          statusColors[member.status as keyof typeof statusColors],
                          "cursor-pointer hover:opacity-80 transition-all duration-300 px-4 py-2 rounded-xl"
                        )}
                      >
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </Badge>
                    </button>
                  ) : (
                    <Badge 
                      className={cn(
                        statusColors[member.status as keyof typeof statusColors],
                        "px-4 py-2 rounded-xl"
                      )}
                      data-testid={`member-status-${member.id}`}
                    >
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions - Only for Leaders and Admins */}
              {hasAdminAccess && (
                <div className="flex justify-center space-x-2 pt-4 border-t border-white/10">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleManageDkp(member)}
                    className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-xl p-3"
                    title="Gerenciar DKP"
                    data-testid={`button-manage-dkp-${member.id}`}
                  >
                    <Coins className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl p-3"
                    title="Editar membro"
                    data-testid={`button-edit-member-${member.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {member.role === "Membro" ? (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handlePromoteToViceLeader(member)}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl p-3"
                        title="Promover a Vice Líder"
                        data-testid={`button-promote-vice-${member.id}`}
                      >
                        <Crown className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handlePromoteToLeader(member)}
                        className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-xl p-3"
                        title="Promover a Líder"
                        data-testid={`button-promote-leader-${member.id}`}
                      >
                        <Crown className="w-4 h-4" />
                      </Button>
                    </>
                  ) : member.role === "Vice Líder" ? (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handlePromoteToLeader(member)}
                        className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-xl p-3"
                        title="Promover a Líder"
                        data-testid={`button-promote-to-leader-${member.id}`}
                      >
                        <Crown className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDemoteToMember(member)}
                        className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-xl p-3"
                        title="Rebaixar a Membro"
                        data-testid={`button-demote-vice-${member.id}`}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDemoteToViceLeader(member)}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl p-3"
                        title="Rebaixar a Vice Líder"
                        data-testid={`button-demote-to-vice-${member.id}`}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDemoteToMember(member)}
                        className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-xl p-3"
                        title="Rebaixar a Membro"
                        data-testid={`button-demote-leader-${member.id}`}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteMember(member.id)}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl p-3"
                    title="Remover membro"
                    data-testid={`button-delete-member-${member.id}`}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        // Layout para membros comuns - formato de planilha simples
        <div className="space-y-4">
          <div className="flex justify-center">
            <Button 
              onClick={() => setShowEditProfileModal(true)} 
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
              data-testid="button-edit-profile-member"
            >
              <Edit className="w-5 h-5 mr-2" />
              Editar Meu Perfil
            </Button>
          </div>
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Personagem</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Cargo</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-white">Poder</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-white">DKP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-white/5 transition-colors duration-200" data-testid={`member-row-${member.id}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-lg">
                            {classIcons[member.class as keyof typeof classIcons] || "👤"}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-white" data-testid={`member-name-${member.id}`}>
                              {member.name}
                            </span>
                            {(member.role === "Líder" || member.role === "Vice Líder") && <Crown className="w-4 h-4 text-yellow-400" />}
                          </div>
                          <div className="text-sm text-white/60" data-testid={`member-class-${member.id}`}>
                            {member.class}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white" data-testid={`member-role-${member.id}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-blue-400 font-semibold" data-testid={`member-power-${member.id}`}>
                        {member.poder?.toString() || '0'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-green-400 font-semibold" data-testid={`member-dkp-${member.id}`}>
                        {member.dkp || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      <AddMemberModal open={showAddModal} onClose={() => setShowAddModal(false)} />
      <ManageDkpModal 
        open={showDkpModal} 
        onClose={() => {
          setShowDkpModal(false);
          setSelectedMember(null);
        }} 
        member={selectedMember}
      />
      <EditProfileModal 
        open={showEditProfileModal} 
        onClose={() => setShowEditProfileModal(false)} 
      />
    </div>
  );
}
