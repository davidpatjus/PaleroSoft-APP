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

  // Only admins can edit users
  if (user?.role !== "ADMIN") {
    return (
      <div className="space-y-6">
        <Alert className="border-red-200 bg-red-50 text-red-800">
          <AlertDescription className="text-red-700">
            You don&apos;t have permission to access this page.
          </AlertDescription>
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
      setSuccess("User updated successfully");
      setTimeout(() => {
        router.push("/users");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <Link href="/users" className="self-start">
          <Button variant="outline" size="sm" className="border-palero-blue1/30 text-palero-blue1 hover:bg-palero-blue1/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </Link>
      </div>
      
      {/* Header Section */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-palero-navy1">Edit User</h1>
        <p className="text-sm sm:text-base text-palero-navy2 mt-1">
          Update user information and permissions
        </p>
      </div>

      <div className="w-full max-w-4xl mx-auto">
        <Card className="bg-white/80 backdrop-blur-sm border-palero-blue1/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-palero-blue1/10 to-palero-teal1/10">
            <CardTitle className="text-palero-navy1">User Information</CardTitle>
            <CardDescription className="text-palero-navy2">
              Update the details for the selected user account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-palero-navy1 font-semibold">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="border-palero-blue1/30 focus:border-palero-teal1 focus:ring-palero-teal1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-palero-navy1 font-semibold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="border-palero-blue1/30 focus:border-palero-teal1 focus:ring-palero-teal1"
                    required
                  />
                </div>
              </div>

              {userData && (
                <div className="p-4 rounded-xl bg-palero-blue1/10 border border-palero-blue1/20">
                  <h3 className="text-sm font-semibold text-palero-navy1 mb-2">Current Role</h3>
                  <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    userData.role === 'ADMIN' ? 'bg-red-100 text-red-800 border-red-200' :
                    userData.role === 'TEAM_MEMBER' ? 'bg-palero-blue1/10 text-palero-blue2 border-palero-blue1/20' :
                    'bg-palero-green1/10 text-palero-green2 border-palero-green1/20'
                  }`}>
                    {userData.role === 'ADMIN' ? 'Admin' : 
                     userData.role === 'TEAM_MEMBER' ? 'Team Member' : 'Client'}
                  </div>
                  <p className="text-xs text-palero-navy2/70 mt-2">
                    Role changes require additional permissions and are not available in this form
                  </p>
                </div>
              )}

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-palero-green1/20 bg-palero-green1/10">
                  <AlertDescription className="text-palero-green2">{success}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-palero-blue1 hover:bg-palero-blue2 text-white disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isLoading ? "Updating..." : "Update User"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push("/users")}
                  className="border-palero-navy1/30 text-palero-navy1 hover:bg-palero-navy1/10 w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
