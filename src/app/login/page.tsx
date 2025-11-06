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
import { useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Role, Team } from "@/lib/types";
import { collection, getDocs, query } from "firebase/firestore";

export default function LoginPage() {
  const { signUp, signIn, user, db } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Volunteer');
  const [teamId, setTeamId] = useState<string | undefined>(undefined);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (role !== 'Core' && db) {
      const fetchTeams = async () => {
        const teamsQuery = query(collection(db, "teams"));
        const querySnapshot = await getDocs(teamsQuery);
        const fetchedTeams: Team[] = [];
        querySnapshot.forEach((doc) => {
          fetchedTeams.push({ id: doc.id, ...doc.data() } as Team);
        });
        setTeams(fetchedTeams);
      };
      fetchTeams();
    }
  }, [role, db]);

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      if (isSigningUp) {
        // Sign up logic
        if (role !== 'Core' && !teamId) {
            toast({
                variant: "destructive",
                title: "Team Required",
                description: "Please select a team for your role.",
            });
            setIsLoading(false);
            return;
        }
        await signUp(email, password, role, teamId);
        toast({
          title: "Account Created",
          description: "You've been successfully signed up!",
        });
      } else {
        // Sign in logic
        await signIn(email, password);
      }
      // On success, router will redirect via the useEffect below
    } catch (error) {
      const firebaseError = error as FirebaseError;
      let title = "Authentication Failed";
      let description = "An unexpected error occurred. Please try again.";

      if (firebaseError.code === 'auth/user-not-found') {
        title = "User Not Found";
        description = "No account found with this email. Please sign up instead.";
      } else if (firebaseError.code === 'auth/wrong-password') {
        title = "Incorrect Password";
        description = "The password you entered is incorrect. Please try again.";
      } else if (firebaseError.code === 'auth/email-already-in-use') {
        title = "Email In Use";
        description = "This email is already registered. Please sign in.";
      } else if (firebaseError.code === 'auth/weak-password') {
          title = "Weak Password";
          description = "Password should be at least 6 characters.";
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


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lightbulb className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-headline font-bold text-primary">Ideayaan</h1>
          </div>
          <CardTitle className="text-2xl font-headline">{isSigningUp ? 'Create an Account' : 'Welcome Back'}</CardTitle>
          <CardDescription>
            {isSigningUp ? 'Fill in your details to join your team.' : 'Enter your credentials to sign in.'}
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
              {!isSigningUp && (
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              )}
            </div>
            <Input 
              id="password" 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
           {isSigningUp && (
            <>
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
              {role !== 'Core' && teams.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="team">Team</Label>
                  <Select onValueChange={(value) => setTeamId(value)} disabled={isLoading || teams.length === 0}>
                    <SelectTrigger id="team">
                      <SelectValue placeholder="Select your team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
           )}
            <Button className="w-full" onClick={handleAuth} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : (isSigningUp ? 'Sign Up' : 'Sign In')}
            </Button>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or
                    </span>
                </div>
            </div>
             <Button variant="outline" className="w-full" onClick={() => setIsSigningUp(!isSigningUp)} disabled={isLoading}>
                {isSigningUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
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
