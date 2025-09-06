import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMemberSchema, type InsertMember } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RegisterProps {
  onBackToLogin: () => void;
}

export default function Register({ onBackToLogin }: RegisterProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { login } = useAuth();

  const form = useForm<InsertMember>({
    resolver: zodResolver(insertMemberSchema),
    defaultValues: {
      name: "",
      password: "",
      level: 1,
      class: "GUERREIRO",
      poder: 0,
      role: "Membro",
      status: "online",
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async (data: InsertMember) => {
      const response = await apiRequest("POST", "/api/members", data);
      return response.json();
    },
    onSuccess: async (newMember) => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      
      toast({
        title: "Cadastro realizado!",
        description: "Bem-vindo à legião! Fazendo login...",
      });
      
      // Fazer login automaticamente após cadastro
      await login(newMember.name);
    },
    onError: (error: any) => {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Falha ao cadastrar membro",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = form.handleSubmit((data: InsertMember) => {
    createMemberMutation.mutate(data);
  });

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'url("/attached_assets/bg_story_01_1757081482180.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      color: '#ffffff',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        inset: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1
      }}></div>
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%)',
        padding: '2rem',
        borderRadius: '10px',
        border: '2px solid #ffd700',
        boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
        width: '100%',
        maxWidth: '500px',
        position: 'relative',
        zIndex: 2,
        backdropFilter: 'blur(5px)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#1a1a1a',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            border: '2px solid #ffd700'
          }}>
            <img 
              src="/attached_assets/command-seal-generator-v0-e1dspn4ztp8e1_1757081024512.jpg" 
              alt="Legion Symbol" 
              style={{
                width: '48px',
                height: '48px',
                objectFit: 'contain'
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<span style="color: #000; font-weight: bold; font-size: 18px;">TGG</span>';
                }
              }}
            />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
            Cadastro na Legião
          </h1>
          <p style={{ color: '#888', margin: 0 }}>
            Crie sua conta para entrar no sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <Label style={{ color: '#fff', marginBottom: '0.5rem', display: 'block' }}>
              Nome do Personagem
            </Label>
            <Input
              {...form.register("name")}
              placeholder="Digite o nome do seu personagem"
              style={{
                background: '#1a1a1a',
                border: '2px solid #333',
                color: '#fff'
              }}
              data-testid="register-input-name"
            />
            {form.formState.errors.name && (
              <p style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <Label style={{ color: '#fff', marginBottom: '0.5rem', display: 'block' }}>
                Level
              </Label>
              <Input
                type="number"
                min="1"
                max="999"
                {...form.register("level", { valueAsNumber: true })}
                style={{
                  background: '#1a1a1a',
                  border: '2px solid #333',
                  color: '#fff'
                }}
                data-testid="register-input-level"
              />
            </div>

            <div>
              <Label style={{ color: '#fff', marginBottom: '0.5rem', display: 'block' }}>
                Poder
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="27.50"
                {...form.register("poder", { valueAsNumber: true })}
                style={{
                  background: '#1a1a1a',
                  border: '2px solid #333',
                  color: '#fff'
                }}
                data-testid="register-input-poder"
              />
            </div>

            <div>
              <Label style={{ color: '#fff', marginBottom: '0.5rem', display: 'block' }}>
                Classe
              </Label>
              <Select
                value={form.watch("class")}
                onValueChange={(value) => form.setValue("class", value as "ARQUEIRO" | "GUERREIRO" | "MAGO")}
              >
                <SelectTrigger style={{ background: '#1a1a1a', border: '2px solid #333', color: '#fff' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARQUEIRO">ARQUEIRO</SelectItem>
                  <SelectItem value="GUERREIRO">GUERREIRO</SelectItem>
                  <SelectItem value="MAGO">MAGO</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          <div>
            <Label style={{ color: '#fff', marginBottom: '0.5rem', display: 'block' }}>
              Sua Senha Pessoal
            </Label>
            <Input
              type="password"
              {...form.register("password")}
              placeholder="Crie uma senha para seu login (mínimo 4 caracteres)"
              style={{
                background: '#1a1a1a',
                border: '2px solid #333',
                color: '#fff'
              }}
              data-testid="register-input-personal-password"
            />
            {form.formState.errors.password && (
              <p style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button
              type="button"
              onClick={onBackToLogin}
              variant="outline"
              style={{ flex: '1', background: 'transparent', border: '2px solid #ffd700', color: '#ffd700' }}
              data-testid="register-button-back"
            >
              Voltar
            </Button>
            <Button
              type="submit"
              disabled={createMemberMutation.isPending}
              style={{ 
                flex: '1', 
                background: '#ffd700', 
                color: '#000',
                border: 'none'
              }}
              data-testid="register-button-submit"
            >
              {createMemberMutation.isPending ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>
            Já tem conta? Clique em "Voltar" para fazer login
          </p>
        </div>
      </div>
    </div>
  );
}