'use client';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Lightbulb, Loader2 } from "lucide-react";
import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Role } from "@/lib/types";

export default function LoginPage() {
  const { signUp, signIn, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Volunteer');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      if (error instanceof FirebaseError && error.code === 'auth/user-not-found') {
        try {
          await signUp(email, password, role);
        } catch (signupError) {
          console.error("Sign up error:", signupError);
          toast({
            variant: "destructive",
            title: "Sign-up Failed",
            description: "Could not create a new account. Please try again.",
          });
        }
      } else {
        console.error("Sign in error:", error);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid email or password. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    router.push('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lightbulb className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-headline font-bold text-primary">Ideayaan</h1>
          </div>
          <CardTitle className="text-2xl font-headline">Welcome</CardTitle>
          <CardDescription>
            Enter your credentials to sign in or create an account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="m@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <Link
                href="#"
                className="ml-auto inline-block text-sm underline"
              >
                Forgot your password?
              </Link>
            </div>
            <Input 
              id="password" 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select onValueChange={(value) => setRole(value as Role)} defaultValue="Volunteer" disabled={isLoading}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Core">Core</SelectItem>
                <SelectItem value="Semi-core">Semi-core</SelectItem>
                <SelectItem value="Head">Head</SelectItem>
                <SelectItem value="Volunteer">Volunteer</SelectItem>
              </SelectContent>
            </Select>
          </div>
            <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Sign In / Sign Up'}
            </Button>
          <Separator className="my-4" />
          <div className="text-center text-sm text-muted-foreground">
            Ideayaan is an internal tool. Public signup is not available.
            <br />
            Please contact a core team member for access.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
