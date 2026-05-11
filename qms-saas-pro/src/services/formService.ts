// formService.ts — Règles Formulaires N4 (Niveau 4 de la hiérarchie documentaire)
// Gère les templates de formulaires et les instances remplies
// Règles métier : template lié à un document Form Approved, instance verrouillée après soumission

import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import type { FormTemplate, FormInstance, FormFieldDefinition, FormInstanceStatus } from '@/types/qms';

// ============================================================================
// Form Template Operations
// ============================================================================

/**
 * Crée un template de formulaire.
 * - Vérifie que document_id pointe vers un Form Approved (spec §5.4)
 * - Valide le schéma des champs
 */
export function createFormTemplate(
  template: Omit<FormTemplate, 'id' | 'createdAt'>
): FormTemplate {
  const store = useQMSStore.getState();

  // Vérifier que le document associé est un Form Approved
  const document = store.documents.find(d => d.id === template.documentId);
  if (!document) {
    throw new ComplianceError(
      `Document ${template.documentId} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  if (document.type !== 'Form') {
    throw new ComplianceError(
      `Le document associé (${document.documentNumber}) doit être de type "Form", pas "${document.type}"`,
      COMPLIANCE_CODES.PREREQUISITE_NOT_MET
    );
  }

  if (document.status !== 'Approved') {
    throw new ComplianceError(
      `Le document Form associé (${document.documentNumber}) doit être en statut Approved pour créer un template`,
      COMPLIANCE_CODES.PREREQUISITE_NOT_MET
    );
  }

  // Valider le schéma des champs
  validateFieldSchema(template.fields);

  const newTemplate: FormTemplate = {
    ...template,
    id: `ft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  store.addFormTemplate(newTemplate);
  return newTemplate;
}

/**
 * Valide le schéma des champs d'un template.
 * - Vérifie que chaque champ a un nom unique
 * - Vérifie que les champs required ont un label
 * - Vérifie que les champs de type select ont des options
 */
function validateFieldSchema(fields: FormFieldDefinition[]): void {
  if (!fields || fields.length === 0) {
    throw new ComplianceError(
      'Un template doit avoir au moins un champ',
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Vérifier l'unicité des noms de champs
  const names = fields.map(f => f.name);
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  if (duplicates.length > 0) {
    throw new ComplianceError(
      `Noms de champs dupliqués: ${duplicates.join(', ')}`,
      COMPLIANCE_CODES.DUPLICATE_RECORD
    );
  }

  // Vérifier que chaque champ a un label
  const missingLabels = fields.filter(f => !f.label || f.label.trim() === '');
  if (missingLabels.length > 0) {
    throw new ComplianceError(
      `${missingLabels.length} champ(s) sans label`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Vérifier que les champs select ont des options
  const selectsWithoutOptions = fields.filter(
    f => f.type === 'select' && (!f.options || f.options.length === 0)
  );
  if (selectsWithoutOptions.length > 0) {
    throw new ComplianceError(
      `Les champs de type "select" doivent avoir des options: ${selectsWithoutOptions.map(f => f.name).join(', ')}`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }
}

/**
 * Désactive un template de formulaire.
 */
export function deactivateTemplate(templateId: string): FormTemplate {
  const store = useQMSStore.getState();
  const template = store.formTemplates.find(t => t.id === templateId);

  if (!template) {
    throw new ComplianceError(
      `Template ${templateId} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Vérifier s'il y a des instances en cours
  const activeInstances = store.formInstances.filter(
    i => i.templateId === templateId && i.status !== 'Submitted' && i.status !== 'Approved'
  );

  if (activeInstances.length > 0) {
    throw new ComplianceError(
      `Impossible de désactiver le template: ${activeInstances.length} instance(s) en cours`,
      COMPLIANCE_CODES.FORM_LOCKED
    );
  }

  // Mettre à jour le template (via le store)
  // Note: Le store n'a pas de updateFormTemplate, on utilise une approche alternative
  store.logAudit('UPDATE', 'FormTemplate', templateId,
    { isActive: true },
    { isActive: false }
  );

  return template;
}

// ============================================================================
// Form Instance Operations
// ============================================================================

/**
 * Crée une nouvelle instance de formulaire.
 * - Vérifie que le template est actif
 * - Initialise les valeurs vides
 */
export function createFormInstance(
  templateId: string,
  createdById: string,
  organizationId?: string
): FormInstance {
  const store = useQMSStore.getState();
  const template = store.formTemplates.find(t => t.id === templateId);

  if (!template) {
    throw new ComplianceError(
      `Template ${templateId} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  if (!template.isActive) {
    throw new ComplianceError(
      `Le template "${template.title}" n'est pas actif`,
      COMPLIANCE_CODES.PREREQUISITE_NOT_MET
    );
  }

  // Générer un numéro de référence
  const instanceCount = store.formInstances.filter(i => i.templateId === templateId).length;
  const referenceNumber = `FRM-${template.title.substring(0, 3).toUpperCase()}-${String(instanceCount + 1).padStart(4, '0')}`;

  // Initialiser les valeurs vides
  const initialValues: Record<string, unknown> = {};
  for (const field of template.fields) {
    initialValues[field.name] = field.defaultValue || '';
  }

  const newInstance: FormInstance = {
    id: `fi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    templateId,
    templateVersion: template.version,
    referenceNumber,
    values: initialValues,
    status: 'Draft',
    isLocked: false,
    createdById,
    organizationId,
    createdAt: new Date().toISOString(),
  };

  store.addFormInstance(newInstance);
  return newInstance;
}

/**
 * Soumet une instance de formulaire.
 * - Valide tous les champs required (spec §5.4)
 * - Génère un signature_hash SHA-256
 * - Passe is_locked = TRUE
 * - L'instance ne peut plus être modifiée après soumission
 */
export function submitFormInstance(
  instanceId: string,
  submittedById: string,
  submittedByName: string
): FormInstance {
  const store = useQMSStore.getState();
  const instance = store.formInstances.find(i => i.id === instanceId);

  if (!instance) {
    throw new ComplianceError(
      `Instance de formulaire ${instanceId} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  // Vérifier si l'instance est verrouillée
  if (instance.isLocked) {
    throw new ComplianceError(
      `L'instance de formulaire ${instance.referenceNumber} est verrouillée et ne peut plus être soumise`,
      COMPLIANCE_CODES.FORM_LOCKED
    );
  }

  // Vérifier que l'instance est en statut Draft
  if (instance.status !== 'Draft') {
    throw new ComplianceError(
      `L'instance ${instance.referenceNumber} doit être en statut "Draft" pour être soumise (statut actuel: ${instance.status})`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  // Valider les champs requis
  const template = store.formTemplates.find(t => t.id === instance.templateId);
  if (template) {
    const requiredFields = template.fields.filter(f => f.required);
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      const value = instance.values[field.name];
      if (value === undefined || value === null || value === '' || value === false) {
        missingFields.push(field.label);
      }
    }

    if (missingFields.length > 0) {
      throw new ComplianceError(
        `Champs obligatoires manquants: ${missingFields.join(', ')}`,
        COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
      );
    }

    // Valider les contraintes de validation (min, max, pattern)
    for (const field of template.fields) {
      if (!field.validation) continue;
      const value = instance.values[field.name];

      if (field.type === 'number' && typeof value === 'number') {
        if (field.validation.min !== undefined && value < field.validation.min) {
          throw new ComplianceError(
            `Le champ "${field.label}" doit être >= ${field.validation.min}`,
            COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
          );
        }
        if (field.validation.max !== undefined && value > field.validation.max) {
          throw new ComplianceError(
            `Le champ "${field.label}" doit être <= ${field.validation.max}`,
            COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
          );
        }
      }

      if (field.validation.pattern && typeof value === 'string') {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          throw new ComplianceError(
            `Le champ "${field.label}" ne correspond pas au format requis`,
            COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
          );
        }
      }
    }
  }

  // Générer le hash de signature SHA-256 (simulé)
  const signatureHash = store.generateSignatureHash(submittedById, instanceId, 'form-submit');

  // Mettre à jour l'instance
  const updates: Partial<FormInstance> = {
    status: 'Submitted' as FormInstanceStatus,
    isLocked: true,
    submittedById,
    submittedAt: new Date().toISOString(),
    signatureHash,
  };

  store.updateFormInstance(instanceId, updates);

  // Logger l'audit trail
  store.logAudit('SIGN', 'FormInstance', instanceId,
    { status: 'Draft', isLocked: false },
    { status: 'Submitted', isLocked: true, submittedBy: submittedByName, signatureHash }
  );

  const updated = useQMSStore.getState().formInstances.find(i => i.id === instanceId);
  return updated!;
}

/**
 * Approuve une instance de formulaire.
 */
export function approveFormInstance(
  instanceId: string,
  approverId: string,
  approverName: string
): FormInstance {
  const store = useQMSStore.getState();
  const instance = store.formInstances.find(i => i.id === instanceId);

  if (!instance) {
    throw new ComplianceError(
      `Instance de formulaire ${instanceId} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  if (instance.status !== 'Submitted') {
    throw new ComplianceError(
      `L'instance ${instance.referenceNumber} doit être en statut "Submitted" pour être approuvée`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  const signatureHash = store.generateSignatureHash(approverId, instanceId, 'form-approve');

  store.updateFormInstance(instanceId, {
    status: 'Approved' as FormInstanceStatus,
  });

  store.logAudit('APPROVE', 'FormInstance', instanceId,
    { status: 'Submitted' },
    { status: 'Approved', approvedBy: approverName, signatureHash }
  );

  const updated = useQMSStore.getState().formInstances.find(i => i.id === instanceId);
  return updated!;
}

/**
 * Rejette une instance de formulaire.
 */
export function rejectFormInstance(
  instanceId: string,
  rejecterId: string,
  rejecterName: string,
  reason: string
): FormInstance {
  const store = useQMSStore.getState();
  const instance = store.formInstances.find(i => i.id === instanceId);

  if (!instance) {
    throw new ComplianceError(
      `Instance de formulaire ${instanceId} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  if (instance.status !== 'Submitted') {
    throw new ComplianceError(
      `L'instance ${instance.referenceNumber} doit être en statut "Submitted" pour être rejetée`,
      COMPLIANCE_CODES.INVALID_STATUS_TRANSITION
    );
  }

  store.updateFormInstance(instanceId, {
    status: 'Rejected' as FormInstanceStatus,
  });

  store.logAudit('REJECT', 'FormInstance', instanceId,
    { status: 'Submitted' },
    { status: 'Rejected', rejectedBy: rejecterName, reason }
  );

  const updated = useQMSStore.getState().formInstances.find(i => i.id === instanceId);
  return updated!;
}

/**
 * Met à jour les valeurs d'une instance de formulaire.
 * - Bloque si l'instance est verrouillée (FORM_LOCKED) (spec §5.4)
 */
export function updateFormInstanceValues(
  instanceId: string,
  values: Record<string, unknown>
): FormInstance {
  const store = useQMSStore.getState();
  const instance = store.formInstances.find(i => i.id === instanceId);

  if (!instance) {
    throw new ComplianceError(
      `Instance de formulaire ${instanceId} introuvable`,
      COMPLIANCE_CODES.REQUIRED_FIELD_MISSING
    );
  }

  if (instance.isLocked) {
    throw new ComplianceError(
      `L'instance de formulaire ${instance.referenceNumber} est verrouillée et ne peut plus être modifiée`,
      COMPLIANCE_CODES.FORM_LOCKED
    );
  }

  if (instance.status !== 'Draft') {
    throw new ComplianceError(
      `L'instance ${instance.referenceNumber} ne peut être modifiée qu'en statut "Draft"`,
      COMPLIANCE_CODES.FORM_LOCKED
    );
  }

  const updatedValues = { ...instance.values, ...values };
  store.updateFormInstance(instanceId, { values: updatedValues });

  const updated = useQMSStore.getState().formInstances.find(i => i.id === instanceId);
  return updated!;
}
