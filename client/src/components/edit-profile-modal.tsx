import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ open, onClose }: EditProfileModalProps) {
  const { currentMember } = useAuth();
  const [level, setLevel] = useState(currentMember?.level?.toString() || "");
  const [poder, setPoder] = useState(currentMember?.poder?.toString() || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { level: number; poder: number }) => {
      const response = await fetch(`/api/members/self/${currentMember?.name}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Falha ao atualizar perfil");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Perfil Atualizado",
        description: "Seus dados foram atualizados com sucesso!",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar perfil",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const levelNum = parseInt(level);
    const poderNum = parseFloat(poder);
    
    if (isNaN(levelNum) || levelNum < 1 || levelNum > 999) {
      toast({
        title: "Erro",
        description: "Nível deve ser um número entre 1 e 999",
        variant: "destructive",
      });
      return;
    }
    
    if (isNaN(poderNum) || poderNum < 0) {
      toast({
        title: "Erro",
        description: "Poder deve ser um número positivo",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({
      level: levelNum,
      poder: poderNum,
    });
  };

  const handleClose = () => {
    if (!updateProfileMutation.isPending) {
      setLevel(currentMember?.level?.toString() || "");
      setPoder(currentMember?.poder?.toString() || "");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-black/90 backdrop-blur-xl border border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-white">
            Editar Meu Perfil
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="level" className="text-white/80">
                Nível (1-999)
              </Label>
              <Input
                id="level"
                type="number"
                min="1"
                max="999"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-yellow-400"
                placeholder="Digite seu nível"
                required
                data-testid="input-level"
              />
            </div>

            <div>
              <Label htmlFor="poder" className="text-white/80">
                Poder (ex: 27.056)
              </Label>
              <Input
                id="poder"
                type="number"
                min="0"
                step="0.001"
                value={poder}
                onChange={(e) => setPoder(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-yellow-400"
                placeholder="Digite seu poder (ex: 27.056)"
                required
                data-testid="input-poder"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateProfileMutation.isPending}
              className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10"
              data-testid="button-cancel-edit-profile"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium"
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}