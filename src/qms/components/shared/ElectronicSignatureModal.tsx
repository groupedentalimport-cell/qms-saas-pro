'use client';

import React, { useState } from 'react';
import { useAuth } from '@/qms/contexts/AuthContext';
import { createSignatureRecord } from '@/qms/services/compliance/signatureEngine';
import type { SignatureType } from '@/qms/types/qms';
import { AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/qms/components/ui/button';
import { Input } from '@/qms/components/ui/input';
import { Badge } from '@/qms/components/ui/badge';
import { Label } from '@/qms/components/ui/label';
import { Textarea } from '@/qms/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/qms/components/ui/dialog';
import { cn } from '@/qms/lib/utils';
import { ComplianceError, COMPLIANCE_CODES } from '@/qms/lib/errors';

interface ElectronicSignatureModalProps {
  open: boolean;
  onClose: () => void;
  onSign: (signatureData: {
    signatureHash: string;
    signedAt: string;
    signatureType: SignatureType;
    reason?: string;
  }) => void;
  recordTitle: string;
  recordId: string;
  signatureType: SignatureType;
}

const signatureTypeLabels: Record<SignatureType, string> = {
  approval: 'Approval',
  rejection: 'Rejection',
  review: 'Review',
  verification: 'Verification',
};

const signatureTypeColors: Record<SignatureType, string> = {
  approval: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejection: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  review: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  verification: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

/**
 * Verifies the user's password before allowing an electronic signature.
 *
 * In production mode (Supabase configured): delegates to Supabase Auth
 * (signInWithPassword) for real credential verification.
 *
 * In demo mode: verifies against the demo user's known password
 * ("demo" for all demo accounts) to simulate the re-authentication flow.
 * This ensures the signing workflow is always exercised, even in demo.
 */
async function verifyUserPassword(
  email: string,
  password: string,
  _userId: string
): Promise<{ success: boolean; error?: string }> {
  // In production mode, use Supabase Auth for real verification
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey &&
      !supabaseUrl.includes('your-project') &&
      !supabaseKey.includes('your-')) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { success: false, error: 'Invalid credentials. Please try again.' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Authentication service unavailable.' };
    }
  }

  // Demo mode: verify against known demo password
  // All demo accounts use "demo" as password for testing purposes
  if (password === 'demo') {
    return { success: true };
  }

  return { success: false, error: 'Invalid password. In demo mode, use "demo" as password.' };
}

export function ElectronicSignatureModal({
  open,
  onClose,
  onSign,
  recordTitle,
  recordId,
  signatureType,
}: ElectronicSignatureModalProps) {
  const { currentUser } = useAuth();

  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleConfirm = async () => {
    // --- Pre-validation ---
    if (!password.trim()) {
      setError('Password is required for electronic signature (21 CFR §11.200)');
      return;
    }

    if (!currentUser) {
      setError('No authenticated user found. You must be logged in to sign.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // --- Step 1: Re-authenticate the user (21 CFR §11.200 requirement) ---
      const verification = await verifyUserPassword(
        currentUser.email,
        password,
        currentUser.id
      );

      if (!verification.success) {
        setError(verification.error || 'Authentication failed. Please try again.');
        setIsVerifying(false);
        return;
      }

      // --- Step 2: Create the signature record with verified identity ---
      const signature = await createSignatureRecord({
        userId: currentUser.id, // Always a real user ID, never 'unknown'
        recordId,
        signatureType,
        signerName: currentUser.fullName || currentUser.email,
        signerRole: currentUser.role,
        passwordConfirmation: password, // Verified password used as nonce input
      });

      // --- Step 3: Call onSign with full signature data including reason ---
      onSign({
        signatureHash: signature.signatureHash,
        signedAt: signature.createdAt,
        signatureType,
        reason: reason.trim() || undefined,
      });

      // Reset and close
      setPassword('');
      setReason('');
      setError(null);
      onClose();
    } catch (err) {
      if (err instanceof ComplianceError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during signing.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]" role="dialog" aria-modal="true" aria-labelledby="esig-title">
        <DialogHeader>
          <DialogTitle id="esig-title" className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Electronic Signature Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bilingual subtitle */}
          <p className="text-sm text-muted-foreground">Signature électronique requise</p>

          {/* Record Information */}
          <div className="bg-muted/30 rounded-md p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Record:</span>
              <span className="text-sm font-medium truncate max-w-[280px]">{recordTitle}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Record ID:</span>
              <span className="text-sm font-mono text-xs">{recordId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Signer:</span>
              <span className="text-sm font-medium">{currentUser?.fullName || currentUser?.email || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Signature Type:</span>
              <Badge className={cn(signatureTypeColors[signatureType])} variant="secondary">
                {signatureTypeLabels[signatureType]}
              </Badge>
            </div>
          </div>

          {/* Password Confirmation — Re-authentication required per 21 CFR §11.200 */}
          <div className="grid gap-2">
            <Label htmlFor="esig-password">Confirm Password * <span className="text-xs text-muted-foreground">(re-authentication required)</span></Label>
            <Input
              id="esig-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="Enter your password to sign"
              autoComplete="off"
              disabled={isVerifying}
            />
            <p className="text-xs text-muted-foreground">
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Your account password will be verified.' : 'Demo mode: use "demo" as password.'}
            </p>
          </div>

          {/* Reason / Comment */}
          <div className="grid gap-2">
            <Label htmlFor="esig-reason">Reason / Comment</Label>
            <Textarea
              id="esig-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for this signature..."
              rows={2}
              disabled={isVerifying}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* 21 CFR Part 11 Compliance Warning */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-700 dark:text-amber-400">
              <p className="font-medium">21 CFR Part 11 Compliance</p>
              <p className="mt-1">
                This electronic signature is legally binding and equivalent to a handwritten signature.
                By signing, you confirm your identity and intent to sign this record.
                Your password has been verified and all signature events are recorded in the audit trail.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose} disabled={isVerifying}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleConfirm} disabled={!password.trim() || isVerifying}>
              {isVerifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4 mr-2" />
              )}
              {isVerifying ? 'Verifying...' : 'Sign'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
