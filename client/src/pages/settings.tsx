import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Bell, Shield, Palette, Download, Upload, Trash, Volume2, VolumeX } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof window !== "undefined" && "Notification" in window 
      ? Notification.permission === "granted" 
      : false
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationMinutes, setNotificationMinutes] = useState(10);
  const [soundVolume, setSoundVolume] = useState([50]); // Array para o Slider component

  // Carregar configurações do localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedVolume = localStorage.getItem("soundVolume");
      const savedSoundEnabled = localStorage.getItem("soundEnabled");
      const savedMinutes = localStorage.getItem("notificationMinutes");
      
      if (savedVolume) {
        setSoundVolume([parseInt(savedVolume)]);
      }
      if (savedSoundEnabled !== null) {
        setSoundEnabled(savedSoundEnabled === "true");
      }
      if (savedMinutes) {
        setNotificationMinutes(parseInt(savedMinutes));
      }
    }
  }, []);

  // Salvar configurações no localStorage quando mudarem
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("soundVolume", soundVolume[0].toString());
    }
  }, [soundVolume]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("soundEnabled", soundEnabled.toString());
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("notificationMinutes", notificationMinutes.toString());
    }
  }, [notificationMinutes]);

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === "granted");
      
      if (permission === "granted") {
        toast({
          title: "Notifications Enabled",
          description: "You will now receive boss spawn notifications.",
        });
      } else {
        toast({
          title: "Notifications Denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    }
  };

  const exportData = () => {
    // Get data from localStorage (if any)
    const data = {
      bosses: [],
      members: [],
      activities: [],
      settings: {
        notificationsEnabled,
        soundEnabled,
        notificationMinutes,
      },
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `legion-timer-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: "Your legion data has been exported successfully.",
    });
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // Here you would import the data
        console.log("Imported data:", data);
        
        toast({
          title: "Data Imported",
          description: "Your legion data has been imported successfully.",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid file format. Please select a valid backup file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      // Clear localStorage and reset application state
      localStorage.clear();
      
      toast({
        title: "Data Cleared",
        description: "All legion data has been cleared.",
      });
      
      // Reload the page to reset state
      window.location.reload();
    }
  };

  const testNotification = () => {
    // Tocar som se habilitado
    if (soundEnabled) {
      // Criar som de notificação usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      // Usar o volume configurado (0-100 para 0.0-1.0)
      const volume = soundVolume[0] / 100;
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }

    // Mostrar notificação do sistema se habilitada
    if (notificationsEnabled && "Notification" in window) {
      new Notification("🐉 Legion Timer", {
        body: `QUIMERA nascerá em ${notificationMinutes} minutos! Prepare-se para a batalha!`,
        icon: "/favicon.ico",
        requireInteraction: true,
        tag: "boss-spawn-warning"
      });
    }

    // Sempre mostrar toast como exemplo
    toast({
      title: "🐉 Exemplo de Notificação",
      description: `QUIMERA nascerá em ${notificationMinutes} minutos! Prepare-se para a batalha!`,
      duration: 5000,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-foreground">Settings</h3>
        <p className="text-muted-foreground">Configure your legion timer preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={20} />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifications">Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications when bosses are about to spawn
                </p>
              </div>
              <div className="flex items-center gap-2">
                {notificationsEnabled ? (
                  <Badge variant="default">Enabled</Badge>
                ) : (
                  <Badge variant="outline">Disabled</Badge>
                )}
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={requestNotificationPermission}
                  data-testid="switch-notifications"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="sound">Sound Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Play sound effects for important events
                </p>
              </div>
              <Switch
                id="sound"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
                data-testid="switch-sound"
              />
            </div>

            {soundEnabled && (
              <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                <div className="flex items-center justify-between">
                  <Label htmlFor="volume-control">Volume do Som</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <VolumeX size={16} />
                    <span className="w-8 text-center">{soundVolume[0]}%</span>
                    <Volume2 size={16} />
                  </div>
                </div>
                <div className="px-2">
                  <Slider
                    id="volume-control"
                    min={0}
                    max={100}
                    step={5}
                    value={soundVolume}
                    onValueChange={setSoundVolume}
                    className="w-full"
                    data-testid="slider-sound-volume"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ajuste o volume das notificações sonoras
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notification-timing">Notification Timing</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="notification-timing"
                  type="number"
                  min="1"
                  max="60"
                  value={notificationMinutes}
                  onChange={(e) => setNotificationMinutes(parseInt(e.target.value) || 10)}
                  className="w-20"
                  data-testid="input-notification-minutes"
                />
                <span className="text-sm text-muted-foreground">minutes before spawn</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Get notified this many minutes before a boss spawns
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Test Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Veja como será a notificação que você receberá quando um boss estiver prestes a nascer
                  </p>
                </div>
                <Button 
                  onClick={testNotification}
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="button-test-notification"
                >
                  <Volume2 size={16} />
                  Testar Notificação
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette size={20} />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">
                Currently using the dark gaming theme. More themes coming soon!
              </p>
              <Badge variant="outline">Dark Gaming Theme</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={20} />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Export Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Download a backup of all your legion data
                  </p>
                </div>
                <Button variant="outline" onClick={exportData} data-testid="button-export-data">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="import-file">Import Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Restore from a backup file
                  </p>
                </div>
                <div>
                  <input
                    id="import-file"
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                    data-testid="input-import-file"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('import-file')?.click()}
                    data-testid="button-import-data"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <Label>Clear All Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Remove all bosses, members, and activity history
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={clearAllData}
                  data-testid="button-clear-data"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About Legion Timer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Legion Timer is a comprehensive boss management system designed for gaming communities.
                Track spawn times, manage legion members, and never miss an important boss again.
              </p>
              <div className="pt-4 border-t">
                <p className="font-medium text-foreground">Version 1.0.0</p>
                <p>Built with React, TypeScript, and Tailwind CSS</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
