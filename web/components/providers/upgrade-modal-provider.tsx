"use client";

import { UpgradeModal, useUpgradeModal } from "@/components/ui/upgrade-modal";

/**
 * Global provider component that renders the UpgradeModal.
 * Add this to your root layout to enable upgrade modals from anywhere.
 */
export function UpgradeModalProvider() {
  const { isOpen, close, feature, requiredTier, currentTier } = useUpgradeModal();

  return (
    <UpgradeModal
      isOpen={isOpen}
      onClose={close}
      feature={feature}
      requiredTier={requiredTier}
      currentTier={currentTier}
    />
  );
}
