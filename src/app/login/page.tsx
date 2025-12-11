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
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { signIn, user, loading, authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please enter both email and password.",
      });
      return;
    }
    setIsLoading(true);
    try {
      await signIn(email, password);
      // Let the useEffect handle redirection
    } catch (error) {
      const firebaseError = error as FirebaseError;
      let title = "Authentication Failed";
      let description = "An unexpected error occurred. Please try again.";

      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/invalid-credential') {
        title = "Invalid Credentials";
        description = "The email or password you entered is incorrect. Please contact a Core team member if you need an account.";
      } else if (firebaseError.code === 'auth/invalid-email') {
        title = "Invalid Email";
        description = "Please enter a valid email address.";
      }

      toast({
        variant: "destructive",
        title,
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // This page should not be accessible if the user is already logged in and not in a loading state.
  // Use authLoading to check if we know the user state, ignoring profile loading for now.
  if (user && !authLoading) {
    // router.push is handled in useEffect
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
        <p className="ml-2">Redirecting to dashboard...</p>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-border/50 bg-card/60 backdrop-blur-xl">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex items-center justify-center gap-2 mb-2 h-20">
            {/* Logo for Light Mode */}
            <div className="relative h-20 w-full max-w-[200px] dark:hidden">
              <Image
                src="/logo-light.png"
                alt="Ideayaan Logo"
                fill
                className="object-contain object-center"
                priority
              />
            </div>
            {/* Logo for Dark Mode */}
            <div className="relative h-20 w-full max-w-[200px] hidden dark:block">
              <Image
                src="/logo-dark.png"
                alt="Ideayaan Logo"
                fill
                className="object-contain object-center"
                priority
              />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-headline font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-base">
              Enter your credentials to access your dashboard.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="h-11 bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
              className="h-11 bg-background/50"
            />
          </div>
          <Button
            className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
          </Button>
          <div className="text-center text-xs text-muted-foreground pt-4">
            Ideayaan is an internal tool. Please contact a core team member if you have trouble logging in.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
