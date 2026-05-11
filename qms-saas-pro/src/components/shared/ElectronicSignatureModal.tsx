import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { performElectronicSignature } from '@/services/signatureService';
import type { SignatureType } from '@/types/qms';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ElectronicSignatureModalProps {
  open: boolean;
  onClose: () => void;
  onSign: (signatureData: { signatureHash: string; signedAt: string; signatureType: SignatureType }) => void;
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

  const handleConfirm = () => {
    if (!password.trim()) {
      setError('Password is required for electronic signature');
      return;
    }

    // Generate signature hash and log audit trail via service
    const { signatureHash } = performElectronicSignature(
      currentUser?.id || 'unknown',
      recordId,
      signatureType,
      recordTitle,
      currentUser?.email
    );

    // Call onSign callback
    onSign({
      signatureHash,
      signedAt: new Date().toISOString(),
      signatureType,
    });

    // Reset and close
    setPassword('');
    setReason('');
    setError(null);
    onClose();
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

          {/* Password Confirmation */}
          <div className="grid gap-2">
            <Label htmlFor="esig-password">Confirm Password *</Label>
            <Input
              id="esig-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="Enter your password to sign"
              autoComplete="off"
            />
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
                All signature events are recorded in the audit trail.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleConfirm} disabled={!password.trim()}>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Sign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
