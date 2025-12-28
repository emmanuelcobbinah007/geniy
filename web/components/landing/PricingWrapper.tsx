"use client";

import dynamic from "next/dynamic";

const PricingClient = dynamic(
  () => import("@/components/landing/Pricing").then((mod) => mod.Pricing),
  { ssr: false }
);

export function PricingWrapper(props: any) {
  return <PricingClient {...props} />;
}
