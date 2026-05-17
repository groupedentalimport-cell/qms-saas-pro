// useOrgSettings.ts — Hook pour les paramètres d'organisation (spec §7.1)
// Fournit un accès simplifié aux paramètres OrgSettings, au secteur d'activité,
// aux normes applicables et aux modules actifs

import { useMemo } from 'react';
import { useOrganization } from '@/qms/contexts/OrganizationContext';
import type { OrgSettings, IndustryType } from '@/qms/types/qms';
import { STANDARDS_BY_INDUSTRY, CORE_MODULES, OPTIONAL_MODULES, DEFAULT_ORG_SETTINGS } from '@/qms/types/qms';

/**
 * Hook pour accéder aux paramètres d'organisation.
 * Retourne les OrgSettings ou les paramètres par défaut si non disponible.
 */
export function useOrgSettings(): OrgSettings {
  const { orgSettings } = useOrganization();
  return orgSettings || DEFAULT_ORG_SETTINGS;
}

/**
 * Hook pour obtenir le secteur d'activité de l'organisation.
 * Par défaut: 'medical_device'
 */
export function useIndustry(): IndustryType {
  const settings = useOrgSettings();
  return settings.industry_type || 'medical_device';
}

/**
 * Hook pour obtenir les normes applicables à l'organisation.
 * Si aucune norme n'est définie, utilise les normes par défaut du secteur.
 */
export function useApplicableStandards(): string[] {
  const settings = useOrgSettings();
  const industry = settings.industry_type || 'medical_device';
  return settings.applicable_standards || STANDARDS_BY_INDUSTRY[industry] || ['ISO 13485:2016'];
}

/**
 * Hook pour obtenir les modules actifs de l'organisation.
 * Les modules principaux sont toujours actifs.
 */
export function useActiveModules(): string[] {
  const settings = useOrgSettings();
  return settings.active_modules || [...CORE_MODULES];
}

/**
 * Hook pour vérifier si un module spécifique est actif.
 */
export function useIsModuleActive(moduleId: string): boolean {
  const activeModules = useActiveModules();
  return activeModules.includes(moduleId);
}

/**
 * Hook pour obtenir les modules recommandés pour le secteur d'activité.
 * Combine les modules principaux (toujours actifs) avec les optionnels recommandés.
 */
export function useRecommendedModules(): { core: readonly string[]; optional: readonly string[]; recommended: string[] } {
  const industry = useIndustry();

  const RECOMMENDED_BY_INDUSTRY: Record<IndustryType, string[]> = {
    medical_device: ['risks', 'hierarchy', 'change_control', 'deviations', 'oos_oot'],
    pharmaceutical: ['risks', 'batch_records', 'suppliers', 'change_control', 'deviations', 'oos_oot', 'forms'],
    biotech: ['risks', 'hierarchy', 'batch_records', 'suppliers', 'change_control', 'forms'],
    ivd: ['risks', 'hierarchy', 'change_control', 'deviations', 'oos_oot'],
    combination_product: ['risks', 'hierarchy', 'batch_records', 'suppliers', 'change_control', 'deviations', 'oos_oot', 'forms'],
  };

  return {
    core: CORE_MODULES,
    optional: OPTIONAL_MODULES,
    recommended: RECOMMENDED_BY_INDUSTRY[industry] || [],
  };
}

/**
 * Hook pour vérifier si le setup est complété.
 */
export function useIsSetupCompleted(): boolean {
  const settings = useOrgSettings();
  return settings.setup_completed === true;
}

/**
 * Hook pour obtenir les paramètres de notification.
 */
export function useNotificationSettings(): OrgSettings['notification_settings'] {
  const settings = useOrgSettings();
  return settings.notification_settings || {
    capa_overdue: true,
    ncr_overdue: true,
    document_expiry: true,
    training_overdue: true,
    audit_due: true,
  };
}
