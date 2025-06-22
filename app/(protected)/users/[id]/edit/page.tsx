"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, UserResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const userId = params?.id as string;

  const [userData, setUserData] = useState<UserResponse | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const fetchUser = async () => {
      try {
        const data = await apiClient.getUserById(userId);
        setUserData(data);
        setFullName(data.name);
        setEmail(data.email);
      } catch (err: any) {
        setError(err.message || "Failed to fetch user data");
      }
    };
    fetchUser();
  }, [userId]);

  // Solo admins pueden editar usuarios
  if (user?.role !== "ADMIN") {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>No tienes permiso para acceder a esta página.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      await apiClient.updateUser(userId, {
        fullName,
        email,
      });
      setSuccess("Usuario actualizado correctamente");
      setTimeout(() => {
        router.push("/users");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Error al actualizar el usuario");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/users">
        <Button variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Usuarios
        </Button>
      </Link>
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Usuario</h1>
          <p className="text-muted-foreground">Modifica los datos del usuario</p>
        </div>
      </div>
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
            <CardDescription>Actualiza los datos del usuario seleccionado</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Nombre completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Correo electrónico"
                    required
                  />
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <div className="flex space-x-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Actualizando..." : "Actualizar Usuario"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/users")}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
