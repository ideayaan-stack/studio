'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { sendEmail, initializeEmailJS } from '@/lib/email-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export default function TestEmailPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [configStatus, setConfigStatus] = useState<{
        serviceId: boolean;
        templateId: boolean;
        publicKey: boolean;
    }>({ serviceId: false, templateId: false, publicKey: false });

    const [formData, setFormData] = useState({
        to_email: '',
        to_name: 'Test User',
        subject: 'Test Email from Ideayaan Studio',
        message: 'This is a test email to verify the notification system is working correctly.',
    });

    useEffect(() => {
        // Initialize EmailJS
        initializeEmailJS();

        // Check config status
        setConfigStatus({
            serviceId: !!process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
            templateId: !!process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
            publicKey: !!process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
        });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await sendEmail({
                to_email: formData.to_email,
                to_name: formData.to_name,
                subject: formData.subject,
                message: formData.message,
                task_title: 'Test Task',
                task_deadline: '2023-12-31',
                assigner_name: 'Admin',
            });

            if (result.success) {
                toast({
                    title: 'Email Sent Successfully',
                    description: `Test email sent to ${formData.to_email}`,
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Failed to Send Email',
                    description: result.error || 'Unknown error occurred',
                });
            }
        } catch (error: any) {
            console.error('Test email error:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'An unexpected error occurred',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-headline mb-2">Email System Diagnostic</h1>
                <p className="text-muted-foreground">
                    Use this page to test and debug the EmailJS integration.
                </p>
            </div>

            <div className="grid gap-6">
                {/* Configuration Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Configuration Status
                        </CardTitle>
                        <CardDescription>
                            Checking environment variables for EmailJS.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className={`p-3 rounded-lg border flex items-center gap-2 ${configStatus.serviceId ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                {configStatus.serviceId ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                <span className="text-sm font-medium">Service ID</span>
                            </div>
                            <div className={`p-3 rounded-lg border flex items-center gap-2 ${configStatus.templateId ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                {configStatus.templateId ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                <span className="text-sm font-medium">Template ID</span>
                            </div>
                            <div className={`p-3 rounded-lg border flex items-center gap-2 ${configStatus.publicKey ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                {configStatus.publicKey ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                <span className="text-sm font-medium">Public Key</span>
                            </div>
                        </div>
                        {(!configStatus.serviceId || !configStatus.templateId || !configStatus.publicKey) && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Missing Configuration</AlertTitle>
                                <AlertDescription>
                                    Some EmailJS environment variables are missing. Please check your .env.local file.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Test Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Send Test Email</CardTitle>
                        <CardDescription>
                            Send a real email to verify the integration.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSend} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="to_name">Recipient Name</Label>
                                    <Input
                                        id="to_name"
                                        name="to_name"
                                        value={formData.to_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="to_email">Recipient Email</Label>
                                    <Input
                                        id="to_email"
                                        name="to_email"
                                        type="email"
                                        value={formData.to_email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows={4}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Test Email'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
